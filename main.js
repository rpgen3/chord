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
        'util'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    const rpgen4 = await importAll([
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
    const input = new class {
        constructor(){
            this.html = $('<div>').addClass('container').appendTo(main);
            this.dl = $('<dl>').appendTo(this.html);
        }
    };
    const selectKey = rpgen3.addSelect(input.dl, {
        label: 'キー',
        save: true,
        list: (a => {
            let n = 3;
            while(n--) a.push(a.shift());
            return a;
        })(rpgen4.piano.keys.slice()),
        value: 'C'
    });
    const selectOctave = rpgen3.addSelect(input.dl, {
        label: 'オクターヴ',
        save: true,
        list: [2, 3, 4, 5, 6],
        value: 4
    });
    const selectChord = rpgen3.addSelect(input.dl, {
        label: 'コード',
        save: true,
        list: rpgen4.chord,
        value: 'M'
    });
    const selectInversion = rpgen3.addSelect(input.dl, {
        label: '転回指数',
        save: true,
        list: (max => [...Array(max * 2 + 1).keys()].map(v => v - max))(Math.max(...Object.values(rpgen4.chord).map(v => v.length))),
        value: 0
    });
    const notSelected = 'not selected';
    const selectFont = rpgen3.addSelect(input.dl, {
        label: 'サウンドフォント',
        list: [
            notSelected,
            'acoustic_grand_piano',
            'koto'
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
    rpgen3.addBtn(input.html, 'play', () => playChord()).addClass('btn');
    const playChord = () => {
        const root = rpgen4.piano.note2index(selectKey() + selectOctave()),
              chord = rpgen4.inversion(selectChord(), selectInversion()).map(v => v + root).map(v => rpgen4.piano.note[v]);
        for(const v of chord) rpgen4.soundFont.play(v);
    };
})();
