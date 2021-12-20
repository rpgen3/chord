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
            'SoundFont',
            'Record',
            'toWAV'
        ].map(v => `https://rpgen3.github.io/chord/mjs/${v}.mjs`)
    ].flat());
    [
        'container',
        'btn'
    ].map(v => `https://rpgen3.github.io/spatialFilter/css/${v}.css`).map(rpgen3.addCSS);
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
    const sf = new rpgen4.SoundFont(),
          notSelected = 'not selected';
    {
        const {html} = addHideArea('load SoundFont');
        const selectFont = rpgen3.addSelect(html, {
            label: 'select SoundFont',
            list: [
                notSelected,
                'acoustic_grand_piano',
                'acoustic_guitar_nylon',
                'acoustic_guitar_steel',
                'bassoon',
                'cello',
                'church_organ',
                'clarinet',
                'flute',
                'fx_1_rain',
                'harmonica',
                'kalimba',
                'koto',
                'music_box',
                'oboe',
                'orchestra_hit',
                'orchestral_harp',
                'piccolo',
                'recorder',
                'shakuhachi',
                'shamisen',
                'shanai',
                'sitar',
                'trombone',
                'violin',
                'voice_oohs',
                'vibraphone',
                'xylophone'
            ]
        });
        let nowFont = null;
        selectFont.elm.on('change', () => {
            const v = selectFont();
            if(v === notSelected || v === nowFont) return;
            nowFont = v;
            loadSF(v);
        });
        const input = rpgen3.addInputStr(html, {
            label: 'search SoundFont',
            save: true
        });
        input.elm.prop('placeholder', 'see source');
        const dd = $('<dd>').appendTo(html);
        rpgen3.addA(dd, 'https://github.com/gleitz/midi-js-soundfonts/tree/gh-pages/FluidR3_GM', 'source');
        const btn = rpgen3.addBtn(html, 'search', () => {
            loadSF(input());
        }).addClass('btn');
        const loadSF = async fontName => {
            const e = selectFont.elm.add(input.elm).add(btn);
            e.prop('disabled', true);
            dd.text('now loading');
            try {
                await sf.load(fontName, `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${fontName}-mp3.js`);
                dd.text('success loading');
            }
            catch {
                dd.text('failed loading');
            }
            e.prop('disabled', false);
        };
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
        const root = rpgen4.piano.note2index(note),
              a = rpgen4.inversion(chord, inversion).map(v => v + root).map(v => rpgen4.piano.note[v]);
        for(const v of a) sf.play(v);
    };
    {
        const {html} = addHideArea('play MIDI');
        const selectMidi = rpgen3.addSelect(html, {
            label: 'sample',
            list: {
                [notSelected]: notSelected,
                '厄神様の通り道': 'bnAh4QP',
                '竹取飛翔': 'r6YykIX',
                'a': '4BRC0W1',
                'マグロ': '4N3OZkS',
                'U.N.オーエンは彼女なのか？': 'ORWqjdj',
                '明治十七年の上海アリス': 'jTyK9wz',
                '華のさかづき大江山': '31Unddb',
                '時代親父とハイカラ少女': 'yct204E',
                '永遠の春夢': 'aAlch5g',
                'ヤツメ穴': '691a8Mz',
                'クラゲ': 'LWh7Tn3',
                '!': 'Ak68REb',
                'i': 'lqvQCiu',
                '...': 'qv8HpjG',
                'あさやけもゆうやけもないんだ': 'LyUEhJl',
                '海鬼月': '8bsTZIp',
                'calcite': 'xrKFzUC',
                'あねもねぐりっち': 'uAigio7',
                'かるみあどーるず': '4t8zrav'
            }
        });
        let nowMidi = null;
        selectMidi.elm.on('change', async () => {
            const v = selectMidi();
            if(v === notSelected || v === nowMidi) return;
            nowMidi = v;
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
        rpgen3.addBtn(html, 'stop', () => stopMidi()).addClass('btn');
        rpgen3.addBtn(html, 'play', () => playMidi()).addClass('btn');
    }
    const parsedMidi = new Map;
    let parsedMidiKeys = null,
        intervalId = -1;
    const playMidi = async () => {
        await stopMidi();
        await record.init();
        parsedMidiKeys = [...parsedMidi.keys()];
        startTime = performance.now() - parsedMidiKeys[0] + 500;
        const t = parsedMidiKeys[parsedMidiKeys.length - 1];
        endTime = t + Math.max(...parsedMidi.get(t).map(v => v[2])) * 1000;
        nowIndex = 0;
        intervalId = setInterval(update);
    };
    const stopMidi = async () => {
        clearInterval(intervalId);
        await sf.stop();
    };
    let startTime = 0,
        endTime = 0,
        nowIndex = 0;
    const earRape = 100;
    const update = () => {
        const time = performance.now() - startTime;
        if(time > endTime) {
            record.close();
            return stopMidi();
        }
        const _time = parsedMidiKeys[nowIndex];
        if(!_time && _time !== 0) return;
        if(time > _time) {
            nowIndex++;
            if(time - _time < earRape) for(const v of parsedMidi.get(_time)) sf.play(...v);
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
        await stopMidi();
        parsedMidi.clear();
        const {track, timeDivision} = midi,
              heap = new rpgen4.Heap();
        for(const {event} of track) {
            const now = new Map;
            let currentTime = 0;
            for(const {deltaTime, type, data, channel} of event) { // 全noteを回収
                currentTime += deltaTime;
                if(type !== 8 && type !== 9 || channel === 9) continue;
                const [note, velocity] = data,
                      isNoteOFF = type === 8 || !velocity;
                if(now.has(note) && isNoteOFF) {
                    const node = now.get(note);
                    node.end = currentTime;
                    heap.push(node.start, node);
                    now.delete(note);
                }
                else if(!isNoteOFF) {
                    const node = new MidiNode(note, velocity, currentTime);
                    now.set(note, node);
                }
            }
        }
        const deltaToMs = 1000 * 60 / getBPM(midi) / timeDivision;
        for(const {note, velocity, start, end} of heap) {
            const _note = rpgen4.piano.note[note - 21];
            if(_note) {
                const [_start, _end] = [start, end].map(v => v * deltaToMs | 0);
                if(!parsedMidi.has(_start)) parsedMidi.set(_start, []);
                parsedMidi.get(_start).push([
                    _note,
                    velocity / 0x7F,
                    (_end - _start) / 1000
                ]);
            }
        }
    };
    class MidiNode {
        constructor(note, velocity, start){
            this.note = note;
            this.velocity = velocity;
            this.start = start;
            this.end = -1;
        }
    }
    const record = {};
    {
        const {html} = addHideArea('record play');
        let rec = null;
        rpgen3.addBtn(html, 'download', () => {
            rpgen3.download(rpgen4.toWAV(rec.data, sf.ctx.sampleRate), 'chord.wav');
        }).addClass('btn');
        const isRecord = rpgen3.addInputBool(html, {
            label: 'start record'
        });
        const init = async () => {
            if(!isRecord()) return true;
            rec = new rpgen4.Record(sf.ctx, sf.ch);
            sf.anyNode = rec.node;
            /*await ctx.audioWorklet.addModule('https://rpgen3.github.io/chord/worklet/record.js');
            rec = new AudioWorkletNode(ctx, 'record', {
                channelCount: 1,
                channelCountMode: 'explicit',
                channelInterpretation: 'discrete'
            });
            window.sf = sf;
            window.rec = rec;*/
        };
        const close = () => rec?.close();
        Object.assign(record, {init, close});
        isRecord.elm.on('change', async () => {
            if(await init()) {
                close();
                sf.anyNode = null;
            }
        });
    }
})();
