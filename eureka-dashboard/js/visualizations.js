/**
 * Eureka 可视化组件库
 * 包含：甘特图、雷达图、流程产出、可交付资产等可视化组件
 */

// ==================== 甘特图组件 ====================

/**
 * 绘制项目甘特图
 * @param {string} canvasId - Canvas 元素 ID
 * @param {Array} projects - 项目列表
 */
function drawGanttChart(canvasId, projects) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  
  // 设置 Canvas 尺寸
  const width = canvas.offsetWidth * dpr;
  const height = canvas.offsetHeight * dpr;
  canvas.width = width;
  canvas.height = height;
  ctx.scale(dpr, dpr);

  // 清空画布
  ctx.clearRect(0, 0, width / dpr, height / dpr);

  if (!projects || projects.length === 0) {
    drawEmptyState(ctx, width / dpr, height / dpr, '暂无项目数据');
    return;
  }

  // 配置
  const padding = { top: 40, right: 30, bottom: 60, left: 150 };
  const chartWidth = (width / dpr) - padding.left - padding.right;
  const chartHeight = (height / dpr) - padding.top - padding.bottom;
  const rowHeight = Math.min(40, chartHeight / projects.length);
  const barHeight = rowHeight * 0.6;

  // 计算时间范围（显示最近30天）
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 15);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 15);
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  // 绘制时间轴
  drawTimeAxis(ctx, padding, chartWidth, chartHeight, startDate, endDate, totalDays);

  // 绘制项目条
  projects.forEach((project, index) => {
    const y = padding.top + index * rowHeight;
    const projectDate = new Date(project.createdAt || today);
    
    // 计算项目时间位置（假设项目持续7天）
    const projectDays = Math.ceil((projectDate - startDate) / (1000 * 60 * 60 * 24));
    const barWidth = Math.min(chartWidth * (7 / totalDays), chartWidth * 0.3);
    const x = padding.left + (projectDays / totalDays) * chartWidth - barWidth / 2;

    // 根据状态选择颜色
    const colors = {
      'draft': '#9ca3af',
      'in-progress': '#f59e0b',
      'completed': '#10b981',
      'archived': '#6b7280'
    };
    const color = colors[project.status] || '#9ca3af';

    // 绘制进度条背景
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.beginPath();
    ctx.roundRect(x, y + rowHeight * 0.2, barWidth, barHeight, 4);
    ctx.fill();

    // 绘制进度条
    const progress = project.progress || 0;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y + rowHeight * 0.2, barWidth * (progress / 100), barHeight, 4);
    ctx.fill();

    // 绘制项目名称
    ctx.fillStyle = '#374151';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const displayName = project.name.length > 12 
      ? project.name.substring(0, 12) + '...' 
      : project.name;
    ctx.fillText(displayName, padding.left - 10, y + rowHeight * 0.5);

    // 绘制进度百分比
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${progress}%`, x + barWidth + 8, y + rowHeight * 0.5);
  });

  // 绘制今天标记线
  const todayDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
  const todayX = padding.left + (todayDays / totalDays) * chartWidth;
  
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(todayX, padding.top);
  ctx.lineTo(todayX, padding.top + chartHeight);
  ctx.stroke();
  ctx.setLineDash([]);

  // 今天标记
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('今天', todayX, padding.top + chartHeight + 20);
}

/**
 * 绘制时间轴
 */
function drawTimeAxis(ctx, padding, chartWidth, chartHeight, startDate, endDate, totalDays) {
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;

  // 绘制时间网格（每隔5天）
  for (let day = 0; day <= totalDays; day += 5) {
    const x = padding.left + (day / totalDays) * chartWidth;
    
    // 垂直线
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + chartHeight);
    ctx.stroke();

    // 日期标签
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dateStr, x, padding.top + chartHeight + 35);
  }
}

// ==================== 雷达图组件 ====================

/**
 * 绘制 MAP 价值雷达图
 * @param {string} canvasId - Canvas 元素 ID
 * @param {Object} data - 数据 { market, adoption, protection }
 */
function drawMAPRadar(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  
  const width = canvas.offsetWidth * dpr;
  const height = canvas.offsetHeight * dpr;
  canvas.width = width;
  canvas.height = height;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width / dpr, height / dpr);

  // 配置
  const centerX = (width / dpr) / 2;
  const centerY = (height / dpr) / 2;
  const radius = Math.min(width, height) / (2 * dpr) - 40;
  const labels = ['市场潜力', '用户增长', '优势壁垒'];
  const values = [data.market || 0, data.adoption || 0, data.protection || 0];

  // 绘制背景网格（同心三角形）
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  for (let level = 1; level <= 5; level++) {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
      const r = (radius / 5) * level;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 绘制轴线
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  // 绘制数据区域
  ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
  ctx.strokeStyle = '#667eea';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
    const r = radius * (values[i] / 10);
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 绘制数据点
  ctx.fillStyle = '#667eea';
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
    const r = radius * (values[i] / 10);
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 绘制标签
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labelOffsets = [
    { x: 0, y: -20 },
    { x: 25, y: 25 },
    { x: -25, y: 25 }
  ];
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
    const x = centerX + Math.cos(angle) * (radius + 30) + labelOffsets[i].x;
    const y = centerY + Math.sin(angle) * (radius + 30) + labelOffsets[i].y;
    ctx.fillText(`${labels[i]}\n${values[i]}/10`, x, y);
  }
}

/**
 * 绘制 AHA 价值雷达图
 * @param {string} canvasId - Canvas 元素 ID
 * @param {Object} data - 数据 { aha, highlight, advancement }
 */
function drawAHARadar(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  
  const width = canvas.offsetWidth * dpr;
  const height = canvas.offsetHeight * dpr;
  canvas.width = width;
  canvas.height = height;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width / dpr, height / dpr);

  const centerX = (width / dpr) / 2;
  const centerY = (height / dpr) / 2;
  const radius = Math.min(width, height) / (2 * dpr) - 40;
  const labels = ['顿悟', '高光', '进步'];
  const values = [data.aha || 0, data.highlight || 0, data.advancement || 0];

  // 绘制背景网格
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  for (let level = 1; level <= 5; level++) {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
      const r = (radius / 5) * level;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 绘制数据区域（绿色系）
  ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
    const r = radius * (values[i] / 10);
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 绘制数据点
  ctx.fillStyle = '#10b981';
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
    const r = radius * (values[i] / 10);
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 绘制标签
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
    const x = centerX + Math.cos(angle) * (radius + 30);
    const y = centerY + Math.sin(angle) * (radius + 30);
    ctx.fillText(`${labels[i]}\n${values[i]}/10`, x, y);
  }
}

// ==================== 流程产出展示组件 ====================

/**
 * 渲染流程产出总览
 * @param {Object} project - 项目数据
 */
function renderProcessOutputs(project) {
  const container = document.getElementById('process-outputs');
  if (!container) return;

  if (!project) {
    container.innerHTML = '<div class="empty-state">请选择一个项目查看流程产出</div>';
    return;
  }

  const stages = [
    { name: 'Reveal', icon: '🔍', color: '#667eea', outputs: getRevealOutputs(project) },
    { name: 'Inspire', icon: '💡', color: '#f59e0b', outputs: getInspireOutputs(project) },
    { name: 'Shape', icon: '🎨', color: '#10b981', outputs: getShapeOutputs(project) },
    { name: 'Exam', icon: '✅', color: '#ef4444', outputs: getExamOutputs(project) }
  ];

  let html = '<div class="outputs-grid">';
  stages.forEach(stage => {
    html += `
      <div class="stage-card" style="border-left: 4px solid ${stage.color}">
        <div class="stage-header">
          <span class="stage-icon">${stage.icon}</span>
          <span class="stage-name">${stage.name}</span>
        </div>
        <div class="stage-outputs">
          ${stage.outputs.map(output => `
            <div class="output-item">
              <span class="output-icon">📄</span>
              <span class="output-text">${output}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

function getRevealOutputs(project) {
  const outputs = [];
  const reveal = project.reveal || {};
  
  if (reveal.pov) outputs.push('POV 三段式洞察');
  if (reveal.personas && reveal.personas.length > 0) 
    outputs.push(`${reveal.personas.length} 个用户画像`);
  if (reveal.stakeholders && reveal.stakeholders.length > 0)
    outputs.push(`${reveal.stakeholders.length} 个利益相关者`);
  if (reveal.journeyMap && reveal.journeyMap.touchpoints)
    outputs.push(`${reveal.journeyMap.touchpoints.length} 个触点`);
  
  return outputs.length > 0 ? outputs : ['暂无产出'];
}

function getInspireOutputs(project) {
  const outputs = [];
  const inspire = project.inspire || {};
  
  if (inspire.ideas && inspire.ideas.length > 0)
    outputs.push(`${inspire.ideas.length} 个创意方案`);
  if (inspire.matrix) outputs.push('三维评估矩阵');
  if (inspire.bestIdea) outputs.push('最佳创意选择');
  
  return outputs.length > 0 ? outputs : ['暂无产出'];
}

function getShapeOutputs(project) {
  const outputs = [];
  const shape = project.shape || {};
  
  if (shape.concept) outputs.push('四维概念方案');
  if (shape.mapValues) outputs.push('MAP 价值雷达');
  if (shape.story && shape.story.scenes)
    outputs.push('6幕体验故事');
  
  return outputs.length > 0 ? outputs : ['暂无产出'];
}

function getExamOutputs(project) {
  const outputs = [];
  const exam = project.exam || {};
  
  if (exam.ahaValues) outputs.push('AHA 价值评估');
  if (exam.elevatorPitch) outputs.push('电梯呈现');
  if (exam.iterationPlan) outputs.push('30-60-90天计划');
  if (exam.businessModel) outputs.push('商业模式画布');
  
  return outputs.length > 0 ? outputs : ['暂无产出'];
}

// ==================== 可交付资产组件 ====================

/**
 * 渲染可交付资产卡片
 * @param {Object} project - 项目数据
 */
function renderDeliverables(project) {
  const container = document.getElementById('deliverables');
  if (!container) return;

  if (!project) {
    container.innerHTML = '<div class="empty-state">请选择一个项目查看可交付资产</div>';
    return;
  }

  const deliverables = [
    {
      type: 'report',
      icon: '📊',
      title: '项目报告',
      desc: '完整的项目文档，包含四阶段所有产出',
      action: 'export',
      actionLabel: '导出 PDF'
    },
    {
      type: 'presentation',
      icon: '🎯',
      title: '演示文稿',
      desc: '适合向利益相关者展示的幻灯片',
      action: 'exportPPT',
      actionLabel: '导出 PPT'
    },
    {
      type: 'canvas',
      icon: '🎨',
      title: '商业模式画布',
      desc: '9模块商业模式可视化',
      action: 'viewCanvas',
      actionLabel: '查看'
    },
    {
      type: 'roadmap',
      icon: '🗺️',
      title: '实施路线图',
      desc: '30-60-90天迭代计划',
      action: 'viewRoadmap',
      actionLabel: '查看'
    }
  ];

  let html = '<div class="deliverables-grid">';
  deliverables.forEach(item => {
    const isAvailable = checkDeliverableAvailability(project, item.type);
    html += `
      <div class="deliverable-card ${isAvailable ? 'available' : 'locked'}">
        <div class="deliverable-icon">${item.icon}</div>
        <div class="deliverable-content">
          <h4 class="deliverable-title">${item.title}</h4>
          <p class="deliverable-desc">${item.desc}</p>
        </div>
        <button class="deliverable-action ${isAvailable ? 'primary' : 'secondary'}"
                onclick="${item.action}('${project.id}')"
                ${!isAvailable ? 'disabled' : ''}>
          ${isAvailable ? item.actionLabel : '待完成'}
        </button>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

function checkDeliverableAvailability(project, type) {
  if (!project) return false;
  
  const checks = {
    report: () => project.progress > 50,
    presentation: () => project.progress > 70,
    canvas: () => project.exam && project.exam.businessModel,
    roadmap: () => project.exam && project.exam.iterationPlan
  };
  
  return checks[type] ? checks[type]() : false;
}

// ==================== 工具函数 ====================

/**
 * 绘制空状态
 */
function drawEmptyState(ctx, width, height, message) {
  ctx.fillStyle = '#9ca3af';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(message, width / 2, height / 2);
}

/**
 * 初始化所有可视化组件
 */
function initVisualizations(project) {
  // 创建 ProjectStorage 实例
  const storage = new ProjectStorage();
  
  // 绘制甘特图
  const projects = storage.getAll();
  drawGanttChart('gantt-chart', projects);
  
  // 绘制雷达图
  if (project) {
    if (project.shape && project.shape.mapValues) {
      drawMAPRadar('map-radar-chart', project.shape.mapValues);
    }
    if (project.exam && project.exam.ahaValues) {
      drawAHARadar('aha-radar-chart', project.exam.ahaValues);
    }
  }
  
  // 渲染流程产出和可交付资产
  renderProcessOutputs(project);
  renderDeliverables(project);
}

// 监听窗口大小变化，重新绘制图表
window.addEventListener('resize', () => {
  const storage = new ProjectStorage();
  const projects = storage.getAll();
  drawGanttChart('gantt-chart', projects);
  
  const currentProject = storage.getById(window.currentProjectId);
  if (currentProject) {
    if (currentProject.shape && currentProject.shape.mapValues) {
      drawMAPRadar('map-radar-chart', currentProject.shape.mapValues);
    }
    if (currentProject.exam && currentProject.exam.ahaValues) {
      drawAHARadar('aha-radar-chart', currentProject.exam.ahaValues);
    }
  }
});
