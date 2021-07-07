(async()=>{
    const {importAll, importAllSettled, getScript} = await import('https://rpgen3.github.io/mylib/export/import.mjs');
    await getScript('https://rpgen3.github.io/lib/lib/jquery-3.5.1.min.js');
    const rpgen3 = await importAll([
        'input',
        'imgur',
        'strToImg'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    const undef = void 0;
    const html = $('body').css({
        'text-align': 'center',
        padding: '1em',
        'user-select': 'none'
    });
    const header = $('<div>').appendTo(html),
          body = $('<div>').appendTo(html),
          footer = $('<div>').appendTo(html);
    class Mover {
        constructor(id){
            this.x = this.y = 0;
            this.z = 0;
            rpgen3.imgur.load(id).then(img => {
                this.img = img;
                if(this.w !== undef && this.h !== undef) return;
                this.w = img.width;
                this.h = img.height;
            });
        }
        set z(v){
            if(this.delete) this.delete();
            this.delete = layer.set(this, v);
        }
        update(ctx){
            if(this.img) ctx.drawImage(this.img, this.x, this.y);
        }
        goto(x, y){
            this.x = x;
            this.y = y;
            return this;
        }
        move(x, y){
            this.x += x;
            this.y += y;
        }
    }
    class Anime extends Mover {
        constructor(...arg){
            super(...arg);
            const rate = 3;
            this.w = this.h = 16 * rate;
            this.anime = 500;
            this.direct = 'd';
        }
        update(ctx){
            if(!this.img || this.hide) return;
            const {img, x, y, w, anime, direct} = this,
                  index = 'wdsa'.indexOf(direct),
                  xx = g_nowTime % anime < anime / 2 ? 0 : 1,
                  unit = 16;
            ctx.drawImage(
                img,
                xx * unit, index * unit, unit, unit,
                x, y, w, w
            );
        }
        move(x, y){
            super.move(x, y);
            if(x < 0) this.direct = 'a';
            else if(x > 0) this.direct = 'd';
            else if(y < 0) this.direct = 'w';
            else if(y > 0) this.direct = 's';
        }
    }
    class Player extends Anime {
        update(ctx){
            if(!this.img) return;
            if(isKeyDown(['ArrowUp','z','w',' ',undef])) this.jump();
            if(isKeyDown(['ArrowLeft','a'])) this.move(-5,0);
            if(this.x < 0) {
                this.x = 0;
                this.wall();
            }
            if(isKeyDown(['ArrowRight','d'])) this.move(5,0);
            if(this.x + this.w > cv.w) {
                this.x = cv.w - this.w;
                this.wall();
            }
            this.hide = this._damage && g_nowTime % 200 < 100;
            super.update(ctx);
            this.updateQ();
        }
    }
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
    const rpgen4 = await importAllSettled([
        'isKeyDown',
        'Canvas',
        'layer'
    ].map(v => `https://rpgen3.github.io/game/export/${v}.mjs`));
    const {layer, isKeyDown} = rpgen4,
          cv = new rpgen4.Canvas(footer).set(0.9, 0.7),
          g_horizonY = {
              valueOf: () => cv.h * 0.9
          };
    let g_nowTime;
    const update = () => {
        g_nowTime = performance.now();
        cv.ctx.clearRect(0, 0, cv.w, cv.h);
        layer.forEach(v => v.update(cv.ctx));
        requestAnimationFrame(update);
    };
    update();
    new SimpleText({
        text: {
            toString: () => `HP：${tsukinose.HP}`
        },
        size: 30
    });
})();
