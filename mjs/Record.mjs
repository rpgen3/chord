// https://qiita.com/optimisuke/items/f1434d4a46afd667adc6
export class Record {
    constructor(ctx){
        this.bufferSize = 1024;
        this.node = ctx.createScriptProcessor(this.bufferSize, 1, 1);
        this.node.onaudioprocess = e => this.process(e);
        this.bufs = [];
        this.closed = false;
    }
    close(){
        this.closed = true;
    }
    process(e){
        if(this.closed) return;
        const {bufferSize} = this,
              {inputBuffer, outputBuffer} = e,
              buf = inputBuffer.getChannelData(0);
        this.bufs.push(buf.slice());
        outputBuffer.getChannelData(0).set(buf);
    }
}
