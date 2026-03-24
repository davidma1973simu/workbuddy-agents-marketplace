/**
 * Eureka 可视化组件
 * 商业 MAP 雷达图、AHA 价值雷达图
 */

class EurekaVisualizations {
  /**
   * 绘制 MAP 商业价值雷达图
   * @param {Object} data - { market: 1-10, adoption: 1-10, protection: 1-10 }
   * @param {string} containerId - 容器 ID
   */
  static drawMAPRadar(data, containerId) {
    const canvas = document.getElementById(containerId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = Math.min(canvas.width, canvas.height);
    const center = size / 2;
    const radius = size / 2 - 40;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景网格（同心圆）
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(center, center, (radius / 5) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 绘制轴线
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;

    const axes = [
      { label: '市场潜力\n(M)', angle: -Math.PI / 2, value: data.market },
      { label: '用户增长\n(A)', angle: Math.PI / 6, value: data.adoption },
      { label: '优势壁垒\n(P)', angle: 5 * Math.PI / 6, value: data.protection }
    ];

    axes.forEach(axis => {
      const x = center + radius * Math.cos(axis.angle);
      const y = center + radius * Math.sin(axis.angle);

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    // 绘制数据区域
    ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;

    ctx.beginPath();

    axes.forEach((axis, i) => {
      const valueRadius = (axis.value / 10) * radius;
      const x = center + valueRadius * Math.cos(axis.angle);
      const y = center + valueRadius * Math.sin(axis.angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 绘制数据点
    axes.forEach(axis => {
      const valueRadius = (axis.value / 10) * radius;
      const x = center + valueRadius * Math.cos(axis.angle);
      const y = center + valueRadius * Math.sin(axis.angle);

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#667eea';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 绘制标签
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    axes.forEach(axis => {
      const labelRadius = radius + 25;
      const x = center + labelRadius * Math.cos(axis.angle);
      const y = center + labelRadius * Math.sin(axis.angle);

      const lines = axis.label.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, x, y + (i - (lines.length - 1) / 2) * 16);
      });
    });

    // 绘制分数
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#667eea';

    axes.forEach(axis => {
      const valueRadius = (axis.value / 10) * radius;
      const x = center + (valueRadius + 15) * Math.cos(axis.angle);
      const y = center + (valueRadius + 15) * Math.sin(axis.angle);

      ctx.fillText(axis.value, x, y);
    });
  }

  /**
   * 绘制 AHA 价值雷达图
   * @param {Object} data - { aha: 1-10, highlight: 1-10, advancement: 1-10 }
   * @param {string} containerId - 容器 ID
   */
  static drawAHARadar(data, containerId) {
    const canvas = document.getElementById(containerId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = Math.min(canvas.width, canvas.height);
    const center = size / 2;
    const radius = size / 2 - 40;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景网格（同心圆）
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(center, center, (radius / 5) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 绘制轴线
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;

    const axes = [
      { label: '顿悟\n(A)', angle: -Math.PI / 2, value: data.aha },
      { label: '高光\n(H)', angle: Math.PI / 6, value: data.highlight },
      { label: '进步\n(A)', angle: 5 * Math.PI / 6, value: data.advancement }
    ];

    axes.forEach(axis => {
      const x = center + radius * Math.cos(axis.angle);
      const y = center + radius * Math.sin(axis.angle);

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    // 绘制数据区域
    ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;

    ctx.beginPath();

    axes.forEach((axis, i) => {
      const valueRadius = (axis.value / 10) * radius;
      const x = center + valueRadius * Math.cos(axis.angle);
      const y = center + valueRadius * Math.sin(axis.angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 绘制数据点
    axes.forEach(axis => {
      const valueRadius = (axis.value / 10) * radius;
      const x = center + valueRadius * Math.cos(axis.angle);
      const y = center + valueRadius * Math.sin(axis.angle);

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 绘制标签
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    axes.forEach(axis => {
      const labelRadius = radius + 25;
      const x = center + labelRadius * Math.cos(axis.angle);
      const y = center + labelRadius * Math.sin(axis.angle);

      const lines = axis.label.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, x, y + (i - (lines.length - 1) / 2) * 16);
      });
    });

    // 绘制分数
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#10b981';

    axes.forEach(axis => {
      const valueRadius = (axis.value / 10) * radius;
      const x = center + (valueRadius + 15) * Math.cos(axis.angle);
      const y = center + (valueRadius + 15) * Math.sin(axis.angle);

      ctx.fillText(axis.value, x, y);
    });
  }

  /**
   * 绘制商业画布可视化（9 格）
   * @param {Object} data - 9 个模块的内容
   * @param {string} containerId - 容器 ID
   */
  static drawBusinessCanvas(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const canvasElements = {
      valueProposition: data.valueProposition || '',
      customerSegments: data.customerSegments || '',
      channels: data.channels || '',
      customerRelationships: data.customerRelationships || '',
      revenueStreams: data.revenueStreams || '',
      keyResources: data.keyResources || '',
      keyActivities: data.keyActivities || '',
      keyPartnerships: data.keyPartnerships || '',
      costStructure: data.costStructure || ''
    };

    const cells = [
      { id: 'customerSegments', title: '客户细分', row: 1, col: 1 },
      { id: 'valueProposition', title: '价值主张', row: 1, col: 2, highlight: true },
      { id: 'channels', title: '渠道通路', row: 1, col: 3 },
      { id: 'customerRelationships', title: '客户关系', row: 2, col: 1 },
      { id: 'revenueStreams', title: '收入来源', row: 2, col: 3 },
      { id: 'keyResources', title: '核心资源', row: 3, col: 1 },
      { id: 'keyActivities', title: '关键业务', row: 3, col: 2 },
      { id: 'keyPartnerships', title: '重要合作', row: 3, col: 3 },
      { id: 'costStructure', title: '成本结构', row: 2, col: 2 }
    ];

    let html = '<div class="business-canvas-grid">';

    cells.forEach(cell => {
      const content = canvasElements[cell.id] || '';
      const highlightClass = cell.highlight ? 'canvas-cell-highlight' : '';

      html += `
        <div class="canvas-grid-cell ${highlightClass}" data-row="${cell.row}" data-col="${cell.col}">
          <div class="canvas-cell-title">${cell.title}</div>
          <div class="canvas-cell-content">${content}</div>
        </div>
      `;
    });

    html += '</div>';

    container.innerHTML = html;
  }
}

/**
 * 生成项目时间线 HTML
 */
function generateTimeline(project) {
  const stages = [
    { name: 'Reveal', data: project.reveal, icon: '🔍' },
    { name: 'Inspire', data: project.inspire, icon: '💡' },
    { name: 'Shape', data: project.shape, icon: '🎨' },
    { name: 'Exam', data: project.exam, icon: '✅' }
  ];

  let html = '<div class="project-timeline">';

  stages.forEach((stage, index) => {
    const isCompleted = hasStageContent(stage.data);
    const isCurrent = !isCompleted && index > 0 && hasStageContent(stages[index - 1].data);
    const statusClass = isCompleted ? 'completed' : (isCurrent ? 'current' : 'pending');

    html += `
      <div class="timeline-item ${statusClass}">
        <div class="timeline-dot">${stage.icon}</div>
        <div class="timeline-content">
          <div class="timeline-stage">${stage.name}</div>
          <div class="timeline-status">${isCompleted ? '✓ 已完成' : '○ 待完成'}</div>
        </div>
        ${index < stages.length - 1 ? '<div class="timeline-line"></div>' : ''}
      </div>
    `;
  });

  html += '</div>';

  return html;
}

/**
 * 检查阶段是否有内容
 */
function hasStageContent(stageData) {
  if (!stageData) return false;
  if (stageData.pov && (stageData.pov.targetUser || stageData.pov.painPoint)) return true;
  if (stageData.ideas && stageData.ideas.length > 0) return true;
  if (stageData.concept && (stageData.concept.name || stageData.concept.description)) return true;
  if (stageData.elevatorPitch && stageData.elevatorPitch.problem) return true;
  return false;
}

/**
 * 生成产出卡片 HTML
 */
function generateOutputCard(type, data) {
  const icons = {
    pov: '📌',
    persona: '👤',
    idea: '💡',
    concept: '📦',
    story: '🎭',
    aha: '✨',
    pitch: '🚀',
    canvas: '📊'
  };

  const titles = {
    pov: 'POV 洞察',
    persona: '用户画像',
    idea: '创意方案',
    concept: '概念设计',
    story: '体验故事',
    aha: 'AHA 时刻',
    pitch: '电梯呈现',
    canvas: '商业画布'
  };

  return `
    <div class="output-card">
      <div class="output-icon">${icons[type] || '📄'}</div>
      <div class="output-title">${titles[type] || type}</div>
      <div class="output-preview">${data.preview || ''}</div>
      <button class="output-view-btn" onclick="viewOutput('${type}')">查看详情 →</button>
    </div>
  `;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EurekaVisualizations,
    generateTimeline,
    generateOutputCard,
    hasStageContent
  };
}
