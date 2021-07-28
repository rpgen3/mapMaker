export class DQMap {
    constructor(){
        this.info = {};
        this.define = new Map;
        this.layer = new Map;
    }
    setDefine(v){
        for(let i = v.first; i <= v.last; i++) this.define.set(i, v);
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
        this.layer.clear();
        return this;
    }
    make(){
        const {height, width} = this.info;
        return [...new Array(height)].map(() => [...new Array(width).fill(-1)]);
    }
    put(x, y, z, v = -1){
        if(!this.isOut(x, y, z) && this.data[z][y][x] !== v) this.data[z][y][x] = v;
    }
    isOut(x, y, z){
        const {width, height, depth} = this.info;
        return x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= depth;
    }
    get max(){
        return Math.max(...this.define.keys(), -1);
    }
    get list(){
        const a = [],
              last = this.max + 1;
        for(let i = 0; i < last; i++){
            const obj = this.define.get(i);
            if(obj) {
                a.push(obj);
                i = obj.last;
            }
        }
        return a;
    }
    input(str, factory = v => v){ // 文字列からマップデータを読み込む
        const [info, define, data] = ['info', 'define', 'data'].map(v => str.match(new RegExp(`#${v}[^#]+`, 'g'))?.[0]);
        if([info, define, data].some(v => !v)) throw new Error('DQMap needs #info, #define and #data');
        this.info = toArr(info).reduce((p, [k, v]) => (p[k] = toInt(v), p), {});
        this.define = new Map;
        for(const v of toArr2(toArr(define))) this.setDefine(factory(v));
        parse(this.init(), data);
        return this;
    }
    output(zArr = [...new Array(this.depth).keys()]){ // マップデータを文字列化
        const m = new Map,
              ar = [
                  Object.entries(this.info),
                  toStr(this.list)
              ].map(v => v.map(v => v.join(': ')).join('\n'));
        m.set('info', ar[0]);
        m.set('define', ar[1]);
        m.set('data', stringify(this, zArr));
        return [...m].map(([k,v]) => `#${k}\n${v}`).join('\n\n');
    }
}
const toArr = str => {
    const a = [];
    for(const line of str.split('\n')){
        const m = line.match(/^.+?:(?!\/\/)/)?.[0];
        if(m) a.push([m.slice(0, -1), line.slice(m.length)]);
        else if(a.length) a[a.length - 1][1] += line;
    }
    return a;
};
const toArr2 = arr => {
    const a = [];
    for(const [k, v] of arr){
        const keys = toInts(k);
        if(!keys) continue;
        const [first, last = first] = keys,
              [v0, v1] = v.split('['),
              o = a2o(v0.split(',').map(v => v.trim())),
              index = v1 && toInts(v1);
        if([1, 3].includes(o.type)) {
            if(!index) continue;
            o.index = index;
        }
        o.first = first;
        o.last = last;
        a.push(o);
    }
    return a;
};
const a2o = arg => {
    const type = toInt(arg[0]),
          o = {type},
          a = arg.slice(1),
          n = a.map(toInt);
    if([0, 1, 2, 3].includes(type)) o.url = a[0];
    if([2, 3].includes(type)) {
        o.frame = n[1];
        o.way = a[2].replace(/[^wasd]/g, '');
    }
    switch(type){
        case 1:
            o.width = n[1];
            o.height = n[2];
            break;
        case 3:
            o.width = n[3];
            o.height = n[4];
            break;
        case 8:
            o.rgba = a[0];
            break;
    }
    return o;
};
const toInts = str => str?.match(/[0-9]+/g)?.map(Number),
      toInt = str => toInts(str)?.[0];
const parse = (that, str) => {
    for(const v of str.split('$')){
        const lines = v.split('\n'),
              top = lines.shift(),
              z = toInt(top),
              s = top.split(':')[1]?.trim();
        if(s) that.layer.set(z, s);
        let y = 0;
        for(const line of lines){
            if(!line.includes(',')) continue;
            for(const [x,e] of line.split(',').entries()){
                const n = toInt(e);
                if(!Number.isNaN(n)) that.put(x, y, z, n);
            }
            y++;
        }
    }
};
const toStr = list => {
    const arr = [];
    for(const v of list) {
        const a = o2a(v),
              {first, last} = v,
              _k = first < last && `${first}-${last}`;
        if(a) arr.push([_k || first, a.join(', ')]);
    }
    return arr;
};
const o2a = o => {
    const {type} = o,
          a = [type];
    if([0, 1, 2, 3].includes(type)) a.push(o.url);
    if([2, 3].includes(type)) a.push(o.frame, o.way);
    if([1, 3].includes(type)) {
        if(!o.index.length) return;
        a.push(o.width, o.height, `[${o.index.join(', ')}]`);
    }
    if(type === 8) a.push(o.rgba);
    return a;
};
const stringify = (that, zArr) => {
    const {data, max, layer} = that,
          _max = max.toString().length,
          _z = [];
    for(const [i,z] of zArr.entries()) {
        const _y = [];
        for(const [j,y] of data[z].entries()) {
            const _x = [];
            for(const x of data[z][j]) {
                const s = x === -1 ? '' : x.toString();
                _x.push(' '.repeat(_max - s.length) + s);
            }
            _y.push(_x.join(','));
        }
        const s = layer.get(z)?.replace(/#$:/g, '');
        _z.push(`$${i}${s ? ': ' + s : ''}\n` + _y.join('\n'));
    }
    return _z.join('\n\n');
};
