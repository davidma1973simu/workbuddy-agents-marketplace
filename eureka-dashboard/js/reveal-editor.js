/**
 * Eureka Reveal 阶段编辑器
 * POV、用户画像、利益相关者、场景地图
 */

class RevealEditor {
  constructor(storage) {
    this.storage = storage;
    this.container = null;
    this.projectId = null;
  }

  /**
   * 初始化编辑器
   */
  init(container, projectId) {
    this.container = container;
    this.projectId = projectId;
    this.render();
  }

  /**
   * 获取当前项目数据
   */
  getProject() {
    return this.storage.getById(this.projectId);
  }

  /**
   * 渲染编辑器
   */
  render() {
    const project = this.getProject();
    if (!project) {
      this.container.innerHTML = '<div class="error">项目不存在</div>';
      return;
    }

    const { reveal } = project;

    // 创建阶段导航器容器
    const stageNavContainer = document.createElement('div');
    stageNavContainer.id = 'stageNavigator';
    this.container.innerHTML = '';
    this.container.appendChild(stageNavContainer);

    // 渲染阶段导航器
    stageNavigator.render('stageNavigator', 'reveal', project);

    // 添加编辑器内容
    const editorContent = document.createElement('div');
    editorContent.innerHTML = `
      <div class="reveal-editor">
        <div class="editor-header">
          <h2>🔍 Reveal · 洞察层</h2>
          <p class="editor-subtitle">深入了解用户，发现核心痛点与机会</p>
        </div>

        <!-- POV 部分 -->
        <section class="editor-section">
          <h3>📌 POV（Point of View）</h3>
          <p class="section-desc">三段式洞察：目标用户 + 核心痛点 + 设计洞见</p>

          <div class="pov-form">
            <div class="form-group">
              <label class="form-label">目标用户</label>
              <textarea
                class="form-textarea pov-textarea"
                id="pov_targetUser"
                placeholder="例如：25-35岁的都市白领，注重效率与品质"
                rows="2"
              >${reveal.pov.targetUser}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">核心痛点</label>
              <textarea
                class="form-textarea pov-textarea"
                id="pov_painPoint"
                placeholder="例如：在零售门店选择商品时，面对众多选项感到困惑和焦虑"
                rows="2"
              >${reveal.pov.painPoint}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">设计洞见</label>
              <textarea
                class="form-textarea pov-textarea"
                id="pov_insight"
                placeholder="例如：智能推荐可以帮助用户减少选择焦虑，提升购物体验"
                rows="2"
              >${reveal.pov.insight}</textarea>
            </div>

            <button class="btn btn-secondary" onclick="revealEditor.generatePOV()">
              ✨ 自动生成 POV
            </button>

            <div class="pov-preview">
              <label class="form-label">POV 预览</label>
              <div class="pov-preview-box" id="povPreview">
                ${this.generatePOVPreview(reveal.pov)}
              </div>
            </div>
          </div>
        </section>

        <!-- 用户画像部分 -->
        <section class="editor-section">
          <h3>👤 用户画像</h3>
          <p class="section-desc">创建用户画像，理解目标用户的背景与需求</p>

          <div class="personas-list" id="personasList">
            ${reveal.personas.map((p, i) => this.renderPersonaCard(p, i)).join('')}
          </div>

          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">
            <button class="btn btn-primary" onclick="revealEditor.addPersona()">
              + 手动添加
            </button>
            <button class="btn btn-secondary" onclick="revealEditor.openPersonaLabImport()" title="读取上次从 Persona Lab 同步的角色数据">
              📥 从 Persona Lab 导入
            </button>
            <button class="btn btn-secondary" onclick="revealEditor.launchPersonaLab()" title="跳转到 Persona Lab 生成角色组，完成后同步回来">
              🎭 去 Persona Lab 生成
            </button>
          </div>
        </section>

        <!-- 利益相关者部分 -->
        <section class="editor-section">
          <h3>🤝 利益相关者分析</h3>
          <p class="section-desc">识别关键利益方，分析其立场与影响力</p>

          <div class="stakeholders-list" id="stakeholdersList">
            ${reveal.stakeholders.map((s, i) => this.renderStakeholderCard(s, i)).join('')}
          </div>

          <button class="btn btn-primary" onclick="revealEditor.addStakeholder()">
            + 添加利益相关者
          </button>
        </section>

        <!-- 场景地图部分 -->
        <section class="editor-section">
          <h3>🗺️ 场景地图</h3>
          <p class="section-desc">描绘用户旅程，识别关键触点与情绪变化</p>

          <div class="journey-map" id="journeyMap">
            ${reveal.journeyMap.map((j, i) => this.renderJourneyPoint(j, i)).join('')}
          </div>

          <button class="btn btn-primary" onclick="revealEditor.addJourneyPoint()">
            + 添加触点
          </button>
        </section>

        <div class="editor-actions">
          <button class="btn btn-secondary" onclick="revealEditor.saveDraft()">
            💾 保存草稿
          </button>
          <button class="btn btn-primary" onclick="revealEditor.saveAndNext()">
            保存并进入下一阶段 →
          </button>
        </div>
      </div>

      ${this.renderPersonaModal()}
      ${this.renderStakeholderModal()}
    `;

    this.container.appendChild(editorContent);
    this.bindEvents();
  }

