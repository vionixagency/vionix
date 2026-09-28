
document.documentElement.classList.add('js');
document.documentElement.classList.add('page-ready');
document.addEventListener('DOMContentLoaded', () => {
  const header=document.querySelector('.site-header');
  const nav=document.querySelector('.nav');
  const toggle=document.querySelector('.nav-toggle');
  const mega=document.querySelector('.mega');
  const trigger=document.querySelector('[data-services-trigger]');
  const motion=document.querySelector('[data-motion-toggle]');

  const syncHeader=()=>header?.classList.toggle('scrolled', window.scrollY>24);
  syncHeader();
  window.addEventListener('scroll',syncHeader,{passive:true});

  const closeMega=()=>{if(!mega)return;mega.classList.remove('is-open');trigger?.setAttribute('aria-expanded','false');};
  const openMega=(force)=>{if(!mega)return;const next=force ?? !mega.classList.contains('is-open');mega.classList.toggle('is-open',next);trigger?.setAttribute('aria-expanded',String(next));};
  trigger?.addEventListener('click',()=>{openMega();});
  trigger?.addEventListener('mouseenter',()=>{if(window.matchMedia('(hover:hover)').matches && !window.matchMedia('(max-width:1020px)').matches)openMega(true);});
  mega?.addEventListener('mouseleave',()=>{if(!window.matchMedia('(max-width:1020px)').matches)closeMega();});
  document.addEventListener('click',(e)=>{if(mega && !mega.contains(e.target) && !trigger?.contains(e.target) && !window.matchMedia('(max-width:1020px)').matches)closeMega();});

  toggle?.addEventListener('click',()=>{
    const isOpen=toggle.getAttribute('aria-expanded')==='true';
    toggle.setAttribute('aria-expanded',String(!isOpen));
    toggle.setAttribute('aria-label',isOpen?'Open menu':'Close menu');
    nav?.classList.toggle('is-mobile-open',!isOpen);
    document.body.classList.toggle('nav-open',!isOpen);
  });

  document.addEventListener('keydown',(e)=>{
    if(e.key==='Escape'){
      closeMega();
      if(nav?.classList.contains('is-mobile-open')) toggle?.click();
    }
  });

  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{if(nav.classList.contains('is-mobile-open'))toggle?.click();}));

  const reveals=document.querySelectorAll('.reveal,.reveal-group');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduced && 'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('in');observer.unobserve(entry.target);}
    }),{threshold:0.15});
    reveals.forEach(el=>observer.observe(el));
  }else{reveals.forEach(el=>el.classList.add('in'));}

  // Problem selector: one panel open at a time.
  const cards=[...document.querySelectorAll('.problem-card')];
  const panels=[...document.querySelectorAll('.problem-panel')];
  const placeholder=document.querySelector('.problem-placeholder');
  const openProblem=(key)=>{
    cards.forEach(card=>card.setAttribute('aria-expanded',String(card.dataset.problem===key)));
    panels.forEach(panel=>{panel.hidden=panel.dataset.problemPanel!==key;});
    if(placeholder)placeholder.hidden=true;
  };
  cards.forEach(card=>card.addEventListener('click',()=>openProblem(card.dataset.problem)));

  // FAQ / accordion groups.
  document.querySelectorAll('[data-accordion-group]').forEach(group=>{
    const buttons=[...group.querySelectorAll('[aria-controls]')];
    buttons.forEach(button=>button.addEventListener('click',()=>{
      const panel=document.getElementById(button.getAttribute('aria-controls'));
      const wasOpen=button.getAttribute('aria-expanded')==='true';
      buttons.forEach(other=>{
        other.setAttribute('aria-expanded','false');
        const target=document.getElementById(other.getAttribute('aria-controls'));
        if(target)target.hidden=true;
      });
      button.setAttribute('aria-expanded',String(!wasOpen));
      if(panel)panel.hidden=wasOpen;
    }));
  });

  // Ambient and bar animations pause when off-screen, hidden or manually paused.
  let paused=false;
  const setAnimatedState=(state)=>document.querySelectorAll('.flow,.bar').forEach(el=>{el.style.animationPlayState=state?'paused':'running';});
  motion?.addEventListener('click',()=>{
    paused=!paused;
    motion.setAttribute('aria-pressed',String(paused));
    motion.setAttribute('aria-label',paused?'Resume animations':'Pause animations');
    setAnimatedState(paused);
  });
  const ambient=document.querySelectorAll('.ambient');
  if('IntersectionObserver' in window){
    const ambientObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{entry.target.querySelectorAll('.flow').forEach(el=>el.style.animationPlayState=(entry.isIntersecting&&!paused)?'running':'paused');}));
    ambient.forEach(el=>ambientObserver.observe(el));
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)setAnimatedState(true);else if(!paused)setAnimatedState(false);});

  // Interactive chart hover/focus dimming.
  document.querySelectorAll('.chart-wrap').forEach(chart=>{
    const bars=[...chart.querySelectorAll('.bar')];
    bars.forEach(bar=>{
      const activate=()=>bars.forEach(b=>b.style.opacity=b===bar?'1':'0.6');
      const clear=()=>bars.forEach(b=>b.style.opacity='');
      bar.addEventListener('mouseenter',activate);
      bar.addEventListener('focus',activate);
      bar.addEventListener('mouseleave',clear);
      bar.addEventListener('blur',clear);
    });
  });

  // Static GitHub Pages form: validate, then prepare a mailto message.
  document.querySelectorAll('[data-lead-form]').forEach(form=>form.addEventListener('submit',(e)=>{
    e.preventDefault();
    let ok=true;
    form.querySelectorAll('[required]').forEach(input=>{
      const message=input.parentElement.querySelector('small');
      const value=input.value.trim();
      if(!value){ok=false;if(message)message.textContent='This field is required.';}
      else if(input.type==='email' && !/^\S+@\S+\.\S+$/.test(value)){ok=false;if(message)message.textContent='Enter a valid email address.';}
      else if(input.type==='url'){try{new URL(value);}catch{ok=false;if(message)message.textContent='Enter a valid website URL.';}}
      else if(message)message.textContent='';
    });
    const status=form.querySelector('.form-status');
    if(!ok){status.textContent='Please check the highlighted fields.';status.className='form-status error';return;}
    const data=new FormData(form);
    const subject=encodeURIComponent(`Vionix Growth Audit — ${data.get('business')||'New enquiry'}`);
    const body=encodeURIComponent([
      `Name: ${data.get('name')||''}`,`Business: ${data.get('business')||''}`,`Email: ${data.get('email')||''}`,
      `Phone/WhatsApp: ${data.get('phone')||''}`,`Website: ${data.get('website')||''}`,`Goal / challenge: ${data.get('challenge')||''}`
    ].join('\n'));
    status.textContent='Opening your email app…';status.className='form-status success';
    window.location.href=`mailto:vionixsupport@gmail.com?subject=${subject}&body=${body}`;
  }));

  document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
});
