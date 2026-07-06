/**
 * Eureka Exam 阶段编辑器
 * AHA 价值评估、电梯呈现、迭代计划、商业模式画布
 */

class ExamEditor {
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

    const { exam, shape } = project;

    // 创建阶段导航器容器
    const stageNavContainer = document.createElement('div');
    stageNavContainer.id = 'stageNavigator';
    this.container.innerHTML = '';
    this.container.appendChild(stageNavContainer);

    // 渲染阶段导航器
    stageNavigator.render('stageNavigator', 'exam', project);

    // 添加编辑器内容
    const editorContent = document.createElement('div');
    editorContent.innerHTML = `
      <div class="exam-editor">
        <div class="editor-header">
          <h2>✅ Exam · 验证层</h2>
          <p class="editor-subtitle">验证价值，制定计划，商业模式画布</p>
        </div>

        <!-- AHA 价值评估部分 -->
        <section class="editor-section">
          <h3>💡 AHA 价值评估</h3>
          <p class="section-desc">AHA 价值雷达图：顿悟(A) + 高光(H) + 进步(A)</p>

          <div class="aha-form">
            <div class="form-group">
              <label class="form-label">AHA 时刻描述</label>
              <textarea
                class="form-textarea"
                id="aha_description"
                placeholder="描述用户第一次感受到核心价值的场景..."
                rows="3"
              >${exam.ahaEvaluation.description}</textarea>
            </div>

            <div class="aha-radar-container">
              <canvas id="ahaRadarCanvas" width="300" height="300"></canvas>
            </div>

            <div class="aha-scores">
              <div class="score-group">
                <label>顿悟 (A)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value="${exam.ahaEvaluation.aha || 5}"
                  id="aha_aha"
                  oninput="examEditor.updateAHAScore('aha', this.value)"
                />
                <span class="score-display">${exam.ahaEvaluation.aha || 5}</span>
              </div>

              <div class="score-group">
                <label>高光 (H)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value="${exam.ahaEvaluation.highlight || 5}"
                  id="aha_highlight"
                  oninput="examEditor.updateAHAScore('highlight', this.value)"
                />
                <span class="score-display">${exam.ahaEvaluation.highlight || 5}</span>
              </div>

              <div class="score-group">
                <label>进步 (A)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value="${exam.ahaEvaluation.advancement || 5}"
                  id="aha_advancement"
                  oninput="examEditor.updateAHAScore('advancement', this.value)"
                />
                <span class="score-display">${exam.ahaEvaluation.advancement || 5}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 电梯呈现部分 -->
        <section class="editor-section">
          <h3>🚀 电梯呈现（60秒）</h3>
          <p class="section-desc">5段式结构：问题→方案→用户→价值→行动</p>

          <div class="elevator-pitch-form">
            <div class="form-group">
              <label class="form-label">1. 问题陈述（10秒）</label>
              <textarea
                class="form-textarea pitch-step"
                id="pitch_problem"
                placeholder="我们面临什么问题？"
                rows="2"
              >${exam.elevatorPitch.problem}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">2. 解决方案（10秒）</label>
              <textarea
                class="form-textarea pitch-step"
                id="pitch_solution"
                placeholder="我们如何解决？"
                rows="2"
              >${exam.elevatorPitch.solution}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">3. 目标用户（10秒）</label>
              <textarea
                class="form-textarea pitch-step"
                id="pitch_targetUser"
                placeholder="谁需要这个解决方案？"
                rows="2"
              >${exam.elevatorPitch.targetUser}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">4. 核心价值（10秒）</label>
              <textarea
                class="form-textarea pitch-step"
                id="pitch_coreValue"
                placeholder="带来什么价值？"
                rows="2"
              >${exam.elevatorPitch.coreValue}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">5. 行动号召（20秒）</label>
              <textarea
                class="form-textarea pitch-step"
                id="pitch_callToAction"
                placeholder="下一步做什么？"
                rows="2"
              >${exam.elevatorPitch.callToAction}</textarea>
            </div>

            <button class="btn btn-secondary" onclick="examEditor.generatePitchPreview()">
              📝 生成完整脚本
            </button>

            <div class="pitch-preview">
              <label class="form-label">完整脚本预览</label>
              <div class="pitch-preview-box" id="pitchPreview">
                ${this.generatePitchPreviewText(exam.elevatorPitch)}
              </div>
            </div>
          </div>
        </section>

        <!-- 迭代计划部分 -->
        <section class="editor-section">
          <h3>📈 30-60-90 天迭代计划</h3>
          <p class="section-desc">分三个阶段规划产品迭代</p>

          <div class="iteration-plan-form">
            ${this.renderIterationPhase('30', 'MVP 开发', exam.iterationPlan.day30)}
            ${this.renderIterationPhase('60', '用户测试', exam.iterationPlan.day60)}
            ${this.renderIterationPhase('90', '市场验证', exam.iterationPlan.day90)}
          </div>
        </section>

        <!-- 商业模式画布部分 -->
        <section class="editor-section">
          <h3>📊 商业模式画布</h3>
          <p class="section-desc">9 个模块的商业模式设计</p>

          <div class="business-canvas">
            <div class="canvas-section canvas-top">
              <div class="canvas-cell">
                <label class="canvas-label">价值主张</label>
                <textarea
                  class="canvas-textarea"
                  id="canvas_valueProposition"
                  rows="4"
                  onchange="examEditor.updateCanvas('valueProposition', this.value)"
                >${exam.businessCanvas.valueProposition}</textarea>
              </div>
            </div>

            <div class="canvas-section canvas-middle">
              <div class="canvas-cell">
                <label class="canvas-label">客户细分</label>
                <textarea
                  class="canvas-textarea"
                  id="canvas_customerSegments"
                  rows="4"
                  onchange="examEditor.updateCanvas('customerSegments', this.value)"
                >${exam.businessCanvas.customerSegments}</textarea>
              </div>

              <div class="canvas-cell">
                <label class="canvas-label">渠道通路</label>
                <textarea
                  class="canvas-textarea"
                  id="canvas_channels"
                  rows="4"
                  onchange="examEditor.updateCanvas('channels', this.value)"
                >${exam.businessCanvas.channels}</textarea>
              </div>

              <div class="canvas-cell">
                <label class="canvas-label">客户关系</label>
                <textarea
                  class="canvas-textarea"
                  id="canvas_customerRelationships"
                  rows="4"
                  onchange="examEditor.updateCanvas('customerRelationships', this.value)"
                >${exam.businessCanvas.customerRelationships}</textarea>
              </div>

              <div class="canvas-cell">
                <label class="canvas-label">收入来源</label>
                <textarea
                  class="canvas-textarea"
                  id="canvas_revenueStreams"
                  rows="4"
                  onchange="examEditor.updateCanvas('revenueStreams', this.value)"
                >${exam.businessCanvas.revenueStreams}</textarea>
              </div>
            </div>

            <div class="canvas-section canvas-bottom">
              <div class="canvas-cell">
                <label class="canvas-label">核心资源</label>
                <textarea
                  class="canvas-textarea"
                  id="canvas_keyResources"
                  rows="3"
                  onchange="examEditor.updateCanvas('keyResources', this.value)"
                >${exam.businessCanvas.keyResources}</textarea>
              </div>

              <div class="canvas-cell">
                <label class="canvas-label">关键业务</label>
                <textarea
                  class="canvas-textarea"
                  id="canvas_keyActivities"
                  rows="3"
                  onchange="examEditor.updateCanvas('keyActivities', this.value)"
                >${exam.businessCanvas.keyActivities}</textarea>
              </div>

              <div class="canvas-cell">
                <label class="canvas-label">重要合作</label>
                <textarea
                  class="canvas-textarea"
                  id="canvas_keyPartnerships"
                  rows="3"
                  onchange="examEditor.updateCanvas('keyPartnerships', this.value)"
                >${exam.businessCanvas.keyPartnerships}</textarea>
              </div>

              <div class="canvas-cell">
                <label class="canvas-label">成本结构</label>
                <textarea
                  class="canvas-textarea"
                  id="canvas_costStructure"
                  rows="3"
                  onchange="examEditor.updateCanvas('costStructure', this.value)"
                >${exam.businessCanvas.costStructure}</textarea>
              </div>
            </div>
          </div>
        </section>

        <div class="editor-actions">
          <button class="btn btn-secondary" onclick="examEditor.saveDraft()">
            💾 保存草稿
          </button>
          <button class="btn btn-primary" onclick="examEditor.saveAndComplete()">
            保存并完成项目 ✓
          </button>
        </div>
      </div>
    `;

