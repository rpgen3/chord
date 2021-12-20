// https://qiita.com/optimisuke/items/f1434d4a46afd667adc6
export const toWAV = (data, sampleRate) => {
    const dataView = makeFile(mergeBuffers(data), data.length, sampleRate),
          blob = new Blob([dataView], {type:'audio/wav'});
    return URL.createObjectURL(blob);
};
const mergeBuffers = data => {
    const ch = data.length,
          len = data[0].length,
          unit = data[0][0].length,
          a = new Float32Array(ch * len * unit);
    for (let i = 0; i < ch; i++) for (let j = 0; j < len; j++) a.set(data[i][j], i * unit + j * len);
    return a;
};
// https://www.wdic.org/w/TECH/WAV
const makeFile = (a, ch, sampleRate) => {
    const buffer = new ArrayBuffer(44 + a.length * 2),
          view = new DataView(buffer);
    writeString(view, 0, 'RIFF'); // RIFFヘッダ
    view.setUint32(4, 32 + a.length * 2, true); // これ以降のファイルサイズ
    writeString(view, 8, 'WAVE'); // WAVEヘッダ
    writeString(view, 12, 'fmt '); // fmtチャンク
    view.setUint32(16, 16, true); // fmtチャンクのバイト数
    view.setUint16(20, 1, true); // フォーマットID
    view.setUint16(22, ch, true); // チャンネル数
    view.setUint32(24, sampleRate, true); // サンプリングレート
    view.setUint32(28, sampleRate * 2 * ch, true); // データ速度
    view.setUint16(32, 2 * ch, true); // ブロックサイズ
    view.setUint16(34, 16, true); // サンプルあたりのビット数
    writeString(view, 36, 'data'); // dataチャンク
    view.setUint32(40, a.length * 2, true); // 波形データのバイト数
    floatTo16BitPCM(view, 44, a); // 波形データ
    return view;
};
const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};
const floatTo16BitPCM = (output, offset, input) => {
    for (let i = 0; i < input.length; i++ , offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
};
