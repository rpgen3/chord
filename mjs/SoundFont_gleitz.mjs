// https://github.com/gleitz/midi-js-soundfonts/
import {getScript} from 'https://rpgen3.github.io/mylib/export/import.mjs';
import {flat2sharp} from 'https://rpgen3.github.io/chord/mjs/flat2sharp.mjs';
if(!('MIDI' in window)) window.MIDI = {};
if(!('Soundfont' in window.MIDI)) window.MIDI.Soundfont = {};
export class SoundFont_gleitz {
    static ctx = null;
    static fonts = new Map;
    static ch = -1;
    static anyNode = null; // user custom
    static init(){ // must done after user gesture
        this.ctx?.close();
        this.ctx = new AudioContext();
    }
    static toURL(fontName){
        return `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${fontName}-mp3.js`;
    }
    static async load({fontName, url, isDrum = false}){
        const {Soundfont} = window.MIDI;
        if(!(fontName in Soundfont)) await getScript(url);
        if(!(fontName in Soundfont)) throw 'SoundFont is not found.';
        const {fonts, ctx} = this;
        if(!fonts.has(fontName)) {
            let ch = -1;
            const bufs = new Map(await Promise.all(
                Object.entries(window.MIDI.Soundfont[fontName]).map(async ([k, v]) => {
                    const res = await fetch(v),
                          buf = await res.arrayBuffer(),
                          _buf = await ctx.decodeAudioData(buf),
                          {numberOfChannels} = _buf;
                    if(ch < numberOfChannels) ch = numberOfChannels;
                    return [flat2sharp(k), _buf];
                })
            ));
            if(this.ch < ch) this.ch = ch;
            fonts.set(fontName, new this(bufs, ch, isDrum));
        }
        return fonts.get(fontName);
    }
    constructor(bufs, ch, isDrum){
        this.bufs = bufs;
        this.ch = ch;
        this.isDrum = isDrum;
        this.min = 0.5;
    }
    play({
        ctx = this.constructor.ctx,
        note = 'C4',
        volume = 1.0,
        when = 0.0,
        duration = 1.0
    }={}){
        const {bufs} = this;
        if(!bufs.has(note)) return;
        const buf = bufs.get(note),
              src = ctx.createBufferSource(),
              g = ctx.createGain(),
              _when = when + ctx.currentTime,
              end = _when + Math.min(buf.duration, Math.max(this.min, duration));
        src.buffer = buf;
        g.gain.value = volume;
        if(!this.isDrum) g.gain.linearRampToValueAtTime(0, end);
        src.connect(g);
        const {anyNode} = this.constructor;
        if(anyNode) g.connect(anyNode).connect(ctx.destination);
        else g.connect(ctx.destination);
        src.start(_when);
        src.stop(end);
    }
}
