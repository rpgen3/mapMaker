export {cv, dqMap, update, zMap, input, factory, unitSize, player, scale};
const unitSize = 48,
      input = {y: 6, z: 0, k: -1},
      zMap = new Map;
let g_debug;
const {importAll} = await import('https://rpgen3.github.io/mylib/export/import.mjs');
const rpgen3 = await importAll([
    'str2img',
    'url'
].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
const loadImg = url => new Promise((resolve, reject) => {
    const img = new Image;
    img.onload = () => resolve(img);
    img.onerror = reject;
    const _url = url.includes('://') ? url : `https://i.imgur.com/${url}.png`;
    if(rpgen3.getDomain(_url)[1] === 'imgur') img.crossOrigin = 'anonymous';
    img.src = _url;
});
class Sprite {
    constructor({url}){
        this.url = url;
        this.promise = loadImg(url).then(img => {
            this.img = img;
            this.adjust(img.width, img.height);
            this.isReady = true;
        });
    }
    adjust(width, height){ // 位置調整
        [this.width, this.height] = [width, height];
        let w, h, x, y;
        if(width > unitSize && height > unitSize){
            [w, h] = [width, height];
            y = unitSize - height;
            x = (unitSize - w) / 2;
        }
        else {
            const f = (w, h) => [unitSize, unitSize * (h / w)];
            if(width < height) {
                [w, h] = f(width, height);
                x = 0;
                y = unitSize - h;
            }
            else {
                [h, w] = f(height, width);
                y = 0;
                x = (unitSize - w) / 2;
            }
        }
        [this.w, this.h, this.x, this.y] = [w, h, x, y].map(Math.floor);
    }
    draw(ctx, x, y){
        if(!this.isReady) return s404.draw(ctx, x, y);
        const {img, w, h} = this;
        ctx.drawImage(img, this.x + x * unitSize, this.y + y * unitSize, w, h);
    }
}
const s404 = new Sprite({url: 'aY2ef1p'});
await s404.promise;
class SpriteSplit extends Sprite {
    constructor({url, width, height, index, first}){
        super({url}).promise.then(() => {
            if(!this.isReady) return;
            this.index = index;
            this.first = first;
            this.adjust(width, height);
            this.indexToXY = SpriteSplit.split(this.img, width, height);
        });
    }
    static split(img, w, h){
        const {width, height} = img,
              maxX = width / w,
              maxY = height / h,
              a = [];
        for(let i = 0; i < maxY; i++) for(let j = 0; j < maxX; j++) a.push([j, i]);
        return a;
    }
    draw(ctx, x, y, key){
        if(!this.isReady) return s404.draw(ctx, x, y);
        const index = key - this.first;
        if(!this.index.includes(index)) return s404.draw(ctx, x, y);
        const [_x, _y] = this.indexToXY[index] || [0, 0],
              {img, width, height, w, h} = this;
        ctx.drawImage(
            img, _x * width, _y * height, width, height,
            this.x + x * unitSize, this.y + y * unitSize, w, h
        );
    }
}
class Anime extends Sprite {
    constructor({url, frame, way, first}){
        super({url}).promise.then(() => {
            if(!this.isReady) return;
            this.frame = frame;
            this.way = way;
            this.first = first;
            const w = this.img.width / frame | 0,
                  h = this.img.height / way.length | 0;
            this.adjust(w, h);
            this.anime = 1200;
            this.stop(false);
            if(frame === 3) this.goAndBack = true;
        });
    }
    stop(bool = true){
        this._stop = bool ? true : this.frame < 2;
    }
    calcFrame(){
        if(this._stop) return 0;
        const {frame, anime} = this;
        let now = g_nowTime % anime;
        if(this.goAndBack){
            const half = anime / 2;
            now = (half - Math.abs(now - half)) * 2;
        }
        return now / anime * frame | 0;
    }
    draw(ctx, x, y, key, diff = 0){
        if(!this.isReady) return s404.draw(ctx, x, y);
        const {img, width, height, w, h} = this,
              _x = width * this.calcFrame(),
              _y = height * (key - this.first);
        ctx.drawImage(
            img, _x, _y, width, height,
            this.x + x * unitSize, this.y + y * unitSize - diff, w, h
        );
    }
    getKey(way = this.way[0]){ // 引数の方向になったキーを返す
        const idx = this.way.indexOf(way);
        return idx === -1 ? null : idx + this.first;
    }
}
class AnimeSplit extends Anime {
    constructor({url, frame, way, width, height, index, first}){
        super({url, frame, way, first}).promise.then(() => {
            if(!this.isReady) return;
            this.index = index;
            this.adjust(width, height);
            this.indexToXY = SpriteSplit.split(this.img, width * frame, height * way.length);
        });
    }
    draw(ctx, x, y, key, diff = 0){
        if(!this.isReady) return s404.draw(ctx, x, y);
        const index = this.getIndex(key);
        if(!this.index.includes(index)) return s404.draw(ctx, x, y);
        const first = this.getFirst(key),
              [_x, _y] = this.indexToXY[index] || [0, 0],
              {img, width, height, w, h} = this,
              _xx = width * (_x * this.frame + this.calcFrame()),
              {length} = this.way,
              _yy = height * (_y * length + (key - first) % length);
        ctx.drawImage(
            img,
            _xx, _yy, width, height,
            this.x + x * unitSize, this.y + y * unitSize - diff, w, h
        );
    }
    getKey(way, key){ // 引数の方向になったキーを返す
        const res = super.getKey(way);
        return res === -1 ? null : res + this.getIndex(key) * this.way.length;
    }
    getIndex(key){ // キーの値から所属番号を取得
        const {way, first} = this;
        return (key - first) / way.length | 0;
    }
}
const factory = v => new ([Sprite, SpriteSplit, Anime, AnimeSplit][v.type])(v);
const frame = new class {
    constructor(){
        this.x = this.y = this._x = this._y = 0;
    }
    set(w, h){
        this.w = w | 0;
        this.h = h | 0;
        return this;
    }
    update(ctx){
        if(!dqMap.data) return;
        const {w, h} = this,
              {width, height} = dqMap.info;
        [this.x, this._x] = this._switchF(player.nowX, w, width, player.x);
        [this.y, this._y] = this._switchF(player.nowY, h, height, player.y);
        const {x, y, _x, _y} = this,
              w2 = w + 2,
              h2 = h + 2,
              zArr = zMap.get('order').filter(v => zMap.get(v));
        for(const z of zArr) for(let j = -1; j < h2; j++) for(let k = -1; k < w2; k++) this.draw({
            ctx,
            x: k + x,
            y: j + y,
            z,
            _x: k + _x,
            _y: j + _y
        });
    }
    draw({ctx, x, y, z, _x, _y}){
        if(dqMap.isOut(x, y, z)) return;
        const key = dqMap.data[z][y][x];
        dqMap.define.get(key)?.draw(ctx, _x, _y, key, input.y);
    }
    _f(w, width){
        const pivot = w >> 1;
        return [pivot, width - pivot - 1];
    }
    _get3state(x, pivot, max){
        return max < pivot || x <= pivot ? -1 : x < max ? 0 : 1;
    }
    _switchF(x, w, width, next){
        const [pivot, max] = this._f(w, width);
        switch(this._get3state(x, pivot, max)){
            case -1: return [0, 0];
            case 0: {
                const v = next - x;
                return [x - pivot | 0, v === -1 ? 0 : v > 0 ? v - 1 : v];
            }
            case 1: return [max - pivot, 0];
        }
    }
    _switchP(x, w, width){
        const [pivot, max] = this._f(w, width);
        switch(this._get3state(x, pivot, max)){
            case -1: return x;
            case 0: return pivot;
            case 1: return x - (max - pivot);
        }
    }
    calcPlayerXY(x, y){
        const {w, h} = this,
              {width, height} = dqMap.info;
        return [
            this._switchP(x, w, width),
            this._switchP(y, h, height)
        ];
    }
};
const player = new class {
    constructor(){
        this.x = this.y = this._x = this._y = this.nowX = this.nowY = 0;
        this.times = [200, 100, 50];
        this.timeIdx = 0;
        this.lastTime = 0;
        this._time = null;
        this.costume = this.default = new Anime({url: 'fFrt63r', frame: 2, way: 'wdsa', first: 0});
        this.costume.promise(() => {
            this.key = this.getKey('s');
        });
    }
    set(way){
        const {type} = this.costume;
        if(type === 2 || type === 3) this.key = this.getKey(way, this.key);
        return this;
    }
    update(ctx){
        const {x, y, _x, _y, time, _time} = this;
        if(isKeyDown(['z'])) this.put(input.k);
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
    dressUp(key){
        [this.costume, this.key] = dqMap.define.has(key) ? [
            dqMap.define.get(key), key
        ] : [
            this.default, 0
        ];
    }
    draw(ctx){
        const {nowX, nowY} = this;
        this.costume.draw?.(ctx, ...frame.calcPlayerXY(nowX, nowY), this.key, input.y);
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
        this.default.anime = this.times[this.timeIdx] * 6;
    }
    put(v){
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
layer.set(frame.set(cv.w / unitSize, cv.h / unitSize));
layer.set({update: ctx => player.draw(ctx)});
let g_nowTime;
const update = () => {
    g_nowTime = performance.now();
    const {ctx, w, h} = cv;
    ctx.clearRect(0, 0, w, h);
    layer.forEach(v => v.update(ctx));
    requestAnimationFrame(update);
};
const scale = {
    update(ctx){
        if(this.hide) return;
        const {w, h, _x, _y} = frame,
              max = Math.max(w, h),
              _w = w * unitSize,
              _h = h * unitSize,
              x = _x * unitSize,
              y = _y * unitSize;
        ctx.beginPath();
        for(let i = -1; i <= max; i++){
            const _i = i * unitSize,
                  a = _i + x,
                  b = _i + y;
            if(i < w + 1) ctx.moveTo(a, 0), ctx.lineTo(a, _h);
            if(i < h + 1) ctx.moveTo(0, b), ctx.lineTo(_w, b);
        }
        ctx.stroke();
    }
};
layer.set(scale);
class SimpleText {
    constructor({text = '', color = 'black', size = 16}){
        this.x = this.y = 0;
        this.text = text;
        this.color = color;
        this.size = size;
        layer.set(this);
    }
    update(ctx){
        const {x, y, text, color, size} = this;
        ctx.fillStyle = color;
        ctx.font = `bold ${size}px 'MS ゴシック'`;
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
        this.size = unitSize / 3;
    }
    main(toString){
        return new SimpleText({
            text: {toString},
            size: this.size,
            color: 'blue'
        }).goto(0, cv.h - this.size * 1.5 * ++this.cnt | 0);
    }
};
setText.main(() => `座標(${player.x},${player.y})`);
setText.main(() => `[F]${player.times[0] / player.times[player.timeIdx]}倍速`);
setText.main(() => `[Z]設置 [X]削除`);
setText.main(() => `[M]メニューを開く`);
setText.main(() => g_debug);
