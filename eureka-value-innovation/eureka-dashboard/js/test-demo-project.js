/**
 * 智能购物推荐系统 - 示范项目
 * 目标：20-35岁都市白领女性，解决鞋服门店购物认知过载问题
 */

const DEMO_PROJECT = {
  project: {
    id: 'demo_shopping_assistant',
    name: '智能购物推荐系统 - 社交链接版',
    brief: '通过智能推荐和社交分享功能，为20-35岁都市白领女性解决鞋服门店购物中的认知过载问题',
    targetUser: '20-35岁都市白领女性，无锻炼习惯，有活力和社交展示需求',
    targetScenario: '鞋服门店购物场景',
    status: 'completed',
    progress: 100,
    createdAt: '2026-03-24T00:00:00.000Z',
    updatedAt: '2026-03-24T00:00:00.000Z'
  },
  reveal: {
    pov: {
      targetUser: '20-35岁的都市白领女性，注重时尚但缺乏运动习惯，希望通过穿搭展现活力，同时需要在社交平台上分享个人形象',
      painPoint: '在鞋服门店面对众多款式时感到认知过载，选择困难，最终导致放弃购物，购物体验满意度差，无法快速找到适合自己风格的商品',
      insight: '通过智能推荐系统结合社交分享功能，可以大幅降低选择焦虑，提升购物效率，同时满足用户的社交展示需求，让购物变得轻松愉悦'
    },
    personas: [
      {
        id: 'persona_001',
        name: '小琳',
        age: '28岁',
        occupation: '市场部专员',
        background: '上海某互联网公司工作，朝九晚五，周末喜欢和朋友逛街，但因为选择困难常常空手而归',
        painPoints: '面对大量商品无法快速筛选，担心买到不适合的衣服，不知道如何搭配，希望有专业人士指导',
        needs: '快速找到适合自己身材和风格的服装，获得搭配建议，能在社交平台分享自己的穿搭',
        scenario: '周末去商场，看到喜欢的品牌进店后发现款式太多，试了几件后觉得都不太合适，最后放弃购买，感到失落'
      },
      {
        id: 'persona_002',
        name: '佳佳',
        age: '32岁',
        occupation: '产品经理',
        background: '北京某科技公司，工作压力大，周末喜欢逛街减压，但时间有限，需要高效购物',
        painPoints: '时间紧张，希望在有限时间内完成购物，但每次都需要花费大量时间挑选，效率低下',
        needs: '快速精准推荐，节省购物时间，一键生成搭配方案，支持在线分享给朋友征求意见',
        scenario: '只有2小时逛街时间，进店后快速浏览但无法决策，最后匆忙购买一件不满意的商品'
      }
    ],
    stakeholders: [
      {
        id: 'stakeholder_001',
        name: '品牌门店经理',
        role: '门店运营者',
        stance: 'support',
        influence: 'high'
      },
      {
        id: 'stakeholder_002',
        name: 'IT技术团队',
        role: '系统开发者',
        stance: 'support',
        influence: 'high'
      },
      {
        id: 'stakeholder_003',
        name: '传统导购',
        role: '线下服务人员',
        stance: 'neutral',
        influence: 'medium'
      },
      {
        id: 'stakeholder_004',
        name: '用户隐私监管',
        role: '合规监督者',
        stance: 'neutral',
        influence: 'high'
      }
    ],
    journeyMap: [
      {
        id: 'journey_001',
        stage: '进店前',
        touchpoint: '社交媒体/好友推荐',
        experience: '用户看到朋友分享的穿搭，产生购物意愿',
        emotion: '期待/兴奋'
      },
      {
        id: 'journey_002',
        stage: '进店',
        touchpoint: '门店入口/扫码登录',
        experience: '使用小程序扫码进入，系统自动识别用户风格偏好',
        emotion: '好奇/新鲜'
      },
      {
        id: 'journey_003',
        stage: '浏览',
        touchpoint: '商品货架/AR试衣镜',
        experience: '系统实时推荐3-5套适合搭配，用户可快速浏览',
        emotion: '惊喜/轻松'
      },
      {
        id: 'journey_004',
        stage: '试穿',
        touchpoint: '试衣间/智能镜子',
        experience: '试穿后镜子显示搭配效果和社交分享按钮',
        emotion: '满意/自信'
      },
      {
        id: 'journey_005',
        stage: '决策',
        touchpoint: '收银台/会员系统',
        experience: '一键购买并获取会员积分，同步到个人档案',
        emotion: '愉悦/成就'
      },
      {
        id: 'journey_006',
        stage: '分享',
        touchpoint: '社交媒体/品牌社群',
        experience: '自动生成穿搭海报，一键分享到朋友圈或小红书',
        emotion: '自豪/期待反馈'
      }
    ]
  },
  inspire: {
    ideas: [
      {
        id: 'idea_001',
        title: 'AI智能试衣搭配顾问',
        description: '基于用户身材数据和风格偏好，利用AI算法实时生成个性化穿搭方案，在门店内通过AR试衣镜展示效果',
        feasibility: 5,
        value: 5,
        innovation: 4,
        totalScore: 14
      },
      {
        id: 'idea_002',
        title: '社交化推荐引擎',
        description: '结合用户社交圈数据（好友购买、点赞、分享），推荐朋友喜欢且适合自己的商品，支持实时征求好友意见',
        feasibility: 4,
        value: 5,
        innovation: 5,
        totalScore: 14
      },
      {
        id: 'idea_003',
        title: '一站式购物+分享平台',
        description: '将门店购物体验与社交媒体无缝连接，从推荐到试穿再到分享，形成完整的社交购物闭环',
        feasibility: 3,
        value: 5,
        innovation: 4,
        totalScore: 12
      }
    ],
    selectedIdeaId: 'idea_001',
    selectedReason: '结合AI技术和用户体验，方案可行性最高，同时兼顾创新性，能够最直接地解决用户的认知过载问题。社交功能可以作为核心模块集成到方案中，形成完整的产品矩阵。'
  },
  shape: {
    concept: {
      name: '智能社交购物助手',
      description: '一个连接智能推荐与社交分享的全链路购物体验系统，帮助20-35岁都市白领女性快速找到适合的商品，并轻松分享到社交平台',
      userValue: '1) 大幅降低选择焦虑，从认知过载到精准推荐\n2) 节省50%以上的购物时间\n3) 获得专业的搭配建议，提升穿搭自信\n4) 满足社交展示需求，一键生成精美穿搭海报',
      techSolution: '1) AI推荐引擎：基于用户画像、购买历史、社交数据的混合推荐算法\n2) AR试衣镜：实时虚拟试穿，展示搭配效果\n3) 社交API：对接微信、小红书等平台，实现一键分享\n4) 会员系统集成：打通门店促销和积分系统\n5) 大数据分析：持续优化推荐准确率',
      businessValue: '1) 提升门店转化率：通过精准推荐降低放弃率\n2) 增加客单价：搭配推荐带动多件购买\n3) 扩大品牌影响力：用户自发分享带来免费曝光\n4) 沉淀私域流量：社交功能助力会员体系运营\n5) 数据价值：用户行为数据为产品迭代提供依据',
      stakeholderValue: '门店经理：提升销售业绩和客户满意度\n技术团队：展示技术实力，积累行业经验\n导购：从被动推销转向主动顾问，提升职业价值\n用户：获得更好的购物体验和社交价值'
    },
    mapValues: {
      market: 9,
      adoption: 8,
      protection: 7
    },
    experienceStory: [
      {
        title: 'Act 1: 发现需求',
        description: '小琳下班后在朋友圈看到朋友分享的一套精致穿搭，产生了购买意愿，但担心自己搭配不好',
        userFeeling: '羡慕、期待又有些犹豫',
        ahaMoment: '系统识别到小琳浏览了朋友的穿搭，立即推送了"相似风格"和"适合你的搭配"两个推荐卡片'
      },
      {
        title: 'Act 2: 接触产品',
        description: '小琳来到商场，在品牌店门口看到了"扫码开启智能购物"的引导，拿出手机扫码登录',
        userFeeling: '好奇、新奇，想知道能带来什么不同',
        ahaMoment: '系统自动识别小琳的身材数据和历史偏好，在首页直接展示了"今日为你精选3套"的个性化推荐'
      },
      {
        title: 'Act 3: 深度使用',
        description: '小琳跟着推荐找到了对应的商品，发现这些衣服确实符合她的风格和身材。她来到AR试衣镜前',
        userFeeling: '惊喜、惊喜，觉得这个系统很懂她',
        ahaMoment: 'AR镜子实时生成了她的试穿效果图，还展示了3种不同风格的搭配方案，并标注了好友的点赞数据'
      },
      {
        title: 'Act 4: 感受价值',
        description: '小琳试穿了推荐的几件衣服，效果很好，只用了30分钟就完成了以往需要2小时的购物',
        userFeeling: '满意、轻松、成就感满满',
        ahaMoment: '系统提示"这套搭配在社交平台获得了85%好评"，并自动生成了精美的穿搭海报供她分享'
      },
      {
        title: 'Act 5: 分享传播',
        description: '小琳一键将穿搭海报分享到朋友圈和小红书，很快收到了朋友的点赞和询问',
        userFeeling: '自豪、开心，觉得自己品味得到了认可',
        ahaMoment: '朋友们纷纷询问"在哪里买的""这个搭配太好看了"，系统自动回复了购买链接，为品牌带来了新客'
      },
      {
        title: 'Act 6: 持续使用',
        description: '小琳成为了品牌的忠实用户，每周都会使用智能购物助手，她甚至开始给朋友推荐这个系统',
        userFeeling: '依赖、信任、成为品牌的"时尚顾问"',
        ahaMoment: '系统根据她的最新数据不断优化推荐，还会提前通知她"你喜欢的上新了""朋友刚买了这件"'
      }
    ]
  },
  exam: {
    ahaEvaluation: {
      description: '当用户在AR试衣镜前看到系统精准推荐的搭配时，感受到"这就是我要的"顿悟，认知从"选择困难"转变为"清晰明了"，社交分享功能满足了她的自我表达需求',
      aha: 9,
      highlight: 8,
      advancement: 8
    },
    elevatorPitch: {
      problem: '20-35岁的都市白领女性在鞋服门店购物时，面对大量商品感到认知过载，选择困难，最终放弃购买，满意度差',
      solution: '我们开发了一个智能社交购物助手，通过AI推荐和社交分享功能，帮助用户快速找到适合的商品并轻松分享',
      targetUser: '目标用户是20-35岁的都市白领女性，她们注重时尚但缺乏时间，希望通过穿搭展现活力并满足社交需求',
      coreValue: '核心价值是降低50%的选择时间，提升90%的购物满意度，同时为品牌带来30%的转化率提升和免费的社交传播',
      callToAction: '我们已经完成了原型开发和用户测试，正在寻求战略合作伙伴共同推向市场。让我们一起用科技赋能零售，为用户带来更好的购物体验！'
    },
    iterationPlan: {
      day30: {
        goal: '完成MVP开发，在1家门店进行封闭测试',
        milestones: '1) 完成AI推荐算法训练和部署\n2) 开发AR试衣镜原型\n3) 对接门店会员系统\n4) 在测试门店完成设备安装\n5) 招募50名种子用户参与测试'
      },
      day60: {
        goal: '优化产品体验，扩展到5家门店进行beta测试',
        milestones: '1) 根据用户反馈优化推荐准确率\n2) 完善社交分享功能\n3) 新增3家测试门店\n4) 累计测试用户达到500人\n5) 收集量化数据和用户反馈'
      },
      day90: {
        goal: '验证商业模式，准备全国推广',
        milestones: '1) 分析用户数据和转化率指标\n2) 验证ROI和商业价值\n3) 制定全国推广计划\n4) 培训运营团队\n5) 准备市场宣传物料'
      }
    },
    businessCanvas: {
      valueProposition: '为用户提供智能、高效的购物体验，满足社交展示需求；为品牌门店提供提升转化率和品牌影响力的数字化解决方案',
      customerSegments: '核心：20-35岁都市白领女性\n次要：对新技术感兴趣的年轻消费者\nB端：中高端服装品牌门店',
      channels: '1) 品牌门店直接合作\n2) 品牌官方小程序入口\n3) 社交平台广告投放\n4) 行业展会和峰会推广',
      customerRelationships: '个性化推荐顾问\n会员权益管理\n社群运营和用户互动\n24小时客服支持',
      revenueStreams: '1) 设备销售和租赁费用\n2) 系统授权和订阅费用\n3) 交易佣金（基于GMV）\n4) 增值服务费用（如数据报告）',
      keyResources: 'AI推荐算法\n技术研发团队\n品牌合作资源\n用户数据平台\n门店网络',
      keyActivities: '算法优化和产品迭代\n品牌合作拓展\n用户运营和数据分析\n市场营销和推广',
      keyPartnerships: '服装品牌方\n社交媒体平台（微信、小红书）\nAR技术供应商\n会员系统服务商',
      costStructure: '技术研发成本\n硬件设备成本\n运营和推广成本\n数据存储和计算成本\n人员薪资'
    }
  }
};

/**
 * 将示范项目加载到 localStorage
 */
function loadDemoProject() {
  const storage = new ProjectStorage();
  
  // 检查是否已存在示范项目
  const existing = storage.getById(DEMO_PROJECT.project.id);
  if (existing) {
    console.log('示范项目已存在，跳过加载');
    return;
  }
  
  // 加载示范项目
  storage.create(DEMO_PROJECT);
  console.log('示范项目加载成功！');
  console.log('项目名称:', DEMO_PROJECT.project.name);
  console.log('项目状态:', DEMO_PROJECT.project.status);
  
  // 刷新页面显示
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

/**
 * 如果在浏览器中运行，自动加载示范项目
 */
if (typeof window !== 'undefined') {
  // 在页面加载后自动加载
  document.addEventListener('DOMContentLoaded', () => {
    // 检查 URL 参数，如果包含 ?load_demo=true 则自动加载
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('load_demo') === 'true') {
      loadDemoProject();
    }
  });
  
  // 暴露到全局，方便控制台调用
  window.loadDemoProject = loadDemoProject;
  window.DEMO_PROJECT = DEMO_PROJECT;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEMO_PROJECT,
    loadDemoProject
  };
}
