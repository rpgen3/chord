import {ForkWorklet} from 'https://rpgen3.github.io/chord/mjs/ForkWorklet.mjs';
export class RecordWorklet {
    static init(ctx){
        return Promise.all([
            ForkWorklet.init(),
            ctx.audioWorklet.addModule('https://rpgen3.github.io/chord/worklet/Record.js')
        ]);
    }
    constructor({ctx, ch = 2}){
        const forkNode = ForkWorklet({ctx, ch});
        const recNode = new AudioWorkletNode(ctx, 'Record', {
            numberOfInputs: 1,
            numberOfOutputs: 0,
            processorOptions: {ch}
        });
        forkNode.connect(recNode);
        this.node = forkNode;
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
