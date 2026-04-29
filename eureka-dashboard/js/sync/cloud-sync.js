/**
 * Eureka Dashboard 云端同步模块
 * 支持 Supabase / 腾讯云开发 / 本地模拟三种模式
 * @version 2.0.0
 */

// ═══════════════════════════════════════════════════════════
// 配置常量
// ═══════════════════════════════════════════════════════════
const SYNC_CONFIG = {
  // 存储键名
  STORAGE_KEYS: {
    SYNC_TOKEN: 'eureka_sync_token_v1',      // 同步令牌（用户标识）
    SYNC_CONFIG: 'eureka_sync_config_v1',     // 同步配置
    LAST_SYNC: 'eureka_last_sync_v1',         // 最后同步时间
    PENDING_CHANGES: 'eureka_pending_v1'      // 待同步的变更
  },
  
  // 同步模式
  MODE: {
    OFFLINE: 'offline',           // 纯离线模式（游客默认）
    SUPABASE: 'supabase',         // Supabase 云同步（登录用户）
    TENCENT_CLOUD: 'tencent_cloud', // 腾讯云开发（保留，暂不使用）
    MOCK: 'mock'                  // 本地模拟（测试用）
  },
  
  // 默认配置
  DEFAULTS: {
    autoSync: true,               // 自动同步
    syncInterval: 30000,          // 自动同步间隔（30秒）
    conflictResolution: 'timestamp' // 冲突解决策略：timestamp（时间戳优先）
  }
};

// ═══════════════════════════════════════════════════════════
// 同步状态管理
// ═══════════════════════════════════════════════════════════
const SyncState = {
  mode: SYNC_CONFIG.MODE.OFFLINE,  // 当前模式
  isInitialized: false,            // 是否已初始化
  isSyncing: false,                // 是否正在同步
  lastSyncTime: null,              // 最后同步时间
  pendingCount: 0,                 // 待同步变更数
  userId: null,                    // 当前用户ID
  
  // 状态监听器
  listeners: [],
  
  // 更新状态并通知监听器
  update(updates) {
    Object.assign(this, updates);
    this.listeners.forEach(cb => cb({ ...this }));
  },
  
  // 订阅状态变化
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
};

// ═══════════════════════════════════════════════════════════
// 云存储适配器接口
// ═══════════════════════════════════════════════════════════
class CloudStorageAdapter {
  constructor() {
    this.name = 'base';
  }
  
  // 初始化适配器
  async init() {
    throw new Error('Not implemented');
  }
  
  // 获取用户ID
  async getUserId() {
    throw new Error('Not implemented');
  }
  
  // 上传数据
  async upload(data) {
    throw new Error('Not implemented');
  }
  
  // 下载数据
  async download() {
    throw new Error('Not implemented');
  }
  
  // 获取服务器时间戳
  async getServerTimestamp() {
    return Date.now();
  }
}

// ═══════════════════════════════════════════════════════════
// 微信云开发适配器
// ═══════════════════════════════════════════════════════════
class WechatCloudAdapter extends CloudStorageAdapter {
  constructor() {
    super();
    this.name = 'wechat_cloud';
    this.db = null;
  }
  
  async init() {
    // 检查是否在小程序环境
    if (typeof wx === 'undefined' || !wx.cloud) {
      throw new Error('不在微信云开发环境中');
    }
    
    // 初始化云开发
    wx.cloud.init({
      env: 'your-env-id', // 需要在配置中设置
      traceUser: true
    });
    
    this.db = wx.cloud.database();
    return true;
  }
  
  async getUserId() {
    // 调用云函数获取 openid
    const { result } = await wx.cloud.callFunction({
      name: 'getUserInfo'
    });
    return result.openid;
  }
  
  async upload(data) {
    const { userId, projects, trash, timestamp } = data;
    
    await this.db.collection('eureka_projects').doc(userId).set({
      data: {
        projects,
        trash,
        updatedAt: timestamp,
        _syncVersion: 1
      }
    });
    
    return { success: true, timestamp };
  }
  
