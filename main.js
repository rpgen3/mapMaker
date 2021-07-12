(async()=>{
    const {importAll, getScript} = await import('https://rpgen3.github.io/mylib/export/import.mjs');
    await Promise.all([
        'https://code.jquery.com/jquery-3.3.1.min.js',
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
        'imgur',
        'url',
        'util'
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
            $('body').empty();
            $(this.cv).show().appendTo('body');
            update();
        }
    };
    $('<h1>').appendTo(header).text('ドラクエ風マップ作成ツール');
    $('<button>').appendTo(body).text('新規作成').on('click', () => openWindowInit());
    $('<button>').appendTo(body).text('読み込み').on('click', () => openWindowImport());
    const Win = new class {
        constructor(){
            this.arr = [];
        }
        make(title){
            if(this.arr.some(([win, ttl]) => ttl === title && win.exist)) return false;
            const win = new rpgen5.Jsframe(title);
            this.arr.push([win, title]);
            return win;
        }
        delete(){
            const {arr} = this;
            while(arr.length) arr.pop()[0].delete();
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
        const win = Win.make('パラメータを設定して初期化');
        if(!win) return;
        const {elm} = win,
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
        Win.delete();
        dqMap.input(str);
        init.main();
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
            'id', 'imgurID', '画像', '削除'
        ]) $('<th>').appendTo(tr).text(str);
        const tbody = $('<tbody>').appendTo(table),
              {define} = dqMap;
        for(const k of define.keys) makeTr(k).appendTo(tbody);
        $('<button>').appendTo(elm).addClass('plusBtn').on('click', async () => {
            const win = Win.make('imgurIDを新規追加');
            if(!win) return;
            const {elm} = win;
            $('<div>').appendTo(elm).text('複数入力も可');
            const bool = rpgen3.addInputBool(elm,{
                label: 'URLを入力する',
                save: true
            });
            const input = rpgen3.addInputStr(elm,{
                label: '入力',
                textarea: true
            });
            await new Promise(resolve => $('<button>').appendTo(elm).text('決定').on('click', resolve));
            const arr = bool ? rpgen3.findURL(input()).filter(v => rpgen3.getDomain(v)[0] === 'imgur')
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
        const tr = $('tr'),
              id = dqMap.define.get(k);
        $('<th>').appendTo(tr).text(k);
        $('<td>').appendTo(tr).text(id);
        $('<td>').appendTo(tr).text(makeCanvas(id));
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
        const {elm} = win;
        const ul = $('<ul>').appendTo(elm).sortable({
            opacity: 0.5,
            placeholder: 'drag',
            axis: 'y'
        }).on('sortstop',()=>{
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
        const li = $('<li>').prop({z});
        $('<span>').appendTo(li).text(`レイヤー${z}`).on('click',()=>{
            li.parent().children().removeClass('active');
            li.addClass('active');
            input.z = z;
        });
        $('<button>').appendTo(li).text('非表示').on('click',()=>{
            li.toggleClass('off');
            zMap.set(z, !zMap.get(z));
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
        const win = Win.make('パレット選択');
        if(!win) return;
        const {elm} = win,
              {define} = dqMap;
        for(const k of define.keys) {
            const cv = makeCanvas(define.get(k)).appendTo(elm).on('click',()=>{
                win.find('canvas').removeClass('active');
                cv.addClass('active');
                input.v = k;
            });
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
            [openWindowDefine, '定義リスト'],
            [openWindowLayer, 'レイヤー操作'],
            [openWindowPalette, 'パレット選択'],
        ].map(([func, ttl]) => $('<button>').appendTo(win).text(ttl).on('click', func));
    };
    $(window).on('keydown',({key})=>{
        if(!init.falg) return;
        switch(key){
            case '1': return openWindowAll();
            case '2': return openWindowDefine();
            case '3': return openWindowLayer();
            case '4': return openWindowPalette();
        }
    });
})();
