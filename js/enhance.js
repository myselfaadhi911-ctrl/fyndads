/* FYND ADZ — lightweight ambient motion */
(()=>{'use strict';
const d=document,root=d.documentElement,amb=d.querySelector('.ambient');
if(!amb||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const small=innerWidth<760,fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
const glc=d.createElement('canvas');glc.className='fx-gl';glc.setAttribute('aria-hidden','true');amb.append(glc);
let gl=null,program=null,uniforms={};
try{gl=glc.getContext('webgl',{alpha:true,antialias:false,powerPreference:'low-power'})}catch(e){}
if(gl){
const vs='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const fs='precision mediump float;uniform vec2 R;uniform float T;uniform vec2 M;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}void main(){vec2 uv=gl_FragCoord.xy/R;vec2 p=(uv-.5)*vec2(R.x/R.y,1.);float t=T*.035;float a=n(p*1.8+vec2(t,-t));float b=n(p*2.4+vec2(a*2.,-t*.7));float ribbon=pow(max(0.,sin(p.x*2.2+p.y*1.4+t+b*4.)*.5+.5),7.);float glow=exp(-length(uv-M)*5.)*.2;vec3 c=mix(vec3(.025,.012,.05),vec3(.42,.16,.78),smoothstep(.25,.82,b));c=mix(c,vec3(.75,.48,1.),ribbon*.18+glow);gl_FragColor=vec4(c,.42);}';
const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return gl.getShaderParameter(s,gl.COMPILE_STATUS)?s:null};
const v=sh(gl.VERTEX_SHADER,vs),f=sh(gl.FRAGMENT_SHADER,fs);
if(v&&f){program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);if(gl.getProgramParameter(program,gl.LINK_STATUS)){gl.useProgram(program);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);['R','T','M'].forEach(k=>uniforms[k]=gl.getUniformLocation(program,k));}else program=null;}
}
const pc=d.createElement('canvas');pc.className='fx-particles';pc.setAttribute('aria-hidden','true');const ctx=pc.getContext('2d');amb.append(pc);
let w=0,h=0,pts=[],mouse={x:.5,y:.5},target={x:.5,y:.5},scroll=0,last=0,raf=0,visible=!d.hidden;
function resize(){w=innerWidth;h=innerHeight;const ratio=Math.min(devicePixelRatio||1,1.4);pc.width=w*ratio;pc.height=h*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);glc.width=Math.max(2,Math.floor(w*(small?.38:.52)));glc.height=Math.max(2,Math.floor(h*(small?.38:.52)));if(gl&&program)gl.viewport(0,0,glc.width,glc.height);const count=Math.min(small?30:62,Math.max(18,Math.round(w*h/(small?24000:20000))));pts=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.22,r:.7+Math.random()*1.3}));}
function draw(now){raf=requestAnimationFrame(draw);if(!visible||now-last<30)return;const dt=Math.min(.05,(now-last)/1000||.016);last=now;mouse.x+=(target.x-mouse.x)*.045;mouse.y+=(target.y-mouse.y)*.045;
if(gl&&program){gl.useProgram(program);gl.uniform2f(uniforms.R,glc.width,glc.height);gl.uniform1f(uniforms.T,now/1000);gl.uniform2f(uniforms.M,mouse.x,1-mouse.y);gl.drawArrays(gl.TRIANGLES,0,3);}
ctx.clearRect(0,0,w,h);const reach=small?82:118;for(let i=0;i<pts.length;i++){const a=pts[i];a.x+=a.vx;a.y+=a.vy;if(a.x<0||a.x>w)a.vx*=-1;if(a.y<0||a.y>h)a.vy*=-1;ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,Math.PI*2);ctx.fillStyle='rgba(225,207,255,.55)';ctx.fill();for(let j=i+1;j<pts.length;j++){const b=pts[j],dx=a.x-b.x,dy=a.y-b.y,dist=Math.hypot(dx,dy);if(dist<reach){ctx.strokeStyle='rgba(183,124,255,'+((1-dist/reach)*.15)+')';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}}
}
resize();addEventListener('resize',resize,{passive:true});addEventListener('pointermove',e=>{target.x=e.clientX/innerWidth;target.y=e.clientY/innerHeight},{passive:true});d.addEventListener('visibilitychange',()=>{visible=!d.hidden;if(visible){last=0;if(!raf)raf=requestAnimationFrame(draw)}else{cancelAnimationFrame(raf);raf=0}});
raf=requestAnimationFrame(draw);
const orbs=d.createElement('div');orbs.className='fx-orbs';orbs.setAttribute('aria-hidden','true');for(let i=0;i<4;i++){const o=d.createElement('i');o.style.setProperty('--i',i);orbs.append(o)}amb.append(orbs);
if(fine){d.querySelectorAll('.service-card,.value-card,.employee-card').forEach(card=>{card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;card.style.transform='perspective(900px) rotateX('+((.5-y)*3)+'deg) rotateY('+((x-.5)*4)+'deg) translateY(-4px)'});card.addEventListener('pointerleave',()=>card.style.transform='')});}
})();