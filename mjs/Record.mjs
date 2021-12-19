// https://qiita.com/optimisuke/items/f1434d4a46afd667adc6
export class Record {
    constructor(ctx, ch = 2, bufferSize = 0){
        this.ch = ch;
        this.node = ctx.createScriptProcessor(bufferSize, ch, ch);
        this.node.onaudioprocess = e => this.process(e);
        this.sampleRate = ctx.sampleRate;
        this.bufs = [];
        this.closed = false;
    }
    close(){
        this.closed = true;
    }
    process({inputBuffer, outputBuffer}){
        if(this.closed) return;
        const {channelCount} = this.node;
        for(let i = 0; i < channelCount; i++) {
            const buf = inputBuffer.getChannelData(i);
            this.bufs.push(buf.slice());
            outputBuffer.getChannelData(i).set(buf);
        }
    }
}
