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

          <button class="btn btn-primary" onclick="revealEditor.addPersona()">
            + 添加用户画像
          </button>
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
    // 添加其他事件绑定
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
