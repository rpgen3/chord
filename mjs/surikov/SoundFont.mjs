// https://github.com/surikov/webaudiofontdata/
import {getScript} from 'https://rpgen3.github.io/mylib/export/import.mjs';
export class SoundFont {
    static afterTime = 0.5; // echo?
    static fonts = new Map;
    static ch = -1;
    static toURL(fontName){
        return `https://surikov.github.io/webaudiofontdata/sound/${fontName}.js`;
    }
    static async load({
        ctx,
        fontName,
        url,
        isDrum = false,
        pitchs
    }){
        if(!(fontName in window)) await getScript(url);
        if(!(fontName in window)) throw 'SoundFont is not found.';
        const {fonts} = this;
        if(!fonts.has(fontName)) {
            const zones = new Map;
            let ch = -1;
            for(const [pitch, v] of (
                await findZone(ctx, window[fontName].zones, pitchs)
            )) {
                const {numberOfChannels} = v.buffer;
                if(ch < numberOfChannels) ch = numberOfChannels;
                zones.set(Number(pitch), v);
            }
            if(this.ch < ch) this.ch = ch;
            fonts.set(fontName, new this(zones, ch, isDrum));
        }
        return fonts.get(fontName);
    }
    constructor(zones, ch, isDrum){
        this.zones = zones;
        this.ch = ch;
        this.isDrum = isDrum;
    }
    play({
        ctx = new AudioContext,
        destination = ctx.destination,
        pitch = 60, // C4
        volume = 1.0, // 0.0 ~ 1.0
        when = 0.0,
        duration = 1.0
    }={}){
        const {zones, isDrum} = this;
        if(!zones.has(pitch)) return;
        const zone = zones.get(pitch),
              src = ctx.createBufferSource(),
              g = ctx.createGain(),
              _when = when + ctx.currentTime,
              {buffer, _param} = zone;
        src.buffer = buffer;
        g.gain.value = volume;
        src.playbackRate.setValueAtTime(_param.playbackRate, 0);
        Object.assign(src, _param.src);
        const _duration = duration + this.constructor.afterTime,
              end = _when + (isDrum ? buffer.duration : (src.loop ? _duration : Math.min(_duration, _param.max)));
        if(!isDrum) g.gain.linearRampToValueAtTime(0, end);
        src.connect(g).connect(destination);
        src.start(_when);
        src.stop(end);
    }
}
const findZone = (ctx, zones, pitchs = []) => {
    if(!pitchs.length) for(const zone of zones) {
        const low = zone.keyRangeLow | 0,
              high = zone.keyRangeHigh | 0;
        if(low > high) continue;
        for(let i = low; i <= high; i++) pitchs.push(i);
    }
    const set = new Set(pitchs),
          map = new Map(pitchs.map(v => [v, zones[0]]));
    for (let i = zones.length - 1; i >= 0; i--) for(const v of set) {
        const zone = zones[i];
        if (v < zone.keyRangeLow || v > zone.keyRangeHigh + 1) continue;
        set.delete(v);
        map.set(v, {...zone});
    }
    return Promise.all([...map].map(async ([k, v]) => {
        await adjustZone(ctx, v)
        await addParam(v, k);
        return [k, v];
    }));
};
const adjustZone = async (ctx, zone) => {
    if (zone.buffer) return;
    zone.delay = 0;
    if (zone.sample) {
        const decoded = atob(zone.sample);
        zone.buffer = ctx.createBuffer(1, decoded.length / 2, zone.sampleRate);
        const a = zone.buffer.getChannelData(0);
        for (let i = 0; i < decoded.length / 2; i++) {
            let b1 = decoded.charCodeAt(i * 2),
                b2 = decoded.charCodeAt(i * 2 + 1);
            if (b1 < 0) b1 = 0x100 + b1;
            if (b2 < 0) b2 = 0x100 + b2;
            let n = b2 * 0x100 + b1;
            if (n >= 0x10000 / 2) n = n - 0x10000;
            a[i] = n / 0x10000;
        }
    }
    else if (zone.file) {
        const buf = Uint8Array.from(atob(zone.file), c => c.charCodeAt()).buffer;
        zone.buffer = await ctx.decodeAudioData(buf);
    }
    for(const [k, v] of [
        ['loopStart', 0],
        ['loopEnd', 0],
        ['coarseTune', 0],
        ['fineTune', 0],
        ['originalPitch', 6000],
        ['sampleRate', 44100],
        ['sustain', 0]
    ]) if(Number.isNaN(Number(zone[k]))) zone[k] = v;
};
const addParam = (zone, pitch) => {
    const {
        originalPitch,
        keyRangeLow,
        keyRangeHigh,
        loopStart,
        loopEnd,
        coarseTune,
        fineTune,
        sampleRate,
        delay,
        buffer
    } = zone,
          baseDetune = originalPitch - 100 * coarseTune - fineTune,
          playbackRate = Math.pow(2, (100 * pitch - baseDetune) / 1200),
          max = buffer.duration / playbackRate,
          src = {
              loop: loopStart >= 1 && loopStart < loopEnd
          };
    if(src.loop) [src.loopStart, src.loopEnd] = [loopStart, loopEnd].map(v => v / sampleRate + delay);
    zone._param = {playbackRate, max, src};
};
