(async()=>{
    const {importAll, importAllSettled, getScript} = await import('https://rpgen3.github.io/mylib/export/import.mjs');
    await getScript('https://rpgen3.github.io/lib/lib/jquery-3.5.1.min.js');
    const rpgen3 = await importAll([
        'input',
        'imgur',
        'strToImg'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    const html = $('body').css({
        'text-align': 'center',
        padding: '1em',
        'user-select': 'none'
    });
    const header = $('<div>').appendTo(html),
          body = $('<div>').appendTo(html),
          footer = $('<div>').appendTo(html);
    const sysImg = await new Promise.all([
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
                if(width === unit * 2) this.draw = new Anime(img).draw;
            }).catch(() => {
                this.img = sysImg[0];
            });
        }
        draw(ctx, x, y){
            ctx.drawImage(
                this.img,
                x, y, Sprite, Sprite
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
        draw(ctx, x, y){
            const {img, anime, direct} = this,
                  index = 'wdsa'.indexOf(direct),
                  xx = g_nowTime % anime < anime / 2 ? 0 : 1;
            ctx.drawImage(
                img,
                xx * unit, index * unit, unit, unit,
                x, y, Sprite, Sprite
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
        }
        goto(x, y){
            const {w, h} = this,
                  {width, height} = g_dqMap.info,
                  ww = width - w,
                  hh = height - h;
            this.x = x < 0 || ww < 0 ? 0 : x > ww ? ww : x;
            this.y = y < 0 || hh < 0 ? 0 : y > hh ? hh : y;
            return [this.x === x, this.y === y];
        }
    };
    const player = new class {
        constructor(){
            this.x = this.y = 0;
        }
        dressUp(id){
            this.id = id;
            imgurMap.set(id);
        }
        update(ctx){
            if(isKeyDown(['ArrowLeft','a'])) this.move(1, 0);
            else if(isKeyDown(['ArrowRight','d'])) this.move(-1, 0);
            else if(isKeyDown(['ArrowUp','w'])) this.move(0, -1);
            else if(isKeyDown(['ArrowDown','s'])) this.move(0, 1);
        }
        goto(x, y){
            const [isX, isY] = frame.goto(x, y);
            const {w, h} = frame,
                  {width, height} = g_dqMap.info,
                  ww = width - w,
                  hh = height - h;
        }
        move(x, y){
            this.goto(this.x + x, this.y + y);
        }
    };
    const rpgen4 = await importAllSettled([
        'isKeyDown',
        'Canvas',
        'DQMap',
        'layer'
    ].map(v => `https://rpgen3.github.io/game/export/${v}.mjs`));
    const {isKeyDown, layer} = rpgen4,
          cv = new rpgen4.Canvas(footer).set(0.9, 0.7),
          g_dqMap = new rpgen4.DQMap();
    layer.set({
        update: ctx => {
            if(!g_dqMap.data) return;
            const {info, define, data} = g_dqMap,
                  {width, height, depth} = info,
                  {x, y, w, h} = frame;
            for(let i = 0; i < depth; i++) for(let j = 0; j < h; j++) for(let k = 0; k < w; k++) imgurMap.get(define[data[i][j + y]?.[k + x]])?.draw(ctx, x, y);
        }
    });
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
            toString: () => `座標(${x},${y})`
        },
        size: 30,
        color: 'blue'
    });
})();
