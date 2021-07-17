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
        'main',
        'Jsframe'
    ].map(v => `https://rpgen3.github.io/mapMaker/mjs/${v}.mjs`));
    const {
        cv, dqMap, update, zMap, input, dMap, unitSize,
        Jsframe
    } = rpgen5;
    const init = new class {
        constructor(){
            this.cv = $(cv.ctx.canvas);
            $(this.cv).hide();
        }
        main(){
            Win.delete();
            input.z = 0;
            input.v = null;
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
    const toInt = str => Number(String(str).match(/[0-9]+/)?.[0]) || 0;
    const openWindowInit = async () => {
        const win = Win.make('パラメータを設定して初期化');
        if(!win) return;
        const {elm} = win;
        const w = rpgen3.addInputStr(elm,{
            label: 'width',
            value: 50,
            save: true
        });
        const h = rpgen3.addInputStr(elm,{
            label: 'height',
            value: 50,
            save: true
        });
        const d = rpgen3.addInputStr(elm,{
            label: 'depth',
            value: 3,
            save: true
        });
        await new Promise(resolve => $('<button>').appendTo(elm).text('マップを新規作成').on('click', resolve));
        dqMap.set(...[w, h, d].map(toInt)).init();
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
        const inputText = rpgen3.addInputStr(elm,{
            label: '入力欄から',
            textarea: true
        });
        $('<button>').appendTo(elm).text('読み込む').on('click', () => loadFile(inputText()));
    };
    const loadFile = str => {
        dqMap.input(str);
        dMap.clear();
        const {define} = dqMap;
        for(const [k,v] of define) dMap.set(k, define.get(k));
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
            'id', 'imgurID', 'img', 'delete'
        ]) $('<th>').appendTo(tr).text(str);
        const tbody = $('<tbody>').appendTo(table),
              {define} = dqMap;
        for(const k of define.keys()) makeTrDefine(tbody, k);
        $('<div>').appendTo(elm).append('<span>').addClass('plusBtn').on('click', () => openWindowSelect(tbody));
    };
    const openWindowSelect = async tbody => {
        const win = Win.make('追加する素材のタイプを選択');
        if(!win) return;
        const {elm} = win;
        const msg = (parentNode => {
            const holder = $('<div>').appendTo(parentNode);
            return (str, isError) => $('<span>').appendTo(holder.empty()).text(`${str}(${rpgen3.getTime()})`).css({
                color: isError ? 'red' : 'blue',
                backgroundColor: isError ? 'pink' : 'lightblue'
            });
        })(elm);
        const addBtn = (ttl, isAnime, isSplit) => $('<button>').appendTo(elm).text(ttl).on(
            'click', () => openWindowInputImgur(tbody, isAnime, isSplit)
            //.then(() => msg('読み込みが正常に完了しました'))
            //.catch(err => msg(err, true))
        );
        addBtn('単体のマップチップ');
        addBtn('単体の歩行グラ', true);
        addBtn('複数のマップチップ', false, true);
        addBtn('複数の歩行グラ', true, true);
    };
    const openWindowInputImgur = async (tbody, isAnime, isSplit) => {
        const win = Win.make('imgurIDを新規追加');
        if(!win) return;
        const {elm} = win;
        let inputframe, inputWay, inputWidth, inputHeight;
        if(isAnime){
            const inputTemplate = rpgen3.addSelect(elm,{
                label: 'テンプレ入力',
                value: 'ここから選択',
                list: {
                    'ここから選択': null,
                    'RPGEN': [[2, 'wdsa'], [16, 16]],
                    'ツクール2000': [[3, 'wdsa'], [24, 32]],
                    'ツクールXP': [[4, 'sadw'], [32, 48]],
                    'ツクールVX': [[3, 'sadw'], [32, 32]],
                    'ツクールMV': [[3, 'sadw'], [48, 48]],
                }
            });
            inputTemplate.elm.on('change', () => {
                if(!inputTemplate()) return;
                const [[frame, way], [width, height]] = inputTemplate();
                inputframe(frame);
                inputWay(way);
                if(isSplit){
                    inputWidth(width);
                    inputHeight(height);
                }
            });
            inputframe = rpgen3.addInputStr(elm,{
                label: 'フレーム数',
                value: 3,
                save: true
            });
            $('<div>').appendTo(elm).text('wasd: ↑←↓→');
            inputWay = rpgen3.addInputStr(elm,{
                label: '方向の定義',
                value: 'sadw',
                save: true
            });
        }
        if(isSplit){
            inputWidth = rpgen3.addInputStr(elm,{
                label: '幅',
                value: 16,
                save: true
            });
            inputHeight = rpgen3.addInputStr(elm,{
                label: '高さ',
                value: 16,
                save: true
            });
        }
        $('<div>').appendTo(elm).text('以下にURLかimgurIDを入力');
        $('<div>').appendTo(elm).text('複数の入力も可');
        const inputImgur = rpgen3.addInputStr(elm,{
            label: '入力欄',
            textarea: true
        });
        inputImgur.elm.focus();
        await new Promise(resolve => $('<button>').appendTo(elm).text('決定').on('click', resolve));
        const urls = rpgen3.findURL(inputImgur()),
              arr = urls.length ? urls.filter(v => rpgen3.getDomain(v)[1] === 'imgur')
        .map(v => v.slice(v.lastIndexOf('/') + 1, v.lastIndexOf('.'))) : inputImgur().match(/[0-9A-Za-z]+/g);
        if(!arr) return;
        const {next} = dqMap;
        let i = 0;
        for(const id of arr){
            const obj = {id};
            try {
                if(isAnime){
                    const f = toInt(inputframe),
                          w = inputWay();
                    if(!f) throw 'フレーム数の値が不正です';
                    if(!/[wasd]/.test(w)) '方向の定義の値が不正です';
                    obj.frame = f;
                    obj.way = w;
                }
                if(isSplit){
                    const w = toInt(inputWidth),
                          h = toInt(inputHeight);
                    if(!w || !h) '幅・高さの値が0です';
                    if(w > 64 || h > 64) '幅・高さの最大値は64pxです';
                    obj.width = w;
                    obj.height = h;
                    obj.index = [];
                }
            }
            catch(err) {
                win.delete();
                throw err;
            }
            const k = next + i,
                  {promise} = dMap.set(k, obj);
            if(isSplit){
                promise.then(() => {
                    const d = dMap.get(k),
                          index = [...d.indexToXY.keys()];
                    d.index = obj.index = index;
                });
            }
            promise.then(() => {
                dqMap.define.set(k, obj);
                makeTrDefine(tbody, k);
            });
            i++;
        }
        win.delete();
    };
    const makeTrDefine = (tbody, key) => {
        const obj = dqMap.define.get(key),
              {id, index} = obj;
        if('index' in obj) {
            for(const i of index) makeTrDefine2(`${key}-${i}`, id, makeCanvas(key, i), () => {
                const idx = index.indexOf(i);
                if(idx !== -1) index.splice(idx);
                if(!index.length) deleteKey(key);
            }).appendTo(tbody);
        }
        else makeTrDefine2(key, id, makeCanvas(key, null), () => deleteKey(key)).appendTo(tbody);
    };
    const deleteKey = key => {
        dqMap.delete(key);
        dMap.delete(key);
    };
    const makeTrDefine2 = (key, id, cv, remove) => {
        const tr = $('<tr>');
        $('<th>').appendTo(tr).text(key);
        $('<td>').appendTo(tr).text(id);
        $('<td>').appendTo(tr).append(cv);
        $('<button>').appendTo($('<td>').appendTo(tr)).text('削除').on('click',()=>{
            tr.remove();
            remove();
        });
        return tr;
    };
    const makeCanvas = (key, index) => {
        const cv = $('<canvas>').prop({width: unitSize, height: unitSize}),
              ctx = cv.get(0).getContext('2d');
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;
        dMap.get(key)?.draw(ctx, 0, 0, {index, way: 's'});
        return cv;
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
        for(const z of zMap.keys()) if(!isNaN(z)) makeTrLayer(z).appendTo(tbody);
        $('<div>').appendTo(elm).append('<span>').addClass('plusBtn').on('click', () => {
            dqMap.data.push(dqMap.make());
            const z = dqMap.info.depth++;
            zMap.set(z, true).get('order').push(z);
            makeTrLayer(z).appendTo(tbody);
        });
    };
    const makeTrLayer = z => {
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
        const {elm} = win;
        const inputWay = rpgen3.addSelect(elm, {
            label: '人物の向き',
            list: {
                '↑': 'w',
                '←': 'a',
                '↓': 's',
                '→': 'd'
            },
            value: '↓',
            save: true
        });
        inputWay.elm.on('change', () => {
            if(!input.v) input.v = {};
            input.v.way = inputWay();
        }).trigger('change');
        const holder = $('<div>').appendTo(elm);
        for(const [k,v] of dqMap.define) {
            const {id, index} = v;
            if('index' in v) for(const i of index) makePalette(holder, k, i);
            else makePalette(holder, k);
        }
    };
    const makePalette = (elm, key, index = null) => {
        const cv = makeCanvas(key, index).appendTo(elm).on('click',()=>{
            $(elm).find('canvas').removeClass('active');
            if(!input.v) input.v = {};
            if(index === null){
                if(input.v.key === key) input.v = null;
                else {
                    cv.addClass('active');
                    input.v.key = key;
                }
            }
            else {
                if(input.v.key === key && input.v.index === index) input.v = null;
                else {
                    cv.addClass('active');
                    input.v.key = key;
                    input.v.index = index;
                }
            }
        });
        if(input.v && input.v.key === key && (index === null || input.v.index === index)) cv.addClass('active');
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
