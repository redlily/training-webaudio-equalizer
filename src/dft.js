
class DFT {

    static swap(v, a, b) {
        let ar = v[a + 0];
        let ai = v[a + 1];
        v[a + 0] = v[b + 0];
        v[a + 1] = v[b + 1];
        v[b + 0] = ar;
        v[b + 1] = ai;
    }

    static swapElements(n, v) {
        let n2 = n + 2;
        let nh = n >>> 1;

        for (let i = 0, j = 0; i < n; i += 4) {
            // データの入れ替え
            DFT.swap(v, i + n, j + 2);
            if (i < j) {
                DFT.swap(v, i + n2, j + n2);
                DFT.swap(v, i, j);
            }

            // ビットオーダを反転した変数としてインクリメント
            for (let k = nh; (j ^= k) < k; k >>= 1) {
            }
        }
    }

    static scaleElements(n, v, s) {
        for (let i = 0; i < n; ++i) {
            v[i] /= s;
        }
    }

    /**
     * 離散フーリエ変換
     * @param n 変換するデータの要素数
     * @param a 入力用のデータ、実数、虚数の順で配置する必要がある
     * @param b 出力用のデータ、実数、虚数の順で配列される
     */
    static dft(n, a, b) {
        // b[y] = Σ[N - 1, j = 0] a[j] * e^(-2.0 * i * j * k / N)
        for (let k = 0; k < n; ++k) {
            // Σ[N - 1, j = 0] a[j] * e^(-2.0 * i * j * k / N)
            let sumRe = 0;
            let sumIm = 0;
            for (let j = 0; j < n; ++j) {
                // e^(-2.0 * i * j * k / N)
                let rad = -2.0 * Math.PI * k * j / n;
                let cs = Math.cos(rad), sn = Math.sin(rad);
                let re = a[(j << 1) + 0], im = a[(j << 1) + 1];
                // a[j] * e^(-2.0 * i * j * k / N)
                sumRe += re * cs - im * sn;
                sumIm += re * sn + im * cs;
            }
            b[(k << 1) + 0] = sumRe;
            b[(k << 1) + 1] = sumIm;
        }
    }

    /**
     * 逆離散フーリエ変換
     * @param n 変換するデータの要素数
     * @param a 入力用のデータ、実数、虚数の順で配置する必要がある
     * @param b 出力用のデータ、実数、虚数の順で配列される
     */
    static idft(n, a, b) {
        // b[j] = Σ[N - 1, k = 0] (1 / N) * a[k] * e^(2.0 * i * j * k / N)
        for (let i = 0; i < n; ++i) {
            // Σ[N - 1, k = 0] (1 / N) * a[k] * e^(2.0 * i * j * k / N)
            let sumRe = 0;
            let sumIm = 0;
            for (let j = 0; j < n; ++j) {
                // e^(2.0 * i * j * k / N)
                let rad = 2.0 * Math.PI * i * j / n;
                let cs = Math.cos(rad), sn = Math.sin(rad);
                let re = a[(j << 1) + 0], im = a[(j << 1) + 1];
                // a[k] * e^(2.0 * i * j * k / N)
                sumRe += re * cs - im * sn;
                sumIm += re * sn + im * cs;
            }
            b[(i << 1) + 0] = sumRe / n;
            b[(i << 1) + 1] = sumIm / n;
        }
    }

    /**
     * 高速フーリエ変換
     * @param n 変換するデータの要素数、実装の特性上2のべき乗を指定する必要がある
     * @param v 変換するデータ、実数、虚数の順で配置された複素数の配列
     * @param inv 逆変換を行う場合は true を設定する
     */
    static fft(n, v, inv = false) {
        let rad = (inv ? 2.0 : -2.0) * Math.PI / n;
        let nd = n << 1;

        for (let m = nd, mh; 2 <= (mh = m >>> 1); m = mh) {
            for (let i = 0; i < mh; i += 2) {
                let rd = rad * (i >> 1);
                let cs = Math.cos(rd), sn = Math.sin(rd); // 回転因子

                for (let j = i; j < nd; j += m) {
                    let k = j + mh;
                    let ar = v[j + 0], ai = v[j + 1];
                    let br = v[k + 0], bi = v[k + 1];

                    // 前半 (a + b)
                    v[j + 0] = ar + br;
                    v[j + 1] = ai + bi;

                    // 後半 (a - b) * w
                    let xr = ar - br;
                    let xi = ai - bi;
                    v[k + 0] = xr * cs - xi * sn;
                    v[k + 1] = xr * sn + xi * cs;
                }
            }
            rad *= 2;
        }

        // 要素の入れ替え
        DFT.swapElements(n, v);

        // 逆変換用のスケール
        if (inv) {
            DFT.scaleElements(nd, v, n);
        }
    }

    /**
     * 高速フーリエ変換、精度を多少犠牲にして速度を向上させたタイプ。
     * @param n 変換するデータの要素数、実装の特性上2のべき乗を指定する必要がある。
     * @param v 変換するデータ、実数、虚数の順で配置された複素数の配列。
     * @param inv 逆変換を行う場合は true を設定する。
     */
    static fftHighSpeed(n, v, inv = false) {
        let rad = (inv ? 2.0 : -2.0) * Math.PI / n;
        let cs = Math.cos(rad), sn = Math.sin(rad); // 回転因子の回転用複素数
        let nd = n << 1;

        for (let m = nd, mh; 2 <= (mh = m >>> 1); m = mh) {
            // 回転因子が0°の箇所を処理
            for (let i = 0; i < nd; i += m) {
                let j = i + mh;
                let ar = v[i + 0], ai = v[i + 1];
                let br = v[j + 0], bi = v[j + 1];

                // 前半 (a + b)
                v[i + 0] = ar + br;
                v[i + 1] = ai + bi;

                // 後半 (a - b)
                v[j + 0] = ar - br;
                v[j + 1] = ai - bi;
            }

            // 回転因子が0°以外の箇所を処理
            let wcs = cs, wsn = sn; // 回転因子
            for (let i = 2; i < mh; i += 2) {
                for (let j = i; j < nd; j += m) {
                    let k = j + mh;
                    let ar = v[j + 0], ai = v[j + 1];
                    let br = v[k + 0], bi = v[k + 1];

                    // 前半 (a + b)
                    v[j + 0] = ar + br;
                    v[j + 1] = ai + bi;

                    // 後半 (a - b) * w
                    let xr = ar - br;
                    let xi = ai - bi;
                    v[k + 0] = xr * wcs - xi * wsn;
                    v[k + 1] = xr * wsn + xi * wcs;
                }

                // 回転因子を回転
                let tcs = wcs * cs - wsn * sn;
                wsn = wcs * sn + wsn * cs;
                wcs = tcs;
            }

            // 回転因子の回転用の複素数を自乗して回転
            let tcs = cs * cs - sn * sn;
            sn = 2.0 * (cs * sn);
            cs = tcs;
        }

        // 要素の入れ替え
        DFT.swapElements(n, v);

        // 逆変換用のスケール
        if (inv) {
            DFT.scaleElements(nd, v, n);
        }
    }
}