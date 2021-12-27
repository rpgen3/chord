export const audioNode = new class {
    constructor(){
        this.ctx = null;
        this.note = {gain: {}};
        this.drum = {gain: {}};
    }
    init(){
        this.ctx?.close();
        this.ctx = new AudioContext();
        const {ctx, note, drum} = this;
        this.note = ctx.createGain();
        this.drum = ctx.createGain();
        this.note.gain.value = note.gain.value;
        this.drum.gain.value = drum.gain.value;
        this.connect();
    }
    connect(any){
        const {ctx, note, drum} = this,
              {destination} = ctx;
        if(any) {
            note.connect(any).connect(destination);
            drum.connect(any).connect(destination);
        }
        else {
            note.connect(destination);
            drum.connect(destination);
        }
    }
};
window.addEventListener('click', () => audioNode.init(), {once: true});
