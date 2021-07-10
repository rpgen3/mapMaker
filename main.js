(async()=>{
    let g_debug;
    const {importAll, importAllSettled, getScript} = await import('https://rpgen3.github.io/mylib/export/import.mjs');
    await getScript('https://rpgen3.github.io/lib/lib/jquery-3.5.1.min.js');
    const rpgen3 = await importAll([
        'input',
        'imgur',
        'strToImg'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    const html = $('body').empty().css({
        'text-align': 'center',
        padding: '1em',
        'user-select': 'none'
    });
    const header = $('<div>').appendTo(html),
          body = $('<div>').appendTo(html),
          footer = $('<div>').appendTo(html);
    const sysImg = await Promise.all([
        'aY2ef1p', // 404
        'oypcplE' // now loading
    ].map(id => rpgen3.imgur.load(id)));
    const unit = 16;
    let zoom = 3;
    class Sprite {
        constructor(id){
            this.img = sysImg[1];
            rpgen3.imgur.load(id).then(img => {
                this.img = img;
                const {width, height} = img;
                if(width === unit * 2) new Anime(this);
            }).catch(() => {
                this.img = sysImg[0];
            });
        }
        draw(ctx, x, y){
            ctx.drawImage(
                this.img,
                x * Sprite, y * Sprite, Sprite, Sprite
            );
        }
        static valueOf(){
            return unit * zoom;
        }
    }
    class Anime {
        constructor(that){
            that.anime = 500;
            that.direct = 'd';
            that.set = this.set;
            that.draw = this.draw;
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
            if(!g_dqMap.data) return;
            const {info, define, data} = g_dqMap,
                  {width, height, depth} = info,
                  [pivotW, pivotH] = this._pivotWH,
                  maxX = width - pivotW,
                  maxY = height - pivotH;
            const [_x, _xx] = this._switchF(player.nowX, pivotW, maxX, player.x),
                  [_y, _yy] = this._switchF(player.nowY, pivotH, maxY, player.y);
            this.x = _x;
            this.y = _y;
            const {x, y, w, h} = this;
            for(let i = 0; i < depth; i++) for(let j = -1; j <= h; j++) for(let k = -1; k <= w; k++) {
                imgurMap.get(define[data[i][j + y]?.[k + x]])?.draw(ctx, k + _xx, j + _yy);
            }
            g_debug = [_xx].join(' ');
        }
        _pivot(n){
            return (n / 2 | 0) + 1;
        }
        get _pivotWH(){
            return [this._pivot(this.w), this._pivot(this.h)];
        }
        _get3state(value, pivot, max){
            return value > pivot && value < max ? 0 : value <= pivot ? -1 : 1;
        }
        _switchP(value, pivot, max){
            switch(this._get3state(value, pivot, max)){
                case -1: return value;
                case 0: return pivot;
                case 1: return value - max - pivot;
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
            const {width, height} = g_dqMap.info,
                  [pivotW, pivotH] = this._pivotWH,
                  maxX = width - pivotW,
                  maxY = height - pivotH;
            return [this._switchP(x, pivotW, maxX), this._switchP(y, pivotH, maxY)];
        }
    };
    const player = new class {
        constructor(){
            this.x = this.y = this._x = this._y = this.nowX = this.nowY = 0;
            this.times = [200, 150, 100];
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
        speedUp(){
            if(g_nowTime - this.lastTime < 1000) return;
            this.lastTime = g_nowTime;
            this.timeIdx = (this.timeIdx + 1) % this.times.length;
        }
        update(ctx){
            const {x, y, _x, _y, time, _time} = this;
            if(isKeyDown(['z'])) setSprite(x, y);
            else if(isKeyDown(['x'])) deleteSprite(x, y);
            else if(isKeyDown(['f'])) this.speedUp();
            let rate = 0;
            if(!this._time){
                if(isKeyDown(['ArrowLeft','a'])) this.set('a').move(-1, 0);
                else if(isKeyDown(['ArrowRight','d'])) this.set('d').move(1, 0);
                else if(isKeyDown(['ArrowUp','w'])) this.set('w').move(0, -1);
                else if(isKeyDown(['ArrowDown','s'])) this.set('s').move(0, 1);
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
            const {width, height} = g_dqMap.info;
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
    };
    const z = 0;
    const now = '1XPXQAe';
    imgurMap.set(now, now);
    const setSprite = (x, y) => {
        g_dqMap.data[z][y][x] = now;
    };
    const deleteSprite = (x, y) => {
        g_dqMap.data[z][y][x] = null;
    };
    const rpgen4 = await importAllSettled([
        'isKeyDown',
        'Canvas',
        'DQMap',
        'layer'
    ].map(v => `https://rpgen3.github.io/game/export/${v}.mjs`));
    const {isKeyDown, layer} = rpgen4,
          cv = new rpgen4.Canvas(footer).set(0.9, 0.7),
          g_dqMap = new rpgen4.DQMap().set(30, 22, 3).init();
    g_dqMap.define = {[now]:now};
    window.g_dqMap = g_dqMap;
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
    update();
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
    new SimpleText({
        text: {
            toString: () => `座標(${player.x},${player.y})`
        },
        size: 30,
        color: 'blue'
    });
    new SimpleText({
        text: {
            toString: () => `debug=${g_debug}`
        },
        size: 30,
        color: 'blue'
    }).goto(0, 30);
})();
