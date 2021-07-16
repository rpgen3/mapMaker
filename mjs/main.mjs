(async()=>{
    //export {cv, dqMap, update, zMap, imgurMap, input};
    const input = {},
          zMap = new Map;
    let g_debug;
    const {importAll} = await import('https://rpgen3.github.io/mylib/export/import.mjs');
    const rpgen3 = await importAll([
        'imgur',
        'strToImg'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    const sysImg = await Promise.all([
        'aY2ef1p', // 404
        'oypcplE' // now loading
    ].map(id => rpgen3.imgur.load(id)));
    const unitSize = 48; // 1マスの大きさ
    class Sprite {
        constructor(id, width, height = width, index){
            this.img = sysImg[1];
            this.adjust(16, 16);
            this.promise = rpgen3.imgur.load(id).then(img => {
                this.img = img;
                let [_w, _h] = [img.width, img.height];
                if(index) {
                    this.index = index;
                    [_w, _h] = [width, height];
                    this.split(_w, _h);
                }
                this.adjust(_w, _h);
            }).catch(() => {
                this.img = sysImg[0];
            });
        }
        adjust(_w, _h){ // 位置調整
            [this._w, this._h] = [_w, _h];
            const f = x => {
                const a = unitSize,
                      b = unitSize * x;
                return [a, b | 0, 0, unitSize - b >> 1];
            };
            if(_w > _h) [this.w, this.h, this.x, this.y] = f(_h / _w);
            else [this.h, this.w, this.y, this.x] = f(_w / _h);
        }
        split(_w, _h){
            const {width, height} = this.img,
                  map = new Map;
            // 11
        }
        draw(ctx, x, y, i){
            let _x = 0,
                _y = 0;
            if(this.index) [_x, _y] = this.a
            ctx.draw(
                ctx, _x, _y, this._w, this._h,
                this.x, this.y, this.w, this.h
            );
        }
    }
    class Anime extends Sprite {
        constructor(id){
            super(id);
            this.anime = 1000;
            this.direct = 's';
        }
        set(char){
            this.direct = char;
        }
        draw(ctx, x, y){
            const {img, anime, direct} = this,
                  index = 'wdsa'.indexOf(direct),
                  xx = g_nowTime % anime < anime / 2 ? 0 : 1;
            ctx.drawImage(
                img,
                xx * unit, index * unit, unit, unit,
                x * Sprite, y * Sprite, Sprite, Sprite
            );
        }
    }
    const imgurMap = new class {
        constructor(){
            this.m = new Map;
        }
        set(id){
            if(!this.m.has(id)) this.m.set(id, new Sprite(id));
            return this.m.get(id);
        }
        get(id){
            return this.m.get(id);
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
            const {info, define, data} = dqMap,
                  {width, height, depth} = info,
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
                for(let j = -1; j <= h; j++) for(let k = -1; k <= w; k++) {
                    imgurMap.get(define.get(data[i]?.[j + y]?.[k + x]))?.draw(ctx, k + _xx, j + _yy);
                }
                i++;
            }
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
        }
        dressUp(id){
            this.id = id;
            imgurMap.set(id);
            return this;
        }
        set(char){
            imgurMap.get(this.id).set(char);
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
            imgurMap.get(this.id).draw(ctx, ...frame.calcPlayerXY(this.nowX, this.nowY));
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
            imgurMap.get(this.id).anime = this.times[this.timeIdx] * 5;
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
    layer.set(player.dressUp('fFrt63r'));
    layer.set(frame.set(cv.w / Sprite | 0, cv.h / Sprite | 0));
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
        }
        main(toString){
            return new SimpleText({
                text: {toString},
                size: unit,
                color: 'blue'
            }).goto(0, unit * 1.5 * this.cnt++);
        }
    };
    setText.main(() => `座標(${player.x},${player.y})`);
    setText.main(() => `[F]${player.times[0]/player.times[player.timeIdx]}倍速`);
    setText.main(() => `スペースキーでメニューを開く`);
    setText.main(() => `debug=${g_debug}`);
})();
