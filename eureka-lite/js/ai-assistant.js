/**
 * Eureka Lite - AI Assistant Module
 * Based on user input for normative revision
 */

const AIAssistant = {
  // State
  isOpen: false,
  currentSuggestions: [],

  /**
   * Analyze user input and extract key information
   * @param {string} userInput - User's raw input
   * @param {string} stage - Current stage
   * @param {number} screen - Current screen number
   * @returns {Object} - Analyzed content with key elements
   */
  analyzeInput(userInput, stage, screen) {
    if (!userInput || userInput.trim().length < 5) {
      return { isEmpty: true, elements: {} };
    }

    const text = userInput.trim();
    const elements = {};

    // Extract user/target (用户)
    const userPatterns = [
      /用户[是为是]?(.+?)[，,]/,
      /目标用户[是为是]?(.+?)[，,]/,
      /(.+?)在.+?[使用场景]|使用场景[是为是]?(.+?)[，,]/
    ];
    for (const pattern of userPatterns) {
      const match = text.match(pattern);
      if (match) {
        elements.user = match[1] || match[2] || '';
        break;
      }
    }

    // Extract scene/scenario (场景)
    const scenePatterns = [
      /场景[是为是]?(.+?)[，,]/,
      /使用场景[是为是]?(.+?)[，,]/,
      /在(.+?)时/,
      /(.+?)的情况下/
    ];
    for (const pattern of scenePatterns) {
      const match = text.match(pattern);
      if (match) {
        elements.scene = match[1] || '';
        break;
      }
    }

    // Extract pain point (痛点)
    const painPatterns = [
      /痛点[是为是]?(.+?)[，,。]/,
      /问题是(.+?)[，,。]/,
      /(.+?)困难[，,。]/,
      /(忘记|无法|不能|不会|很难).{0,20}[，,。]/
    ];
    for (const pattern of painPatterns) {
      const match = text.match(pattern);
      if (match) {
        elements.pain = match[1] || match[0] || '';
        break;
      }
    }

    // Extract product/service mentioned
    const productMatch = text.match(/(智能|智能硬件|APP|应用|产品|服务|网站|平台)(.+?)[，,。]/);
    if (productMatch) {
      elements.product = productMatch[2] || productMatch[0];
    }

    return { isEmpty: false, elements, originalText: text };
  },

  /**
   * Generate normative revision based on user input
   * For Reveal T1: Scene Description - normalize to structured format
   */
  reviseRevealT1(userInput, analysis) {
    if (analysis.isEmpty) {
      return null;
    }

    const { elements } = analysis;
    const lines = [];

    // 目标用户
    if (elements.user) {
      lines.push(`【目标用户】${elements.user}`);
    }

    // 使用场景
    if (elements.scene) {
      lines.push(`【使用场景】${elements.scene}`);
    } else if (userInput.includes('课') || userInput.includes('教室')) {
      lines.push('【使用场景】课间休息或课堂上');
    } else if (userInput.includes('宿舍')) {
      lines.push('【使用场景】宿舍日常生活');
    } else if (userInput.includes('通勤') || userInput.includes('办公')) {
      lines.push('【使用场景】通勤途中或办公室');
    }

    // 痛点/挑战
    if (elements.pain) {
      lines.push(`【痛点/挑战】${elements.pain}`);
    } else if (userInput.includes('忘记')) {
      lines.push('【痛点/挑战】用户经常忘记喝水或打水');
    } else if (userInput.includes('麻烦')) {
      lines.push('【痛点/挑战】现有解决方案操作繁琐');
    } else if (userInput.includes('不方便')) {
      lines.push('【痛点/挑战】获取饮品的途径不够便捷');
    }

    // 如果有产品提及
    if (elements.product) {
      lines.push(`【产品/服务】${elements.product}`);
    }

    // 行为描述
    const actionMatch = userInput.match(/(想要|希望|需要)(.+?)[，,。]/);
    if (actionMatch) {
      lines.push(`【用户目标】${actionMatch[2]}`);
    }

    if (lines.length < 2) {
      // 如果提取不到足够信息，返回基于原文的优化版本
      return {
        title: '场景描述（优化版）',
        content: this.normalizeText(userInput)
      };
    }

    return {
      title: '场景描述（规范化改写）',
      content: lines.join('\n')
    };
  },

  /**
   * Normalize text to proper format
   */
  normalizeText(text) {
    // 简单的文本规范化：修正标点、规范格式
    return text
      .replace(/，/g, '，')
      .replace(/。/g, '。')
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Generate normative revision for different stages/screens
   * @param {Object} context - { stage, screen, type }
   * @param {string} userInput - User's original input
   * @returns {Object|null} - Revised content
   */
  generatePrefillContent(context, userInput) {
    const { stage, screen } = context;
    const analysis = this.analyzeInput(userInput, stage, screen);

    // For Reveal T1 (scene description)
    if (stage === 'reveal' && screen === 1) {
      return this.reviseRevealT1(userInput, analysis);
    }

    // For Reveal T2 (journey)
    if (stage === 'reveal' && screen === 2) {
      return this.reviseRevealT2(userInput, analysis);
    }

    // For Reveal T3 (FIND insight) - handled by generateFindStep
    // For Reveal T4 (business goal) - handled by generic revision

    // For Inspire T1 (HMW)
    if (stage === 'inspire' && screen === 1) {
      return this.reviseInspireT1(userInput, analysis);
    }

    // Generic revision for other screens
    if (!analysis.isEmpty) {
      return {
        title: '内容优化',
        content: this.normalizeText(userInput)
      };
    }

    return null;
  },

  /**
   * Generate prefill content for Reveal Screen 1 dialogue inputs
   * Based on project title and category
   * @param {Object} project - Current project
   * @param {string} field - 'targetUser' or 'sceneDesc'
   * @returns {string|null} - Prefill text
   */
  generateRevealPrefill(project, field) {
    if (!project) return null;

    const title = (project.title || project.originalTitle || '').toLowerCase();
    const category = project.category || 'product';

    // Extract keywords from title
    const hasWater = title.includes('水') || title.includes('杯') || title.includes('喝');
    const hasShoe = title.includes('鞋') || title.includes('跑') || title.includes('运动');
    const hasStudent = title.includes('学生') || title.includes('大学') || title.includes('课堂');
    const hasOffice = title.includes('办公') || title.includes('通勤') || title.includes('工作');
    const hasHealth = title.includes('健康') || title.includes('健身') || title.includes('运动');
    const hasElder = title.includes('老人') || title.includes('老年') || title.includes('父母');
    const hasChild = title.includes('儿童') || title.includes('孩子') || title.includes('宝宝');
    const hasPet = title.includes('宠物') || title.includes('狗') || title.includes('猫');

    if (field === 'targetUser') {
      // Generate target user based on keywords and category
      if (hasStudent) return '大学生和研究生';
      if (hasOffice) return '25-40岁的上班族';
      if (hasElder) return '65岁以上的老年人及其家属';
      if (hasChild) return '0-6岁幼儿的父母';
      if (hasPet) return '25-35岁的城市宠物主人';
      if (hasHealth) return '关注健康管理的都市白领';
      if (hasShoe) return '18-35岁的跑步爱好者';
      if (hasWater) return '18-30岁的学生和年轻上班族';

      // Category-based defaults
      const userDefaults = {
        product: '18-35岁的目标用户群体',
        service: '需要便捷服务的中青年用户',
        problem: '受该问题困扰的目标人群',
        explore: '对该领域感兴趣的早期用户'
      };
      return userDefaults[category] || '目标用户群体';
    }

    if (field === 'sceneDesc') {
      // Generate scene description based on keywords and category
      if (hasWater) return '在忙碌的学习或工作中，用户经常忘记喝水，等到口渴时才发现身体已经缺水。现有的水杯无法提醒用户及时补水，导致用户长期处于亚健康状态。';
      if (hasShoe) return '跑步爱好者在选购跑鞋时，面临选择困难：不知道哪款鞋适合自己的脚型和跑步习惯。线下试穿麻烦，线上购买又担心不合脚，退换货成本高。';
      if (hasStudent) return '大学生在课余时间需要管理多项任务：课程作业、社团活动、兼职工作等。现有的工具过于复杂或功能单一，难以高效整合所有事务。';
      if (hasOffice) return '上班族在通勤和工作中，需要处理大量碎片化信息：邮件、消息、待办事项。信息分散在不同平台，难以统一管理，经常遗漏重要事项。';
      if (hasHealth) return '注重健康的人群希望养成规律的运动和饮食习惯，但缺乏有效的监督和提醒机制。独自坚持容易放弃，需要外部激励和同伴支持。';
      if (hasElder) return '老年人独自在家时，子女担心他们的安全和生活状况。现有的沟通方式（电话、视频）不够及时，无法实时了解老人的状态。';
      if (hasChild) return '新手父母在孩子成长过程中，需要记录喂养、睡眠、疫苗接种等信息。纸质记录容易丢失，现有App操作复杂，长辈不会使用。';
      if (hasPet) return '上班族白天外出工作时，担心独自在家的宠物：是否饿了、有没有捣乱、情绪如何。无法实时了解宠物状态，回家后才发现问题。';

      // Category-based defaults
      const sceneDefaults = {
        product: '用户在日常生活中遇到的不便，现有解决方案无法满足其特定需求，导致效率低下或体验不佳。',
        service: '用户在需要服务时，发现流程繁琐、等待时间长、服务质量不稳定，整体体验令人失望。',
        problem: '该问题影响的人群广泛，现有解决方法效果有限，用户迫切需要更高效、更便捷的解决方案。',
        explore: '该方向目前缺乏充分的用户验证，需要深入了解目标群体的真实需求和使用习惯。'
      };
      return sceneDefaults[category] || '用户在相关场景下遇到的具体挑战和需求。';
    }

    return null;
  },

  /**
   * Revise Reveal T2: Journey exploration
   */
  reviseRevealT2(userInput, analysis) {
    if (analysis.isEmpty) return null;

    const { elements } = analysis;
    const steps = [];

    // Generate journey based on context
    if (elements.product || userInput.includes('水杯') || userInput.includes('喝水')) {
      steps.push('【触点1】用户感觉口渴，意识到需要补充水分');
      steps.push('【触点2】查看手机或手表，确认当前时间');
      steps.push('【触点3】决定去打水或使用水杯');
      steps.push('【触点4】寻找水杯或前往饮水处');
      steps.push('【触点5】完成喝水行为');
      steps.push('【断裂点】忘记打水/水杯不在身边');
    } else {
      steps.push('【触点1】用户发现需求');
      steps.push('【触点2】开始寻找解决方案');
      steps.push('【触点3】评估选项');
      steps.push('【触点4】做出选择');
      steps.push('【触点5】使用产品/服务');
      steps.push('【触点6】产生后续行为');
    }

    return {
      title: '用户旅程（规范化）',
      content: steps.join('\n')
    };
  },

  /**
   * Revise Reveal T3: Key findings
   */
  reviseRevealT3(userInput, analysis) {
    if (analysis.isEmpty) return null;

    const { elements } = analysis;
    const findings = [];

    findings.push(`【发现1】${elements.user || '目标用户'}在使用${elements.scene || '该场景'}时，存在未被满足的需求`);

    if (elements.pain) {
      findings.push(`【发现2】"${elements.pain}"是核心痛点`);
    }

    findings.push('【发现3】现有解决方案在[此处补充具体断裂点]存在优化空间');

    return {
      title: '关键发现（规范化）',
      content: findings.join('\n')
    };
  },

  /**
   * Revise Reveal T4: Pain insights (FIND model)
   */
  reviseRevealT4(userInput, analysis) {
    if (analysis.isEmpty) return null;

    const { elements } = analysis;
    const find = [];

    // Facts
    if (elements.user) {
      find.push(`【Facts 事实】${elements.user}在${elements.scene || '该场景'}中，${elements.pain || userInput}`);
    } else {
      find.push(`【Facts 事实】${userInput.substring(0, 100)}`);
    }

    // Interpret
    find.push('【Interpret 解读】这说明用户需要一个更便捷、更不容易被遗忘的补水提醒或管理方案');

    // Need
    find.push('【Need 需求】用户需要的是：1) 及时提醒 2) 便捷获取 3) 不依赖记忆');

    // Design
    find.push('【Design 设计机会】智能提醒 + 便捷取水 + 社交激励 的组合方案');

    return {
      title: 'FIND 洞察（规范化）',
      content: find.join('\n')
    };
  },

  /**
   * Revise Inspire T1: HMW question
   */
  reviseInspireT1(userInput, analysis) {
    if (analysis.isEmpty) return null;

    const { elements } = analysis;
    const user = elements.user || '[目标用户]';
    const scene = elements.scene || '该场景';
    const pain = elements.pain || '存在的痛点';

    const hmws = [
      `我们如何帮助${user}，在${scene}时，能够及时补充水分，不再忘记？`,
      `我们如何帮助${user}，在${scene}时，能够更便捷地获取饮水？`,
      `我们如何帮助${user}，在${scene}时，能够建立健康的饮水习惯？`
    ];

    return {
      title: 'HMW 问题（规范化）',
      content: hmws.join('\n')
    };
  },

  /**
   * Get normative suggestions (not random examples)
   */
  getSuggestions(stage, screen, userInput) {
    const analysis = this.analyzeInput(userInput, stage, screen);

    if (analysis.isEmpty) {
      // Default generic suggestions when no input
      return this.getDefaultSuggestions(stage, screen);
    }

    // Context-aware suggestions based on user input
    return this.getContextAwareSuggestions(stage, screen, analysis);
  },

  /**
   * Get suggestions based on user's actual input
   */
  getContextAwareSuggestions(stage, screen, analysis) {
    const { elements, originalText } = analysis;
    const suggestions = [];

    switch (stage) {
      case 'reveal':
        if (screen === 1) {
          // Scene description - suggest adding missing elements
          if (!elements.user) {
            suggestions.push('✓ 补充：明确目标用户是谁');
          }
          if (!elements.scene) {
            suggestions.push('✓ 补充：具体的使用场景和时间');
          }
          if (!elements.pain) {
            suggestions.push('✓ 补充：用户的痛点或挑战');
          }
          if (elements.user && elements.scene && elements.pain) {
            suggestions.push('✓ 内容已完整，可点击"优化格式"进行规范化');
          }
        } else if (screen === 2) {
          // Journey - suggest structure
          suggestions.push('✓ 基于您的场景，建议按触点顺序描述');
          suggestions.push('✓ 标注关键决策点和情绪变化');
          suggestions.push('✓ 标记可能的体验断裂点');
        } else if (screen === 3) {
          // Key findings
          suggestions.push('✓ 提炼最独特的1-3个发现');
          suggestions.push('✓ 用具体事实或数据支撑');
          suggestions.push('✓ 挑战常规认知');
        } else if (screen === 4) {
          // FIND model
          suggestions.push('✓ Facts：描述观察到的具体事实');
          suggestions.push('✓ Interpret：解读事实背后的原因');
          suggestions.push('✓ Need：挖掘用户真正需要什么');
          suggestions.push('✓ Design：提出设计机会');
        }
        break;

      case 'inspire':
        if (screen === 1) {
          suggestions.push('✓ 用"我们如何帮助..."开头');
          suggestions.push('✓ 明确目标用户');
          suggestions.push('✓ 描述期望的改变');
        }
        break;

      default:
        return this.getDefaultSuggestions(stage, screen);
    }

    return suggestions;
  },

  /**
   * Default suggestions when no user input
   */
  getDefaultSuggestions(stage, screen) {
    const defaults = {
      'reveal-1': ['描述一个具体的用户场景', '聚焦一个痛点时刻', '越具体越好'],
      'reveal-2': ['从用户视角走一遍流程', '标注关键触点', '找到体验断裂点'],
      'reveal-3': ['提炼最独特的发现', '用数据或事实支撑', '挑战常规认知'],
      'reveal-4': ['明确目标用户', '未满足的需求是什么', '情感层面的痛点'],
      'reveal-5': ['涉及哪些利益相关方', '商业价值假设', '与业务目标的关联'],
      'inspire-1': ['用"我们如何帮助..."开头', '明确目标用户和场景', '描述期望的结果'],
      'inspire-3': ['先求量，再求质', '允许疯狂的想法', '组合多个灵感来源'],
    };

    const key = `${stage}-${screen}`;
    return defaults[key] || ['输入内容后，我会给您具体的优化建议'];
  },

  /**
   * Get hint for current stage/screen
   */
  getHint(stage, screen, userInput) {
    const analysis = this.analyzeInput(userInput, stage, screen);

    if (!analysis.isEmpty) {
      switch (stage) {
        case 'reveal':
          if (screen === 1) {
            if (!analysis.elements.user) {
              return '💡 提示：请明确描述"谁"在使用';
            }
            if (!analysis.elements.scene) {
              return '💡 提示：请补充"什么情况下"使用';
            }
            if (!analysis.elements.pain) {
              return '💡 提示：请描述遇到了什么困难';
            }
            return '💡 提示：内容完整，可点击"预填"查看规范化版本';
          }
          break;
      }
    }

    // Default hints
    const hints = {
      'reveal-1': '例如："用户在课间休息时，经常忘记喝水"',
      'reveal-2': '从"第一次接触"到"使用后"完整描述',
      'reveal-3': '发现了什么别人没注意到的？',
      'reveal-4': '用户真正想要的是什么？',
      'inspire-1': '"我们如何帮助忙碌的学生，在课堂上，能够及时补充水分？"',
    };

    return hints[`${stage}-${screen}`] || '💡 输入内容后获得针对性建议';
  },

  // Legacy compatibility - keep old method names working
  getSuggestionsLegacy(stage, screen) {
    return this.getDefaultSuggestions(stage, screen);
  },

  getHintLegacy(stage, screen) {
    const hints = {
      'reveal-1': '例如："用户在结账时发现运费比预期高"',
      'reveal-2': '从"第一次接触"到"使用后"完整描述',
      'reveal-3': '发现了什么别人没注意到的？',
      'reveal-4': '用户真正想要的是什么？',
      'reveal-5': '这个发现对公司意味着什么？',
      'inspire-1': '"我们如何帮助忙碌的用户，在没有时间研究时，能够快速做出明智决定？"',
      'inspire-2': '哪个领域已经解决了类似问题？',
      'inspire-3': '先列出10个想法，再筛选',
      'inspire-4': '哪个想法最能打动你？',
      'inspire-5': '给这个想法起个名字',
    };
    return hints[`${stage}-${screen}`] || '';
  },

  /**
   * Get NCO inspiration based on user's content
   * @param {string} category - Base category
   * @param {number} count - Number of inspirations to return
   * @param {string} userInput - User's original input for context
   */
  getNCOInspiration(category, count = 3, userInput = '') {
    const text = (userInput || '').toLowerCase();

    // Find related inspirations based on user content
    const getRelatedInspirations = () => {
      // Health/wellness related
      if (text.includes('水') || text.includes('喝') || text.includes('健康') || text.includes('提醒')) {
        return [
          {
            type: 'New',
            title: '行为追踪与提醒',
            description: '通过传感器追踪行为，自动触发提醒（如智能水杯记录饮水量）',
            source: '健康科技'
          },
          {
            type: 'Cool',
            title: '游戏化激励',
            description: '将健康行为转化为积分、徽章、排行榜，让喝水变得有趣味',
            source: '健康App'
          },
          {
            type: 'Outsider',
            title: '社交传染',
            description: '让朋友、同学互相提醒、互相激励，形成健康的社交氛围',
            source: '微信运动'
          }
        ];
      }

      // Student/education related
      if (text.includes('学生') || text.includes('大学') || text.includes('课堂') || text.includes('课间') || text.includes('学习')) {
        return [
          {
            type: 'New',
            title: '场景化微服务',
            description: '针对碎片化场景的轻量级服务（如课间快速完成的微任务）',
            source: '教育科技'
          },
          {
            type: 'Cool',
            title: '同伴效应',
            description: '利用学生之间的相互影响，创造正向的学习/生活习惯',
            source: 'Study Together'
          },
          {
            type: 'Outsider',
            title: '错峰设计',
            description: '在用户不需要主动行动时提供服务，减少意志力消耗',
            source: '智能家居'
          }
        ];
      }

      // Office/work related
      if (text.includes('办公') || text.includes('通勤') || text.includes('工作') || text.includes('会议')) {
        return [
          {
            type: 'New',
            title: '情境感知自动化',
            description: '根据用户状态自动触发服务（如进入办公室自动开启待办）',
            source: '智能办公'
          },
          {
            type: 'Cool',
            title: '微打断设计',
            description: '通过极小的打断（如震动、闪光）传递关键信息',
            source: '可穿戴设备'
          },
          {
            type: 'Outsider',
            title: '无意识交互',
            description: '用户无需主动操作，系统自动完成（如自动存档、同步）',
            source: 'iCloud'
          }
        ];
      }

      // Generic product related
      if (category === 'product' || text.includes('产品') || text.includes('硬件')) {
        return [
          {
            type: 'New',
            title: '订阅制思维',
            description: '从一次性购买转向持续服务订阅，创造持续价值',
            source: 'SaaS行业'
          },
          {
            type: 'Cool',
            title: '游戏化反馈',
            description: '让用户行为获得即时、愉悦的反馈，提升参与度',
            source: 'Duolingo'
          },
          {
            type: 'Outsider',
            title: '反向定制',
            description: '让用户参与产品定义过程，提升认同感',
            source: '乐高Ideas'
          }
        ];
      }

      // Generic service related
      if (category === 'service' || text.includes('服务')) {
        return [
          {
            type: 'New',
            title: '情境感知服务',
            description: '根据用户当前状态调整服务内容',
            source: '酒店行业'
          },
          {
            type: 'Cool',
            title: '惊喜元素',
            description: '在预期之外创造超预期体验',
            source: '迪士尼'
          },
          {
            type: 'Outsider',
            title: '社区驱动',
            description: '让用户互相服务、互相帮助',
            source: 'Airbnb社区'
          }
        ];
      }

      // Default
      return [
        {
          type: 'New',
          title: '假设验证',
          description: '先验证最风险的假设，用最小成本测试',
          source: '精益创业'
        },
        {
          type: 'Cool',
          title: '用户共创',
          description: '让用户参与创新过程，共同定义解决方案',
          source: '创新工作坊'
        },
        {
          type: 'Outsider',
          title: '极端用户',
          description: '关注极端用户的极端需求，往往能发现真正机会',
          source: '设计思维'
        }
      ];
    };

    return getRelatedInspirations().slice(0, count);
  },

  /**
   * Generate FIND step content using AI
   * F(事实) → I(解释) → N(需求) → D(凝练)
   * 重写版：基于用户输入做针对性分析，避免万能模板
   * @param {string} stepKey - 'fact', 'interpret', 'need', 'distill'
   * @param {string} userInput - User's input for this step
   * @param {Object} context - Previous steps' data { fact, interpret, need }
   * @returns {Promise<string>} - AI generated content
   */
  /**
   * Generate FIND step content
   * Core principle: ALL outputs <= 100 chars, must reference input
   * F(fact) -> I(interpret) -> N(need) -> D(distill)
   */
  async generateFindStep(stepKey, userInput, context) {
    await new Promise(resolve => setTimeout(resolve, 800));

    const { fact, interpret, need } = context;
    const input = (userInput || '').trim();

    // Extract short phrase from text (up to punctuation or 15 chars)
    const brief = (text) => {
      if (!text) return '';
      const m = text.match(/^(.{2,15}?)[，,。\s]/);
      return m ? m[1].trim() : text.slice(0, 15).trim();
    };

    if (stepKey === 'fact') {
      if (!input) return '请先输入关键事实。';
      const k = brief(input);
      const outputs = [
        `「${k}」说明现有方案只解决了表面，未触及用户真正的痛点。`,
        `为什么「${k}」反复发生？因为设计者假设用户会按理想路径使用，但真实场景充满例外。`,
        `「${k}」背后是系统逻辑与用户心智模型之间的错位——系统要求用户适应它，而非它适应用户。`
      ];
      const idx = input.length % outputs.length;
      return outputs[idx].slice(0, 100);
    }

    if (stepKey === 'interpret') {
      const content = (interpret || input || '').trim();
      if (!content) return '请先完成上一步。';
      const k = brief(content);
      const outputs = [
        `用户真正需要的不是"更多功能"，而是"${k}时能获得恰到好处的支持"。`,
        `深层需求：「${k}」这个问题不再发生，或发生时能被系统自动解决。`,
        `真正需要的是"effortless"的体验——不需学习、不需记忆、不需额外认知负担。`
      ];
      const idx = content.length % outputs.length;
      return outputs[idx].slice(0, 100);
    }

    if (stepKey === 'need') {
      const content = (need || interpret || input || '').trim();
      if (!content) return '请先完成上一步。';
      const fBrief = brief(fact || '');
      const nBrief = brief(need || '');
      const outputs = [
        `核心洞察：当「${fBrief}」时，用户真正需要的是——问题被预见和解决，而非事后补救。`,
        `创新机会：不是做更多功能，而是让「${nBrief || '用户需求'}」在发生前就被系统预判。`,
        `一句话洞察：「${fBrief}」的本质不是技术问题，而是"系统是否真正站在用户视角设计"的问题。`
      ];
      const idx = content.length % outputs.length;
      return outputs[idx].slice(0, 100);
    }

    if (stepKey === 'distill') {
      return '✅ FIND 分析完成！';
    }

    return '请先完成当前步骤。';
  },

  /**
   * Generate HMW suggestions for a given dimension based on POV
   * @param {string} dimKey - amplify | remove | flip | diverge
   * @param {object} pov - { targetUser, sceneChallenge, userProblem, insight, goal }
   * @returns {string[]} Array of HMW suggestion strings
   */
  async generateHmwSuggestions(dimKey, pov) {
    await new Promise(resolve => setTimeout(resolve, 1200));

    const { targetUser, sceneChallenge, userProblem, insight, goal } = pov;
    const u = targetUser || '目标用户';
    const s = sceneChallenge || '特定场景';
    const p = userProblem || '面临问题';
    const i = insight || '核心洞察';

    const templates = {
      amplify: [
        `我们如何才能帮助「${u}」在「${s}」时，把「${p}」转化为积极的体验，让整个过程变得愉悦和有价值？`,
        `我们如何才能让「${u}」在「${s}」中，不仅解决「${p}」，还能获得超出预期的收获？`,
        `我们如何才能将「${p}」这个挑战，变成「${u}」在「${s}」时展现能力和获得成就感的机会？`
      ],
      remove: [
        `我们如何才能彻底消除「${u}」在「${s}」时遇到「${p}」的所有障碍，让整个过程零阻力？`,
        `如果「${p}」这个限制因素完全不存在，「${u}」在「${s}」时会有怎样流畅的体验？`,
        `我们如何才能让「${u}」在「${s}」时，完全不需要思考「${p}」这个问题，它已经被系统默默解决？`
      ],
      flip: [
        `如果我们反过来思考：不是「${u}」去适应「${s}」，而是让「${s}」主动适应「${u}」的需求，会发生什么？`,
        `我们如何才能让「${p}」从「${u}」的负担，翻转成为系统主动服务「${u}」的触发点？`,
        `假设「${i}」这个传统假设是错误的，我们能否用完全相反的方式帮助「${u}」在「${s}」时达成目标？`
      ],
      diverge: [
        `如果我们不受任何技术和成本限制，我们如何才能用最具想象力的方式帮助「${u}」在「${s}」时完美解决「${p}」？`,
        `如果「${u}」在「${s}」时拥有超能力，「${p}」会如何被彻底解决？这个"超能力"能否用产品实现？`,
        `我们如何才能让「${u}」在「${s}」时，通过一种前所未有的、打破行业常规的方式，彻底告别「${p}」？`
      ]
    };

    const outputs = templates[dimKey] || templates.amplify;
    // Use hash of POV content to select consistently
    const hash = (u + s + p).length;
    const count = 2; // Generate 2 suggestions
    const result = [];
    for (let j = 0; j < count; j++) {
      const idx = (hash + j) % outputs.length;
      result.push(outputs[idx]);
    }
    return result;
  },

  async generateStakeholders(project) {
    await new Promise(resolve => setTimeout(resolve, 800));

    const category = project?.category || 'product';
    const title = project?.title || project?.originalTitle || '';
    const sceneData = this._getSceneData(project);
    const findData = this._getFindData(project);

    // Extract topic from project context for contextual generation
    const topic = title || sceneData.targetUser || '该创新方向';
    const scene = sceneData.sceneDesc || '';
    const insight = findData.distill || findData.need || '';

    // Generate contextual stakeholder needs based on project topic
    const generateNeeds = (role) => {
      const baseNeeds = {
        '业务领导': ['战略一致性', '投入产出比', '执行可行性', '速度和结果'],
        '技术专家': ['技术可行性', '系统整合度', '扩展性', '维护成本'],
        '合作伙伴': ['共同价值', '资源投入', '风险分担', '合作条件'],
        '用户代表': ['解决真实痛点', '使用便捷性', '学习成本', '可见价值']
      };
      return baseNeeds[role] || ['核心诉求1', '核心诉求2', '核心诉求3', '核心诉求4'];
    };

    // Contextual stakeholder generation based on project type
    let stakeholderConfigs = [];

    if (category === 'product' || category === 'service') {
      stakeholderConfigs = [
        { icon: '👔', name: '业务领导', defaultScores: [4, 3, 3, 2] },
        { icon: '🔧', name: '技术专家', defaultScores: [3, 4, 3, 2] },
        { icon: '🤝', name: '合作伙伴', defaultScores: [3, 3, 3, 3] },
        { icon: '👤', name: '用户代表', defaultScores: [4, 3, 2, 3] }
      ];
    } else if (category === 'problem') {
      stakeholderConfigs = [
        { icon: '😟', name: '问题承担者', defaultScores: [4, 3, 3, 2] },
        { icon: '💰', name: '决策/资源方', defaultScores: [4, 3, 3, 2] },
        { icon: '🧠', name: '执行团队', defaultScores: [3, 3, 3, 3] },
        { icon: '📊', name: '受影响方', defaultScores: [3, 3, 3, 3] }
      ];
    } else {
      stakeholderConfigs = [
        { icon: '🔍', name: '探索者', defaultScores: [4, 3, 3, 2] },
        { icon: '💰', name: '资助方', defaultScores: [4, 3, 3, 2] },
        { icon: '📊', name: '潜在用户', defaultScores: [3, 3, 3, 3] },
        { icon: '🏢', name: '执行团队', defaultScores: [3, 3, 3, 3] }
      ];
    }

    // Build stakeholders with 12-point needs
    const stakeholders = stakeholderConfigs.map(config => {
      const needs = generateNeeds(config.name).map((label, i) => ({
        label,
        score: config.defaultScores[i] || 3
      }));
      return {
        name: config.name,
        icon: config.icon,
        needs
      };
    });

    return { stakeholders };
  },

  _getSceneData(project) {
    let sceneData = { targetUser: '', sceneDesc: '' };
    if (project?.cards?.scene) {
      try {
        let raw = project.cards.scene;
        if (typeof raw === 'object' && raw !== null && raw.content) raw = raw.content;
        const content = typeof raw === 'string' ? raw : '';
        const targetMatch = content.match(/【目标用户】(.+?)(?=\n【场景描述】|$)/s);
        const sceneMatch = content.match(/【场景描述】(.+?)$/s);
        if (targetMatch) sceneData.targetUser = targetMatch[1].trim();
        if (sceneMatch) sceneData.sceneDesc = sceneMatch[1].trim();
      } catch (e) {}
    }
    return sceneData;
  },

  _getFindData(project) {
    let findData = {};
    if (project?.cards?.findInsight) {
      try {
        let raw = project.cards.findInsight;
        if (typeof raw === 'object' && raw !== null && raw.content) raw = raw.content;
        findData = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {}
    }
    return findData;
  },

  /**
   * Generate consensus suggestions based on stakeholders
   * @param {Object} data - { stakeholders: Array, consensus: string }
   * @returns {string} - consensus suggestion
   */
  async generateStakeholderConsensus(data) {
    await new Promise(resolve => setTimeout(resolve, 800));

    const stakeholders = data.stakeholders || [];
    if (stakeholders.length === 0) return '请先添加利益相关方';

    const names = stakeholders.map(s => s.name).join('、');
    return `基于${names}的需求分析，建议从以下方向寻求共识：

1. **共同目标**：找到各方都关心的核心指标（如用户体验提升、运营成本降低、收入增长）
2. **优先级排序**：先解决"共赢"问题，再处理"零和"冲突
3. **资源分配**：明确各方投入和收益的比例关系
4. **沟通机制**：建立定期同步机制，避免信息不对称

💡 建议下一步：将共识转化为可验证的商业假设，明确"如果...那么..."的逻辑链条。`;
  },

  /**
   * Generate business hypotheses based on FIND insight + stakeholders + project context
   * Market hypothesis format: TAM / SAM / SOM / Competitors / Strategic Alignment / Notes
   * @param {Object} findData - FIND analysis data
   * @param {Object} stakeholderData - stakeholder data
   * @param {Object} project - Current project data
   * @returns {Object} - { tam, sam, som, competitors, alignment, notes }
   */
  async generateBusinessHypothesis(findData, stakeholderData, project) {
    await new Promise(resolve => setTimeout(resolve, 800));

    const sceneData = this._getSceneData(project);
    const insight = findData?.distill || findData?.need || '';
    const fact = findData?.fact || '';
    const targetUser = sceneData.targetUser || '目标用户';
    const scene = sceneData.sceneDesc || '';

    // Extract core problem/pain from fact
    let coreProblem = '';
    const problemMatch = fact.match(/(?:面临|遇到|存在|导致|造成)(.+?)(?:问题|困难|挑战|痛点|不便)/)
      || fact.match(/(?:无法|不能|很难|不容易)(.+?)(?:，|,|。|$)/)
      || fact.match(/(?:花费|消耗|浪费|花了)(.+?)(?:时间|精力|金钱)/);
    if (problemMatch) {
      coreProblem = problemMatch[1] || problemMatch[0];
    }

    // Generate contextual market hypothesis based on project context
    let tam = '', sam = '', som = '', competitors = '', alignment = '', notes = '';

    // Infer domain from fact + scene
    const text = (fact + ' ' + scene + ' ' + targetUser).toLowerCase();

    if (text.includes('老人') || text.includes('老年') || text.includes('养老') || text.includes('银发')) {
      tam = '中国60岁以上老年人口约2.8亿，其中活力老人（60-75岁）约1.5亿，对品质生活服务有持续需求。';
      sam = `聚焦${targetUser}所在的一二线城市，约3000万目标人群，具备一定消费能力和数字产品使用基础。`;
      som = '第一阶段（1-2年）聚焦单城市验证，目标触达1%即30万用户，建立口碑后快速复制。';
      competitors = '现有方案多为传统社区服务或子女代办，缺乏专为老年人设计的友好产品；部分智能设备操作复杂，老人使用门槛高。';
      alignment = '符合国家积极应对人口老龄化战略，契合"银发经济"政策支持方向，易获得政府和社会资源支持。';
    } else if (text.includes('车') || text.includes('驾驶') || text.includes('出行') || text.includes('交通')) {
      tam = '全国机动车保有量超4亿辆，私家车车主约2.5亿人，年新增购车用户超2000万。';
      sam = `聚焦${targetUser}，城市有车一族约8000万人，对智能驾驶辅助和出行效率提升有明确付费意愿。`;
      som = '第一阶段切入高端车型用户（年销约200万辆），目标获取10%份额即20万用户，验证模式后下探中低端市场。';
      competitors = '现有方案以传统导航和辅助驾驶为主，功能割裂、数据不互通；高端方案价格昂贵，中低端市场存在明显空白。';
      alignment = '与智能化、新能源车的行业大趋势一致，符合车企差异化竞争和用户运营转型的战略方向。';
    } else if (text.includes('健康') || text.includes('运动') || text.includes('健身') || text.includes('饮食')) {
      tam = '全国健康意识觉醒人群超5亿，其中愿意为健康管理付费的用户约1.5亿，年市场规模超万亿。';
      sam = `聚焦${targetUser}，对个性化、科学化健康管理有强需求的人群约3000万，具备持续付费能力。`;
      som = '第一年通过内容社区和免费工具获客100万，转化率5%即5万付费用户，验证单位经济模型后规模化投放。';
      competitors = '市场上健康App众多但同质化严重，多为信息聚合缺少个性化干预；竞品用户留存率低，缺少科学闭环。';
      alignment = '符合"健康中国2030"国家战略，契合消费升级和健康生活方式的社会趋势，具备长期价值。';
    } else if (text.includes('教育') || text.includes('学习') || text.includes('培训') || text.includes('知识')) {
      tam = '中国终身学习人群超3亿，包括职场人士、学生、兴趣爱好者，年教育支出持续增长。';
      sam = `聚焦${targetUser}，对高效、实用学习体验有明确需求的细分人群约5000万。`;
      som = '首年通过精准获客获取10万种子用户，付费率20%即2万用户，验证产品价值后拓展企业培训市场。';
      competitors = '在线教育平台众多但多为视频录播，缺少互动和个性化；用户完课率低，学习效果难以衡量。';
      alignment = '符合国家终身学习和职业技能提升政策导向，企业培训预算持续增长，B端+C端双轮驱动。';
    } else {
      // Generic contextual generation based on actual input
      const userGroup = targetUser || '目标用户群体';
      const problemDesc = coreProblem || '待解决的核心问题';

      tam = `基于${userGroup}的广泛需求，全国/全球范围内潜在受影响人群达数千万至数亿级别，涉及${problemDesc}的用户基数庞大。`;
      sam = `聚焦对${problemDesc}有强痛点、且具备一定付费意愿或影响力的${userGroup}，细分人群约数百万至千万级别。`;
      som = '第一阶段通过MVP验证核心假设，目标在1-2年内获取首批1-10万种子用户，建立案例和口碑后快速规模化。';
      competitors = '现有解决方案多为传统方式或通用工具，未能精准解决${userGroup}在${problemDesc}上的深层痛点；市场分散，尚无绝对领先者。';
      alignment = `该方向与用户体验驱动创新的组织目标高度一致，${insight ? '基于' + insight.slice(0, 30) + '...的洞察' : '基于用户真实需求'}，具备清晰的验证路径和可量化的成功指标。`;
    }

    notes = '以上为初步市场假设，后续需通过用户调研、竞品分析和 MVP 测试进一步验证关键假设。建议优先验证 SAM 和 SOM 的可达性。';

    return { tam, sam, som, competitors, alignment, notes };
  }
};

// Export
window.AIAssistant = AIAssistant;