  /**
   * 生成 POV 预览
   */
  generatePOVPreview(pov) {
    if (!pov.targetUser && !pov.painPoint && !pov.insight) {
      return '<p class="preview-placeholder">填写上方信息后自动生成 POV</p>';
    }

    return `
      <div class="pov-full">
        <p><strong>${pov.targetUser || '[目标用户]'}</strong>
        需要 <strong>${pov.painPoint || '[核心痛点]'}</strong>
        ，因为 <strong>${pov.insight || '[设计洞见]'}</strong></p>
      </div>
    `;
  }

  /**
   * 自动生成 POV
   */
  generatePOV() {
    const targetUser = document.getElementById('pov_targetUser').value;
    const painPoint = document.getElementById('pov_painPoint').value;
    const insight = document.getElementById('pov_insight').value;

    const preview = document.getElementById('povPreview');
    preview.innerHTML = this.generatePOVPreview({
      targetUser,
      painPoint,
      insight
    });

    showToast('POV 已生成');
  }

  /**
   * 渲染用户画像卡片
   */
  renderPersonaCard(persona, index) {
    return `
      <div class="persona-card">
        <div class="card-header">
          <span class="card-index">${index + 1}</span>
          <h4>${persona.name || '未命名'}</h4>
          <button class="btn-icon btn-delete" onclick="revealEditor.deletePersona(${index})">✕</button>
        </div>
        <div class="persona-details">
          <div class="detail-row">
            <strong>年龄:</strong> ${persona.age || '-'}
          </div>
          <div class="detail-row">
            <strong>职业:</strong> ${persona.occupation || '-'}
          </div>
          <div class="detail-row">
            <strong>痛点:</strong> ${persona.painPoints || '-'}
          </div>
          <button class="btn-text" onclick="revealEditor.editPersona(${index})">编辑 →</button>
        </div>
      </div>
    `;
  }

  /**
   * 渲染利益相关者卡片
   */
  renderStakeholderCard(stakeholder, index) {
    const stanceIcons = {
      support: '🟢',
      neutral: '🟡',
      oppose: '🔴'
    };

    return `
      <div class="stakeholder-card">
        <div class="card-header">
          <span class="card-index">${index + 1}</span>
          <h4>${stakeholder.name || stakeholder.role || '未命名'}</h4>
          <button class="btn-icon btn-delete" onclick="revealEditor.deleteStakeholder(${index})">✕</button>
        </div>
        <div class="stakeholder-details">
          <div class="detail-row">
            <strong>角色:</strong> ${stakeholder.role || '-'}
          </div>
          <div class="detail-row">
            <strong>立场:</strong> ${stanceIcons[stakeholder.stance] || '-'} ${stakeholder.stance || '-'}
          </div>
          <div class="detail-row">
            <strong>影响力:</strong> ${stakeholder.influence || '-'}
          </div>
          <button class="btn-text" onclick="revealEditor.editStakeholder(${index})">编辑 →</button>
        </div>
      </div>
    `;
  }

  /**
   * 渲染旅程触点
   */
  renderJourneyPoint(point, index) {
    return `
      <div class="journey-point">
        <div class="point-number">${index + 1}</div>
        <div class="point-content">
          <input
            type="text"
            class="form-input point-stage"
            value="${point.stage}"
            placeholder="阶段名称"
            onchange="revealEditor.updateJourneyPoint(${index}, 'stage', this.value)"
          />
          <input
            type="text"
            class="form-input point-touchpoint"
            value="${point.touchpoint}"
            placeholder="触点"
            onchange="revealEditor.updateJourneyPoint(${index}, 'touchpoint', this.value)"
          />
          <textarea
            class="form-textarea point-experience"
            placeholder="体验描述"
            onchange="revealEditor.updateJourneyPoint(${index}, 'experience', this.value)"
          >${point.experience}</textarea>
          <button class="btn-icon btn-delete" onclick="revealEditor.deleteJourneyPoint(${index})">✕</button>
        </div>
      </div>
    `;
  }

