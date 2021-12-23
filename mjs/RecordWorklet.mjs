export class RecordWorklet {
    static init(ctx){
        return ctx.audioWorklet.addModule('https://rpgen3.github.io/chord/worklet/Record.js');
    }
    constructor({ctx, ch = 2}){
        this.node = new AudioWorkletNode(ctx, 'Record', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [ch]
        });
    }
    close(){
        this.node.port.postMessage(0);
    }
    async getData(){
        return new Promise(resolve => {
            this.node.port.onmessage = ({data}) => resolve(data);
            this.node.port.postMessage(1);
        });
    }
}
