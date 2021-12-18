class record extends AudioWorkletProcessor {
    constructor() {
        super();
        const sampleRate = 48000;
        this.buf = new Float32Array(sampleRate * 20);
        this.offset = 0;
    }
    process(inputs, outputs) {
        const input = inputs[0],
              output = outputs[0];
        if (this.offset < this.buf.length - input[0].length) {
            this.buf.set(input[0], this.offset);
            this.offse += input[0].length;
        }
        for (let ch = 0; ch < input.length; ++ch) output[ch].set(input[ch]);
        return true;
    }
}
registerProcessor('record', record);
