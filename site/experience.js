import { services, framework, industries, faqs, EMAIL, CALENDLY_URL } from './data.js';
import { createPossibilityEngine } from './engine.js';
import { initConcierge } from './concierge.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
const escapeHtml=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
$$('a[href*="calendly.com"]').forEach(a=>a.href=CALENDLY_URL);
$('#engine-year').textContent=String(new Date().getFullYear());

const panels=$$('[data-story]');
const ranges=[[0,.165],[.19,.355],[.39,.555],[.59,.755],[.79,1.025]];
const sceneNames=['A DIFFERENT WAY TO WORK','MAP — THE BIGGER PICTURE','OPTIMIZE — A BETTER RHYTHM','KIT — CHOSEN FOR YOU','INTEGRATE — WORKING TOGETHER'];
let engine=null, scrollFrame=0, progress=0, journeyRange=1, modalLocked=false, motionPaused=false;
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
let motionChoice;
try{motionChoice=localStorage.getItem('moki-engine-motion');}catch{}
motionPaused=motionChoice==='paused'||(!motionChoice&&reduced.matches);

function showStory(p){
  let active=p<.185?0:p<.385?1:p<.585?2:p<.785?3:4;
  panels.forEach((panel,i)=>{
    const [start,end]=ranges[i];
    let opacity=(i===0?1:smooth(start,start+.03,p))*(1-smooth(end-.028,end,p));
    if(i===4&&p>.98)opacity=1;
    const visible=opacity>.01;
    panel.style.opacity=opacity.toFixed(3);
    panel.style.transform=innerWidth<651?`translateY(${(1-opacity)*18}px)`:`translateY(calc(-50% + ${(1-opacity)*20}px))`;
    panel.classList.toggle('is-current',visible);panel.setAttribute('aria-hidden',String(!visible));
    if(opacity>.5)active=i;
  });
  $('#chapter-number').textContent=`0${active} / 04`;
  $('#chapter-label').textContent=sceneNames[active];
  $$('[data-chapter]').forEach(b=>{if(Number(b.dataset.chapter)===active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  $('#engine-world').dataset.chapter=String(active);
}
function updateJourney(){
  scrollFrame=0;if(modalLocked)return;
  progress=clamp(scrollY/journeyRange);
  document.body.classList.toggle('is-contact',scrollY>journeyRange+innerHeight*.08);
  if(engine){engine.setProgress(progress);if(motionPaused)showStory(progress);}else showStory(progress);
}
function queueJourney(){if(!scrollFrame)scrollFrame=requestAnimationFrame(updateJourney);}
function measure(){journeyRange=Math.max(1,$('#journey').offsetHeight-innerHeight);queueJourney();}
addEventListener('scroll',queueJourney,{passive:true});addEventListener('resize',measure,{passive:true});
measure();
function syncMotion(){
  const button=$('#motion-toggle');button.setAttribute('aria-pressed',String(motionPaused));button.setAttribute('aria-label',motionPaused?'Resume camera motion':'Pause camera motion');
  button.querySelector('span').textContent=motionPaused?'Motion off':'Motion on';
  button.querySelector('svg').innerHTML=motionPaused?'<path d="m7 4 8 6-8 6Z"/>':'<path d="M7 5v10M13 5v10"/>';
  engine?.setPaused(motionPaused);if(motionPaused)showStory(progress);
}
syncMotion();
$('#motion-toggle').addEventListener('click',()=>{motionPaused=!motionPaused;motionChoice=motionPaused?'paused':'on';try{localStorage.setItem('moki-engine-motion',motionChoice);}catch{}syncMotion();});
reduced.addEventListener('change',()=>{if(!motionChoice){motionPaused=reduced.matches;syncMotion();}measure();});
function useStaticView(){
  const previous=engine;engine=null;previous?.dispose();
  $('#engine-world').dataset.renderer='static';$('#engine-loading').classList.remove('is-ready');$('#engine-loading').textContent='STATIC VIEW · EXPLORE THE POSSIBILITIES';
  motionPaused=true;syncMotion();$('#motion-toggle').disabled=true;$('#motion-toggle').querySelector('span').textContent='Static view';document.documentElement.dataset.experienceReady='fallback';showStory(progress);
  document.dispatchEvent(new Event('moki:engine-ready'));
}
createPossibilityEngine($('#engine-world'),p=>{if(!motionPaused)showStory(p);},useStaticView).then(created=>{
  engine=created;syncMotion();if(!motionPaused)engine.setProgressImmediately(progress);
  $('#engine-loading').classList.add('is-ready');$('#engine-loading').textContent='';document.documentElement.dataset.experienceReady='true';
  requestAnimationFrame(()=>document.dispatchEvent(new Event('moki:engine-ready')));
}).catch(error=>{
  console.error('MOKI engine could not start:',error);
  useStaticView();
});
addEventListener('pagehide',e=>{if(!e.persisted)engine?.dispose();});

const chapterPoints=[0,.255,.455,.655,.885];
function jumpChapter(chapter){window.scrollTo({top:chapterPoints[chapter]*journeyRange,behavior:motionPaused?'instant':'smooth'});}
$$('[data-chapter]').forEach(b=>b.addEventListener('click',()=>jumpChapter(Number(b.dataset.chapter))));
$$('[data-restart]').forEach(b=>b.addEventListener('click',()=>window.scrollTo({top:0,behavior:motionPaused?'instant':'smooth'})));
$('.engine-brand').addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:0,behavior:motionPaused?'instant':'smooth'});});

