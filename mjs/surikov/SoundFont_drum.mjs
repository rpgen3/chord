import {SoundFont} from 'https://rpgen3.github.io/soundfont/mjs/surikov/SoundFont.mjs';
const touch = (map, key, ctor) => {
    if(!map.has(key)) map.set(key, new ctor);
    return map.get(key);
};
export const SoundFont_drum = new class {
    constructor(){
        this.font = null;
        this.fonts = new Map;
    }
    async load({ctx, font, id, keys}){
        const map = touch(touch(this.fonts, font, Map), id, Map);
        if(!map.size) {
            for(const [tone, sf] of (
                await Promise.all([...keys].map(async key => {
                    const fontName = `${key}_${id}_${font}`;
                    return [
                        key,
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
        const {pitch} = v;
        if(font.has(pitch)) font.get(pitch).play(v);
    }
};
