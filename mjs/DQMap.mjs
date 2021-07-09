class DQMap {
    set(width, height, depth){
        this.width = width;
        this.height = height;
        this.depth = depth;
    }
    load(str){ // 文字列から読み込む
        const ar = ['info', 'define', 'data'].map(v => str.match(new RegExp(`#${v}[^#]+`, 'g'))[0]),
              obj = toObj(ar[0]);
        for(const k in obj) obj[k] = Number(obj[k]);
        this.info = obj;
        this.define = toObj(ar[1]);
        this.data = parseData(ar[2], this.define);
    }
    output(){ // マップデータを文字列化
        const m = new Map,
              {info, define, data} = this,
              ar = [info, define].map(v => Object.entries(v).map(v => v.map(v => v.join(':')).join('\n')));
        m.set('info', ar[0]);
        m.set('define', ar[1]);
        const {width, height, depth} = info,
              arZ = [];
        for(let z = 0; z < depth; z++){
            const arY = [];
            for(let y = 0; y < height; y++){
                const arX = [];
                for(let x = 0; x < width; x++){
                    const v = data[z][y][x];
                    arX.push(v in define ? v : '');
                }
                arY.push(arX.join(','));
            }
            arZ.push(`$${z}\n${arY.join('\n')}`);
        }
        m.set('data', arZ.join('\n\n'));
        return [...m].map(([k,v]) => `#${k}\n${v}`).join('\n\n');
    }
}
const nameRule = s => s.match(/[0-9A-Za-z]+/);
const toObj = str => {
    const obj = {};
    for(const line of str.split('\n')){
        const ar = [];
        for(const v of line.split(':')){
            const m = nameRule(v);
            if(m) ar.push(m[0]);
            else break;
        }
        if(ar.length === 2) obj[ar[0]] = ar[1];
    }
    return obj;
};
const parseData = (data, define) => {
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
