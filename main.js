(async()=>{
    const {importAll, getScript} = await import('https://rpgen3.github.io/mylib/export/import.mjs');
    await getScript('https://code.jquery.com/jquery-3.3.1.min.js');
    const $ = window.$;
    getScript('https://code.jquery.com/ui/1.12.1/jquery-ui.min.js');
    const html = $('body').empty().css({
        'text-align': 'center',
        padding: '1em',
        'user-select': 'none'
    });
    const holder = $('<div>').appendTo(html);
    const rpgen3 = await importAll([
        'css',
        'hankaku',
        'input',
        'url',
        'util',
        'random'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    [
        'table',
        'plusBtn',
        'layer',
        'palette'
    ].map(v => `https://rpgen3.github.io/mapMaker/css/${v}.css`).map(rpgen3.addCSS);
    const rpgen5 = await importAll([
        'main',
        'Jsframe'
    ].map(v => `https://rpgen3.github.io/mapMaker/mjs/${v}.mjs`));
    const {
        cv, dqMap, update, zMap, input, factory, unitSize, player, scale,
        Jsframe
    } = rpgen5;
    const init = new class {
        constructor(){
            this.cv = $(cv.ctx.canvas);
            $(this.cv).hide();
        }
        main(){
            Win.deleteAll();
            input.z = 0;
            input.k = -1;
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
            this.m = new Map;
            this.unit = 30;
            this.cnt = 0;
        }
        make(ttl){
            const {m} = this;
            if(m.has(ttl)){
                const win = m.get(ttl);
                if(win.exist) {
                    win.focus();
                    return false;
                }
            }
            const win = new rpgen5.Jsframe(ttl);
            m.set(ttl, win.goto(...this._xy(win)));
            return win;
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
        deleteAll(){
            for(const [k,v] of this.m) v.delete();
        }
    };
    const toInt = str => Number(rpgen3.toHan(String(str)).match(/[0-9]+/)?.[0]) || 0,
          promiseBtn = (elm, ttl) => new Promise(resolve => $('<button>').appendTo(elm).text(ttl).on('click', resolve));
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
        await promiseBtn(elm, 'マップを新規作成');
        dqMap.set(...[w, h, d].map(toInt)).init();
        init.main();
        win.delete();
    };
    const openWindowImport = async () => {
        const win = Win.make('作業ファイルを読み込む');
        if(!win) return;
        const {elm} = win;
        $('<input>').appendTo(elm).prop({
            type: 'file',
            accept: '.txt'
        }).on('change', async ({target}) => {
            loadFile(await target.files[0].text());
            win.delete();
        });
        const inputText = rpgen3.addInputStr(elm,{
            label: '入力欄から',
            textarea: true
        });
        await promiseBtn(elm, '読み込む');
        loadFile(inputText());
        win.delete();
    };
    const loadFile = str => {
        dqMap.input(str, factory);
        init.main();
    };
    const openWindowExport = async () => {
        const win = Win.make('現在の編集内容を書き出す');
        if(!win) return;
        const {elm} = win;
        await promiseBtn(elm, '書き出し開始');
        const isNoSpace = rpgen3.addInputBool(elm,{
            label: '半角スペースを削除する',
            save: true
        });
        const str = dqMap.output(zMap.get('order')),
              f = str => isNoSpace() ? str.replace(/ /g,'') : str;
        $('<button>').appendTo(elm).text('クリップボードにコピー').on('click', () => rpgen3.copy(f(str)));
        $('<button>').appendTo(elm).text('txtファイルとして保存').on('click', () => makeTextFile('mapMaker', f(str)));
    };
    const makeTextFile = (ttl, str) => $('<a>').prop({
        download: ttl + '.txt',
        href: URL.createObjectURL(new Blob([str], {
            type: 'text/plain'
        }))
    }).get(0).click();
    const openWindowDefine = async () => {
        const win = Win.make('定義リスト');
        if(!win) return;
        const {elm} = win,
              table = $('<table>').appendTo(elm),
              thead = $('<thead>').appendTo(table),
              tr = $('<tr>').appendTo(thead);
        for(const str of [
            'id', 'img', 'delete'
        ]) $('<th>').appendTo(tr).text(str);
        const tbody = $('<tbody>').appendTo(table);
        $('<div>').appendTo(elm).append('<span>').addClass('plusBtn').on('click', () => openWindowSelect(tbody));
        for(const v of dqMap.list) await addTr(tbody, v);
    };
    const openWindowSelect = async tbody => {
        const win = Win.make('追加する素材のタイプを選択');
        if(!win) return;
        const {elm} = win;
        for(const [i,v] of tipType.entries()) $('<button>').appendTo(elm).text(v).on('click', () => openWindowInputURL(tbody, i));
    };
    const tipType = (()=>{
        const a = ['単体', '複数'],
              b = ['マップチップ', '歩行グラ'];
        return [...new Array(4)].map((v,i) => `${a[i % 2]}の${b[i >> 1]}`);
    })();
    const openWindowInputURL = async (tbody, type) => {
        const win = Win.make('定義を新規追加');
        if(!win) return;
        const {elm} = win,
              isSplit = type % 2 === 1,
              isAnime = type > 1;
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
        const inputURL = rpgen3.addInputStr(elm,{
            label: 'URLの入力欄'
        });
        inputURL.elm.focus();
        await promiseBtn(elm, '決定');
        $(elm).text('入力値が正しいか判定中');
        const url = rpgen3.findURL(inputURL())[0];
        if(!url) return;
        const obj = {type, url};
        if(isAnime){
            const f = toInt(inputframe),
                  w = inputWay();
            if(!f) throw 'フレーム数の値が不正です';
            if(!/[wasd]/.test(w)) throw '方向の定義の値が不正です';
            obj.frame = f;
            obj.way = w;
        }
        if(isSplit){
            const w = toInt(inputWidth),
                  h = toInt(inputHeight);
            if(!w || !h) throw '幅・高さの値が0です';
            obj.width = w;
            obj.height = h;
        }
        $(elm).text('登録処理を実行中');
        const _obj = factory(obj);
        await _obj.promise;
        if(type === 1 || type === 3) _obj.index = [..._obj.indexToXY.keys()];
        _obj.first = dqMap.next | 0;
        const {index, way} = _obj,
              _i = index?.length,
              _w = way?.length;
        _obj.last = _obj.first - 1 + [1, _i, _w, _i * _w][type];
        dqMap.setDefine(_obj);
        await Promise.all([
            addTr(tbody, _obj),
            addPalette(_obj)
        ]);
        win.delete();
    };
    const addTr = async (tbody, obj) => {
        const {type, first} = obj;
        if(type === 1 || type === 3){
            const {index} = obj;
            const add = (key, ttl, func) => makeTr(ttl, () => {
                const idx = index.indexOf(key);
                if(idx !== -1) index.splice(idx, 1);
                func();
            }, obj, key).appendTo(tbody);
            for(const i of obj.index) {
                if(type === 1){
                    const k = first + i;
                    add(k, k, () => deleteKey(k));
                }
                else {
                    const {length} = obj.way,
                          k = first + i * length;
                    add(k, `${k}~${k + length - 1}`, () => {
                        for(let i = 0; i < length; i++) deleteKey(k + i);
                    });
                }
                await sleep(10);
            }
        }
        else makeTr(first, () => deleteKey(obj), obj).appendTo(tbody);
    };
    const deleteKey = key => {
        dqMap.define.delete(key);
        $('.' + paletteKeyClass(key)).remove();
    };
    const makeTr = (ttl, remove, obj, key) => {
        const tr = $('<tr>');
        $('<th>').appendTo(tr).text(ttl);
        $('<td>').appendTo(tr).append(makeCanvas(obj, key));
        $('<button>').appendTo($('<td>').appendTo(tr)).text('削除').on('click',()=>{
            tr.remove();
            remove();
        });
        return tr;
    };
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const makeCanvas = (obj, key) => {
        const cv = $('<canvas>').prop({width: unitSize, height: unitSize}),
              ctx = cv.get(0).getContext('2d');
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;
        obj.draw(ctx, 0, 0, key);
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
        for(const z of zMap.keys()) if(!isNaN(z)) addTrLayer(z).appendTo(tbody);
        $('<div>').appendTo(elm).append('<span>').addClass('plusBtn').on('click', () => {
            dqMap.data.push(dqMap.make());
            const z = dqMap.info.depth++;
            zMap.set(z, true).get('order').push(z);
            addTrLayer(z).appendTo(tbody);
        });
    };
    const activeClassL = 'activeLayer';
    const addTrLayer = z => {
        const tr = $('<tr>').prop({z}).on('click',()=>{
            $('.' + activeClassL).removeClass(activeClassL);
            tr.addClass(activeClassL);
            input.z = z;
        });
        if(input.z === z) tr.addClass(activeClassL);
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
    const paletteClass = type => `palletClass${type}`,
          paletteKeyClass = key => `palletKeyClass${key}`,
          paletteHolderId = 'palletHolderId',
          paletteTitle = 'パレット選択';
    let nowType = 0, nowWay = 's';
    const openWindowPalette = async () => {
        const win = Win.make(paletteTitle);
        if(!win) return;
        const {elm} = win;
        const selectType = rpgen3.addSelect(elm, {
            label: '表示するもの',
            list: tipType.map((v, i) => [v, i]),
            save: true
        });
        selectType.elm.on('change', () => {
            nowType = selectType();
            holder.children().hide();
            holder.find('.' + paletteClass(nowType)).show();
            hWay[nowType === 2 || nowType === 3 ? 'show' : 'hide']();
        });
        const hWay = $('<div>').appendTo(elm);
        const inputWay = rpgen3.addSelect(hWay, {
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
            nowWay = inputWay();
            const {k} = input,
                  _k = dqMap.define.get(k)?.getKey?.(nowWay, k);
            if(_k || _k === 0) input.k = _k;
        }).trigger('change');
        const holder = $('<div>').appendTo(elm).prop('id', paletteHolderId);
        selectType.elm.trigger('change');
        for(const v of dqMap.list) await addPalette(v);
    };
    const addPalette = async obj => {
        const win = Win.m.get(paletteTitle);
        if(!win) return;
        const elm = $('#' + paletteHolderId),
              {type, first} = obj;
        if(type === 1 || type === 3) {
            for(const i of obj.index) {
                if(type === 1){
                    const k = first + i;
                    makePalette(obj, k).appendTo(elm);
                }
                else {
                    const {length} = obj.way,
                          k = first + i * length;
                    makePalette(obj, obj.getKey('s', k)).appendTo(elm);
                }
                await sleep(10);
            }
        }
        else makePalette(obj, obj.getKey?.('s')).appendTo(elm);
    };
    const activeClassP = 'activePalette';
    const makePalette = (obj, key = obj.first) => {
        const {type} = obj;
        const cv = makeCanvas(obj, key).on('click', () => {
            const flag = cv.hasClass(activeClassP);
            input.k = -1;
            $('.' + activeClassP).removeClass(activeClassP);
            if(!flag){
                cv.addClass(activeClassP);
                input.k = type === 2 || type === 3 ? obj.getKey(nowWay, key) : key;
            }
        }).addClass(paletteClass(type)).addClass(paletteKeyClass(key));
        if(type === 2 || type === 3) {
            const {length} = obj.way;
            for(let i = 1; i < length; i++) cv.addClass(paletteKeyClass(key + i));
            if(input.k >= key && input.k < key + length) cv.addClass(activeClassP);
        }
        else if(input.k === key) cv.addClass(activeClassP);
        if(obj.type === nowType) cv.show();
        else cv.hide();
        return cv;
    };
    const openWindowConfig = () => {
        const win = Win.make('設定');
        if(!win) return;
        const {elm} = win,
              half = unitSize / 2 | 0;
        const inputY = rpgen3.addInputNum(elm,{
            label: '歩行グラずらし度',
            value: input.y,
            min: -half,
            max: half
        });
        inputY.elm.on('input', v => {
            input.y = inputY();
        });
        [
            ['goto', {
                label: '座標移動',
                value: `${player.x}, ${player.y}`
            }],
            ['dressUp', {
                label: '着替える',
                save: true
            }]
        ].map(([func, param]) => {
            const input = rpgen3.addInputStr(elm, param);
            input.elm.on('change',()=>{
                const m = input().match(/[0-9]+/g);
                if(!m) return;
                player[func](...m.map(Number));
            });
        });
        $('<button>').appendTo(elm).text('デフォルト衣装').on('click', () => player.dressUp());
        const hideLine = rpgen3.addInputBool(elm,{
            label: '目盛りを消す'
        });
        hideLine.elm.on('change',() => {
            scale.hide = hideLine();
        });
    };
    const openWindowAll = () =>{
        const win = Win.make('コマンド一覧');
        if(!win) return;
        const {elm} = win;
        [
            [openWindowDefine, '[K]定義リスト'],
            [openWindowLayer, '[L]レイヤー操作'],
            [openWindowPalette, '[P]パレット選択'],
            [openWindowInit, '初期化'],
            [openWindowImport, '読み込み'],
            [openWindowExport, '書き出し'],
            [openWindowConfig, '設定']
        ].map(([func, ttl]) => $('<button>').appendTo(elm).text(ttl).on('click', func));
    };
    $(window).on('keydown',({key})=>{
        if(!init.flag) return;
        switch(key){
            case 'm': return openWindowAll();
            case 'k': return openWindowDefine();
            case 'l': return openWindowLayer();
            case 'p': return openWindowPalette();
        }
    });
})();
