import {getScript} from 'https://rpgen3.github.io/mylib/export/import.mjs';
await getScript('https://riversun.github.io/jsframe/jsframe.js');
export class Jsframe {
    constructor(title){
        const frame = new JSFrame().create({
            title,
            left: 20, top: 20, width: 320, height: 220,
            appearanceName: 'redstone',
            style: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                overflow:'auto'
            },
            movable: true,
            resizable: true
        }).show();
        minimizeButton(frame);
        deminimizeButton(frame);
        maximizeButton(frame);
        restoreButton(frame);
        closeButton(frame);
        this.frame = frame;
    }
    get elm(){
        return this.frame.dframe;
    }
    get exist(){
        return Boolean(this.frame.parentCanvas);
    }
    set(x, y){
        return this.frame.setPosition(x, y);
    }
    delete(){
        this.frame.closeFrame();
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
const closeButton = frame => frame.on('closeButton', 'click', (_frame, evt) => {
    if(this.exist) _frame.closeFrame();
});
