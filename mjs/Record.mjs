export class Record {
    constructor({ctx, ch = 2, bufSize = 0}){
        this.closed = false;
        this.data = [...Array(ch).fill().map(v => [])];
        this.node = ctx.createScriptProcessor(bufSize, ch, ch);
        this.node.onaudioprocess = e => this.process(e);
    }
    close(){
        this.closed = true;
    }
    process({inputBuffer, outputBuffer}){
        const {closed, data} = this;
        if(closed) return;
        for(const i of data.keys()) {
            const buf = inputBuffer.getChannelData(i);
            outputBuffer.getChannelData(i).set(buf);
            data[i].push(buf.slice());
        }
    }
}
