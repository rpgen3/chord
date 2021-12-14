(async () => {
    const {importAll, getScript, importAllSettled} = await import(`https://rpgen3.github.io/mylib/export/import.mjs`);
    await getScript('https://code.jquery.com/jquery-3.3.1.min.js');
    const {$} = window;
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
            'inversion'
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
    const selectOctave = rpgen3.addSelect(input.dl, {
        label: 'オクターヴ',
        save: true,
        list: rpgen4.piano.octave,
        value: 'C'
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
    rpgen3.addBtn(input.html, 'play', () => playChord()).addClass('btn');
    const playChord = () => {
    };
})();
