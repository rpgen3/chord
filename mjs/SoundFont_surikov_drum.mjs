import {piano} from 'https://rpgen3.github.io/midi/mjs/piano.mjs';
import {SoundFont_surikov} from 'https://rpgen3.github.io/chord/mjs/SoundFont_surikov.mjs';
const touch = (map, key, ctor) => {
    if(!map.has(key)) map.set(key, new ctor);
    return map.get(key);
};
const SoundFont_surikov_drum = new class {
    constructor(){
        this.font = null;
        this.fonts = new Map;
    }
    async load({ctx, font, id}){
        const map = touch(touch(this.fonts, font, Map), id, Map);
        if(!map.size) {
            for(const [tone, sf] of (
                await Promise.all(map.get(id).map(async key => {
                    const fontName = `${key}_${id}_${font}`;
                    return [
                        piano.note[key - 21],
                        await SoundFont_surikov.load({
                            ctx,
                            fontName: `_drum_${fontName}`,
                            url: `https://surikov.github.io/webaudiofontdata/sound/128${fontName}.js`,
                            isDrum: true,
                            pitchs: [key]
                        })
                    ];
                }))
            )) map.set(tone, sf);
        }
        this.font = map;
    }
    play(v){
        const {font} = this;
        if(!font) return;
        const {note} = v;
        if(font.has(note)) font.get(note).play(v);
    }
};