  async download() {
    const { data } = await this.db.collection('eureka_projects')
      .doc(SyncState.userId)
      .get();
    
    return data || null;
  }
}

// ═══════════════════════════════════════════════════════════
// 腾讯云开发适配器
// ═══════════════════════════════════════════════════════════
class TencentCloudAdapter extends CloudStorageAdapter {
  constructor(envId = 'eureka-8g0iymqr969c1b32') {
    super();
    this.name = 'tencent_cloud';
    this.envId = envId;
    this.db = null;
    this.auth = null;
  }
  
  async init() {
    // 检查是否加载了 TCB SDK
    if (typeof tcb === 'undefined') {
      // 动态加载 TCB SDK
      await this.loadScript('https://imgcache.qq.com/qcloud/tcbjs/1.10.10/tcb.js');
    }
    
    // 初始化 TCB
    this.app = tcb.init({
      env: this.envId
    });
    
    // 获取数据库引用
    this.db = this.app.database();
    this.auth = this.app.auth();
    
    // 匿名登录
    await this.auth.signInAnonymously();
    
    console.log('[Sync] Tencent Cloud adapter initialized, env:', this.envId);
    return true;
  }
  
  // 动态加载脚本
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  async getUserId() {
    // 使用匿名登录的 UID 作为用户标识
    const user = this.auth.currentUser;
    if (user) {
      return user.uid;
    }
    // 如果没有登录，生成一个本地标识
    let localId = localStorage.getItem('eureka_tcb_user_id');
    if (!localId) {
      localId = 'tcb_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('eureka_tcb_user_id', localId);
    }
    return localId;
  }
  
  async upload(data) {
    // data 可以是项目数组或包含 projects 的对象
    let projects = [];
    let timestamp = Date.now();

    if (Array.isArray(data)) {
      // 传入的是项目数组
      projects = data;
    } else if (data && typeof data === 'object') {
      // 传入的是包含 projects 的对象
      projects = data.projects || [];
      timestamp = data.timestamp || timestamp;
    }

    try {
      await this.db.collection('eureka_projects').doc(SyncState.userId).set({
        projects: projects,
        updatedAt: timestamp,
        _syncVersion: 2,
        _device: 'web'
      }, { upsert: true }); // 使用 upsert 确保创建或更新

      console.log('[Sync] Tencent Cloud upload success:', { userId: SyncState.userId, projectCount: projects.length });
      return { success: true, timestamp };
    } catch (err) {
      console.error('[Sync] Tencent Cloud upload failed:', err);
      throw err;
    }
  }

  async download() {
    if (!SyncState.userId) {
      console.warn('[Sync] No userId, cannot download');
      return null;
    }

    try {
      const result = await this.db.collection('eureka_projects')
        .doc(SyncState.userId)
        .get();

      const data = result.data;
      if (data && data.projects) {
        console.log('[Sync] Tencent Cloud download success:', { projectCount: data.projects.length });
        return {
          projects: data.projects,
          timestamp: data.updatedAt || 0
        };
      }
      return null;
    } catch (err) {
      console.error('[Sync] Tencent Cloud download failed:', err);
      return null;
    }
  }
}

// ═══════════════════════════════════════════════════════════
// 本地模拟适配器（测试用）
// ═══════════════════════════════════════════════════════════
class MockCloudAdapter extends CloudStorageAdapter {
  constructor() {
    super();
    this.name = 'mock';
    this.mockStorage = new Map();
  }
  
  async init() {
    console.log('[Sync] Mock adapter initialized');
    return true;
  }
  
  async getUserId() {
    // 生成模拟用户ID
    let userId = localStorage.getItem('eureka_mock_user_id');
    if (!userId) {
      userId = 'mock_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('eureka_mock_user_id', userId);
    }
    return userId;
  }
  
