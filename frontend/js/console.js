import {icon, escapeHTML as e} from './consoleData.js';
import {homeView, seriesView, detailView, principlesView, historyView, singleView, workflowView, notice} from './consoleViews.js';

const state = {series:[], rules:[], route:'home', selected:'', search:'', filter:'all', sort:'recent', principleSearch:'', singlePrompt:'', singleStyle:'ghibli', singlePages:3, workflow:null, loading:true, error:'', busy:false, progress:''};
const main=document.querySelector('#main');
const modal=document.querySelector('#modal');
const selectedSeries=()=>state.series.find(s=>s.id===state.selected);
const navigation=[['home','home','开始创作'],['series','layers','漫画系列'],['principles','book','创作指南']];
let config, keys;
let toastTimer;
function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),5000);}
function openModal(title,html){document.querySelector('#modal-title').textContent=title;document.querySelector('#modal-content').innerHTML=html;if(!modal.open)modal.showModal();}
function navigate(route,id){modal.close();location.hash=id?`${route}/${encodeURIComponent(id)}`:route;document.querySelector('.sidebar').classList.remove('mobile-open');if(location.hash.slice(1)===route)readRoute();}
function render(){
  const active=['detail','history'].includes(state.route)?'series':['single','workflow'].includes(state.route)?'home':state.route;
  document.querySelector('#navigation').innerHTML=`<div class="nav-label">创作工作台</div>${navigation.map(([id,ic,label])=>`<a class="nav-item ${active===id?'active':''}" href="#${id}" ${active===id?'aria-current="page"':''}>${icon(ic)}<span>${label}</span>${id==='series'?`<span class="count">${state.series.length}</span>`:''}</a>`).join('')}`;
  document.querySelector('#connection-status').textContent=state.loading?'连接中':state.error?'未连接':'已连接';
  document.querySelector('#search-box').hidden=!['home','series','history'].includes(state.route);
  document.querySelector('#page-label').textContent=({home:'创作台',series:'漫画系列',single:'单篇创作',history:'漫画档案',principles:'创作指南',detail:selectedSeries()?.name,workflow:'漫画创作'})[state.route]||'创作台';
  const views={home:()=>homeView(state),series:()=>seriesView(state),detail:()=>selectedSeries()?detailView(state,selectedSeries()):seriesView(state),principles:()=>principlesView(state),history:()=>historyView(state),single:()=>singleView(state),workflow:()=>state.workflow?workflowView(state,selectedSeries()):singleView(state)};
  main.innerHTML=(views[state.route]||views.home)();
  main.setAttribute('aria-busy',String(state.busy||state.loading));
}
function readRoute(){
  const [route,rawId]=location.hash.slice(1).split('/');
  state.route=['home','series','single','history','principles','detail','workflow'].includes(route)?route:'home';
  if(rawId){try{state.selected=decodeURIComponent(rawId);}catch{state.route='series';}}
  if(state.route==='workflow'&&!state.workflow)state.route='home';
  render();
}
function imageUrl(value){
  if(typeof value!=='string'||!/^\/(?:backend\/)?static\/images\/[A-Za-z0-9][A-Za-z0-9._-]*\.(png|jpe?g|webp|gif)$/i.test(value))return '';
  return value.startsWith('/backend/')?value:`/backend${value}`;
}
function validImages(loaded){
  const pages=!loaded.reviewStale&&loaded.review?.pages?loaded.review.pages:loaded.project.pages;
  return (loaded.renders?.pages||[]).flatMap(record=>{
    const page=pages[record.page_index];
    const fingerprint=page&&window.StoryboardImageReconciler.pageFingerprint(page);
    const version=record.versions?.[record.current_version]||record.versions?.at(-1);
    return version?.page_script_fingerprint===fingerprint&&imageUrl(version.image_url)?[{index:record.page_index,url:imageUrl(version.image_url),fingerprint}]:[];
  });
}
async function loadWorkspace(){
  state.loading=true;state.error='';render();
  try{
    const [projects,rules]=await Promise.all([window.ComicAPI.listComicBrainProjects(),window.ComicAPI.getComicBrainRules()]);
    const loaded=await Promise.all(projects.map(async p=>({...p,loaded:await window.ComicAPI.getComicBrainProject(p.series_id,p.chapter_id)})));
    const groups=new Map();
    for(const p of loaded){
      let s=groups.get(p.series_id);
      if(!s){s={id:p.series_id,name:p.series_title||p.series_id,description:'来自 ComicBrain 的制作章节；制作草稿不等于 Wiki 正史。',genre:p.series_id.startsWith('single-')?'独立短篇':'漫画系列',chapters:[],chapterCount:0,status:'连载中',current:p.title,updated:p.updated_at,image:''};groups.set(s.id,s);}
      const images=validImages(p.loaded);
      s.chapters.push({id:p.chapter_id,title:(!p.loaded.reviewStale&&p.loaded.review?.title)||p.title||p.chapter_id,pages:p.page_count,state:images.length===p.page_count?'已完成':images.length?'制作中':'待制作',loaded:p.loaded,images,updated:p.review_updated_at||p.updated_at});
    }
    state.series=[...groups.values()].map(s=>{s.chapters.sort((a,b)=>String(b.updated).localeCompare(String(a.updated)));s.chapterCount=s.chapters.length;s.current=s.chapters[0].title;s.image=s.chapters.find(ch=>ch.images.length)?.images[0].url||'';s.updated=new Date(s.chapters[0].updated).toLocaleDateString('zh-CN');return s;});
    state.rules=rules;
    if(!selectedSeries())state.selected=state.series[0]?.id||'';
  }catch(error){state.error=error instanceof TypeError?'无法连接本机后端（localhost:5003）。请确认本地服务已启动；云端预览不能访问你的本机私有 Wiki。':error.message;}
  finally{state.loading=false;render();}
}
async function runTask(task){
  if(state.busy)return;
  state.busy=true;render();
  try{await task();}catch(error){toast(error.message||'操作失败，请重试。');}
  finally{state.busy=false;state.progress='';render();}
}
function prepareWorkflow(mode='single',parent=null){
  const s=selectedSeries();
  state.workflow={mode,parent,step:1,maxStep:1,direction:mode==='single'?state.singlePrompt:'',count:1,pages:mode==='single'?state.singlePages:6,outlines:[],reviewIndex:0,images:[],generated:false,style:mode==='single'?state.singleStyle:parent?.settings?.comic_style||'ghibli',context:s?.chapters.slice(0,3).map(ch=>({title:ch.title,pages:ch.loaded.project.pages,characters:ch.loaded.project.characters}))||[]};
}
function editChapter(id,index){
  state.selected=id;const ch=selectedSeries()?.chapters[Number(index)];if(!ch)return;
  const {project,review,reviewStale}=ch.loaded;
  const draft=!reviewStale&&review?.pages?review:project;
  prepareWorkflow('series',project);
  const w=state.workflow;w.step=2;w.maxStep=2;w.pages=draft.pages.length;
  w.outlines=[{title:draft.title||project.title,summary:'',script:JSON.stringify(draft.pages,null,2),notes:draft.notes||'',approved:false,project,images:ch.images}];
  navigate('workflow',id);
  if(reviewStale)toast('源分镜已更新，旧审阅稿未自动载入。请复核后重新保存。');
}
async function drawOutlines(){
  const w=state.workflow;
  if(!w.direction.trim())throw new Error('请先填写创作方向。');
  const previous=[];
  for(let i=0;i<w.count;i++){
    state.progress=`正在设计第 ${i+1} / ${w.count} 章…`;render();
    const context=w.mode==='series'?`以下仅为制作快照，不是新正史：${JSON.stringify(w.context)}\n` : '';
    const rules=state.rules.map(r=>`${r.category}/${r.title}\n${r.content}`).join('\n\n');
    const prompt=`${context}当前可读取的全局原则和偏好：\n${rules||'当前未提供私有 Wiki 原则，请勿宣称已完成全量规则复审。'}\n不要将制作快照中的草稿当成正史；人物设定和世界规则不得自行改变。输出可编辑的逐页分镜。\n本轮目标：${w.direction}\n连续章节：第 ${i+1}/${w.count} 章。已设计章节：${JSON.stringify(previous.map(o=>({title:o.title,pages:o.pages})))}\n每格一个可见瞬间，保留对白空间。`;
    const result=await window.ComicAPI.generateComic(keys.openai,prompt,w.pages,config.baseUrl,config.model,config.textProvider,config.reasoningEffort,w.style,'zh',4,keys.google);
    if(!Array.isArray(result.pages)||!result.pages.length)throw new Error('生成接口没有返回有效分镜。');
    const pages=result.pages;previous.push({title:pages[0].title||`第 ${i+1} 章`,summary:w.direction,pages,script:JSON.stringify(pages,null,2),notes:'',approved:false,project:null,images:[]});
  }
  w.outlines=previous;w.reviewIndex=0;w.step=2;w.maxStep=2;w.generated=false;
}
function parsePages(o){
  let pages;try{pages=JSON.parse(o.script);}catch{throw new Error('分镜 JSON 格式有误，请检查逗号、引号和括号。');}
  if(!Array.isArray(pages)||!pages.length)throw new Error('分镜必须是非空的页面数组。');
  return pages;
}
async function saveOutline(o){
  const w=state.workflow;const pages=parsePages(o);
  const validation=await window.ComicAPI.validateScript(pages);
  if(!validation.valid)throw new Error(validation.error||'分镜结构不正确。');
  if(!o.title.trim())throw new Error('请填写章节标题。');
  if(!o.project){
    o.project=await window.ComicAPI.createComicBrainDraft({title:o.title,pages,comic_style:w.style,parent:w.mode==='series'?w.parent?.source:null,series_title:w.seriesTitle||undefined});
    o.script=JSON.stringify(o.project.pages,null,2);
  }
  await window.ComicAPI.saveComicBrainReview(o.project.source.series_id,o.project.source.chapter_id,{source:o.project.source,title:o.title,pages:parsePages(o),notes:o.notes});
  const fingerprints=parsePages(o).map(p=>window.StoryboardImageReconciler.pageFingerprint(p));
  o.images=o.images.filter(image=>fingerprints[image.index]===image.fingerprint);
  o.approved=true;
}
async function approve(){
  const w=state.workflow;await saveOutline(w.outlines[w.reviewIndex]);
  const pending=w.outlines.findIndex(o=>!o.approved);
  if(pending!==-1){w.reviewIndex=pending;toast('本章已保存，请继续确认下一章。');}
  else{w.step=3;w.maxStep=3;toast('分镜已保存到 production/review.json，可开始制作。');}
}
async function generateImages(){
  const w=state.workflow;if(!w.outlines.every(o=>o.approved))throw new Error('请先确认所有章节。');
  for(const [chapterIndex,o] of w.outlines.entries()){
    const pages=parsePages(o);
    for(const [index,page] of pages.entries()){
      const fingerprint=window.StoryboardImageReconciler.pageFingerprint(page);
      if(o.images.some(img=>img.index===index&&img.fingerprint===fingerprint))continue;
      state.progress=`正在制作第 ${chapterIndex+1} 章 · 第 ${index+1} / ${pages.length} 页…`;render();
      const references=o.images.slice(-2).map(img=>img.url.replace('/backend','http://localhost:5003'));
      const result=await window.ComicAPI.generateComicImage(page,references.length?references:null,null,w.style,4,'zh',{...config,openaiApiKey:keys.openai,googleApiKey:keys.google},o.project.source,{page_index:index,page_id:page.id||`page-${index+1}`,page_title:page.title||`第 ${index+1} 页`,page_script_fingerprint:fingerprint});
      const url=imageUrl(result.image_url);if(!url)throw new Error('图片接口未返回有效的本地图片地址。');
      o.images.push({index,url,fingerprint});o.images.sort((a,b)=>a.index-b.index);render();
    }
  }
  w.generated=true;toast('漫画已制作完成，图片和历史版本已保存。');
}
function settingsModal(){
  openModal('模型与生成设置',`<p>沿用原版配置；本次修改只在当前页面生效，密钥不会随草稿保存。Codex 需要本机已有登录凭据。</p><form id="settings-form" class="form-stack"><div class="form-row"><label>文字提供方<select name="textProvider">${['codex','openai','google'].map(x=>`<option ${config.textProvider===x?'selected':''}>${x}</option>`).join('')}</select></label><label>图片提供方<select name="imageProvider">${['codex','openai','google'].map(x=>`<option ${config.imageProvider===x?'selected':''}>${x}</option>`).join('')}</select></label></div><label>文字模型<input name="model" required value="${e(config.model)}"></label><label>图片模型<input name="imageModel" required value="${e(config.imageModel)}"></label><label>API Base URL<input name="baseUrl" type="url" required value="${e(config.baseUrl)}"></label><label>OpenAI API Key<input name="openai" type="password" autocomplete="off" placeholder="${keys.openai?'已读取原版密钥；留空保留':'仅 OpenAI 提供方需要'}"></label><label>Google API Key<input name="google" type="password" autocomplete="off" placeholder="${keys.google?'已读取原版密钥；留空保留':'仅 Google 提供方需要'}"></label><div class="modal-actions"><button class="button primary" type="submit">应用本次配置</button></div></form>`);
}
function viewer(id,index){
  const s=state.series.find(x=>x.id===id);const ch=s?.chapters[Number(index)];if(!ch)return;
  openModal(`${s.name} / ${ch.title}`,`${ch.images.length?ch.images.map(img=>`<img class="viewer-image" src="${e(img.url)}" alt="${e(ch.title)}第 ${img.index+1} 页">`).join(''):notice('此章节尚未生成图片，可继续编辑分镜后制作。')}<button class="button primary" data-action="edit-chapter" data-id="${e(id)}" data-chapter="${index}">编辑分镜 / 继续制作</button>`);
}
function outputViewer(){const w=state.workflow;openModal('漫画制作结果',w.outlines.map(o=>`<h3>${e(o.title)}</h3>${o.images.map(img=>`<img class="viewer-image" src="${e(img.url)}" alt="${e(o.title)}第 ${img.index+1} 页"><a class="button" href="${e(img.url)}" download>下载第 ${img.index+1} 页</a>`).join('')}`).join(''));}
function exportDraft(){const w=state.workflow;if(!w)return;const url=URL.createObjectURL(new Blob([JSON.stringify({status:'draft',canonical:false,chapters:w.outlines.map(o=>({title:o.title,pages:parsePages(o),notes:o.notes,source:o.project?.source}))},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='comic-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
document.addEventListener('click',event=>{
  const el=event.target.closest('[data-action]');if(!el||el.disabled)return;const {action,id,chapter}=el.dataset;
  if(state.busy){toast('操作正在进行，请等待完成。');return;}
  switch(action){
    case 'home':case 'series':case 'single':case 'history':case 'principles':navigate(action);break;
    case 'reload':runTask(loadWorkspace);break;
    case 'close-modal':modal.close();break;
    case 'settings':settingsModal();break;
    case 'mobile-menu':document.querySelector('.sidebar').classList.toggle('mobile-open');break;
    case 'open-series':navigate('detail',id);break;
    case 'start-series':state.selected=id;prepareWorkflow('series',selectedSeries()?.chapters[0]?.loaded.project);navigate('workflow',id);break;
    case 'edit-chapter':modal.close();editChapter(id,chapter);break;
    case 'new-series':openModal('开始一个新系列',`<p>先填写系列名称和第一章方向。生成并确认后创建制作草稿，不自动创建 Wiki 正史。</p><form id="new-series-form" class="form-stack"><label>系列名称<input name="name" required maxlength="180"></label><label>第一章创作方向<textarea name="description" required rows="4"></textarea></label><button class="button primary" type="submit">设计第一章</button></form>`);break;
    case 'filter':state.filter=id;render();break;
    case 'principle':{const p=state.rules.find(x=>x.id===id);if(p)openModal(p.title,`<pre class="rule-content">${e(p.content)}</pre>`);break;}
    case 'view-comic':viewer(id,chapter);break;
    case 'single-example':state.singlePrompt='一只怕水的猫，决定成为一名海盗。希望故事轻松有趣，结尾有一点温暖。';render();break;
    case 'single-outline':prepareWorkflow();navigate('workflow');runTask(drawOutlines);break;
    case 'outline-preview':runTask(drawOutlines);break;
    case 'approve-review':runTask(approve);break;
    case 'save-preview':runTask(async()=>{await saveOutline(state.workflow.outlines[state.workflow.reviewIndex]);toast('制作草稿已保存；刷新后可从章节列表重新打开。');});break;
    case 'previous-step':state.workflow.step=Math.max(1,state.workflow.step-1);render();break;
    case 'review-tab':state.workflow.reviewIndex=Number(id);render();break;
    case 'generate-preview':runTask(generateImages);break;
    case 'view-output':outputViewer();break;
    case 'export-draft':try{exportDraft();}catch(error){toast(error.message);}break;
  }
});
document.addEventListener('input',event=>{
  const el=event.target;
  if(el.id==='global-search'){state.search=el.value;render();}
  if(el.id==='principle-search'){state.principleSearch=el.value;const pos=el.selectionStart;render();const input=document.querySelector('#principle-search');input.focus();input.setSelectionRange(pos,pos);}
  if(el.id==='single-prompt')state.singlePrompt=el.value;
  const w=state.workflow;if(!w)return;
  if(el.id==='story-direction')w.direction=el.value;
  if(['review-title','review-script','review-notes'].includes(el.id)){
    const o=w.outlines[w.reviewIndex];o[{'review-title':'title','review-script':'script','review-notes':'notes'}[el.id]]=el.value;o.approved=false;w.generated=false;w.maxStep=2;
    const status=document.querySelector('.review-status span');if(status)status.textContent='有未保存修改，请重新确认。';
  }
});
document.addEventListener('change',event=>{
  const el=event.target;
  if(el.id==='single-style')state.singleStyle=el.value;
  if(el.id==='single-pages')state.singlePages=Number(el.value);
  if(el.id==='series-sort'){state.sort=el.value;render();}
  const w=state.workflow;if(!w)return;
  if(el.id==='workflow-count')w.count=Number(el.value);
  if(el.id==='workflow-pages')w.pages=Number(el.value);
});
document.addEventListener('submit',event=>{
  if(event.target.id==='settings-form'){event.preventDefault();const data=new FormData(event.target);for(const key of ['textProvider','imageProvider','model','imageModel','baseUrl'])config[key]=String(data.get(key));for(const key of ['openai','google'])if(data.get(key))keys[key]=String(data.get(key));modal.close();toast('本次配置已应用。');}
  if(event.target.id==='new-series-form'){event.preventDefault();const data=new FormData(event.target);prepareWorkflow();state.workflow.seriesTitle=String(data.get('name')).trim();state.workflow.direction=String(data.get('description')).trim();navigate('workflow');runTask(drawOutlines);}
});
modal.addEventListener('click',event=>{if(event.target===modal){const rect=modal.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)modal.close();}});
window.addEventListener('hashchange',()=>{readRoute();if(!state.busy&&['home','series','history','detail'].includes(state.route))loadWorkspace();});
document.querySelector('#settings-link').innerHTML=`${icon('settings')}<span>模型与生成设置</span>`;
document.querySelector('#search-icon').innerHTML=icon('search');
window.addEventListener('DOMContentLoaded',()=>{config=window.ConfigManager.getCurrentConfig();keys={openai:window.ConfigManager.loadApiKey(),google:window.ConfigManager.loadGoogleApiKey()};readRoute();loadWorkspace();});