// Dialog transitions share one scroll lock, so moving between views never loses it.
const dialogs=$$('dialog'), origins=new WeakMap();
let previousOverflow='',modalScrollY=0;
function openModal(dialog,origin=document.activeElement){
  if(dialog.open)return;
  origins.set(dialog,origin);
  if(!modalLocked){previousOverflow=document.body.style.overflow;modalScrollY=scrollY;modalLocked=true;}
  document.body.style.overflow='hidden';dialog.showModal();dialog.querySelector('[data-close-dialog]')?.focus({preventScroll:true});
}
function handoff(from,to,setup){const origin=origins.get(from)||$('.engine-menu');from.close();setup?.();openModal(to,origin);}
dialogs.forEach(d=>{
  d.querySelector('[data-close-dialog]')?.addEventListener('click',()=>d.close());
  d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
  d.addEventListener('close',()=>{if(!dialogs.some(x=>x.open)){document.body.style.overflow=previousOverflow;modalLocked=false;window.scrollTo({top:modalScrollY,behavior:'instant'});queueJourney();const origin=origins.get(d);if(origin?.isConnected&&!origin.closest('dialog'))origin.focus({preventScroll:true});}});
});

const catalogue=$('#catalogue-dialog'), serviceDialog=$('#service-dialog'), enquiry=$('#enquiry-dialog'), about=$('#about-dialog'), navigation=$('#engine-nav-dialog');
const projectsDialog=$('#projects-dialog');
const projects=[
  {name:'VV Global Partners',type:'Brand strategy & culture',url:'https://sample2-ruddy.vercel.app/',image:'vv-global-cinematic'},
  {name:'The Solenne',type:'Interactive property exploration',url:'https://realestate-3d.vercel.app/',image:'solenne'},
  {name:'ALTIMATE',type:'Interior design & build',url:'https://altimate-demo.vercel.app/',image:'altimate'},
  {name:'Bellavierre',type:'Luxury real estate',url:'https://bellavierre-demo.vercel.app/',image:'bellavierre'},
  {name:'Dayaar Real Estate',type:'Property discovery & consulting',url:'https://dayaarrealestate.com/',image:'dayaar'},
  {name:'Alamera Properties',type:'Dubai real estate & property discovery',url:'https://alameraproperties-demo.vercel.app/',image:'alamera'},
];
function renderProjects(){
  if($('#projects-grid').childElementCount)return;
  $('#projects-grid').innerHTML=projects.map(p=>`<a class="project-card" href="${p.url}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(p.name)}: ${escapeHtml(p.type)}. View website (opens in a new tab)"><div class="project-window"><div class="project-bar" aria-hidden="true"><i></i><i></i><i></i><span>${new URL(p.url).hostname}</span></div><img src="./assets/projects/${p.image}.webp" width="1440" height="900" loading="lazy" decoding="async" alt="${escapeHtml(p.name)} website preview"></div><div class="project-caption"><div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.type)}</p></div><span class="project-open" aria-hidden="true">View site</span></div></a>`).join('');
}
$$('[data-projects]').forEach(b=>b.addEventListener('click',()=>{renderProjects();openModal(projectsDialog,b);}));
$$('[data-catalogue]').forEach(b=>b.addEventListener('click',()=>openModal(catalogue,b)));
$$('[data-about]').forEach(b=>b.addEventListener('click',()=>openModal(about,b)));
$$('[data-navigation]').forEach(b=>b.addEventListener('click',()=>openModal(navigation,b)));
navigation.querySelectorAll('[data-nav-action]').forEach(b=>b.addEventListener('click',()=>{
  const action=b.dataset.navAction;
  if(action==='projects')handoff(navigation,projectsDialog,renderProjects);
  if(action==='solutions')handoff(navigation,catalogue);
  if(action==='about')handoff(navigation,about);
  if(action==='contact'){navigation.close();setTimeout(()=>$('#contact').scrollIntoView({behavior:'smooth'}),0);}
  if(action==='restart'){navigation.close();setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),0);}
}));

