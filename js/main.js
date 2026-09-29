
document.documentElement.classList.add('js');
(() => {
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(pointer:fine)');
  const root=document.documentElement, body=document.body;

  // Navigation
  const header=$('.site-header'), nav=$('.nav'), toggle=$('.nav-toggle'), mega=$('.mega'), trigger=$('[data-services-trigger]');
  const syncHeader=()=>header?.classList.toggle('scrolled',scrollY>24);
  addEventListener('scroll',syncHeader,{passive:true}); syncHeader();
  const closeMega=()=>{mega?.classList.remove('is-open');trigger?.setAttribute('aria-expanded','false')};
  const openMega=(v)=>{if(!mega)return;const n=v??!mega.classList.contains('is-open');mega.classList.toggle('is-open',n);trigger?.setAttribute('aria-expanded',String(n))};
  trigger?.addEventListener('click',()=>openMega());
  trigger?.addEventListener('mouseenter',()=>{if(fine.matches&&innerWidth>1020)openMega(true)});
  mega?.addEventListener('mouseleave',()=>{if(innerWidth>1020)closeMega()});
  document.addEventListener('click',e=>{if(mega&&!mega.contains(e.target)&&!trigger?.contains(e.target)&&innerWidth>1020)closeMega()});
  toggle?.addEventListener('click',()=>{
    const open=toggle.getAttribute('aria-expanded')==='true';
    toggle.setAttribute('aria-expanded',String(!open));toggle.setAttribute('aria-label',open?'Open menu':'Close menu');
    nav?.classList.toggle('is-mobile-open',!open);body.classList.toggle('nav-open',!open);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMega();if(nav?.classList.contains('is-mobile-open'))toggle?.click()}});
  $$('nav a').forEach(a=>a.addEventListener('click',()=>{if(nav?.classList.contains('is-mobile-open'))toggle?.click()}));

  // Scroll reveal
  const reveals=$$('.reveal,.reveal-group');
  if(!reduced.matches&&'IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
    reveals.forEach(x=>io.observe(x));
  } else reveals.forEach(x=>x.classList.add('in'));

  // Problem selector + accordions
  const cards=$$('.problem-card'), panels=$$('.problem-panel'), placeholder=$('.problem-placeholder');
  const openProblem=k=>{cards.forEach(c=>c.setAttribute('aria-expanded',String(c.dataset.problem===k)));panels.forEach(p=>p.hidden=p.dataset.problemPanel!==k);if(placeholder)placeholder.hidden=true};
  cards.forEach(c=>c.addEventListener('click',()=>openProblem(c.dataset.problem)));
  $$('[data-accordion-group]').forEach(g=>{
    const bs=$$('[aria-controls]',g);bs.forEach(b=>b.addEventListener('click',()=>{
      const p=$('#'+b.getAttribute('aria-controls')), was=b.getAttribute('aria-expanded')==='true';
      bs.forEach(o=>{o.setAttribute('aria-expanded','false');const t=$('#'+o.getAttribute('aria-controls'));if(t)t.hidden=true});
      b.setAttribute('aria-expanded',String(!was));if(p)p.hidden=was;
    }));
  });

  // Static GitHub Pages lead form
  $$('[data-lead-form]').forEach(form=>form.addEventListener('submit',e=>{
    e.preventDefault();let ok=true;
    $$('[required]',form).forEach(input=>{
      const msg=input.parentElement?.querySelector('small'),v=input.value.trim();
      if(!v){ok=false;if(msg)msg.textContent='This field is required.'}
      else if(input.type==='email'&&!/^\S+@\S+\.\S+$/.test(v)){ok=false;if(msg)msg.textContent='Enter a valid email address.'}
      else if(input.type==='url'){try{new URL(v)}catch{ok=false;if(msg)msg.textContent='Enter a valid website URL.'}}
      else if(msg)msg.textContent='';
    });
    const status=$('.form-status',form);if(!ok){if(status){status.textContent='Please check the highlighted fields.';status.className='form-status error'}return}
    const d=new FormData(form), subject=encodeURIComponent(`Vionix Growth Audit — ${d.get('business')||'New enquiry'}`);
    const msg=encodeURIComponent([`Name: ${d.get('name')||''}`,`Business: ${d.get('business')||''}`,`Email: ${d.get('email')||''}`,`Phone/WhatsApp: ${d.get('phone')||''}`,`Website: ${d.get('website')||''}`,`Goal / challenge: ${d.get('challenge')||''}`].join('\n'));
    if(status){status.textContent='Opening your email app…';status.className='form-status success'}
    location.href=`mailto:vionixsupport@gmail.com?subject=${subject}&body=${msg}`;
  }));
  $$('[data-year]').forEach(x=>x.textContent=new Date().getFullYear());

  // ============================================================
  // Shared Galactic animation engine. One requestAnimationFrame.
  // ============================================================
  const bg=$('.vx-living-canvas'), bgctx=bg?.getContext('2d',{alpha:true});
  const heroCanvas=$('.vx-hero-canvas'), hctx=heroCanvas?.getContext('2d',{alpha:true});
  const globeCanvas=$('.vx-globe-canvas'), gctx=globeCanvas?.getContext('2d',{alpha:true});
  const scene=body.dataset.scene||'quiet';
  let dpr=1,w=0,h=0,last=performance.now(),raf=0,paused=false,hidden=document.hidden,quality=1,avg=16,scrollVelocity=0,lastScroll=scrollY,t=0;
  let particles=[],stars=[],links=[],flowPackets=[],chaos=[],cursor={x:-9999,y:-9999,active:false};
  let heroState={yaw:0,pitch:.1,zoom:1,drag:false,lx:0,ly:0};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const resizeCanvas=(c,ctx)=>{
    if(!c||!ctx)return;
    const r=c.getBoundingClientRect(), ww=Math.max(1,r.width||innerWidth), hh=Math.max(1,r.height||innerHeight);
    c.width=Math.floor(ww*Math.min(devicePixelRatio||1,2));c.height=Math.floor(hh*Math.min(devicePixelRatio||1,2));
    ctx.setTransform(Math.min(devicePixelRatio||1,2),0,0,Math.min(devicePixelRatio||1,2),0,0);return [ww,hh];
  };
  const resize=()=>{dpr=Math.min(devicePixelRatio||1,2);[w,h]=resizeCanvas(bg,bgctx)||[innerWidth,innerHeight];resizeCanvas(heroCanvas,hctx);resizeCanvas(globeCanvas,gctx);seed()};
  const palette=()=>({
    cyan:'#22E4FF',aqua:'#4FF3E0',blue:'#2F6BFF',violet:'#7B3FE4',gold:'#FFB547',
    line:'rgba(100,145,255,.18)',dim:'rgba(34,228,255,.45)'
  });
  const seed=()=>{
    particles=[];stars=[];links=[];flowPackets=[];chaos=[];
    const mobile=innerWidth<700, cores=navigator.hardwareConcurrency||8;
    const target=mobile?650:Math.min(1800,cores<=4?1500:1800)*quality;
    for(let i=0;i<target;i++)particles.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.18,vy:(Math.random()-.5)*.18,r:Math.random()<.88?.65+Math.random()*1.2:1.5+Math.random()*1.4,c:Math.random()<.58?0:1});
    for(let i=0;i<(mobile?80:180);i++)stars.push({x:Math.random()*w,y:Math.random()*h,r:.25+Math.random()*1.1,a:.15+Math.random()*.45});
    for(let i=0;i<10;i++)flowPackets.push({p:Math.random(),lane:i%4});
    for(let i=0;i<100;i++)chaos.push({x:Math.random(),y:Math.random(),tx:.18+(i%10)*.07,ty:.25+Math.floor(i/10)*.055,seed:Math.random()*6.28});
  };
  const drawBackground=(dt)=>{
    if(!bgctx)return;
    bgctx.clearRect(0,0,w,h);const p=palette();
    // sparse starfield
    stars.forEach(s=>{bgctx.fillStyle=`rgba(180,210,255,${s.a})`;bgctx.beginPath();bgctx.arc(s.x,s.y,s.r,0,Math.PI*2);bgctx.fill()});
    // perspective horizon/grid, strongest toward bottom
    const hy=h*.76;bgctx.strokeStyle='rgba(80,120,255,.08)';bgctx.lineWidth=1;
    for(let i=-12;i<=12;i++){bgctx.beginPath();bgctx.moveTo(w/2+i*20,hy);bgctx.lineTo(w/2+i*w*.13,h);bgctx.stroke()}
    for(let j=0;j<9;j++){const y=hy+Math.pow(j/8,2)*(h-hy);bgctx.beginPath();bgctx.moveTo(0,y);bgctx.lineTo(w,y);bgctx.stroke()}
    // particle neural network with local neighbor scan (no O(n²))
    const cell=Math.max(55,Math.min(95,w*.055)), grid=new Map();
    particles.forEach((q,i)=>{q.x+=q.vx*(1+scrollVelocity*.006)*dt;q.y+=q.vy*(1+scrollVelocity*.006)*dt;if(q.x<-10)q.x=w+10;if(q.x>w+10)q.x=-10;if(q.y<-10)q.y=h+10;if(q.y>h+10)q.y=-10;
      const cx=Math.floor(q.x/cell),cy=Math.floor(q.y/cell),key=cx+','+cy;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(i)
    });
    particles.forEach((q,i)=>{
      const cx=Math.floor(q.x/cell),cy=Math.floor(q.y/cell);
      for(let gx=cx-1;gx<=cx+1;gx++)for(let gy=cy-1;gy<=cy+1;gy++){
        const arr=grid.get(gx+','+gy);if(!arr)continue;
        for(const j of arr){if(j<=i)continue;const r=particles[j],dx=r.x-q.x,dy=r.y-q.y,d=Math.hypot(dx,dy);if(d<cell*.72){bgctx.strokeStyle=`rgba(${q.c?'123,63,228':'34,228,255'},${.13*(1-d/(cell*.72))})`;bgctx.beginPath();bgctx.moveTo(q.x,q.y);bgctx.lineTo(r.x,r.y);bgctx.stroke()}}
      }
      const dx=q.x-cursor.x,dy=q.y-cursor.y,dist=Math.hypot(dx,dy);
      if(cursor.active&&fine.matches&&dist<130){const force=(1-dist/130)*.018;q.x+=dx/dist*force*30;q.y+=dy/dist*force*30}
      bgctx.fillStyle=q.c?p.violet:p.cyan;bgctx.globalAlpha=.35+.45*(1-dist/220);bgctx.beginPath();bgctx.arc(q.x,q.y,q.r,0,Math.PI*2);bgctx.fill();bgctx.globalAlpha=1
    });
    // data-flow packets: Traffic → Leads → Customers → Repeat
    const lanes=[.12,.28,.44,.60];lanes.forEach((yy,i)=>{const y=h*yy;bgctx.strokeStyle=`rgba(34,228,255,.12)`;bgctx.beginPath();bgctx.moveTo(w*.1,y);bgctx.bezierCurveTo(w*.35,y-25,w*.65,y+25,w*.9,y);bgctx.stroke()});
    flowPackets.forEach((pk,i)=>{pk.p=(pk.p+dt*.00003*(1+scrollVelocity*.03))%1;const y=h*lanes[pk.lane],x=w*(.1+.8*pk.p);bgctx.fillStyle=i%2?p.violet:p.cyan;bgctx.shadowBlur=10;bgctx.shadowColor=bgctx.fillStyle;bgctx.beginPath();bgctx.arc(x,y,2.3,0,Math.PI*2);bgctx.fill();bgctx.shadowBlur=0});
  };
  const projectSphere=(lat,lon,r,cx,cy,yaw,pitch,zoom)=>{
    const la=lat*Math.PI/180,lo=lon*Math.PI/180+yaw, x=Math.cos(la)*Math.cos(lo), z=Math.cos(la)*Math.sin(lo), y=Math.sin(la);
    const yp=y*Math.cos(pitch)-z*Math.sin(pitch),zp=y*Math.sin(pitch)+z*Math.cos(pitch);
    return {x:cx+x*r*zoom,y:cy-yp*r*zoom,z:zp};
  };
  const drawGlobe=(ctx,cw,ch,small=false)=>{
    if(!ctx)return;ctx.clearRect(0,0,cw,ch);const p=palette(),cx=cw/2,cy=ch/2,r=Math.min(cw,ch)*.29*heroState.zoom;
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(let lat=-75;lat<=75;lat+=15)for(let lon=-180;lon<180;lon+=15){const q=projectSphere(lat,lon,r,cx,cy,heroState.yaw+t*.045,heroState.pitch,1);if(q.z<-.15)continue;ctx.fillStyle=q.z>.4?'rgba(34,228,255,.75)':'rgba(123,63,228,.3)';ctx.beginPath();ctx.arc(q.x,q.y,q.z>.4?1.25:.8,0,Math.PI*2);ctx.fill()}
    // simplified land-like procedural clusters (not image data)
    const markets=[['Europe',50,10],['Australia',-25,135],['UAE',24,54],['Qatar',25.3,51.5],['Bangladesh',24,90]];
    markets.forEach((m,i)=>{const q=projectSphere(m[1],m[2],r,cx,cy,heroState.yaw+t*.045,heroState.pitch,1);if(q.z<-.05)return;ctx.fillStyle=i%2?p.violet:p.cyan;ctx.shadowBlur=18;ctx.shadowColor=ctx.fillStyle;ctx.beginPath();ctx.arc(q.x,q.y,3.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0});
    ctx.strokeStyle='rgba(34,228,255,.18)';ctx.lineWidth=1;
    for(let a=0;a<3;a++){ctx.beginPath();ctx.ellipse(cx,cy,r*(1.18+a*.12),r*(.32+a*.05),a*.5,0,Math.PI*2);ctx.stroke()}
    // arcs
    const pts=markets.map(m=>projectSphere(m[1],m[2],r,cx,cy,heroState.yaw+t*.045,heroState.pitch,1));
    for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];if(a.z<-.1||b.z<-.1)continue;ctx.strokeStyle=i%2?'rgba(123,63,228,.55)':'rgba(34,228,255,.55)';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2-r*.55,b.x,b.y);ctx.stroke()}
    ctx.restore();
  };
  const drawRocketChart=(ctx,cw,ch)=>{
    if(!ctx)return;const p=palette(),base=ch*.82,left=cw*.18;ctx.save();
    ctx.strokeStyle='rgba(120,160,255,.16)';ctx.lineWidth=1;for(let i=0;i<5;i++){const y=base-i*ch*.13;ctx.beginPath();ctx.moveTo(cw*.1,y);ctx.lineTo(cw*.92,y);ctx.stroke()}
    ctx.strokeStyle=p.cyan;ctx.lineWidth=3;ctx.shadowBlur=14;ctx.shadowColor=p.cyan;ctx.beginPath();for(let i=0;i<=60;i++){const u=i/60,x=left+u*cw*.67,y=base-u*u*ch*.52-Math.sin(u*9+t*.8)*3;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();ctx.shadowBlur=0;
    const u=(Math.sin(t*.7)+1)/2,x=left+u*cw*.67,y=base-u*u*ch*.52;
    // rocket geometry
    ctx.save();ctx.translate(x,y-20);ctx.rotate(-.28);ctx.fillStyle=p.violet;ctx.beginPath();ctx.ellipse(0,0,12,30,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=p.cyan;ctx.beginPath();ctx.arc(0,-9,5,0,Math.PI*2);ctx.fill();ctx.fillStyle=p.gold;ctx.beginPath();ctx.moveTo(-5,27);ctx.lineTo(0,47+Math.sin(t*8)*5);ctx.lineTo(5,27);ctx.closePath();ctx.fill();ctx.restore();
    ctx.fillStyle=p.gold;ctx.font='800 11px Manrope,system-ui';ctx.fillText('Illustrative example',cw*.64,ch*.15);
    ctx.restore();
  };
  const drawFunnel=(ctx,cw,ch)=>{
    if(!ctx)return;const p=palette(),cx=cw*.5;ctx.save();const labels=['Traffic','Leads','Qualified','Sales'];for(let i=0;i<4;i++){const top=ch*.2+i*ch*.14,width=cw*(.72-i*.14),bot=width*.78;ctx.fillStyle=`rgba(${i<2?'34,228,255':'123,63,228'},${.09+i*.025})`;ctx.strokeStyle=i<2?p.cyan:p.violet;ctx.beginPath();ctx.moveTo(cx-width/2,top);ctx.lineTo(cx+width/2,top);ctx.lineTo(cx+bot/2,top+ch*.11);ctx.lineTo(cx-bot/2,top+ch*.11);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=p.text||'#EAF4FF';ctx.font='700 12px Manrope';ctx.fillText(labels[i],cx-ctx.measureText(labels[i]).width/2,top+ch*.065)}
    for(let i=0;i<18;i++){const u=(i/18+t*.12)%1,x=cx+(Math.sin(i*7.3)*.35)*cw*.2,y=ch*.12+u*ch*.58;ctx.fillStyle=i%2?p.violet:p.cyan;ctx.beginPath();ctx.arc(x,y,1.8,0,Math.PI*2);ctx.fill()}
    ctx.restore();
  };
  const drawChaos=(ctx,cw,ch)=>{
    if(!ctx)return;const p=palette(),order=(Math.sin(t*.35)+1)/2;ctx.save();
    chaos.forEach((q,i)=>{const x=(q.x+(Math.sin(t*.35+q.seed)*.04)*(1-order))*cw,y=(q.y+(Math.cos(t*.29+q.seed)*.04)*(1-order))*ch,tx=q.tx*cw,ty=q.ty*ch,xx=x+(tx-x)*order*.9,yy=y+(ty-y)*order*.9;ctx.fillStyle=i%2?p.violet:p.cyan;ctx.globalAlpha=.22+.5*order;ctx.beginPath();ctx.arc(xx,yy,1.5,0,Math.PI*2);ctx.fill();if(i%10===0){ctx.strokeStyle='rgba(34,228,255,.18)';ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx+22*order,yy-10*order);ctx.stroke()}});ctx.globalAlpha=1;
    if(order>.72){ctx.strokeStyle=p.cyan;ctx.lineWidth=3;ctx.shadowBlur=14;ctx.shadowColor=p.cyan;ctx.beginPath();ctx.moveTo(cw*.2,ch*.72);ctx.lineTo(cw*.45,ch*.55);ctx.lineTo(cw*.62,ch*.6);ctx.lineTo(cw*.82,ch*.27);ctx.stroke();ctx.shadowBlur=0}ctx.restore();
  };
  const drawHero=(dt)=>{
    if(!hctx||!heroCanvas)return;const r=heroCanvas.getBoundingClientRect(),cw=r.width,ch=r.height;hctx.clearRect(0,0,cw,ch);
    drawGlobe(hctx,cw,ch);drawRocketChart(hctx,cw,ch);
    // orbit/radar pulses
    hctx.strokeStyle=`rgba(34,228,255,${.1+.06*Math.sin(t*1.4)})`;hctx.beginPath();hctx.arc(cw*.5,ch*.5,Math.min(cw,ch)*.39+Math.sin(t)*6,0,Math.PI*2);hctx.stroke();
  };
  const drawGlobal=(dt)=>{
    if(!gctx||!globeCanvas)return;const r=globeCanvas.getBoundingClientRect();drawGlobe(gctx,r.width,r.height,true)
  };

  // Pointer interactions for background, hero globe, magnetic links and 3D cards
  addEventListener('pointermove',e=>{cursor.x=e.clientX;cursor.y=e.clientY;cursor.active=true;root.style.setProperty('--vx-scroll-h',String(clamp(scrollY/document.body.scrollHeight*12,-6,6)))},{passive:true});
  addEventListener('pointerleave',()=>cursor.active=false);
  if(heroCanvas){
    heroCanvas.addEventListener('pointerdown',e=>{heroState.drag=true;heroState.lx=e.clientX;heroState.ly=e.clientY;heroCanvas.setPointerCapture?.(e.pointerId)});
    heroCanvas.addEventListener('pointermove',e=>{if(heroState.drag){heroState.yaw+=(e.clientX-heroState.lx)*.008;heroState.pitch=clamp(heroState.pitch+(e.clientY-heroState.ly)*.005,-1,1);heroState.lx=e.clientX;heroState.ly=e.clientY}});
    heroCanvas.addEventListener('pointerup',()=>heroState.drag=false);heroCanvas.addEventListener('pointercancel',()=>heroState.drag=false);
    heroCanvas.addEventListener('wheel',e=>{e.preventDefault();heroState.zoom=clamp(heroState.zoom-e.deltaY*.0007,.78,1.3)},{passive:false});
  }
  if(globeCanvas){globeCanvas.addEventListener('pointerdown',e=>{heroState.drag=true;heroState.lx=e.clientX;heroState.ly=e.clientY;globeCanvas.setPointerCapture?.(e.pointerId)});globeCanvas.addEventListener('pointermove',e=>{if(heroState.drag){heroState.yaw+=(e.clientX-heroState.lx)*.008;heroState.pitch=clamp(heroState.pitch+(e.clientY-heroState.ly)*.005,-1,1);heroState.lx=e.clientX;heroState.ly=e.clientY}});globeCanvas.addEventListener('pointerup',()=>heroState.drag=false);globeCanvas.addEventListener('wheel',e=>{e.preventDefault();heroState.zoom=clamp(heroState.zoom-e.deltaY*.0007,.75,1.35)},{passive:false})}

  // Magnetic cursor, desktop only
  let cursorEl,trailEls=[];
  if(fine.matches&&!reduced.matches){
    cursorEl=document.createElement('div');cursorEl.className='vx-cursor';document.body.appendChild(cursorEl);
    for(let i=0;i<5;i++){const q=document.createElement('div');q.className='vx-cursor-trail';document.body.appendChild(q);trailEls.push(q)}
    let mx=0,my=0,tx=0,ty=0;
    addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;cursorEl.classList.add('is-on')},{passive:true});
    const magnetic=()=>{tx+=(mx-tx)*.22;ty+=(my-ty)*.22;let target=document.elementFromPoint(mx,my)?.closest('a,button');if(target&&target.getBoundingClientRect()){const r=target.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=cx-mx,dy=cy-my,d=Math.hypot(dx,dy);if(d<100){tx+=(dx*.14);ty+=(dy*.14);target.style.setProperty('--mag-x',`${clamp(dx*.035,-4,4)}px`);target.style.setProperty('--mag-y',`${clamp(dy*.035,-4,4)}px`);target.classList.add('magnetic-active')}else target.classList.remove('magnetic-active')}
      cursorEl.style.transform=`translate3d(${tx-4}px,${ty-4}px,0)`;trailEls.forEach((q,i)=>{const rr=.08*(i+1);q.style.transform=`translate3d(${mx+(tx-mx)*rr-2}px,${my+(ty-my)*rr-2}px,0)`});requestAnimationFrame(magnetic)};magnetic();
    document.addEventListener('mouseleave',()=>cursorEl?.classList.remove('is-on'));
  }
  $$('.card,.service-card,.package').forEach(card=>{
    if(!fine.matches||reduced.matches)return;
    card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,rx=((y/r.height)-.5)*-10,ry=((x/r.width)-.5)*10;card.style.transform=`translateY(-4px) perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`});
    card.addEventListener('pointerleave',()=>card.style.transform='');
  });

  // pause control persists across pages
  const motion=$('[data-motion-toggle]');
  const saved=localStorage.getItem('vionixAnimationsPaused')==='1';paused=saved;
  if(motion){motion.setAttribute('aria-pressed',String(paused));motion.setAttribute('aria-label',paused?'Resume animations':'Pause animations');motion.textContent=paused?'▶':'Ⅱ';
    motion.addEventListener('click',()=>{paused=!paused;localStorage.setItem('vionixAnimationsPaused',paused?'1':'0');motion.setAttribute('aria-pressed',String(paused));motion.setAttribute('aria-label',paused?'Resume animations':'Pause animations');motion.textContent=paused?'▶':'Ⅱ';if(!paused)start();});
  }
  document.addEventListener('visibilitychange',()=>{hidden=document.hidden;if(!hidden)start()});
  reduced.addEventListener?.('change',()=>{if(reduced.matches)stop();else start()});
  addEventListener('scroll',()=>{scrollVelocity=Math.abs(scrollY-lastScroll);lastScroll=scrollY;root.style.setProperty('--vx-scroll-h',String(clamp(scrollY/Math.max(1,document.body.scrollHeight-innerHeight)*12,-6,6)))},{passive:true});

  const frame=now=>{
    raf=0;if(hidden||paused||reduced.matches)return;const dt=Math.min(40,now-last);last=now;t+=dt/1000;scrollVelocity*=.91;
    drawBackground(dt);drawHero(dt);drawGlobal(dt);
    avg=avg*.94+dt*.06;if(avg>20&&quality>.55){quality*=.82;seed()}start();
  };
  function start(){if(raf||hidden||paused||reduced.matches)return;raf=requestAnimationFrame(frame)}
  function stop(){if(raf){cancelAnimationFrame(raf);raf=0}}
  addEventListener('resize',resize,{passive:true});
  resize();
  if(!reduced.matches&&!paused){if('requestIdleCallback'in window)requestIdleCallback(start,{timeout:900});else setTimeout(start,180)}

  // Add tiny particle burst around social icons on hover/focus.
  $$('.social-icon').forEach(el=>{const burst=()=>{for(let i=0;i<5;i++){const p=document.createElement('i');p.className='social-particle';p.style.setProperty('--a',`${i*72}deg`);el.appendChild(p);setTimeout(()=>p.remove(),450)}};el.addEventListener('mouseenter',burst);el.addEventListener('focus',burst)});

  // Make all buttons magnetic with a small CSS offset, without touching text fields.
  const style=document.createElement('style');style.textContent='.magnetic-active{transform:translate3d(var(--mag-x,0),var(--mag-y,0),0) scale(1.04)!important}.social-particle{position:absolute;width:3px;height:3px;border-radius:50%;background:var(--cyan);left:50%;top:50%;pointer-events:none;animation:vxParticle .45s ease-out forwards;transform:rotate(var(--a)) translateX(0)}@keyframes vxParticle{to{transform:rotate(var(--a)) translateX(25px);opacity:0}}';document.head.appendChild(style);
})();
