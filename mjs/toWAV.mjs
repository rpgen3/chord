// https://qiita.com/optimisuke/items/f1434d4a46afd667adc6
export const toWAV = ({data, sampleRate, bitRate = 16}) => { // bitRate: 8 or 16 or 32
    if(bitRate !== 8 && bitRate !== 16 && bitRate !== 32) throw 'BitRate must be 8 or 16 or 32.';
    const view = makeFile(mergeBuf(data), data.length, sampleRate, bitRate),
          blob = new Blob([view], {type:'audio/wav'});
    return URL.createObjectURL(blob);
};
const mergeBuf = data => {
    const ch = data.length,
          len = data[0].length,
          bufSize = data[0][0].length,
          a = new Float32Array(ch * len * bufSize);
    for (let i = 0; i < ch; i++) for (let j = 0; j < len; j++) a.set(data[i][j], (i + j * ch) * bufSize);
    return a;
};
// https://www.wdic.org/w/TECH/WAV
const makeFile = (a, ch, sampleRate, bitRate) => {
    const len = a.length * 2,
          view = new DataView(new ArrayBuffer(44 + len));
    writeString(view, 0, 'RIFF'); // RIFFヘッダ
    view.setUint32(4, 32 + len, true); // これ以降のファイルサイズ
    writeString(view, 8, 'WAVE'); // WAVEヘッダ
    writeString(view, 12, 'fmt '); // fmtチャンク
    view.setUint32(16, 16, true); // fmtチャンクのバイト数
    view.setUint16(20, 1, true); // フォーマットID
    view.setUint16(22, ch, true); // チャンネル数
    view.setUint32(24, sampleRate, true); // サンプリングレート
    view.setUint32(28, sampleRate * ch * 2, true); // データ速度
    view.setUint16(32, ch * 2, true); // ブロックサイズ
    view.setUint16(34, bitRate, true); // サンプルあたりのビット数
    writeString(view, 36, 'data'); // dataチャンク
    view.setUint32(40, len, true); // 波形データのバイト数
    float2PCM(view, 44, a, bitRate); // 波形データ
    return view;
};
const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};
const float2PCM = (output, offset, input, bitRate) => {
    const step = bitRate / 8;
    for (let i = 0; i < input.length; i++ , offset += step) {
        const s = Math.max(-1, Math.min(1, input[i]));
        switch(bitRate) {
            case 8:
                output.setUint8(offset, (s + 1) * (0xFF / 2) | 0);
                break;
            case 16:
                output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                break;
            case 32:
                output.setFloat32(offset, input[i], true);
                break;
        }
    }
};