function renderSolutions(group='all'){
  const list=services.filter(s=>group==='all'||s.group===group);
  $('#catalogue-list').innerHTML=list.map(s=>`<button class="catalogue-service" data-service="${s.id}" aria-haspopup="dialog"><span class="service-index">${String(services.indexOf(s)+1).padStart(2,'0')}</span><span><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.short)}</small></span><i aria-hidden="true">+</i></button>`).join('');
  $$('.catalogue-filter>button').forEach(b=>{const active=b.dataset.filter===group;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
}
const filterButtons=$$('.catalogue-filter>button');
filterButtons.forEach((b,i)=>{b.addEventListener('click',()=>renderSolutions(b.dataset.filter));b.addEventListener('keydown',e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%4;else if(e.key==='ArrowLeft')n=(i+3)%4;else if(e.key==='Home')n=0;else if(e.key==='End')n=3;else return;e.preventDefault();renderSolutions(filterButtons[n].dataset.filter);filterButtons[n].focus();});});
renderSolutions();
let currentService=null;
function openService(id,from=catalogue){
  const service=services.find(s=>s.id===id);if(!service)return;
  currentService=service;
  handoff(from,serviceDialog,()=>{
    $('#service-dialog-title').textContent=service.name;$('#service-dialog-group').textContent=`${service.group.toUpperCase()} / THE POSSIBILITIES`;
    $('#service-dialog-description').textContent=service.description;$('#service-dialog-examples').innerHTML=service.examples.map(x=>`<li>${escapeHtml(x)}</li>`).join('');
    $('#service-dialog-image').src='./assets/images/engine-interior.webp';
  });
}
$('#catalogue-list').addEventListener('click',e=>{
  const trigger=e.target.closest('[data-service]');if(trigger)openService(trigger.dataset.service);
});

$('#about-industries').innerHTML=industries.map((x,i)=>`<button data-industry="${i}" aria-pressed="${i===0}">${escapeHtml(x.name)}</button>`).join('');
function chooseIndustry(index){
  const x=industries[index];
  $('#industry-example').innerHTML=`<strong>${escapeHtml(x.full)}</strong>${escapeHtml(x.outcome)}<br><small>Example: ${x.workflow.map(escapeHtml).join(' → ')}</small>`;
  $$('#about-industries>button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
}
$('#about-industries').addEventListener('click',e=>{const b=e.target.closest('[data-industry]');if(b)chooseIndustry(Number(b.dataset.industry));});chooseIndustry(0);
$('#engine-faq').innerHTML=faqs.map(([q,a])=>`<details><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join('');

const form=$('#enquiry-form'),result=$('#enquiry-result');
$('#enquiry-services').innerHTML=services.map(s=>`<label><input type="checkbox" name="services" value="${s.id}"><span class="service-check-text">${escapeHtml(s.name)}</span></label>`).join('');
$$('[data-enquiry]').forEach(b=>b.addEventListener('click',()=>openModal(enquiry,b)));
$('#service-enquiry').addEventListener('click',()=>handoff(serviceDialog,enquiry,()=>{form.hidden=false;result.hidden=true;if(currentService)form.querySelector(`input[value="${currentService.id}"]`).checked=true;}));
let draft='',leadSignature='',leadRequestId='',leadPending=null;
form.querySelectorAll('[required]').forEach(field=>field.addEventListener('input',()=>field.setCustomValidity('')));
form.addEventListener('submit',async e=>{
  e.preventDefault();if(leadPending)return;
  form.elements.name.setCustomValidity(form.elements.name.value.trim().length<2?'Please enter your name.':'');
  form.elements.business.setCustomValidity(!form.elements.business.value.trim()?'Please enter your business name.':'');
  form.elements.message.setCustomValidity(form.elements.message.value.trim().length<15?'Please add at least 15 characters about what could work better.':'');
  if(!form.reportValidity())return;
  const v=new FormData(form),name=String(v.get('name')).trim(),email=String(v.get('email')).trim(),business=String(v.get('business')).trim(),message=String(v.get('message')).trim();
  const selectedServices=services.filter(s=>v.getAll('services').includes(s.id));
  const selections=selectedServices.map(s=>s.name);
  draft=`Hello MOKI,\n\nI would like to explore a better way to work.\n\nName: ${name}\nEmail: ${email}\nBusiness: ${business||'Not specified'}\nInterested in: ${selections.length?selections.join(', '):'Help finding the right starting point'}\n\nWhat could work better:\n${message}\n\nThank you,\n${name}`;
  $('#open-email').href=`mailto:${EMAIL}?subject=${encodeURIComponent(`A new possibility for ${business||name}`)}&body=${encodeURIComponent(draft)}`;$('#email-preview').textContent=draft;$('#copy-status').textContent='';
  const payload={name,email,company:business,challenge:message,services:selectedServices.map(s=>s.id),website:String(v.get('website')||''),source:'contact-page',page:'/'};
  const signature=JSON.stringify(payload);
  // A retry of an unchanged enquiry retains its identity, including after a lost response.
  if(signature!==leadSignature){leadSignature=signature;leadRequestId=crypto.randomUUID();}
  payload.requestId=leadRequestId;
  const controller=new AbortController();leadPending=controller;
  const submit=form.querySelector('[type=submit]'),status=$('#lead-save-status');
  const timeout=setTimeout(()=>controller.abort(),25000);
  submit.disabled=true;submit.textContent='Saving your enquiry…';form.setAttribute('aria-busy','true');
  let saved=false,errorMessage='';
  try{
    const response=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
    const data=await response.json();
    if(!response.ok||data.saved!==true)throw Error(typeof data.error==='string'?data.error:'Your enquiry could not be saved. Please retry or use the email draft.');
    saved=true;
  }catch(error){errorMessage=controller.signal.aborted?'We could not confirm the save in time. Retry safely, or use your email draft.':error.message;}
  finally{clearTimeout(timeout);leadPending=null;submit.disabled=false;submit.textContent='Send my enquiry';form.removeAttribute('aria-busy');}
  status.classList.toggle('is-error',!saved);
  status.textContent=saved?'Your enquiry has been saved for the MOKI team to follow up.':errorMessage;
  result.querySelector('.result-symbol').textContent=saved?'✓':'!';
  result.querySelector('h3').textContent=saved?'Your enquiry is with us.':'Your draft is ready.';
  $('#retry-enquiry').hidden=saved;form.hidden=true;result.hidden=false;
  const title=result.querySelector('h3');title.tabIndex=-1;title.focus({preventScroll:true});enquiry.scrollTop=0;
});
$('#retry-enquiry').addEventListener('click',()=>{form.hidden=false;result.hidden=true;form.requestSubmit();});
$('#copy-email').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(draft);$('#copy-status').textContent='Message copied. Ready to paste into your email.';}catch{$('#copy-status').textContent='Please select and copy the draft below.';result.querySelector('details').open=true;}});
$('#edit-enquiry').addEventListener('click',()=>{form.hidden=false;result.hidden=true;form.elements.name.focus({preventScroll:true});});
$$('[data-privacy]').forEach(b=>b.addEventListener('click',()=>openModal($('#privacy-dialog'),b)));
initConcierge({openModal,handoff,openService,enquiry});
addEventListener('pagehide',()=>leadPending?.abort());
