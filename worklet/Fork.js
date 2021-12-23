class Fork extends AudioWorkletProcessor {
    constructor(options) {
        super(options);
        this.ch = options.outputChannelCount[0];
    }
    process([input], outputs) {
        const min = Math.min(input.length, this.ch);
        for(let i = 0; i < min; i++) for(const output of outputs) output[i].set(input[i]);
        return true;
    }
}
registerProcessor('Fork', Fork);
