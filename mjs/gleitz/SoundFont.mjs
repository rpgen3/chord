// https://github.com/gleitz/midi-js-soundfonts/
import {getScript} from 'https://rpgen3.github.io/mylib/export/import.mjs';
import {flat2sharp} from 'https://rpgen3.github.io/midi/mjs/flat2sharp.mjs';
import {piano} from 'https://rpgen3.github.io/midi/mjs/piano.mjs';
if(!('MIDI' in window)) window.MIDI = {};
if(!('Soundfont' in window.MIDI)) window.MIDI.Soundfont = {};
export class SoundFont {
    static fonts = new Map;
    static ch = -1;
    static toURL(fontName){
        return `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${fontName}-mp3.js`;
    }
    static async load({
        ctx,
        fontName,
        url,
        isDrum = false
    }){
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
                          _buf = await ctx.decodeAudioData(buf),
                          {numberOfChannels} = _buf;
                    if(ch < numberOfChannels) ch = numberOfChannels;
                    return [piano.note2index(flat2sharp(k)) + 21, _buf];
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
        ctx = new AudioContext,
        destination = ctx.destination,
        pitch = 60, // C4
        volume = 1.0, // 0.0 ~ 1.0
        when = 0.0,
        duration = 1.0
    }={}){
        const {bufs, isDrum} = this;
        if(!bufs.has(pitch)) return;
        const buf = bufs.get(pitch),
              src = ctx.createBufferSource(),
              g = ctx.createGain(),
              _when = when + ctx.currentTime,
              end = _when + (isDrum ? buf.duration : Math.min(buf.duration, Math.max(this.min, duration)));
        src.buffer = buf;
        g.gain.value = volume;
        if(!isDrum) g.gain.linearRampToValueAtTime(0, end);
        src.connect(g).connect(destination);
        src.start(_when);
        src.stop(end);
    }
}
