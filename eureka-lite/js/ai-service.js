/**
 * Eureka Lite - AI Service (DeepSeek)
 * ---------------------------------------------------------------
 * 真实的大模型调用层，封装 DeepSeek（OpenAI 兼容）chat/completions 接口。
 * - chat(messages, options)      : 通用对话，返回纯文本
 * - complete(prompt, options)    : 单轮补全（system + user）
 * - completeJSON(prompt, options): 要求返回 JSON，自动解析
 * - isReady()                    : 是否已配置可用的 Key
 *
 * 设计原则：
 * - 任何错误都以 throw 抛出，由调用方决定是否回退到本地模板（graceful degradation）。
 * - 不在控制台打印 Key。
 */
const AIService = {
  _cfg() {
    const base = window.AI_CONFIG || {};
    // 允许用户用自己的 Key 覆盖（存 localStorage）
    let userKey = null;
    try {
      if (base.allowUserOverride) userKey = localStorage.getItem('eureka_user_api_key');
    } catch (e) {}
    return {
      apiKey: (userKey && userKey.trim()) || base.apiKey || '',
      baseUrl: base.baseUrl || 'https://api.deepseek.com/chat/completions',
      model: base.model || 'deepseek-chat',
      temperature: typeof base.temperature === 'number' ? base.temperature : 0.7,
      maxTokens: base.maxTokens || 1200,
      timeoutMs: base.timeoutMs || 30000
    };
  },

  isReady() {
    const c = this._cfg();
    return !!(c.apiKey && c.apiKey.startsWith('sk-') && c.apiKey.length > 20);
  },

  /**
   * 通用对话
   * @param {Array<{role:string, content:string}>} messages
   * @param {Object} options - { temperature, maxTokens, json }
   * @returns {Promise<string>} 模型返回的文本
   */
  async chat(messages, options = {}) {
    const c = this._cfg();
    if (!this.isReady()) {
      throw new Error('AI_NOT_CONFIGURED');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), c.timeoutMs);

    const body = {
      model: c.model,
      messages,
      temperature: options.temperature ?? c.temperature,
      max_tokens: options.maxTokens ?? c.maxTokens,
      stream: false
    };
    if (options.json) {
      body.response_format = { type: 'json_object' };
    }

    try {
      const resp = await fetch(c.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${c.apiKey}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!resp.ok) {
        let detail = '';
        try {
          const errJson = await resp.json();
          detail = errJson?.error?.message || JSON.stringify(errJson);
        } catch (e) {
          detail = await resp.text().catch(() => '');
        }
        throw new Error(`AI_HTTP_${resp.status}: ${detail}`);
      }

      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('AI_EMPTY_RESPONSE');
      return content.trim();
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('AI_TIMEOUT');
      throw err;
    } finally {
      clearTimeout(timer);
    }
  },

  /**
   * 单轮补全
   * @param {string} prompt - 用户内容
   * @param {Object} options - { system, temperature, maxTokens }
   */
  async complete(prompt, options = {}) {
    const messages = [];
    if (options.system) messages.push({ role: 'system', content: options.system });
    messages.push({ role: 'user', content: prompt });
    return this.chat(messages, options);
  },

  /**
   * 要求返回 JSON 并解析
   * @returns {Promise<Object>}
   */
  async completeJSON(prompt, options = {}) {
    const sys = (options.system ? options.system + '\n\n' : '') +
      '请只返回一个合法的 JSON 对象，不要包含任何解释文字、注释或 Markdown 代码块标记。';
    const text = await this.complete(prompt, { ...options, system: sys, json: true });
    return this._parseJSON(text);
  },

  _parseJSON(text) {
    if (!text) throw new Error('AI_EMPTY_RESPONSE');
    let t = text.trim();
    // 去除 ```json ... ``` 包裹
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    try {
      return JSON.parse(t);
    } catch (e) {
      // 尝试截取第一个 { 到最后一个 }
      const start = t.indexOf('{');
      const end = t.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        return JSON.parse(t.slice(start, end + 1));
      }
      throw new Error('AI_JSON_PARSE_FAILED');
    }
  },

  /**
   * 连接测试
   * @returns {Promise<{ok:boolean, message:string}>}
   */
  async test() {
    if (!this.isReady()) {
      return { ok: false, message: '未配置 API Key' };
    }
    try {
      const r = await this.complete('回复"pong"两个字即可。', { maxTokens: 10, temperature: 0 });
      return { ok: true, message: r };
    } catch (e) {
      return { ok: false, message: e.message || String(e) };
    }
  }
};

window.AIService = AIService;
