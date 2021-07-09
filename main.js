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
                if(width === unit * 2) {
                    const anime = new Anime(img);
                    this.set= (...a) => anime.set(...a);
                    this.draw = (...a) => anime.draw(...a);
                }
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
        constructor(img){
            this.img = img;
            this.anime = 500;
            this.direct = 'd';
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
                x * Sprite, y * Sprite, +Sprite, +Sprite
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
            this.x = this.y = 0;
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
                  {x, y, w, h} = this,
                  _w = (w % 2 | 0) - 1,
                  _h = (h % 2 | 0) - 1,
                  {subX, subY, nowX, nowY} = player,
                  _x = nowX - _w,
                  _y = nowY - _h,
                  _ww = width - w - 1,
                  _hh = height - h - 1,
                  _xx = (_x < 0 ? 0 : _x > _ww ? _ww : _x) | 0,
                  _yy = (_y < 0 ? 0 : _y > _hh ? _hh : _y) | 0;
            for(let i = 0; i < depth; i++) for(let j = -1; j <= h; j++) for(let k = -1; k <= w; k++) {
                imgurMap.get(define[data[i][j]?.[k]])?.draw(ctx, k + subX, j + subY);
            }
            g_debug = subX;
        }
    };
    const player = new class {
        constructor(){
            this.x = this.y = this._x = this._y = this.subX = this.subY = this.nowX = this.nowY = 0;
            this.time = 300;
            this._time = null;
        }
        dressUp(id){
            this.id = id;
            imgurMap.set(id);
            return this;
        }
        update(ctx){
            if(isKeyDown(['ArrowLeft','a'])) {
                this.move(-1, 0);
                imgurMap.get(this.id).set('a');
            }
            else if(isKeyDown(['ArrowRight','d'])) {
                this.move(1, 0);
                imgurMap.get(this.id).set('d');
            }
            else if(isKeyDown(['ArrowUp','w'])) {
                this.move(0, -1);
                imgurMap.get(this.id).set('w');
            }
            else if(isKeyDown(['ArrowDown','s'])) {
                this.move(0, 1);
                imgurMap.get(this.id).set('s');
            }
            const {x, y, _x, _y, time, _time} = this;
            let rate = 1;
            if(this._time){
                rate = 1 - (g_nowTime - _time) / this.time;
                if(rate <= 0) {
                    rate = 0;
                    this._time = null;
                }
            }
            this.nowX = x - (x - _x) * rate;
            this.nowY = y - (y - _y) * rate;
            this.subX = x - this.nowX;
            this.subY = y - this.nowY;
            imgurMap.get(this.id).draw(ctx, this.nowX, this.nowY);
            if(isKeyDown(['z'])) setSprite(x, y);
            else if(isKeyDown(['x'])) deleteSprite(x, y);
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
    layer.set(frame.set(15, 11));
    layer.set(player.dressUp('fFrt63r'));
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
