import {getScript} from 'https://rpgen3.github.io/mylib/export/import.mjs';
import {flat2sharp} from 'https://rpgen3.github.io/chord/mjs/flat2sharp.mjs';
export class SoundFont {
    constructor(){
        this.ctx = null;
        this.bufs = new Map;
    }
    init(){ // must done after user gesture
        if(!this.ctx) this.ctx = new AudioContext();
    }
    async load(fontName, url){ // https://github.com/gleitz/midi-js-soundfonts
        this.init();
        const {ctx, bufs} = this;
        if(!(fontName in window.MIDI?.Soundfont)) await getScript(url);
        const {SoundFont} = window.MIDI;
        if(!(fontName in Soundfont)) throw `${fontName} is not found`;
        bufs.clear();
        for(const v of (
            await Promise.all(Object.entries(Soundfont[fontName]).map(async ([k, v]) => {
                const res = await fetch(v),
                      buf = await res.arrayBuffer(),
                      _buf = await ctx.decodeAudioData(buf);
                return [flat2sharp(k), _buf];
            }))
        )) bufs.set(...v);
    }
    play(note = 'C4', volume = 1.0, duration = 0.5){
        const {ctx, bufs} = this;
        if(!bufs.has(note)) return;
        const buf = bufs.get(note),
              src = ctx.createBufferSource(),
              gain = ctx.createGain();
        src.buffer = buf;
        gain.gain.value = volume;
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + Math.min(buf.duration, duration * 2));
        src.connect(gain).connect(ctx.destination);
        src.start();
    }
    async stop(){
        await this.ctx?.close();
        this.ctx = null;
        this.init();
    }
};