  /**
   * 添加用户画像
   */
  addPersona() {
    const project = this.getProject();
    project.reveal.personas.push({
      id: `persona_${Date.now()}`,
      name: '',
      age: '',
      occupation: '',
      background: '',
      painPoints: '',
      needs: '',
      scenario: ''
    });

    this.saveAndRender();
    this.openPersonaModal(project.reveal.personas.length - 1);
  }

  /**
   * 编辑用户画像
   */
  editPersona(index) {
    this.openPersonaModal(index);
  }

  /**
   * 删除用户画像
   */
  deletePersona(index) {
    if (!confirm('确定要删除这个用户画像吗？')) return;

    const project = this.getProject();
    project.reveal.personas.splice(index, 1);
    this.saveAndRender();
  }

  /**
   * 保存用户画像
   */
  savePersona() {
    const project = this.getProject();
    const index = document.getElementById('personaModal').dataset.index;
    const formData = new FormData(document.getElementById('personaForm'));

    project.reveal.personas[index] = {
      ...project.reveal.personas[index],
      name: formData.get('name'),
      age: formData.get('age'),
      occupation: formData.get('occupation'),
      background: formData.get('background'),
      painPoints: formData.get('painPoints'),
      needs: formData.get('needs'),
      scenario: formData.get('scenario')
    };

    this.saveAndRender();
    this.closePersonaModal();
    showToast('用户画像已保存');
  }

  /**
   * 打开用户画像模态框
   */
  openPersonaModal(index) {
    const project = this.getProject();
    const persona = project.reveal.personas[index];

    const modal = document.getElementById('personaModal');
    modal.dataset.index = index;
    modal.querySelector('.modal-body').innerHTML = `
      <form id="personaForm">
        <div class="form-group">
          <label class="form-label">姓名 *</label>
          <input type="text" class="form-input" name="name" value="${persona.name}" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">年龄</label>
            <input type="text" class="form-input" name="age" value="${persona.age}" />
          </div>
          <div class="form-group">
            <label class="form-label">职业</label>
            <input type="text" class="form-input" name="occupation" value="${persona.occupation}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">背景</label>
          <textarea class="form-textarea" name="background" rows="2">${persona.background}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">痛点</label>
          <textarea class="form-textarea" name="painPoints" rows="2">${persona.painPoints}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">需求</label>
          <textarea class="form-textarea" name="needs" rows="2">${persona.needs}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">场景</label>
          <textarea class="form-textarea" name="scenario" rows="2">${persona.scenario}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="revealEditor.closePersonaModal()">取消</button>
          <button type="button" class="btn btn-primary" onclick="revealEditor.savePersona()">保存</button>
        </div>
      </form>
    `;

    modal.classList.remove('hidden');
  }

  /**
   * 关闭用户画像模态框
   */
  closePersonaModal() {
    document.getElementById('personaModal').classList.add('hidden');
  }

  /**
   * 添加利益相关者
   */
  addStakeholder() {
    const project = this.getProject();
    project.reveal.stakeholders.push({
      id: `stakeholder_${Date.now()}`,
      name: '',
      role: '',
      stance: 'neutral',
      influence: 'medium'
    });

    this.saveAndRender();
    this.openStakeholderModal(project.reveal.stakeholders.length - 1);
  }

  /**
   * 编辑利益相关者
   */
  editStakeholder(index) {
    this.openStakeholderModal(index);
  }

  /**
   * 删除利益相关者
   */
  deleteStakeholder(index) {
    if (!confirm('确定要删除这个利益相关者吗？')) return;

    const project = this.getProject();
    project.reveal.stakeholders.splice(index, 1);
    this.saveAndRender();
  }

  /**
   * 保存利益相关者
   */
  saveStakeholder() {
    const project = this.getProject();
    const index = document.getElementById('stakeholderModal').dataset.index;
    const formData = new FormData(document.getElementById('stakeholderForm'));

    project.reveal.stakeholders[index] = {
      ...project.reveal.stakeholders[index],
      name: formData.get('name'),
      role: formData.get('role'),
      stance: formData.get('stance'),
      influence: formData.get('influence')
    };

    this.saveAndRender();
    this.closeStakeholderModal();
    showToast('利益相关者已保存');
  }

