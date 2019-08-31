// 3D系のユーティリティ
let tutils = {};
(function () {
    "use strict";

    ////////////////////////////////////////////////////////////////
    // WebGL関連

    // シェーダを生成
    function createShader(gl, type, code) {
        // シェーダの作成
        let shader = gl.createShader(type);
        gl.shaderSource(shader, code);

        // コンパイル
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    // シェーダプログラムを生成
    function createProgram(gl, vs, fs, attr) {
        // プログラムの作成
        let program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        Object.keys(attr).forEach((key) => {
            gl.bindAttribLocation(program, attr[key], key);
        });

        // リンケージ
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            alert(gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    // シェーダプログラムを生成
    tutils.createShaderProgram = function (gl, vsCode, fsCode, attributes, uniforms) {
        // 頂点シェーダのコンパイル
        let vs = createShader(gl, gl.VERTEX_SHADER, vsCode);
        if (vs == null) {
            return null;
        }

        // フラグメントシェーダのコンパイル
        let fs = createShader(gl, gl.FRAGMENT_SHADER, fsCode);
        if (fs == null) {
            gl.deleteShader(vs);
            return null;
        }

        // プログラムのリンク
        let pg = createProgram(gl, vs, fs, attributes);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        if (uniforms != null) {
            for (let name in uniforms) {
                uniforms[name] = gl.getUniformLocation(pg, name);
            }
        }
        return pg;
    };

    // バッファを作成
    tutils.createBuffer = function (gl, type, data, usage) {
        let buf = gl.createBuffer();
        if (buf != null) {
            gl.bindBuffer(type, buf);
            gl.bufferData(type, data, usage);
        }
        return buf;
    };

    ////////////////////////////////////////////////////////////////
    // 幾何学関連

    const VX = 0, VY = 1, VZ = 2;

    const M00 = 0, M01 = 4, M02 = 8, M03 = 12;
    const M10 = 1, M11 = 5, M12 = 9, M13 = 13;
    const M20 = 2, M21 = 6, M22 = 10, M23 = 14;
    const M30 = 3, M31 = 7, M32 = 11, M33 = 15;

    // 行列の設定
    tutils.setMatrix = function (m,
                                 m00, m01, m02, m03,
                                 m10, m11, m12, m13,
                                 m20, m21, m22, m23,
                                 m30, m31, m32, m33) {
        m[M00] = m00;
        m[M01] = m01;
        m[M02] = m02;
        m[M03] = m03;
        m[M10] = m10;
        m[M11] = m11;
        m[M12] = m12;
        m[M13] = m13;
        m[M20] = m20;
        m[M21] = m21;
        m[M22] = m22;
        m[M23] = m23;
        m[M30] = m30;
        m[M31] = m31;
        m[M32] = m32;
        m[M33] = m33;
        return m;
    };

    // 単位行列の設定
    tutils.setIdentityMatrix = function (m) {
        return tutils.setMatrix(
            m,
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1);
    };

    // 拡大行列を掛ける
    tutils.mulScaleMatrix = function (m, x, y, z) {
        m[M00] *= x;
        m[M01] *= y;
        m[M02] *= z;
        m[M10] *= x;
        m[M11] *= y;
        m[M12] *= z;
        m[M20] *= x;
        m[M21] *= y;
        m[M22] *= z;
        m[M30] *= x;
        m[M31] *= y;
        m[M32] *= z;

        return m;
    };

    // 回転行列を掛ける
    tutils.mulRotationMatrix = function (m, x, y, z, rad) {
        let cs = Math.cos(rad);
        let sn = Math.sin(rad);
        let len = x * x + y * y + z * z;
        if (0 < len) {
            len = Math.sqrt(len);
            x /= len;
            y /= len;
            z /= len;
        }

        // 共通項を算出
        let cs1 = 1.0 - cs;
        let xcs1 = x * cs1, ycs1 = y * cs1;
        let xycs1 = y * xcs1, xzcs1 = z * xcs1, yzcs1 = z * ycs1;
        let xsn = x * sn, ysn = y * sn, zsn = z * sn;

        // 掛けあわせて、結果の書き出し
        let a00 = m[M00], a01 = m[M01], a02 = m[M02];
        let a10 = m[M10], a11 = m[M11], a12 = m[M12];
        let a20 = m[M20], a21 = m[M21], a22 = m[M22];
        let a30 = m[M30], a31 = m[M31], a32 = m[M32];
        let b00 = cs + x * xcs1, b01 = xycs1 - zsn, b02 = xzcs1 + ysn;
        let b10 = xycs1 + zsn, b11 = cs + y * ycs1, b12 = yzcs1 - xsn;
        let b20 = xzcs1 - ysn, b21 = yzcs1 + xsn, b22 = cs + z * z * cs1;

        m[M00] = a00 * b00 + a01 * b10 + a02 * b20;
        m[M01] = a00 * b01 + a01 * b11 + a02 * b21;
        m[M02] = a00 * b02 + a01 * b12 + a02 * b22;
        m[M10] = a10 * b00 + a11 * b10 + a12 * b20;
        m[M11] = a10 * b01 + a11 * b11 + a12 * b21;
        m[M12] = a10 * b02 + a11 * b12 + a12 * b22;
        m[M20] = a20 * b00 + a21 * b10 + a22 * b20;
        m[M21] = a20 * b01 + a21 * b11 + a22 * b21;
        m[M22] = a20 * b02 + a21 * b12 + a22 * b22;
        m[M30] = a30 * b00 + a31 * b10 + a32 * b20;
        m[M31] = a30 * b01 + a31 * b11 + a32 * b21;
        m[M32] = a30 * b02 + a31 * b12 + a32 * b22;

        return m;
    };

    // 平行移動行列を掛ける
    tutils.mulTranslateMatrix = function (m, x, y, z) {
        m[M03] += m[M00] * x + m[M01] * y + m[M02] * z;
        m[M13] += m[M10] * x + m[M11] * y + m[M12] * z;
        m[M23] += m[M20] * x + m[M21] * y + m[M22] * z;
        m[M33] += m[M30] * x + m[M31] * y + m[M32] * z;
        return m;
    };

    // ビュー行列を掛ける
    tutils.mulViewMatrix = function (m,
                                     eyeX, eyeY, eyeZ,
                                     centerX, centerY, centerZ,
                                     upperX, upperY, upperZ) {
        // Z軸のベクトルを算出
        // (center - eye) / |center - eye|
        let zx = centerX - eyeX;
        let zy = centerY - eyeY;
        let zz = centerZ - eyeZ;
        let zLen = zx * zx + zy * zy + zz * zz;
        if (0 < zLen) {
            zLen = Math.sqrt(zLen);
            zx /= zLen;
            zy /= zLen;
            zz /= zLen;
        }

        // X軸のベクトルを算出
        // (z_axis × upper) / |z_axis × upper|
        let xx = zy * upperZ - zz * upperY;
        let xy = zz * upperX - zx * upperZ;
        let xz = zx * upperY - zy * upperX;
        let xLen = xx * xx + xy * xy + xz * xz;
        if (0 < xLen) {
            xLen = Math.sqrt(xLen);
            xx /= xLen;
            xy /= xLen;
            xz /= xLen;
        }

        // Y軸のベクトルを算出
        // z_axis × x_axis
        let yx = zy * xz - zz * xy;
        let yy = zz * xx - zx * xz;
        let yz = zx * xy - zy * xx;

        // 平行移動に回転を掛ける
        // | x.x, x.y, x.z |   | eye_x |
        // | y.x, y.y, y.z | * | eye_y | * - 1
        // | z.x, z.y, z.z |   | eye_z |
        let tx = -(xx * eyeX + xy * eyeY + xz * eyeZ);
        let ty = -(yx * eyeX + yy * eyeY + yz * eyeZ);
        let tz = -(zx * eyeX + zy * eyeY + zz * eyeZ);

        // 掛けあわせて、結果の書き出し
        let a00 = m[M00], a01 = m[M01], a02 = m[M02];
        let a10 = m[M10], a11 = m[M11], a12 = m[M12];
        let a20 = m[M20], a21 = m[M21], a22 = m[M22];
        let a30 = m[M30], a31 = m[M31], a32 = m[M32];

        m[M00] = a00 * xx + a01 * yx + a02 * zx;
        m[M01] = a00 * xy + a01 * yy + a02 * zy;
        m[M02] = a00 * xz + a01 * yz + a02 * zz;
        m[M03] += a00 * tx + a01 * ty + a02 * tz;
        m[M10] = a10 * xx + a11 * yx + a12 * zx;
        m[M11] = a10 * xy + a11 * yy + a12 * zy;
        m[M12] = a10 * xz + a11 * yz + a12 * zz;
        m[M13] += a10 * tx + a11 * ty + a12 * tz;
        m[M20] = a20 * xx + a21 * yx + a22 * zx;
        m[M21] = a20 * xy + a21 * yy + a22 * zy;
        m[M22] = a20 * xz + a21 * yz + a22 * zz;
        m[M23] += a20 * tx + a21 * ty + a22 * tz;
        m[M30] = a30 * xx + a31 * yx + a32 * zx;
        m[M31] = a30 * xy + a31 * yy + a32 * zy;
        m[M32] = a30 * xz + a31 * yz + a32 * zz;
        m[M33] += a30 * tx + a31 * ty + a32 * tz;

        return m;
    };

    // プロジェクション行列を掛ける
    tutils.mulProjectionMatrix = function (m, viewWidth, viewHeight, viewNear, viewFar) {
        // 共通項を算出
        let rangeView = viewFar - viewNear;
        let scaledFar = viewFar * (2.0);

        // 行列に掛けあわせて、結果の書き出し
        let a02 = m[M02];
        let a12 = m[M12];
        let a22 = m[M22];
        let a32 = m[M32];
        let b00 = viewNear * 2.0 / viewWidth;
        let b11 = viewNear * 2.0 / viewHeight;
        let b22 = scaledFar / rangeView - 1.0;
        let b23 = viewNear * scaledFar / -rangeView;

        m[M00] *= b00;
        m[M01] *= b11;
        m[M02] = a02 * b22 + m[M03];
        m[M03] = a02 * b23;
        m[M10] *= b00;
        m[M11] *= b11;
        m[M12] = a12 * b22 + m[M13];
        m[M13] = a12 * b23;
        m[M20] *= b00;
        m[M21] *= b11;
        m[M22] = a22 * b22 + m[M23];
        m[M23] = a22 * b23;
        m[M30] *= b00;
        m[M31] *= b11;
        m[M32] = a32 * b22 + m[M33];
        m[M33] = a32 * b23;

        return m;
    };

})();

// メインの処理
(function () {
    "use strict";

    // 定数
    const NUM_FREQUENCY_BUNDLES = 10;
    const FREQUENCIES_PRESETS = [
        [100, 100, 100, 100, 100, 100, 100, 100, 100, 100], // デフォルト
        [118, 131, 125, 85, 46, 82, 108, 127, 136, 141], // ロック
        [87, 80, 106, 132, 138, 117, 92, 87, 87, 96], // ポップ
        [110, 134, 117, 76, 100, 127, 131, 122, 108, 82], // ダンス
        [117, 106, 76, 104, 73, 76, 96, 115, 125, 124], // ジャズ
        [0, 0, 0, 3, 13, 96, 129, 146, 152, 139], // 古いラジオ
        [120, 139, 127, 76, 8, 4, 0, 0, 0, 0], // 水中
        [150, 150, 150, 1, 1, 1, 1, 1, 1, 1], // 低音
        [1, 1, 1, 150, 150, 150, 1, 1, 1, 1], // 中音
        [1, 1, 1, 1, 1, 1, 150, 150, 150, 150], // 高音
    ];
    const NUM_SAMPLES = 1 << NUM_FREQUENCY_BUNDLES; // 2^10 = 1024
    const NUM_VISUALIZE_BINDS = 22;
    const NUM_VISUALIZE_HISTORIES = 20;

    ////////////////////////////////////////////////////////////////
    // サウンド関連

    let audioContext;
    let audioElement;
    let audioSource;
    let scriptProcessor;

    let audioPrevInputs;
    let audioPrevOutputs;
    let audioWorkBuffer;

    let audioUrl = "tw067.mp3";

    // イニシャライズされているか否か
    function isInitializedAudio() {
        return audioContext != null;
    }

    // オーディオ関連の初期化
    function initializeAudio() {
        // 処理用のバッファを初期化
        audioPrevInputs = [
            new Float32Array(NUM_SAMPLES),
            new Float32Array(NUM_SAMPLES)
        ];
        audioPrevOutputs = [
            new Float32Array(NUM_SAMPLES),
            new Float32Array(NUM_SAMPLES)
        ];
        audioWorkBuffer = new Float32Array(NUM_SAMPLES * 4); // FFT処理用のバッファ、処理サンプルの倍の複素数を収納できるようにする

        // WebAudio系の初期化
        audioContext = window.AudioContext != null ?
            new window.AudioContext() :
            new window.webkitAudioContext();

        scriptProcessor = audioContext.createScriptProcessor(NUM_SAMPLES, 2, 2);
        scriptProcessor.addEventListener("audioprocess", onAudioProcess);
        scriptProcessor.connect(audioContext.destination);

        audioElement = new Audio();
        audioElement.loop = true;
        audioElement.autoplay = true;
        audioElement.addEventListener("timeupdate", onUpdatedAudioTime);

        audioSource = audioContext.createMediaElementSource(audioElement);
        audioSource.connect(scriptProcessor);
    }

    // オーディオ関連の後処理
    function terminateAudio() {
        audioElement.stop();
    }

    // 音声ファイルを読み込む
    function loadAudio(url) {
        if (isInitializedAudio()) {
            audioElement.src = url;
        } else {
            audioUrl = url;
        }
    }

    // 音声ファイルの再生時間が更新
    function onUpdatedAudioTime(event) {
        timeSeek.value = 1000 * (audioElement.currentTime / audioElement.duration);
    }

    // 音声ファイルが再生中か否か
    function isPlayAudio() {
        return !audioElement.paused
    }

    // 音声ファイルを再生する
    function playAudio() {
        if (!isPlayAudio()) {
            audioElement.play();
        }
    }

    // 音声ファイルを停止する
    function stopAudio() {
        audioElement.pause();
    }

    // 音声の波形を処理
    function onAudioProcess(event) {
        let input = event.inputBuffer;
        let output = event.outputBuffer;
        for (let i = 0; i < output.numberOfChannels; ++i) {
            let inputData = input.getChannelData(i);
            let outputData = output.getChannelData(i);
            let prevInput = audioPrevInputs[i];
            let prevOutput = audioPrevOutputs[i];

            // 前半に前回の入力波形、後半に今回の入力波形を実数を複素数に変換して作業用バッファに詰める
            for (let j = 0; j < NUM_SAMPLES; ++j) {
                // 前半
                let prevIndex = j * 2;
                audioWorkBuffer[prevIndex] = prevInput[j];
                audioWorkBuffer[prevIndex + 1] = 0.0;

                // 後半
                let nextIndex = (NUM_SAMPLES + j) * 2;
                audioWorkBuffer[nextIndex] = inputData[j];
                audioWorkBuffer[nextIndex + 1] = 0.0;

                // 今回の波形を保存
                prevInput[j] = inputData[j];
            }

            // FFTをかけて周波数
            DFT.fftHighSpeed(NUM_SAMPLES * 2, audioWorkBuffer);

            /*
            離散フーリエ変換の特性に対する概要

            離散フーリエ変換の特性として、例えば8個の要素に処理を行うと下記のような並びで周波数成分が
            複素数(2次元ベクトル)の配列として並ぶ。

            0: 0Hz, 1: 1Hz, 2: 2Hz 3: 4Hz, 4: 8Hz, 5: -4Hz, 6: -2Hz, 7: -1Hz

            そして、実数データのみで構成された配列に対して離散フーリエ変換をかけた場合、中心の要素、上記で言えば8Hzを
            中心に実数部は左右対称(偶関数的)、虚数は符号が反転して左右対称(奇関数的)になる。

            例：

            実数部：[ 10, 20,  -2, 4, 40,  4, -2, 20 ]
            虚数部：[  0, -4, -12, 7,  0, -7, 12,  4 ]

            そして、この複素数の絶対値 ( √(Re^2 + Im^2) ) が各周波数成分のボリュームとなる。
            */

            /*
            周波数バンドル

            30 Hz  2^0, 2^1 - 1
            60 Hz  2^1, 2^2 - 1
            120 Hz 2^2, 2^3 - 1
            240 Hz 2^3, 2^4 - 1
            500 Hz 2^4, 2^5 - 1
            1k Hz  2^5, 2^6 - 1
            2k Hz  2^6, 2^7 - 1
            4k Hz  2^7, 2^8 - 1
            8k Hz  2^8, 2^9 - 1
            16k Hz 2^9, 2^10 - 1
            */

            // 各周波数のボリュームを設定
            for (let j = 0; j < frequencySliders.length; ++j) {
                let volume = frequencySliders[j].value / 100.0;

                for (let k = 1 << j, kEnd = 1 << (j + 1); k < kEnd; ++k) {
                    let positiveFq = k * 2;
                    audioWorkBuffer[positiveFq] *= volume;
                    audioWorkBuffer[positiveFq + 1] *= volume;

                    let negativeFq = (NUM_SAMPLES * 2 - k) * 2;
                    audioWorkBuffer[negativeFq] *= volume;
                    audioWorkBuffer[negativeFq + 1] *= volume;
                }
            }

            // 直流部分のボリュームを設定
            let minFqVolume = frequencySliders[0].value / 100.0;
            audioWorkBuffer[0] *= minFqVolume;
            audioWorkBuffer[1] *= minFqVolume;

            // 最高周波数のボリュームを設定
            let maxFqVolume = frequencySliders[frequencySliders.length - 1].value / 100.0;
            audioWorkBuffer[NUM_SAMPLES * 2] *= maxFqVolume;
            audioWorkBuffer[NUM_SAMPLES * 2 + 1] *= maxFqVolume;

            // ビジュアライザの更新
            updateFrequencyVisualizerParam(i, audioWorkBuffer);

            // 逆FFTをかける
            DFT.fftHighSpeed(NUM_SAMPLES * 2, audioWorkBuffer, true);

            // 前回の出力波形の後半と今回の出力波形の前半をクロスフェードさせて出力する
            let master = masterSlider.value / 100.0;
            for (let j = 0; j < NUM_SAMPLES; ++j) {
                let prev = prevOutput[j] * (NUM_SAMPLES - j) / NUM_SAMPLES;
                let next = audioWorkBuffer[j * 2] * j / NUM_SAMPLES;
                outputData[j] = (prev + next) * master;
                prevOutput[j] = audioWorkBuffer[(NUM_SAMPLES + j) * 2];
            }
        }
    }

    ////////////////////////////////////////////////////////////////
    // UI関連

    let mainCanvas;
    let fileSelector;
    let volumeButton;
    let playButton;
    let timeSeek;
    let navigation;
    let masterSlider;
    let frequencySliders;
    let frequencyPreset;
    let musicName;

    let touchX;
    let touchY;
    let touchId;
    let isDownMouse;

    // 初期化
    function onLoad(event) {
        console.log("onLoad");

        // UIの初期化
        mainCanvas = document.getElementById("mainCanvas");
        mainCanvas.addEventListener("mousedown", onMouseMotion);
        mainCanvas.addEventListener("mouseup", onMouseMotion);
        mainCanvas.addEventListener("mousemove", onMouseMotion);
        mainCanvas.addEventListener("mouseout", onMouseMotion);
        mainCanvas.addEventListener("touchstart", onTouchMotion);
        mainCanvas.addEventListener("touchend", onTouchMotion);
        mainCanvas.addEventListener("touchmove", onTouchMotion);
        mainCanvas.addEventListener("touchcancel", onTouchMotion);
        fileSelector = document.getElementById("fileSelector");
        fileSelector.addEventListener("change", onSelectedFile);
        volumeButton = document.getElementById("volume");
        volumeButton.addEventListener("click", onClickVolumeButton);
        playButton = document.getElementById("play");
        playButton.addEventListener("click", onClickPlayButton);
        timeSeek = document.getElementById("time");
        navigation = document.getElementById("navigation");
        masterSlider = document.getElementById("master");
        masterSlider.addEventListener("change", onChangedMasterVolume);
        frequencySliders = new Array(NUM_FREQUENCY_BUNDLES);
        for (let i = 0; i < frequencySliders.length; ++i) {
            frequencySliders[i] = document.getElementById("frequency" + i);
            frequencySliders[i].addEventListener("change", onChangedFrequencyVolume);
        }
        frequencyPreset = document.getElementById("preset");
        frequencyPreset.addEventListener("change", onChangedPreset);
        musicName = document.getElementById("musicName");

        // その他の初期化
        onResize();
        initializeGL();
        onAnimationGL();
    }

    // 後処理
    function onUnload(event) {
        console.log("onUnload");
        terminateGL();
        terminateAudio();
    }

    // 画面のサイズ変更
    function onResize(event) {
        console.log("onResize");
        let width = window.innerWidth;
        let height = window.innerHeight;
        let devicePixelRatio = window.devicePixelRatio || 1;
        mainCanvas.style.width = width + "px";
        mainCanvas.style.height = height + "px";
        mainCanvas.width = width;// * devicePixelRatio;
        mainCanvas.height = height;// * devicePixelRatio;
    }

    // ファイルをドラッグ
    function onDragOver(event) {
        event.stopPropagation();
        event.preventDefault();
    }

    // ファイルをドロップ
    function onDrop(event) {
        event.stopPropagation();
        event.preventDefault();
        loadAudioFile(event.dataTransfer.files[0]);
    }

    // ファイルを選択
    function onSelectedFile(event) {
        loadAudioFile(event.target.files[0]);
    }

    // 音声ファイルの読み込み
    function loadAudioFile(file) {
        musicName.innerText = "Playing music is " + file.name + ".";
        loadAudio(URL.createObjectURL(file));
    }

    // ボリュームボタンを押下
    function onClickVolumeButton() {
        if (navigation.style.display == "none") {
            navigation.style.display = "block";
        } else {
            navigation.style.display = "none";
        }
    }

    // 再生ボタンを押下
    function onClickPlayButton(event) {
        if (!isInitializedAudio()) {
            initializeAudio();
            loadAudio(audioUrl);
        }
        if (!isPlayAudio()) {
            playAudio();
        } else {
            stopAudio();
        }
    }

    // マスターボリュームを変更
    function onChangedMasterVolume(event) {
    }

    // 各周波数もリュームを変更
    function onChangedFrequencyVolume(event) {
        frequencyPreset.value = -1;
    }

    // プリセットを変更
    function onChangedPreset(event) {
        let preset = FREQUENCIES_PRESETS[event.target.value];
        for (let i = 0; i < frequencySliders.length; ++i) {
            frequencySliders[i].value = preset[i];
        }
    }

    // マウスイベント
    function onMouseMotion(event) {
        touchId = null;

        switch (event.type) {
            case "mousedown":
                touchX = event.clientX;
                touchY = event.clientY;
                isDownMouse = true;
                break;

            case "mousemove":
                if (isDownMouse) {
                    onMotionGL(event.clientX - touchX, event.clientY - touchY);
                    touchX = event.clientX;
                    touchY = event.clientY;
                }
                break;

            case "mouseup":
            case "mouseout":
                isDownMouse = false;
                break;
        }
    }

    // タッチイベント
    function onTouchMotion(event) {
        event.preventDefault();

        switch (event.type) {
            case "touchstart":
                if (touchId == null) {
                    let touch = event.targetTouches[0];
                    touchX = touch.clientX;
                    touchY = touch.clientY;
                    touchId = touch.identifier;
                    isDownMouse = true;
                }
                break;

            case "touchmove":
                if (touchId != null && isDownMouse) {
                    for (let i = 0; i < event.changedTouches.length; ++i) {
                        let touch = event.targetTouches[i];
                        if (touch.identifier == touchId) {
                            onMotionGL(touch.clientX - touchX, touch.clientY - touchY);
                            touchX = touch.clientX;
                            touchY = touch.clientY;
                        }
                    }
                }
                break;

            case "touchend":
            case "touchcancel":
                if (touchId != null) {
                    for (let i = 0; i < event.changedTouches.length; ++i) {
                        let touch = event.changedTouches[i];
                        if (touch.identifier == touchId) {
                            touchId = null;
                            isDownMouse = false;
                        }
                    }
                }
                break;
        }
    }

    // イベント登録
    addEventListener("load", onLoad);
    addEventListener("unload", onUnload);
    addEventListener("resize", onResize);
    addEventListener('dragover', onDragOver);
    addEventListener('drop', onDrop);

    ////////////////////////////////////////////////////////////////
    // 描画関連

    let gl;
    let shaderProgram;
    let shaderAttributes;
    let shaderUniforms;
    let boxVertices;

    let boxElements;
    let workMatrix;

    let canAnimation;
    let autoRotation;
    let viewYow;
    let viewPitch;
    let prevTime;
    let frequencyVisualizerParams; // ビジュアライザ用のパラメータ [チャネル][周波数バインド][履歴]

    // WebGLの初期化
    function initializeGL() {
        // コンテキストの初期化
        gl = mainCanvas.getContext("webgl") || mainCanvas.getContext("experimental-webgl");

        // シェーダの生成
        shaderAttributes = {
            "a_position": 0,
            "a_color": 1
        };
        shaderUniforms = {
            "u_projection": -1,
            "u_view": -1,
            "u_model": -1,
            "u_color": -1
        };
        shaderProgram = tutils.createShaderProgram(
            gl, document.getElementById("vs").text, document.getElementById("fs").text,
            shaderAttributes, shaderUniforms);

        // モデルの生成
        boxVertices = tutils.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array([
            0.5, 0.0, 0.5, 0.0, 0.0, 0.0, 1.0,
            0.5, 0.0, -0.5, 0.0, 0.0, 0.0, 1.0,
            -0.5, 0.0, -0.5, 0.0, 0.0, 0.0, 1.0,
            -0.5, 0.0, 0.5, 0.0, 0.0, 0.0, 1.0,
            0.5, 1.0, 0.5, 1.0, 1.0, 1.0, 1.0,
            0.5, 1.0, -0.5, 1.0, 1.0, 1.0, 1.0,
            -0.5, 1.0, -0.5, 1.0, 1.0, 1.0, 1.0,
            -0.5, 1.0, 0.5, 1.0, 1.0, 1.0, 1.0
        ]), gl.STATIC_DRAW);
        boxElements = tutils.createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
            0, 1, 2, 0, 2, 3,
            4, 6, 5, 4, 7, 6,
            0, 3, 4, 3, 7, 4,
            0, 4, 1, 1, 4, 5,
            2, 7, 3, 2, 6, 7,
            1, 5, 2, 2, 5, 6
        ]), gl.STATIC_DRAW);

        // 汎用設定の初期化
        gl.clearColor(0.125, 0.125, 0.125, 1.0);
        gl.enable(gl.CULL_FACE);
        //gl.enable(gl.DEPTH_TEST); // 加算合成のみで描画順に依存させないため深度テストは使用しない
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE);

        // その他の初期化
        workMatrix = new Float32Array(16);
        frequencyVisualizerParams = new Array(2);
        for (let i = 0; i < 2; ++i) {
            frequencyVisualizerParams[i] = new Array(NUM_VISUALIZE_BINDS);
            for (let j = 0; j < NUM_VISUALIZE_BINDS; ++j) {
                frequencyVisualizerParams[i][j] = new Float32Array(NUM_VISUALIZE_HISTORIES);
            }
        }

        autoRotation = true;
        viewYow = -0.5;
        viewPitch = 0.2;
        canAnimation = true;
    }

    // WebGLの後処理
    function terminateGL() {
        if (!isLostGL()) {
            canAnimation = false;
            gl.deleteBuffer(boxVertices);
            gl.deleteBuffer(boxElements);
            gl.deleteProgram(shaderProgram);
        }
    }

    // コンテキストロストが起こっていないかチェック
    function isLostGL() {
        let error = gl.getError();
        return error != gl.NO_ERROR && error != gl.CONTEXT_LOST_WEBGL;
    }

    // ビジュアライザーのパラメータを更新
    function updateFrequencyVisualizerParam(channel, frequency) {
        for (let i = 0; i < NUM_VISUALIZE_BINDS; ++i) {
            // 特徴的な周波数成分は低周波数に集まりやすいので、低周波数の音を中心に解像度を上げる
            let indexFq = (Math.round(NUM_SAMPLES * Math.pow(0.5, i * NUM_FREQUENCY_BUNDLES / NUM_VISUALIZE_BINDS)) - 1) << 1;

            // 複素数の絶対値を求める
            let re = frequency[indexFq];
            let im = frequency[indexFq + 1];
            let volume = Math.sqrt(re * re + im * im) * 0.1;

            // 保持されているボリューム値より大きければ上書き
            let indexVol = NUM_VISUALIZE_BINDS - i - 1;
            frequencyVisualizerParams[channel][indexVol][0] =
                Math.max(frequencyVisualizerParams[channel][indexVol][0], volume);
        }
    }

    // モーションイベント
    function onMotionGL(dx, dy) {
        autoRotation = false;
        let weight = Math.min(mainCanvas.width, mainCanvas.height);
        viewYow += Math.PI * dx / weight;
        viewPitch += Math.PI * dy / weight;
    }

    // アニメーション処理
    function onAnimationGL() {
        if (!canAnimation) {
            return;
        }
        requestAnimationFrame(onAnimationGL);

        // 時間の差分を計測
        let nowTime = new Date().getTime();
        let delta = prevTime != null ? Math.min(Math.max((nowTime - prevTime) / 1000.0, 1.0 / 120.0), 1.0 / 30.0) : 0.0;
        prevTime = nowTime;

        // コンテキストのロストチェック
        if (isLostGL()) {
            initializeGL();
        }

        // 描画前の設定
        gl.viewport(0, 0, mainCanvas.width, mainCanvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(shaderProgram);

        // プロジェクション行列の設定
        tutils.setIdentityMatrix(workMatrix);
        if (navigation.style.display == "" || navigation.style.display == "block") {
            tutils.mulTranslateMatrix(workMatrix, navigation.clientWidth / mainCanvas.clientWidth, 0, 0);
        }
        tutils.mulProjectionMatrix(
            workMatrix,
            Math.min(mainCanvas.width / mainCanvas.height, 1.0),
            Math.min(mainCanvas.height / mainCanvas.width, 1.0),
            0.4, 100);
        gl.uniformMatrix4fv(shaderUniforms.u_projection, false, workMatrix);

        // ビュー行列の設定
        tutils.setIdentityMatrix(workMatrix);
        tutils.mulViewMatrix(
            workMatrix,
            0, 0, -30,
            0, 0, 0,
            0, -1, 0);
        tutils.mulRotationMatrix(workMatrix, -1.0, 0.0, 0.0, viewPitch);
        tutils.mulRotationMatrix(workMatrix, 0.0, -1.0, 0.0, viewYow);
        tutils.mulTranslateMatrix(workMatrix, 0.0, -7.0, 0.0);

        gl.uniformMatrix4fv(shaderUniforms.u_view, false, workMatrix);

        // モデルの有効化
        gl.bindBuffer(gl.ARRAY_BUFFER, boxVertices);
        gl.enableVertexAttribArray(shaderAttributes.a_position);
        gl.vertexAttribPointer(shaderAttributes.a_position, 3, gl.FLOAT, false, 4 * (3 + 4), 0);
        gl.enableVertexAttribArray(shaderAttributes.a_color);
        gl.vertexAttribPointer(shaderAttributes.a_color, 4, gl.FLOAT, false, 4 * (3 + 4), 4 * 3);

        // ビジュアライザの描画
        for (let i = 0; i < 2; ++i) {
            let xSign;
            if (i == 0) {
                xSign = 1;
                gl.uniform4f(shaderUniforms.u_color, 1.0, 0.25, 0.125, 1.0);
            } else {
                xSign = -1;
                gl.uniform4f(shaderUniforms.u_color, 0.125, 0.5, 1.0, 1.0);
            }

            for (let j = 0; j < NUM_VISUALIZE_BINDS; ++j) {
                for (let k = 0; k < NUM_VISUALIZE_HISTORIES; ++k) {
                    let volume = frequencyVisualizerParams[i][j][k] * (NUM_VISUALIZE_HISTORIES - k) / NUM_VISUALIZE_HISTORIES;

                    // モデル行列の設定
                    tutils.setIdentityMatrix(workMatrix);
                    tutils.mulTranslateMatrix(workMatrix, xSign * (-1.0 + -1.25 * k), 0, -1.25 * (j - NUM_VISUALIZE_BINDS / 2));
                    tutils.mulScaleMatrix(workMatrix, 0.5, Math.max(volume, 0.01), 0.5);
                    gl.uniformMatrix4fv(shaderUniforms.u_model, false, workMatrix);

                    // 箱の描画
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxElements);
                    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

                    // 減衰処理
                    if (k == 0) {
                        frequencyVisualizerParams[i][j][k] *= Math.pow(0.125, delta);
                    } else if (k > 0) {
                        frequencyVisualizerParams[i][j][k] *= Math.pow(0.125, delta);
                        frequencyVisualizerParams[i][j][k] +=
                            (frequencyVisualizerParams[i][j][k - 1] - frequencyVisualizerParams[i][j][k]) * delta * 15.0;
                    }
                }
            }
        }

        // 箱の無効化
        gl.disableVertexAttribArray(shaderAttributes.a_position);
        gl.disableVertexAttribArray(shaderAttributes.a_color);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // アニメーション
        if (autoRotation) {
            viewYow += 0.04 * delta;
        }
    }

})();
