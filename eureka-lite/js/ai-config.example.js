/**
 * Eureka Lite - AI Configuration Template
 * ---------------------------------------------------------------
 * 使用方法：
 *   1. 复制本文件为同目录下的 ai-config.js
 *   2. 填入你自己的 DeepSeek API Key（在 https://platform.deepseek.com 获取）
 *   3. ai-config.js 已被 .gitignore 排除，不会泄露到 Git 仓库
 *
 * 供应商：DeepSeek（OpenAI 兼容接口）
 */
window.AI_CONFIG = {
  provider: 'deepseek',
  apiKey: 'sk-YOUR_DEEPSEEK_API_KEY_HERE',
  baseUrl: 'https://api.deepseek.com/chat/completions',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 1200,
  timeoutMs: 30000,
  allowUserOverride: true
};

/**
 * 讯飞语音听写（IAT）配置 —— 首页输入框的语音输入
 * 使用方法：
 *   1. 在 https://www.xfyun.cn 控制台创建「语音听写」应用
 *   2. 复制 APPID / APIKey / APISecret 填入下方
 *   3. 若不配置，语音按钮会自动回退到浏览器原生 Web Speech API
 */
window.VOICE_CONFIG = {
  provider: 'xfyun',
  appId: 'YOUR_XFYUN_APPID',
  apiKey: 'YOUR_XFYUN_APIKEY',
  apiSecret: 'YOUR_XFYUN_APISECRET',
  language: 'zh_cn',
  accent: 'mandarin'
};
