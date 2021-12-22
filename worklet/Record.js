class Record extends AudioWorkletProcessor {
    constructor(options) {
        super(options);
        this.closed = false;
        this.data = [...Array(options.outputChannelCount[0]).fill().map(v => [])];
        this.port.onmessage = ({data}) => {
            if(data === 0) this.closed = true;
            else if(data === 1) this.port.postMessage(this.data);
        };
    }
    process([input], [output]) {
        const {closed, data} = this;
        if(closed) return false;
        if(!input.length) return true;
        for(const i of data.keys()) {
            const buf = input[i];
            output[i].set(buf);
            data[i].push(buf.slice());
        }
        return true;
    }
}
registerProcessor('Record', Record);
