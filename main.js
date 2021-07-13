(async()=>{
    const {importAll, getScript, getCSS, promiseSerial} = await import('https://rpgen3.github.io/mylib/export/import.mjs');
    promiseSerial([
        'table',
        'ul',
        'plusBtn',
        'active',
        'off'
    ].map(v => getCSS(`https://rpgen3.github.io/mapMaker/css/${v}.css`)));
    await getScript('https://code.jquery.com/jquery-3.3.1.min.js');
    getScript('https://code.jquery.com/ui/1.12.1/jquery-ui.min.js');
    const html = $('body').empty().css({
        'text-align': 'center',
        padding: '1em',
        'user-select': 'none'
    });
    const holder = $('<div>').appendTo(html);
    const rpgen3 = await importAll([
        'input',
        'imgur',
        'url',
        'util',
        'random'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    const rpgen5 = await importAll([
        'Jsframe',
        'main'
    ].map(v => `https://rpgen3.github.io/mapMaker/mjs/${v}.mjs`));
    const {Jsframe, cv, dqMap, update, zMap, imgurMap, input} = rpgen5;
    const init = new class {
        constructor(){
            this.cv = $(cv.ctx.canvas);
            $(this.cv).hide();
        }
        main(){
            Win.delete();
            input.z = 0;
            input.v = -1;
            zMap.clear();
            for(let i = 0; i < dqMap.info.depth; i++) zMap.set(i, true);
            zMap.set('order', [...zMap.keys()]);
            this.init();
        }
        init(){
            if(this.flag) return;
            this.flag = true;
            holder.remove();
            $(this.cv).show();
            update();
        }
    };
    $('<h1>').appendTo(holder).text('ドラクエ風マップ作成ツール');
    $('<button>').appendTo(holder).text('新規作成').on('click', () => openWindowInit());
    $('<button>').appendTo(holder).text('読み込み').on('click', () => openWindowImport());
    const Win = new class {
        constructor(){
            this.arr = [];
            this.unit = 30;
            this.cnt = 0;
        }
        make(title, w = this.w, h = this.h){
            const {arr} = this;
            if(arr.some(win => win.title === title && win.exist && win.focus())) return false;
            const win = new rpgen5.Jsframe(title).set(w, h);
            arr.push(win.goto(...this._xy(win)));
            return win;
        }
        delete(){
            const {arr} = this;
            while(arr.length) arr.pop().delete();
        }
        _xy(win){
            const {w, h} = win;
            let now = ++this.cnt * this.unit;
            if(now > Math.min($(window).width() - w, $(window).height() - h)) {
                this.cnt = 0;
                return this._xy(win);
            }
            return [...new Array(2)].map(v => rpgen3.randInt(-5, 5) + now);
        }
    };
    const addInputNum = (parent, label, value) => {
        const a = rpgen3.addInputStr(parent,{
            label, value, save: true
        });
        a.elm.on('change', () => a(a().replace(/[^0-9]/g,'')));
        return () => Number(a());
    };
    const openWindowInit = async () => {
        const win = Win.make('パラメータを設定して初期化');
        if(!win) return;
        const {elm} = win,
              w = addInputNum(elm, 'width', 50),
              h = addInputNum(elm, 'height', 50),
              d = addInputNum(elm, 'depth', 3);
        await new Promise(resolve => $('<button>').appendTo(elm).text('マップを新規作成').on('click', resolve));
        dqMap.set(w(), h(), d()).init();
        init.main();
    };
    const openWindowImport = () => {
        const win = Win.make('作業ファイルを読み込む');
        if(!win) return;
        const {elm} = win;
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
        dqMap.input(str);
        init.main();
        openWindowDefine();
    };
    const openWindowExport = async () => {
        const win = Win.make('現在の編集内容を書き出す');
        if(!win) return;
        const {elm} = win;
        const bool = rpgen3.addInputBool(elm,{
            label: '空値に半角スペースを使用する',
            save: true
        });
        await new Promise(resolve => $('<button>').appendTo(elm).text('書き出し開始').on('click', resolve));
        const str = dqMap.output(bool() ? ' ' : '', zMap.get('order'));
        $('<button>').appendTo(elm).text('クリップボードにコピー').on('click', () => rpgen3.copy(str));
        $('<button>').appendTo(elm).text('txtファイルとして保存').on('click', () => makeTextFile('mapMaker', str));
    };
    const makeTextFile = (ttl, str) => $('<a>').prop({
        download: ttl + '.txt',
        href: URL.createObjectURL(new Blob([str], {
            type: 'text/plain'
        }))
    }).get(0).click();
    const openWindowDefine = () => {
        const win = Win.make('定義リスト');
        if(!win) return;
        const {elm} = win,
              table = $('<table>').appendTo(elm),
              thead = $('<thead>').appendTo(table),
              tr = $('<tr>').appendTo(thead);
        for(const str of [
            'id', 'imgurID', 'img', 'delete'
        ]) $('<th>').appendTo(tr).text(str);
        const tbody = $('<tbody>').appendTo(table),
              {define} = dqMap;
        for(const k of define.keys) makeTr(k).appendTo(tbody);
        $('<div>').appendTo(elm).append('<span>').addClass('plusBtn').on('click', async () => {
            const win = Win.make('imgurIDを新規追加');
            if(!win) return;
            const {elm} = win;
            $('<div>').appendTo(elm).text('複数入力も可');
            const input = rpgen3.addInputStr(elm,{
                label: '入力',
                textarea: true
            });
            await new Promise(resolve => $('<button>').appendTo(elm).text('決定').on('click', resolve));
            const urls = rpgen3.findURL(input()),
                  arr = urls.length ? urls.filter(v => rpgen3.getDomain(v)[1] === 'imgur')
            .map(v => v.slice(v.lastIndexOf('/') + 1, v.lastIndexOf('.'))) : input().match(/[0-9A-Za-z]+/g);
            if(!arr) return;
            const {next} = define;
            let i = 0;
            for(const v of arr){
                const k = next + i;
                define.set(k, v);
                makeTr(k).appendTo(tbody);
                i++;
            }
            win.delete();
        });
    };
    const makeTr = k => {
        const tr = $('<tr>'),
              id = dqMap.define.get(k);
        $('<th>').appendTo(tr).text(k);
        $('<td>').appendTo(tr).text(id);
        makeCanvas(id).appendTo($('<td>').appendTo(tr));
        $('<button>').appendTo($('<td>').appendTo(tr)).text('削除').on('click',()=>{
            dqMap.define.delete(k);
            tr.remove();
        });
        return tr;
    };
    const makeCanvas = id => {
        const cv = $('<canvas>').prop({width:16, height:16}),
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
        const win = Win.make('レイヤー操作');
        if(!win) return;
        const {elm} = win,
              table = $('<table>').appendTo(elm);
        const tbody = $('<tbody>').appendTo(table).sortable({
            opacity: 0.6,
            placeholder: 'drag',
            axis: 'y'
        }).on('sortstop',()=>{
            const arr = [];
            tbody.children().each((i,e)=>arr.push(Number($(e).prop('z'))));
            zMap.set('order', arr);
        });
        for(const z of zMap.keys()) if(!isNaN(z)) makeTr2(z).appendTo(tbody);
        $('<div>').appendTo(elm).append('<span>').addClass('plusBtn').on('click', () => {
            dqMap.data.push(dqMap.make());
            const z = dqMap.info.depth++;
            zMap.set(z, true).get('order').push(z);
            makeTr2(z).appendTo(tbody);
        });
    };
    const makeTr2 = z => {
        const tr = $('<tr>').on('click',()=>{
            tr.parent().children().removeClass('active');
            tr.addClass('active');
            input.z = z;
        });
        if(input.z === z) tr.addClass('active');
        $('<th>').appendTo(tr).text(`レイヤー${z}`);
        $('<button>').appendTo($('<td>').appendTo(tr)).text('非表示').on('click',()=>{
            tr.toggleClass('off');
            zMap.set(z, !zMap.get(z));
        });
        if(!zMap.get(z)) tr.addClass('off');
        $('<button>').appendTo($('<td>').appendTo(tr)).text('削除').on('click',()=>{
            zMap.delete(z);
            const arr = zMap.get('order'),
                  idx = arr.indexOf(z);
            if(z !== -1) arr.splice(idx);
            tr.remove();
        });
        return tr;
    };
    const openWindowPalette = () => {
        const win = Win.make('パレット選択');
        if(!win) return;
        const {elm} = win,
              {define} = dqMap;
        for(const k of define.keys) {
            const cv = makeCanvas(define.get(k)).appendTo(elm).on('click',()=>{
                $(elm).find('canvas').removeClass('active');
                cv.addClass('active');
                input.v = k;
            });
            if(input.v === k) cv.addClass('active');
        }
    };
    const openWindowAll = () =>{
        const win = Win.make('コマンド一覧');
        if(!win) return;
        const {elm} = win;
        [
            [openWindowInit, '初期化'],
            [openWindowImport, '読み込み'],
            [openWindowExport, '書き出し'],
            [openWindowDefine, '[D]定義リスト'],
            [openWindowLayer, '[L]レイヤー操作'],
            [openWindowPalette, '[P]パレット選択'],
        ].map(([func, ttl]) => $('<button>').appendTo(elm).text(ttl).on('click', func));
    };
    $(window).on('keydown',({key})=>{
        if(!init.flag) return;
        switch(key){
            case ' ': return openWindowAll();
            case 'd': return openWindowDefine();
            case 'l': return openWindowLayer();
            case 'p': return openWindowPalette();
        }
    });
})();
