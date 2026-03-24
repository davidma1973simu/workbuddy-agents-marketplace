/**
 * 导出服务
 * 支持 Markdown、PDF、PPT 三种导出格式
 */

class ExportService {
  constructor() {
    this.serviceName = 'ExportService';
  }

  /**
   * 导出为 Markdown 格式
   * @param {Object} project - 项目数据
   * @returns {string} Markdown 文本
   */
  exportToMarkdown(project) {
    const md = [];
    const p = project;

    // 标题
    md.push(`# ${p.project.name}\n`);
    md.push(`**项目ID**: ${p.project.id}\n`);
    md.push(`**状态**: ${this._getStatusText(p.project.status)}\n`);
    md.push(`**进度**: ${p.project.progress}%\n`);
    md.push(`**创建时间**: ${new Date(p.project.createdAt).toLocaleString('zh-CN')}\n`);
    md.push(`**最后更新**: ${new Date(p.project.updatedAt).toLocaleString('zh-CN')}\n\n`);
    md.push(`---\n\n`);

    // 项目简介
    md.push(`## 📋 项目简介\n`);
    md.push(`${p.project.brief}\n\n`);
    md.push(`**目标用户**: ${p.project.targetUser}\n\n`);

    // Reveal 阶段
    if (p.reveal) {
      md.push(`## 🔍 Reveal - 洞察\n\n`);

      if (p.reveal.pov) {
        md.push(`### POV（用户观点）\n`);
        md.push(`**用户**: ${p.reveal.pov.user}\n`);
        md.push(`**痛点**: ${p.reveal.pov.painPoint}\n`);
        md.push(`**需求**: ${p.reveal.pov.needs}\n`);
        md.push(`**洞察**: ${p.reveal.pov.insight}\n\n`);
      }

      if (p.reveal.userPersona) {
        md.push(`### 用户画像\n`);
        md.push(`**姓名**: ${p.reveal.userPersona.name}\n`);
        md.push(`**年龄**: ${p.reveal.userPersona.age}\n`);
        md.push(`**职业**: ${p.reveal.userPersona.occupation}\n`);
        md.push(`**特征**: ${p.reveal.userPersona.characteristics}\n`);
        md.push(`**目标**: ${p.reveal.userPersona.goals}\n\n`);
      }

      if (p.reveal.stakeholders) {
        md.push(`### 利益相关者\n\n`);
        p.reveal.stakeholders.forEach((stakeholder, index) => {
          md.push(`**${stakeholder.name}** (${stakeholder.role})\n`);
          md.push(`- 关注点: ${stakeholder.concerns}\n`);
          md.push(`- 影响力: ${stakeholder.influence}\n\n`);
        });
      }

      if (p.reveal.scenarioMap) {
        md.push(`### 场景地图\n\n`);
        p.reveal.scenarioMap.stages.forEach((stage, index) => {
          md.push(`**阶段 ${index + 1}**: ${stage.name}\n`);
          md.push(`- 描述: ${stage.description}\n`);
          md.push(`- 触发点: ${stage.triggers}\n`);
          md.push(`- 痛点: ${stage.painPoints}\n\n`);
        });
      }
    }

    // Inspire 阶段
    if (p.inspire) {
      md.push(`## 💡 Inspire - 启发\n\n`);

      if (p.inspire.ideas && p.inspire.ideas.length > 0) {
        md.push(`### 创意列表\n\n`);
        p.inspire.ideas.forEach((idea, index) => {
          md.push(`${index + 1}. **${idea.title}**\n`);
          md.push(`   - 描述: ${idea.description}\n`);
          md.push(`   - 创新性: ${idea.novelty}/10\n`);
          md.push(`   - 可行性: ${idea.feasibility}/10\n\n`);
        });
      }

      if (p.inspire.selectedIdea) {
        md.push(`### 最佳创意\n\n`);
        md.push(`**${p.inspire.selectedIdea.title}**\n\n`);
        md.push(`${p.inspire.selectedIdea.description}\n\n`);
      }
    }

    // Shape 阶段
    if (p.shape) {
      md.push(`## 🎨 Shape - 构建\n\n`);

      if (p.shape.concept) {
        md.push(`### 概念方案\n\n`);
        md.push(`${p.shape.concept.description}\n\n`);
        md.push(`**核心价值**: ${p.shape.concept.valueProposition}\n\n`);
      }

      if (p.shape.story) {
        md.push(`### 体验故事（六幕剧）\n\n`);
        md.push(`1. 起因: ${p.shape.story.act1_setup}\n`);
        md.push(`2. 触发: ${p.shape.story.act2_incident}\n`);
        md.push(`3. 试探: ${p.shape.story.act3_risingAction}\n`);
        md.push(`4. 危机: ${p.shape.story.act4_climax}\n`);
        md.push(`5. 转折: ${p.shape.story.act5_fallingAction}\n`);
        md.push(`6. 新常态: ${p.shape.story.act6_resolution}\n\n`);
      }

      if (p.shape.mapValues) {
        md.push(`### MAP 商业价值雷达图\n\n`);
        md.push(`| 维度 | 评分 | 说明 |\n`);
        md.push(`|------|------|------|\n`);
        md.push(`| M - 市场潜力 | ${p.shape.mapValues.market}/10 | ${this._getMAPDescription('market', p.shape.mapValues.market)} |\n`);
        md.push(`| A - 用户增长 | ${p.shape.mapValues.adoption}/10 | ${this._getMAPDescription('adoption', p.shape.mapValues.adoption)} |\n`);
        md.push(`| P - 优势壁垒 | ${p.shape.mapValues.protection}/10 | ${this._getMAPDescription('protection', p.shape.mapValues.protection)} |\n\n`);
      }

      if (p.shape.businessCanvas) {
        md.push(`### 商业画布\n\n`);
        md.push(`**价值主张**: ${p.shape.businessCanvas.valueProposition}\n\n`);
        md.push(`**客户细分**: ${p.shape.businessCanvas.customerSegments}\n\n`);
        md.push(`**收入来源**: ${p.shape.businessCanvas.revenueStreams}\n\n`);
        md.push(`**成本结构**: ${p.shape.businessCanvas.costStructure}\n\n`);
      }
    }

    // Exam 阶段
    if (p.exam) {
      md.push(`## ✅ Exam - 验证\n\n`);

      if (p.exam.ahaEvaluation) {
        md.push(`### AHA 价值评估\n\n`);
        md.push(`**描述**: ${p.exam.ahaEvaluation.description}\n\n`);
        md.push(`| 维度 | 评分 | 说明 |\n`);
        md.push(`|------|------|------|\n`);
        md.push(`| A - 顿悟 | ${p.exam.ahaEvaluation.aha}/10 | ${this._getAHADescription('aha', p.exam.ahaEvaluation.aha)} |\n`);
        md.push(`| H - 高光 | ${p.exam.ahaEvaluation.highlight}/10 | ${this._getAHADescription('highlight', p.exam.ahaEvaluation.highlight)} |\n`);
        md.push(`| A - 进步 | ${p.exam.ahaEvaluation.advancement}/10 | ${this._getAHADescription('advancement', p.exam.ahaEvaluation.advancement)} |\n\n`);
      }

      if (p.exam.elevatorPitch) {
        md.push(`### 电梯呈现\n\n`);
        md.push(`${p.exam.elevatorPitch.pitch}\n\n`);
        md.push(`**关键亮点**:\n`);
        p.exam.elevatorPitch.highlights.forEach(highlight => {
          md.push(`- ${highlight}\n`);
        });
        md.push(`\n`);
      }

      if (p.exam.iterationPlan) {
        md.push(`### 迭代计划\n\n`);
        p.exam.iterationPlan.milestones.forEach((milestone, index) => {
          md.push(`${index + 1}. **${milestone.title}** (${milestone.deadline})\n`);
          md.push(`   - 目标: ${milestone.goal}\n`);
          md.push(`   - 关键任务: ${milestone.tasks.join(', ')}\n\n`);
        });
      }
    }

    return md.join('');
  }

