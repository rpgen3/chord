const {getScript} = await import('https://rpgen3.github.io/mylib/export/import.mjs');
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
                      ctx = new AudioContext();
                return [k, {ctx, buf: await ctx.decodeAudioData(buf)}];
            }))
        );
    }
    play(note){
        const {notes} = this;
        if(!notes.has(note)) return;
        const {ctx, buf} = notes.get(note),
              src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start();
    }
};
