import {getScript} from 'https://rpgen3.github.io/mylib/export/import.mjs';
import {flat2sharp} from 'https://rpgen3.github.io/chord/mjs/flat2sharp.mjs';
if(!('MIDI' in window)) window.MIDI = {};
if(!('Soundfont' in window.MIDI)) window.MIDI.Soundfont = {};
export class SoundFont {
    static ctx = null;
    static fonts = new Map;
    static ch = 1;
    static anyNode = null; // user custom
    static init(){ // must done after user gesture
        this.ctx?.close();
        this.ctx = new AudioContext();
    }
    static async load({fontName, url, isDrum = false}){
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
            if(this.ch < ch) this.ch = ch;
            fonts.set(fontName, new SoundFont(bufs, ch, isDrum));
        }
        return fonts.get(fontName);
    }
    constructor(bufs, ch, isDrum){
        this.bufs = bufs;
        this.ch = ch;
        this.isDrum = isDrum;
        this.min = 0.5;
    }
    play({note = 'C4', volume = 1.0, when = 0.0, duration = 1.0}={}){
        const {bufs} = this;
        if(!bufs.has(note)) return;
        const buf = bufs.get(note),
              {ctx, anyNode} = SoundFont,
              src = ctx.createBufferSource(),
              g = ctx.createGain(),
              _when = when + ctx.currentTime;
        src.buffer = buf;
        g.gain.value = volume;
        if(!this.isDrum) g.gain.linearRampToValueAtTime(0, _when + Math.min(buf.duration, Math.max(this.min, duration)));
        src.connect(g);
        if(anyNode) g.connect(anyNode).connect(ctx.destination);
        else g.connect(ctx.destination);
        src.start(_when);
    }
}
