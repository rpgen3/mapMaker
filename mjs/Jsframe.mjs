import {getScript} from 'https://rpgen3.github.io/mylib/export/import.mjs';
await getScript('https://riversun.github.io/jsframe/jsframe.js');
export class Jsframe {
    constructor(title){
        const frame = new JSFrame().create({
            title,
            appearanceName: 'redstone',
            style: {
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                overflow:'auto'
            },
            movable: true,
            resizable: true
        }).show();
        minimizeButton(frame);
        deminimizeButton(frame);
        maximizeButton(frame);
        restoreButton(frame);
        this.frame = frame;
        this.set(320, 220).goto(20, 20);
    }
    get elm(){
        return this.frame.dframe;
    }
    get exist(){
        return Boolean(this.frame.parentCanvas);
    }
    get title(){
        return this.frame.title;
    }
    get x(){
        return this.frame.getLeft();
    }
    get y(){
        return this.frame.getTop();
    }
    get w(){
        return this.frame.getWidth();
    }
    get h(){
        return this.frame.getHeight();
    }
    goto(x, y){
        this.frame.setPosition(x, y);
        return this;
    }
    set(w, h){
        this.frame.setSize(w, h);
        return this;
    }
    delete(){
        if(this.exist) this.frame.closeFrame();
    }
}
const minimizeButton = frame => frame.on('minimizeButton', 'click', (_frame, evt) => {
    frame.requestFocus();
    frame.hideFrameComponent('minimizeButton');
    frame.showFrameComponent('deminimizeButton');
    const force = true;
    _frame.extra.__restore_info = {
        org_left: _frame.getLeft(),
        org_top: _frame.getTop(),
        org_width: _frame.getWidth(),
        org_height: _frame.getHeight()
    };
    _frame.setSize(_frame.getWidth(), 30, force);
    _frame.setResizable(false);
});
const deminimizeButton = frame => frame.on('deminimizeButton', 'click', (_frame, evt) => {
    frame.requestFocus();
    _frame.showFrameComponent('minimizeButton');
    _frame.hideFrameComponent('deminimizeButton');
    const force = true;
    _frame.setSize(_frame.extra.__restore_info.org_width, _frame.extra.__restore_info.org_height, force);
});
const maximizeButton = frame => frame.on('maximizeButton', 'click', (_frame, evt) => {
    frame.requestFocus();
    _frame.extra.__restore_info = {
        org_left: _frame.getLeft(),
        org_top: _frame.getTop(),
        org_width: _frame.getWidth(),
        org_height: _frame.getHeight()
    };
    frame.hideFrameComponent('maximizeButton');
    frame.showFrameComponent('restoreButton');
    frame.setPosition(0, 0);
    frame.setSize(window.innerWidth - 2, window.innerHeight - 2, true);
    frame.setMovable(false);
    frame.setResizable(false);
});
const restoreButton = frame => frame.on('restoreButton', 'click', (_frame, evt) => {
    frame.requestFocus();
    frame.setMovable(true);
    frame.setResizable(true);
    _frame.setPosition(_frame.extra.__restore_info.org_left, _frame.extra.__restore_info.org_top);
    const force = true;
    _frame.setSize(_frame.extra.__restore_info.org_width, _frame.extra.__restore_info.org_height, force);
    _frame.showFrameComponent('maximizeButton');
    _frame.hideFrameComponent('restoreButton');
});