  /**
   * 打开利益相关者模态框
   */
  openStakeholderModal(index) {
    const project = this.getProject();
    const stakeholder = project.reveal.stakeholders[index];

    const modal = document.getElementById('stakeholderModal');
    modal.dataset.index = index;
    modal.querySelector('.modal-body').innerHTML = `
      <form id="stakeholderForm">
        <div class="form-group">
          <label class="form-label">姓名</label>
          <input type="text" class="form-input" name="name" value="${stakeholder.name}" />
        </div>
        <div class="form-group">
          <label class="form-label">角色 *</label>
          <input type="text" class="form-input" name="role" value="${stakeholder.role}" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">立场</label>
            <select class="form-select" name="stance">
              <option value="support" ${stakeholder.stance === 'support' ? 'selected' : ''}>支持 🟢</option>
              <option value="neutral" ${stakeholder.stance === 'neutral' ? 'selected' : ''}>中立 🟡</option>
              <option value="oppose" ${stakeholder.stance === 'oppose' ? 'selected' : ''}>阻碍 🔴</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">影响力</label>
            <select class="form-select" name="influence">
              <option value="high" ${stakeholder.influence === 'high' ? 'selected' : ''}>高</option>
              <option value="medium" ${stakeholder.influence === 'medium' ? 'selected' : ''}>中</option>
              <option value="low" ${stakeholder.influence === 'low' ? 'selected' : ''}>低</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="revealEditor.closeStakeholderModal()">取消</button>
          <button type="button" class="btn btn-primary" onclick="revealEditor.saveStakeholder()">保存</button>
        </div>
      </form>
    `;

    modal.classList.remove('hidden');
  }

  /**
   * 关闭利益相关者模态框
   */
  closeStakeholderModal() {
    document.getElementById('stakeholderModal').classList.add('hidden');
  }

  /**
   * 添加旅程触点
   */
  addJourneyPoint() {
    const project = this.getProject();
    project.reveal.journeyMap.push({
      id: `journey_${Date.now()}`,
      stage: '',
      touchpoint: '',
      experience: '',
      emotion: ''
    });

    this.saveAndRender();
  }

  /**
   * 更新旅程触点
   */
  updateJourneyPoint(index, field, value) {
    const project = this.getProject();
    project.reveal.journeyMap[index][field] = value;
    this.save();
  }

  /**
   * 删除旅程触点
   */
  deleteJourneyPoint(index) {
    if (!confirm('确定要删除这个触点吗？')) return;

    const project = this.getProject();
    project.reveal.journeyMap.splice(index, 1);
    this.saveAndRender();
  }

  /**
   * 保存草稿
   */
  saveDraft() {
    this.saveData();
    showToast('草稿已保存');
  }

  /**
   * 保存并进入下一阶段
   */
  saveAndNext() {
    this.saveData();
    showToast('保存成功，准备进入 Inspire 阶段');
    // TODO: 跳转到 Inspire 编辑器
  }

  /**
   * 保存数据
   */
  saveData() {
    const project = this.getProject();

    project.reveal.pov = {
      targetUser: document.getElementById('pov_targetUser').value,
      painPoint: document.getElementById('pov_painPoint').value,
      insight: document.getElementById('pov_insight').value
    };

    this.storage.update(project.project.id, { reveal: project.reveal });
  }

  /**
   * 保存并重新渲染
   */
  saveAndRender() {
    this.saveData();
    this.render();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 检测从 Persona Lab 跳转回来的参数
    const params = new URLSearchParams(location.search);
    if (params.get('import_persona') === '1') {
      // 清掉 URL 参数
      history.replaceState({}, '', location.pathname);
      // 延迟弹出导入面板（等待编辑器渲染完成）
      setTimeout(() => this.openPersonaLabImport(), 400);
    }
  }

  // ──────────────────────────────────────────────────
  // Persona Lab 集成
  // ──────────────────────────────────────────────────

  /**
   * 跳转到 Persona Lab，带回项目主题和当前 projectId
   */
  launchPersonaLab() {
    const project = this.getProject();
    const theme   = encodeURIComponent(project.name || '');
    const pid     = encodeURIComponent(this.projectId || '');
    // industry/scene 取项目名简单提取
    const url = `https://davidma1973simu.github.io/workbuddy-agents-marketplace/persona-lab/?from=eureka&projectId=${pid}&theme=${theme}`;
    window.open(url, '_blank');
    showToast('🎭 Persona Lab 已在新标签页打开，生成完成后点击「同步到 Eureka」返回');
  }

