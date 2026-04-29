/**
 * Supabase 云存储适配器
 * 用于 Eureka Dashboard 云同步
 * 支持 Google 登录用户 + 游客本地模式
 */

class SupabaseAdapter extends CloudStorageAdapter {
  constructor() {
    super();
    this.name = 'supabase';
    this.db = null;
    this.supabase = null;
    this.session = null;
  }

  // 初始化 Supabase
  async init() {
    // 动态加载 Supabase SDK
    if (typeof window.supabase === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = () => console.log('[Supabase] SDK loaded');
      script.onerror = () => {
        console.error('[Supabase] SDK load failed');
        throw new Error('Supabase SDK 加载失败');
      };
      document.head.appendChild(script);
      // 等待脚本加载
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });
    }

    const supabaseUrl = 'https://xqexudggideubbesrypx.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXh1ZGdnaWRldWJiZXNyeXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDA1NjksImV4cCI6MjA5Mjk3NjU2OX0.zEHFdTAn3MkiXMKPMMEJluzR3wddR9cEMhiA5InHiSo';

    this.supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

    // 检查当前 session
    const { data } = await this.supabase.auth.getSession();
    this.session = data.session;

    // 监听登录状态变化
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.session = session;
      console.log('[Supabase] Auth event:', event);
      // 通知 UI 更新登录状态
      if (typeof SyncUI !== 'undefined' && SyncUI.updateAuthUI) {
        SyncUI.updateAuthUI();
      }
      // 更新 SyncState.userId
      if (typeof SyncState !== 'undefined') {
        SyncState.userId = session?.user?.id || null;
      }
    });

    console.log('[Supabase] Adapter initialized, user:', this.session?.user?.email || 'guest');
    return true;
  }

  // 获取用户ID（已登录返回真实ID，游客返回 null）
  async getUserId() {
    if (this.session?.user) {
      return this.session.user.id;
    }
    return null; // 游客模式
  }

  // 上传数据
  async upload(data) {
    if (!this.session?.user) {
      // 游客模式，不上传
      console.log('[Supabase] Guest mode, skip upload');
      return { success: true, reason: 'guest_mode' };
    }

    const userId = this.session.user.id;
    const { projects, timestamp } = data;

    // 先尝试更新已有记录
    const { data: existing } = await this.supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let result;
    if (existing) {
      // 更新
      result = await this.supabase
        .from('projects')
        .update({
          data: { projects, updated_at: new Date().toISOString() },
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // 新建
      result = await this.supabase
        .from('projects')
        .insert({
          user_id: userId,
          project_name: 'Eureka 项目',
          data: { projects, updated_at: new Date().toISOString() }
        });
    }

    if (result.error) {
      console.error('[Supabase] Upload failed:', result.error);
      throw result.error;
    }

    console.log('[Supabase] Upload success, projectCount:', projects.length);
    return { success: true, timestamp: Date.now() };
  }

  // 下载数据
  async download() {
    if (!this.session?.user) {
      // 游客模式，无云端数据
      console.log('[Supabase] Guest mode, no cloud data');
      return null;
    }

    const userId = this.session.user.id;

    const { data, error } = await this.supabase
      .from('projects')
      .select('data, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Supabase] Download failed:', error);
      throw error;
    }

    if (!data) {
      console.log('[Supabase] No cloud data found');
      return null;
    }

    console.log('[Supabase] Download success:', { projectCount: data.data.projects?.length });
    return {
      projects: data.data.projects || [],
      timestamp: new Date(data.updated_at).getTime()
    };
  }

  // 获取服务器时间戳
  async getServerTimestamp() {
    return Date.now();
  }

  // Google 登录
  async signInWithGoogle() {
    console.log('[Supabase] Starting Google OAuth...');
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href
        }
      });
      if (error) {
        console.error('[Supabase] OAuth error:', error);
        throw error;
      }
      console.log('[Supabase] OAuth initiated, data:', data);
      return data;
    } catch (err) {
      console.error('[Supabase] signInWithGoogle exception:', err);
      throw err;
    }
  }

  // 退出登录
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    this.session = null;
  }

  // 获取当前登录状态
  isLoggedIn() {
    return !!this.session?.user;
  }

  // 获取用户信息
  getUser() {
    return this.session?.user || null;
  }
}
