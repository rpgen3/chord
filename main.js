(async () => {
    const {importAll, getScript} = await import('https://rpgen3.github.io/mylib/export/import.mjs');
    await Promise.all([
        'https://code.jquery.com/jquery-3.3.1.min.js',
        'https://colxi.info/midi-parser-js/src/main.js'
    ].map(getScript));
    const {$, MidiParser} = window;
    const html = $('body').empty().css({
        'text-align': 'center',
        padding: '1em',
        'user-select': 'none'
    });
    const head = $('<header>').appendTo(html),
          main = $('<main>').appendTo(html),
          foot = $('<footer>').appendTo(html);
    $('<h1>').appendTo(head).text('/soundfont/');
    const rpgen3 = await importAll([
        'random',
        'input',
        'css',
        'util',
        'str2img'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    const rpgen4 = await importAll([
        'https://rpgen3.github.io/maze/mjs/heap/Heap.mjs',
        'https://rpgen3.github.io/midi/mjs/piano.mjs',
        [
            'Record',
            'RecordWorklet',
            'toWAV',
            'audioNode',
        ].map(v => `https://rpgen3.github.io/soundfont/mjs/${v}.mjs`)
    ].flat());
    const g_sf = {
        gleitz: await import('https://rpgen3.github.io/soundfont/mjs/gleitz/SoundFont.mjs'),
        surikov: await importAll([
            'SoundFont',
            'SoundFont_drum',
            'SoundFont_list'
        ].map(v => `https://rpgen3.github.io/soundfont/mjs/surikov/${v}.mjs`))
    };
    [
        'container',
        'btn'
    ].map(v => `https://rpgen3.github.io/spatialFilter/css/${v}.css`).map(rpgen3.addCSS);
    const fetchList = async ttl => {
        const res = await fetch(`https://rpgen3.github.io/soundfont/list/${ttl}.txt`),
              str = await res.text();
        return str.trim().split('\n');
    };
    const hideTime = 500;
    const addHideArea = (label, parentNode = main) => {
        const html = $('<div>').addClass('container').appendTo(parentNode);
        const input = rpgen3.addInputBool(html, {
            label,
            save: true,
            value: true
        });
        const area = $('<dl>').appendTo(html);
        input.elm.on('change', () => input() ? area.show(hideTime) : area.hide(hideTime)).trigger('change');
        return Object.assign(input, {
            get html(){
                return area;
            }
        });
    };
    const notSelected = 'not selected',
          {audioNode} = rpgen4;
    let SoundFont = null,
        sf = null;
    {
        const {html} = addHideArea('load SoundFont'),
              surikov = 'surikov',
              gleitz = 'gleitz';
        const selectAuthor = rpgen3.addSelect(html, {
            label: 'author',
            save: true,
            list: [surikov, gleitz]
        });
        const selectFont = rpgen3.addSelect(html, {
            label: 'select SoundFont'
        });
        const selectInstrument = rpgen3.addSelect(html, {
            label: 'select instrument'
        });
        selectAuthor.elm.on('change', async () => {
            const author = selectAuthor();
            if(author === surikov) {
                selectFont.elm.show(hideTime);
                selectFont.update([notSelected, ...g_sf.surikov.SoundFont_list.tone.keys()], notSelected);
                selectInstrument.update([notSelected], notSelected);
            }
            else {
                selectFont.elm.hide(hideTime);
                selectInstrument.update([notSelected, ...await fetchList(`fontName_${author}`)], notSelected);
            }
            SoundFont = g_sf[author].SoundFont;
        }).trigger('change');
        g_sf.surikov.SoundFont_list.onload(() => selectAuthor.elm.trigger('change'));
        selectFont.elm.on('change', async () => {
            const font = selectFont();
            if(font === notSelected) return;
            const map = new Map((
                await fetchList(`fontName_${surikov}`)
            ).map(v => {
                const a = v.split(' ');
                return [a[0].slice(0, 3), a.slice(1).join(' ')];
            }));
            selectInstrument.update([
                [notSelected, notSelected],
                ...[...g_sf.surikov.SoundFont_list.tone.get(font).keys()].map(id => {
                    const _id = id.slice(0, 3);
                    return [map.has(_id) ? map.get(_id) : id, id];
                })
            ], notSelected);
        });
        selectInstrument.elm.on('change', async () => {
            const ins = selectInstrument();
            if(ins === notSelected) return;
            const e = [selectAuthor, selectFont, selectInstrument].map(v => v.elm).reduce((p, x) => p.add(x));
            e.prop('disabled', true);
            try {
                const author = selectAuthor(),
                      fontName = author === surikov ? `${ins}_${selectFont()}` : ins;
                sf = await SoundFont.load({
                    ctx: audioNode.ctx,
                    fontName: author === surikov ? `_tone_${fontName}` : fontName,
                    url: SoundFont.toURL(fontName)
                });
            }
            catch (err) {
                console.error(err);
                alert(err);
            }
            e.prop('disabled', false);
        });
        const inputVolume = rpgen3.addInputNum(html, {
            label: 'sound volume',
            save: true
        });
        inputVolume.elm.on('input', () => {
            audioNode.note.gain.value = inputVolume() / 100;
        }).trigger('input');
    }
    {
        const {html} = addHideArea('load drum');
        const selectFont = rpgen3.addSelect(html, {
            label: 'select SoundFont'
        });
        const selectId = rpgen3.addSelect(html, {
            label: 'select drum'
        });
        g_sf.surikov.SoundFont_list.onload(() => {
            selectFont.update([notSelected, ...g_sf.surikov.SoundFont_list.drum.keys()], notSelected);
        });
        selectFont.elm.on('change', () => {
            const font = selectFont();
            if(font === notSelected) return;
            selectId.update([notSelected, ...g_sf.surikov.SoundFont_list.drum.get(font).keys()], notSelected);
        });
        selectId.elm.on('change', () => {
            const font = selectFont(),
                  id = selectId();
            if(font === notSelected || id === notSelected) return;
            const keys = g_sf.surikov.SoundFont_list.drum.get(font).get(id);
            load(font, id, keys);
        });
        const load = async (font, id, keys) => {
            const e = [selectFont, selectId].map(v => v.elm).reduce((p, x) => p.add(x));
            e.prop('disabled', true);
            try {
                await g_sf.surikov.SoundFont_drum.load({
                    ctx: audioNode.ctx,
                    font, id, keys
                });
            }
            catch (err) {
                console.error(err);
                alert('failed loading');
            }
            e.prop('disabled', false);
        };
        const inputVolume = rpgen3.addInputNum(html, {
            label: 'drum volume',
            save: true
        });
        inputVolume.elm.on('input', () => {
            audioNode.drum.gain.value = inputVolume() / 100;
        }).trigger('input');
    }
    g_sf.surikov.SoundFont_list.init();
    {
        const {html} = addHideArea('play MIDI');
        const selectMidi = rpgen3.addSelect(html, {
            label: 'sample'
        });
        fetchList('midi').then(v => selectMidi.update([
            Array(2).fill(notSelected),
            ...v.map(v => v.split(' ').reverse())
        ], notSelected));
        selectMidi.elm.on('change', async () => {
            const v = selectMidi();
            if(v === notSelected) return;
            const e = selectMidi.elm.add(inputFile);
            e.prop('disabled', true);
            parseMidi(MidiParser.parse(rpgen3.img2arr(
                await rpgen3.loadSrc('img', `https://i.imgur.com/${v}.png`)
            )));
            e.prop('disabled', false);
        });
        $('<dt>').appendTo(html).text('input file');
        const inputFile = $('<input>').appendTo($('<dd>').appendTo(html)).prop({
            type: 'file',
            accept: '.mid'
        });
        MidiParser.parse(inputFile.get(0), v => parseMidi(v));
        $('<dd>').appendTo(html);
        rpgen3.addBtn(html, 'play', () => playMidi()).addClass('btn');
        rpgen3.addBtn(html, 'stop unforced', () => clearInterval(intervalId)).addClass('btn');
        rpgen3.addBtn(html, 'stop', () => stopMidi()).addClass('btn');
    }
    const timeline = [],
          planTime = 0.1,
          coolTime = 0.5;
    let intervalId = -1;
    const playMidi = async () => {
        stopMidi();
        await record.init();
        startTime = audioNode.ctx.currentTime - timeline[0].when + coolTime;
        nowIndex = 0;
        intervalId = setInterval(update);
    };
    const stopMidi = () => {
        clearInterval(intervalId);
        audioNode.init();
    };
    let startTime = 0,
        endTime = 0,
        nowIndex = 0;
    const update = () => {
        const time = audioNode.ctx.currentTime - startTime;
        if(time > endTime) {
            record.close();
            return stopMidi();
        }
        while(nowIndex < timeline.length){
            const {ch, pitch, volume, when, duration} = timeline[nowIndex],
                  _when = when - time;
            if(_when > planTime) break;
            nowIndex++;
            if(_when < 0) continue;
            const param = {
                pitch,
                volume,
                when: _when,
                duration
            };
            if(ch === 9) g_sf.surikov.SoundFont_drum.play({
                ctx: audioNode.ctx,
                destination: audioNode.drum,
                ...param
            });
            else sf?.play({
                ctx: audioNode.ctx,
                destination: audioNode.note,
                ...param
            });
        }
    };
    const getBPM = midi => {
        const {track} = midi;
        let bpm = 0;
        for(const {event} of track) {
            for(const v of event) {
                if(v.type !== 0xFF || v.metaType !== 0x51) continue;
                bpm = 6E7 / v.data;
                break;
            }
            if(bpm) break;
        }
        if(bpm) return bpm;
        else throw 'BPM is none.';
    };
    const parseMidi = async midi => { // pitch, volume, duration
        stopMidi();
        const {track, timeDivision} = midi,
              heap = new rpgen4.Heap();
        for(const {event} of track) {
            const now = new Map;
            let currentTime = 0;
            for(const {deltaTime, type, data, channel} of event) { // 全noteを回収
                currentTime += deltaTime;
                if(type !== 8 && type !== 9) continue;
                const [pitch, velocity] = data,
                      isNoteOFF = type === 8 || !velocity;
                if(now.has(pitch) && isNoteOFF) {
                    const unit = now.get(pitch);
                    unit.end = currentTime;
                    heap.push(unit.start, unit);
                    now.delete(pitch);
                }
                else if(!isNoteOFF) now.set(pitch, new MidiUnit({
                    ch: channel,
                    pitch,
                    velocity,
                    start: currentTime
                }));
            }
        }
        while(timeline.length) timeline.pop();
        endTime = 0;
        const deltaToSec = 60 / getBPM(midi) / timeDivision;
        for(const {ch, pitch, velocity, start, end} of heap) {
            const [_start, _end] = [start, end].map(v => v * deltaToSec);
            timeline.push(new AudioUnit({
                ch,
                pitch,
                volume: velocity / 0x7F,
                when: _start,
                duration: _end - _start
            }));
            if(endTime < _end) endTime = _end;
        }
        endTime += coolTime;
    };
    class MidiUnit {
        constructor({ch, pitch, velocity, start}){
            this.ch = ch;
            this.pitch = pitch;
            this.velocity = velocity;
            this.start = start;
            this.end = -1;
        }
    }
    class AudioUnit {
        constructor({ch, pitch, volume, when, duration}){
            this.ch = ch;
            this.pitch = pitch;
            this.volume = volume;
            this.when = when;
            this.duration = duration;
        }
    }
    const record = {};
    {
        const {html} = addHideArea('record play');
        const selectAPI = rpgen3.addSelect(html, {
            label: 'API',
            save: true,
            list: {
                'AudioWorklet': true,
                'ScriptProcessor': false
            }
        });
        const inputCh = rpgen3.addSelect(html, {
            label: 'channel',
            save: true,
            list: {
                'auto': 0,
                'monaural': 1,
                'stereo': 2
            }
        });
        const inputBitRate = rpgen3.addSelect(html, {
            label: 'bitRate',
            save: true,
            list: [8, 16, 24, 32],
            value: 16
        });
        let rec = null;
        rpgen3.addBtn(html, 'download', async () => {
            rpgen3.download(rpgen4.toWAV({
                data: await rec.data,
                sampleRate: audioNode.ctx.sampleRate,
                bitRate: inputBitRate()
            }), 'soundfont.wav');
        }).addClass('btn');
        const isRecord = rpgen3.addInputBool(html, {
            label: 'start record'
        });
        const init = async () => {
            if(!isRecord()) return true;
            const {ctx} = audioNode;
            const p = {ctx, ch: inputCh() ? inputCh() : SoundFont.ch};
            if(selectAPI()) {
                await rpgen4.RecordWorklet.init(ctx);
                rec = new rpgen4.RecordWorklet(p);
            }
            else rec = new rpgen4.Record(p);
            audioNode.connect(rec.node);
        };
        const close = () => rec?.close();
        Object.assign(record, {init, close});
        isRecord.elm.on('change', async () => {
            if(await init()) {
                close();
                audioNode.connect();
            }
        });
    }
})();
