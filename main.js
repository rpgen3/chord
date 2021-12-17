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
            'soundFont'
        ].map(v => `https://rpgen3.github.io/chord/mjs/${v}.mjs`)
    ].flat());
    [
        'container',
        'btn'
    ].map(v => `https://rpgen3.github.io/spatialFilter/css/${v}.css`).map(rpgen3.addCSS);
    const notSelected = 'not selected';
    const selectFont = rpgen3.addSelect($('<dl>').appendTo(main), {
        label: 'SoundFont',
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
            'kalimba',
            'koto',
            'music_box',
            'oboe',
            'trombone',
            'violin',
            'voice_oohs',
            'vibraphone',
            'xylophone'
        ]
    });
    let nowFont = null;
    selectFont.elm.on('change', async () => {
        const v = selectFont();
        if(v === notSelected || v === nowFont) return;
        nowFont = v;
        selectFont.elm.prop('disabled', true);
        await rpgen4.soundFont.load(v, `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${v}-mp3.js`);
        selectFont.elm.prop('disabled', false);
    });
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
        rpgen3.addBtn(html, 'play', () => playChord(selectKey() + selectOctave(), selectChord(), selectInversion())).addClass('btn');
        rpgen3.addBtn(html, 'stop', () => rpgen4.soundFont.stop()).addClass('btn');
    }
    const playChord = (note, chord, inversion) => {
        const root = rpgen4.piano.note2index(note),
              a = rpgen4.inversion(chord, inversion).map(v => v + root).map(v => rpgen4.piano.note[v]);
        rpgen4.soundFont.stop();
        for(const v of a) rpgen4.soundFont.play(v);
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
                'クラゲ': 'mWwy4ne',
                'マグロ': '4N3OZkS'
            }
        });
        let nowMidi = null;
        selectMidi.elm.on('change', async () => {
            const v = selectMidi();
            if(v === notSelected || v === nowMidi) return;
            nowMidi = v;
            selectMidi.elm.prop('disabled', true);
            parseMidi(MidiParser.parse(rpgen3.img2arr(
                await rpgen3.loadSrc('img', `https://i.imgur.com/${v}.png`)
            )));
            selectMidi.elm.prop('disabled', false);
        });
        $('<dt>').appendTo(html).text('input file');
        MidiParser.parse($('<input>').appendTo($('<dd>').appendTo(html)).prop({
            type: 'file',
            accept: '.mid'
        }).get(0), v => parseMidi(v));
        $('<dt>').appendTo(html).text('option');
        rpgen3.addBtn(html, 'play', () => playMidi()).addClass('btn');
        rpgen3.addBtn(html, 'stop', () => stopMidi()).addClass('btn');
    }
    const parsedMidi = new Map;
    let parsedMidiKeys = null;
    const playMidi = () => {
        stopMidi();
        parsedMidiKeys = [...parsedMidi.keys()];
        startTime = performance.now();
        nowIndex = 0;
        update();
    };
    const stopMidi = () => {
        cancelAnimationFrame(myReq);
        rpgen4.soundFont.stop();
    };
    let startTime = 0,
        nowIndex = 0,
        myReq = 0;
    const earRape = 100;
    const update = async () => {
        const time = performance.now() - startTime,
              _time = parsedMidiKeys[nowIndex];
        if(!_time && _time !== 0) return;
        if(time > _time) {
            nowIndex++;
            if(time - _time < earRape) for(const v of parsedMidi.get(_time)) rpgen4.soundFont.play(...v);
        }
        myReq = requestAnimationFrame(update);
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
    const parseMidi = midi => { // note, volume, duration
        stopMidi();
        parsedMidi.clear();
        const {track, timeDivision} = midi,
              heap = new rpgen4.Heap();
        for(const {event} of track) {
            const now = new Map;
            let currentTime = 0;
            for(const {deltaTime, type, data} of event) { // 全noteを回収
                currentTime += deltaTime;
                if(type !== 8 && type !== 9) continue;
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
})();
