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
        label: 'サウンドフォント',
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
    const h_playChord = new class {
        constructor(){
            const {html} = addHideArea('和音の確認');
            this.dl = $('<dl>').appendTo(html);
        }
    };
    const selectKey = rpgen3.addSelect(h_playChord.dl, {
        label: 'キー',
        save: true,
        list: (a => {
            let n = 3;
            while(n--) a.push(a.shift());
            return a;
        })(rpgen4.piano.keys.slice()),
        value: 'C'
    });
    const selectOctave = rpgen3.addSelect(h_playChord.dl, {
        label: 'オクターヴ',
        save: true,
        list: [2, 3, 4, 5, 6],
        value: 4
    });
    const selectChord = rpgen3.addSelect(h_playChord.dl, {
        label: 'コード',
        save: true,
        list: rpgen4.chord,
        value: 'M'
    });
    const selectInversion = rpgen3.addSelect(h_playChord.dl, {
        label: '転回指数',
        save: true,
        list: (max => [...Array(max * 2 + 1).keys()].map(v => v - max))(Math.max(...Object.values(rpgen4.chord).map(v => v.length))),
        value: 0
    });
    rpgen3.addBtn(h_playChord.dl, 'play', () => playChord()).addClass('btn');
    rpgen3.addBtn(h_playChord.dl, 'stop', () => rpgen4.soundFont.stop()).addClass('btn');
    const playChord = () => {
        const root = rpgen4.piano.note2index(selectKey() + selectOctave()),
              chord = rpgen4.inversion(selectChord(), selectInversion()).map(v => v + root).map(v => rpgen4.piano.note[v]);
        rpgen4.soundFont.stop();
        for(const v of chord) rpgen4.soundFont.play(v);
    };
    const h_playMidi = new class {
        constructor(){
            const {html} = addHideArea('MIDIの再生');
            this.dl = $('<dl>').appendTo(html);
        }
    };
    const selectMidi = rpgen3.addSelect(h_playMidi.dl, {
        label: 'サンプルMIDI',
        list: {
            [notSelected]: notSelected,
            '厄神様の通り道': 'bnAh4QP'
        }
    });
    let nowMidi = null;
    selectMidi.elm.on('change', async () => {
        const v = selectMidi();
        if(v === notSelected || v === nowMidi) return;
        nowMidi = v;
        selectMidi.elm.prop('disabled', true);
        await parseMidi(MidiParser.parse(rpgen3.img2arr(await rpgen3.loadSrc('img', `https://i.imgur.com/${v}.png`))));
        selectMidi.elm.prop('disabled', false);
    });
    $('<dt>').appendTo(h_playMidi.dl).text('ファイル入力');
    MidiParser.parse($('<input>').appendTo($('<dd>').appendTo(h_playMidi.dl)).prop({
        type: 'file',
        accept: '.mid'
    }).get(0), async result => {
        selectMidi.elm.prop('disabled', true);
        await parseMidi(result);
        selectMidi.elm.prop('disabled', false);
    });
    rpgen3.addBtn(h_playMidi.dl, 'play', () => playMidi()).addClass('btn');
    rpgen3.addBtn(h_playMidi.dl, 'stop', () => {
        cancelAnimationFrame(myReq);
        rpgen4.soundFont.stop();
    }).addClass('btn');
    let parsedMidi = new Map,
        parsedMidiKeys = null;
    const playMidi = () => {
        parsedMidiKeys = [...parsedMidi.keys()];
        startTime = performance.now();
        nowIndex = 0;
        update();
    };
    let startTime = 0,
        nowIndex = 0,
        myReq = 0;
    const update = async () => {
        const time = performance.now() - startTime,
              _time = parsedMidiKeys[nowIndex];
        if(!_time && _time !== 0) return;
        if(time > _time) for(const v of parsedMidi.get(_time)) rpgen4.soundFont.play(...v);
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
    const parseMidi = async midi => { // note, volume, duration
        await rpgen3.sleep();
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
        while(heap.length) {
            const {note, velocity, start, end} = heap.pop(),
                  _note = rpgen3.piano.note[note];
            if(_note) {
                const [_start, _end] = [start, end].map(v => v * deltaToMs | 0);
                if(!parsedMidi.has(_start)) parsedMidi.set(_start, []);
                parsedMidi.get(_start).push(new SoundFontNode(
                    _note,
                    100 * velocity / 0x7F | 0,
                    _end - _start
                ));
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
    class SoundFontNode {
        constructor(note, volume, duration){
            this.note = note;
            this.volume = volume;
            this.duration = duration;
        }
    }
})();
