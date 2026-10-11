export const demoSeries = [
  {id:'forest',name:'山风与小站',genre:'治愈 · 奇幻',description:'一座被遗忘的小站，一群不愿散场的朋友。',image:'/assets/console/forest.png',chapterCount:8,current:'第 09 话 · 下一站，春天',status:'连载中',updated:'今天',chapters:[{title:'下一站，春天',state:'待审阅',pages:6},{title:'最后一班列车',state:'已完成',pages:6},{title:'山风带来的信',state:'已完成',pages:5}]},
  {id:'city',name:'今天也要好好吃饭',genre:'日常 · 轻喜剧',description:'深夜的小食堂，装得下城市里所有的小心事。',image:'/assets/console/city.png',chapterCount:12,current:'第 13 话 · 两碗面的距离',status:'连载中',updated:'昨天',chapters:[{title:'两碗面的距离',state:'剧情草稿',pages:4},{title:'不加葱的常客',state:'已完成',pages:4},{title:'雨天的特别菜单',state:'已完成',pages:4}]},
  {id:'sea',name:'灯塔以北',genre:'冒险 · 成长',description:'沿着一张旧海图，寻找世界尽头的那束光。',image:'/assets/console/sea.png',chapterCount:3,current:'第 04 话 · 无人岛的来信',status:'筹备下一章',updated:'3 天前',chapters:[{title:'无人岛的来信',state:'待设计',pages:6},{title:'潮汐之间',state:'已完成',pages:6},{title:'出发的那一天',state:'已完成',pages:5}]}
];
export const principles = [
  {id:'story',title:'故事与人物',icon:'book',summary:'让选择推动故事，让行动体现人物。',body:'剧情设计需要检查可见的因果、人物目标、知识边界、关系与能动性。把剧情事实和画面的实现方式分开，先明确人物的选择与代价，再进入分镜。',checks:['每个关键转折都有明确的原因与结果','人物行为符合已确认的目标、关系和世界规则','区分当前事实与仍待讨论的创作问题']},
  {id:'panels',title:'分镜与阅读节奏',icon:'panels',summary:'一个格子，一个主要瞬间。',body:'从章节卡到场景、页面与分格逐层细化。每个普通分格明确一个主要可见瞬间、叙事功能、焦点、表演与文字，并检查阅读顺序、对白空间和翻页节奏。',checks:['单格只承载一个主要可见瞬间','检查对白空间、阅读顺序与格间转换','区分剧情设计与最终视觉实现']},
  {id:'continuity',title:'连续性与系列记忆',icon:'layers',summary:'下一章，从上一章真正发生的地方开始。',body:'设计连续剧情前，复核系列主线、当前状态、最近正史、人物关系与未完伏笔。漫画视觉检查动作轴、视线、道具、衣着、伤势和光线的连续性。',checks:['复核时间线、人物知识与未完成的承诺','沿用已确认的人物视觉锚点','生成图中的偶然细节不能自动成为正史']},
  {id:'review',title:'创作审阅与正史边界',icon:'check',summary:'AI 提议，创作者决定。',body:'候选剧情保持 draft。只有创作者明确确认或直接命令修改 Wiki，才更新正史。人工编辑的 production/review.json 是制作草稿，不是自动写回知识库的渠道。',checks:['展示草稿、已确认与已废弃的状态','明确批准前不更新系列正史','审阅时展示适用原则、覆盖项及原因']},
  {id:'preferences',title:'原则与创作偏好',icon:'sliders',summary:'完整复审规则，而不是机械套用。',body:'正式创作前需完整读取当前有效全局原则、全局偏好与目标系列偏好。对每条规则说明采用、不适用、覆盖或禁止误用；采用的规则必须落实到具体设计决定。',checks:['本轮明确指令优先于系列约束与全局规则','候选偏好仅作为待验证假设','每条采用的规则都能在产物中找到具体证据']},
  {id:'feedback',title:'反馈与版本追溯',icon:'message',summary:'保留修改的理由，也保留创作者的选择。',body:'把反馈拆分为观察到的症状、期望结果、推测原因与提出的修法。局部修改不直接升级为全局偏好；已确认的 Wiki 更新遵循先追加决策证据，再同步主要产物与下游状态的流程。',checks:['区分事实纠正、质量诊断与局部选择','持久偏好保留证据、范围与适用条件','旧证据不删除、不静默覆盖冲突']}
];
export const icons = {
 home:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 book:'<path d="M4 3h6a3 3 0 0 1 3 3v15a4 4 0 0 0-4-2H3V4a1 1 0 0 1 1-1Z"/><path d="M13 6a3 3 0 0 1 3-3h5v16h-5a3 3 0 0 0-3 2"/>',
 layers:'<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
 panels:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 11h18M12 11v10"/>',
 spark:'<path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3ZM19 2v4M17 4h4"/>',
 folder:'<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>',
 arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 settings:'<path d="m9 3-1 3-3 1-2 3 2 3-1 3 3 2 3-1 3 2 3-2 1-3 3-1v-4l-3-2-1-3-4-1Z"/><circle cx="12" cy="12" r="3"/>',
 sliders:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>',
 check:'<path d="m8 12 3 3 5-6"/><rect x="3" y="3" width="18" height="18" rx="4"/>',
 message:'<path d="M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4Z"/><path d="M8 9h8M8 13h5"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 external:'<path d="M14 3h7v7M21 3 10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',
 edit:'<path d="m16 3 5 5-12 12-6 1 1-6L16 3ZM13 6l5 5"/>'
};
export const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.book}</svg>`;
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
