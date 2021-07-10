import {getScript} from 'https://rpgen3.github.io/mylib/export/import.mjs';
await getScript('https://riversun.github.io/jsframe/jsframe.js');
const jsFrame = new JSFrame();
export class Jsframe {
    constructor(title){
        const frame = jsFrame.create({
            title,
            left: 20, top: 20, width: 320, height: 220,
            appearanceName: 'redstone',
            style: {
                backgroundColor: 'rgba(255,255,255,0.5)',
                overflow:'auto'
            },
            movable: true,
            resizable: true
        }).show();
        frame.on('maximizeButton', 'click', (_frame, evt) => {
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
        frame.on('restoreButton', 'click', (_frame, evt) => {
            frame.setMovable(true);
            frame.setResizable(true);
            _frame.setPosition(_frame.extra.__restore_info.org_left, _frame.extra.__restore_info.org_top);
            _frame.setSize(_frame.extra.__restore_info.org_width, _frame.extra.__restore_info.org_height, true);
            _frame.showFrameComponent('maximizeButton');
            _frame.hideFrameComponent('restoreButton');
        });
        this.frame = frame;
    }
    get elm(){
        return this.frame.dframe;
    }
    set(x, y){
        return this.frame.setPosition(x, y);
    }
}
