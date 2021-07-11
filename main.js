(async()=>{
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
        'imgur'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    const rpgen5 = await importAll([
        'Jsframe',
        'main'
    ].map(v => `https://rpgen3.github.io/mapMaker/mjs/${v}.mjs`));
    const {cv, dqMap, update, zMap, Jsframe} = rpgen5;
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
              {elm} = win;
        const table = $('<table>').appendTo(elm);
        makeThead(['id', 'imgurID', '画像', '非表示', '削除']).appendTo(table);
        /*const tbody = $('<tbody>').appendTo(table);
        for(const z of zArr) {
            const tr = $('<tr>').appendTo(thead);
        }
        $('<button>').appendTo(elm).addClass('plusBtn').on('click', addLayer);
        tbody.on('sortstop',()=>{
            zArray.empty();
            tbody.each((i,e)=>zArr.push(Number($(e).prop('value'))));
        });*/
    };
    const makeThead = arr => {
        const thead = $('<thead>'),
              tr = $('<tr>').appendTo(thead);
        for(const str of arr) $('<th>').appendTo(tr).text(str);
        return thead;
    };
    const addInputCell = () => {
        const newId = base62.encode(Math.max(...Object.keys(dqMap.define).map(v => base62.decode(v))) + 1);
    };
    const openWindowLayer = () => {
        const win = Win.make('レイヤー操作'),
              {elm} = win;
        const ul = $('<ul>').appendTo(elm).on('sortstop',()=>{
            const arr = [];
            ul.children().each((i,e)=>arr.push(Number($(e).prop('z'))));
            zMap.set('order', arr);
        });
        for(const z of zMap.keys()) {
            if(isNaN(z)) continue;
            const li = $('<li>').appendTo(ul).text(`レイヤー${z}`).prop({z})
            .append($('<button>').text('非表示').on('click',()=>{
                if(zMap.get(z)){
                    zMap.set(z, false);
                    li.addClass('off').removeClass('on');
                }
                else {
                    zMap.set(z, true);
                    li.addClass('on').removeClass('off');
                }
            }))
            .append($('<button>').text('削除').on('click',()=>{
                const arr = zMap.delete(z).get('order'),
                      idx = arr.indexOf(z);
                if(z !== -1) arr.splice(idx);
                li.remove();
            }));
        }
    };
    const addLayer = () =>{
        dqMap.data.push(dqMap.make());
        const z = dqMap.info.depth++;
        zMap.set(z, true).get('order').push(z);
    };
    const openWindowPalette = () => {
        const win = Win.make('パレット選択'),
              {elm} = win;
    };
})();
