import {getScript} from 'https://rpgen3.github.io/mylib/export/import.mjs';
import {flat2sharp} from 'https://rpgen3.github.io/chord/mjs/flat2sharp.mjs';
export class SoundFont {
    constructor(){
        this.ctx = null;
        this.bufs = new Map;
        this.ch = -1;
        this.anyNode = null;
        if(!('MIDI' in window)) window.MIDI = {};
        if(!('Soundfont' in window.MIDI)) window.MIDI.Soundfont = {};
    }
    init(){ // must done after user gesture
        if(!this.ctx) this.ctx = new AudioContext();
    }
    async load(fontName, url){ // https://github.com/gleitz/midi-js-soundfonts
        this.init();
        const {ctx, bufs} = this,
              {Soundfont} = window.MIDI;
        if(!(fontName in Soundfont)) await getScript(url);
        if(!(fontName in Soundfont)) throw `${fontName} is not found`;
        bufs.clear();
        this.ch = -1;
        for(const v of (
            await Promise.all(Object.entries(Soundfont[fontName]).map(async ([k, v]) => {
                const res = await fetch(v),
                      buf = await res.arrayBuffer(),
                      _buf = await ctx.decodeAudioData(buf),
                      {numberOfChannels} = _buf;
                if(this.ch > numberOfChannels) this.ch = numberOfChannels;
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
        if(this.anyNode) src.connect(gain).connect(this.anyNode).connect(ctx.destination);
        else src.connect(gain).connect(ctx.destination);
        src.start();
    }
    async stop(){
        await this.ctx?.close();
        this.ctx = null;
        this.init();
    }
};
