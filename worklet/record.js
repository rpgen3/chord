class record extends AudioWorkletProcessor {
    constructor() {
        super();
        this.data = [];
    }
    process(inputs, outputs) {
        const input = inputs[0][0],
              output = outputs[0][0],
              {data} = this;
        for (let i = 0; i < output.length; i++) data.push(output[i] = input[i]);
        return true;
    }
}
registerProcessor('record', record);