  async upload(data) {
    const { userId, projects, trash, timestamp } = data;
    
    // 模拟网络延迟
    await this.delay(500);
    
    this.mockStorage.set(userId, {
      projects,
      trash,
      updatedAt: timestamp,
      _syncVersion: 1
    });
    
    console.log('[Sync] Mock upload success:', { userId, projectCount: projects.length });
    return { success: true, timestamp };
  }
  
  async download() {
    await this.delay(300);
    const data = this.mockStorage.get(SyncState.userId);
    console.log('[Sync] Mock download:', data ? 'found' : 'not found');
    return data || null;
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════════
// 同步引擎
// ═══════════════════════════════════════════════════════════
class SyncEngine {
  constructor() {
    this.adapter = null;
    this.autoSyncTimer = null;
  }
  
  // 初始化同步引擎
  async init(mode = SYNC_CONFIG.MODE.MOCK) {
    try {
      // 创建适配器
      switch (mode) {
        case SYNC_CONFIG.MODE.SUPABASE:
          this.adapter = new SupabaseAdapter();
          break;
        case SYNC_CONFIG.MODE.TENCENT_CLOUD:
          this.adapter = new TencentCloudAdapter();
          break;
        case SYNC_CONFIG.MODE.MOCK:
          this.adapter = new MockCloudAdapter();
          break;
        default:
          this.adapter = new MockCloudAdapter();
          break;
      }
      
      // 初始化适配器
      console.log('[SyncEngine] Initializing adapter:', mode);
      await this.adapter.init();
      console.log('[SyncEngine] Adapter initialized, checking session...');
      
      // 获取用户ID
      SyncState.userId = await this.adapter.getUserId();
      
      // 加载同步配置
      this.loadConfig();
      
      // 更新状态
      SyncState.update({
        mode,
        isInitialized: true,
        lastSyncTime: this.getLastSyncTime()
      });
      
      // 启动自动同步
      if (SyncState.mode !== SYNC_CONFIG.MODE.OFFLINE) {
        this.startAutoSync();
      }
      
      console.log('[Sync] Engine initialized:', { mode, userId: SyncState.userId });
      return true;
      
    } catch (err) {
      console.error('[Sync] Init failed:', err);
      SyncState.update({ mode: SYNC_CONFIG.MODE.OFFLINE });
      return false;
    }
  }
  
  // 加载同步配置
  loadConfig() {
    try {
      const config = JSON.parse(
        localStorage.getItem(SYNC_CONFIG.STORAGE_KEYS.SYNC_CONFIG) || '{}'
      );
      return { ...SYNC_CONFIG.DEFAULTS, ...config };
    } catch {
      return SYNC_CONFIG.DEFAULTS;
    }
  }
  
  // 保存同步配置
  saveConfig(config) {
    localStorage.setItem(
      SYNC_CONFIG.STORAGE_KEYS.SYNC_CONFIG,
      JSON.stringify(config)
    );
  }
  
  // 获取最后同步时间
  getLastSyncTime() {
    const time = localStorage.getItem(SYNC_CONFIG.STORAGE_KEYS.LAST_SYNC);
    return time ? parseInt(time, 10) : null;
  }
  
  // 保存最后同步时间
  setLastSyncTime(timestamp) {
    localStorage.setItem(SYNC_CONFIG.STORAGE_KEYS.LAST_SYNC, String(timestamp));
    SyncState.update({ lastSyncTime: timestamp });
  }
  
  // 执行同步
  async sync(force = false) {
    if (SyncState.isSyncing) {
      console.log('[Sync] Already syncing, skip');
      return { success: false, reason: 'already_syncing' };
    }
    
    if (SyncState.mode === SYNC_CONFIG.MODE.OFFLINE) {
      return { success: false, reason: 'offline_mode' };
    }
    
    // Supabase 游客模式：不上云，只用本地
    if (SyncState.mode === SYNC_CONFIG.MODE.SUPABASE && !SyncState.userId) {
      return { success: true, reason: 'guest_mode', hasChanges: false };
    }
    
    SyncState.update({ isSyncing: true });
    
    try {
      // 1. 获取本地数据
      const storage = typeof ProjectStorage !== 'undefined' ? new ProjectStorage() : null;
      const localProjects = storage ? storage.getAll() : [];
      const localTimestamp = Date.now();
      
      // 2. 下载云端数据
      const cloudData = await this.adapter.download();
      
      // 3. 合并数据（冲突解决）
      const merged = this.mergeData(
        { projects: localProjects, timestamp: localTimestamp },
        cloudData
      );
      
      // 4. 如果有变更，上传合并后的数据
      if (merged.hasChanges || force) {
        const uploadResult = await this.adapter.upload({
          projects: merged.projects,
          timestamp: localTimestamp
        });

        // 游客模式跳过上传
        if (uploadResult && uploadResult.reason === 'guest_mode') {
          console.log('[Sync] Guest mode, local only');
        } else if (merged.projects !== localProjects && storage) {
          storage.save(merged.projects);
        }
      }
      
      // 5. 更新同步时间
      this.setLastSyncTime(localTimestamp);
      
      console.log('[Sync] Success:', { 
        projects: merged.projects.length,
        hasChanges: merged.hasChanges 
      });
      
      return { 
        success: true, 
        timestamp: localTimestamp,
        hasChanges: merged.hasChanges
      };
      
    } catch (err) {
      console.error('[Sync] Failed:', err);
      return { success: false, reason: 'error', error: err.message };
      
    } finally {
      SyncState.update({ isSyncing: false });
    }
  }
  
  // 合并数据（冲突解决）- 简化版：本地优先，有变更则上传
  mergeData(local, cloud) {
    // 如果云端没有数据，直接上传本地
    if (!cloud || !cloud.projects) {
      return {
        projects: local.projects || [],
        hasChanges: true
      };
    }

    // 获取本地最后更新时间
    const localTime = local.timestamp || 0;
    const cloudTime = cloud.timestamp || cloud.updatedAt || 0;

    // 使用时间戳策略：新的覆盖旧的
    if (localTime > cloudTime) {
      // 本地更新，需要上传
      return {
        projects: local.projects || [],
        hasChanges: true
      };
    } else if (cloudTime > localTime) {
      // 云端更新，需要下载
      return {
        projects: cloud.projects || [],
        hasChanges: true
      };
    } else {
      // 时间相同，数据相同，无需同步
      return {
        projects: local.projects || [],
        hasChanges: false
      };
    }
  }
  
  // 启动自动同步
  startAutoSync() {
    const config = this.loadConfig();
    if (!config.autoSync) return;
    
    this.stopAutoSync();
    this.autoSyncTimer = setInterval(() => {
      this.sync();
    }, config.syncInterval);
    
    console.log('[Sync] Auto sync started, interval:', config.syncInterval);
  }
  
  // 停止自动同步
  stopAutoSync() {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }
  
  // 切换到离线模式
  goOffline() {
    this.stopAutoSync();
    SyncState.update({ mode: SYNC_CONFIG.MODE.OFFLINE });
    console.log('[Sync] Switched to offline mode');
  }
  
  // 获取同步状态
  getStatus() {
    return {
      ...SyncState,
      isOnline: SyncState.mode !== SYNC_CONFIG.MODE.OFFLINE,
      canSync: SyncState.isInitialized && SyncState.mode !== SYNC_CONFIG.MODE.OFFLINE
    };
  }
}

// ═══════════════════════════════════════════════════════════
// 全局实例
// ═══════════════════════════════════════════════════════════
const syncEngine = new SyncEngine();

// 便捷函数
async function initSync(mode) {
  return syncEngine.init(mode);
}

async function syncNow(force = false) {
  return syncEngine.sync(force);
}

function getSyncStatus() {
  return syncEngine.getStatus();
}

function goOffline() {
  syncEngine.goOffline();
}

// 导出全局
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SyncEngine,
    SyncState,
    SYNC_CONFIG,
    CloudStorageAdapter,
    TencentCloudAdapter,
    MockCloudAdapter,
    syncEngine,
    initSync,
    syncNow,
    getSyncStatus,
    goOffline
  };
}
