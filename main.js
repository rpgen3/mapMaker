(async()=>{
    const {importAll, importAllSettled, getScript} = await import('https://rpgen3.github.io/mylib/export/import.mjs');
    await getScript('https://rpgen3.github.io/lib/lib/jquery-3.5.1.min.js');
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
    const base62 = new rpgen3.BaseN('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
    const rpgen5 = await importAll([
        'Jsframe',
        'main'
    ].map(v => `https://rpgen3.github.io/mapMaker/mjs/${v}.mjs`));
    const {cv, dqMap, update, Jsframe} = rpgen5;
    const init = new class {
        constructor(){
            this.cv = $(cv.canvas);
            $(this.cv ).hide();
        }
        main(){
            if(this.flag) return;
            this.flag = true;
            $(this.cv).show();
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
})();
