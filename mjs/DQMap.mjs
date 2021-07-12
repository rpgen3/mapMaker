import {BaseN} from 'https://rpgen3.github.io/mylib/export/BaseN.mjs';
const {encode, decode} = new BaseN('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
export class DQMap {
    constructor(){
        this.info = {};
        this.define = new Define;
    }
    set(width, height, depth){
        const {info} = this;
        info.width = width;
        info.height = height;
        info.depth = depth;
        return this;
    }
    init(){
        this.data = [...new Array(this.depth)].map(() => this.make());
        return this;
    }
    make(){
        return [...new Array(this.height)].map(() => [...new Array(this.width).fill(-1)]);
    }
    input(str){ // 文字列からマップデータを読み込む
        const ar = ['info', 'define', 'data'].map(v => str.match(new RegExp(`#${v}[^#]+`, 'g'))[0]),
              keys = ['width', 'height', 'depth'];
        this.info = toObj(ar[0], Number);
        const define = new Define;
        for(const [k,v] in Object.entries(toObj(ar[1]))) define.set(decode(k), v);
        this.define = define;
        this.data = parse(ar[2], define._a);
        return this;
    }
    output(char = ''){ // マップデータを文字列化
        const m = new Map,
              {info, define, data} = this,
              ar = [
                  Object.entries(info),
                  [...define].map(([k,v])=>[base62.encode(k),v])
              ].map(v => v.map(v => v.map(v => v.join(':')).join('\n')));
        m.set('info', ar[0]);
        m.set('define', ar[1]);
        m.set('data', stringify({...info, data, char, _b: define._b}));
        return [...m].map(([k,v]) => `#${k}\n${v}`).join('\n\n');
    }
}
class Define {
    constructor(){
        this._a = new Map; // str to int
        this._b = new Map; // int to str
        this._c = new Map; // int to id
    }
    set(int, id){
        this._c.set(int, id);
        const str = encode(int);
        this._a.set(str, int);
        this._b.set(int, str);
    }
    get(int){
        return this._c.get(int);
    }
    delete(int){
        this._c.delete(int);
        const str = this._b.get(int);
        this._a.delete(str);
        this._b.delete(int);
    }
    get next(){
        return Math.max(...this._c.keys(), -1) + 1;
    }
};
const nameRule = s => s.match(/[0-9A-Za-z]+/);
const toObj = (str, func = v => v) => {
    const obj = {};
    for(const line of str.split('\n')){
        const ar = [];
        for(const v of line.split(':')){
            const m = nameRule(v);
            if(m) ar.push(m[0]);
            else break;
        }
        if(ar.length === 2) obj[ar[0]] = func(ar[1]);
    }
    return obj;
};
const parse = (data, _a) => {
    const arZ = [];
    for(const v of data.split(/$[^$]+/g)){
        const arY = [];
        for(const line of v.split('\n')){
            if(!line.includes(',')) continue;
            const arX = [];
            for(const e of line.split(',')){
                const v = nameRule(e)?.[0];
                arX.push(_a.has(v) ? _a.get(v) : -1);
            }
            arY.push(arX);
        }
        arZ.push(arY);
    }
    return arZ;
};
const stringify = ({width, height, depth, data, char, _b}) => {
    const arZ = [];
    for(let z = 0; z < depth; z++){
        const arY = [];
        for(let y = 0; y < height; y++){
            const arX = [];
            for(let x = 0; x < width; x++){
                const v = data[z][y][x];
                arX.push(_b.has(v) ? _b.get(v) : char);
            }
            arY.push(arX.join(','));
        }
        arZ.push(`$${z}\n${arY.join('\n')}`);
    }
    return arZ.join('\n\n');
};
