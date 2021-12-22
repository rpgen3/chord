class Record extends AudioWorkletProcessor {
    constructor(options) {
        super(options);
        this.closed = false;
        this.data = [...Array(options.channelCount).fill().map(v => [])];
        this.port.onmessage = ({data}) => {
            if(data === 0) this.closed = true;
            else if(data === 1) this.port.postMessage(this.data);
        };
    }
    process(inputs, outputs, parameters) {
        const {closed, data} = this;
        if(closed) return false;
        const input = inputs[0],
              output = outputs[0];
        for(const i of data.keys()) {
            const buf = input[i];
            output[i].set(buf);
            data[i].push(buf.slice());
        }
        return true;
    }
}
registerProcessor('Record', Record);