  /**
   * 导出为 PDF 格式
   * 使用浏览器打印功能，配合 CSS 打印样式
   * @param {Object} project - 项目数据
   */
  exportToPDF(project) {
    // 创建临时打印容器
    const printContainer = document.createElement('div');
    printContainer.id = 'eureka-print-container';
    printContainer.style.padding = '40px';
    printContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    // 将 Markdown 转换为 HTML
    const markdownText = this.exportToMarkdown(project);
    const htmlContent = this._markdownToHTML(markdownText);

    printContainer.innerHTML = htmlContent;

    // 添加到页面
    document.body.appendChild(printContainer);

    // 打印
    window.print();

    // 打印后移除容器
    setTimeout(() => {
      document.body.removeChild(printContainer);
    }, 100);
  }

  /**
   * 导出为 PPT 格式
   * 生成适合导入到 PowerPoint 的 HTML 格式
   * @param {Object} project - 项目数据
   */
  exportToPPT(project) {
    const slides = [];

    // 封面页
    slides.push({
      title: project.project.name,
      content: [
        `项目ID: ${project.project.id}`,
        `状态: ${this._getStatusText(project.project.status)}`,
        `进度: ${project.project.progress}%`,
        `目标用户: ${project.project.targetUser}`,
        `创建时间: ${new Date(project.project.createdAt).toLocaleString('zh-CN')}`
      ]
    });

    // 项目简介页
    slides.push({
      title: '📋 项目简介',
      content: [
        project.project.brief,
        '',
        `目标用户: ${project.project.targetUser}`
      ]
    });

    // Reveal 阶段页
    if (project.reveal) {
      slides.push({
        title: '🔍 Reveal - 洞察',
        content: this._extractRevealContent(project.reveal)
      });
    }

    // Inspire 阶段页
    if (project.inspire) {
      slides.push({
        title: '💡 Inspire - 启发',
        content: this._extractInspireContent(project.inspire)
      });
    }

    // Shape 阶段页
    if (project.shape) {
      slides.push({
        title: '🎨 Shape - 构建',
        content: this._extractShapeContent(project.shape)
      });

      if (project.shape.mapValues) {
        slides.push({
          title: 'MAP 商业价值雷达',
          content: [
            `市场潜力: ${project.shape.mapValues.market}/10`,
            `用户增长: ${project.shape.mapValues.adoption}/10`,
            `优势壁垒: ${project.shape.mapValues.protection}/10`
          ]
        });
      }
    }

    // Exam 阶段页
    if (project.exam) {
      slides.push({
        title: '✅ Exam - 验证',
        content: this._extractExamContent(project.exam)
      });

      if (project.exam.ahaEvaluation) {
        slides.push({
          title: 'AHA 价值评估',
          content: [
            `顿悟 (Aha): ${project.exam.ahaEvaluation.aha}/10`,
            `高光 (Highlight): ${project.exam.ahaEvaluation.highlight}/10`,
            `进步 (Advancement): ${project.exam.ahaEvaluation.advancement}/10`
          ]
        });
      }
    }

    // 生成 HTML 幻灯片
    const html = this._generatePPTHTML(slides, project.project.name);

    // 创建下载链接
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.project.name}_slides.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 导出多个项目
   * @param {Array} projects - 项目数组
   * @param {string} format - 导出格式 'markdown' | 'pdf' | 'ppt'
   */
  exportMultipleProjects(projects, format = 'markdown') {
    if (format === 'markdown') {
      const allMarkdown = projects.map(p => this.exportToMarkdown(p)).join('\n\n---\n\n');
      this._downloadText(allMarkdown, `eureka_projects_${Date.now()}.md`);
    } else if (format === 'ppt') {
      // PPT 导出只支持单个项目，提示用户
      alert('PPT 导出仅支持单个项目。请选择要导出的项目。');
    } else {
      // PDF 导出同样只支持单个项目
      alert('PDF 导出仅支持单个项目。请选择要导出的项目。');
    }
  }

