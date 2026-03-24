/**
 * Eureka Inspire 阶段编辑器
 * 创意列表、创意评估、最佳创意选择
 */

class InspireEditor {
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

    const { inspire } = project;

    this.container.innerHTML = `
      <div class="inspire-editor">
        <div class="editor-header">
          <h2>💡 Inspire · 启发层</h2>
          <p class="editor-subtitle">生成创意方案，评估并选择最佳方案</p>
        </div>

        <!-- 创意列表部分 -->
        <section class="editor-section">
          <h3>📝 创意列表</h3>
          <p class="section-desc">记录所有创意想法，至少 3 个</p>

          <div class="ideas-list" id="ideasList">
            ${inspire.ideas.map((idea, i) => this.renderIdeaCard(idea, i)).join('')}
          </div>

          <button class="btn btn-primary" onclick="inspireEditor.addIdea()">
            + 添加创意
          </button>
        </section>

        <!-- 创意评估部分 -->
        <section class="editor-section">
          <h3>📊 创意评估矩阵</h3>
          <p class="section-desc">从三个维度评估每个创意（1-5分）</p>

          <div class="evaluation-matrix" id="evaluationMatrix">
            ${inspire.ideas.map((idea, i) => this.renderEvaluationRow(idea, i)).join('')}
          </div>
        </section>

        <!-- 最佳创意选择部分 -->
        <section class="editor-section">
          <h3>🏆 最佳创意</h3>
          <p class="section-desc">从创意列表中选择最优秀的方案</p>

          <div class="best-idea-section">
            ${this.renderBestIdeaSelector(inspire)}
          </div>
        </section>

        <div class="editor-actions">
          <button class="btn btn-secondary" onclick="inspireEditor.saveDraft()">
            💾 保存草稿
          </button>
          <button class="btn btn-primary" onclick="inspireEditor.saveAndNext()">
            保存并进入下一阶段 →
          </button>
        </div>
      </div>

      ${this.renderIdeaModal()}
    `;

