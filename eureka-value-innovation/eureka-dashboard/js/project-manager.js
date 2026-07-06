/**
 * Eureka 项目管理组件
 * 负责项目的创建、编辑、删除和归档
 */

class ProjectManager {
  constructor(storage) {
    this.storage = storage;
    this.container = null;
    this.currentProject = null;
  }

  /**
   * 初始化管理器
   */
  init(container) {
    this.container = container;
    this.render();
  }

  /**
   * 渲染项目列表
   */
  render() {
    const projects = this.storage.getAll();

    this.container.innerHTML = `
      <div class="project-manager">
        <div class="manager-header">
          <h2>📂 我的项目</h2>
          <div class="manager-actions">
            <button class="btn btn-primary" onclick="projectManager.createNew()">
              + 新建项目
            </button>
            <button class="btn btn-secondary" onclick="projectManager.export()">
              📤 导出
            </button>
            <button class="btn btn-secondary" onclick="projectManager.import()">
              📥 导入
            </button>
          </div>
        </div>

        <div class="filter-bar">
          <input
            type="text"
            class="search-input"
            placeholder="🔍 搜索项目..."
            oninput="projectManager.onSearch(this.value)"
          />
          <select class="filter-select" onchange="projectManager.onFilter(this.value)">
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
            <option value="archived">已归档</option>
          </select>
        </div>

        <div class="projects-list" id="projectsList">
          ${projects.length === 0 ? this.renderEmptyState() : ''}
        </div>
      </div>

      <div id="projectModal" class="modal hidden"></div>
      <input type="file" id="importInput" accept=".json" style="display:none" onchange="projectManager.handleImport(event)">
    `;

    this.renderProjectList(projects);
  }

  /**
   * 渲染空状态
   */
  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>还没有项目</h3>
        <p>点击「新建项目」开始你的第一个 Eureka 创新项目</p>
        <button class="btn btn-primary" onclick="projectManager.createNew()">
          + 新建项目
        </button>
      </div>
    `;
  }

  /**
   * 渲染项目列表
   */
  renderProjectList(projects) {
    const listContainer = document.getElementById('projectsList');
    if (!listContainer) return;

    if (projects.length === 0) {
      listContainer.innerHTML = this.renderEmptyState();
      return;
    }

    listContainer.innerHTML = projects.map(project => this.renderProjectCard(project)).join('');
  }

  /**
   * 渲染单个项目卡片
   */
  renderProjectCard(project) {
    const { project: meta, reveal, inspire, shape, exam } = project;
    const statusColor = STATUS_COLOR[meta.status];
    const statusText = STATUS_TEXT[meta.status];

    // 计算阶段进度
    const stages = [
      { name: 'Reveal', active: this.hasContent(reveal) },
      { name: 'Inspire', active: this.hasContent(inspire) },
      { name: 'Shape', active: this.hasContent(shape) },
      { name: 'Exam', active: this.hasContent(exam) }
    ];

    return `
      <div class="project-card" onclick="projectManager.openProject('${meta.id}')">
        <div class="card-header">
          <h3 class="card-title">${meta.name || '未命名项目'}</h3>
          <span class="card-status" style="background-color: ${statusColor}">
            ${statusText}
          </span>
        </div>

        <p class="card-brief">${meta.brief || '暂无简介'}</p>

        <div class="card-meta">
          <span class="card-date">📅 ${formatDate(meta.updatedAt)}</span>
          <span class="card-progress">进度: ${meta.progress}%</span>
        </div>

        <div class="card-progress-bar">
          <div class="progress-fill" style="width: ${meta.progress}%"></div>
        </div>

        <div class="card-stages">
          ${stages.map(stage => `
            <div class="stage-badge ${stage.active ? 'active' : ''}">
              ${stage.name}
            </div>
          `).join('')}
        </div>

        <div class="card-actions" onclick="event.stopPropagation()">
          <button class="btn-icon" onclick="projectManager.edit('${meta.id}')" title="编辑">
            ✏️
          </button>
          <button class="btn-icon" onclick="projectManager.archiveProject('${meta.id}')" title="归档">
            📦
          </button>
          <button class="btn-icon" onclick="projectManager.deleteProject('${meta.id}')" title="删除">
            🗑️
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 检查阶段是否有内容
   */
  hasContent(phase) {
    if (!phase) return false;
    if (phase.pov && (phase.pov.targetUser || phase.pov.painPoint)) return true;
    if (phase.ideas && phase.ideas.length > 0) return true;
    if (phase.concept && (phase.concept.name || phase.concept.description)) return true;
    if (phase.elevatorPitch && phase.elevatorPitch.problem) return true;
    return false;
  }

  /**
   * 创建新项目
   */
  createNew() {
    const emptyProject = createEmptyProject();
    this.showProjectForm(emptyProject, '新建项目');
  }

