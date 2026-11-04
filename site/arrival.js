// The entrance is deliberately quiet; readiness and escape behaviour remain independent of 3D.
(() => {
  const loader=document.querySelector('#arrival-loader');
  if(!loader)return;
  const start=performance.now(),reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const surfaces=[...document.querySelectorAll('.skip-link,.engine-header,main,.engine-contact,.experience-controls,.chapter-navigation,#concierge-dock')];
  const previousInert=surfaces.map(el=>el.inert),previousOverflow=document.body.style.overflow;
  let fonts=false,ready=false,finished=false,skipRequested=false,timer;
  document.body.classList.add('is-arriving');document.body.style.overflow='hidden';
  surfaces.forEach(el=>el.inert=true);loader.hidden=false;
  function finish(skip=false){
    if(finished)return;
    skipRequested=skipRequested||skip;
    const delay=skipRequested||reduced?0:Math.max(0,950-(performance.now()-start));
    clearTimeout(timer);
    timer=setTimeout(()=>{
      if(finished)return;finished=true;clearTimeout(failOpen);
      document.body.style.overflow=previousOverflow;surfaces.forEach((el,i)=>el.inert=previousInert[i]);
      document.body.classList.remove('is-arriving');document.body.classList.add('is-revealing');
      loader.classList.add('is-leaving');loader.setAttribute('aria-hidden','true');loader.inert=true;
      document.documentElement.dataset.arrival='revealing';
      setTimeout(()=>{loader.hidden=true;document.body.classList.remove('is-revealing');document.documentElement.dataset.arrival='complete';},reduced?0:760);
    },delay);
  }
  const release=()=>{if(fonts&&ready)finish();};
  document.addEventListener('moki:engine-ready',()=>{ready=true;release();});
  loader.querySelector('[data-skip-arrival]').addEventListener('click',()=>finish(true));
  const failOpen=setTimeout(()=>finish(true),6500);
  document.fonts.load('500 1em "League Spartan"').catch(()=>{}).then(()=>{fonts=true;release();});
})();
