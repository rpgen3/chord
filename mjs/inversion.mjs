export const inversion = ( // 和音の転回
    chord = [0, 4, 7],
    diff = +1 // 転回指数
) => {
    const a = chord.slice();
    if(diff > 0) while(diff--) a.push(a.shift() + 12);
    else while(diff++) a.unshift(a.pop() - 12);
    return a;
};
