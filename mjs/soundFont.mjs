// https://github.com/gleitz/midi-js-soundfonts
import {getScript} from 'https://rpgen3.github.io/mylib/export/import.mjs';
import {flat2sharp} from 'https://rpgen3.github.io/chord/mjs/flat2sharp.mjs';
export const soundFont = new class {
    constructor(){
        this.loaded = new Set;
        this.notes = new Map;
    }
    async load(fontName, url){
        const {loaded} = this;
        if(!loaded.has(url)) {
            loaded.add(url);
            await getScript(url);
        }
        this.notes = new Map(
            await Promise.all(Object.entries(window.MIDI.Soundfont[fontName]).map(async ([k, v]) => {
                const res = await fetch(v),
                      buf = await res.arrayBuffer(),
                      ctx = new AudioContext(),
                      _buf = await ctx.decodeAudioData(buf);
                this._play({ctx, buf: _buf, volume = 0.01});
                return [flat2sharp(k), {ctx, buf: _buf}];
            }))
        );
    }
    _play({ctx, buf, volume = 1.0}){
        const src = ctx.createBufferSource(),
              gain = ctx.createGain();
        src.buffer = buf;
        gain.gain.value = volume;
        src.connect(gain).connect(ctx.destination);
        src.start();
    }
    play(note, volume = 1.0){
        const {notes} = this;
        if(notes.has(note)) this._play(Object.assign({volume}, notes.get(note)));
    }
};
