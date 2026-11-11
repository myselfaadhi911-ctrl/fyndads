(()=>{'use strict';const d=document,root=d.documentElement,$=(s,r=d)=>r.querySelector(s),$$=(s,r=d)=>[...r.querySelectorAll(s)],reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,fine=matchMedia('(hover:hover) and (pointer:fine)').matches;

function initAurora(){
 const canvas=$('.fx-canvas');if(!canvas)return;
 const ctx=canvas.getContext('2d',{alpha:false,desynchronized:true});if(!ctx)return;
 let w=0,h=0,dpr=1,raf=0,last=0,paused=false;
 const palette=[
  {a:[111,42,214],b:[155,76,255],power:.30},
  {a:[73,31,166],b:[116,64,224],power:.22},
  {a:[160,48,190],b:[215,90,230],power:.16},
  {a:[54,54,180],b:[90,112,235],power:.16},
  {a:[119,69,213],b:[194,135,255],power:.13},
  {a:[91,24,133],b:[160,58,190],power:.12}
 ];
 const rand=(a,b)=>a+Math.random()*(b-a);
 const makeBlob=tone=>({tone,x:rand(-.1,1.1),y:rand(-.15,1.15),radius:rand(.38,.78),alpha:rand(.66,1),from:null,to:null,c1:null,c2:null,start:0,duration:rand(19000,39000)});
 const blobs=palette.map(makeBlob);
 function nextPath(b,now){
  b.from={x:b.x,y:b.y};
  b.to={x:rand(-.16,1.16),y:rand(-.18,1.18)};
  const dx=b.to.x-b.from.x,dy=b.to.y-b.from.y;
  const bend=rand(.16,.58)*(Math.random()<.5?-1:1);
  b.c1={x:b.from.x+dx*.28-dy*bend+rand(-.14,.14),y:b.from.y+dy*.28+dx*bend+rand(-.12,.12)};
  b.c2={x:b.from.x+dx*.76+dy*bend+rand(-.14,.14),y:b.from.y+dy*.76-dx*bend+rand(-.12,.12)};
  b.start=now;b.duration=rand(22000,47000);
 }
 function cubic(a,b,c,d,t){const q=1-t;return q*q*q*a+3*q*q*t*b+3*q*t*t*c+t*t*t*d}
 function resize(){
  const rect=canvas.getBoundingClientRect();
  w=Math.max(1,rect.width||innerWidth);h=Math.max(1,rect.height||innerHeight);
  const compact=innerWidth<680;
  dpr=Math.min(devicePixelRatio||1,compact?1.45:1.85);
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if(!raf)draw(performance.now(),true);
 }
 function glow(x,y,r,stops){
  const g=ctx.createRadialGradient(x,y,0,x,y,r);
  for(const [at,color] of stops)g.addColorStop(at,color);
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 }
 function paint(now){
  ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#090610';ctx.fillRect(0,0,w,h);
  const base=ctx.createLinearGradient(0,h*.12,w,h*.94);
  base.addColorStop(0,'rgba(27,13,47,.20)');
  base.addColorStop(.48,'rgba(12,8,23,.10)');
  base.addColorStop(1,'rgba(19,8,34,.26)');
  ctx.fillStyle=base;ctx.fillRect(0,0,w,h);
  ctx.globalCompositeOperation='screen';
  const min=Math.min(w,h),max=Math.max(w,h);
  for(const b of blobs){
   if(!b.from)nextPath(b,now);
   const t=Math.min(1,Math.max(0,(now-b.start)/b.duration));
   const eased=t*t*(3-2*t);
   const bx=cubic(b.from.x,b.c1.x,b.c2.x,b.to.x,eased);
   const by=cubic(b.from.y,b.c1.y,b.c2.y,b.to.y,eased);
   b.x=bx;b.y=by;
   if(t>=1)nextPath(b,now);
   const x=bx*w,y=by*h,r=min*b.radius;
   const [ar,ag,ab]=b.tone.a,[br,bg,bb]=b.tone.b;
   const pulse=.88+.12*Math.sin(now*.00017+b.tone.power*19);
   const alpha=b.tone.power*b.alpha*pulse;
   glow(x,y,r,[
    [0,'rgba('+br+','+bg+','+bb+','+alpha+')'],
    [.28,'rgba('+ar+','+ag+','+ab+','+(alpha*.66)+')'],
    [.68,'rgba('+ar+','+ag+','+ab+','+(alpha*.20)+')'],
    [1,'rgba('+ar+','+ag+','+ab+',0)']
   ]);
  }
  ctx.globalCompositeOperation='screen';
  glow(w*.78,h*.16,max*.7,[[0,'rgba(101,42,178,.085)'],[.55,'rgba(81,32,135,.035)'],[1,'rgba(81,32,135,0)']]);
  glow(w*.15,h*.84,max*.62,[[0,'rgba(40,42,145,.065)'],[.55,'rgba(50,24,111,.025)'],[1,'rgba(50,24,111,0)']]);
  ctx.globalCompositeOperation='source-over';
  const vignette=ctx.createRadialGradient(w*.52,h*.48,min*.16,w*.52,h*.48,max*.82);
  vignette.addColorStop(0,'rgba(5,3,12,0)');
  vignette.addColorStop(1,'rgba(4,3,10,.34)');
  ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
 }
 function draw(now,force=false){
  raf=0;
  if(paused&&!force)return;
  if(!force&&now-last<32){raf=requestAnimationFrame(draw);return}
  last=now;paint(now);
  if(!reduce&&!document.hidden&&!paused)raf=requestAnimationFrame(draw);
 }
 function start(){paused=false;if(!raf)raf=requestAnimationFrame(draw)}
 function stop(){paused=true;if(raf){cancelAnimationFrame(raf);raf=0}}
 resize();
 if('ResizeObserver'in window)new ResizeObserver(resize).observe(canvas);
 else addEventListener('resize',resize,{passive:true});
 document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
 if(reduce){paint(performance.now());return}
 start();
}
// Background is rendered by the high-resolution vector artwork.

const ready=()=>{const done=()=>setTimeout(()=>root.classList.add('ready'),root.classList.contains('first')?950:250);(d.fonts?.ready||Promise.resolve()).then(done,done)};ready();
if(!reduce){d.addEventListener('click',e=>{const a=e.target.closest?.('a[href]');if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||a.target==='_blank'||a.hasAttribute('download'))return;const u=new URL(a.href,location.href);if(u.origin!==location.origin||u.pathname===location.pathname&&u.search===location.search)return;e.preventDefault();root.classList.add('leaving');setTimeout(()=>location.assign(u.href),340)})}
function split(el){if(el.dataset.splitDone)return;el.dataset.splitDone='1';const label=(el.innerText||el.textContent).replace(/\s+/g,' ').trim();const walk=node=>[...node.childNodes].forEach(n=>{if(n.nodeType===3){const f=d.createDocumentFragment();n.textContent.split(/(\s+)/).forEach(t=>{if(!t)return;if(/^\s+$/.test(t)){f.append(t);return}const w=d.createElement('span'),wi=d.createElement('span');w.className='w';w.setAttribute('aria-hidden','true');wi.className='wi';wi.textContent=t;wi.style.setProperty('--i',el.dataset.wordIndex=(Number(el.dataset.wordIndex)||0)+1);w.append(wi);f.append(w)});n.replaceWith(f)}else if(n.nodeType===1&&n.tagName!=='BR')walk(n)});el.setAttribute('aria-label',label);walk(el);el.classList.add('split')}
const hero=$('.hero-title');if(hero){if(reduce){root.classList.add('ready')}else{split(hero);hero.classList.add('hero-split')}}
if(!reduce){$$('main .display').filter(e=>e!==hero&&/^H[12]$/.test(e.tagName)&&!e.closest('#employeeProfile,.qr-modal')).forEach(split)}
const items=$$('[data-reveal]');if(reduce||!('IntersectionObserver'in window)){items.forEach(e=>e.classList.add('visible','in'))}else{const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('visible','in');io.unobserve(x.target)}}),{threshold:.1,rootMargin:'0px 0px -5% 0px'});items.forEach((e,i)=>{e.style.setProperty('--d',Math.min(i%6*70,350)+'ms');io.observe(e)})}
const header=$('#siteHeader'),bar=$('.scroll-progress');let last=scrollY,tick=false;const scroll=()=>{tick=false;const y=scrollY,max=d.documentElement.scrollHeight-innerHeight;if(bar)bar.style.setProperty('--p',max?Math.min(1,y/max):0);if(header&&innerWidth>980){if(y>260&&y-last>5)header.classList.add('hide');else if(y<last-3||y<120)header.classList.remove('hide')}last=y};addEventListener('scroll',()=>{if(!tick){tick=true;requestAnimationFrame(scroll)}},{passive:true});scroll();
if(fine&&!reduce){const glow=$('.cursor-glow'),ring=d.createElement('div');ring.className='cursor-ring';ring.setAttribute('aria-hidden','true');d.body.append(ring);let x=innerWidth/2,y=innerHeight/2,rx=x,ry=y,run=false;const loop=()=>{rx+=(x-rx)*.2;ry+=(y-ry)*.2;if(glow)glow.style.transform='translate3d('+x+'px,'+y+'px,0)';ring.style.transform='translate3d('+rx+'px,'+ry+'px,0)';if(Math.abs(x-rx)+Math.abs(y-ry)>.4)requestAnimationFrame(loop);else run=false};addEventListener('pointermove',e=>{x=e.clientX;y=e.clientY;root.classList.add('fx-on');ring.classList.toggle('hot',!!e.target.closest('a,button,input,select,textarea'));if(!run){run=true;requestAnimationFrame(loop)}},{passive:true});d.addEventListener('pointerleave',()=>root.classList.remove('fx-on'))}
$$('.button,.round-link').forEach(b=>b.addEventListener('pointerdown',e=>{if(reduce||e.pointerType==='touch')return;const r=b.getBoundingClientRect(),s=d.createElement('span');s.className='ripple';s.style.width=s.style.height=Math.max(r.width,r.height)+'px';s.style.left=e.clientX-r.left-s.offsetWidth/2+'px';s.style.top=e.clientY-r.top-s.offsetHeight/2+'px';b.append(s);setTimeout(()=>s.remove(),750)}));
$$('.service-card,.value-card,.employee-card').forEach(c=>{c.addEventListener('pointermove',e=>{if(!fine||reduce)return;const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;c.style.setProperty('--mx',x*100+'%');c.style.setProperty('--my',y*100+'%');c.style.setProperty('--ry',(x-.5)*8+'deg');c.style.setProperty('--rx',(.5-y)*6+'deg')});c.addEventListener('pointerleave',()=>{c.style.setProperty('--rx','0deg');c.style.setProperty('--ry','0deg')})});
$$('[data-year]').forEach(e=>e.textContent=new Date().getFullYear());
})();