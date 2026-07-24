/**
 * Eureka Lite - State Management
 * Simple pub/sub state management
 */

// EventEmitter for state changes
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  }
}

// Global state
const AppState = {
  // Current view/page
  currentPage: 'home',

  // Current project
  currentProject: null,
  currentProjectId: null,

  // Current module stage
  currentStage: 'reveal',
  currentScreen: 1,

  // Selected category
  selectedCategory: null,

  // Input value
  inputValue: '',

  // UI states
  drawerOpen: false,
  aiPanelOpen: false,
  modalOpen: false,

  // User data (cached)
  user: null,

  // Events
  events: new EventEmitter(),

  // Initialize
  init() {
    // Load user from storage
    this.user = window.EurekaStorage.getUser();

    // Record daily checkin
    window.EurekaStorage.recordCheckin();

    // Emit ready event
    this.events.emit('stateReady', this.user);
  },

  // Navigation
  navigate(page, options = {}) {
    const prevPage = this.currentPage;
    this.currentPage = page;

    // 切换页面时自动收起左侧抽屉，避免遮挡工作区
    if (this.drawerOpen) {
      this.closeDrawer();
    }

    if (options.projectId) {
      this.currentProjectId = options.projectId;
      this.currentProject = window.EurekaStorage.getProject(options.projectId);
      if (this.currentProject) {
        this.currentStage = this.currentProject.stage;
        this.currentScreen = this.currentProject.currentScreen;
      }
    }

    if (options.category) {
      this.selectedCategory = options.category;
    }

    if (options.stage) {
      this.currentStage = options.stage;
    }

    if (options.screen) {
      this.currentScreen = options.screen;
    }

    this.events.emit('pageChange', { prevPage, currentPage: page, options });
    this.events.emit(`navigate:${page}`, options);
  },

  // Project operations
  setCurrentProject(project) {
    this.currentProject = project;
    this.currentProjectId = project?.id;
    if (project) {
      this.currentStage = project.stage;
      this.currentScreen = project.currentScreen;
    }
    this.events.emit('projectChange', project);
  },

  updateProjectStage(stage, screen = 1) {
    if (!this.currentProjectId) return;

    this.currentStage = stage;
    this.currentScreen = screen;

    window.EurekaStorage.updateProject(this.currentProjectId, {
      stage,
      currentScreen: screen
    });

    // Update current project cache
    this.currentProject = window.EurekaStorage.getProject(this.currentProjectId);

    this.events.emit('stageChange', { stage, screen });
  },

  // UI toggles
  toggleDrawer() {
    this.drawerOpen = !this.drawerOpen;
    this.events.emit('drawerToggle', this.drawerOpen);
  },

  openDrawer() {
    this.drawerOpen = true;
    this.events.emit('drawerToggle', true);
  },

  closeDrawer() {
    this.drawerOpen = false;
    this.events.emit('drawerToggle', false);
  },

  toggleAiPanel() {
    this.aiPanelOpen = !this.aiPanelOpen;
    this.events.emit('aiPanelToggle', this.aiPanelOpen);
  },

  closeAiPanel() {
    this.aiPanelOpen = false;
    this.events.emit('aiPanelToggle', false);
  },

  // Input
  setInput(value) {
    this.inputValue = value;
    this.events.emit('inputChange', value);
  },

  // Category selection
  selectCategory(category) {
    this.selectedCategory = category;
    this.events.emit('categoryChange', category);
  },

  clearCategory() {
    this.selectedCategory = null;
    this.events.emit('categoryChange', null);
  },

  // Refresh user data
  refreshUser() {
    this.user = window.EurekaStorage.getUser();
    this.events.emit('userChange', this.user);
  },

  // Get greeting based on time
  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  },

  // Get user name
  getUserName() {
    return this.user?.name || '朋友';
  }
};

// Export
window.AppState = AppState;
