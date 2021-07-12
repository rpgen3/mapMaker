export class DQMap {
    constructor(){
        this.info = {};
        this.define = {};
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
        return [...new Array(this.height)].map(() => [...new Array(this.width).fill(null)]);
    }
    input(str){ // 文字列からマップデータを読み込む
        const ar = ['info', 'define', 'data'].map(v => str.match(new RegExp(`#${v}[^#]+`, 'g'))[0]),
              keys = ['width', 'height', 'depth'];
        this.info = toObj(ar[0], Number);
        this.define = toObj(ar[1]);
        this.data = parse(ar[2], this.define);
        return this;
    }
    output(char = ''){ // マップデータを文字列化
        const m = new Map,
              {info, define, data} = this,
              ar = [info, define].map(v => Object.entries(v).map(v => v.map(v => v.join(':')).join('\n')));
        m.set('info', ar[0]);
        m.set('define', ar[1]);
        m.set('data', stringify({...info, data, define, char}));
        return [...m].map(([k,v]) => `#${k}\n${v}`).join('\n\n');
    }
}
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
const parse = (data, define) => {
    const arZ = [];
    for(const v of data.split(/$[^$]+/g)){
        const arY = [];
        for(const line of v.split('\n')){
            if(!line.includes(',')) continue;
            const arX = [];
            for(const e of line.split(',')){
                const v = nameRule(e)?.[0];
                arX.push(v in define ? v : null);
            }
            arY.push(arX);
        }
        arZ.push(arY);
    }
    return arZ;
};
const stringify = ({width, height, depth, data, define, char}) => {
    const arZ = [];
    for(let z = 0; z < depth; z++){
        const arY = [];
        for(let y = 0; y < height; y++){
            const arX = [];
            for(let x = 0; x < width; x++){
                const v = data[z][y][x];
                arX.push(v in define ? v : char);
            }
            arY.push(arX.join(','));
        }
        arZ.push(`$${z}\n${arY.join('\n')}`);
    }
    return arZ.join('\n\n');
};