    this.container.appendChild(editorContent);
    this.bindEvents();

    // 初始化 AHA 雷达图
    setTimeout(() => this.updateAHARadar(), 100);
  }

  /**
   * 渲染迭代阶段
   */
  renderIterationPhase(day, label, data) {
    return `
      <div class="iteration-phase">
        <h4>${day}天 - ${label}</h4>
        <div class="form-group">
          <label class="form-label">目标</label>
          <textarea
            class="form-textarea"
            id="iter_${day}_goal"
            placeholder="这个阶段的目标是什么？"
            rows="2"
          >${data.goal}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">关键里程碑</label>
          <textarea
            class="form-textarea"
            id="iter_${day}_milestones"
            placeholder="这个阶段的关键里程碑..."
            rows="3"
          >${data.milestones}</textarea>
        </div>
      </div>
    `;
  }

  /**
   * 更新 AHA 评分
   */
  updateAHAScore(field, value) {
    const display = document.getElementById(`aha_${field}`).nextElementSibling;
    display.textContent = value;

    // 更新雷达图
    this.updateAHARadar();

    this.save();
  }

  /**
   * 更新 AHA 雷达图
   */
  updateAHARadar() {
    const aha = parseInt(document.getElementById('aha_aha').value);
    const highlight = parseInt(document.getElementById('aha_highlight').value);
    const advancement = parseInt(document.getElementById('aha_advancement').value);

    EurekaVisualizations.drawAHARadar(
      { aha, highlight, advancement },
      'ahaRadarCanvas'
    );
  }

  /**
   * 生成电梯呈现预览文本
   */
  generatePitchPreviewText(pitch) {
    return `
      <div class="pitch-full">
        ${pitch.problem ? `<p><strong>问题：</strong>${pitch.problem}</p>` : ''}
        ${pitch.solution ? `<p><strong>方案：</strong>${pitch.solution}</p>` : ''}
        ${pitch.targetUser ? `<p><strong>目标用户：</strong>${pitch.targetUser}</p>` : ''}
        ${pitch.coreValue ? `<p><strong>核心价值：</strong>${pitch.coreValue}</p>` : ''}
        ${pitch.callToAction ? `<p><strong>行动：</strong>${pitch.callToAction}</p>` : ''}
        ${!pitch.problem && !pitch.solution ? '<p class="preview-placeholder">填写上方信息后自动生成脚本</p>' : ''}
      </div>
    `;
  }

  /**
   * 生成电梯呈现预览
   */
  generatePitchPreview() {
    const pitch = {
      problem: document.getElementById('pitch_problem').value,
      solution: document.getElementById('pitch_solution').value,
      targetUser: document.getElementById('pitch_targetUser').value,
      coreValue: document.getElementById('pitch_coreValue').value,
      callToAction: document.getElementById('pitch_callToAction').value
    };

    document.getElementById('pitchPreview').innerHTML = this.generatePitchPreviewText(pitch);
    showToast('脚本已生成');
  }

  /**
   * 更新商业画布
   */
  updateCanvas(field, value) {
    const project = this.getProject();
    project.exam.businessCanvas[field] = value;
    this.storage.update(project.project.id, { exam: project.exam });
  }

  /**
   * 保存草稿
   */
  saveDraft() {
    this.saveData();
    showToast('草稿已保存');
  }

  /**
   * 保存并完成项目
   */
  saveAndComplete() {
    this.saveData();

    // 标记项目为已完成
    const project = this.getProject();
    project.project.status = 'completed';
    this.storage.update(project.project.id, {
      project: { status: 'completed' },
      exam: project.exam
    });

    showToast('项目已完成！🎉');

    // 跳转回仪表板
    setTimeout(() => {
      window.location.hash = '';
      window.location.reload();
    }, 1500);
  }

  /**
   * 保存数据
   */
  saveData() {
    const project = this.getProject();

    project.exam.ahaEvaluation = {
      description: document.getElementById('aha_description').value,
      aha: parseInt(document.getElementById('aha_aha').value),
      highlight: parseInt(document.getElementById('aha_highlight').value),
      advancement: parseInt(document.getElementById('aha_advancement').value)
    };

    project.exam.elevatorPitch = {
      problem: document.getElementById('pitch_problem').value,
      solution: document.getElementById('pitch_solution').value,
      targetUser: document.getElementById('pitch_targetUser').value,
      coreValue: document.getElementById('pitch_coreValue').value,
      callToAction: document.getElementById('pitch_callToAction').value
    };

    project.exam.iterationPlan = {
      day30: {
        goal: document.getElementById('iter_30_goal').value,
        milestones: document.getElementById('iter_30_milestones').value
      },
      day60: {
        goal: document.getElementById('iter_60_goal').value,
        milestones: document.getElementById('iter_60_milestones').value
      },
      day90: {
        goal: document.getElementById('iter_90_goal').value,
        milestones: document.getElementById('iter_90_milestones').value
      }
    };

    this.storage.update(project.project.id, { exam: project.exam });
  }

  /**
   * 保存
   */
  save() {
    const project = this.getProject();
    this.storage.update(project.project.id, { exam: project.exam });
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // AHA 评分变化时自动保存
    ['userValue', 'businessValue', 'techValue', 'stakeholderValue'].forEach(field => {
      const element = document.getElementById(`aha_${field}`);
      if (element) {
        element.addEventListener('change', () => {
          this.save();
        });
      }
    });

    // 电梯呈现脚本变化时自动保存
    ['problem', 'solution', 'targetUser', 'coreValue', 'callToAction'].forEach(field => {
      const element = document.getElementById(`pitch_${field}`);
      if (element) {
        element.addEventListener('change', () => {
          this.save();
        });
      }
    });

    // 迭代计划变化时自动保存
    ['30', '60', '90'].forEach(day => {
      ['goal', 'milestones'].forEach(field => {
        const element = document.getElementById(`iter_${day}_${field}`);
        if (element) {
          element.addEventListener('change', () => {
            this.save();
          });
        }
      });
    });
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExamEditor;
}