  /**
   * 编辑项目
   */
  edit(id) {
    const project = this.storage.getById(id);
    if (!project) {
      alert('项目不存在');
      return;
    }
    this.showProjectForm(project, '编辑项目');
  }

  /**
   * 显示项目表单
   */
  showProjectForm(project, title) {
    const modal = document.getElementById('projectModal');
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="btn-close" onclick="projectManager.closeModal()">✕</button>
        </div>

        <form id="projectForm" onsubmit="event.preventDefault(); projectManager.saveProject('${project.project.id}')">
          <div class="form-group">
            <label class="form-label">项目名称 *</label>
            <input
              type="text"
              class="form-input"
              name="name"
              value="${project.project.name}"
              placeholder="例如：智能购物助手"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">项目简报 *</label>
            <textarea
              class="form-textarea"
              name="brief"
              placeholder="用一句话描述要解决的问题"
              rows="2"
              required
            >${project.project.brief}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">目标用户画像</label>
            <textarea
              class="form-textarea"
              name="targetUser"
              placeholder="描述你的目标用户"
              rows="3"
            >${project.project.targetUser}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">目标场景</label>
            <textarea
              class="form-textarea"
              name="targetScenario"
              placeholder="描述主要使用场景"
              rows="2"
            >${project.project.targetScenario}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">项目状态</label>
            <select class="form-select" name="status">
              <option value="draft" ${project.project.status === 'draft' ? 'selected' : ''}>草稿</option>
              <option value="in_progress" ${project.project.status === 'in_progress' ? 'selected' : ''}>进行中</option>
              <option value="completed" ${project.project.status === 'completed' ? 'selected' : ''}>已完成</option>
              <option value="archived" ${project.project.status === 'archived' ? 'selected' : ''}>已归档</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="projectManager.closeModal()">
              取消
            </button>
            <button type="submit" class="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  /**
   * 保存项目
   */
  saveProject(id) {
    const form = document.getElementById('projectForm');

    // 手动验证必填字段
    const nameInput = form.querySelector('[name="name"]');
    const briefInput = form.querySelector('[name="brief"]');

    const name = nameInput.value.trim();
    const brief = briefInput.value.trim();

    if (!name) {
      alert('项目名称不能为空');
      nameInput.focus();
      return;
    }

    if (!brief) {
      alert('项目简报不能为空');
      briefInput.focus();
      return;
    }

    const formData = new FormData(form);

    const updates = {
      project: {
        name: name,
        brief: brief,
        targetUser: formData.get('targetUser') || '',
        targetScenario: formData.get('targetScenario') || '',
        status: formData.get('status') || 'draft'
      }
    };

    try {
      if (id && this.storage.getById(id)) {
        // 更新现有项目
        this.storage.update(id, updates);
      } else {
        // 创建新项目
        const emptyProject = createEmptyProject();
        deepMerge(emptyProject, updates);
        this.storage.create(emptyProject);
      }

      this.closeModal();
      this.render();
      showToast('项目保存成功！');
    } catch (error) {
      alert('保存失败: ' + error.message);
    }
  }

  /**
   * 打开项目详情
   */
  openProject(id) {
    // 打开项目详情抽屉
    const project = this.storage.getById(id);
    if (project) {
      projectDrawer.open(project);
    }
  }

  /**
   * 归档项目
   */
  archiveProject(id) {
    if (!confirm('确定要归档这个项目吗？归档后项目将不会显示在列表中。')) {
      return;
    }

    try {
      this.storage.archive(id);
      this.render();
      showToast('项目已归档');
    } catch (error) {
      alert('归档失败: ' + error.message);
    }
  }

  /**
   * 删除项目
   */
  deleteProject(id) {
    if (!confirm('确定要删除这个项目吗？此操作不可恢复！')) {
      return;
    }

    try {
      this.storage.delete(id);
      this.render();
      showToast('项目已删除');
    } catch (error) {
      alert('删除失败: ' + error.message);
    }
  }

  /**
   * 搜索项目
   */
  onSearch(keyword) {
    const projects = this.storage.search(keyword);
    this.renderProjectList(projects);
  }

  /**
   * 筛选项目
   */
  onFilter(status) {
    const projects = this.storage.filterByStatus(status);
    this.renderProjectList(projects);
  }

  /**
   * 导出项目
   */
  export() {
    const json = this.storage.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `eureka_projects_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    URL.revokeObjectURL(url);
    showToast('项目已导出');
  }

  /**
   * 导入项目
   */
  import() {
    document.getElementById('importInput').click();
  }

  /**
   * 处理导入
   */
  handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const json = e.target.result;
      if (this.storage.importJSON(json)) {
        this.render();
        showToast('项目导入成功');
      }
    };
    reader.readAsText(file);

    event.target.value = '';
  }

  /**
   * 关闭模态框
   */
  closeModal() {
    const modal = document.getElementById('projectModal');
    modal.classList.add('hidden');
  }
}

/**
 * 显示提示
 */
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ProjectManager,
    showToast
  };
}
