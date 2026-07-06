/**
 * 项目详情抽屉
 * 右侧滑出的项目详情面板
 */

class ProjectDrawer {
  constructor() {
    this.isOpen = false;
    this.currentProject = null;
    this.drawerElement = null;
    this.overlayElement = null;
  }

  /**
   * 打开项目详情抽屉
   * @param {Object} project - 项目数据
   */
  open(project) {
    this.currentProject = project;
    this._createDrawer();
    this._showDrawer();
    this.isOpen = true;

    // 阻止背景滚动
    document.body.style.overflow = 'hidden';
  }

  /**
   * 关闭抽屉
   */
  close() {
    if (this.drawerElement) {
      this.drawerElement.classList.remove('open');
      this.drawerElement.classList.add('closing');

      setTimeout(() => {
        if (this.drawerElement && this.drawerElement.parentNode) {
          this.drawerElement.parentNode.removeChild(this.drawerElement);
        }
        if (this.overlayElement && this.overlayElement.parentNode) {
          this.overlayElement.parentNode.removeChild(this.overlayElement);
        }
      }, 300);
    }

    this.isOpen = false;
    this.currentProject = null;

    // 恢复背景滚动
    document.body.style.overflow = '';
  }

  /**
   * 切换抽屉状态
   * @param {Object} project - 项目数据（打开时需要）
   */
  toggle(project = null) {
    if (this.isOpen) {
      this.close();
    } else if (project) {
      this.open(project);
    }
  }

  /**
   * 刷新抽屉内容（当项目数据更新时调用）
   * @param {Object} project - 更新后的项目数据
   */
  refresh(project) {
    if (this.isOpen && this.drawerElement) {
      this.currentProject = project;
      const contentContainer = this.drawerElement.querySelector('.drawer-content');
      if (contentContainer) {
        contentContainer.innerHTML = this._generateContentHTML(project);
      }
    }
  }

  // ========== 私有方法 ==========

  _createDrawer() {
    // 如果已存在，先移除
    if (this.drawerElement) {
      this._removeExistingDrawer();
    }

    // 创建遮罩层
    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'drawer-overlay';
    this.overlayElement.addEventListener('click', () => this.close());

    // 创建抽屉容器
    this.drawerElement = document.createElement('div');
    this.drawerElement.className = 'project-drawer';
    this.drawerElement.innerHTML = this._generateDrawerHTML();

    // 添加到页面
    document.body.appendChild(this.overlayElement);
    document.body.appendChild(this.drawerElement);

    // 绑定事件
    this._bindEvents();
  }

  _showDrawer() {
    // 添加动画类
    setTimeout(() => {
      this.overlayElement.classList.add('visible');
      this.drawerElement.classList.add('open');
    }, 10);
  }

  _removeExistingDrawer() {
    if (this.drawerElement && this.drawerElement.parentNode) {
      this.drawerElement.parentNode.removeChild(this.drawerElement);
    }
    if (this.overlayElement && this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
    }
  }

  _generateDrawerHTML() {
    if (!this.currentProject) {
      return '<div class="drawer-empty">没有项目数据</div>';
    }

    const p = this.currentProject;
    const statusClass = this._getStatusClass(p.project.status);

    return `
      <div class="drawer-header">
        <div class="drawer-header-content">
          <h2 class="drawer-title">${p.project.name}</h2>
          <span class="drawer-status ${statusClass}">${this._getStatusText(p.project.status)}</span>
        </div>
        <button class="drawer-close" aria-label="关闭">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="drawer-content">
        ${this._generateContentHTML(p)}
      </div>
    `;
  }

  _generateContentHTML(project) {
    const p = project;

    return `
      <div class="drawer-section">
        <h3>📋 项目概览</h3>
        <div class="drawer-info-grid">
          <div class="drawer-info-item">
            <span class="info-label">项目ID</span>
            <span class="info-value">${p.project.id}</span>
          </div>
          <div class="drawer-info-item">
            <span class="info-label">进度</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${p.project.progress}%"></div>
              <span class="progress-text">${p.project.progress}%</span>
            </div>
          </div>
          <div class="drawer-info-item">
            <span class="info-label">目标用户</span>
            <span class="info-value">${p.project.targetUser || '-'}</span>
          </div>
          <div class="drawer-info-item">
            <span class="info-label">创建时间</span>
            <span class="info-value">${this._formatDate(p.project.createdAt)}</span>
          </div>
        </div>
      </div>

      <div class="drawer-section">
        <h3>📝 项目简介</h3>
        <p class="drawer-brief">${p.project.brief || '暂无简介'}</p>
      </div>

      ${this._generateStagesContent(p)}

      <div class="drawer-actions">
        <button class="drawer-btn drawer-btn-edit" data-action="edit">
          ✏️ 编辑项目
        </button>
        <button class="drawer-btn drawer-btn-export" data-action="export">
          📤 导出
        </button>
        <button class="drawer-btn drawer-btn-delete" data-action="delete">
          🗑️ 删除项目
        </button>
      </div>
    `;
  }

