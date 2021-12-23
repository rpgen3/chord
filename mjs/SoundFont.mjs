import {getScript} from 'https://rpgen3.github.io/mylib/export/import.mjs';
import {flat2sharp} from 'https://rpgen3.github.io/chord/mjs/flat2sharp.mjs';
if(!('MIDI' in window)) window.MIDI = {};
if(!('Soundfont' in window.MIDI)) window.MIDI.Soundfont = {};
class Font {
    constructor({bufs, ch}){
        this.bufs = bufs;
        this.ch = ch;
    }
}
export class SoundFont {
    static ctx = null;
    static fonts = new Map;
    static anyNode = null;
    static init(){ // must done after user gesture
        this.ctx?.close();
        this.ctx = new AudioContext();
    }
    static async load(fontName, url){
        const {Soundfont} = window.MIDI;
        if(!(fontName in Soundfont)) await getScript(url);
        if(!(fontName in Soundfont)) throw 'SoundFont is not found.';
        const {fonts} = this;
        if(!fonts.has(fontName)) {
            let ch = -1;
            const bufs = new Map(await Promise.all(
                Object.entries(window.MIDI.Soundfont[fontName]).map(async ([k, v]) => {
                    const res = await fetch(v),
                          buf = await res.arrayBuffer(),
                          _buf = await SoundFont.ctx.decodeAudioData(buf),
                          {numberOfChannels} = _buf;
                    if(ch < numberOfChannels) ch = numberOfChannels;
                    return [flat2sharp(k), _buf];
                })
            ));
            fonts.set(fontName, new Font({bufs, ch}));
        }
        return fonts.get(fontName);
    }
    constructor(isDrum = false){
        this.font = null;
        this.isDrum = isDrum;
        this.min = 0.5;
    }
    async load(fontName, url){ // https://github.com/gleitz/midi-js-soundfonts
        this.font = await SoundFont.load(fontName, url);
    }
    play(note = 'C4', volume = 1.0, duration = 1.0){
        const {bufs} = this.font;
        if(!bufs.has(note)) return;
        const buf = bufs.get(note),
              {ctx, anyNode} = SoundFont,
              src = ctx.createBufferSource(),
              g = ctx.createGain();
        src.buffer = buf;
        g.gain.value = volume;
        if(!this.isDrum) g.gain.linearRampToValueAtTime(0, ctx.currentTime + Math.min(buf.duration, Math.max(this.min, duration)));
        src.connect(g);
        if(anyNode) g.connect(anyNode).connect(ctx.destination);
        else g.connect(ctx.destination);
        src.start();
    }
}
