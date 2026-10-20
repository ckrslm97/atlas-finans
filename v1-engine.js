'use strict';
(function(){
 const finite=Number.isFinite,mean=a=>a.length?a.reduce((n,x)=>n+x,0)/a.length:null;
 const std=a=>{if(a.length<2)return null;const m=mean(a);return Math.sqrt(a.reduce((n,x)=>n+(x-m)**2,0)/(a.length-1));};
 const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
 const returns=h=>(h||[]).slice(1).map((p,i)=>p.close/h[i].close-1).filter(finite);
 const periodCache=new WeakMap(),financialCache=new WeakMap(),qualityCache=new WeakMap(),basicRiskCache=new WeakMap(),factorCache=new WeakMap();
 const percentile=(rows,value,get)=>{const v=rows.map(get).filter(finite).sort((a,b)=>a-b);if(!v.length||!finite(value))return null;let i=0;while(i<v.length&&v[i]<=value)i++;return i/v.length*100;};
 const priceAt=(h,days)=>{if(!h?.length)return null;const cut=new Date(h.at(-1).date+'T00:00:00Z');cut.setUTCDate(cut.getUTCDate()-days);const p=h.find(x=>new Date(x.date)>=cut)||h[0];return p?.close;};
 function risk(stock,benchmark){
  const basicOnly=!benchmark?.history?.length;if(basicOnly&&basicRiskCache.has(stock))return basicRiskCache.get(stock);
  const h=stock.history||[],r=returns(h),down=r.filter(x=>x<0),years=h.length/252,last=h.at(-1)?.close,first=h[0]?.close;
  let peak=first,maxdd=0;for(const p of h){peak=Math.max(peak,p.close);maxdd=Math.min(maxdd,p.close/peak-1);}
  const vol=std(r.slice(-252)),annualReturn=years>0&&last>0&&first>0?(last/first)**(1/years)-1:null,sharpe=vol?annualReturn/(vol*Math.sqrt(252)):null,downDev=std(down),sortino=downDev?annualReturn/(downDev*Math.sqrt(252)):null,calmar=maxdd?annualReturn/Math.abs(maxdd):null;
  const bh=benchmark?.history||[],bm=new Map();for(let i=1;i<bh.length;i++)bm.set(bh[i].date,bh[i].close/bh[i-1].close-1);const pairs=[];for(let i=1;i<h.length;i++)if(bm.has(h[i].date)&&bm.get(h[i].date)<0)pairs.push([bm.get(h[i].date),h[i].close/h[i-1].close-1]);let downsideBeta=null;if(pairs.length>30){const x=pairs.map(p=>p[0]),y=pairs.map(p=>p[1]),xm=mean(x),ym=mean(y),den=x.reduce((n,v)=>n+(v-xm)**2,0);downsideBeta=den?x.reduce((n,v,i)=>n+(v-xm)*(y[i]-ym),0)/den:null;}
  const sorted=[...r.slice(-252)].sort((a,b)=>a-b),var95=sorted.length?sorted[Math.floor(sorted.length*.05)]*100:null;
  const out={annualReturn:annualReturn*100,volatility:vol*Math.sqrt(252)*100,maxDrawdown:maxdd*100,sharpe,sortino,calmar,downsideBeta,var95};if(basicOnly)basicRiskCache.set(stock,out);return out;
 }
 function periods(stock){if(periodCache.has(stock))return periodCache.get(stock);const h=stock.history||[],last=h.at(-1)?.close,out=Object.fromEntries([['1H',7],['1A',30],['3A',91],['6A',183],['1Y',365],['3Y',1096],['5Y',1827]].map(([k,d])=>{const p=priceAt(h,d);return [k,finite(last)&&finite(p)?(last/p-1)*100:null];}));periodCache.set(stock,out);return out;}
 function financial(stock){
  if(financialCache.has(stock))return financialCache.get(stock);
  const f=stock.financial||{},ratio=(a,b)=>finite(a)&&finite(b)&&b!==0?a/b:null,margin=ratio(f.profit_ttm,f.revenue_ttm),ebitdaMargin=ratio(f.ebitda_ttm,f.revenue_ttm),roe=ratio(f.profit_ttm,f.equity),roa=ratio(f.profit_ttm,f.assets),leverage=ratio(f.net_debt,f.equity),equityRatio=ratio(f.equity,f.assets),cashQuality=ratio(f.profit_ttm,f.ebitda_ttm);
  let score=50;for(const [v,pos,neg,w] of [[stock.roic,15,5,12],[margin,.10,.03,10],[ebitdaMargin,.15,.07,8],[roe,.15,.05,10],[equityRatio,.4,.2,10]])if(finite(v))score+=v>=pos?w:v<neg?-w:0;if(finite(leverage))score+=leverage<=0?12:leverage>.75?-12:0;if(f.balanceCheck===true)score+=5;if(f.profit_ttm<0)score-=15;
  const out={score:clamp(Math.round(score)),margin:margin*100,ebitdaMargin:ebitdaMargin*100,roe:roe*100,roa:roa*100,leverage,equityRatio:equityRatio*100,cashQuality};financialCache.set(stock,out);return out;
 }
 function quality(stock){
  if(qualityCache.has(stock))return qualityCache.get(stock);
  let q=100,issues=[];const h=stock.history||[],last=h.at(-1);if(h.length<1000){q-=15;issues.push('5 yıllık fiyat geçmişi eksik');}if(!stock.financial?.period){q-=25;issues.push('finansal dönem yok');}if(stock.financial?.balanceCheck!==true){q-=10;issues.push('bilanço eşitliği doğrulanmadı');}if(stock.audit?.status!=='matched'){q-=15;issues.push('fiyat ikinci kaynakla eşleşmedi');}if(!finite(stock.fk)||!finite(stock.roic)){q-=10;issues.push('değerleme metriği eksik');}if(last&&new Date()-new Date(last.date)>8.64e7*7){q-=20;issues.push('fiyat serisi eski');}const out={score:clamp(q),issues};qualityCache.set(stock,out);return out;
 }
 function factors(stock,all){
  if(factorCache.has(stock))return factorCache.get(stock);
  const sector=all.filter(x=>x.sektor===stock.sektor),p=periods(stock),f=financial(stock),r=risk(stock,{history:[]});
  const value=mean([100-(percentile(sector,stock.fk,x=>x.fk)??50),100-(percentile(sector,stock.pddd,x=>x.pddd)??50),100-(percentile(sector,stock.fd_favok,x=>x.fd_favok)??50)]);
  const momentum=mean([percentile(all,p['3A'],x=>periods(x)['3A']),percentile(all,p['6A'],x=>periods(x)['6A']),percentile(all,p['1Y'],x=>periods(x)['1Y'])]);
  const lowVol=100-(percentile(all,r.volatility,x=>risk(x,{history:[]}).volatility)??50);
  const out={value,quality:f.score,momentum,lowVol,size:100-(percentile(all,stock.piyasa_degeri,x=>x.piyasa_degeri)??50)};factorCache.set(stock,out);return out;
 }
 function liquidity(stock){const h=(stock.history||[]).slice(-20),turnover=h.map(x=>x.close*(x.volume||0)).filter(finite),adv=mean(turnover),shares=mean(h.map(x=>x.volume).filter(finite));return {averageDailyValue:adv,averageDailyShares:shares,risk:!adv?'Veri yok':adv<1e7?'Yüksek':adv<5e7?'Orta':'Düşük'};}
 function correlation(a,b,days=252){const am=new Map(),ah=(a.history||[]).slice(-days-1),bh=(b.history||[]).slice(-days-1);for(let i=1;i<ah.length;i++)am.set(ah[i].date,ah[i].close/ah[i-1].close-1);const pairs=[];for(let i=1;i<bh.length;i++)if(am.has(bh[i].date))pairs.push([am.get(bh[i].date),bh[i].close/bh[i-1].close-1]);if(pairs.length<30)return null;const x=pairs.map(p=>p[0]),y=pairs.map(p=>p[1]),xm=mean(x),ym=mean(y),sx=std(x),sy=std(y);return sx&&sy?pairs.reduce((n,p)=>n+(p[0]-xm)*(p[1]-ym),0)/(pairs.length-1)/sx/sy:null;}
 function dcf(stock){const f=stock.financial||{},base=finite(f.ebitda_ttm)&&f.ebitda_ttm>0?f.ebitda_ttm:finite(f.profit_ttm)&&f.profit_ttm>0?f.profit_ttm:null,shares=finite(stock.piyasa_degeri)&&finite(stock.fiyat)&&stock.fiyat>0?stock.piyasa_degeri/stock.fiyat:null;if(!base||!shares)return null;const calc=(g,wacc,multiple)=>{let pv=0,cash=base*.65;for(let y=1;y<=5;y++){cash*=1+g;pv+=cash/(1+wacc)**y;}const terminal=cash*multiple/(1+wacc)**5,equity=pv+terminal-(f.net_debt||0);return equity/shares;};return {bear:calc(.03,.30,4),base:calc(.10,.24,6),bull:calc(.18,.20,8),method:'FAVÖK tabanlı basitleştirilmiş senaryo; serbest nakit akışı yerine yaklaşık dönüşüm kullanır.'};}
 function confidence(stock){const q=quality(stock).score,a=stock.analysis||{},agreement=[a.relative>0,a.reg1?.alpha>0,stock.roic>10,stock.fk>0&&(!a.peerMedian||stock.fk<=a.peerMedian)].filter(Boolean).length;return clamp(Math.round(q*.55+agreement/4*30+(a.reg1?.r2||0)*15));}
 function regime(data){const b=data.benchmark||{},h=b.history||[],last=h.at(-1)?.close,s50=h.length>=50?mean(h.slice(-50).map(x=>x.close)):null,s200=h.length>=200?mean(h.slice(-200).map(x=>x.close)):null,vol=std(returns(h).slice(-20))*Math.sqrt(252)*100;if(last>s50&&s50>s200)return {label:'Yükselen',tone:'good',detail:`Endeks 50 ve 200 günlük ortalamaların üzerinde. 20 günlük oynaklık %${(vol||0).toFixed(1)}.`};if(last<s50&&s50<s200)return {label:'Düşen',tone:'bad',detail:`Endeks 50 ve 200 günlük ortalamaların altında. 20 günlük oynaklık %${(vol||0).toFixed(1)}.`};return {label:'Geçiş / yatay',tone:'warn',detail:`Ortalama sıralaması karışık. 20 günlük oynaklık %${(vol||0).toFixed(1)}.`};}
 function stockView(stock,data){const q=quality(stock),conf=confidence(stock),score=stock.analysis?.score,band=Number.isFinite(score)?Math.max(4,Math.round((100-q.score)/5+8-conf/20)):null;return {risk:risk(stock,data.benchmark),periods:periods(stock),financial:financial(stock),quality:q,factors:factors(stock,data.stocks),confidence:conf,liquidity:liquidity(stock),dcf:dcf(stock),scoreRange:band===null?null:[Math.max(0,score-band),Math.min(100,score+band)]};}
 function universe(data){return (data.stocks||[]).map(s=>({stock:s,...stockView(s,data)}));}
 window.V1Analytics={risk,periods,financial,quality,factors,confidence,regime,stockView,universe,liquidity,correlation,dcf};
})();
