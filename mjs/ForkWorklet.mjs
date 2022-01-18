export class ForkWorklet {
    static init(ctx){
        return ctx.audioWorklet.addModule('https://rpgen3.github.io/soundfont/worklet/Fork.js');
    }
    constructor({ctx, ch = 2}){
        this.node = new AudioWorkletNode(ctx, 'Fork', {
            numberOfInputs: 1,
            numberOfOutputs: 2,
            outputChannelCount: [ch, ch]
        });
    }
}
