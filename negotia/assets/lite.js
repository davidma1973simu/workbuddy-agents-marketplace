/* 谈伴 · 引流版（?mode=lite）
   一关、四轮、逐句打分。不加载世界/人设/雷达，主产品 .screen 全部隐藏。

   对手引擎（关键）：不再念写死的台词。
   - 有 Key：每轮实时生成，必须引用你上一句里的具体内容，然后往前压一步。
   - 没 Key：本地意图路由。先判你这句是「问标准 / 让价 / 硬顶 / 讲难处 / 硬解释」，
     再用你的原话回压。两套引擎都保证「他说的话和你说的有关」。 */
(function(){
'use strict';

const Q = new URLSearchParams(location.search);
if(Q.get('mode') !== 'lite') return;

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const BRAND = '<svg viewBox="0 0 96 96" aria-hidden="true">'
  + '<circle cx="48" cy="48" r="22" fill="none" stroke="#0E6B50" stroke-width="10"/>'
  + '<rect x="24" y="7" width="19" height="16" rx="6" fill="#158A68"/>'
  + '<rect x="53" y="73" width="19" height="16" rx="6" fill="#158A68"/></svg>';

/* ================= 两场戏 ================= */
/* press：对手每轮往前压的那一句（固定，保证施压节奏）
   opener：按你的意图开的口子（动态，保证他先接你的话）
   test/better：这一轮在测什么、标准解是什么 */
const SCENES = [
  {
    id:'B02', domain:'客户续约', who:'王总', role:'合作三年的客户采购负责人', mono:'王',
    goal:'把 8% 砍到 5% 以内，且不追加服务',
    opening:'我们合作三年了，实话跟你说，今年这个续约价我们必须下调 8%，不然这个项目我们做不下去。我知道你们有预算压力，但我们也扛不住了。你要是还按去年的价，我们只能考虑不续了。',
    firstTest:'他这一轮在压：这个价必须降',
    firstBetter:'王总，三年合作，你今天把话摊开说，我领这个实诚。8% 我不接——但我想先弄清楚：这 8% 是你们内部的死线，还是你拿回去交差的一个说法？',
    firstStarts:[
      '王总，这话我领，但 8% 我得先问清楚：',
      '我理解你们今年的压力，这个数我没法直接接：',
      '王总，我们先别谈数字，我想知道的是：'
    ],
    starts:[
      ['我换个问法——你内部签不下去，卡在哪一条：','这个我记下来了。那我想先确认：','你难，我懂。可我也得把我们的账摆出来：'],
      ['15% 我不意外，但我想先算一笔账：','换掉我们，你要重新上线一次，这几个月：','这个数我给不了，但我可以换一种给法：'],
      ['我报一个数，但我要换一样东西：','5%，服务范围收到核心模块，这个方案：','我给你一个数，你能不能答应我一件事：']
    ],
    press:[
      '我不跟你绕——今年这个价，你打算怎么让我在内部签得下去？',
      '我直说，另一家比你们低 15%。你给我一个能拿回去的方案，这周就定；给不了，我往下走。',
      '我个人是愿意跟你们继续做的。你给我一个数，我拿去帮你争——但别给一个我自己都不好意思拿出去说的数。'
    ],
    test:[
      '他这一轮在压：这东西到底值不值这个钱',
      '他这一轮在压：不接这个数就换人',
      '他这一轮在压：让你自己报一个数'
    ],
    better:[
      '你说得对，这套东西你太熟了，熟到已经不算加分项了。那我就不夸产品了——你告诉我，如果今年价格不动，你在内部最难解释的是哪一条？',
      '有一家便宜 15%，我不意外，这个市场就是这样。但换掉我们，你要重新走一遍上线和磨合——这笔账你算过要几个月吗？',
      '你愿意帮我去争，这句话我记着。但我不想给一个我们自己扛不住的数。8% 我给不了：5%，加把服务范围收到核心模块，你拿这个去交差够不够？不够你直说，我认。'
    ],
    opener:{
      combo:'你话说得挺客气，可你没回答我。',
      label:'你倒是把我的难处说准了。',
      probe:'你想问我底线在哪，是吧。',
      defend:'「{q}」，这些我听了三年了。',
      hardship:'你难，我知道。',
      hard:'你声调上来了。',
      yield:'「{q}」——你能松这一步，说明前面还有。',
      stall:'拖，没意义。',
      compare:'你拿别家跟我说？',
      share:'你把球又踢回给我了。',
      accept:'你答应得倒爽快。',
      vague:'你这话我没听懂。'
    },
    why:{
      combo:'你先接住了他那句话，再把「按什么算」问回去——他没有被你带着走，这是对的。',
      label:'你接住了他的处境，但停在共情上。他给你的是一个情绪入口，你没把它变成标准或条件，所以这轮他不用回答任何问题。',
      probe:'你问的方向对，但没有先接住他。这句在他听来像审问，不像一个还想合作的人。',
      defend:'你在解释自己值这个价。他一压价你就开始证明，等于当众承认了这个价可以谈。',
      hardship:'你把自己的压力摆了出来。他在谈他的预算，知道你也不好过，只会更确定还能再要。',
      hard:'你顶回去了。声音一高，他反而确信你手里没牌——真有余地的人不用喊。',
      yield:'你让了。数字一出口这轮就结束了，他接下来的动作只有一个：问能不能再低一点。',
      stall:'这句没有给出任何可接的东西，他会把「拖」读成「还有空间」。',
      compare:'你拿别家做参照。这不是在谈价，是在跟他比谁更难——他只会更不想跟你谈。',
      share:'你把决定权分了他一半，这一步是对的。但你只说了「一起定」，没说拿什么换。',
      accept:'你答应了。答应得太快，他就知道这件事可以一直这么推给你。',
      vague:'太短了，什么信息都没给，他只能当你没答。'
    },
    method:{
      name:'不接数字，先接人，再把「按什么算」抢回来',
      steps:[
        { k:'先标注，不辩解', f:'王总，你今天把话摊开说，我领这个实诚。', d:'他一开口就是压力，你先承认这句话本身，不要碰价格。' },
        { k:'把评价换成标准', f:'这 8% 是你们内部的死线，还是你拿回去交差的说法？', d:'「值不值」永远吵不出结果，「按什么算」才有结果。' },
        { k:'说出他没说的那句', f:'你大概觉得我这是想拖着不降价。', d:'他最防的那件事，你先替他说出来，他就不必再防你。' },
        { k:'给他一个说不的出口', f:'如果真谈不下来，该不续就不续，我不缠你。', d:'允许他拒绝，他反而会把真实底线漏出来。' },
        { k:'最后才落数字和条件', f:'5%，服务范围收到核心模块，你拿这个去交差够不够？', d:'数字必须带条件，否则他只会记住数字、忘记条件。' }
      ],
      principle:'数字一进对话，你就只剩「给」和「不给」两个动作。所以前三步做的都不是谈价，是把「按什么算这件事」从你手里抢回来。抢不回来，你报任何数都是输。'
    },
    demo:'王总，三年合作，你今天把话摊开说，我领这个实诚（标注）。我不跟你争 8% 这个数字——我想先弄清楚：这 8% 是你们内部的死线，还是你拿回去交差的一个说法（校准问题）？你大概觉得我这是想拖着不降价（战术同理）。这样，如果今天谈不下来，我们就把账算清楚，该不续就不续，我不缠你（邀「不」）。但在这之前给我十分钟，我把这三年替你们兜过的三次事故摆出来——不是为了压你，是让你在内部有话可说（收口）。',
    retestSay:'我直说吧，我们预算已经砍了，8% 是底线。价格你要是动不了，那就谈点别的——你能给我什么，是我拿回去能交差的？',
    retestBest:'王总，预算砍了这句我信，你也别再替我扛（标注）。8% 我不跟你争——我只问一句：你要拿回去交差的，是一个价格，还是「这笔钱花得值」的一个交代（校准问题）？如果是价格，5% 加范围收窄，我给；如果是交代，我陪你把这三年的账算一遍（收口）。',
    retestNote:'整句没报一个价，也没评一句「值不值」。他做的是把「你要拿什么交差」变成两个人一起算的一笔账——价格从「让不让」变成了「换什么」。你缺的就是最后那一下：把数字和条件绑在一起说。',
    retestChecks:[
      { k:'先接住「预算已经砍了」这句', pass:f => f.label,
        miss:'你直接进了条件。他要先被听见，才听得进你的条件。' },
      { k:'没去争 8% 这个数字', pass:f => !f.defend && !f.hard,
        miss:'你一解释自己值这个价，等于当众承认这个价可以谈。' },
      { k:'把「拿什么交差」问成问题', pass:f => f.ask,
        miss:'你没问他到底要拿什么回去交差，所以你不知道该给什么。' },
      { k:'没当场交出数字或承诺', pass:f => !f.yield && !f.accept,
        miss:'数字或承诺一出口，这轮就结束了——他下一个动作只会是「还能再低点吗」。' }
    ]
  },
  {
    id:'A02', domain:'向上要人', who:'李总', role:'你的直属上级', mono:'李',
    goal:'在 HC 冻结下拿到至少 1 个编制，或砍掉一件事',
    opening:'今年 HC 冻了，一个都批不了。你自己想办法，人手不够就优化流程。',
    firstTest:'他这一轮在压：让你认下「优化流程」',
    firstBetter:'李总，HC 冻了我知道不是你卡我。我想先问一句：这轮是「一个都不批」，还是「批了没预算」？这两种我出的方案完全不一样。',
    firstStarts:[
      '李总，我知道这不是你卡我，我想先问一句：',
      '优化流程我认，但我想先把两件事摆出来：',
      '我理解公司的决定，我想确认一下范围：'
    ],
    starts:[
      ['如果这两件事只能保一件，你希望是哪个：','我可以砍，但砍掉的那块我想让你知道后果：','我列三个选项，你圈一个：'],
      ['方案我出，但我想先跟你定一个前提：','不加人我做过一版，卡在一个地方：','我可以接这道题，但要你帮我一件事：'],
      ['那我按这个思路改，什么时候给你看：','半个也可以，我想先说清楚怎么用：','我们把它定下来，白纸黑字写一句：']
    ],
    press:[
      'HC 我一个都没有。你要人，先告诉我哪些事可以不做。',
      '给我一版方案：不加人，你怎么把那两件事做成。做不到，说明这事本来就不该接。',
      '方案写出来。真能证明不加人做不成，我看看能不能从别处给你匀半个。'
    ],
    test:[
      '他这一轮在压：把「要人」换成「砍事」',
      '他这一轮在压：把这道证明题推给你',
      '他这一轮在压：半个编制换你松口'
    ],
    better:[
      '我不是拿别的团队压你。我想弄清一件事：这轮冻结是「一个都不批」，还是「批了也没预算」？这两种我出的方案完全不一样。',
      '方案我写。但先跟你对齐一个前提：如果方案证明确实做不成，你的结论是「砍掉一件事」，还是「想办法给我人」？',
      '半个我接，但半个解决不了这个项目。我不跟你争一个还是半个——我把两件事的交付时间摆给你，你告诉我砍哪一件。你定，我执行。'
    ],
    opener:{
      combo:'你问得挺准，可这不是我能答的。',
      label:'你理解我，那你就该知道我给不了人。',
      probe:'你问这个，是在给自己找台阶吧。',
      defend:'「{q}」，那是你的事。',
      hardship:'你忙，哪个团队不忙。',
      hard:'你这是在跟我讲条件？',
      yield:'「{q}」——你既然能接，说明还有空间。',
      stall:'拖到下季度，下季度更紧。',
      compare:'你拿别的团队跟我说事？',
      share:'你想让我跟你一起背？',
      accept:'你倒是答应得快。',
      vague:'说清楚点。'
    },
    why:{
      combo:'你先接住了他的处境，再把「冻的是哪一种」问回去——这一问让方案有了前提，是对的。',
      label:'你理解他，但没往前走。理解完了他只会说一句「那你回去干活」。',
      probe:'你问得准，但没先接住他。「这不是我能答的」这种话，你不先垫一句，他只会觉得你在绕。',
      defend:'你在讲理由。他要的是结果，理由是留给自己的，不是讲给他听的。',
      hardship:'你讲自己忙。他手下每个团队都忙，这句话在他那儿没有分量。',
      hard:'你顶回去了。跟上级硬顶，你赢的是一句话，输的是后面所有回合。',
      yield:'你接了。你一接，这道证明题就变成你的了，人也不会来。',
      stall:'没有准话，他默认你会自己消化，这件事就消失了。',
      compare:'你拿别的团队做参照。他听到的不是委屈，是你在给他找麻烦——这一句之后他更不想给你人。',
      share:'你把决定权分了他一半，这一步是对的。但你只说了「一起定」，没说你拿什么换。',
      accept:'你接了这道证明题。接得越干脆，他越确认这事本来就该你一个人扛。',
      vague:'没说清你要人还是要砍事，他只能当你没提。'
    },
    method:{
      name:'不接证明题，先把题目改掉',
      steps:[
        { k:'先把立场和他分开', f:'HC 冻了，我知道这不是你卡我。', d:'他第一反应是防你「来要东西」，先把这个防卸掉。' },
        { k:'问清冻的是哪一种', f:'这轮是「一个都不批」，还是「批了没预算」？', d:'这两种对应的方案完全不同，问清了才有得谈。' },
        { k:'说出他心里的那句话', f:'你可能觉得我这是找借口不接活。', d:'他担心的那件事你替他说了，他才肯听你的方案。' },
        { k:'先把退路封死', f:'如果结论是这事本就该砍，我认，我不再提。', d:'你敢让他砍，他才敢跟你谈人。' },
        { k:'把决定权分他一半', f:'两件事只能保一件的时候，你跟我一起决定砍哪件。', d:'你要的不是人，是别一个人背锅。说清楚这个，他才接。' }
      ],
      principle:'他把「要不要给你人」换成了「你能不能证明做不成」。你一接这道证明题，就已经输了半局——因为证不出来是你的问题，证出来了事也被砍了。真正要做的是把题目改回「这两件事保几件、谁来决定」。'
    },
    demo:'李总，HC 冻了，我知道这不是你卡我（标注）。我不跟你讲别的团队，我只问一句：这轮是「一个都不批」，还是「批了没预算」？这两种我出的方案完全不一样（校准问题）。你可能会觉得我这是在找借口不接活（战术同理）。这样，方案我这周给你，如果你的结论是这事本就该砍，我认，我不再提（邀「不」）。但如果方案证明两件事只能保一件——我要你跟我一起决定砍哪件，别让我一个人背（收口）。',
    retestSay:'我再说明白点：HC 一个都没有。你要人，除非你能证明现在的人手真的做不了。你证明给我看。',
    retestBest:'李总，你这话我听明白了：不是你不给，是这轮真没有（标注）。那我不去证明「做不了」——这个结论我其实证明不出来，你我都清楚（战术同理）。我换个问法：两件事的交付时间我摆出来，只能保一件的时候，这个决定是你定，还是我们一起定（校准问题）？你定，我执行；我只是不想一个人背（收口）。',
    retestNote:'他没有接那道证明题，而是把「保几件、谁来决定」换成了新题目。你一接题，人就永远不用给了——这也是你这一场最大的漏点：不是话不够狠，是题接得太快。',
    retestChecks:[
      { k:'接住「一个都没有」，没当成拒绝', pass:f => f.label,
        miss:'你把这句话当成了拒绝，所以下一句只剩争或者退。' },
      { k:'没接下「你证明给我看」', pass:f => !f.accept && !f.yield,
        miss:'你一答应去写方案，这道证明题就变成你的了——证不出来是你的问题。' },
      { k:'把「谁来决定」问回去', pass:f => f.ask,
        miss:'你没问他砍事由谁定，最后砍哪件还是他一个人说了算。' },
      { k:'没把砍事的锅一个人背下来', pass:f => f.share || f.cond,
        miss:'你没把决定权分他一半，砍哪件最后还是你一个人扛。' }
    ]
  }
];

/* 用户第 i 句（0..3）对应哪套 test/better/起手句 */
function meta(s, i){
  if(i <= 0) return { test:s.firstTest, better:s.firstBetter, starts:s.firstStarts || [] };
  const k = i - 1;
  return {
    test:s.test[k] || s.firstTest,
    better:s.better[k] || s.firstBetter,
    starts:(s.starts && s.starts[k]) || s.firstStarts || []
  };
}

/* ================= 本地判读 ================= */
function classify(t){
  const s = String(t||'').replace(/\s+/g,'');
  const f = {};
  f.label = /我理解|听起来|你说得对|我明白|我知道|我清楚|我听到|看得出来|你在意|你担心|这个难处|我领|我记着|确实挺难|换我也|你的意思是/.test(s);
  f.ask = /[？?]|怎么算|按什么|什么标准|哪一种|哪一个|是不是|能不能|要不要|多少|凭什么|什么条件/.test(s);
  f.cond = /如果|要是|假如|一旦|除非|只要/.test(s);
  f.hard = /不可能|凭什么|你们就是|这不合理|别跟我|我不同意|绝对不|没得谈|那就算了|爱要不要/.test(s);
  f.yield = /可以给|我给你|那就按|我尽量|我去申请|我同意|没问题|听你的|我认了|降到|我们降|给你降|打[九五八七六]折|我让一步/.test(s);
  f.hardship = /我们也不容易|我很难|我为难|我这边也|压力也|成本|预算也|我们也要活|我也难/.test(s);
  f.stall = /再想想|回头|下周|过两天|考虑一下|商量一下|等一等/.test(s);
  f.compare = /别的团队|其他团队|其他部门|别家|人家都|他们都(有|能)|凭什么他们/.test(s);
  f.share = /一起决定|一起定|你定|你决定|共同决定|跟我一起|你跟我/.test(s);
  f.accept = /我先把?(方案|这个|那|它)?.*(写|做|出|弄)|方案我写|我去写|我这就|行，我接|我来做/.test(s);
  f.soft = /^(好吧|行吧|嗯|那行|是)/.test(s) || /好吧|行吧/.test(s);
  f.short = s.length < 8;
  // 否定用法不算「拿别人比较」
  if(f.compare && /(不|不是|不想|不会|没必要).{0,5}(跟|拿|和).{0,6}(别|其他)/.test(s)) f.compare = false;
  return f;
}

function intentOf(f){
  if(f.yield) return 'yield';
  if(f.hard) return 'hard';
  if(f.short) return 'vague';
  if(f.compare) return 'compare';
  if(f.label && f.ask) return 'combo';
  if(f.share) return 'share';
  if(f.label) return 'label';
  if(f.ask) return 'probe';
  if(f.accept) return 'accept';
  if(f.stall) return 'stall';
  if(f.hardship) return 'hardship';
  return 'defend';
}

const SCORE_OF = { combo:5, share:4, label:4, probe:4, compare:2, accept:2,
                   defend:3, hardship:3, stall:2, hard:2, yield:1, vague:2 };

/* 「为什么是这个分」要说清差在哪，而不是把 why 再说一遍 */
function gapFor(n, it){
  if(n >= 5) return '满分：接住人、抢回标准、没让出实质——三样齐了。';
  if(n === 4) return '差的 1 分：他这一轮不用回答你任何问题。';
  if(n === 3) return '差的 2 分：整句没让他回答任何东西。';
  if(n === 2){
    if(it === 'accept') return '差的 3 分：你只给了承诺，没给前提。';
    if(it === 'stall')  return '差的 3 分：你什么都没定，他会当你默认了。';
    if(it === 'vague')  return '差的 3 分：信息太少，等于没回答。';
    return '差的 3 分：只处理了情绪，没处理条件。';
  }
  return '差的 4 分：数字让出去了，条件一个没要。';
}

function localJudge(t, s){
  let f = classify(t);
  const it = intentOf(f);
  let sc = SCORE_OF[it];
  if(f.short) sc = Math.min(sc, 2);
  if(it === 'probe' && f.hard) sc = 2;
  if(f.soft && sc >= 3) sc -= 1;         // 「行吧」「好吧」一开口就先矮了半头
  if(String(t).replace(/\s/g,'').length > 150) sc -= 0.5;
  sc = Math.max(1, Math.min(5, Math.round(sc)));
  return { score:sc, why:s.why[it] || s.why.defend, gap:gapFor(sc, it), intent:it, flags:f };
}

/* 从用户话里挑一段可以回的原文 */
function quote(t){
  const s = String(t||'').replace(/\s+/g,'');
  if(s.length < 10) return '';
  const parts = s.split(/[，。！？；、,.!?;]/).map(x => x.trim()).filter(x => x.length >= 5);
  if(!parts.length) return '';
  parts.sort((a,b) => b.length - a.length);
  const q = parts[0];
  return q.length > 14 ? q.slice(0,14) + '…' : q;
}

/* 本地对手：先接你这句话，再压下一轮 */
function localSay(s, r, t){
  const it = intentOf(classify(t));
  const q = quote(t);
  let op = s.opener[it] || s.opener.defend;
  if(op.indexOf('{q}') >= 0){
    if(!q) op = s.opener.defend.replace('「{q}」，','').replace('「{q}」——','');
    else op = op.replace('{q}', q);
  }
  const press = s.press[r] || '';
  return (op + press).replace(/^「」/,'');
}

/* ================= AI 对手 ================= */
function hasAI(){
  try{
    if(typeof StorageAdapter === 'undefined') return false;
    if(typeof window.callLLM !== 'function') return false;
    const cfg = StorageAdapter.get('settings', null);
    return !!(cfg && cfg.key && cfg.endpoint);
  }catch(e){ return false; }
}

const SYS = '你在一场真实的中国职场谈判里扮演对手。你只输出 JSON，不写任何多余字符。台词必须是能直接说出口的口语，短句，不要旁白，不要书面语。';

function duelPrompt(s, t, prevOpp, r){
  return '你是' + s.who + '（' + s.role + '）。你的目标是：' + s.goal + '。\n'
    + '你刚才说：「' + prevOpp + '」\n'
    + '对方回你：「' + t + '」\n\n'
    + '现在你说下一句。两条硬要求：\n'
    + '1）第一句必须先直接回应他刚才那句话里的具体内容——可以原话引用一小段，不要泛泛而谈。如果他答非所问，就当场点破。\n'
    + '2）然后往前压一步，把压力推回给他，绝不松口、绝不被说服。' + (r >= 2 ? '这是最后一轮，语气要收口、逼他给准话。' : '') + '\n'
    + '只输出 JSON：{"say":"你这句话，40到80字，口语","score":整数1到5,"why":"他这句话做到了什么、漏了什么，30到50字，第二人称","gap":"所以为什么是这个分，25字内"}';
}

function parseJSON(raw){
  const s = String(raw || '').trim();
  let a = s.indexOf('{'), b = s.lastIndexOf('}');
  if(a >= 0 && b > a){ try { return JSON.parse(s.slice(a, b+1)); } catch(e){} }
  const f = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if(f){ try { return JSON.parse(f[1].trim()); } catch(e){} }
  return null;
}

function withTimeout(p, ms){
  return Promise.race([p, new Promise(r => setTimeout(() => r(null), ms))]);
}

async function aiSay(s, t, prevOpp, r){
  if(!hasAI()) return null;
  let raw = null;
  try {
    raw = await withTimeout(window.callLLM(SYS, [{ role:'user', content:duelPrompt(s, t, prevOpp, r) }]), 7000);
  } catch(e){ return null; }
  if(!raw) return null;
  const j = parseJSON(raw);
  if(!j || !j.say || String(j.say).trim().length < 8) return null;
  const sc = Number(j.score);
  return {
    say: String(j.say).trim().slice(0, 160),
    score: isFinite(sc) ? Math.max(1, Math.min(5, Math.round(sc))) : null,
    why: String(j.why || '').trim(),
    gap: String(j.gap || '').trim()
  };
}

/* ================= AI 整体复盘 ================= */
function summaryPrompt(s, turns){
  let log = '场景：' + s.domain + '；对手：' + s.who + '（' + s.role + '）；他的目标：' + s.goal + '\n';
  log += '他开场：「' + s.opening + '」\n';
  turns.forEach(x => {
    log += '他：「' + x.opp + '」\n用户：「' + x.me + '」（本轮得分 ' + x.score + '/5）\n';
  });
  return log + '\n请只输出这个 JSON：\n'
    + '{"pattern":"一句话命名他四句里反复出现的动作，不超过18字，用他自己的动作说话，不要评语",'
    + '"cost":"这个动作在真实场景里的代价，不超过40字，具体到钱/时间/关系",'
    + '"verdict":"点破他这一场真正的病根，第二人称，一句话30字内，不要复述pattern",'
    + '"demo":"一段完整的示范打法，把标注→校准问题→战术同理→邀「不」→收口串成一段能说出口的话，110到160字"}\n'
    + '严格按 5 分制理解分数：5=接住情绪同时把标准问回去；4=接住了但停在情绪；3=讲道理摆事实；2=施压或空转；1=当场退让。';
}

async function aiSummary(s, turns){
  if(!hasAI()) return null;
  let raw = null;
  try {
    raw = await withTimeout(window.callLLM(SYS, [{ role:'user', content:summaryPrompt(s, turns) }]), 10000);
  } catch(e){ return null; }
  if(!raw) return null;
  const j = parseJSON(raw);
  if(!j) return null;
  if(!j.pattern || String(j.pattern).trim().length < 4) return null;
  if(!j.verdict || String(j.verdict).trim().length < 6) return null;
  if(!j.demo || String(j.demo).trim().length < 40) return null;
  return {
    pattern: String(j.pattern).trim().slice(0, 40),
    cost: String(j.cost || '').trim().slice(0, 90) || '代价：他会一直加码，直到你自己报出一个数。',
    verdict: String(j.verdict).trim().slice(0, 60),
    demo: String(j.demo).trim(),
    source: 'ai'
  };
}

/* ================= 本地整体复盘 ================= */
function localSummary(s, turns){
  const scores = turns.map(x => x.score);
  const avg = scores.reduce((a,b) => a + b, 0) / scores.length;
  const good = turns.filter(x => x.score >= 4);
  const yields = turns.filter(x => x.intent === 'yield').length;
  const hards = turns.filter(x => x.intent === 'hard').length;
  const noLabel = turns.filter(x => !x.flags || !x.flags.label).length;
  const noAsk = turns.filter(x => !x.flags || !x.flags.ask).length;

  let pattern, cost, verdict;

  if(yields >= 2){
    pattern = '你一被追问，就自己先把数报出来';
    cost = '代价：你以为让一步能换来成交，实际上你给了他下一刀的落点。';
    verdict = '你太想让这件事谈成了。你一让，他就知道还能再要。';
  } else if(hards >= 2){
    pattern = '你越说越硬，最后变成对着干';
    cost = '代价：场面归你，条件归他——他记住的是你的态度，不是你的要求。';
    verdict = '你把谈判当成了吵架。声音是你的，牌是他的。';
  } else if(avg < 2.6){
    pattern = '四轮下来，你一直在往外掏东西';
    cost = '代价：他每问一句你就交一样，最后他能拿的都拿到了。';
    verdict = '你不是在谈，你是在应付。他一开口，你就开始想办法让他满意。';
  } else if(!good.length){
    pattern = '你每一句都在回答字面问题';
    cost = '代价：他问价你答价，他问人你答人——议题一直在他手上。';
    verdict = '你答得都对，但你答的都不是他真正问的那件事。';
  } else if(avg < 3.7){
    pattern = '你做到过，但只在某一轮';
    cost = '代价：他知道你有一句好话，也知道怎么把你逼回老动作。';
    verdict = '你第 ' + good[0].n + ' 轮那句话就是对的。问题是你只在状态好的时候说得出来，他一压，你就换回去了。';
  } else if(noAsk >= 2){
    pattern = '你接住了人，但没落下条件';
    cost = '代价：谈得客气，结束时没有一个他能照着办的方案。';
    verdict = '人情你给足了，要求你一句没提。客气到最后，等于没谈。';
  } else {
    pattern = '你基本接得住，缺的是最后那一下';
    cost = '代价：每一轮都差半步，四轮下来差出整整一个结果。';
    verdict = '你会接话，也会反问，但你没在最紧的那一下把条件钉死。';
  }

  return { pattern, cost, verdict, demo:s.demo, source:'local' };
}

/* ================= 状态 ================= */
const LOCK = '<div class="lt-lock-i"><svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3" fill="none" stroke="#C3CDC8" stroke-width="1.8"/><rect x="4.5" y="10" width="15" height="10.5" rx="3" fill="none" stroke="#C3CDC8" stroke-width="1.8"/></svg></div>';

const LOCKED = [
  { k:'催款', s:'款在走流程，财务那边卡着，你催我也没用。' },
  { k:'谈加薪', s:'今年预算紧，你这块我记着，等有位置。' },
  { k:'租房', s:'这个价已经是最低了，你不要，有的是人要。' },
  { k:'跨部门要人', s:'排期满了，你去找我们老板压我也没用。' }
];

const V = { step:'pick', si:-1, msgs:[], turns:[], round:0, busy:false,
            report:null, loading:false, retest:null,
            inv:{ n:null, busy:false, err:false }, copied:false };

/* ================= 本地小状态（免费场次 / 已解锁） ================= */
function lsGet(k){ try{ return localStorage.getItem('negotia_lite_' + k); }catch(e){ return null; } }
function lsSet(k, v){ try{ localStorage.setItem('negotia_lite_' + k, v); }catch(e){} }

function freeScene(){
  const v = lsGet('free');
  return v === null || v === '' ? null : Number(v);
}
function isUnlocked(){
  if(lsGet('unlocked') === '1') return true;
  return typeof V.inv.n === 'number' && V.inv.n >= 3;
}
function myGoal(){ return (window.Invite && Invite.GOAL) || 3; }

/* 拉一次真实进度；读不到就置 err，绝不编数字 */
function loadInv(){
  if(!window.Invite) return;
  V.inv.busy = true;
  Invite.progress().then(n => {
    V.inv.busy = false;
    if(n === null){ V.inv.err = true; }
    else { V.inv.err = false; V.inv.n = n; if(n >= myGoal()) lsSet('unlocked', '1'); }
    if(V.step === 'wall') render();
  }).catch(() => {
    V.inv.busy = false; V.inv.err = true;
    if(V.step === 'wall') render();
  });
}

const scene = () => SCENES[V.si];
const other = () => SCENES[(V.si + 1) % 2];

/* ================= 视图 ================= */
function topRight(){ return '<button class="lt-pro" data-act="go">完整版 Pro <span>→</span></button>'; }

function viewPick(){
  return '<div class="lt-top"><div class="lt-brand">' + BRAND + '谈伴<i>Negotia</i></div>' + topRight() + '</div>'
    + '<div class="lt-scroll lt-pk">'
    + '<span class="lt-pk-kicker">对方已经把话说到这份上</span>'
    + '<h1 class="lt-pk-h">你<em>回什么</em>？</h1>'
    + '<p class="lt-pk-sub">选一个离你最近的场面，你如何应对？</p>'
    + '<div class="lt-pk-list">' + SCENES.map((s,i) =>
        '<div class="lt-pk-item" data-act="pick" data-i="' + i + '" role="button">'
        + '<div class="lt-pk-who">' + esc(s.who) + ' · ' + esc(s.role) + '</div>'
        + '<div class="lt-pk-q">「' + esc(s.opening) + '」</div>'
        + '</div>').join('')
    + '</div>'
    + '<div class="lt-pk-foot">'
    + '<p class="lt-pk-vals">谈判<i>·</i>沟通<i>·</i>协作</p>'
    + '<p class="lt-pk-meta">4 轮 · 约 2 分钟 · 结束后逐句给分</p>'
    + '<p class="lt-pk-copy">本产品所使用的全部谈判知识与技能方法，版权归属 Chris Voss（前美国联邦调查局首席国际人质与绑架谈判专家）及其公司 The Black Swan Group。</p>'
    + '</div>'
    + '</div>';
}

function viewChat(){
  const s = scene();
  const dots = [0,1,2,3].map(i =>
    '<i class="' + (i < V.round ? 'on' : (i === V.round ? 'cur' : '')) + '"></i>').join('');
  const msgs = V.msgs.map(m =>
    '<div class="lt-msg ' + (m.who === 'me' ? 'me' : 'opp') + '">' + esc(m.text) + '</div>').join('');
  const typing = V.busy ? '<div class="lt-msg opp typing">…</div>' : '';
  const left = 4 - V.round;
  const swap = V.round === 0
    ? '<button class="lt-tag" data-act="back" style="border:none;cursor:pointer;font-family:var(--font)">换一场</button>'
    : '<span class="lt-tag">' + esc(s.domain) + '</span>';
  const m = meta(s, V.round);
  const starts = (m.starts || []).map((x,j) =>
    '<button class="lt-start" data-act="fill" data-i="' + j + '">' + esc(x) + '</button>').join('');
  const startsBox = starts ? '<div class="lt-starts" id="lt-starts">' + starts + '</div>' : '';
  return '<div class="lt-top"><div class="lt-brand">' + BRAND + '谈伴<i>Negotia</i></div>' + swap + '</div>'
    + '<div class="lt-chat-head"><div class="lt-who-line"><span class="lt-mono">' + esc(s.mono) + '</span>'
    + esc(s.who) + ' · ' + esc(s.role) + '</div><div class="lt-dots">' + dots + '</div></div>'
    + '<div class="lt-scroll" id="lt-stream"><div class="lt-msgs">' + msgs + typing + '</div></div>'
    + '<div class="lt-compose">'
    + startsBox
    + '<textarea class="lt-input" id="lt-in" rows="2" maxlength="300" placeholder="你会怎么回？'
    + (V.round === 0 ? '先说一句能接住他的话。' : '还有 ' + left + ' 轮，他还没松口。') + '"></textarea>'
    + '<button class="lt-send" data-act="send"' + (V.busy ? ' disabled' : '') + '>就这么回</button>'
    + '<p class="lt-hint">' + (V.round === 0 ? '这句话会被逐句评分，写你真正会说的' : (4 - V.round) + ' 轮之后看结果') + '</p>'
    + '</div>';
}

/* 每一轮：默认只露出他那句挑战，点开才展开你的话与拆解 */
function rowHTML(x){
  return '<div class="lt-row">'
    + '<div class="lt-row-head" data-act="fd">'
    + '<div class="lt-row-h"><span class="lt-row-n">第 ' + x.n + ' 轮</span>'
    + '<span class="lt-row-r"><span class="lt-sc s' + x.score + '">' + x.score + ' 分</span>'
    + '<span class="lt-row-i">›</span></span></div>'
    + '<div class="lt-opp"><b>他</b>「' + esc(x.opp) + '」</div>'
    + '</div>'
    + '<div class="lt-row-b">'
    + '<div class="lt-say">「' + esc(x.me) + '」</div>'
    + '<span class="lt-test">' + esc(x.test) + '</span>'
    + '<div class="lt-why"><b>为什么是 ' + x.score + ' 分</b>' + esc(x.why)
    + '<span class="lt-gap">' + esc(x.gap) + '</span></div>'
    + '<div class="lt-better"><span>换一种说法</span>' + esc(x.better) + '</div>'
    + '</div>'
    + '</div>';
}

/* 完整的四轮：像微信那样一条条列出来，默认收起 */
function logHTML(r){
  const rs = r.rounds || [];
  if(!rs.length) return '';
  const flow = rs.map(x =>
      '<div class="lt-log-n">第 ' + x.n + ' 轮</div>'
    + '<div class="lt-msg opp">' + esc(x.opp) + '</div>'
    + '<div class="lt-msg me">' + esc(x.me) + '</div>').join('');
  return '<div class="lt-fold">'
    + '<div class="lt-fold-h" data-act="fd"><span class="lt-fold-t">一次完整的打法</span>'
    + '<span class="lt-fold-m">全部 ' + (rs.length * 2) + ' 句</span>'
    + '<span class="lt-row-i">›</span></div>'
    + '<div class="lt-fold-b"><div class="lt-msgs">' + flow + '</div>'
    + '<p class="lt-log-fine">白的是他说的，绿的是你说的。</p></div>'
    + '</div>';
}

function viewReport(){
  if(V.loading){
    return '<div class="lt-top"><div class="lt-brand">' + BRAND + '谈伴<i>Negotia</i></div>' + topRight() + '</div>'
      + '<div class="lt-scroll" style="display:flex;align-items:center;justify-content:center">'
      + '<p class="lt-sub" style="text-align:center">四轮打完了。<br>正在逐句看你怎么回的…</p></div>';
  }
  const r = V.report;
  return '<div class="lt-top"><div class="lt-brand">' + BRAND + '谈伴<i>Negotia</i></div>'
    + '<span class="lt-tag">' + (r.source === 'ai' ? 'AI 复盘' : '本地复盘（未接 AI）') + '</span></div>'
    + '<div class="lt-scroll">'
    + '<span class="lt-kicker">四轮之后</span>'
    + '<div class="lt-band"><div class="lt-band-k">你在这一场里的模式</div>'
    + '<div class="lt-band-t">' + esc(r.pattern) + '</div>'
    + '<div class="lt-band-d">' + esc(r.cost) + '</div></div>'
    + '<p class="lt-sec">你的问题在哪</p>'
    + '<div class="lt-point">' + esc(r.verdict) + '</div>'
    + '<p class="lt-sec">逐句回看</p>'
    + '<p class="lt-note" style="margin:-4px 0 10px">点任意一轮，展开看这一句差在哪。</p>'
    + '<div class="lt-rows">' + r.rounds.map(rowHTML).join('') + '</div>'
    + logHTML(r)
    + '</div>'
    + '<div class="lt-cta"><button class="lt-send" data-act="retest">换一句，再试一次</button>'
    + '<p class="lt-fine">只回一句，看分数有没有动</p></div>';
}

function viewRetest(){
  const s = scene();
  return '<div class="lt-top"><div class="lt-brand">' + BRAND + '谈伴<i>Negotia</i></div>' + topRight() + '</div>'
    + '<div class="lt-scroll"><span class="lt-kicker">同一场，他换了个说法</span>'
    + '<div class="lt-retest"><div class="lt-retest-k">' + esc(s.who) + '又开口了</div>'
    + '<div class="lt-retest-say">「' + esc(s.retestSay) + '」</div></div>'
    + '<p class="lt-foot">只回一句。这一句不算进刚才的四轮。</p></div>'
    + '<div class="lt-compose">'
    + '<textarea class="lt-input" id="lt-in" rows="2" maxlength="300" placeholder="这一次，你会怎么回？"></textarea>'
    + '<button class="lt-send" data-act="resend">就这一句</button>'
    + '</div>';
}

/* 重测这一句：跟最佳实践逐项对一次，差哪一步说清楚 */
function checkBlock(r){
  const cs = r.checks || [];
  if(!cs.length) return '';
  const miss = cs.filter(x => !x.ok);
  const head = miss.length
    ? (miss.length === cs.length
        ? '最佳实践的四个动作，你一个都没做'
        : '最佳实践有四个动作，你少了 ' + miss.length + ' 个')
    : (r.score >= 5 ? '四个动作全中——这一句已经到最佳实践了'
                    : '动作你都做对了——差的不是结构，是分寸和语气');
  const rows = cs.map(x =>
    '<div class="lt-chk-i ' + (x.ok ? 'ok' : 'no') + '">'
    + '<span class="lt-chk-m">' + (x.ok ? '✓' : '✕') + '</span>'
    + '<div class="lt-chk-b"><div class="lt-chk-k">' + esc(x.k) + '</div>'
    + (x.ok ? '' : '<div class="lt-chk-d">' + esc(x.miss) + '</div>') + '</div></div>').join('');
  return '<p class="lt-sec">和最佳实践差在哪</p>'
    + '<div class="lt-chk"><div class="lt-chk-h">' + esc(head) + '</div>' + rows + '</div>'
    + (r.best ? '<p class="lt-sec">同一句，最佳实践这么回</p>'
      + '<div class="lt-best"><p>' + esc(r.best) + '</p>'
      + '<div class="lt-steps"><b>标注</b><b>校准问题</b><b>战术同理</b><b>邀「不」</b><b>收口</b></div>'
      + (r.bestNote ? '<div class="lt-best-d">' + esc(r.bestNote) + '</div>' : '')
      + '</div>' : '');
}

function viewRetestResult(){
  const r = V.retest;
  const first = r.first;
  const d = r.score - first;
  const line = d > 0 ? '比第一轮高了 <b>' + d + ' 分</b>。这句话你说得出来，说明刚才那四轮你没白看。'
    : (d === 0 ? '和第一轮一样。你已经知道自己该说什么，难的是压力上来的时候还想得起来。'
               : '比第一轮还低。这就是问题所在：看懂了，一被顶住就回去了。');
  const steps = r.method.steps.map((x,i) =>
    '<div class="lt-mstep"><div class="lt-mstep-n">' + (i+1) + '</div><div>'
    + '<div class="lt-mstep-k">' + esc(x.k) + '</div>'
    + '<div class="lt-mstep-f">' + esc(x.f) + '</div>'
    + '<div class="lt-mstep-d">' + esc(x.d) + '</div></div></div>').join('');
  return '<div class="lt-top"><div class="lt-brand">' + BRAND + '谈伴<i>Negotia</i></div>' + topRight() + '</div>'
    + '<div class="lt-scroll">'
    + '<span class="lt-kicker">这一句的分数</span>'
    + '<div class="lt-result"><div class="lt-big s' + r.score + '">' + r.score + '<small> / 5</small></div>'
    + '<div class="lt-delta">第一轮 ' + first + ' 分 → 这一句 ' + r.score + ' 分</div></div>'
    + (r.me ? '<div class="lt-mine"><span>你刚说的</span>「' + esc(r.me) + '」</div>' : '')
    + '<div class="lt-why box"><b>为什么是 ' + r.score + ' 分</b>' + esc(r.why)
    + '<span class="lt-gap">' + esc(r.gap) + '</span></div>'

    + checkBlock(r)

    + '<p class="lt-sec">然后呢</p>'
    + '<div class="lt-verdict" style="margin-top:0">' + line + '</div>'

    + '<p class="lt-sec">你这一场真正的问题</p>'
    + '<div class="lt-band"><div class="lt-band-t" style="margin-top:0">' + esc(r.pattern) + '</div>'
    + '<div class="lt-band-d">' + esc(r.verdict) + '</div></div>'
    + '<div class="lt-verdict" style="margin-top:10px">' + esc(r.cost) + '</div>'

    + '<p class="lt-sec">带走这一套</p>'
    + '<div class="lt-method"><div class="lt-method-h">' + esc(r.method.name) + '</div>'
    + steps
    + '<div class="lt-principle"><b>为什么这套有效　</b>' + esc(r.method.principle) + '</div></div>'
    + '<p class="lt-foot">这一关你打完了。换个对手、换个数字，还是这五步。</p>'
    + '</div>'
    + '<div class="lt-cta"><button class="lt-send" data-act="wall">换个场面，再打一场</button></div>';
}

function viewWall(){
  const o = other();
  const goal = myGoal();
  const n = (typeof V.inv.n === 'number') ? V.inv.n : null;
  const unlocked = isUnlocked();
  const rows = [{ k:o.domain, s:o.opening.slice(0, 22) + '…' }]
    .concat(LOCKED.filter(x => x.k !== o.domain).slice(0, 3));
  const locks = rows.map(x =>
    '<div class="lt-lock"><div><div class="lt-lock-k">' + esc(x.k) + '</div>'
    + '<div class="lt-lock-say">「' + esc(x.s) + '」</div></div>' + LOCK + '</div>').join('');

  const url = (window.Invite && Invite.link()) || '';

  const dots = [0,1,2].map(i =>
    '<i class="' + (n !== null && i < n ? 'on' : '') + '"></i>').join('');

  let inv;
  if(unlocked){
    inv = '<div class="lt-inv lt-inv-ok">'
      + '<span class="lt-inv-k">已经开了</span>'
      + '<p class="lt-inv-p">另一场解锁了。换个对手、换个数字，还是那五步——你自己再走一遍才知道记住没有。</p>'
      + '<button class="lt-send" data-act="openscene">去另一场</button></div>';
  } else {
    const left = n === null ? goal : Math.max(0, goal - n);
    inv = '<div class="lt-inv">'
      + '<div class="lt-inv-top"><span class="lt-inv-k">换一场，要 3 个人</span>'
      + '<span class="lt-inv-n">' + (n === null ? '—' : n) + '<small> / 3</small></span></div>'
      + '<div class="lt-inv-dots">' + dots + '</div>'
      + '<p class="lt-inv-p">把链接发给朋友。他从链接进来、把这一场打完，算一个；同一台设备只算一次。</p>'
      + '<div class="lt-inv-link">' + esc(url) + '</div>'
      + '<button class="lt-send" data-act="copy">' + (V.copied ? '已复制' : '复制我的链接') + '</button>'
      + (V.inv.err || n === null
          ? '<p class="lt-inv-fine">进度暂时读不到，点这里 <b data-act="refresh">再试一次</b></p>'
          : '<p class="lt-inv-fine">还差 ' + left + ' 位 · 满 3 位自动开</p>')
      + '</div>';
  }

  return '<div class="lt-top"><div class="lt-brand">' + BRAND + '谈伴<i>Negotia</i></div>'
    + '<span class="lt-tag">完整版 24 关</span></div>'
    + '<div class="lt-scroll">'
    + '<h1 class="lt-wall-t">这一场，你打完了。<br><em>另一场</em>，还没开。</h1>'
    + inv
    + '<p class="lt-sec">完整版里还有什么</p>'
    + '<div class="lt-locks">' + locks + '</div>'
    + '<p class="lt-sub" style="margin-top:22px">六个维度、二十四个场景，一关一关把洞填上，还能看见自己在变——那是完整版里的事。</p>'
    + '</div>'
    + '<div class="lt-cta"><button class="lt-send" data-act="go">进谈伴，练剩下的 23 关</button>'
    + '<p class="lt-fine">完整版含 24 关 · 六维成长雷达 · 无限对手</p></div>';
}

function render(){
  const box = $('#lite');
  if(!box) return;
  const map = { pick:viewPick, chat:viewChat, report:viewReport, retest:viewRetest, retestResult:viewRetestResult, wall:viewWall };
  box.innerHTML = (map[V.step] || viewPick)();
  const st = $('#lt-stream');
  if(st) st.scrollTop = st.scrollHeight;
}

/* ================= 行为 ================= */
function startScene(i){
  if(!isUnlocked()){
    const f = freeScene();
    if(f !== null && f !== i){
      V.step = 'wall'; render(); loadInv();
      return;
    }
    if(f === null) lsSet('free', String(i));
  }
  V.si = i; V.msgs = [{ who:'opp', text: SCENES[i].opening }];
  V.turns = []; V.round = 0; V.busy = false; V.report = null;
  V.retest = null; V.loading = false;
  V.step = 'chat'; render();
}

function lastOpp(){
  for(let i = V.msgs.length - 1; i >= 0; i--) if(V.msgs[i].who === 'opp') return V.msgs[i].text;
  return '';
}

async function send(){
  const el = $('#lt-in');
  if(!el) return;
  const t = el.value.trim();
  if(!t || V.busy) return;
  const s = scene();
  const r = V.round;                 // 0..3
  const prevOpp = lastOpp();
  const m = meta(s, r);

  V.msgs.push({ who:'me', text:t });
  V.round++;
  V.busy = true;
  render();

  const judge = localJudge(t, s);
  const turn = { n:r+1, opp:prevOpp, me:t, test:m.test, better:m.better,
                 score:judge.score, why:judge.why, gap:judge.gap,
                 intent:judge.intent, flags:judge.flags };
  V.turns.push(turn);

  if(V.round < 4){
    // 有 AI 就让 AI 接；没有/超时就用本地意图路由，同样会引用你说的话
    let ai = null;
    try { ai = await aiSay(s, t, prevOpp, r); } catch(e){ ai = null; }
    if(ai && ai.score){
      turn.score = ai.score;
      if(ai.why) turn.why = ai.why;
      turn.gap = ai.gap || gapFor(ai.score);
    }
    const say = (ai && ai.say) ? ai.say : localSay(s, r, t);
    V.msgs.push({ who:'opp', text:say });
    V.busy = false; render();
  } else {
    V.busy = false;
    /* 打完这一场：如果我是被邀请来的，给邀请人记一个 */
    if(window.Invite) Invite.markDone();
    V.step = 'report'; V.loading = true; render();
    analyze();
  }
}

async function analyze(){
  const s = scene();
  const sum = await aiSummary(s, V.turns).catch(() => null);
  const base = sum || localSummary(s, V.turns);
  V.report = {
    pattern: base.pattern,
    cost: base.cost,
    verdict: base.verdict || localSummary(s, V.turns).verdict,
    demo: base.demo,
    source: base.source,
    rounds: V.turns.map(x => ({
      n:x.n, opp:x.opp, me:x.me, test:x.test, better:x.better,
      score:x.score, why:x.why, gap:x.gap || gapFor(x.score, x.intent)
    }))
  };
  V.loading = false; render();
}

async function resend(){
  const el = $('#lt-in');
  if(!el) return;
  const t = el.value.trim();
  if(!t) return;
  const s = scene();
  const j = localJudge(t, s);
  let sc = j.score, why = j.why, gap = j.gap;

  if(hasAI()){
    V.busy = true; render();
    let raw = null;
    try {
      raw = await withTimeout(window.callLLM(SYS, [{ role:'user', content:
        '场景：' + s.domain + '；对手：' + s.who + '（' + s.role + '）。\n'
        + '对手刚刚说：「' + s.retestSay + '」\n用户回：「' + t + '」\n'
        + '请只输出 JSON：{"score":整数1到5,"why":"他这句做到了什么、漏了什么，30到50字，第二人称","gap":"所以为什么是这个分，25字内"}。\n'
        + '5=接住情绪同时把标准问回去；4=接住了但停在情绪；3=讲道理摆事实；2=施压或空转；1=当场退让。' }]), 7000);
    } catch(e){ raw = null; }
    const p = raw ? parseJSON(raw) : null;
    if(p && isFinite(Number(p.score))){
      sc = Math.max(1, Math.min(5, Math.round(Number(p.score))));
      if(p.why) why = String(p.why).trim();
      gap = p.gap ? String(p.gap).trim() : gapFor(sc);
    }
    V.busy = false;
  }

  /* 逐项比一次：他这句达标了哪几样，差的是哪几样 */
  const checks = (s.retestChecks || []).map(c => ({
    k:c.k, ok:!!c.pass(j.flags), miss:c.miss
  }));

  V.retest = {
    score:sc, why:why, gap:gap, me:t,
    checks:checks, best:s.retestBest || '', bestNote:s.retestNote || '',
    first: V.report.rounds[0].score,
    pattern: V.report.pattern,
    cost: V.report.cost,
    verdict: V.report.verdict,
    method: scene().method
  };
  V.step = 'retestResult'; render();
}

/* 点一句开口：填进输入框，光标落在末尾，等他自己把话补完 */
function fillStart(i, btn){
  const arr = meta(scene(), V.round).starts || [];
  const t = arr[i];
  const el = $('#lt-in');
  if(!t || !el) return;
  el.value = t;
  el.focus();
  try{ el.setSelectionRange(t.length, t.length); }catch(e){}
  requestAnimationFrame(() => { try{ el.setSelectionRange(t.length, t.length); }catch(e){} });
  document.querySelectorAll('.lt-start').forEach(x => x.classList.toggle('on', x === btn));
  const h = document.querySelector('.lt-hint');
  if(h) h.textContent = '只有开头等于没答——接着把话说完。';
  el.dispatchEvent(new Event('input', { bubbles:true }));
}

function copyLink(){
  const t = (window.Invite && Invite.link()) || '';
  if(!t) return;
  const ok = () => {
    V.copied = true; render();
    setTimeout(() => { V.copied = false; if(V.step === 'wall') render(); }, 2000);
  };
  const fallback = () => {
    try{
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta);
      ta.select(); ta.setSelectionRange(0, t.length);
      const done = document.execCommand('copy');
      document.body.removeChild(ta);
      if(done) ok(); else alert('复制不了，请长按上面的链接手动复制');
    }catch(e){ alert('复制不了，请长按上面的链接手动复制'); }
  };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(t).then(ok).catch(fallback);
  } else fallback();
}

