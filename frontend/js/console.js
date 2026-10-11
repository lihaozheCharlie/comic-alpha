import {demoSeries, principles, icon, escapeHTML as e} from './consoleData.js';
import {homeView, seriesView, detailView, principlesView, historyView, singleView, workflowView, notice} from './consoleViews.js';

const state = {
  series: structuredClone(demoSeries), route:'home', selected:'forest', search:'', filter:'all', sort:'recent', detailTab:'chapters', principleSearch:'',
  singlePrompt:'', singleStyle:'日系治愈', singlePages:3, workflow:null
};
const main=document.querySelector('#main');
const modal=document.querySelector('#modal');
const selectedSeries=()=>state.series.find(s=>s.id===state.selected)||state.series[0];
const navigation=[['home','home','创作台'],['series','layers','漫画系列'],['single','spark','单篇创作'],['history','folder','漫画档案'],['principles','book','创作原则']];
let toastTimer;
function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3500);}
function openModal(title,html){document.querySelector('#modal-title').textContent=title;document.querySelector('#modal-content').innerHTML=html;if(!modal.open)modal.showModal();}
function closeModal(){modal.close();}
function navigate(route,id){closeModal();location.hash=id?`${route}/${encodeURIComponent(id)}`:route;document.querySelector('.sidebar').classList.remove('mobile-open');}
function render(){
  const active=state.route==='detail'||state.route==='workflow'?(state.workflow?.mode==='single'&&state.route==='workflow'?'single':'series'):state.route;
  document.querySelector('#navigation').innerHTML=`<div class="nav-label">创作工作台</div>${navigation.map(([id,ic,label])=>`<a class="nav-item ${active===id?'active':''}" href="#${id}" ${active===id?'aria-current="page"':''}>${icon(ic)}<span>${label}</span>${id==='series'?`<span class="count">${state.series.length}</span>`:''}</a>`).join('')}`;
  document.querySelector('#series-navigation').innerHTML=state.series.map(s=>`<button class="series-nav-item" data-action="open-series" data-id="${e(s.id)}"><span class="series-dot"></span>${e(s.name)}</button>`).join('');
  const labels={home:'创作台',series:'漫画系列',single:'单篇创作',history:'漫画档案',principles:'创作原则',detail:selectedSeries().name,workflow:state.workflow?.mode==='single'?'单篇创作':'系列创作'};
  document.querySelector('#page-label').textContent=labels[state.route]||'创作台';
  const views={home:()=>homeView(state),series:()=>seriesView(state),detail:()=>detailView(state,selectedSeries()),principles:()=>principlesView(state),history:()=>historyView(state),single:()=>singleView(state),workflow:()=>workflowView(state,selectedSeries())};
  main.innerHTML=(views[state.route]||views.home)();
  main.classList.remove('fade-in');void main.offsetWidth;main.classList.add('fade-in');
}
function readRoute(){
  const [route,rawId]=location.hash.slice(1).split('/');
  state.route=['home','series','single','history','principles','detail','workflow'].includes(route)?route:'home';
  if(rawId){let id;try{id=decodeURIComponent(rawId);}catch{id='forest';}if(state.series.some(s=>s.id===id))state.selected=id;else state.route='series';}
  if(state.route==='workflow'&&!state.workflow)prepareWorkflow(state.selected);
  render();window.scrollTo({top:0,behavior:'instant'});
}
function prepareWorkflow(id,mode='series'){
  const key=mode==='single'?'single':id;
  if(state.workflow?.key===key)return;
  state.selected=id||state.selected;
  state.workflow={key,mode,step:mode==='single'?1:0,maxStep:mode==='single'?1:0,rulesRead:false,direction:mode==='single'?state.singlePrompt:'',count:mode==='single'?1:3,pages:mode==='single'?state.singlePages:6,outlined:false,outlines:[],reviewIndex:0,generated:false};
}
function startSeries(id){prepareWorkflow(id);navigate('workflow',id);if(state.route==='workflow')render();}
function invalidateApproval(){const w=state.workflow;if(!w)return;w.generated=false;w.outlines.forEach(o=>o.approved=false);w.maxStep=Math.min(w.maxStep,2);}
function drawOutlines(){
  const w=state.workflow;
  if(!w.direction.trim()){toast('请先写下本次创作方向。');document.querySelector('#story-direction').focus();return;}
  const s=selectedSeries();
  w.outlines=Array.from({length:w.count},(_,i)=>({title:w.mode==='single'?'我的独立故事':i===0?s.chapters[0].title:i===1?'下一章：故事的转折':`后续章节 ${i+1}`,summary:i===0?w.direction:'待设计：承接上一章的结果，补充人物目标、关键选择及章末悬念。',script:'',notes:'',approved:false}));
  w.outlined=true;w.generated=false;w.maxStep=1;w.reviewIndex=0;render();toast('已展开可编辑的剧情卡片。这是模板，不是 AI 生成。');
}
function nextStep(){
  const w=state.workflow;
  if(w.step===0&&!w.rulesRead)return;
  if(w.step===1){
    if(!w.outlined||!w.outlines.length)return;
    if(w.outlines.some(o=>!o.title.trim()||!o.summary.trim())){toast('请为每一章补充标题和剧情目标。');return;}
    w.outlines.forEach(o=>{if(!o.script)o.script=`章节目标：${o.summary}\n\n${Array.from({length:w.pages},(_,i)=>`第 ${i+1} 页\n画面与动作：待人工补充\n对白：待人工补充\n连续性备注：待检查`).join('\n\n')}`;});
  }
  if(w.step===2&&!w.outlines.every(o=>o.approved))return;
  w.step=Math.min(w.step+1,3);w.maxStep=Math.max(w.maxStep,w.step);render();window.scrollTo({top:0,behavior:'smooth'});
}
function createChoices(){openModal('从哪种故事开始？',`<p>长期的系列，或突然闪现的灵感。选择适合你的创作方式。</p><div class="modal-choices"><button class="choice-button" data-action="choose-series"><span class="creation-icon">${icon('layers')}</span><div><h3>系列创作</h3><p>带入历史与人物设定，设计连续剧情。</p></div>${icon('arrow')}</button><button class="choice-button" data-action="single"><span class="creation-icon">${icon('spark')}</span><div><h3>单篇创作</h3><p>从一个想法出发，创作独立漫画。</p></div>${icon('arrow')}</button></div>`);}
function chooseSeries(){openModal('选择要继续的故事',`<p>选择已有系列，或先创建一个新的演示系列。</p><div class="modal-choices">${state.series.map(s=>`<button class="choice-button" data-action="start-series" data-id="${e(s.id)}"><img src="${e(s.image)}" alt="" width="72" height="54" style="object-fit:cover;border-radius:6px"><div><h3>${e(s.name)}</h3><p>${e(s.current)}</p></div>${icon('arrow')}</button>`).join('')}</div><button class="button" data-action="new-series">＋ 新建一个系列</button>`);}
function principleModal(id){const p=principles.find(x=>x.id===id);if(!p)return;openModal(p.title,`<span class="eyebrow">COMICBRAIN / 操作规范摘要</span><p>${e(p.body)}</p><h3>在创作中如何应用</h3><ul class="bullet-list">${p.checks.map(c=>`<li>${e(c)}</li>`).join('')}</ul>${notice('依据：仓库内 comic-wiki、comic-feedback 技能及创作规则预检协议。当前私有 Wiki 原则目录未接入。')}<div class="modal-actions"><button class="button primary" data-action="close-modal">已了解</button></div>`);}
function newSeriesModal(){openModal('给一个新故事留个位置',`<p>创建演示系列后，可以体验连续剧情设计。这里只保留当前会话，不创建真实 Wiki 系列。</p><form id="new-series-form" class="form-stack"><label>系列名称<input name="name" maxlength="40" required placeholder="你的故事叫什么？"></label><label>一句话介绍<textarea name="description" rows="3" maxlength="180" required placeholder="故事发生在哪里？谁想要什么？"></textarea></label><label>类型<select name="genre"><option>治愈 · 奇幻</option><option>日常 · 轻喜剧</option><option>冒险 · 成长</option></select></label><div class="modal-actions"><button type="button" class="button" data-action="close-modal">取消</button><button class="button primary" type="submit">创建演示系列</button></div></form>`);}
function settingsModal(){openModal('创作空间设置',`<div class="form-stack"><h3>当前模式</h3><span class="tag">交互预览 · 不调用 AI</span><p>系列、章节、编辑和审阅状态只用于本次体验。刷新页面会重置演示修改；可导出草稿保留你的编辑。</p><h3>ComicBrain 数据</h3><p>正式版本将通过受保护的后端读取系列目录、创作原则与历史漫画。此原型不公开私有 Wiki，也不自动更新正史。</p><h3>已有生成能力</h3><p>原版生成器完整保留。文本和图片的模型配置继续在原版内管理，本轮不修改现有凭据与存储方式。</p><a class="button primary" href="/frontend/classic.html">打开原版生成器 ${icon('external')}</a></div>`);}
function viewer(id,chapter){const s=state.series.find(x=>x.id===id)||selectedSeries();const ch=s.chapters[Number(chapter)]||s.chapters[1]||s.chapters[0];openModal(`${s.name} / ${ch.title}`,`${notice('历史漫画查看交互示例。下面是仓库已有的三页漫画样张，并非本系列的真实作品。')}<img class="viewer-image" src="/assets/examples/american-comic-sample.png" alt="已有三页美式漫画样张，展示分格与完整漫画页面"><div class="modal-actions"><button class="button" data-action="open-series" data-id="${e(s.id)}">返回系列</button><button class="button primary" data-action="close-modal">关闭预览</button></div>`);}
function exportDraft(){
  const w=state.workflow;if(!w)return;
  const data={status:'draft',source:'interaction-prototype',canonical:false,series:w.mode==='single'?null:selectedSeries().name,direction:w.direction,pagesPerChapter:w.pages,chapters:w.outlines};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='comicperfect-preview-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已导出制作草稿；未写回 ComicBrain。');
}
document.addEventListener('click',event=>{
  const el=event.target.closest('[data-action]');if(!el||el.disabled)return;
  const {action,id,chapter}=el.dataset;
  switch(action){
    case 'home':case 'series':case 'single':case 'history':case 'principles':navigate(action);break;
    case 'create':createChoices();break;
    case 'choose-series':chooseSeries();break;
    case 'new-series':newSeriesModal();break;
    case 'close-modal':closeModal();break;
    case 'settings':settingsModal();break;
    case 'mobile-menu':document.querySelector('.sidebar').classList.toggle('mobile-open');break;
    case 'open-series':state.detailTab='chapters';navigate('detail',id);break;
    case 'start-series':startSeries(id);break;
    case 'series-menu':openModal('系列操作',`<div class="modal-choices"><button class="choice-button" data-action="open-series" data-id="${e(id)}">${icon('book')} 浏览章节与历史漫画 ${icon('arrow')}</button><button class="choice-button" data-action="start-series" data-id="${e(id)}">${icon('edit')} 设计下一章 ${icon('arrow')}</button></div>`);break;
    case 'filter':state.filter=id;render();break;
    case 'detail-tab':state.detailTab=id;render();break;
    case 'principle':principleModal(id);break;
    case 'view-comic':viewer(id,chapter);break;
    case 'context-info':openModal('续作不是重新开始',`<p>正式系列创作会先读取系列总览、创作约束、故事主线与当前状态，再带入最近章节、人物关系、世界规则和未完伏笔。</p><p>全部当前有效原则、全局偏好和系列偏好需逐项检查：采用的规则落实到具体设计，不适用或覆盖的规则说明原因。</p>${notice('这里展示的是上下文结构，尚未读取真实私有 Wiki。')}<button class="button primary" data-action="close-modal">了解了</button>`);break;
    case 'single-example':state.singlePrompt='一只怕水的猫，决定成为一名海盗。希望故事轻松有趣，结尾有一点温暖。';document.querySelector('#single-prompt').value=state.singlePrompt;break;
    case 'single-outline':if(!state.singlePrompt.trim()){toast('先输入一个想法，故事才能开始。');document.querySelector('#single-prompt').focus();break;}state.workflow=null;prepareWorkflow(state.selected,'single');navigate('workflow');break;
    case 'outline-preview':drawOutlines();break;
    case 'next-step':nextStep();break;
    case 'previous-step':state.workflow.step=Math.max(0,state.workflow.step-1);render();break;
    case 'go-step':if(Number(id)<=state.workflow.maxStep){state.workflow.step=Number(id);render();}break;
    case 'review-tab':state.workflow.reviewIndex=Number(id);render();break;
    case 'save-preview':toast('草稿已保留在当前预览会话；刷新会重置，请导出以长期保留。');break;
    case 'generate-preview':state.workflow.generated=true;render();toast('已显示制作结果样张；未调用 AI 或产生费用。');break;
    case 'view-output':openModal('漫画制作结果 · 样张预览',`${notice('仓库已有样张，仅用于体验查看交互，不是本次生成。')}<img class="viewer-image" src="/assets/examples/american-comic-sample.png" alt="完整三页美式漫画样张"><button class="button primary" data-action="close-modal">完成查看</button>`);break;
    case 'export-draft':exportDraft();break;
  }
});
document.addEventListener('input',event=>{
  const el=event.target;
  if(el.id==='global-search'){state.search=el.value;if(['home','series','history'].includes(state.route))render();}
  if(el.id==='principle-search'){state.principleSearch=el.value;const pos=el.selectionStart;render();const replacement=document.querySelector('#principle-search');replacement.focus();replacement.setSelectionRange(pos,pos);}
  if(el.id==='single-prompt')state.singlePrompt=el.value;
  const w=state.workflow;if(!w)return;
  if(el.id==='story-direction'){w.direction=el.value;invalidateApproval();}
  if(el.dataset.outline!==undefined){w.outlines[Number(el.dataset.outline)][el.dataset.field]=el.value;w.outlines[Number(el.dataset.outline)].script='';invalidateApproval();}
  if(['review-title','review-script','review-notes'].includes(el.id)){
    const o=w.outlines[w.reviewIndex];o[{'review-title':'title','review-script':'script','review-notes':'notes'}[el.id]]=el.value;o.approved=false;w.generated=false;w.maxStep=2;
    const checkbox=document.querySelector('#review-approved');if(checkbox)checkbox.checked=false;
    const next=document.querySelector('[data-action="next-step"]');if(next)next.disabled=true;
    const status=document.querySelector('.review-status span');if(status)status.innerHTML=`${icon('check')} ${w.outlines.filter(o=>o.approved).length} / ${w.outlines.length} 章已审阅`;
  }
});
document.addEventListener('change',event=>{
  const el=event.target;
  if(el.id==='series-sort'){state.sort=el.value;render();}
  if(el.id==='single-style')state.singleStyle=el.value;
  if(el.id==='single-pages')state.singlePages=Number(el.value);
  const w=state.workflow;if(!w)return;
  if(el.id==='rules-read'){w.rulesRead=el.checked;document.querySelector('[data-action="next-step"]').disabled=!el.checked;}
  if(el.id==='workflow-count'){w.count=Number(el.value);w.outlined=false;w.outlines=[];w.maxStep=1;render();}
  if(el.id==='workflow-pages'){w.pages=Number(el.value);w.outlines.forEach(o=>o.script='');invalidateApproval();}
  if(el.id==='review-approved'){
    const o=w.outlines[w.reviewIndex];
    if(el.checked&&(!o.title.trim()||!o.script.trim())){el.checked=false;toast('请先补充章节标题和分镜内容。');return;}
    o.approved=el.checked;w.generated=false;if(!el.checked)w.maxStep=2;render();
  }
});
document.addEventListener('submit',event=>{
  if(event.target.id!=='new-series-form')return;event.preventDefault();const data=new FormData(event.target);const name=String(data.get('name')).trim();const description=String(data.get('description')).trim();
  if(!name||!description){toast('请填写系列名称与介绍。');return;}
  const id=`demo-${Date.now()}`;const s={id,name,description,genre:String(data.get('genre')),image:'/assets/console/forest.png',chapterCount:0,current:'第 01 话 · 新故事的开始',status:'筹备下一章',updated:'刚刚',chapters:[{title:'新故事的开始',state:'待设计',pages:6}]};state.series.unshift(s);navigate('detail',id);toast('演示系列已创建；仅当前会话保留，不写入 Wiki。');
});
modal.addEventListener('click',event=>{if(event.target===modal){const rect=modal.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeModal();}});
document.addEventListener('keydown',event=>{if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)&&!event.nativeEvent?.isComposing&&!event.isComposing&&event.keyCode!==229&&!modal.open){event.preventDefault();document.querySelector('#global-search').focus();}});
window.addEventListener('hashchange',readRoute);
document.querySelector('#classic-link').innerHTML=`${icon('external')}<span>原版生成器</span>`;
document.querySelector('#settings-link').innerHTML=`${icon('settings')}<span>创作设置</span>`;
document.querySelector('#search-icon').innerHTML=icon('search');
readRoute();
