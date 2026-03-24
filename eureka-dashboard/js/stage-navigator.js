/**
 * 阶段导航器
 * 提供四阶段之间的快速导航
 */

class StageNavigator {
  constructor() {
    this.stages = [
      { id: 'reveal', name: 'Reveal', icon: '🔍', title: '洞察' },
      { id: 'inspire', name: 'Inspire', icon: '💡', title: '启发' },
      { id: 'shape', name: 'Shape', icon: '🎨', title: '构建' },
      { id: 'exam', name: 'Exam', icon: '✅', title: '验证' }
    ];
    this.currentStage = null;
  }

  /**
   * 在指定容器中渲染阶段导航
   * @param {string} containerId - 容器ID
   * @param {string} currentStageId - 当前阶段ID
   * @param {Object} project - 项目数据（用于计算进度）
   */
  render(containerId, currentStageId = null, project = null) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`StageNavigator: 找不到容器 ${containerId}`);
      return;
    }

    this.currentStage = currentStageId;

    // 创建导航HTML
    const navHTML = this._createNavigationHTML(project);

    container.innerHTML = navHTML;

    // 绑定事件
    this._bindEvents(container);

    // 设置当前阶段激活状态
    this._setActiveStage(currentStageId);
  }

  /**
   * 更新当前阶段
   * @param {string} stageId - 阶段ID
   */
  setCurrentStage(stageId) {
    this.currentStage = stageId;
    this._setActiveStage(stageId);
  }

  /**
   * 获取当前阶段
   * @returns {string} 当前阶段ID
   */
  getCurrentStage() {
    return this.currentStage;
  }

  /**
   * 获取当前阶段索引
   * @returns {number} 阶段索引（0-3）
   */
  getCurrentStageIndex() {
    return this.stages.findIndex(s => s.id === this.currentStage);
  }

  /**
   * 导航到下一阶段
   * @returns {string|null} 下一阶段ID，如果没有则返回null
   */
  nextStage() {
    const currentIndex = this.getCurrentStageIndex();
    if (currentIndex < this.stages.length - 1) {
      const nextStage = this.stages[currentIndex + 1];
      this.setCurrentStage(nextStage.id);
      return nextStage.id;
    }
    return null;
  }

  /**
   * 导航到上一阶段
   * @returns {string|null} 上一阶段ID，如果没有则返回null
   */
  previousStage() {
    const currentIndex = this.getCurrentStageIndex();
    if (currentIndex > 0) {
      const prevStage = this.stages[currentIndex - 1];
      this.setCurrentStage(prevStage.id);
      return prevStage.id;
    }
    return null;
  }

  /**
   * 切换到指定阶段
   * @param {string} stageId - 目标阶段ID
   */
  navigateTo(stageId) {
    if (this.stages.find(s => s.id === stageId)) {
      this.setCurrentStage(stageId);
      // 触发自定义事件
      const event = new CustomEvent('stageChange', {
        detail: { stage: stageId }
      });
      document.dispatchEvent(event);
    }
  }

  /**
   * 计算各阶段完成进度
   * @param {Object} project - 项目数据
   * @returns {Object} 各阶段进度 { reveal: number, inspire: number, shape: number, exam: number }
   */
  calculateStageProgress(project) {
    if (!project) {
      return { reveal: 0, inspire: 0, shape: 0, exam: 0 };
    }

    return {
      reveal: this._calculateRevealProgress(project.reveal),
      inspire: this._calculateInspireProgress(project.inspire),
      shape: this._calculateShapeProgress(project.shape),
      exam: this._calculateExamProgress(project.exam)
    };
  }

  // ========== 私有方法 ==========

  _createNavigationHTML(project) {
    const stageProgress = this.calculateStageProgress(project);

    const navItems = this.stages.map((stage, index) => {
      const progress = stageProgress[stage.id] || 0;
      const isActive = stage.id === this.currentStage;
      const isCompleted = progress >= 100;
      const isPrevious = this.stages.findIndex(s => s.id === this.currentStage) > index;

      return `
        <div class="stage-nav-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}"
             data-stage="${stage.id}"
             role="button"
             tabindex="0"
             aria-label="${stage.title}阶段">
          <div class="stage-icon">${stage.icon}</div>
          <div class="stage-info">
            <span class="stage-name">${stage.name}</span>
            <span class="stage-title">${stage.title}</span>
          </div>
          <div class="stage-progress" style="width: ${progress}%"></div>
          ${isCompleted ? '<span class="stage-check">✓</span>' : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="stage-navigator">
        <div class="stage-nav-items">
          ${navItems}
        </div>
        <div class="stage-nav-actions">
          <button class="stage-nav-btn stage-nav-prev" ${this.getCurrentStageIndex() === 0 ? 'disabled' : ''}>
            ← 上一阶段
          </button>
          <button class="stage-nav-btn stage-nav-next" ${this.getCurrentStageIndex() === this.stages.length - 1 ? 'disabled' : ''}>
            下一阶段 →
          </button>
        </div>
      </div>
    `;
  }

  _bindEvents(container) {
    // 阶段点击事件
    const stageItems = container.querySelectorAll('.stage-nav-item');
    stageItems.forEach(item => {
      item.addEventListener('click', () => {
        const stageId = item.dataset.stage;
        this.navigateTo(stageId);
      });

      // 键盘访问支持
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const stageId = item.dataset.stage;
          this.navigateTo(stageId);
        }
      });
    });

    // 上一阶段按钮
    const prevBtn = container.querySelector('.stage-nav-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.previousStage();
      });
    }

    // 下一阶段按钮
    const nextBtn = container.querySelector('.stage-nav-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.nextStage();
      });
    }
  }

  _setActiveStage(stageId) {
    const container = document.querySelector('.stage-navigator');
    if (!container) return;

    const items = container.querySelectorAll('.stage-nav-item');
    items.forEach(item => {
      if (item.dataset.stage === stageId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // 更新按钮状态
    const currentIndex = this.stages.findIndex(s => s.id === stageId);
    const prevBtn = container.querySelector('.stage-nav-prev');
    const nextBtn = container.querySelector('.stage-nav-next');

    if (prevBtn) {
      prevBtn.disabled = currentIndex === 0;
    }
    if (nextBtn) {
      nextBtn.disabled = currentIndex === this.stages.length - 1;
    }
  }

  _calculateRevealProgress(reveal) {
    if (!reveal) return 0;

    let completed = 0;
    let total = 4; // POV, 用户画像, 利益相关者, 场景地图

    if (reveal.pov && reveal.pov.insight) completed++;
    if (reveal.userPersona && reveal.userPersona.name) completed++;
    if (reveal.stakeholders && reveal.stakeholders.length > 0) completed++;
    if (reveal.scenarioMap && reveal.scenarioMap.stages.length > 0) completed++;

    return Math.round((completed / total) * 100);
  }

  _calculateInspireProgress(inspire) {
    if (!inspire) return 0;

    let completed = 0;
    let total = 2; // 创意列表, 最佳创意

    if (inspire.ideas && inspire.ideas.length > 0) completed++;
    if (inspire.selectedIdea && inspire.selectedIdea.title) completed++;

    return Math.round((completed / total) * 100);
  }

  _calculateShapeProgress(shape) {
    if (!shape) return 0;

    let completed = 0;
    let total = 3; // 概念方案, 体验故事, MAP评估

    if (shape.concept && shape.concept.description) completed++;
    if (shape.story && shape.story.act1_setup) completed++;
    if (shape.mapValues) completed++;

    return Math.round((completed / total) * 100);
  }

  _calculateExamProgress(exam) {
    if (!exam) return 0;

    let completed = 0;
    let total = 3; // AHA评估, 电梯呈现, 迭代计划

    if (exam.ahaEvaluation && exam.ahaEvaluation.description) completed++;
    if (exam.elevatorPitch && exam.elevatorPitch.pitch) completed++;
    if (exam.iterationPlan && exam.iterationPlan.milestones.length > 0) completed++;

    return Math.round((completed / total) * 100);
  }
}

/**
 * 便捷函数：在页面中添加阶段导航
 * @param {string} containerId - 容器ID
 * @param {string} currentStageId - 当前阶段ID
 * @param {Object} project - 项目数据
 * @returns {StageNavigator} 导航器实例
 */
function addStageNavigation(containerId, currentStageId = null, project = null) {
  const navigator = new StageNavigator();
  navigator.render(containerId, currentStageId, project);
  return navigator;
}

// 全局阶段导航器实例
const stageNavigator = new StageNavigator();
