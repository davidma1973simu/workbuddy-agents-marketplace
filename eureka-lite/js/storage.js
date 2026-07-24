/**
 * Eureka Lite - Storage Module
 * localStorage wrapper with data models
 */

const STORAGE_KEYS = {
  USER: 'eureka_lite_user',
  PROJECTS: 'eureka_lite_projects',
  CHECKIN: 'eureka_lite_checkin',
  SETTINGS: 'eureka_lite_settings'
};

// Default user data
const DEFAULT_USER = {
  guest: true,
  name: '',
  points: 0,
  streak: 0,
  lastCheckIn: null,
  unlockedPro: false,
  createdAt: null
};

// Default checkin data
const DEFAULT_CHECKIN = {
  dates: [], // Array of date strings
  streak: 0,
  lastDate: null
};

// Project data model factory
function createProject(data = {}) {
  return {
    id: data.id || generateId(),
    type: data.type || 'practice', // practice | project
    category: data.category || null, // product | service | problem | explore
    title: data.title || '',
    description: data.description || '',
    stage: data.stage || 'reveal', // reveal | inspire | shape | exam
    currentScreen: data.currentScreen || 1,
    totalScreens: data.totalScreens || 5,
    status: data.status || 'in_progress', // in_progress | completed
    cards: data.cards || {
      // Reveal
      keyFindings: [],
      painInsight: {},
      businessGoal: {},
      // Inspire
      hmw: {},
      ncoInspiration: [],
      ideas: [],
      bestIdea: {},
      // Shape
      minConcept: {},
      userStoryboard: [],
      // Exam
      testReport: {},
      fourDimensionEval: {},
      elevatorPitch: {},
      iterationPlan: {}
    },
    createdAt: data.createdAt || Date.now(),
    updatedAt: data.updatedAt || Date.now()
  };
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Storage wrapper
const storage = {
  /**
   * Get item from localStorage
   */
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },

  /**
   * Set item to localStorage
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },

  /**
   * Remove item from localStorage
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage remove error:', e);
      return false;
    }
  },

  /**
   * Clear all Eureka Lite data
   */
  clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.remove(key);
    });
  },

  // ========== User ==========

  getUser() {
    const user = this.get(STORAGE_KEYS.USER);
    if (!user) {
      const defaultUser = { ...DEFAULT_USER, createdAt: Date.now() };
      this.set(STORAGE_KEYS.USER, defaultUser);
      return defaultUser;
    }
    return user;
  },

  setUser(userData) {
    const current = this.get(STORAGE_KEYS.USER) || DEFAULT_USER;
    return this.set(STORAGE_KEYS.USER, { ...current, ...userData });
  },

  updateUser(updates) {
    const user = this.getUser();
    return this.set(STORAGE_KEYS.USER, { ...user, ...updates });
  },

  // ========== Projects ==========

  getProjects() {
    return this.get(STORAGE_KEYS.PROJECTS) || [];
  },

  setProjects(projects) {
    return this.set(STORAGE_KEYS.PROJECTS, projects);
  },

  getProject(id) {
    const projects = this.getProjects();
    return projects.find(p => p.id === id) || null;
  },

  addProject(projectData) {
    const projects = this.getProjects();
    const project = createProject(projectData);
    projects.unshift(project); // Add to beginning
    this.setProjects(projects);
    return project;
  },

  updateProject(id, updates) {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates, updatedAt: Date.now() };
      this.setProjects(projects);
      return projects[index];
    }
    return null;
  },

  deleteProject(id) {
    const projects = this.getProjects();
    const filtered = projects.filter(p => p.id !== id);
    this.setProjects(filtered);
  },

  getRecentProjects(limit = 5) {
    const projects = this.getProjects();
    return projects.slice(0, limit);
  },

  // ========== Cards ==========

  updateCard(projectId, cardType, cardData) {
    const project = this.getProject(projectId);
    if (!project) return null;

    const cards = { ...project.cards, [cardType]: cardData };
    return this.updateProject(projectId, { cards });
  },

  addCardItem(projectId, cardType, item) {
    const project = this.getProject(projectId);
    if (!project) return null;

    const cards = { ...project.cards };
    if (Array.isArray(cards[cardType])) {
      cards[cardType] = [...cards[cardType], { ...item, id: generateId() }];
    }

    return this.updateProject(projectId, { cards });
  },

  removeCardItem(projectId, cardType, itemId) {
    const project = this.getProject(projectId);
    if (!project) return null;

    const cards = { ...project.cards };
    if (Array.isArray(cards[cardType])) {
      cards[cardType] = cards[cardType].filter(item => item.id !== itemId);
    }

    return this.updateProject(projectId, { cards });
  },

  // ========== Checkin ==========

  getCheckin() {
    const checkin = this.get(STORAGE_KEYS.CHECKIN);
    if (!checkin) {
      this.setCheckin(DEFAULT_CHECKIN);
      return DEFAULT_CHECKIN;
    }
    return checkin;
  },

  setCheckin(data) {
    return this.set(STORAGE_KEYS.CHECKIN, data);
  },

  recordCheckin() {
    const today = new Date().toISOString().split('T')[0];
    const checkin = this.getCheckin();

    // Already checked in today
    if (checkin.lastDate === today) {
      return checkin;
    }

    // Calculate streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (checkin.lastDate === yesterdayStr) {
      newStreak = checkin.streak + 1;
    }

    const updatedCheckin = {
      dates: [...checkin.dates, today],
      streak: newStreak,
      lastDate: today
    };

    this.setCheckin(updatedCheckin);

    // Update user points and streak
    this.updateUser({
      streak: newStreak,
      lastCheckIn: today
    });

    return updatedCheckin;
  },

  // ========== Points ==========

  addPoints(amount, reason = '') {
    const user = this.getUser();
    const newPoints = user.points + amount;

    this.updateUser({
      points: newPoints,
      pointsHistory: [
        ...(user.pointsHistory || []),
        {
          amount,
          reason,
          timestamp: Date.now()
        }
      ]
    });

    // Check if unlocked Pro (完成 2 个完整 Lite 项目：2 × 600 = 1200 分)
    if (newPoints >= 1200 && !user.unlockedPro) {
      this.updateUser({ unlockedPro: true });
    }

    return newPoints;
  },

  // ========== Settings ==========

  getSettings() {
    return this.get(STORAGE_KEYS.SETTINGS) || {
      theme: 'dark',
      soundEnabled: true,
      hapticEnabled: true,
      dailyReminder: true,
      reminderTime: '09:00'
    };
  },

  updateSettings(updates) {
    const settings = this.getSettings();
    return this.set(STORAGE_KEYS.SETTINGS, { ...settings, ...updates });
  }
};

// Export
window.EurekaStorage = storage;
window.STORAGE_KEYS = STORAGE_KEYS;
