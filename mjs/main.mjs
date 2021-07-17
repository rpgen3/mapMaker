export {cv, dqMap, update, zMap, input, dMap, unitSize};
const input = {},
      zMap = new Map;
let g_debug;
const {importAll} = await import('https://rpgen3.github.io/mylib/export/import.mjs');
const rpgen3 = await importAll([
    'imgur',
    'strToImg'
].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
const sysImg = await Promise.all([
    'oypcplE', // now loading
    'aY2ef1p' // 404
].map(id => rpgen3.imgur.load(id)));
const unitSize = 48; // 1マスの大きさ
class Sprite {
    constructor({id}){
        this.img = sysImg[0];
        this.adjust(16, 16);
        this.promise = rpgen3.imgur.load(id).then(img => {
            this.img = img;
            this.adjust(img.width, img.height);
            this.isReady = true;
        }).catch(() => {
            this.img = sysImg[1];
        });
    }
    adjust(w, h){ // 位置調整
        const f = x => {
            const a = unitSize,
                  b = unitSize * x;
            return [a, b | 0, 0, unitSize - b >> 1];
        };
        if(w > h) [this.w, this.h, this.x, this.y] = f(h / w);
        else [this.h, this.w, this.y, this.x] = f(w / h);
    }
    draw(ctx, x, y){
        const {img, w, h} = this;
        ctx.drawImage(img, this.x + x * unitSize, this.y + y * unitSize, w, h);
    }
}
class SpriteSplit extends Sprite {
    constructor({id, width, height, index}){
        super({id}).promise.then(() => {
            if(!this.isReady) return;
            this.index = index;
            this.split(width, height);
            this.adjust(width, height);
            this._w = width;
            this._h = height;
        });
    }
    split(w, h){
        const {width, height} = this.img,
              maxX = width / w,
              maxY = height / h,
              ar = [];
        for(let i = 0; i < maxY; i++) for(let j = 0; j < maxX; j++) ar.push([j, i]);
        this.indexToXY = ar;
    }
    draw(ctx, x, y, {index}){
        if(!this.isReady) return super.draw(ctx, x, y);
        const [_x, _y] = this.indexToXY?.[index] || [0, 0],
              {img, _w, _h, w, h} = this;
        ctx.drawImage(
            img, _x * unitSize, _y * unitSize, _w, _h,
            this.x + x * unitSize, this.y + y * unitSize, w, h
        );
    }
}
class Anime extends Sprite {
    constructor({id, frame, way}){
        super({id}).promise.then(() => {
            if(!this.isReady) return;
            this.frame = frame;
            this.way = way;
            const w = this.img.width / frame | 0,
                  h = this.img.height / way.length | 0;
            this.adjust(w, h);
            this._w = w;
            this._h = h;
            this.anime = 1200;
        });
    }
    draw(ctx, x, y, {way}){
        if(!this.isReady) return super.draw(ctx, x, y);
        const {img, _w, _h, w, h, frame, anime} = this,
              _x = (g_nowTime % anime / anime * frame | 0) * _w,
              _y = this.way.indexOf(way) * _h;
        ctx.drawImage(
            img, _x * unitSize, _y * unitSize, _w, _h,
            this.x + x * unitSize, this.y + y * unitSize, w, h
        );
    }
}
class AnimeSplit extends SpriteSplit {
    constructor({id, frame, way, width, height, index}){
        super({id, width: width * frame, height: height * way.length, index}).promise.then(() => {
            if(!this.isReady) return;
            this.frame = frame;
            this.way = way;
            this.adjust(width, height);
            this._w = width;
            this._h = height;
            this.anime = 1200;
        });
    }
    draw(ctx, x, y, {way, index}){
        if(!this.isReady) return super.draw(ctx, x, y);
        const [_x, _y] = this.indexToXY?.[index] || [0, 0],
              {img, _w, _h, w, h, frame, anime} = this,
              _xx = _x + (g_nowTime % anime / anime * frame | 0) * _w,
              _yy = _y + this.way.indexOf(way) * _h;
        ctx.drawImage(
            img,
            _xx, _yy, _w, _h,
            this.x + x * unitSize, this.y + y * unitSize, w, h
        );
    }
}
const dMap = new class {
    constructor(){
        this.map = new Map;
    }
    get(k){
        return this.map.get(k);
    }
    has(k){
        return this.map.has(k);
    }
    delete(k){
        this.map.delete(k);
        return this;
    }
    clear(){
        this.map.clear();
        return this;
    }
    set(k, v){
        const {map, judge} = this,
              obj = new (judge(v))(v);
        map.set(k, obj);
        return obj;
    }
    judge(obj){
        const a = 'way' in obj,
              b = 'index' in obj;
        if(a && b) return AnimeSplit;
        else if(a) return Anime;
        else if(b) return SpriteSplit;
        else return Sprite;
    }
};
const frame = new class {
    constructor(){
        this.x = this.y = this._x = this._y = 0;
    }
    set(w, h){
        this.w = w;
        this.h = h;
        return this;
    }
    update(ctx){
        if(!dqMap.data) return;
        const {width, height, depth} = dqMap.info,
              [pivotW, pivotH] = this._pivotWH,
              maxX = width - pivotW,
              maxY = height - pivotH;
        const [_x, _xx] = this._switchF(player.nowX, pivotW, maxX, player.x),
              [_y, _yy] = this._switchF(player.nowY, pivotH, maxY, player.y);
        this.x = _x;
        this.y = _y;
        const {x, y, w, h} = this;
        let i = 0;
        for(const idx of zMap.get('order')) {
            if(!zMap.get(idx)) continue;
            for(let j = -1; j <= h; j++) for(let k = -1; k <= w; k++) this.draw({
                ctx,
                x: k + x,
                y: j + y,
                z: i,
                _x: k + _xx,
                _y: j + _yy
            });
            i++;
        }
    }
    draw({ctx, x, y, z, _x, _y}){
        if(dqMap.isOut(x, y, z)) return;
        const elm = dqMap.data[z][y][x];
        if(!elm) return;
        const {key, index, way} = elm;
        dMap.get(key)?.draw(ctx, _x, _y, {index, way});
    }
    _pivot(n){
        return (n / 2 | 0) + 1;
    }
    get _pivotWH(){
        return [this._pivot(this.w), this._pivot(this.h)];
    }
    _get3state(value, pivot, max){
        return max < pivot || value <= pivot ? -1 : value > pivot && value < max ? 0 : 1;
    }
    _switchP(value, pivot, max){
        switch(this._get3state(value, pivot, max)){
            case -1: return value;
            case 0: return pivot;
            case 1: return value - (max - pivot);
        }
    }
    _switchF(value, pivot, max, next){
        switch(this._get3state(value, pivot, max)){
            case -1: return [0, 0];
            case 0: {
                const v = next - value;
                return [value - pivot | 0, v === -1 ? 0 : v > 0 ? v - 1 : v];
            }
            case 1: return [max - pivot, 0];
        }
    }
    calcPlayerXY(x, y){
        const {width, height} = dqMap.info,
              [pivotW, pivotH] = this._pivotWH,
              maxX = width - pivotW,
              maxY = height - pivotH;
        return [this._switchP(x, pivotW, maxX), this._switchP(y, pivotH, maxY)];
    }
};
const player = new class {
    constructor(){
        this.x = this.y = this._x = this._y = this.nowX = this.nowY = 0;
        this.times = [200, 100, 50];
        this.timeIdx = 0;
        this.lastTime = 0;
        this._time = null;
        this.way = 's';
        this.obj = new Anime({id: 'fFrt63r', frame: 2, way: 'wdsa'});
    }
    set(way){
        this.way = way;
        return this;
    }
    update(ctx){
        const {x, y, _x, _y, time, _time} = this;
        if(isKeyDown(['z'])) this.put(input.v);
        else if(isKeyDown(['x'])) this.put();
        else if(isKeyDown(['f'])) this.speedUp();
        let rate = 0;
        if(!this._time){
            if(isKeyDown(['ArrowLeft'])) this.set('a').move(-1, 0);
            else if(isKeyDown(['ArrowRight'])) this.set('d').move(1, 0);
            else if(isKeyDown(['ArrowUp'])) this.set('w').move(0, -1);
            else if(isKeyDown(['ArrowDown'])) this.set('s').move(0, 1);
        }
        else {
            rate = 1 - (g_nowTime - _time) / this.times[this.timeIdx];
            if(rate <= 0) {
                rate = 0;
                this._time = null;
            }
        }
        this.nowX = x - (x - _x) * rate;
        this.nowY = y - (y - _y) * rate;
    }
    draw(ctx){
        const {obj, nowX, nowY, way} = this;
        obj.draw(ctx, ...frame.calcPlayerXY(nowX, nowY), {way});
    }
    goto(x, y){
        const {width, height} = dqMap.info;
        this.x = x < 0 ? 0 : x >= width ? width - 1 : x;
        this.y = y < 0 ? 0 : y >= height ? height - 1 : y;
    }
    move(x, y){
        if(this._time) return;
        this._time = g_nowTime;
        this._x = this.x;
        this._y = this.y;
        this.goto(this.x + x, this.y + y);
    }
    speedUp(){
        if(g_nowTime - this.lastTime < 300) return;
        this.lastTime = g_nowTime;
        this.timeIdx = (this.timeIdx + 1) % this.times.length;
        this.obj.anime = this.times[this.timeIdx] * 5;
    }
    put(v = null){
        const {z} = input;
        if(!zMap.get(z)) return;
        const {x, y} = this;
        dqMap.put(x, y, z, v);
    }
};
const rpgen4 = await importAll([
    'isKeyDown',
    'Canvas',
    'layer'
].map(v => `https://rpgen3.github.io/game/export/${v}.mjs`));
const {isKeyDown, layer} = rpgen4,
      cv = new rpgen4.Canvas(document.body).set(0.9, 0.9);
const rpgen5 = await importAll([
    'DQMap'
].map(v => `https://rpgen3.github.io/mapMaker/mjs/${v}.mjs`));
const dqMap = new rpgen5.DQMap();
layer.set(player);
layer.set(frame.set(cv.w / unitSize | 0, cv.h / unitSize | 0));
layer.set({update: ctx => player.draw(ctx)});
let g_nowTime;
const update = () => {
    g_nowTime = performance.now();
    const {ctx, w, h} = cv;
    ctx.clearRect(0, 0, w, h);
    layer.forEach(v => v.update(ctx));
    requestAnimationFrame(update);
};
class SimpleText {
    constructor({text = '', color = 'black', size = 16}){
        this.x = this.y = 0;
        this.text = text;
        this.color = color;
        this.size = size;
        layer.set(this, 999);
    }
    update(ctx){
        const {x, y, text, color, size} = this;
        ctx.fillStyle = color;
        ctx.font = `bold ${size}px 'ＭＳ ゴシック'`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(text, x, y);
    }
    goto(x, y){
        this.x = x;
        this.y = y;
        return this;
    }
}
const setText = new class {
    constructor(){
        this.cnt = 0;
        this.half = unitSize >> 1;
    }
    main(toString){
        return new SimpleText({
            text: {toString},
            size: this.half,
            color: 'blue'
        }).goto(0, this.half * 1.5 * this.cnt++ | 0);
    }
};
setText.main(() => `座標(${player.x},${player.y})`);
setText.main(() => `[F]${player.times[0]/player.times[player.timeIdx]}倍速`);
setText.main(() => `スペースキーでメニューを開く`);
setText.main(() => `debug=${g_debug}`);
