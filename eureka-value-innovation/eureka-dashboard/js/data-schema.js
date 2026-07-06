/**
 * Eureka 项目数据结构定义
 * 用于 localStorage 存储和表单验证
 */

const EUREKA_DATA_SCHEMA = {
  // 项目元数据
  project: {
    id: "string (UUID)",
    name: "string",
    brief: "string (一句话描述要解决的问题)",
    targetUser: "string (目标用户画像)",
    targetScenario: "string (目标场景)",
    createdAt: "ISO8601 date string",
    updatedAt: "ISO8601 date string",
    status: "enum (draft | in_progress | completed | archived)",
    progress: "number (0-100, 计算字段)"
  },

  // Reveal 阶段产出
  reveal: {
    pov: {
      targetUser: "string (目标用户)",
      painPoint: "string (核心痛点)",
      insight: "string (设计洞见)"
    },
    personas: [
      {
        id: "string",
        name: "string",
        age: "string",
        occupation: "string",
        background: "string",
        painPoints: "string",
        needs: "string",
        scenario: "string"
      }
    ],
    stakeholders: [
      {
        id: "string",
        name: "string",
        role: "string",
        stance: "enum (support | neutral | oppose)",
        influence: "enum (high | medium | low)"
      }
    ],
    journeyMap: [
      {
        id: "string",
        stage: "string (阶段名称)",
        touchpoint: "string (触点)",
        experience: "string (体验描述)",
        emotion: "string (情绪)"
      }
    ]
  },

  // Inspire 阶段产出
  inspire: {
    ideas: [
      {
        id: "string",
        title: "string",
        description: "string",
        feasibility: "number (1-5)",
        value: "number (1-5)",
        innovation: "number (1-5)",
        totalScore: "number (计算字段)"
      }
    ],
    selectedIdeaId: "string (最佳创意ID)",
    selectedReason: "string (选择原因)"
  },

  // Shape 阶段产出
  shape: {
    concept: {
      name: "string",
      description: "string",
      userValue: "string (用户价值)",
      techSolution: "string (技术方案)",
      businessValue: "string (商业价值)",
      stakeholderValue: "string (利益方价值)"
    },
    experienceStory: [
      {
        id: "string",
        act: "number (1-6)",
        title: "string",
        description: "string (场景描述)",
        userFeeling: "string (用户感受)",
        ahaMoment: "string (AHA时刻)"
      }
    ]
  },

  // Exam 阶段产出
  exam: {
    ahaEvaluation: {
      description: "string (AHA时刻描述)",
      userValue: "number (1-10)",
      businessValue: "number (1-10)",
      techValue: "number (1-10)",
      stakeholderValue: "number (1-10)"
    },
    elevatorPitch: {
      problem: "string (问题陈述)",
      solution: "string (解决方案)",
      targetUser: "string (目标用户)",
      coreValue: "string (核心价值)",
      callToAction: "string (行动号召)"
    },
    iterationPlan: {
      day30: {
        goal: "string",
        milestones: "string"
      },
      day60: {
        goal: "string",
        milestones: "string"
      },
      day90: {
        goal: "string",
        milestones: "string"
      }
    },
    businessCanvas: {
      valueProposition: "string (价值主张)",
      customerSegments: "string (客户细分)",
      channels: "string (渠道通路)",
      customerRelationships: "string (客户关系)",
      revenueStreams: "string (收入来源)",
      keyResources: "string (核心资源)",
      keyActivities: "string (关键业务)",
      keyPartnerships: "string (重要合作)",
      costStructure: "string (成本结构)"
    }
  }
};

/**
 * 生成空项目模板
 */
function createEmptyProject() {
  const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
  const now = new Date().toISOString();

  return {
    project: {
      id,
      name: "",
      brief: "",
      targetUser: "",
      targetScenario: "",
      createdAt: now,
      updatedAt: now,
      status: "draft",
      progress: 0
    },
    reveal: {
      pov: { targetUser: "", painPoint: "", insight: "" },
      personas: [],
      stakeholders: [],
      journeyMap: []
    },
    inspire: {
      ideas: [],
      selectedIdeaId: "",
      selectedReason: ""
    },
    shape: {
      concept: {
        name: "",
        description: "",
        userValue: "",
        techSolution: "",
        businessValue: "",
        stakeholderValue: ""
      },
      experienceStory: Array.from({ length: 6 }, (_, i) => ({
        id: `act_${i + 1}`,
        act: i + 1,
        title: "",
        description: "",
        userFeeling: "",
        ahaMoment: ""
      }))
    },
    exam: {
      ahaEvaluation: {
        description: "",
        userValue: 0,
        businessValue: 0,
        techValue: 0,
        stakeholderValue: 0
      },
      elevatorPitch: {
        problem: "",
        solution: "",
        targetUser: "",
        coreValue: "",
        callToAction: ""
      },
      iterationPlan: {
        day30: { goal: "", milestones: "" },
        day60: { goal: "", milestones: "" },
        day90: { goal: "", milestones: "" }
      },
      businessCanvas: {
        valueProposition: "",
        customerSegments: "",
        channels: "",
        customerRelationships: "",
        revenueStreams: "",
        keyResources: "",
        keyActivities: "",
        keyPartnerships: "",
        costStructure: ""
      }
    }
  };
}

/**
 * 计算项目进度
 */
function calculateProgress(projectData) {
  const weights = {
    reveal: 0.25,
    inspire: 0.25,
    shape: 0.25,
    exam: 0.25
  };

  const revealScore = calculatePhaseScore(projectData.reveal);
  const inspireScore = calculatePhaseScore(projectData.inspire);
  const shapeScore = calculatePhaseScore(projectData.shape);
  const examScore = calculatePhaseScore(projectData.exam);

  const progress = Math.round(
    (revealScore * weights.reveal +
     inspireScore * weights.inspire +
     shapeScore * weights.shape +
     examScore * weights.exam) * 100
  );

  return progress;
}

function calculatePhaseScore(phase) {
  // 根据每个阶段的关键字段是否填写来评分
  let total = 0;
  let filled = 0;

  if (phase.pov && (phase.pov.targetUser || phase.pov.painPoint || phase.pov.insight)) {
    total += 1;
    if (phase.pov.targetUser && phase.pov.painPoint && phase.pov.insight) filled += 1;
  }

  if (phase.personas && phase.personas.length > 0) {
    total += 1;
    if (phase.personas.some(p => p.name && p.painPoints)) filled += 1;
  }

  if (phase.ideas && phase.ideas.length >= 3) {
    total += 1;
    if (phase.selectedIdeaId) filled += 1;
  }

  if (phase.concept && (phase.concept.name || phase.concept.description)) {
    total += 1;
    if (phase.concept.name && phase.concept.description) filled += 1;
  }

  if (phase.elevatorPitch && phase.elevatorPitch.problem) {
    total += 1;
    if (phase.elevatorPitch.coreValue) filled += 1;
  }

  return total > 0 ? filled / total : 0;
}

/**
 * 验证项目数据
 */
function validateProject(projectData) {
  const errors = [];

  if (!projectData.project.name) {
    errors.push("项目名称不能为空");
  }

  if (!projectData.project.brief) {
    errors.push("项目简报不能为空");
  }

  return errors;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EUREKA_DATA_SCHEMA,
    createEmptyProject,
    calculateProgress,
    validateProject
  };
}
