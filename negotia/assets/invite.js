/* 谈伴 · 邀请解锁
   只管三件事：我是谁（匿名 id）、我的邀请码、我邀请来的人打完了几个。
   读不到就返回 null，绝不编数字。 */
(function(){
  var GOAL = 3;
  var P = 'negotia_';
  var CFG = {
    endpoint:'https://negotia.app.workbuddy.host',
    oauthRelayBaseUrl:'https://www.workbuddy.cn/v2/as/genie-baas/oauth',
    publishableKey:'wbpk_VVJnePjQkfy9RKc1SxlPto_rNw5wGIvNWCyNcp2yzLiiA3iLDUTi6sM'
  };
  var ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  function get(k){
    try{ return localStorage.getItem(P + k); }catch(e){ return null; }
  }
  function set(k, v){
    try{ localStorage.setItem(P + k, v); }catch(e){}
  }
  function rnd(n){
    var out = '';
    try{
      var a = new Uint8Array(n);
      (window.crypto || window.msCrypto).getRandomValues(a);
      for(var i = 0; i < n; i++) out += ALPHA[a[i] % ALPHA.length];
    }catch(e){
      for(var j = 0; j < n; j++) out += ALPHA[Math.floor(Math.random() * ALPHA.length)];
    }
    return out;
  }

  function vid(){
    var v = get('vid');
    if(!v){ v = 'v' + rnd(18); set('vid', v); }
    return v;
  }
  function code(){
    var c = get('code');
    if(!c){ c = 'N' + rnd(7); set('code', c); }
    return c;
  }
  function ref(){
    var m = location.search.match(/[?&]ref=([A-Za-z0-9]+)/);
    return m ? m[1].toUpperCase() : '';
  }

  var client = null, tried = false;
  function sdk(){
    if(tried) return client;
    tried = true;
    try{
      if(!window.WorkBuddyCloud) return null;
      client = window.WorkBuddyCloud.createWorkBuddyCloud({
        endpoint: CFG.endpoint,
        oauthRelayBaseUrl: CFG.oauthRelayBaseUrl,
        publishableKey: CFG.publishableKey
      });
    }catch(e){ client = null; }
    return client;
  }

  function num(d){
    if(Array.isArray(d)) d = d.length ? d[0] : null;
    if(d && typeof d === 'object'){
      var k = Object.keys(d)[0];
      d = k ? d[k] : null;
    }
    var n = Number(d);
    return isFinite(n) ? n : 0;
  }

  /* 我的邀请进度：已完成一关的人数 */
  function progress(){
    var c = sdk();
    if(!c) return Promise.resolve(null);
    return c.database.rpc('lite_progress', { p_code: code() })
      .then(function(r){
        if(r.error) throw r.error;
        var n = num(r.data);
        set('inv_n', String(n));
        return n;
      });
  }

  /* 记一次：我被人用某个码带进来 / 我打完了邀请人的那一关 */
  function touch(owner, done){
    var c = sdk();
    if(!owner || owner === code()) return Promise.resolve(null);
    if(!c) return Promise.resolve(null);
    return c.database.rpc('lite_visit', { p_code: owner, p_visitor: vid(), p_done: !!done })
      .then(function(r){
        if(r.error) throw r.error;
        return num(r.data);
      });
  }

  /* 打开页面就先记一笔「有人来了」，让邀请人看到有人点开 */
  function recordVisit(){
    var r = ref();
    if(!r || r === code()) return;
    var k = 'seen_' + r;
    try{ if(sessionStorage.getItem(P + k)) return; sessionStorage.setItem(P + k, '1'); }catch(e){}
    touch(r, false).catch(function(){});
  }

  /* 我这一场打完了——如果我是被邀请来的，给邀请人加一 */
  function markDone(){
    var r = ref();
    if(!r || r === code()) return Promise.resolve(null);
    if(get('done_' + r) === '1') return Promise.resolve(null);
    return touch(r, true).then(function(n){
      set('done_' + r, '1');
      return n;
    }).catch(function(){ return null; });
  }

  /* 站点靠 sharecode 首次种 cookie，直链会 403：
     见过的 sharecode 存下来，邀请链接永远带上它 */
  function sharecode(){
    var m = location.search.match(/[?&]sharecode=([^&]+)/);
    if(m){
      try{ localStorage.setItem(P + 'sc', m[1]); }catch(e){}
      return m[1];
    }
    return get('sc') || '';
  }

  function link(){
    var q = [];
    if(sharecode()) q.push('sharecode=' + encodeURIComponent(sharecode()));
    q.push('mode=lite');
    q.push('ref=' + code());
    return location.origin + location.pathname + '?' + q.join('&');
  }

  window.Invite = {
    GOAL: GOAL,
    vid: vid,
    code: code,
    ref: ref,
    link: link,
    progress: progress,
    touch: touch,
    recordVisit: recordVisit,
    markDone: markDone,
    cached: function(){ var n = Number(get('inv_n')); return isFinite(n) ? n : null; },
    enabled: function(){ return !!sdk(); }
  };
})();
