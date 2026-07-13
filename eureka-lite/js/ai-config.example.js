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