  /**
   * 打开 Persona Lab 导入面板（读取 localStorage persona_lab_export_v1）
   */
  openPersonaLabImport() {
    const raw = localStorage.getItem('persona_lab_export_v1');
    if (!raw) {
      showToast('❌ 未找到 Persona Lab 数据，请先在 Persona Lab 生成并点击「同步到 Eureka」', 'error');
      return;
    }

    let payload;
    try { payload = JSON.parse(raw); }
    catch (e) {
      showToast('❌ 数据格式错误，请重新从 Persona Lab 同步', 'error');
      return;
    }

    this._renderPersonaLabImportModal(payload);
  }

  /**
   * 渲染 Persona Lab 导入模态框
   */
  _renderPersonaLabImportModal(payload) {
    // 若已存在先移除
    const existing = document.getElementById('plImportModal');
    if (existing) existing.remove();

    const personas = payload.personas || [];
    const targetUsers  = personas.filter(p => p.type === 'target_user');
    const extremeUsers = personas.filter(p => p.type === 'extreme_user');
    const stakeholders = personas.filter(p => p.type === 'stakeholder');
    const decisionMakers = personas.filter(p => p.type === 'decision_maker');
    const resources    = personas.filter(p => p.type === 'resource_provider');

    const TYPE_LABELS = {
      target_user:       '🎯 目标用户',
      extreme_user:      '⚡ 极端用户',
      stakeholder:       '🤝 利益相关方',
      decision_maker:    '🏛 决策者',
      resource_provider: '💼 资源方',
    };
    const TYPE_COLORS = {
      target_user:       '#6366f1',
      extreme_user:      '#f59e0b',
      stakeholder:       '#10b981',
      decision_maker:    '#ef4444',
      resource_provider: '#8b5cf6',
    };

    const renderGroup = (list) => {
      if (!list.length) return '';
      return list.map(p => `
        <label class="pl-import-row" style="cursor:pointer;display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;transition:.15s"
          onmouseover="this.style.borderColor='${TYPE_COLORS[p.type]}'" onmouseout="this.style.borderColor='#e2e8f0'">
          <input type="checkbox" name="pl_persona" value="${p.id}" checked style="margin-top:3px;accent-color:${TYPE_COLORS[p.type]}">
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-weight:600;font-size:14px">${p.name}</span>
              <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:${TYPE_COLORS[p.type]}20;color:${TYPE_COLORS[p.type]}">${TYPE_LABELS[p.type] || p.type}</span>
              ${p.industryTag ? `<span style="font-size:11px;color:#64748b">${p.industryTag}</span>` : ''}
            </div>
            <div style="font-size:12px;color:#64748b;margin-top:3px">${p.age ? p.age + ' · ' : ''}${p.occupation || ''}</div>
            ${p.corePain ? `<div style="font-size:12px;color:#94a3b8;margin-top:2px">痛点：${p.corePain.slice(0,60)}${p.corePain.length>60?'…':''}</div>` : ''}
          </div>
        </label>
      `).join('');
    };

    const exportedAt = new Date(payload.exportedAt).toLocaleString('zh-CN');
    const groups = [
      { label: '🎯 目标用户', list: targetUsers },
      { label: '⚡ 极端用户', list: extremeUsers },
      { label: '🤝 利益相关方', list: stakeholders },
      { label: '🏛 决策者', list: decisionMakers },
      { label: '💼 资源方', list: resources },
    ].filter(g => g.list.length > 0);

    const html = `
      <div id="plImportModal" style="
        position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;
        display:flex;align-items:center;justify-content:center;padding:20px">
        <div style="background:#fff;border-radius:16px;width:100%;max-width:600px;max-height:85vh;
          display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.2)">
          <!-- header -->
          <div style="padding:20px 24px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between">
            <div>
              <h2 style="font-size:18px;font-weight:700;color:#1e293b">从 Persona Lab 导入角色</h2>
              <div style="font-size:12px;color:#94a3b8;margin-top:4px">
                主题：<strong style="color:#667eea">${payload.projectTheme || '未知'}</strong>
                &nbsp;·&nbsp; 导出时间：${exportedAt}
                &nbsp;·&nbsp; 共 ${personas.length} 个角色
              </div>
            </div>
            <button onclick="document.getElementById('plImportModal').remove()"
              style="width:32px;height:32px;border-radius:50%;background:#f1f5f9;border:none;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center">✕</button>
          </div>
          <!-- body -->
          <div style="padding:20px 24px;overflow-y:auto;flex:1">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <span style="font-size:13px;color:#64748b">选择要导入到「用户画像」和「利益相关者」的角色</span>
              <div style="display:flex;gap:8px">
                <button onclick="document.querySelectorAll('#plImportModal input[name=pl_persona]').forEach(c=>c.checked=true)"
                  style="font-size:12px;color:#667eea;border:none;background:none;cursor:pointer;padding:0">全选</button>
                <button onclick="document.querySelectorAll('#plImportModal input[name=pl_persona]').forEach(c=>c.checked=false)"
                  style="font-size:12px;color:#94a3b8;border:none;background:none;cursor:pointer;padding:0">取消</button>
              </div>
            </div>
            ${groups.map(g => `
              <div style="margin-bottom:14px">
                <div style="font-size:12px;font-weight:600;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">${g.label} (${g.list.length})</div>
                ${renderGroup(g.list)}
              </div>
            `).join('')}
          </div>
          <!-- footer -->
          <div style="padding:16px 24px;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:flex-end">
            <button onclick="document.getElementById('plImportModal').remove()"
              style="padding:9px 20px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;font-size:14px">取消</button>
            <button onclick="revealEditor._confirmPersonaLabImport(${JSON.stringify(personas).replace(/"/g,'&quot;')})"
              style="padding:9px 20px;border-radius:8px;border:none;background:#667eea;color:#fff;cursor:pointer;font-size:14px;font-weight:600">
              ✅ 导入选中角色
            </button>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  /**
   * 执行导入（将勾选的角色写入项目的 reveal.personas / reveal.stakeholders）
   */
  _confirmPersonaLabImport(allPersonas) {
    const checked = [...document.querySelectorAll('#plImportModal input[name=pl_persona]:checked')]
      .map(c => c.value);
    if (!checked.length) {
      showToast('请至少选择一个角色', 'error');
      return;
    }

    const selected = allPersonas.filter(p => checked.includes(p.id));
    const project  = this.getProject();

    let addedPersona = 0, addedStakeholder = 0;

    selected.forEach(p => {
      if (p.type === 'target_user' || p.type === 'extreme_user') {
        // 写入用户画像
        project.reveal.personas.push({
          name:       p.name,
          age:        p.age,
          occupation: p.occupation,
          background: `来源：Persona Lab · ${p.industryTag || ''} · ${p.sceneTag || ''}\n${p.summary || ''}`,
          painPoints: p.corePain,
          needs:      p.hiddenNeed,
          scenario:   p.quote || '',
          _fromPersonaLab: true,
          _plType: p.type,
        });
        addedPersona++;
      } else {
        // 利益相关方 / 决策者 / 资源方 → 写入 stakeholders
        project.reveal.stakeholders.push({
          name:      p.name,
          role:      p.occupation || p.relation || '',
          stance:    p.type === 'decision_maker' ? 'support' : 'neutral',
          influence: p.type === 'decision_maker' ? '高' : '中',
          notes:     `来源：Persona Lab · ${p.type}\n${p.corePain || ''}`,
          _fromPersonaLab: true,
          _plType: p.type,
        });
        addedStakeholder++;
      }
    });

    this.saveAndRender();
    document.getElementById('plImportModal').remove();

    const msg = [
      addedPersona    ? `${addedPersona} 个画像` : '',
      addedStakeholder ? `${addedStakeholder} 个利益方` : '',
    ].filter(Boolean).join(' + ');
    showToast(`✅ 已导入 ${msg} 到 Reveal 阶段`);
  }

  /**
   * 渲染用户画像模态框模板
   */
  renderPersonaModal() {
    return `
      <div id="personaModal" class="modal hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h2>编辑用户画像</h2>
            <button class="btn-close" onclick="revealEditor.closePersonaModal()">✕</button>
          </div>
          <div class="modal-body"></div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染利益相关者模态框模板
   */
  renderStakeholderModal() {
    return `
      <div id="stakeholderModal" class="modal hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h2>编辑利益相关者</h2>
            <button class="btn-close" onclick="revealEditor.closeStakeholderModal()">✕</button>
          </div>
          <div class="modal-body"></div>
        </div>
      </div>
    `;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RevealEditor;
}