  // ========== 私有辅助方法 ==========

  _getStatusText(status) {
    const statusMap = {
      'draft': '草稿',
      'in_progress': '进行中',
      'completed': '已完成',
      'archived': '已归档'
    };
    return statusMap[status] || status;
  }

  _getMAPDescription(dimension, score) {
    const descriptions = {
      market: ['极小', '较小', '一般', '较大', '巨大'],
      adoption: ['极低', '较低', '一般', '较高', '极高'],
      protection: ['极弱', '较弱', '一般', '较强', '极强']
    };
    const index = Math.min(Math.floor(score / 2.5), 4);
    return descriptions[dimension][index];
  }

  _getAHADescription(dimension, score) {
    const descriptions = {
      aha: ['平淡', '常规', '惊喜', '惊艳', '颠覆'],
      highlight: ['无亮点', '一般亮点', '较多亮点', '突出亮点', '极具吸引力'],
      advancement: ['无进步', '小幅进步', '明显进步', '重大进步', '革命性突破']
    };
    const index = Math.min(Math.floor(score / 2.5), 4);
    return descriptions[dimension][index];
  }

  _markdownToHTML(markdown) {
    let html = markdown
      // 标题
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // 粗体
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // 水平线
      .replace(/^---$/gim, '<hr>')
      // 列表
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      // 表格（简化处理）
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split('|').filter(c => c.trim());
        const cellHTML = cells.map(c => `<td>${c.trim()}</td>`).join('');
        return `<tr>${cellHTML}</tr>`;
      })
      // 段落
      .replace(/\n\n/g, '</p><p>');

    return `<div class="markdown">${html}</div>`;
  }

  _extractRevealContent(reveal) {
    const content = [];
    if (reveal.pov) {
      content.push('POV:', reveal.pov.insight);
    }
    if (reveal.userPersona) {
      content.push('用户画像:', reveal.userPersona.name);
    }
    if (reveal.stakeholders) {
      content.push(`利益相关者: ${reveal.stakeholders.length} 人`);
    }
    return content;
  }

  _extractInspireContent(inspire) {
    const content = [];
    if (inspire.ideas) {
      content.push(`创意数量: ${inspire.ideas.length}`);
    }
    if (inspire.selectedIdea) {
      content.push('最佳创意:', inspire.selectedIdea.title);
    }
    return content;
  }

  _extractShapeContent(shape) {
    const content = [];
    if (shape.concept) {
      content.push('核心价值:', shape.concept.valueProposition);
    }
    if (shape.story) {
      content.push('体验故事: 六幕剧结构');
    }
    return content;
  }

  _extractExamContent(exam) {
    const content = [];
    if (exam.elevatorPitch) {
      content.push('电梯呈现:', exam.elevatorPitch.pitch);
    }
    if (exam.iterationPlan) {
      content.push(`迭代计划: ${exam.iterationPlan.milestones.length} 个里程碑`);
    }
    return content;
  }

  _generatePPTHTML(slides, projectName) {
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${projectName} - Eureka 幻灯片</title>
  <style>
    body { font-family: 'Microsoft YaHei', sans-serif; margin: 0; padding: 20px; }
    .slide { page-break-after: always; margin-bottom: 40px; border: 2px solid #ddd; padding: 40px; min-height: 500px; }
    .slide h2 { border-bottom: 3px solid #3b82f6; padding-bottom: 10px; color: #1e40af; }
    .slide ul { line-height: 2; font-size: 18px; }
    .slide li { margin-bottom: 10px; }
  </style>
</head>
<body>`;

    slides.forEach(slide => {
      html += `<div class="slide">
        <h2>${slide.title}</h2>
        <ul>
          ${slide.content.map(c => `<li>${c}</li>`).join('')}
        </ul>
      </div>`;
    });

    html += '</body></html>';
    return html;
  }

  _downloadText(text, filename) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// 全局导出服务实例
const exportService = new ExportService();
