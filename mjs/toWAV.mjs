// https://qiita.com/optimisuke/items/f1434d4a46afd667adc6
export const toWAV = ({data, sampleRate, bitRate = 16}) => {
    if(![8, 16, 24, 32].includes(bitRate)) throw 'BitRate must be 8 or 16 or 24 or 32.';
    const view = makeFile(mergeData(data), data.length, sampleRate, bitRate),
          blob = new Blob([view], {type: 'audio/wav'});
    return URL.createObjectURL(blob);
};
const mergeData = data => {
    const ch = data.length,
          len = data[0].length,
          bufSize = data[0][0].length,
          _len = len * bufSize,
          _data = [...Array(ch).fill(new Float32Array(_len))];
    for (let i = 0; i < ch; i++) for (let j = 0; j < len; j++) _data[i].set(data[i][j], j * bufSize);
    const wave = new Float32Array(ch * _len),
          step = 1024;
    for (let j = 0; j < _len; j += step) for (let i = 0; i < ch; i++) wave.set(_data[i].subarray(j, j + step), (j * ch + i) * step);
    return wave;
};
// https://www.wdic.org/w/TECH/WAV
const makeFile = (wave, ch, sampleRate, bitRate) => {
    const step = bitRate / 8,
          blockSize = ch * step,
          len = wave.length * step,
          view = new DataView(new ArrayBuffer(44 + len));
    writeString(view, 0, 'RIFF'); // RIFFヘッダ
    view.setUint32(4, 32 + len, true); // これ以降のファイルサイズ
    writeString(view, 8, 'WAVE'); // WAVEヘッダ
    writeString(view, 12, 'fmt '); // fmtチャンク
    view.setUint32(16, 16, true); // fmtチャンクのバイト数
    view.setUint16(20, 1, true); // フォーマットID
    view.setUint16(22, ch, true); // チャンネル数
    view.setUint32(24, sampleRate, true); // サンプリングレート
    view.setUint32(28, sampleRate * blockSize, true); // データ速度
    view.setUint16(32, blockSize, true); // ブロックサイズ
    view.setUint16(34, bitRate, true); // サンプルあたりのビット数
    writeString(view, 36, 'data'); // dataチャンク
    view.setUint32(40, len, true); // 波形データのバイト数
    float2pcm(view, 44, wave, step); // 波形データ
    return view;
};
const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
};
const float2pcm = (view, offset, wave, step) => {
    const f = [pcm8, pcm16, pcm24, pcm32][step - 1];
    for (let i = 0; i < wave.length; i++ , offset += step) f(view, offset, wave[i]);
};
// https://github.com/mohayonao/wav-encoder/blob/master/index.js
const clamp = (num, min, max) => Math.max(min, Math.min(max, num)),
      float2int = (value, range) => clamp(Math.round(value * range), -range, range - 1),
      pcm8 = (view, offset, value) => view.setUint8(offset, float2int(value, 0x80) + 0x80),
      pcm16 = (view, offset, value) => view.setInt16(offset, float2int(value, 0x8000), true),
      pcm32 = (view, offset, value) => view.setInt32(offset, float2int(value, 0x80000000), true);
const pcm24 = (view, offset, value) => {
    const v = float2int(value, 0x800000);
    view.setUint8(offset + 0, (v >> 0) & 0xFF);
    view.setUint8(offset + 1, (v >> 8) & 0xFF);
    view.setUint8(offset + 2, (v >> 16) & 0xFF);
};
