/**
 * Eureka Shape 阶段编辑器
 * 概念方案、体验故事（6幕）
 */

class ShapeEditor {
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

    const { shape, inspire } = project;
    const selectedIdea = inspire.ideas.find(i => i.id === inspire.selectedIdeaId);

    this.container.innerHTML = `
      <div class="shape-editor">
        <div class="editor-header">
          <h2>🎨 Shape · 构建层</h2>
          <p class="editor-subtitle">将最佳创意转化为可执行的概念方案</p>
        </div>

        <!-- 最佳创意回顾 -->
        <section class="editor-section">
          <h3>🏆 参考创意</h3>
          <p class="section-desc">基于 Inspire 阶段选择的最佳创意</p>

          ${selectedIdea ? `
            <div class="reference-idea">
              <h4>${selectedIdea.title}</h4>
              <p>${selectedIdea.description}</p>
              <div class="reference-metrics">
                <span>可行性: ${selectedIdea.feasibility}/5</span>
                <span>价值性: ${selectedIdea.value}/5</span>
                <span>创新性: ${selectedIdea.innovation}/5</span>
              </div>
            </div>
          ` : '<p class="info-text">尚未选择最佳创意，请先回到 Inspire 阶段</p>'}
        </section>

        <!-- 概念方案部分 -->
        <section class="editor-section">
          <h3>📦 概念方案</h3>
          <p class="section-desc">从四个维度构建完整的概念方案</p>

          <div class="concept-form">
            <div class="form-group">
              <label class="form-label">概念名称 *</label>
              <input
                type="text"
                class="form-input"
                id="concept_name"
                value="${shape.concept.name}"
                placeholder="例如：智能购物助手"
              />
            </div>

            <div class="form-group">
              <label class="form-label">核心描述 *</label>
              <textarea
                class="form-textarea"
                id="concept_description"
                placeholder="一句话概括这个概念..."
                rows="2"
              >${shape.concept.description}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">用户价值</label>
              <textarea
                class="form-textarea"
                id="concept_userValue"
                placeholder="这个概念为用户带来什么价值？"
                rows="3"
              >${shape.concept.userValue}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">技术方案</label>
              <textarea
                class="form-textarea"
                id="concept_techSolution"
                placeholder="如何实现这个概念？涉及哪些技术？"
                rows="3"
              >${shape.concept.techSolution}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">商业价值</label>
              <textarea
                class="form-textarea"
                id="concept_businessValue"
                placeholder="这个概念的商业价值是什么？"
                rows="3"
              >${shape.concept.businessValue}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">利益方价值</label>
              <textarea
                class="form-textarea"
                id="concept_stakeholderValue"
                placeholder="这个概念为各利益相关者带来什么价值？"
                rows="3"
              >${shape.concept.stakeholderValue}</textarea>
            </div>
          </div>
        </section>

        <!-- 体验故事部分 -->
        <section class="editor-section">
          <h3>🎭 体验故事（6幕）</h3>
          <p class="section-desc">描绘用户从发现到持续使用的完整体验旅程</p>

          <div class="experience-story">
            ${shape.experienceStory.map((act, i) => this.renderActCard(act, i)).join('')}
          </div>
        </section>

        <div class="editor-actions">
          <button class="btn btn-secondary" onclick="shapeEditor.saveDraft()">
            💾 保存草稿
          </button>
          <button class="btn btn-primary" onclick="shapeEditor.saveAndNext()">
            保存并进入下一阶段 →
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  /**
   * 渲染幕卡
   */
  renderActCard(act, index) {
    const actTitles = [
      'Act 1: 发现需求',
      'Act 2: 接触产品',
      'Act 3: 深度使用',
      'Act 4: 感受价值',
      'Act 5: 分享传播',
      'Act 6: 持续使用'
    ];

    const actColors = [
      '#ff6b6b',
      '#4ecdc4',
      '#45b7d1',
      '#96ceb4',
      '#ffeaa7',
      '#dfe6e9'
    ];

    return `
      <div class="act-card" style="border-left: 4px solid ${actColors[index]}">
        <div class="act-header">
          <span class="act-number">${index + 1}</span>
          <h4>${act.title || actTitles[index]}</h4>
        </div>

        <div class="act-fields">
          <div class="form-group">
            <label class="form-label">场景描述</label>
            <textarea
              class="form-textarea"
              data-index="${index}"
              data-field="description"
              onchange="shapeEditor.updateAct(this.dataset.index, this.dataset.field, this.value)"
              rows="2"
              placeholder="描述这个场景..."
            >${act.description}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">用户感受</label>
            <textarea
              class="form-textarea"
              data-index="${index}"
              data-field="userFeeling"
              onchange="shapeEditor.updateAct(this.dataset.index, this.dataset.field, this.value)"
              rows="2"
              placeholder="用户在这个场景中的感受..."
            >${act.userFeeling}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">AHA 时刻</label>
            <textarea
              class="form-textarea aha-textarea"
              data-index="${index}"
              data-field="ahaMoment"
              onchange="shapeEditor.updateAct(this.dataset.index, this.dataset.field, this.value)"
              rows="2"
              placeholder="用户感受到核心价值的时刻..."
            >${act.ahaMoment}</textarea>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 更新幕内容
   */
  updateAct(index, field, value) {
    const project = this.getProject();
    project.shape.experienceStory[index][field] = value;
    this.save();
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
    showToast('保存成功，准备进入 Exam 阶段');
    // TODO: 跳转到 Exam 编辑器
  }

  /**
   * 保存数据
   */
  saveData() {
    const project = this.getProject();

    project.shape.concept = {
      name: document.getElementById('concept_name').value,
      description: document.getElementById('concept_description').value,
      userValue: document.getElementById('concept_userValue').value,
      techSolution: document.getElementById('concept_techSolution').value,
      businessValue: document.getElementById('concept_businessValue').value,
      stakeholderValue: document.getElementById('concept_stakeholderValue').value
    };

    this.storage.update(project.project.id, { shape: project.shape });
  }

  /**
   * 保存
   */
  save() {
    const project = this.getProject();
    this.storage.update(project.project.id, { shape: project.shape });
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 自动保存概念方案
    const conceptFields = [
      'concept_name',
      'concept_description',
      'concept_userValue',
      'concept_techSolution',
      'concept_businessValue',
      'concept_stakeholderValue'
    ];

    conceptFields.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => {
          this.save();
        });
      }
    });
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShapeEditor;
}
