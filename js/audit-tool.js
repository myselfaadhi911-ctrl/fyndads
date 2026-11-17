(function(){
"use strict";
var form=document.getElementById("aiAuditForm"),status=document.getElementById("auditStatus"),results=document.getElementById("auditResults"),submit=document.getElementById("auditSubmit");
if(!form)return;
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function list(items){return "<ul>"+(items||[]).map(function(x){return "<li>"+esc(x)+"</li>";}).join("")+"</ul>";}
function render(report){
var score=report.overallScore, scoreText=typeof score==="number"?score+"/100":"Not enough verified data";
var findings=(report.findings||[]).map(function(f){return "<article class='audit-finding'><div class='finding-top'><span class='priority priority-"+esc((f.priority||"medium").toLowerCase())+"'>"+esc(f.priority)+"</span><h4>"+esc(f.title)+"</h4></div><p>"+esc(f.detail)+"</p><p class='finding-action'><b>Recommended action:</b> "+esc(f.action)+"</p></article>";}).join("");
var channels=(report.channelReviews||[]).map(function(c){return "<article class='channel-review'><span>"+esc(c.status||"REVIEW")+"</span><h4>"+esc(c.channel)+"</h4>"+list(c.observations||[])+"<b>Recommendations</b>"+list(c.recommendations||[])+"</article>";}).join("");
var plans=(report.actionPlan||[]).map(function(p){return "<article class='plan-card'><span>"+esc(p.time)+"</span>"+list(p.items||[])+"</article>";}).join("");
var strengths=list(report.strengths||[]);
var limitations=list(report.limitations||[]);
var src=report.sourceData||{},sig=src.signals||{},scores=src.mobile&&src.mobile.scores||{};
var measured="<div class='measured-grid'>"+["performance","seo","accessibility","bestPractices"].map(function(k){return "<div><b>"+esc(k==="bestPractices"?"Best practices":k.charAt(0).toUpperCase()+k.slice(1))+"</b><strong>"+(scores[k]==null?"N/A":esc(scores[k])+"/100")+"</strong></div>";}).join("")+"</div>";
var techRows=[["Homepage title",sig.title||"Not detected"],["Meta description",sig.description||"Not detected"],["H1 headings",Array.isArray(sig.h1)?sig.h1.join(" | "):"Not detected"],["Mobile viewport",sig.mobileViewport?"Detected":"Not detected"],["Canonical URL",sig.canonical||"Not detected"],["Structured data",sig.hasStructuredData?"Detected":"Not detected"],["Images missing alt",String(sig.imagesMissingAlt==null?"N/A":sig.imagesMissingAlt)+" / "+String(sig.images==null?"N/A":sig.images)],["HTTPS",sig.https?"Detected":"Not confirmed"]];
var technical="<table class='technical-table'>"+techRows.map(function(r){return "<tr><th>"+esc(r[0])+"</th><td>"+esc(r[1])+"</td></tr>";}).join("")+"</table>";
results.innerHTML="<div class='report-header'><div><span class='report-kicker'>FYNDADZ / YOUR FREE AI AUDIT</span><h2>Digital marketing<br><em>audit report.</em></h2><p>Generated "+esc(new Date(report.generatedAt||Date.now()).toLocaleString())+"</p></div><div class='score-ring'><strong>"+esc(scoreText)+"</strong><span>"+esc(report.scoreLabel||"Evidence-based baseline")+"</span></div></div><section class='report-section'><span class='report-label'>01 / EXECUTIVE SUMMARY</span><p class='report-summary'>"+esc(report.executiveSummary)+"</p></section><section class='report-section'><span class='report-label'>02 / WHAT IS WORKING</span>"+strengths+"</section><section class='report-section'><span class='report-label'>03 / MEASURED WEBSITE PERFORMANCE</span>"+measured+"<h4>Homepage technical checks</h4>"+technical+"</section><section class='report-section'><span class='report-label'>04 / PRIORITY FINDINGS</span><div class='findings-grid'>"+findings+"</div></section><section class='report-section'><span class='report-label'>05 / CHANNEL-BY-CHANNEL REVIEW</span><div class='channels-grid'>"+channels+"</div></section><section class='report-section'><span class='report-label'>06 / 30–90 DAY ACTION PLAN</span><div class='plan-grid'>"+plans+"</div></section><section class='report-section report-limitations'><span class='report-label'>07 / SCOPE & LIMITATIONS</span>"+limitations+"</section><section class='report-cta'><span>READY TO TURN INSIGHTS INTO GROWTH?</span><h3>Let’s build your<br><em>next move.</em></h3><p>Need a deeper audit, a prioritised strategy or help implementing these recommendations? Talk to the FYNDADZ team.</p><a class='button button-primary' href='https://fyndadz.com/contact.html'>Contact FYNDADZ ↗</a> <a class='report-mail-link' href='mailto:fyndadz@gmail.com'>fyndadz@gmail.com</a></section><div class='report-actions'><button type='button' class='button button-primary' id='printAudit'>Download / Print PDF ↗</button><button type='button' class='button button-ghost' id='newAudit'>Run another audit</button></div>";
results.hidden=false;
var p=document.getElementById("printAudit");if(p)p.addEventListener("click",function(){window.print();});
var n=document.getElementById("newAudit");if(n)n.addEventListener("click",function(){results.hidden=true;form.reset();form.scrollIntoView({behavior:"smooth"});});
results.scrollIntoView({behavior:"smooth",block:"start"});
}
form.addEventListener("submit",async function(e){
e.preventDefault();if(!form.reportValidity())return;
submit.disabled=true;submit.textContent="Analysing your digital presence…";status.textContent="Checking your website, PageSpeed signals and preparing your evidence-based report. This can take up to a minute.";
var d=new FormData(form),payload={};d.forEach(function(v,k){payload[k]=v;});
try{
var response=await fetch("/api/audit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
var result=await response.json();if(!response.ok)throw new Error(result.error||"Audit failed. Please try again.");
status.textContent="Your report is ready and has been sent to "+payload.email+".";
render(result.report);
}catch(err){status.textContent=err.message||"Something went wrong. Please contact fyndadz@gmail.com.";status.classList.add("error");}
finally{submit.disabled=false;submit.innerHTML="Generate my free audit <span>↗</span>";}
});
})();