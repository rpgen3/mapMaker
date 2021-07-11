(async()=>{
    var $ = 1;
    const {importAll, importAllSettled, getScript} = await import('https://rpgen3.github.io/mylib/export/import.mjs');
    await Promise.all([
        'https://code.jquery.com/git/jquery-git.slim.min.js',
        'https://code.jquery.com/ui/1.12.1/jquery-ui.min.js'
    ].map(getScript));
    const html = $('body').empty().css({
        'text-align': 'center',
        padding: '1em',
        'user-select': 'none'
    });
    const header = $('<div>').appendTo(html),
          body = $('<div>').appendTo(html),
          footer = $('<div>').appendTo(html);
    const rpgen3 = await importAll([
        'input',
        'baseN',
        'imgur',
        'url'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    const rpgen5 = await importAll([
        'Jsframe',
        'main'
    ].map(v => `https://rpgen3.github.io/mapMaker/mjs/${v}.mjs`));
    const {Jsframe, cv, dqMap, update, zMap, imgurMap} = rpgen5;
    const init = new class {
        constructor(){
            this.cv = $(cv.ctx.canvas);
            $(this.cv).hide();
        }
        main(){
            zMap.clear();
            for(let i = 0; i < dqMap.info.depth; i++) zMap.set(i, true);
            zMap.set('order', [...zMap.keys()]);
            if(this.flag) return;
            this.flag = true;
            $('body').empty();
            $(this.cv).show().appendTo('body');
            update();
        }
    };
    $('<h1>').appendTo(header).text('ドラクエ風マップ作成ツール');
    $('<button>').appendTo(body).text('新規作成').on('click', () => openWindowInit());
    $('<button>').appendTo(body).text('読み込み').on('click', () => openWindowLoad());
    const Win = new class {
        constructor(){
            this.arr = [];
        }
        make(title){
            const win = new rpgen5.Jsframe(title);
            this.arr.push(win);
            return win;
        }
        delete(){
            const {arr} = this;
            while(arr.length) arr.pop().delete();
        }
    };
    const addInputNum = (parent, label, value) => {
        const a = rpgen3.addInputStr(parent,{
            label, value, save: true
        });
        a.elm.on('change', () => a(a().replace(/[^0-9]/g,'')));
        return () => Number(a());
    };
    const openWindowInit = () => {
        const win = Win.make('テキストファイルから読み込む'),
              {elm} = win,
              w = addInputNum(elm, 'width', 50),
              h = addInputNum(elm, 'height', 50),
              d = addInputNum(elm, 'depth', 3);
        $('<button>').appendTo(elm).text('マップを新規作成').on('click', () => makeNewMap(w(), h(), d()));
    };
    const makeNewMap = (w, h, d) => {
        Win.delete();
        dqMap.set(w, h, d).init();
        init.main();
    };
    const openWindowLoad = () => {
        const win = Win.make('テキストファイルから読み込む'),
              {elm} = win;
        $('<input>').appendTo(elm).prop({
            type: 'file',
            accept: '.txt'
        }).on('change', async ({target}) => {
            loadFile(await target.files[0].text());
        });
        const input = rpgen3.addInputStr(elm,{
            label: '入力欄から',
            textarea: true
        });
        $('<button>').appendTo(elm).text('読み込む').on('click', () => loadFile(input()));
    };
    const loadFile = str => {
        Win.delete();
        dqMap.input(str);
        init.main();
    };
    const base62 = new rpgen3.BaseN('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
    const openWindowDefine = () => {
        const win = Win.make('定義リスト'),
              {elm} = win,
              table = $('<table>').appendTo(elm),
              thead = $('<thead>').appendTo(table),
              tr = $('<tr>').appendTo(thead);
        for(const str of [
            'id', 'imgurID', '画像', '削除'
        ]) $('<th>').appendTo(tr).text(str);
        const tbody = $('<tbody>').appendTo(table),
              {define} = dqMap;
        for(const k in define) makeTr(k).appendTo(tbody);
        $('<button>').appendTo(elm).addClass('plusBtn').on('click', async () => {
            const win = Win.make('新規追加'),
                  {elm} = win;
            const bool = rpgen3.addInputBool(elm,{
                label: 'URLを入力する'
            });
            const input = rpgen3.addInputStr(elm,{
                label: '入力欄から',
                textarea: true
            });
            await new Promise(resolve => $('<button>').appendTo(elm).text('決定').on('click', resolve));
            const arr = bool ? rpgen3.findURL(input()).filter(v => rpgen3.getDomain(v)[0] === 'imgur')
            .map(v => v.slice(v.lastIndexOf('/') + 1, v.lastIndexOf('.')))
            : input().match(/[0-9A-Za-z]+/g);
            if(!arr) return;
            const first = Math.max(...Object.keys(define).map(v => base62.decode(v))) + 1;
            let i = 0;
            for(const v of arr){
                const k = base62.encode(first + i);
                if(k in define) continue;
                define[k] = v;
                makeTr(k).appendTo(tbody);
                i++;
            }
        });
    };
    const makeTr = k => {
        const tr = $('tr'),
              id = dqMap.define[k];
        $('<th>').appendTo(tr).text(k);
        $('<td>').appendTo(tr).text(id);
        $('<td>').appendTo(tr).text(makeCanvas(id));
        $('<button>').appendTo($('<td>').appendTo(tr)).text('削除').on('click',()=>{
            delete dqMap.define[k];
            tr.remove();
        });
        return tr;
    };
    const makeCanvas = id => {
        const cv = $('<canvas>'),
              ctx = cv.get(0).getContext('2d'),
              obj = imgurMap.set(id);
        drawCanvas(ctx, obj.img);
        obj.promise.then(() => drawCanvas(ctx, obj.img));
        return cv;
    };
    const drawCanvas = (ctx, img) => {
        const unit = 16;
        if(img.width === unit) ctx.drawImage(img, 0, 0, unit, unit);
        else ctx.drawImage(img, 0, unit * 2, unit, unit, 0, 0, unit, unit);
    };
    const openWindowLayer = () => {
        const win = Win.make('レイヤー操作'),
              {elm} = win;
        const ul = $('<ul>').appendTo(elm).on('sortstop',()=>{
            const arr = [];
            ul.children().each((i,e)=>arr.push(Number($(e).prop('z'))));
            zMap.set('order', arr);
        });
        for(const z of zMap.keys()) if(!isNaN(z)) makeLi(z).appendTo(ul);
        $('<button>').appendTo(elm).addClass('plusBtn').on('click', () => {
            dqMap.data.push(dqMap.make());
            const z = dqMap.info.depth++;
            zMap.set(z, true).get('order').push(z);
            makeLi(z).appendTo(ul);
        });
    };
    const makeLi = z => {
        const li = $('<li>').text(`レイヤー${z}`).prop({z});
        $('<button>').appendTo(li).text('非表示').on('click',()=>{
            if(zMap.get(z)){
                zMap.set(z, false);
                li.addClass('off').removeClass('on');
            }
            else {
                zMap.set(z, true);
                li.addClass('on').removeClass('off');
            }
        });
        $('<button>').appendTo(li).text('削除').on('click',()=>{
            const arr = zMap.delete(z).get('order'),
                  idx = arr.indexOf(z);
            if(z !== -1) arr.splice(idx);
            li.remove();
        });
        return li;
    };
    const openWindowPalette = () => {
        const win = Win.make('パレット選択'),
              {elm} = win;
    };
})();
