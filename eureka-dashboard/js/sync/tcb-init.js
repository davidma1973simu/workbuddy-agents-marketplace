/**
 * Eureka TCB 云同步初始化
 * 使用 Tencent Cloud Base (TCB) 实现多用户数据同步
 *
 * 环境 ID: eureka-8g0iymqr969c1b32
 * 集合名: eureka_projects
 *
 * 使用方式：
 * 在 HTML 末尾引用此脚本即可启用云同步
 */

(function() {
  'use strict';

  var TCB_ENV = 'eureka-8g0iymqr969c1b32';
  var DB_NAME = 'eureka_projects';

  // 状态指示器样式
  var indicatorStyle = document.createElement('style');
  indicatorStyle.textContent = [
    '#tcb-sync-indicator {',
    '  display:flex;',
    '  align-items:center;',
    '  gap:6px;',
    '  padding:6px 12px;',
    '  background:rgba(255,255,255,.2);',
    '  border-radius:20px;',
    '  font-size:12px;',
    '  color:#fff;',
    '  cursor:pointer;',
    '  transition:all 0.2s;',
    '}',
    '#tcb-sync-indicator:hover {',
    '  background:rgba(255,255,255,.3);',
    '}',
    '#tcb-sync-indicator .dot {',
    '  width:8px;',
    '  height:8px;',
    '  border-radius:50%;',
    '  background:#fbbf24;',
    '  transition:background 0.2s;',
    '}',
    '#tcb-sync-indicator.synced .dot { background:#10b981; }',
    '#tcb-sync-indicator.error .dot { background:#ef4444; }',
    '@keyframes tcb-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }',
    '#tcb-sync-indicator.syncing .dot { animation:tcb-pulse 1s infinite; }',
    '.tcb-toast {',
    '  position:fixed;',
    '  bottom:32px;',
    '  left:50%;',
    '  transform:translateX(-50%) translateY(20px);',
    '  background:#1e293b;',
    '  color:#fff;',
    '  padding:12px 26px;',
    '  border-radius:12px;',
    '  font-size:14px;',
    '  font-weight:600;',
    '  opacity:0;',
    '  pointer-events:none;',
    '  transition:all 0.3s;',
    '  z-index:99999;',
    '  white-space:nowrap;',
    '  box-shadow:0 8px 24px rgba(0,0,0,.2);',
    '}',
    '.tcb-toast.show { opacity:1; transform:translateX(-50%) translateY(0); }'
  ].join('');
  document.head.appendChild(indicatorStyle);

  /**
   * 显示 Toast 提示
   */
  function showToast(message) {
    var toast = document.createElement('div');
    toast.className = 'tcb-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(function() {
      toast.classList.add('show');
    });
    setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() { toast.remove(); }, 300);
    }, 2000);
  }

  /**
   * 显示/更新同步状态指示器
   */
  function showSyncIndicator(status, text) {
    var nav = document.querySelector('.nav-actions') || document.querySelector('.nav-right') || document.querySelector('.top-nav');
    if (!nav) {
      console.log('[TCB] 未找到导航栏，跳过指示器');
      return;
    }

    var indicator = document.getElementById('tcb-sync-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'tcb-sync-indicator';
      indicator.innerHTML = '<span class="dot"></span><span class="text">同步中</span>';
      indicator.addEventListener('click', onSyncClick);
      nav.appendChild(indicator);
    }

    // 更新状态
    indicator.className = status || 'syncing';
    var textEl = indicator.querySelector('.text');
    if (textEl) textEl.textContent = text || '同步中';

    return indicator;
  }

  /**
   * 同步按钮点击处理
   */
  function onSyncClick() {
    showSyncIndicator('syncing', '同步中...');

    if (typeof syncNow === 'function') {
      syncNow(true).then(function(result) {
        if (result.success) {
          showSyncIndicator('synced', '已同步');
          showToast('数据已同步到云端');
        } else {
          showSyncIndicator('error', '同步失败');
          showToast('同步失败: ' + (result.error || result.reason));
        }
      }).catch(function(err) {
        showSyncIndicator('error', '同步失败');
        showToast('同步失败');
      });
    } else {
      showSyncIndicator('error', '未初始化');
    }
  }

  /**
   * 初始化 TCB 云同步
   */
  function initTCB() {
    // 检查 TCB SDK
    if (typeof tcb === 'undefined') {
      console.warn('[TCB] TCB SDK 未加载，尝试动态加载...');
      var script = document.createElement('script');
      script.src = 'https://imgcache.qq.com/qcloud/tcbjs/1.10.10/tcb.js';
      script.onload = function() {
        console.log('[TCB] SDK 动态加载成功');
        startInit();
      };
      script.onerror = function() {
        console.error('[TCB] SDK 加载失败');
        showSyncIndicator('error', 'SDK加载失败');
      };
      document.head.appendChild(script);
      return;
    }

    startInit();
  }

  /**
   * 开始初始化
   */
  function startInit() {
    showSyncIndicator('syncing', '连接中...');

    // 初始化云同步引擎
    if (typeof initSync === 'function') {
      initSync(SYNC_CONFIG.MODE.TENCENT_CLOUD).then(function() {
        console.log('[TCB] 云同步引擎初始化成功');
        showSyncIndicator('synced', '已同步');

        // 执行首次同步
        setTimeout(function() {
          if (typeof syncNow === 'function') {
            syncNow().then(function(result) {
              if (result.success) {
                showSyncIndicator('synced', '已同步');
              } else if (result.reason === 'not_initialized') {
                // 忽略未初始化
              } else {
                console.warn('[TCB] 首次同步结果:', result);
              }
            }).catch(function(err) {
              console.warn('[TCB] 首次同步异常:', err);
            });
          }
        }, 1000);

      }).catch(function(err) {
        console.error('[TCB] 云同步初始化失败:', err);
        showSyncIndicator('error', '初始化失败');
      });
    } else {
      console.error('[TCB] cloud-sync.js 未加载');
      showSyncIndicator('error', '模块未加载');
    }
  }

  /**
   * Toast 提示
   */
  window.TCBToast = showToast;

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initTCB, 500);
    });
  } else {
    setTimeout(initTCB, 500);
  }

  console.log('[TCB] TCB Init loaded, env:', TCB_ENV);

})();