  _generateStagesContent(project) {
    const stages = [];

    if (project.reveal && this._hasRevealData(project.reveal)) {
      stages.push(`
        <div class="drawer-stage">
          <div class="drawer-stage-header">
            <span class="stage-icon">🔍</span>
            <h4>Reveal - 洞察</h4>
          </div>
          <div class="drawer-stage-content">
            ${project.reveal.pov ? `<p><strong>POV:</strong> ${this._truncateText(project.reveal.pov.insight, 100)}</p>` : ''}
            ${project.reveal.userPersona ? `<p><strong>用户:</strong> ${project.reveal.userPersona.name}</p>` : ''}
          </div>
        </div>
      `);
    }

    if (project.inspire && this._hasInspireData(project.inspire)) {
      stages.push(`
        <div class="drawer-stage">
          <div class="drawer-stage-header">
            <span class="stage-icon">💡</span>
            <h4>Inspire - 启发</h4>
          </div>
          <div class="drawer-stage-content">
            ${project.inspire.ideas ? `<p><strong>创意:</strong> ${project.inspire.ideas.length} 个</p>` : ''}
            ${project.inspire.selectedIdea ? `<p><strong>最佳创意:</strong> ${this._truncateText(project.inspire.selectedIdea.title, 50)}</p>` : ''}
          </div>
        </div>
      `);
    }

    if (project.shape && this._hasShapeData(project.shape)) {
      const mapScore = project.shape.mapValues ?
        `MAP: ${project.shape.mapValues.market}/${project.shape.mapValues.adoption}/${project.shape.mapValues.protection}` : '';

      stages.push(`
        <div class="drawer-stage">
          <div class="drawer-stage-header">
            <span class="stage-icon">🎨</span>
            <h4>Shape - 构建</h4>
          </div>
          <div class="drawer-stage-content">
            ${project.shape.concept ? `<p><strong>核心价值:</strong> ${this._truncateText(project.shape.concept.valueProposition, 80)}</p>` : ''}
            ${mapScore ? `<p><strong>${mapScore}</strong></p>` : ''}
          </div>
        </div>
      `);
    }

    if (project.exam && this._hasExamData(project.exam)) {
      const ahaScore = project.exam.ahaEvaluation ?
        `AHA: ${project.exam.ahaEvaluation.aha}/${project.exam.ahaEvaluation.highlight}/${project.exam.ahaEvaluation.advancement}` : '';

      stages.push(`
        <div class="drawer-stage">
          <div class="drawer-stage-header">
            <span class="stage-icon">✅</span>
            <h4>Exam - 验证</h4>
          </div>
          <div class="drawer-stage-content">
            ${project.exam.elevatorPitch ? `<p><strong>电梯呈现:</strong> ${this._truncateText(project.exam.elevatorPitch.pitch, 80)}</p>` : ''}
            ${ahaScore ? `<p><strong>${ahaScore}</strong></p>` : ''}
          </div>
        </div>
      `);
    }

    if (stages.length === 0) {
      return `
        <div class="drawer-section">
          <h3>📊 阶段进度</h3>
          <p class="drawer-empty-stages">项目还没有开始任何阶段</p>
        </div>
      `;
    }

    return `
      <div class="drawer-section">
        <h3>📊 阶段进度</h3>
        <div class="drawer-stages">
          ${stages.join('')}
        </div>
      </div>
    `;
  }

  _bindEvents() {
    // 关闭按钮
    const closeBtn = this.drawerElement.querySelector('.drawer-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // ESC键关闭
    this._handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this._handleEscapeKey);

    // 操作按钮
    const editBtn = this.drawerElement.querySelector('[data-action="edit"]');
    const exportBtn = this.drawerElement.querySelector('[data-action="export"]');
    const deleteBtn = this.drawerElement.querySelector('[data-action="delete"]');

    if (editBtn) {
      editBtn.addEventListener('click', () => this._handleEdit());
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this._handleExport());
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this._handleDelete());
    }
  }

  _handleEdit() {
    // 触发编辑事件
    const event = new CustomEvent('projectEdit', {
      detail: { projectId: this.currentProject.project.id }
    });
    document.dispatchEvent(event);

    // 关闭抽屉
    this.close();
  }

  _handleExport() {
    // 触发导出事件
    const event = new CustomEvent('projectExport', {
      detail: { projectId: this.currentProject.project.id }
    });
    document.dispatchEvent(event);

    // 关闭抽屉
    this.close();
  }

  _handleDelete() {
    const projectName = this.currentProject.project.name;
    const confirmed = confirm(`确定要删除项目"${projectName}"吗？此操作不可恢复。`);

    if (confirmed) {
      // 触发删除事件
      const event = new CustomEvent('projectDelete', {
        detail: { projectId: this.currentProject.project.id }
      });
      document.dispatchEvent(event);

      // 关闭抽屉
      this.close();
    }
  }

  _hasRevealData(reveal) {
    return !!(reveal.pov || reveal.userPersona || reveal.stakeholders || reveal.scenarioMap);
  }

  _hasInspireData(inspire) {
    return !!(inspire.ideas || inspire.selectedIdea);
  }

  _hasShapeData(shape) {
    return !!(shape.concept || shape.story || shape.mapValues);
  }

  _hasExamData(exam) {
    return !!(exam.ahaEvaluation || exam.elevatorPitch || exam.iterationPlan);
  }

  _getStatusText(status) {
    const statusMap = {
      'draft': '草稿',
      'in_progress': '进行中',
      'completed': '已完成',
      'archived': '已归档'
    };
    return statusMap[status] || status;
  }

  _getStatusClass(status) {
    const classMap = {
      'draft': 'status-draft',
      'in_progress': 'status-in-progress',
      'completed': 'status-completed',
      'archived': 'status-archived'
    };
    return classMap[status] || '';
  }

  _formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  _truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}

// 全局项目抽屉实例
const projectDrawer = new ProjectDrawer();

/**
 * 便捷函数：打开项目详情抽屉
 * @param {Object} project - 项目数据
 */
function openProjectDrawer(project) {
  projectDrawer.open(project);
}

/**
 * 便捷函数：关闭项目详情抽屉
 */
function closeProjectDrawer() {
  projectDrawer.close();
}
