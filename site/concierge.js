import {CALENDLY_URL,EMAIL,services} from './data.js';

export function initConcierge({openModal,handoff,openService,enquiry}){
  const dialog=document.querySelector('#concierge-dialog'),dock=document.querySelector('#concierge-dock');
  const launcher=document.querySelector('#concierge-launcher'),video=document.querySelector('#concierge-video');
  const slots=[document.querySelector('#concierge-launcher-media'),document.querySelector('#concierge-full-media')];
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const messages=[],log=document.querySelector('#concierge-messages'),form=document.querySelector('#concierge-chat-form');
  const input=form.elements.message,status=document.querySelector('#concierge-chat-status');
  let view='welcome',paused=false,pending=null,loaded=false,enabled=false;
  function syncVideo(){
    const active=enabled&&!paused&&!reduced.matches&&!document.hidden&&(!dialog.open||view==='welcome');
    if(active){if(!loaded){video.src='/videos/concierge/moki-welcome-woman-wide.mp4';loaded=true;}video.play().catch(()=>{});}else video.pause();
  }
  function chooseView(next){
    view=next;
    dialog.querySelectorAll('[data-concierge-view]').forEach(p=>p.hidden=p.dataset.conciergeView!==view);
    dialog.querySelectorAll('[data-concierge-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.conciergeTab===view)));
    document.querySelector('#concierge-body').scrollTop=0;
    syncVideo();if(view==='ai')input.focus({preventScroll:true});
  }
  launcher.addEventListener('click',()=>{
    if(document.querySelector('dialog[open]'))return;
    video.pause();slots[1].append(video);paused=false;chooseView('welcome');openModal(dialog,launcher);launcher.setAttribute('aria-expanded','true');syncVideo();
  });
  dialog.addEventListener('close',()=>{video.pause();slots[0].append(video);launcher.setAttribute('aria-expanded','false');syncVideo();});
  dialog.querySelectorAll('[data-concierge-tab],[data-concierge-choice]').forEach(b=>b.addEventListener('click',()=>chooseView(b.dataset.conciergeTab||b.dataset.conciergeChoice)));
  document.querySelector('#concierge-minimize').addEventListener('click',()=>{dock.classList.add('is-compact');launcher.focus({preventScroll:true});});
  document.querySelector('#concierge-video-toggle').addEventListener('click',e=>{paused=!paused;e.currentTarget.textContent=paused?'Play greeting':'Pause greeting';e.currentTarget.setAttribute('aria-pressed',String(paused));syncVideo();});
  dialog.querySelector('[data-concierge-enquiry]').addEventListener('click',()=>handoff(dialog,enquiry));
  dialog.querySelectorAll('[data-booking]').forEach(a=>a.href=CALENDLY_URL);
  dialog.querySelector('[data-team-email]').href=`mailto:${EMAIL}`;
  dialog.querySelector('[data-team-email]').textContent=EMAIL;
  function addMessage(role,text,serviceId){
    const article=document.createElement('article');article.className=`concierge-message message-${role}`;
    const author=document.createElement('span');author.textContent=role==='user'?'YOU':'MOKI';
    const copy=document.createElement('p');copy.textContent=text;article.append(author,copy);
    const service=services.find(s=>s.id===serviceId);
    if(service){const button=document.createElement('button');button.type='button';button.className='concierge-service';button.textContent=service.name;button.addEventListener('click',()=>openService(service.id,dialog));article.append(button);}
    log.append(article);log.scrollTop=log.scrollHeight;
  }
  function setBusy(busy){form.querySelector('button[type=submit]').disabled=busy;input.disabled=busy;log.setAttribute('aria-busy',String(busy));}
  addMessage('assistant','Hi, I’m MOKI’s AI guide. Tell me what could work better in your business. We can find a useful place to start.');
  form.addEventListener('submit',async e=>{
    e.preventDefault();const text=input.value.trim();if(!text||pending)return;
    const controller=new AbortController();pending=controller;const timeout=setTimeout(()=>controller.abort(),28000);
    const next=[...messages,{role:'user',text}];const conversation=next.slice(-11);
    while(conversation.length&&conversation[0].role!=='user')conversation.shift();
    const last=log.lastElementChild;status.textContent='Thinking about your business…';addMessage('user',text);setBusy(true);
    try{
      const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({messages:conversation})});
      const data=await response.json();if(!response.ok||typeof data.reply!=='string')throw Error(typeof data.error==='string'?data.error:'The AI guide is unavailable right now. Please try again or talk to our team.');
      if(pending!==controller)return;
      messages.push({role:'user',text},{role:'assistant',text:data.reply});addMessage('assistant',data.reply,data.service);input.value='';status.textContent='';
    }catch(error){if(pending===controller){while(log.lastElementChild&&log.lastElementChild!==last)log.lastElementChild.remove();status.textContent=controller.signal.aborted?'That reply took too long. Please try again or talk to our team.':error.message;}}
    finally{clearTimeout(timeout);if(pending===controller){pending=null;setBusy(false);input.focus({preventScroll:true});}}
  });
  document.querySelector('#concierge-chat-reset').addEventListener('click',()=>{pending?.abort();pending=null;messages.length=0;log.replaceChildren();status.textContent='';setBusy(false);input.value='';addMessage('assistant','A fresh start. What could work better in your business?');input.focus();});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();form.requestSubmit();}});
  document.addEventListener('visibilitychange',syncVideo);reduced.addEventListener('change',syncVideo);
  // Let the main world finish first, then load one shared, silent greeting video.
  const start=()=>{enabled=true;syncVideo();};
  if(document.documentElement.dataset.experienceReady)start();else document.addEventListener('moki:engine-ready',()=>setTimeout(start,1100),{once:true});
  addEventListener('pagehide',()=>{pending?.abort();video.pause();});
}
