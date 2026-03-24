/**
 * Eureka 项目数据存储服务
 * 基于 localStorage 实现
 */

const STORAGE_KEY = 'eureka_projects';
const BACKUP_KEY = 'eureka_projects_backup';

class ProjectStorage {
  constructor() {
    this.projects = this.load();
  }

  /**
   * 从 localStorage 加载项目数据
   */
  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('加载项目数据失败:', error);
      return [];
    }
  }

  /**
   * 保存项目数据到 localStorage
   */
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.projects));
      return true;
    } catch (error) {
      console.error('保存项目数据失败:', error);
      alert('保存失败，可能因为存储空间不足');
      return false;
    }
  }

  /**
   * 获取所有项目
   */
  getAll() {
    return this.projects;
  }

  /**
   * 根据 ID 获取项目
   */
  getById(id) {
    return this.projects.find(p => p.project.id === id);
  }

  /**
   * 创建新项目
   */
  create(projectData) {
    const errors = validateProject(projectData);
    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }

    projectData.project.createdAt = new Date().toISOString();
    projectData.project.updatedAt = new Date().toISOString();
    projectData.project.progress = calculateProgress(projectData);

    this.projects.unshift(projectData);
    this.save();

    return projectData;
  }

  /**
   * 更新项目
   */
  update(id, updates) {
    const index = this.projects.findIndex(p => p.project.id === id);

    if (index === -1) {
      throw new Error('项目不存在');
    }

    // 合并更新
    const merged = deepMerge(this.projects[index], updates);
    merged.project.updatedAt = new Date().toISOString();
    merged.project.progress = calculateProgress(merged);

    this.projects[index] = merged;
    this.save();

    return merged;
  }

  /**
   * 删除项目
   */
  delete(id) {
    const index = this.projects.findIndex(p => p.project.id === id);

    if (index === -1) {
      throw new Error('项目不存在');
    }

    this.projects.splice(index, 1);
    this.save();
  }

  /**
   * 更新项目状态
   */
  updateStatus(id, status) {
    return this.update(id, {
      project: { status }
    });
  }

  /**
   * 归档项目
   */
  archive(id) {
    return this.updateStatus(id, 'archived');
  }

  /**
   * 搜索项目
   */
  search(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    return this.projects.filter(p =>
      p.project.name.toLowerCase().includes(lowerKeyword) ||
      p.project.brief.toLowerCase().includes(lowerKeyword) ||
      p.project.targetUser.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * 按状态筛选项目
   */
  filterByStatus(status) {
    if (!status) return this.projects;
    return this.projects.filter(p => p.project.status === status);
  }

  /**
   * 导出所有项目为 JSON
   */
  exportJSON() {
    return JSON.stringify(this.projects, null, 2);
  }

  /**
   * 导入项目数据
   */
  importJSON(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      if (!Array.isArray(imported)) {
        throw new Error('数据格式不正确');
      }

      // 验证每个项目
      imported.forEach(project => {
        const errors = validateProject(project);
        if (errors.length > 0) {
          throw new Error(`项目 "${project.project.name}" 数据不完整: ${errors.join('; ')}`);
        }
      });

      // 备份当前数据
      this.backup();

      // 导入新数据
      this.projects = imported;
      this.save();

      return true;
    } catch (error) {
      console.error('导入失败:', error);
      alert(`导入失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 备份当前数据
   */
  backup() {
    const timestamp = new Date().toISOString();
    const backupData = {
      timestamp,
      projects: this.projects
    };

    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backupData));
    } catch (error) {
      console.error('备份失败:', error);
    }
  }

  /**
   * 清空所有项目
   */
  clear() {
    this.projects = [];
    this.save();
  }
}

/**
 * 深度合并对象
 */
function deepMerge(target, source) {
  const result = JSON.parse(JSON.stringify(target));

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * 格式化日期
 */
function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;

  return date.toLocaleDateString('zh-CN');
}

/**
 * 状态文本映射
 */
const STATUS_TEXT = {
  draft: '草稿',
  in_progress: '进行中',
  completed: '已完成',
  archived: '已归档'
};

/**
 * 状态颜色映射
 */
const STATUS_COLOR = {
  draft: '#9ca3af',
  in_progress: '#3b82f6',
  completed: '#10b981',
  archived: '#6b7280'
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ProjectStorage,
    formatDate,
    STATUS_TEXT,
    STATUS_COLOR
  };
}
