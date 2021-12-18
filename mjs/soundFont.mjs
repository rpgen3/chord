// https://github.com/gleitz/midi-js-soundfonts
import {getScript} from 'https://rpgen3.github.io/mylib/export/import.mjs';
import {flat2sharp} from 'https://rpgen3.github.io/chord/mjs/flat2sharp.mjs';
export const soundFont = new class {
    constructor(){
        this.loaded = new Set;
        this.bufs = new Map;
        this.ctx = null;
    }
    init(){ // must done after user gesture
        if(!this.ctx) this.ctx = new AudioContext();
    }
    async load(fontName, url){
        this.init();
        const {loaded, bufs, ctx} = this;
        if(!loaded.has(url)) {
            loaded.add(url);
            await getScript(url);
        }
        bufs.clear();
        for(const v of (
            await Promise.all(Object.entries(window.MIDI.Soundfont[fontName]).map(async ([k, v]) => {
                const res = await fetch(v),
                      buf = await res.arrayBuffer(),
                      _buf = await ctx.decodeAudioData(buf);
                return [flat2sharp(k), _buf];
            }))
        )) bufs.set(...v);
    }
    play(note = 'C4', volume = 1.0, duration = 0.5){
        const {bufs, ctx} = this;
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
