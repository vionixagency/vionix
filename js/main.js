/* ================================================================
   VIONIX VISUAL ENGINE
   One shared animation system. Keep scene functions independent.
   ================================================================ */
(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const root=document.documentElement, body=document.body;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), fine=matchMedia('(pointer:fine)');
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const scenes=(body.dataset.scene||'home').split(/\s+/);
  const links=location.pathname;

  // ---------------- Header / navigation ----------------
  const header=$('.site-header'), nav=$('.nav'), toggle=$('.nav-toggle'), trigger=$('[data-services-trigger]'), mega=$('#services-mega');
  const closeMega=()=>{mega?.classList.remove('is-open');trigger?.setAttribute('aria-expanded','false')};
  trigger?.addEventListener('click',e=>{e.preventDefault();const open=mega.classList.toggle('is-open');trigger.setAttribute('aria-expanded',String(open))});
  toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu');body.classList.toggle('nav-open',open)});
  document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMega()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMega();nav?.classList.remove('is-open');toggle?.setAttribute('aria-expanded','false');body.classList.remove('nav-open')}});
  addEventListener('scroll',()=>header?.classList.toggle('scrolled',scrollY>18),{passive:true});

  // ---------------- Accessible interaction ----------------
  $$('.faq-q').forEach(q=>q.addEventListener('click',()=>{const a=$('#'+q.getAttribute('aria-controls'));const open=q.getAttribute('aria-expanded')==='true';q.setAttribute('aria-expanded',String(!open));if(a)a.hidden=open}));
  $$('[data-problem]').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.problem;$$('[data-problem]').forEach(x=>x.setAttribute('aria-expanded',String(x===btn)));$$('[data-problem-panel]').forEach(p=>p.hidden=p.dataset.problemPanel!==key);const empty=$('.problem-placeholder');if(empty)empty.hidden=true}));
  const form=$('[data-lead-form]');
  form?.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(form);const req=['name','business','email','website'];let ok=true;$$('small',form).forEach(x=>x.textContent='');req.forEach(k=>{const el=form.elements[k];if(!el?.value.trim()){ok=false;el?.nextElementSibling&&(el.nextElementSibling.textContent='Required')} });if(!ok)return;const bodyText=[`Name: ${data.get('name')}`,`Business: ${data.get('business')}`,`Email: ${data.get('email')}`,`Phone/WhatsApp: ${data.get('phone')||''}`,`Website: ${data.get('website')}`,`Challenge: ${data.get('challenge')||''}`].join('\n');location.href=`mailto:vionixsupport@gmail.com?subject=${encodeURIComponent('Vionix Free Growth Audit')}&body=${encodeURIComponent(bodyText)}`;const status=$('.form-status',form);if(status)status.textContent='Your email app should open with the enquiry prepared.'});
  $$('[data-year]').forEach(x=>x.textContent=new Date().getFullYear());

  // ---------------- Reveal system ----------------
  const revealObserver='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');revealObserver.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -40px'}):null;
  $$('.reveal,.reveal-group').forEach(el=>revealObserver?.observe(el));
  if(!revealObserver)$$('.reveal,.reveal-group').forEach(el=>el.classList.add('in'));

  // ---------------- Shared animation engine ----------------
  const bg=$('.vx-living-canvas');
  const heroCanvas=$('.vx-hero-canvas');
  const globeCanvas=$('.vx-globe-canvas');
  const growthCanvas=$('.growth-chart-canvas');
  const funnelCanvas=$('.funnel-canvas');
  const ctx=bg?.getContext('2d',{alpha:true});
  const hctx=heroCanvas?.getContext('2d',{alpha:true});
  const gctx=globeCanvas?.getContext('2d',{alpha:true});
  const grctx=growthCanvas?.getContext('2d',{alpha:true});
  const fctx=funnelCanvas?.getContext('2d',{alpha:true});
  let dpr=1, raf=0, last=performance.now(), t=0, avg=16, paused=localStorage.getItem('vionixAnimationsPaused')==='1', hidden=document.hidden;
  let scrollVelocity=0,lastScroll=scrollY, quality=1;
  const pointer={x:innerWidth*.5,y:innerHeight*.5,active:false};
  const heroState={yaw:-.35,pitch:.05,zoom:1,drag:false,lx:0,ly:0};
  const palette={space:'#03050F',blue:'#2F6BFF',cyan:'#22E4FF',aqua:'#4FF3E0',violet:'#7B3FE4',gold:'#FFB547',text:'#EAF4FF',muted:'#9DB2DA'};

  // Simplified coded land polygons: longitude/latitude pairs, not an image texture.
  const land=[
    [[-168,70],[-150,62],[-135,58],[-125,50],[-120,36],[-111,31],[-104,24],[-96,18],[-87,21],[-81,29],[-76,40],[-68,47],[-58,51],[-63,60],[-80,72],[-110,74],[-140,72]],
    [[-82,12],[-74,7],[-66,8],[-60,2],[-57,-8],[-51,-18],[-55,-32],[-64,-48],[-72,-54],[-78,-39],[-82,-18]],
    [[-10,36],[2,42],[18,47],[31,53],[45,54],[57,48],[72,47],[87,42],[102,50],[121,49],[137,42],[151,49],[166,56],[176,47],[169,34],[154,25],[142,18],[127,8],[115,1],[101,8],[91,20],[78,18],[68,9],[56,10],[47,2],[39,8],[31,20],[19,28],[7,30]],
    [[-17,35],[-5,37],[8,31],[19,19],[27,8],[34,-5],[31,-18],[23,-31],[12,-35],[3,-30],[-6,-20],[-13,-4],[-17,14]],
    [[113,-11],[126,-12],[139,-18],[151,-27],[153,-39],[143,-43],[129,-39],[117,-33],[110,-22]],
    [[-54,60],[-45,64],[-39,71],[-50,78],[-63,73]]
  ];
  const markets=[{name:'Europe',lon:12,lat:50},{name:'Australia',lon:134,lat:-25},{name:'UAE',lon:54,lat:24},{name:'Qatar',lon:51,lat:25.3},{name:'Bangladesh',lon:90.4,lat:23.7}];
  const seedPoints=()=>{const n=innerWidth<700?Math.round(700*quality):Math.round(1900*quality);const arr=[];for(let i=0;i<n;i++)arr.push({x:Math.random(),y:Math.random(),z:Math.random(),vx:(Math.random()-.5)*.0007,vy:(Math.random()-.5)*.0007,r:Math.random()*1.25+.35,h:Math.random()<.52?0:1});return arr};
  let points=seedPoints();
  const chaos=Array.from({length:90},(_,i)=>({x:Math.random(),y:Math.random(),tx:.18+(i/90)*.66,ty:.74-(i/90)*.52,seed:Math.random()*20}));

  function sizeCanvas(c){if(!c)return null;const r=c.getBoundingClientRect();const w=Math.max(1,r.width),h=Math.max(1,r.height);const px=Math.min(2,devicePixelRatio||1);if(c.width!==Math.round(w*px)||c.height!==Math.round(h*px)){c.width=Math.round(w*px);c.height=Math.round(h*px)}const x=c.getContext('2d');x.setTransform(px,0,0,px,0,0);return {w,h,px}}
  function resize(){sizeCanvas(bg);sizeCanvas(heroCanvas);sizeCanvas(globeCanvas);sizeCanvas(growthCanvas);sizeCanvas(funnelCanvas)}
  addEventListener('resize',resize,{passive:true});resize();

  function projectSphere(lon,lat,r,cx,cy,yaw,pitch,zoom=1){
    const la=lat*Math.PI/180, lo=(lon*Math.PI/180)+yaw;let x=Math.cos(la)*Math.sin(lo),y=Math.sin(la),z=Math.cos(la)*Math.cos(lo);
    const yp=y*Math.cos(pitch)-z*Math.sin(pitch),zp=y*Math.sin(pitch)+z*Math.cos(pitch);return{x:cx+x*r*zoom,y:cy-yp*r*zoom,z:zp};
  }
  function drawPlanet(c,w,h,opts={}){
    const cx=w*(opts.cx??.55),cy=h*(opts.cy??.5),r=Math.min(w,h)*.30*(opts.zoom??1),yaw=opts.yaw??heroState.yaw,pitch=opts.pitch??heroState.pitch;
    c.save();
    // Atmosphere + shaded sphere
    const grad=c.createRadialGradient(cx-r*.35,cy-r*.42,r*.05,cx,cy,r*1.04);grad.addColorStop(0,'rgba(93,190,255,.25)');grad.addColorStop(.42,'rgba(47,107,255,.13)');grad.addColorStop(.76,'rgba(42,26,110,.18)');grad.addColorStop(1,'rgba(3,5,15,0)');c.fillStyle=grad;c.beginPath();c.arc(cx,cy,r*1.14,0,Math.PI*2);c.fill();
    c.shadowColor='rgba(34,228,255,.26)';c.shadowBlur=24;c.strokeStyle='rgba(34,228,255,.48)';c.lineWidth=1.5;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.stroke();c.shadowBlur=0;
    // latitude/longitude wireframe
    c.strokeStyle='rgba(79,243,224,.10)';c.lineWidth=.65;for(let lat=-60;lat<=60;lat+=20){const q=[];for(let lon=-180;lon<=180;lon+=5)q.push(projectSphere(lon,lat,r,cx,cy,yaw,pitch));c.beginPath();q.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke()}for(let lon=-150;lon<=150;lon+=30){const q=[];for(let lat=-90;lat<=90;lat+=4)q.push(projectSphere(lon,lat,r,cx,cy,yaw,pitch));c.beginPath();q.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke()}
    // coded land masses
    land.forEach(poly=>{const q=poly.map(([lo,la])=>projectSphere(lo,la,r,cx,cy,yaw,pitch));if(q.every(p=>p.z<-.05))return;c.beginPath();q.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle='rgba(34,228,255,.10)';c.strokeStyle='rgba(34,228,255,.32)';c.lineWidth=1.1;c.fill();c.stroke()});
    // day/night rim
    const rim=c.createRadialGradient(cx-r*.45,cy-r*.45,r*.1,cx,cy,r*1.1);rim.addColorStop(.65,'rgba(0,0,0,0)');rim.addColorStop(.92,'rgba(34,228,255,.13)');rim.addColorStop(1,'rgba(123,63,228,.20)');c.fillStyle=rim;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.fill();
    // orbit ring and satellite
    c.save();c.translate(cx,cy);c.rotate(-.23);c.strokeStyle='rgba(34,228,255,.34)';c.lineWidth=1.2;c.beginPath();c.ellipse(0,0,r*1.28,r*.34,0,0,Math.PI*2);c.stroke();c.strokeStyle='rgba(123,63,228,.28)';c.beginPath();c.ellipse(0,0,r*1.42,r*.18,0,0,Math.PI*2);c.stroke();const sa=t*.28;const sx=Math.cos(sa)*r*1.28,sy=Math.sin(sa)*r*.34;c.fillStyle=palette.gold;c.shadowColor=palette.gold;c.shadowBlur=14;c.beginPath();c.arc(sx,sy,3.2,0,Math.PI*2);c.fill();c.shadowBlur=0;c.strokeStyle='rgba(255,181,71,.38)';c.beginPath();c.moveTo(sx-11,sy);c.lineTo(sx+11,sy);c.stroke();c.restore();
    // markets
    markets.forEach((m,i)=>{const p=projectSphere(m.lon,m.lat,r,cx,cy,yaw,pitch);if(p.z<-.12)return;const pulse=1+Math.sin(t*2+i)*.28;c.fillStyle=i%2?palette.violet:palette.cyan;c.shadowColor=i%2?palette.violet:palette.cyan;c.shadowBlur=15;c.beginPath();c.arc(p.x,p.y,3.1*pulse,0,Math.PI*2);c.fill();c.shadowBlur=0;c.strokeStyle='rgba(34,228,255,.18)';c.beginPath();c.arc(p.x,p.y,8+pulse*4,0,Math.PI*2);c.stroke()});
    c.restore();
  }
  function drawBackground(){if(!ctx)return;const s=sizeCanvas(bg);if(!s)return;const {w,h}=s;ctx.clearRect(0,0,w,h);ctx.fillStyle='rgba(3,5,15,.10)';ctx.fillRect(0,0,w,h);const grid=new Map(),cell=75;points.forEach((p,i)=>{p.x+=p.vx*(1+scrollVelocity*.018);p.y+=p.vy*(1+scrollVelocity*.018);if(p.x<0||p.x>1)p.vx*=-1;if(p.y<0||p.y>1)p.vy*=-1;const dx=pointer.x/w-p.x,dy=pointer.y/h-p.y,d=Math.hypot(dx,dy);if(pointer.active&&d<.12){p.x+=dx*.0016;p.y+=dy*.0016}const gx=Math.floor(p.x*w/cell),gy=Math.floor(p.y*h/cell),key=gx+':'+gy;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(i)});
    ctx.lineWidth=.55;points.forEach((p,i)=>{const gx=Math.floor(p.x*w/cell),gy=Math.floor(p.y*h/cell);for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){const a=grid.get((gx+ox)+':'+(gy+oy));if(!a)continue;a.forEach(j=>{if(j<=i)return;const q=points[j],dx=(p.x-q.x)*w,dy=(p.y-q.y)*h,d=Math.hypot(dx,dy);if(d<82){ctx.strokeStyle=p.h?'rgba(123,63,228,.12)':'rgba(34,228,255,.12)';ctx.beginPath();ctx.moveTo(p.x*w,p.y*h);ctx.lineTo(q.x*w,q.y*h);ctx.stroke()}})}});
    points.forEach(p=>{ctx.fillStyle=p.h?'rgba(123,63,228,.72)':'rgba(34,228,255,.76)';ctx.beginPath();ctx.arc(p.x*w,p.y*h,p.r,0,Math.PI*2);ctx.fill()});
    // subtle perspective horizon
    ctx.strokeStyle='rgba(120,160,255,.055)';ctx.lineWidth=1;const hy=h*.78;for(let i=-10;i<=10;i++){ctx.beginPath();ctx.moveTo(w*.5,hy);ctx.lineTo(w*(.5+i*.13),h);ctx.stroke()}for(let j=0;j<9;j++){const y=hy+Math.pow(j/8,1.8)*(h-hy);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  }
  function drawRocket(c,w,h){
    const baseY=h*.77, pathX=w*.18, pathW=w*.62;let u=(Math.sin(t*.42-.8)+1)/2;u=u*u*(3-2*u);const x=pathX+u*pathW,y=baseY-u*u*h*.48;const slope=-.18-0.65*u; c.save();
    // chart grid
    c.strokeStyle='rgba(120,160,255,.12)';c.lineWidth=1;for(let i=0;i<5;i++){const yy=baseY-i*h*.12;c.beginPath();c.moveTo(w*.08,yy);c.lineTo(w*.92,yy);c.stroke()}
    // chart curve
    c.strokeStyle=palette.cyan;c.shadowColor=palette.cyan;c.shadowBlur=12;c.lineWidth=3;c.beginPath();for(let i=0;i<=80;i++){const q=i/80,xx=pathX+q*pathW,yy=baseY-q*q*h*.48;i?c.lineTo(xx,yy):c.moveTo(xx,yy)}c.stroke();c.shadowBlur=0;
    // rocket flame trail
    for(let i=0;i<18;i++){const q=i/18,tx=x-Math.cos(slope)*q*34,ty=y-Math.sin(slope)*q*34+q*q*24; c.globalAlpha=(1-q)*.25;c.fillStyle=i%3===0?palette.gold:palette.cyan;c.beginPath();c.arc(tx,ty,1.5+q*2,0,Math.PI*2);c.fill()}c.globalAlpha=1;
    // smoke plume
    for(let i=0;i<12;i++){const q=i/12,tx=x-12+Math.sin(i*2.4+t*1.5)*6-q*18,ty=y+22+q*28; c.fillStyle=`rgba(157,178,218,${.10*(1-q)})`;c.beginPath();c.arc(tx,ty,3+q*7,0,Math.PI*2);c.fill()}
    // realistic-ish rocket body
    c.translate(x,y);c.rotate(slope);c.shadowColor='rgba(34,228,255,.35)';c.shadowBlur=16;c.fillStyle='#DCEBFF';c.beginPath();c.moveTo(0,-28);c.bezierCurveTo(11,-19,13,1,8,19);c.lineTo(-8,19);c.bezierCurveTo(-13,1,-11,-19,0,-28);c.closePath();c.fill();c.shadowBlur=0;c.fillStyle=palette.blue;c.beginPath();c.moveTo(0,-28);c.lineTo(8,-14);c.lineTo(-8,-14);c.closePath();c.fill();c.fillStyle=palette.space;c.beginPath();c.arc(0,-8,4.6,0,Math.PI*2);c.fill();c.strokeStyle=palette.cyan;c.stroke();c.fillStyle=palette.violet;c.beginPath();c.moveTo(-8,8);c.lineTo(-18,20);c.lineTo(-7,18);c.closePath();c.fill();c.beginPath();c.moveTo(8,8);c.lineTo(18,20);c.lineTo(7,18);c.closePath();c.fill();c.fillStyle=palette.gold;c.beginPath();c.moveTo(-5,19);c.quadraticCurveTo(0,43+Math.sin(t*9)*4,5,19);c.closePath();c.fill();c.restore();
    c.fillStyle=palette.text;c.font='800 11px Manrope,system-ui';c.fillText('ILLUSTRATIVE EXAMPLE',w*.62,h*.12);
  }
  function drawChaos(){if(!ctx||!scenes.includes('home'))return;const s=sizeCanvas(bg);if(!s)return;const {w,h}=s;const order=(Math.sin(t*.22)+1)/2;ctx.save();chaos.forEach((q,i)=>{const sx=q.x*w,sy=q.y*h,tx=q.tx*w,ty=q.ty*h,x=sx+(tx-sx)*order*.86,y=sy+(ty-sy)*order*.86;ctx.globalAlpha=.10+.34*order;ctx.fillStyle=i%2?palette.violet:palette.cyan;ctx.beginPath();ctx.arc(x,y,1.2+(order*1.2),0,Math.PI*2);ctx.fill();if(i%8===0){ctx.strokeStyle='rgba(34,228,255,.16)';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(tx-sx)*.08,y+(ty-sy)*.08);ctx.stroke()}});ctx.globalAlpha=1;if(order>.72){ctx.strokeStyle='rgba(34,228,255,.55)';ctx.shadowColor=palette.cyan;ctx.shadowBlur=12;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(w*.18,h*.74);ctx.lineTo(w*.36,h*.64);ctx.lineTo(w*.52,h*.66);ctx.lineTo(w*.69,h*.45);ctx.lineTo(w*.84,h*.30);ctx.stroke();ctx.shadowBlur=0}ctx.restore()}
  function drawHero(){if(!hctx||!heroCanvas)return;const s=sizeCanvas(heroCanvas);if(!s)return;const {w,h}=s;hctx.clearRect(0,0,w,h);drawPlanet(hctx,w,h,{cx:.62,cy:.46,zoom:heroState.zoom*.98,yaw:heroState.yaw,pitch:heroState.pitch});drawRocket(hctx,w,h);}
  function drawGlobal(){if(!gctx||!globeCanvas)return;const s=sizeCanvas(globeCanvas);if(!s)return;gctx.clearRect(0,0,s.w,s.h);drawPlanet(gctx,s.w,s.h,{cx:.5,cy:.5,zoom:.96,yaw:heroState.yaw,pitch:heroState.pitch});}
  function drawGrowth(){if(!grctx||!growthCanvas)return;const s=sizeCanvas(growthCanvas);if(!s)return;const {w,h}=s;grctx.clearRect(0,0,w,h);grctx.strokeStyle='rgba(120,160,255,.12)';grctx.lineWidth=1;for(let i=0;i<6;i++){const y=35+i*(h-65)/5;grctx.beginPath();grctx.moveTo(20,y);grctx.lineTo(w-20,y);grctx.stroke()}const pts=[];for(let i=0;i<=70;i++){const u=i/70,x=25+u*(w-50),y=h-35-Math.pow(u,1.7)*(h-90);pts.push([x,y])}grctx.strokeStyle=palette.cyan;grctx.lineWidth=4;grctx.shadowColor=palette.cyan;grctx.shadowBlur=14;grctx.beginPath();pts.forEach((p,i)=>i?grctx.lineTo(p[0],p[1]):grctx.moveTo(p[0],p[1]));grctx.stroke();grctx.shadowBlur=0;const q=(Math.sin(t*.65)+1)/2,idx=Math.floor(q*(pts.length-1)),[x,y]=pts[idx];grctx.fillStyle=palette.gold;grctx.shadowColor=palette.gold;grctx.shadowBlur=18;grctx.beginPath();grctx.arc(x,y,5,0,Math.PI*2);grctx.fill();grctx.shadowBlur=0;grctx.fillStyle=palette.text;grctx.font='800 12px Manrope,system-ui';grctx.fillText('Illustrative example',24,22);grctx.fillStyle=palette.text;grctx.font='700 11px Manrope,system-ui';grctx.fillText('Baseline',24,h-10);grctx.fillText('Compounding growth',w-125,22);
    const rocketU=(Math.sin(t*.42)+1)/2, ri=Math.floor(rocketU*(pts.length-1)), [rx,ry]=pts[ri];
    grctx.save();grctx.translate(rx,ry);grctx.rotate(-Math.PI/4);grctx.fillStyle=palette.violet;grctx.beginPath();grctx.moveTo(0,-10);grctx.lineTo(5,5);grctx.lineTo(0,10);grctx.lineTo(-5,5);grctx.closePath();grctx.fill();grctx.fillStyle=palette.cyan;grctx.beginPath();grctx.arc(0,-2,2.2,0,Math.PI*2);grctx.fill();grctx.fillStyle=palette.gold;for(let i=0;i<5;i++){const yy=12+i*5+(Math.sin(t*7+i)*2);grctx.globalAlpha=.75-i*.1;grctx.beginPath();grctx.arc((Math.random()-.5)*3,yy,1.4-i*.15,0,Math.PI*2);grctx.fill()}grctx.restore();grctx.globalAlpha=1}
  function drawFunnel(){if(!fctx||!funnelCanvas)return;const s=sizeCanvas(funnelCanvas);if(!s)return;const {w,h}=s;fctx.clearRect(0,0,w,h);const cx=w*.5,top=28,fh=Math.min(245,h-55);const widths=[w*.82,w*.66,w*.50,w*.34,w*.22],labels=['Traffic','Engaged visitors','Leads','Qualified leads','Sales'];for(let i=0;i<5;i++){const y=top+i*fh/5,ww=widths[i],next=widths[Math.min(4,i+1)];fctx.beginPath();fctx.moveTo(cx-ww/2,y);fctx.lineTo(cx+ww/2,y);fctx.lineTo(cx+next/2,y+fh/5-8);fctx.lineTo(cx-next/2,y+fh/5-8);fctx.closePath();fctx.fillStyle=i<2?'rgba(34,228,255,.09)':i<4?'rgba(47,107,255,.10)':'rgba(123,63,228,.15)';fctx.fill();fctx.strokeStyle=i<2?palette.cyan:palette.violet;fctx.lineWidth=1.4;fctx.stroke();fctx.fillStyle=palette.text;fctx.font='800 12px Manrope,system-ui';fctx.textAlign='center';fctx.fillText(labels[i],cx,y+fh/10+4)}
    // moving lead particles
    for(let i=0;i<24;i++){const u=(i/24+t*.16)%1,yy=top+u*fh*.84,scale=1-u*.62,xx=cx+(Math.sin(i*3.2+t)*w*.18*scale);fctx.fillStyle=i%2?palette.cyan:palette.aqua;fctx.globalAlpha=.7;fctx.beginPath();fctx.arc(xx,yy,1.7,0,Math.PI*2);fctx.fill()}fctx.globalAlpha=1;fctx.textAlign='left';}

  // Interaction on globe
  function bindGlobe(c){if(!c)return;c.addEventListener('pointerdown',e=>{heroState.drag=true;heroState.lx=e.clientX;heroState.ly=e.clientY;c.setPointerCapture?.(e.pointerId)});c.addEventListener('pointermove',e=>{if(heroState.drag){heroState.yaw+=(e.clientX-heroState.lx)*.008;heroState.pitch=clamp(heroState.pitch+(e.clientY-heroState.ly)*.004,-.8,.8);heroState.lx=e.clientX;heroState.ly=e.clientY}});['pointerup','pointercancel','pointerleave'].forEach(ev=>c.addEventListener(ev,()=>heroState.drag=false));c.addEventListener('wheel',e=>{e.preventDefault();heroState.zoom=clamp(heroState.zoom-e.deltaY*.0007,.78,1.25)},{passive:false})}
  bindGlobe(heroCanvas);bindGlobe(globeCanvas);

  // Magnetic cursor + card tilt
  if(fine.matches&&!reduced.matches){const cursor=document.createElement('div');cursor.className='vx-cursor';cursor.innerHTML='';document.body.appendChild(cursor);const trails=[];for(let i=0;i<5;i++){const q=document.createElement('div');q.className='vx-cursor-trail';document.body.appendChild(q);trails.push(q)}let mx=0,my=0,tx=0,ty=0;addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;pointer.x=mx;pointer.y=my;pointer.active=true;cursor.style.opacity='1'},{passive:true});const cursorFrame=()=>{tx+=(mx-tx)*.22;ty+=(my-ty)*.22;const target=document.elementFromPoint(mx,my)?.closest('a,button');if(target&&!target.closest('input,textarea,select')){const r=target.getBoundingClientRect(),dx=r.left+r.width/2-mx,dy=r.top+r.height/2-my,d=Math.hypot(dx,dy);if(d<110){tx+=dx*.10;ty+=dy*.10;target.style.setProperty('--mag-x',`${clamp(dx*.025,-3,3)}px`);target.style.setProperty('--mag-y',`${clamp(dy*.025,-3,3)}px`);target.classList.add('magnetic-active')}else target.classList.remove('magnetic-active')}cursor.style.transform=`translate3d(${tx-4}px,${ty-4}px,0)`;trails.forEach((q,i)=>q.style.transform=`translate3d(${mx+(tx-mx)*((i+1)*.08)-2}px,${my+(ty-my)*((i+1)*.08)-2}px,0)`);requestAnimationFrame(cursorFrame)};cursorFrame();document.addEventListener('mouseleave',()=>cursor.style.opacity='0')}
  if(fine.matches&&!reduced.matches)$$('.card,.service-card,.package').forEach(card=>{card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height,rx=(.5-y)*8,ry=(x-.5)*8;card.style.setProperty('--mx',x*100+'%');card.style.setProperty('--my',y*100+'%');card.style.transform='translateY(-4px) perspective(1000px) rotateX('+rx+'deg) rotateY('+ry+'deg)'});const burst=()=>{for(let i=0;i<4;i++){const p=document.createElement('i');p.className='card-particle';p.style.setProperty('--p',String(i));card.appendChild(p);setTimeout(()=>p.remove(),500)}};card.addEventListener('pointerenter',burst);card.addEventListener('focusin',burst);card.addEventListener('pointerleave',()=>card.style.transform='')});

  // Funnel stage interactivity
  const funnelExplain=$('.funnel-explain');$$('.funnel-stage').forEach(stage=>stage.addEventListener('click',()=>{$$('.funnel-stage').forEach(x=>x.classList.remove('is-active'));stage.classList.add('is-active');if(funnelExplain)funnelExplain.textContent=stage.dataset.explain||''}));

  // Animation pause state
  const motion=$('[data-motion-toggle]');function syncMotion(){motion?.setAttribute('aria-pressed',String(paused));motion?.setAttribute('aria-label',paused?'Resume animations':'Pause animations');if(motion)motion.textContent=paused?'▶':'Ⅱ'}syncMotion();motion?.addEventListener('click',()=>{paused=!paused;localStorage.setItem('vionixAnimationsPaused',paused?'1':'0');syncMotion();if(!paused)start()});document.addEventListener('visibilitychange',()=>{hidden=document.hidden;if(!hidden)start()});reduced.addEventListener?.('change',()=>{if(reduced.matches)stop();else start()});addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true},{passive:true});addEventListener('scroll',()=>{scrollVelocity=Math.abs(scrollY-lastScroll);lastScroll=scrollY;const offset=clamp((scrollY/Math.max(1,document.body.scrollHeight-innerHeight))*12,-6,6);root.style.setProperty('--scroll-h',`${offset}deg`)},{passive:true});

  function seed(){points=seedPoints()}
  function frame(now){raf=0;if(hidden||paused||reduced.matches)return;const dt=Math.min(40,now-last);last=now;t+=dt/1000;scrollVelocity*=.91;const scrollOffset=clamp((scrollY/Math.max(1,document.body.scrollHeight-innerHeight))*12,-6,6);const drift=240+Math.sin(t*2*Math.PI/75)*35+scrollOffset;root.style.setProperty('--drift-h',String(clamp(drift,205,275)));root.style.setProperty('--scroll-h',`${scrollOffset}deg`);root.style.setProperty('--breath',String(Math.max(0,Math.sin(t*2*Math.PI/12))*0.025));drawBackground();drawChaos();if(heroCanvas)drawHero();if(globeCanvas)drawGlobal();if(growthCanvas)drawGrowth();if(funnelCanvas)drawFunnel();avg=avg*.94+dt*.06;if(avg>20&&quality>.55){quality*=.82;seed()}start()}
  function start(){if(raf||hidden||paused||reduced.matches)return;raf=requestAnimationFrame(frame)}function stop(){if(raf){cancelAnimationFrame(raf);raf=0}}
  if(!reduced.matches&&!paused){if('requestIdleCallback'in window)requestIdleCallback(start,{timeout:900});else setTimeout(start,180)}

  // Social icon micro-burst
  $$('.social-icon').forEach(el=>{const burst=()=>{for(let i=0;i<5;i++){const p=document.createElement('i');p.className='social-particle';p.style.setProperty('--a',`${i*72}deg`);el.appendChild(p);setTimeout(()=>p.remove(),450)}};el.addEventListener('mouseenter',burst);el.addEventListener('focus',burst)});
})();


/* ---------------------------------------------------------------
   Image slot fallback
   Missing user images stay visually clean instead of showing a
   broken-image icon. Replace the exact filename when ready.
   --------------------------------------------------------------- */
document.querySelectorAll('.visual-slot img').forEach((image) => {
  image.addEventListener('error', () => {
    image.removeAttribute('src');
    image.alt = 'Vionix image placeholder';
    image.classList.add('image-missing');
  });
});
