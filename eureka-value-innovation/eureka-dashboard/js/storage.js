/**
 * Eureka 项目存储管理
 * 基于 localStorage 的数据持久化
 */

class ProjectStorage {
  constructor() {
    this.storageKey = 'eureka_projects';
  }

  /**
   * 生成项目 ID
   */
  generateId() {
    return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 获取所有项目
   */
  getAll() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  /**
   * 根据 ID 获取项目
   */
  getById(id) {
    const projects = this.getAll();
    return projects.find(p => p.project.id === id) || null;
  }

  /**
   * 创建新项目
   */
  create(project) {
    const projects = this.getAll();
    projects.push(project);
    this.save(projects);
    return project;
  }

  /**
   * 更新项目
   */
  update(id, updates) {
    const projects = this.getAll();
    const index = projects.findIndex(p => p.project.id === id);
    
    if (index === -1) {
      throw new Error('项目不存在');
    }

    // 深度合并更新
    deepMerge(projects[index], updates);
    this.save(projects);
    return projects[index];
  }

  /**
   * 删除项目
   */
  delete(id) {
    const projects = this.getAll();
    const filtered = projects.filter(p => p.project.id !== id);
    this.save(filtered);
  }

  /**
   * 归档项目
   */
  archive(id) {
    return this.update(id, { 'project.status': 'archived' });
  }

  /**
   * 搜索项目
   */
  search(keyword) {
    const projects = this.getAll();
    const lowerKeyword = keyword.toLowerCase();
    
    return projects.filter(p => {
      const name = p.project.name?.toLowerCase() || '';
      const brief = p.project.brief?.toLowerCase() || '';
      return name.includes(lowerKeyword) || brief.includes(lowerKeyword);
    });
  }

  /**
   * 按状态筛选
   */
  filterByStatus(status) {
    const projects = this.getAll();
    
    if (!status) {
      return projects;
    }
    
    return projects.filter(p => p.project.status === status);
  }

  /**
   * 保存所有项目到 localStorage
   */
  save(projects) {
    localStorage.setItem(this.storageKey, JSON.stringify(projects));
  }

  /**
   * 导出为 JSON
   */
  exportJSON() {
    const projects = this.getAll();
    return JSON.stringify(projects, null, 2);
  }

  /**
   * 导入 JSON
   */
  importJSON(json) {
    try {
      const projects = JSON.parse(json);
      
      if (!Array.isArray(projects)) {
        throw new Error('导入数据格式错误');
      }

      this.save(projects);
      return true;
    } catch (error) {
      console.error('导入失败:', error);
      return false;
    }
  }
}

/**
 * 深度合并对象
 */
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

/**
 * 创建空项目
 */
function createEmptyProject() {
  return {
    project: {
      id: '',
      name: '',
      brief: '',
      targetUser: '',
      targetScenario: '',
      status: 'draft',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    reveal: {
      pov: {
        targetUser: '',
        painPoint: '',
        insight: ''
      },
      personas: [],
      stakeholders: [],
      journeyMap: []
    },
    inspire: {
      ideas: [],
      selectedIdeaId: '',
      selectedReason: ''
    },
    shape: {
      concept: {
        name: '',
        description: '',
        userValue: '',
        techSolution: '',
        businessValue: '',
        stakeholderValue: ''
      },
      mapValues: {
        market: 5,
        adoption: 5,
        protection: 5
      },
      experienceStory: Array(6).fill(null).map(() => ({
        title: '',
        description: '',
        userFeeling: '',
        ahaMoment: ''
      }))
    },
    exam: {
      ahaEvaluation: {
        description: '',
        aha: 5,
        highlight: 5,
        advancement: 5
      },
      elevatorPitch: {
        problem: '',
        solution: '',
        targetUser: '',
        coreValue: '',
        callToAction: ''
      },
      iterationPlan: {
        day30: { goal: '', milestones: '' },
        day60: { goal: '', milestones: '' },
        day90: { goal: '', milestones: '' }
      },
      businessCanvas: {
        valueProposition: '',
        customerSegments: '',
        channels: '',
        customerRelationships: '',
        revenueStreams: '',
        keyResources: '',
        keyActivities: '',
        keyPartnerships: '',
        costStructure: ''
      }
    }
  };
}

/**
 * 格式化日期
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * 状态颜色映射
 */
const STATUS_COLOR = {
  draft: '#9ca3af',
  in_progress: '#667eea',
  completed: '#10b981',
  archived: '#f59e0b'
};

/**
 * 状态文本映射
 */
const STATUS_TEXT = {
  draft: '草稿',
  in_progress: '进行中',
  completed: '已完成',
  archived: '已归档'
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ProjectStorage,
    deepMerge,
    createEmptyProject,
    formatDate,
    STATUS_COLOR,
    STATUS_TEXT
  };
}
