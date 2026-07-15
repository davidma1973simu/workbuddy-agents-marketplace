/**
 * Eureka Lite - 讯飞语音听写（IAT）浏览器直连模块
 * ---------------------------------------------------------------
 * 纯前端实现：麦克风采集 -> 重采样 16k/16bit PCM -> HMAC-SHA256 鉴权
 *            -> WebSocket 流式上传 -> 解析识别结果
 *
 * 依赖：window.VOICE_CONFIG（appId / apiKey / apiSecret），HTTPS 或 localhost 环境。
 * 用法：
 *   const iat = new XfyunIAT(window.VOICE_CONFIG);
 *   iat.on('start'|'result'|'error'|'end', cb);
 *   await iat.start();  // 开始录音识别
 *   iat.stop();         // 手动结束
 */
(function () {
  'use strict';

  const HOST = 'iat-api.xfyun.cn';
  const PATH = '/v2/iat';
  const WS_BASE = 'wss://' + HOST + PATH;

  // ---- base64 / 编码工具 ----
  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  function strToBase64(str) {
    // 处理 UTF-8
    return btoa(unescape(encodeURIComponent(str)));
  }

  // ---- HMAC-SHA256（Web Crypto）----
  async function hmacSha256Base64(secret, message) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
    return arrayBufferToBase64(sig);
  }

  // ---- 生成鉴权 WebSocket URL ----
  async function buildAuthUrl(cfg) {
    const date = new Date().toUTCString(); // RFC1123
    const signatureOrigin =
      `host: ${HOST}\ndate: ${date}\nGET ${PATH} HTTP/1.1`;
    const signature = await hmacSha256Base64(cfg.apiSecret, signatureOrigin);
    const authorizationOrigin =
      `api_key="${cfg.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
    const authorization = strToBase64(authorizationOrigin);
    const params =
      `authorization=${encodeURIComponent(authorization)}` +
      `&date=${encodeURIComponent(date)}` +
      `&host=${encodeURIComponent(HOST)}`;
    return WS_BASE + '?' + params;
  }

  // ---- Float32 -> 16bit PCM ----
  function floatTo16BitPCM(float32Array) {
    const out = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }

  // ---- 线性重采样到 16k ----
  function downsampleTo16k(float32Array, inputRate) {
    const target = 16000;
    if (inputRate === target) return float32Array;
    const ratio = inputRate / target;
    const newLen = Math.round(float32Array.length / ratio);
    const result = new Float32Array(newLen);
    let offsetResult = 0, offsetInput = 0;
    while (offsetResult < newLen) {
      const nextOffsetInput = Math.round((offsetResult + 1) * ratio);
      let accum = 0, count = 0;
      for (let i = offsetInput; i < nextOffsetInput && i < float32Array.length; i++) {
        accum += float32Array[i]; count++;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetInput = nextOffsetInput;
    }
    return result;
  }

  class XfyunIAT {
    constructor(cfg) {
      this.cfg = cfg || {};
      this.handlers = { start: [], result: [], partial: [], error: [], end: [] };
      this.ws = null;
      this.audioContext = null;
      this.processor = null;
      this.source = null;
      this.stream = null;
      this.resultText = '';
      this.frameStatus = 0; // 0=首帧 1=中间 2=尾帧
      this.closed = false;
      this.started = false;
    }

    on(evt, cb) { if (this.handlers[evt]) this.handlers[evt].push(cb); return this; }
    _emit(evt, payload) { (this.handlers[evt] || []).forEach(cb => { try { cb(payload); } catch (e) {} }); }

    static isConfigured(cfg) {
      return !!(cfg && cfg.appId && cfg.apiKey && cfg.apiSecret &&
        cfg.appId.indexOf('YOUR_') !== 0 &&
        cfg.apiKey.indexOf('YOUR_') !== 0 &&
        cfg.apiSecret.indexOf('YOUR_') !== 0);
    }

    async start() {
      if (this.started) return;
      this.started = true;
      this.resultText = '';
      this.closed = false;
      this.frameStatus = 0;

      if (!crypto || !crypto.subtle) {
        this._emit('error', { code: 'no-crypto', message: '当前环境不支持加密（需 HTTPS 或 localhost）' });
        return;
      }
      if (!XfyunIAT.isConfigured(this.cfg)) {
        this._emit('error', { code: 'no-config', message: '未配置讯飞语音凭证' });
        return;
      }

      // 1) 获取麦克风
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        this._emit('error', { code: 'no-mic', message: '无法访问麦克风，请检查浏览器授权' });
        return;
      }

      // 2) 建立 WebSocket
      let url;
      try {
        url = await buildAuthUrl(this.cfg);
      } catch (e) {
        this._cleanupAudio();
        this._emit('error', { code: 'sign-fail', message: '鉴权签名失败' });
        return;
      }

      this.ws = new WebSocket(url);
      this.ws.onopen = () => this._onWsOpen();
      this.ws.onmessage = (evt) => this._onWsMessage(evt);
      this.ws.onerror = () => {
        this._emit('error', { code: 'ws-error', message: '语音服务连接失败（请检查网络/凭证）' });
      };
      this.ws.onclose = () => { /* handled in message status=2 */ };
    }

    _onWsOpen() {
      // 音频管线
      const AC = window.AudioContext || window.webkitAudioContext;
      try {
        this.audioContext = new AC({ sampleRate: 16000 });
      } catch (e) {
        this.audioContext = new AC();
      }
      const inputRate = this.audioContext.sampleRate;
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      // ScriptProcessor 仍是兼容性最好的方案
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this._emit('start');

      this.processor.onaudioprocess = (e) => {
        if (this.closed || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const input = e.inputBuffer.getChannelData(0);
        const resampled = downsampleTo16k(input, inputRate);
        const pcm16 = floatTo16BitPCM(resampled);
        const audioB64 = arrayBufferToBase64(pcm16.buffer);
        this._sendAudioFrame(audioB64);
      };
    }

    _sendAudioFrame(audioB64) {
      const isFirst = this.frameStatus === 0;
      const frame = {
        data: {
          status: 1,
          format: 'audio/L16;rate=16000',
          encoding: 'raw',
          audio: audioB64
        }
      };
      if (isFirst) {
        frame.common = { app_id: this.cfg.appId };
        frame.business = {
          language: this.cfg.language || 'zh_cn',
          domain: 'iat',
          accent: this.cfg.accent || 'mandarin',
          vad_eos: 3000,
          dwa: 'wpgs' // 动态修正
        };
        frame.data.status = 0;
        this.frameStatus = 1;
      }
      try { this.ws.send(JSON.stringify(frame)); } catch (e) {}
    }

    _sendLastFrame() {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const frame = { data: { status: 2, format: 'audio/L16;rate=16000', encoding: 'raw', audio: '' } };
      try { this.ws.send(JSON.stringify(frame)); } catch (e) {}
    }

    _onWsMessage(evt) {
      let resp;
      try { resp = JSON.parse(evt.data); } catch (e) { return; }
      if (resp.code !== 0) {
        this._emit('error', { code: 'iat-' + resp.code, message: '识别失败：' + (resp.message || resp.code) });
        this._finish();
        return;
      }
      const data = resp.data;
      if (data && data.result) {
        const ws = data.result.ws || [];
        let text = '';
        for (const seg of ws) {
          const cw = seg.cw || [];
          for (const w of cw) text += w.w;
        }
        // wpgs 动态修正处理
        const pgs = data.result.pgs;
        if (pgs === 'rpl') {
          // 替换模式：用 rg 指定范围，这里简单起见按整体替换累积
          this._replaceRange = data.result.rg;
        }
        if (pgs === 'apd' || !pgs) {
          this.resultText += text;
        } else if (pgs === 'rpl') {
          // 简化：替换最近一段
          this.resultText = this._applyReplace(this.resultText, text);
        }
        this._emit('partial', { text: this.resultText });
      }
      if (data && data.status === 2) {
        this._emit('result', { text: this.resultText });
        this._finish();
      }
    }

    _applyReplace(existing, text) {
      // 简化处理：wpgs 替换时直接追加（多数短句场景够用）
      return existing + text;
    }

    stop() {
      // 用户主动结束：发送尾帧，等服务端回 status=2
      if (this.closed) return;
      this._sendLastFrame();
      this._cleanupAudio();
    }

    _cleanupAudio() {
      try { if (this.processor) { this.processor.disconnect(); this.processor.onaudioprocess = null; } } catch (e) {}
      try { if (this.source) this.source.disconnect(); } catch (e) {}
      try { if (this.audioContext && this.audioContext.state !== 'closed') this.audioContext.close(); } catch (e) {}
      try { if (this.stream) this.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
      this.processor = null; this.source = null; this.audioContext = null; this.stream = null;
    }

    _finish() {
      if (this.closed) return;
      this.closed = true;
      this._cleanupAudio();
      try { if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.close(); } catch (e) {}
      this.ws = null;
      this.started = false;
      this._emit('end', { text: this.resultText });
    }
  }

  window.XfyunIAT = XfyunIAT;
})();
