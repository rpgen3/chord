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
    $('<h1>').appendTo(head).text('chord');
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
            'chord',
            'inversion',
            'Record',
            'RecordWorklet',
            'toWAV',
            'SoundFont_gleitz',
            'SoundFont_surikov'
        ].map(v => `https://rpgen3.github.io/chord/mjs/${v}.mjs`)
    ].flat());
    [
        'container',
        'btn'
    ].map(v => `https://rpgen3.github.io/spatialFilter/css/${v}.css`).map(rpgen3.addCSS);
    const fetchList = async ttl => {
        const res = await fetch(`https://rpgen3.github.io/chord/list/${ttl}.txt`),
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
    const authorNames = [
        'gleitz',
        'surikov'
    ];
    const SoundFonts = authorNames.map(v => rpgen4[`SoundFont_${v}`]);
    let SoundFont = null,
        sf = null;
    const notSelected = 'not selected';
    let gainNodeNote = {gain: {}};
    {
        const {html} = addHideArea('load SoundFont');
        const selectAuthor = rpgen3.addSelect(html, {
            label: 'author',
            save: true,
            list: [...authorNames.entries()].map(v => v.reverse())
        });
        const selectFont = rpgen3.addSelect(html, {
            label: 'select SoundFont'
        });
        selectAuthor.elm.on('change', async () => {
            const i = selectAuthor(),
                  list = await fetchList(`fontName_${authorNames[i]}`),
                  _list = i ? [
                      [notSelected, notSelected],
                      ...list.map(v => [v.slice(4), v.slice(0, 4)])
                  ] : [notSelected, ...list];
            selectFont.update(_list, notSelected);
            SoundFont = SoundFonts[i];
        }).trigger('change');
        selectFont.elm.on('change', () => {
            const v = selectFont();
            if(v !== notSelected) loadSF(v);
        });
        const input = rpgen3.addInputStr(html, {
            label: 'search SoundFont',
            save: true
        });
        input.elm.prop('placeholder', 'see source');
        const dd = $('<dd>').appendTo(html);
        rpgen3.addA(dd, 'https://github.com/gleitz/midi-js-soundfonts/tree/gh-pages/FluidR3_GM', 'source');
        const btn = rpgen3.addBtn(html, 'search', () => loadSF(input())).addClass('btn');
        const loadSF = async fontName => {
            const e = selectAuthor.elm.add(selectFont.elm).add(input.elm).add(btn);
            e.prop('disabled', true);
            dd.text('now loading');
            try {
                const _fontName = selectAuthor() ? `${fontName}_FluidR3_GM_sf2_file` : fontName;
                sf = await SoundFont.load({
                    ctx: audioNode.ctx,
                    fontName: selectAuthor() ? `_tone_${_fontName}` : _fontName,
                    url: SoundFont.toURL(_fontName)
                });
                dd.text('success loading');
            }
            catch {
                dd.text('failed loading');
            }
            e.prop('disabled', false);
        };
        const inputVolume = rpgen3.addInputNum(html, {
            label: 'note volume',
            save: true
        });
        inputVolume.elm.on('input', () => {
            gainNodeNote.gain.value = inputVolume() / 100;
        }).trigger('input');
    }
    const g_drum = new class {
        constructor(){
            this.font = null;
        }
        play(v){
            const {font} = this;
            if(!font) return;
            const {note} = v;
            if(font.has(note)) font.get(note).play(v);
        }
    };
    let gainNodeDrum = {...gainNodeNote};
    {
        const {html} = addHideArea('load drum');
        const selectDrum = rpgen3.addSelect(html, {
            label: 'select drum'
        });
        const dd = $('<dd>').appendTo(html);
        $('<dd>').appendTo(html);
        const inputVolume = rpgen3.addInputNum(html, {
            label: 'drum volume',
            save: true
        });
        inputVolume.elm.on('input', () => {
            gainNodeDrum.gain.value = inputVolume() / 100;
        }).trigger('input');
        const surikov = SoundFonts[1],
              map = new Map(),
              drums = new Map();
        selectDrum.elm.on('change', async () => {
            const e = selectDrum.elm;
            e.prop('disabled', true);
            dd.text('now loading');
            try {
                const id = selectDrum();
                if(id === notSelected) return;
                if(!drums.has(id)) {
                    drums.set(id, new Map(
                        await Promise.all(map.get(id).map(async key => {
                            const fontName = `${key}_${id}_FluidR3_GM_sf2_file`;
                            return [
                                rpgen4.piano.note[key - 21],
                                await surikov.load({
                                    ctx: audioNode.ctx,
                                    fontName: `_drum_${fontName}`,
                                    url: `https://surikov.github.io/webaudiofontdata/sound/128${fontName}.js`,
                                    isDrum: true,
                                    pitchs: [key]
                                })
                            ];
                        }))
                    ));
                }
                g_drum.font = drums.get(id);
                dd.text('success loading');
            }
            catch {
                dd.text('failed loading');
            }
            e.prop('disabled', false);
        });
        (async () => {
            const res = await fetch('https://surikov.github.io/webaudiofontdata/sf2/list.txt'),
                  str = await res.text();
            for(const v of str.match(/128[0-9]+_[0-9]+_FluidR3_GM_sf2_file.js/g)) {
                const [_, key, id] = v.match(/128([0-9]+)_([0-9]+)_/);
                if(!map.has(id)) map.set(id, []);
                map.get(id).push(key);
            }
            selectDrum.update([notSelected, ...[...map.keys()].sort((a, b) => a - b)], notSelected);
        })();
    }
    {
        const {html} = addHideArea('check code');
        const selectOctave = rpgen3.addSelect(html, {
            label: 'octave',
            save: true,
            list: [2, 3, 4, 5, 6],
            value: 4
        });
        const selectKey = rpgen3.addSelect(html, {
            label: 'key',
            save: true,
            list: (a => {
                let n = 3;
                while(n--) a.push(a.shift());
                return a;
            })(rpgen4.piano.keys.slice()),
            value: 'C'
        });
        const selectChord = rpgen3.addSelect(html, {
            label: 'code',
            save: true,
            list: rpgen4.chord,
            value: 'M'
        });
        const selectInversion = rpgen3.addSelect(html, {
            label: 'inversion',
            save: true,
            list: (max => [...Array(max * 2 + 1).keys()].map(v => v - max))(Math.max(...Object.values(rpgen4.chord).map(v => v.length))),
            value: 0
        });
        $('<dd>').appendTo(html);
        rpgen3.addBtn(html, 'play', () => {
            playChord(selectKey() + selectOctave(), selectChord(), selectInversion());
            setTimeout(() => record.close(), 500);
        }).addClass('btn');
    }
    const playChord = (note, chord, inversion) => {
        audioNode.init();
        const root = rpgen4.piano.note2index(note),
              a = rpgen4.inversion(chord, inversion).map(v => v + root).map(v => rpgen4.piano.note[v]);
        for(const v of a) sf?.play({
            ctx: audioNode.ctx,
            destination: gainNodeNote,
            note: v
        });
    };
    const audioNode = new class {
        constructor(){
            this.ctx = null;
            this.anyNode = null;
        }
        init(){
            this.ctx?.close();
            this.ctx = new AudioContext();
            const [a, b] = [gainNodeNote, gainNodeDrum],
                  {ctx} = this;
            gainNodeNote = ctx.createGain();
            gainNodeDrum = ctx.createGain();
            gainNodeNote.gain.value = a.gain.value;
            gainNodeDrum.gain.value = b.gain.value;
            this.connect();
        }
        connect(any = this.anyNode){
            this.anyNode = any;
            const {destination} = this.ctx;
            if(any) {
                gainNodeNote.connect(any).connect(destination);
                gainNodeDrum.connect(any).connect(destination);
            }
            else {
                gainNodeNote.connect(destination);
                gainNodeDrum.connect(destination);
            }
        }
    };
    window.addEventListener('click', () => audioNode.init(), {once: true});
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
        audioNode.init();
        startTime = audioNode.ctx.currentTime - timeline[0].when + coolTime;
        nowIndex = 0;
        intervalId = setInterval(update);
        update();
    };
    const stopMidi = () => {
        clearInterval(intervalId);
        for(const v of SoundFonts) v.init();
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
            const {ch, note, volume, when, duration} = timeline[nowIndex],
                  _when = when - time;
            if(_when > planTime) break;
            nowIndex++;
            if(_when < 0) continue;
            const param = {
                note,
                volume,
                when: _when,
                duration
            };
            if(ch === 9) g_drum.play({
                ctx: audioNode.ctx,
                destination: gainNodeDrum,
                ...param
            });
            else sf?.play({
                ctx: audioNode.ctx,
                destination: gainNodeNote,
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
    const parseMidi = async midi => { // note, volume, duration
        stopMidi();
        const {track, timeDivision} = midi,
              heap = new rpgen4.Heap();
        for(const {event} of track) {
            const now = new Map;
            let currentTime = 0;
            for(const {deltaTime, type, data, channel} of event) { // 全noteを回収
                currentTime += deltaTime;
                if(type !== 8 && type !== 9) continue;
                const [note, velocity] = data,
                      isNoteOFF = type === 8 || !velocity;
                if(now.has(note) && isNoteOFF) {
                    const unit = now.get(note);
                    unit.end = currentTime;
                    heap.push(unit.start, unit);
                    now.delete(note);
                }
                else if(!isNoteOFF) now.set(note, new MidiUnit({
                    ch: channel,
                    note,
                    velocity,
                    start: currentTime
                }));
            }
        }
        while(timeline.length) timeline.pop();
        endTime = 0;
        const deltaToSec = 60 / getBPM(midi) / timeDivision;
        for(const {ch, note, velocity, start, end} of heap) {
            const _note = rpgen4.piano.note[note - 21];
            if(!_note) continue;
            const [_start, _end] = [start, end].map(v => v * deltaToSec);
            timeline.push(new AudioUnit({
                ch,
                note: _note,
                volume: velocity / 0x7F,
                when: _start,
                duration: _end - _start
            }));
            if(endTime < _end) endTime = _end;
        }
        endTime += coolTime;
    };
    class MidiUnit {
        constructor({ch, note, velocity, start}){
            this.ch = ch;
            this.note = note;
            this.velocity = velocity;
            this.start = start;
            this.end = -1;
        }
    }
    class AudioUnit {
        constructor({ch, note, volume, when, duration}){
            this.ch = ch;
            this.note = note;
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
                'ScriptProcessor': true,
                'AudioWorklet': false
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
            }), 'chord.wav');
        }).addClass('btn');
        const isRecord = rpgen3.addInputBool(html, {
            label: 'start record'
        });
        const init = async () => {
            if(!isRecord()) return true;
            const {ctx} = audioNode;
            const p = {ctx, ch: inputCh() ? inputCh() : SoundFont.ch};
            if(selectAPI()) rec = new rpgen4.Record(p);
            else {
                await rpgen4.RecordWorklet.init(ctx);
                rec = new rpgen4.RecordWorklet(p);
            }
            audioNode.connect(rec.node);
        };
        const close = () => rec?.close();
        Object.assign(record, {init, close});
        isRecord.elm.on('change', async () => {
            if(await init()) {
                close();
                audioNode.connect(null);
            }
        });
    }
})();