function onClick(e){
  const b = e.target.closest('[data-act]');
  if(!b) return;
  const act = b.dataset.act;
  if(act === 'pick') startScene(Number(b.dataset.i));
  else if(act === 'fd'){
    const box = b.closest('.lt-row') || b.closest('.lt-fold');
    if(box) box.classList.toggle('open');
  }
  else if(act === 'fill') fillStart(Number(b.dataset.i), b);
  else if(act === 'send') send();
  else if(act === 'back'){ V.step = 'pick'; render(); }
  else if(act === 'retest'){ V.step = 'retest'; render(); }
  else if(act === 'resend') resend();
  else if(act === 'wall'){ V.step = 'wall'; render(); loadInv(); }
  else if(act === 'copy') copyLink();
  else if(act === 'refresh') loadInv();
  else if(act === 'openscene'){
    const i = V.si >= 0 ? (V.si + 1) % SCENES.length : 0;
    startScene(i);
  }
  else if(act === 'go'){ location.href = './'; }
}

function onKey(e){
  if(e.key === 'Enter' && !e.shiftKey && e.target && e.target.id === 'lt-in'){
    e.preventDefault();
    if(V.step === 'retest') resend(); else send();
  }
}

function boot(){
  document.documentElement.classList.add('lite-mode');
  const box = $('#lite');
  if(!box) return;
  box.classList.remove('hidden');
  box.addEventListener('click', onClick);
  box.addEventListener('keydown', onKey);
  if(window.Invite){ Invite.recordVisit(); loadInv(); }
  render();
  setTimeout(() => document.documentElement.classList.add('lite-mode'), 900);
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
