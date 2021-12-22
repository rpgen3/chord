export class RecordWorklet {
    constructor({ctx, ch = 2}){
        this.node = new AudioWorkletNode(ctx, 'Record', {
            processorOptions: {ch}
        });
    }
    async init(ctx){
        await ctx.audioWorklet.addModule('https://rpgen3.github.io/chord/worklet/Record.js');
    }
    close(){
        this.node.port.postMessage(0);
    }
    async getData(){
        return new Promise(resolve => {
            this.node.port.onmessage = ({data}) => {
                resolve(data);
            };
            this.node.port.postMessage(1);
        });
    }
}
