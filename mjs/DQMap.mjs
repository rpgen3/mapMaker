export class DQMap {
    constructor(){
        this.info = {};
        this.define = new Map;
    }
    set(width, height, depth){
        const {info} = this;
        info.width = width;
        info.height = height;
        info.depth = depth;
        return this;
    }
    init(){
        const {depth} = this.info;
        this.data = [...new Array(depth)].map(() => this.make());
        return this;
    }
    make(){
        const {height, width} = this.info;
        return [...new Array(height)].map(() => [...new Array(width).fill(null)]);
    }
    put(x, y, z, v = null){
        if(this.isOut(x, y, z)) return;
        const {define, data} = this,
              a = data[z][y],
              putNull = () => isEqual(a[x], null) || (a[x] = null);
        if(v === null) return putNull();
        const {key, index, way} = v;
        if(!define.has(key)) return putNull();
        const obj = define.get(key),
              elm = {key};
        if('index' in obj) {
            if(obj.index.includes(index)) elm.index = index;
            else return putNull();
        }
        if('way' in obj){
            if(obj.way.includes(way)) elm.way = way;
            else return putNull();
        }
        if(!isEqual(a[x], elm)) a[x] = elm;
    }
    isOut(x, y, z){
        const {width, height, depth} = this.info;
        return x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= depth;
    }
    get next(){
        return Math.max(...this.define.keys(), -1) + 1;
    }
    input(str){ // 文字列からマップデータを読み込む
        const [info, define, data] = ['info', 'define', 'data'].map(v => str.match(new RegExp(`#${v}[^#]+`, 'g'))?.[0]);
        if([info, define, data].some(v => !v)) throw new Error('DQMap needs #info, #define and #data');
        this.info = toArr(info).reduce((p, [k, v]) => (p[k] = Number(v), p), {});
        this.define = toMap(toArr(define));
        this.data = parse(data, this.define);
        return this;
    }
    output(zArr = [...new Array(this.depth).keys()]){ // マップデータを文字列化
        const m = new Map,
              {info, define, data} = this,
              ar = [
                  Object.entries(info),
                  toStr(define)
              ].map(v => v.map(v => v.join(': ')).join('\n'));
        m.set('info', ar[0]);
        m.set('define', ar[1]);
        m.set('data', stringify({...info, define, data, zArr}));
        return [...m].map(([k,v]) => `#${k}\n${v}`).join('\n\n');
    }
}
const isEqual = (a, b) => {
    if(a === b) return true; // null === null
    else if(a === null || b === null) return false;
    else if(a.key !== b.key) return false;
    else if('way' in a && a.way !== b.way) return false;
    else if('index' in a && a.index !== b.index) return false;
    else return true;
};
const toArr = str => {
    const a = [];
    for(const line of str.split('\n')){
        const m = line.match(/^[0-9A-Za-z]+:/)?.[0];
        if(m) a.push([m.slice(0, -1), line.slice(m.length)]);
    }
    return a;
};
const toMap = arr => {
    const map = new Map;
    for(const [k, v] of arr){
        if(/[^0-9]/.test(k)) continue;
        const key = Number(k);
        if(map.has(key)) throw new Error(`#define has same keys of ${key}`);
        const [v0, v1] = v.split('['),
              index = [];
        if(v1) for(const v of v1.split(',')) {
            const n = toInt(v);
            if(!Number.isNaN(n)) index.push(n);
        }
        const arg = v0.split(',');
        let i = 0;
        const next = () => arg[i++],
              obj = {};
        obj.id = next().match(/[0-9A-Za-z]+/)?.[0];
        if(/[wasd]/.test(arg[2])) {
            obj.frame = toInt(next());
            obj.way = next().replace(/[^wasd]/g, '')
        }
        if(index.length) {
            obj.width = toInt(next());
            const height = toInt(next());
            if(!Number.isNaN(height)) obj.height = height;
            obj.index = index;
        }
        map.set(key, obj);
    }
    return map;
};
const toInt = str => Number(str?.match(/[0-9]+/)?.[0]);
const parse = (data, define) => {
    const arZ = [];
    for(const v of data.split(/$[^$]+/g)){
        const arY = [];
        for(const line of v.split('\n')){
            if(!line.includes(',')) continue;
            const arX = [];
            for(const e of line.split(',')){
                const m = e.match(/[0-9]+/g)?.map(toInt),
                      key = m?.[0];
                if(define.has(key)) {
                    const elm = {key},
                          obj = define.get(key);
                    if('way' in obj) {
                        const way = e.match(/[wasd]/)?.[0];
                        if(way) elm.way = way;
                    }
                    if('index' in obj) elm.index = m[1];
                    arX.push(elm);
                }
                else arX.push(null);
            }
            arY.push(arX);
        }
        arZ.push(arY);
    }
    return arZ;
};
const toStr = map => {
    const a = [];
    for(const [k,v] of map){
        const ar = [],
              {frame, way, width, height, index} = v;
        if('way' in v){
            ar.push(frame);
            ar.push(way);
        }
        if('index' in v){
            if(!index.length) continue;
            ar.push(width);
            if(height) ar.push(height);
            ar.push('[' + index.join(', ') + ']');
        }
        a.push([k, ar.join(', ')]);
    }
    
};
const stringify = ({width, height, depth, define, data, zArr}) => {
    let max = 0;
    const arZ = [];
    for(const z of zArr){
        const arY = [];
        for(let y = 0; y < height; y++){
            const arX = [];
            for(let x = 0; x < width; x++){
                const elm = data[z][y][x];
                const v = (()=>{
                    if(!elm) return;
                    const {key, index, way} = elm,
                          obj = define.get(key);
                    if(!obj) return;
                    let str = key;
                    if('index' in obj) {
                        if(!obj.index.includes(index)) return;
                        str += '-' + index;
                    }
                    if('way' in obj) str += way;
                    if(max < str.length) max = str.length;
                    return str;
                })();
                arX.push(v ? v : '');
            }
            arY.push(arX);
        }
        arZ.push(arY);
    }
    return arZ.map((z, i) => `$${i}\n` + z.map(y => y.map(x => ' '.repeat(max - x.length) + x).join(',')).join('\n')).join('\n\n');
};
