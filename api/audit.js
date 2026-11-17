const crypto = require("crypto");

function clean(value, max) {
  return String(value || "").trim().slice(0, max || 500);
}
function safeUrl(value) {
  const u = new URL(value);
  if (!["http:", "https:"].includes(u.protocol)) throw new Error("Only HTTP or HTTPS website URLs are supported.");
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host === "0.0.0.0" || host === "127.0.0.1" || host === "::1" || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) throw new Error("Please enter a public website URL.");
  return u;
}
async function timedFetch(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(function(){ controller.abort(); }, ms || 12000);
  try { return await fetch(url, Object.assign({}, options || {}, {signal: controller.signal, redirect:"follow"})); }
  finally { clearTimeout(timer); }
}
function htmlSignals(html, finalUrl) {
  const text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ");
  const get = function(re) { const m = html.match(re); return m ? (m[1] || "").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/<[^>]+>/g," ").trim() : ""; };
  const title = get(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) || get(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
  const h1 = (text.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) || []).map(x=>x.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim()).filter(Boolean);
  const headings = {h1:h1.length,h2:(text.match(/<h2\b/gi)||[]).length,h3:(text.match(/<h3\b/gi)||[]).length};
  const images = text.match(/<img\b[^>]*>/gi) || [];
  const missingAlt = images.filter(x=>!/\balt\s*=\s*["'][^"']+["']/i.test(x)).length;
  const viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const canonical = get(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i);
  const robots = get(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  const schema = /application\/ld\+json/i.test(html);
  const links = (text.match(/<a\b[^>]+href=/gi)||[]).length;
  const wordCount = text.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().split(" ").filter(Boolean).length;
  return {url:finalUrl,title,description,h1: h1.slice(0,5),headings,images:images.length,imagesMissingAlt:missingAlt,mobileViewport:viewport,canonical:canonical || null,robots:robots || null,hasStructuredData:schema,linkCount:links,approxWordCount:wordCount,https:finalUrl.startsWith("https://")};
}
async function getPageSpeed(url, strategy) {
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url",url);
  endpoint.searchParams.set("strategy",strategy);
  ["PERFORMANCE","SEO","ACCESSIBILITY","BEST_PRACTICES"].forEach(c=>endpoint.searchParams.append("category",c));
  if (process.env.PAGESPEED_API_KEY) endpoint.searchParams.set("key",process.env.PAGESPEED_API_KEY);
  const r = await timedFetch(endpoint.toString(),{},25000);
  if (!r.ok) throw new Error("PageSpeed analysis is temporarily unavailable ("+r.status+").");
  const j = await r.json();
  const cats = j.lighthouseResult && j.lighthouseResult.categories || {};
  const audits = j.lighthouseResult && j.lighthouseResult.audits || {};
  const score = function(k){return cats[k] && typeof cats[k].score === "number" ? Math.round(cats[k].score*100) : null;};
  const metric = function(k){const a=audits[k];return a ? {value:a.displayValue || null, score:typeof a.score==="number"?Math.round(a.score*100):null} : null;};
  return {strategy:strategy, scores:{performance:score("performance"),seo:score("seo"),accessibility:score("accessibility"),bestPractices:score("best-practices")},metrics:{lcp:metric("largest-contentful-paint"),inp:metric("interaction-to-next-paint"),cls:metric("cumulative-layout-shift"),fcp:metric("first-contentful-paint"),tbt:metric("total-blocking-time"),speedIndex:metric("speed-index")}};
}
function scoreFrom(data) {
  const vals = [data.mobile && data.mobile.scores.performance,data.mobile && data.mobile.scores.seo,data.mobile && data.mobile.scores.accessibility,data.mobile && data.mobile.scores.bestPractices].filter(x=>typeof x==="number");
  if (!vals.length) return null;
  let base = vals.reduce((a,b)=>a+b,0)/vals.length;
  const s=data.signals;
  if (!s.title) base-=5;
  if (!s.description) base-=4;
  if (!s.headings.h1) base-=4;
  if (!s.mobileViewport) base-=7;
  if (s.imagesMissingAlt>0) base-=Math.min(6,s.imagesMissingAlt);
  return Math.max(0,Math.min(100,Math.round(base)));
}
function fallbackReport(data) {
  const s=data.signals, score=data.overallScore;
  const findings=[];
  function add(priority,title,detail,action){findings.push({priority:priority,title:title,detail:detail,action:action});}
  if (!s.title) add("Critical","Missing page title","The homepage title could not be detected in the HTML snapshot.","Add a unique, descriptive title that includes the primary service or topic and brand.");
  else if (s.title.length<30 || s.title.length>65) add("Medium","Review the page title length","Detected title: "+s.title,"Rewrite it so the page topic is clear and the search result is compelling; use length as a guide, not a rigid rule.");
  if (!s.description) add("High","Meta description not detected","No standard meta description was found in the homepage HTML.","Write a distinct summary that explains the offer and gives searchers a reason to visit.");
  if (!s.headings.h1) add("High","No H1 heading detected","The homepage snapshot did not expose an H1 heading.","Add one clear H1 that describes the page's main purpose.");
  if (!s.mobileViewport) add("High","Mobile viewport tag missing","A standard responsive viewport declaration was not detected.","Add a responsive viewport meta tag and test key pages on real mobile devices.");
  if (s.imagesMissingAlt) add("Medium","Image alternative text needs attention",s.imagesMissingAlt+" of "+s.images+" detected images appear to have no non-empty alt attribute.","Add useful alt text to informative images and empty alt attributes to decorative images.");
  if (!s.canonical) add("Medium","Canonical URL not detected","No standard canonical link was found on the homepage.","Confirm preferred URLs and add self-referencing canonical tags where appropriate.");
  if (!s.hasStructuredData) add("Medium","Structured data not detected","No JSON-LD block was found in the homepage HTML snapshot.","Check whether Organization, LocalBusiness, Product or relevant schema markup is appropriate.");
  const p=data.mobile && data.mobile.scores.performance;
  if (p!==null && p<50) add("Critical","Mobile performance needs urgent work","PageSpeed mobile performance score: "+p+"/100.","Review render-blocking resources, image formats and dimensions, JavaScript execution, caching and server response time.");
  else if (p!==null && p<90) add("High","Mobile performance has room to improve","PageSpeed mobile performance score: "+p+"/100.","Prioritise the specific Lighthouse opportunities and validate improvements on mobile.");
  const seo=data.mobile && data.mobile.scores.seo;
  if (seo!==null && seo<90) add("High","Technical SEO checks need review","PageSpeed Lighthouse SEO score: "+seo+"/100.","Open the Lighthouse SEO diagnostics and resolve the failed checks, then validate indexability in Search Console.");
  if (!findings.length) add("Low","No major homepage flags in this snapshot","The automated checks did not find a major issue in the limited checks performed.","Continue with Search Console, analytics, conversion tracking and a page-by-page content review.");
  return {overallScore:score,scoreLabel:score===null?"Not enough data":score>=85?"Strong foundations":score>=70?"Good foundation":score>=50?"Needs improvement":"Priority attention needed",executiveSummary:"This free baseline checks publicly accessible homepage signals and Google's PageSpeed Insights results. It is a starting point, not a full crawl or a substitute for analytics and Search Console access.",strengths:[s.https?"The website uses HTTPS.":"HTTPS could not be confirmed.",s.mobileViewport?"A mobile viewport declaration was detected.":"Mobile viewport declaration was not detected.",s.hasStructuredData?"Structured data was detected.":"Structured data was not detected in the homepage snapshot."].filter(Boolean),findings:findings,actionPlan:[{time:"First 7 days",items:findings.filter(x=>x.priority==="Critical"||x.priority==="High").slice(0,4).map(x=>x.action)},{time:"Next 30 days",items:["Review top landing pages and align each page with one search intent.","Set up or validate Google Search Console, GA4 and conversion events.","Create a consistent content calendar based on customer questions and business goals."]},{time:"Next 60–90 days",items:["Compare competitor visibility and content gaps using target keywords.","Test landing-page messaging and calls to action.","Review channel performance monthly and reallocate effort to measurable outcomes."]}],limitations:["Social account engagement, reach, saves and audience demographics are not publicly verifiable from a profile URL alone.","Ad account performance, leads, revenue, keyword rankings and conversion rates require first-party account access.","This scan reviews the submitted homepage and PageSpeed data; it is not a complete site crawl."]};
}
function emailHtml(data, report) {
  const esc=function(x){return String(x||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));};
  const rows=(report.findings||[]).map(f=>"<tr><td style='padding:12px;border-bottom:1px solid #eee'><b>"+esc(f.priority)+" · "+esc(f.title)+"</b><br>"+esc(f.detail)+"<br><span style='color:#6330a8'>Action: "+esc(f.action)+"</span></td></tr>").join("");
  const plan=(report.actionPlan||[]).map(p=>"<h3>"+esc(p.time)+"</h3><ul>"+(p.items||[]).map(i=>"<li>"+esc(i)+"</li>").join("")+"</ul>").join("");
  return "<div style='font-family:Arial,sans-serif;color:#21172e;max-width:760px;margin:auto'><div style='background:#120b20;color:#fff;padding:28px'><div style='color:#c69bff;font-size:12px;letter-spacing:3px'>FYNDADZ · FREE AI MARKETING AUDIT</div><h1 style='margin:14px 0 4px'>Your digital audit report</h1><p>"+esc(data.business)+" · "+esc(data.website)+"</p></div><div style='padding:26px'><h2>Overall score: "+(report.overallScore===null?"N/A":report.overallScore+"/100")+"</h2><p>"+esc(report.executiveSummary)+"</p><h2>Priority findings</h2><table style='width:100%;border-collapse:collapse'>"+rows+"</table><h2>Recommended action plan</h2>"+plan+"<p style='background:#f4effb;padding:18px'><b>Want a deeper optimisation plan?</b><br>Contact FYNDADZ: <a href='https://fyndadz.com/contact.html'>Request a consultation</a> · <a href='mailto:fyndadz@gmail.com'>fyndadz@gmail.com</a></p><small>Automated baseline audit. Validate recommendations before implementation. Social, ads and conversion data may require account access.</small></div></div>";
}
module.exports = async function(req,res) {
  res.setHeader("Access-Control-Allow-Origin","https://fyndadz.com");
  res.setHeader("Vary","Origin");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(204).end();
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  const ip=(req.headers["x-forwarded-for"]||"").split(",")[0].trim();
  const key=ip ? crypto.createHash("sha256").update(ip).digest("hex").slice(0,16) : "unknown";
  try {
    const body=typeof req.body==="string"?JSON.parse(req.body):req.body||{};
    const data={name:clean(body.name,100),email:clean(body.email,160),business:clean(body.business,120),website:clean(body.website,500),instagram:clean(body.instagram,500),industry:clean(body.industry,120),location:clean(body.location,120),competitors:clean(body.competitors,500),goals:clean(body.goals,1200)};
    if(!data.name||!data.email||!data.business||!data.website||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return res.status(400).json({error:"Please complete your name, valid email, business name and website."});
    if(!process.env.OPENAI_API_KEY||!process.env.RESEND_API_KEY) return res.status(503).json({error:"The audit service is not fully configured yet. Please try again later or contact fyndadz@gmail.com."});
    const target=safeUrl(data.website);
    const pageRes=await timedFetch(target.toString(),{headers:{"User-Agent":"FYNDADZ-AuditBot/1.0 (+https://fyndadz.com)","Accept":"text/html"}},14000);
    if(!pageRes.ok) throw new Error("We could not access the submitted website (HTTP "+pageRes.status+"). Check the URL and try again.");
    const html=(await pageRes.text()).slice(0,1500000);
    const signals=htmlSignals(html,pageRes.url||target.toString());
    let mobile=null,desktop=null,psiError=null;
    try { mobile=await getPageSpeed(target.toString(),"mobile"); } catch(e){psiError=e.message;}
    try { desktop=await getPageSpeed(target.toString(),"desktop"); } catch(e){desktop=null;}
    const auditData={business:data.business,industry:data.industry,location:data.location,website:target.toString(),instagram:data.instagram,competitors:data.competitors,goals:data.goals,signals:signals,mobile:mobile,desktop:desktop,psiError:psiError};
    auditData.overallScore=scoreFrom(auditData);
    const prompt="You are a careful digital marketing auditor for FYNDADZ. Create a useful, detailed but honest free baseline report using ONLY the evidence supplied. Never invent analytics, social engagement, rankings, ad spend, conversions, competitor findings or data not supplied. If Instagram URL exists, assess only what can be inferred from the URL and clearly mark profile/content metrics as requiring manual review. Keep recommendations practical. Return valid JSON only with keys: overallScore (number or null), scoreLabel (string), executiveSummary (string), strengths (array of strings), findings (array of objects with priority Critical|High|Medium|Low, title, detail, action), channelReviews (array objects with channel, status, observations array, recommendations array), actionPlan (array objects with time and items array), limitations (array of strings). Include sections for website experience, technical SEO, on-page SEO, performance, social media, branding/content, paid ads readiness and measurement readiness. Do not claim to have audited ad accounts or analytics. Score must be based on measured evidence; if insufficient, null. Include 8-14 useful findings when evidence supports them. Website HTML signals: "+JSON.stringify(signals)+". PageSpeed mobile: "+JSON.stringify(mobile)+". PageSpeed desktop: "+JSON.stringify(desktop)+". PageSpeed error: "+String(psiError)+". Business context: "+JSON.stringify({business:data.business,industry:data.industry,location:data.location,instagram:data.instagram,competitors:data.competitors,goals:data.goals})+". Preliminary evidence score: "+String(auditData.overallScore)+".";
    const ai=await timedFetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-4.1-mini",temperature:0.2,response_format:{type:"json_object"},messages:[{role:"system",content:"Return valid JSON only. Be evidence-led and transparent."},{role:"user",content:prompt}]})},35000);
    if(!ai.ok) throw new Error("AI report generation failed. Please try again later.");
    const aiJson=await ai.json();
    let report;
    try {report=JSON.parse(aiJson.choices[0].message.content);} catch(e){throw new Error("The report could not be formatted. Please try again.");}
    report.overallScore=typeof report.overallScore==="number"?Math.max(0,Math.min(100,Math.round(report.overallScore))):auditData.overallScore;
    report.generatedAt=new Date().toISOString();
    report.sourceData={signals:signals,mobile:mobile,desktop:desktop};
    const emailBody=emailHtml(data,report);
    const mail=await timedFetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.AUDIT_FROM_EMAIL||"FYNDADZ Audit <audit@fyndadz.com>",to:[data.email],subject:"Your FYNDADZ Free Digital Marketing Audit — "+data.business,html:emailBody})},20000);
    if(!mail.ok) throw new Error("Your audit was generated but email delivery failed. Please contact fyndadz@gmail.com.");
    return res.status(200).json({ok:true,report:report,emailSent:true,requestId:key});
  } catch(error) {
    const message=error && error.message ? error.message : "Audit could not be completed.";
    return res.status(400).json({error:message});
  }
};