    this.bindEvents();
  }

  /**
   * 渲染创意卡片
   */
  renderIdeaCard(idea, index) {
    const isSelected = this.getProject().inspire.selectedIdeaId === idea.id;
    const isSelectedClass = isSelected ? 'selected' : '';

    return `
      <div class="idea-card ${isSelectedClass}" data-index="${index}">
        <div class="card-header">
          <span class="card-index">${index + 1}</span>
          <h4>${idea.title || '未命名创意'}</h4>
          <div class="card-score">${idea.totalScore || 0}分</div>
        </div>
        <p class="idea-description">${idea.description || '暂无描述'}</p>

        <div class="idea-metrics">
          <span class="metric">可行性: ${idea.feasibility || 0}/5</span>
          <span class="metric">价值性: ${idea.value || 0}/5</span>
          <span class="metric">创新性: ${idea.innovation || 0}/5</span>
        </div>

        <div class="card-actions">
          <button class="btn-text" onclick="inspireEditor.editIdea(${index})">编辑 →</button>
          <button class="btn-icon btn-delete" onclick="inspireEditor.deleteIdea(${index})">✕</button>
        </div>
      </div>
    `;
  }

  /**
   * 渲染评估行
   */
  renderEvaluationRow(idea, index) {
    return `
      <div class="evaluation-row" data-index="${index}">
        <div class="evaluation-idea">
          <strong>${idea.title || `创意 ${index + 1}`}</strong>
        </div>
        <div class="evaluation-scores">
          <div class="score-input">
            <label>可行性</label>
            <select
              class="form-select"
              onchange="inspireEditor.updateScore(${index}, 'feasibility', this.value)"
            >
              ${[1, 2, 3, 4, 5].map(n => `
                <option value="${n}" ${idea.feasibility === n ? 'selected' : ''}>${n}</option>
              `).join('')}
            </select>
          </div>
          <div class="score-input">
            <label>价值性</label>
            <select
              class="form-select"
              onchange="inspireEditor.updateScore(${index}, 'value', this.value)"
            >
              ${[1, 2, 3, 4, 5].map(n => `
                <option value="${n}" ${idea.value === n ? 'selected' : ''}>${n}</option>
              `).join('')}
            </select>
          </div>
          <div class="score-input">
            <label>创新性</label>
            <select
              class="form-select"
              onchange="inspireEditor.updateScore(${index}, 'innovation', this.value)"
            >
              ${[1, 2, 3, 4, 5].map(n => `
                <option value="${n}" ${idea.innovation === n ? 'selected' : ''}>${n}</option>
              `).join('')}
            </select>
          </div>
          <div class="total-score">
            <strong>总分: ${idea.totalScore || 0}</strong>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染最佳创意选择器
   */
  renderBestIdeaSelector(inspire) {
    if (!inspire.ideas || inspire.ideas.length === 0) {
      return '<p class="info-text">请先添加创意</p>';
    }

    return `
      <div class="best-idea-form">
        <div class="form-group">
          <label class="form-label">选择最佳创意</label>
          <select class="form-select" id="bestIdeaSelect" onchange="inspireEditor.onBestIdeaChange(this.value)">
            <option value="">请选择...</option>
            ${inspire.ideas.map(idea => `
              <option value="${idea.id}" ${inspire.selectedIdeaId === idea.id ? 'selected' : ''}>
                ${idea.title || `创意 ${idea.id}`}
                ${idea.totalScore ? `(${idea.totalScore}分)` : ''}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">选择原因</label>
          <textarea
            class="form-textarea"
            id="selectedReason"
            placeholder="说明为什么选择这个创意..."
            rows="3"
          >${inspire.selectedReason}</textarea>
        </div>

        ${inspire.selectedIdeaId ? this.renderSelectedIdeaPreview(inspire) : ''}
      </div>
    `;
  }

  /**
   * 渲染已选创意预览
   */
  renderSelectedIdeaPreview(inspire) {
    const selectedIdea = inspire.ideas.find(i => i.id === inspire.selectedIdeaId);
    if (!selectedIdea) return '';

    return `
      <div class="selected-idea-preview">
        <h4>已选创意</h4>
        <p><strong>${selectedIdea.title}</strong></p>
        <p>${selectedIdea.description}</p>
        <div class="preview-metrics">
          <span>可行性: ${selectedIdea.feasibility}/5</span>
          <span>价值性: ${selectedIdea.value}/5</span>
          <span>创新性: ${selectedIdea.innovation}/5</span>
          <strong>总分: ${selectedIdea.totalScore}</strong>
        </div>
      </div>
    `;
  }

  /**
   * 添加创意
   */
  addIdea() {
    const project = this.getProject();
    project.inspire.ideas.push({
      id: `idea_${Date.now()}`,
      title: '',
      description: '',
      feasibility: 3,
      value: 3,
      innovation: 3,
      totalScore: 9
    });

    this.saveAndRender();
    this.editIdea(project.inspire.ideas.length - 1);
  }

  /**
   * 编辑创意
   */
  editIdea(index) {
    const project = this.getProject();
    const idea = project.inspire.ideas[index];

    const modal = document.getElementById('ideaModal');
    modal.dataset.index = index;
    modal.querySelector('.modal-body').innerHTML = `
      <form id="ideaForm">
        <div class="form-group">
          <label class="form-label">创意标题 *</label>
          <input
            type="text"
            class="form-input"
            name="title"
            value="${idea.title}"
            placeholder="例如：AI智能试衣搭配顾问"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">创意描述 *</label>
          <textarea
            class="form-textarea"
            name="description"
            placeholder="描述创意的核心内容..."
            rows="4"
            required
          >${idea.description}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">可行性 (1-5)</label>
            <input
              type="number"
              class="form-input"
              name="feasibility"
              value="${idea.feasibility}"
              min="1"
              max="5"
            />
          </div>
          <div class="form-group">
            <label class="form-label">价值性 (1-5)</label>
            <input
              type="number"
              class="form-input"
              name="value"
              value="${idea.value}"
              min="1"
              max="5"
            />
          </div>
          <div class="form-group">
            <label class="form-label">创新性 (1-5)</label>
            <input
              type="number"
              class="form-input"
              name="innovation"
              value="${idea.innovation}"
              min="1"
              max="5"
            />
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="inspireEditor.closeIdeaModal()">取消</button>
          <button type="button" class="btn btn-primary" onclick="inspireEditor.saveIdea()">保存</button>
        </div>
      </form>
    `;

    modal.classList.remove('hidden');
  }

  /**
   * 保存创意
   */
  saveIdea() {
    const project = this.getProject();
    const index = document.getElementById('ideaModal').dataset.index;
    const formData = new FormData(document.getElementById('ideaForm'));

    const idea = project.inspire.ideas[index];
    idea.title = formData.get('title');
    idea.description = formData.get('description');
    idea.feasibility = parseInt(formData.get('feasibility'));
    idea.value = parseInt(formData.get('value'));
    idea.innovation = parseInt(formData.get('innovation'));
    idea.totalScore = idea.feasibility + idea.value + idea.innovation;

    this.saveAndRender();
    this.closeIdeaModal();
    showToast('创意已保存');
  }

  /**
   * 删除创意
   */
  deleteIdea(index) {
    if (!confirm('确定要删除这个创意吗？')) return;

    const project = this.getProject();
    project.inspire.ideas.splice(index, 1);

    // 如果删除的是已选创意，清空选择
    if (project.inspire.selectedIdeaId) {
      const stillExists = project.inspire.ideas.some(i => i.id === project.inspire.selectedIdeaId);
      if (!stillExists) {
        project.inspire.selectedIdeaId = '';
        project.inspire.selectedReason = '';
      }
    }

    this.saveAndRender();
  }

  /**
   * 更新评分
   */
  updateScore(index, field, value) {
    const project = this.getProject();
    const idea = project.inspire.ideas[index];
    idea[field] = parseInt(value);
    idea.totalScore = idea.feasibility + idea.value + idea.innovation;

    this.save();
    this.render();
  }

  /**
   * 最佳创意改变
   */
  onBestIdeaChange(ideaId) {
    const project = this.getProject();
    project.inspire.selectedIdeaId = ideaId;

    // 重新渲染最佳创意部分
    const bestIdeaSection = document.querySelector('.best-idea-section');
    if (bestIdeaSection) {
      bestIdeaSection.innerHTML = this.renderBestIdeaSelector(project.inspire);
    }

    // 重新渲染创意列表
    const ideasList = document.getElementById('ideasList');
    if (ideasList) {
      ideasList.innerHTML = project.inspire.ideas.map((idea, i) => this.renderIdeaCard(idea, i)).join('');
    }

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
    showToast('保存成功，准备进入 Shape 阶段');
    // TODO: 跳转到 Shape 编辑器
  }

  /**
   * 保存数据
   */
  saveData() {
    const project = this.getProject();

    // 保存选择原因
    const reasonTextarea = document.getElementById('selectedReason');
    if (reasonTextarea) {
      project.inspire.selectedReason = reasonTextarea.value;
    }

    this.storage.update(project.project.id, { inspire: project.inspire });
  }

  /**
   * 保存并重新渲染
   */
  saveAndRender() {
    this.saveData();
    this.render();
  }

  /**
   * 关闭创意模态框
   */
  closeIdeaModal() {
    document.getElementById('ideaModal').classList.add('hidden');
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 监听选择原因变化
    const reasonTextarea = document.getElementById('selectedReason');
    if (reasonTextarea) {
      reasonTextarea.addEventListener('change', () => {
        this.saveData();
      });
    }
  }

  /**
   * 渲染创意模态框模板
   */
  renderIdeaModal() {
    return `
      <div id="ideaModal" class="modal hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h2>编辑创意</h2>
            <button class="btn-close" onclick="inspireEditor.closeIdeaModal()">✕</button>
          </div>
          <div class="modal-body"></div>
        </div>
      </div>
    `;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InspireEditor;
}
