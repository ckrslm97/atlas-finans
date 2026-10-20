(function(root){
 const metrics={
  price:{label:'Fiyat · TL',get:s=>s.fiyat},change:{label:'Günlük değişim · %',get:s=>s.gun_pct},score:{label:'Nihai skor',get:s=>s.newsLayer?.finalScore??s.analysis.score},fk:{label:'F/K',get:s=>s.fk},pddd:{label:'PD/DD',get:s=>s.pddd},roic:{label:'ROIC · %',get:s=>s.roic},beta:{label:'Beta · 1Y',get:s=>s.analysis.reg1?.beta},alpha:{label:'Alfa · 1Y %',get:s=>s.analysis.reg1?.alpha},cap:{label:'Piyasa değeri · TL',get:s=>s.piyasa_degeri,additive:true},assets:{label:'Varlıklar · TL',get:s=>s.financial.assets,additive:true,financial:true},equity:{label:'Özkaynaklar · TL',get:s=>s.financial.equity,additive:true,financial:true},revenue:{label:'Hasılat · TTM TL',get:s=>s.financial.revenue_ttm,additive:true,financial:true},profit:{label:'Net kâr · TTM TL',get:s=>s.financial.profit_ttm,additive:true,financial:true}
 };
 function aggregate(rows,key,op){
  const m=metrics[key];if(!m)return {value:null,n:0,error:'Geçersiz metrik'};
  const valid=rows.filter(s=>Number.isFinite(m.get(s)));const n=valid.length;
  if(op==='sum'&&!m.additive)return {value:null,n,error:'Bu metrik toplanmaz'};
  if(m.financial&&new Set(valid.map(s=>s.financial.period)).size>1)return {value:null,n,error:'Finansal dönemler farklı'};
  if(!n)return {value:null,n};const v=valid.map(m.get).sort((a,b)=>a-b);
  if(op==='weighted'){
   const w=valid.filter(s=>Number.isFinite(s.piyasa_degeri)&&s.piyasa_degeri>0);const total=w.reduce((a,s)=>a+s.piyasa_degeri,0);
   return {value:total?w.reduce((a,s)=>a+m.get(s)*s.piyasa_degeri,0)/total:null,n:w.length};
  }
  const sum=v.reduce((a,b)=>a+b,0);return {value:op==='sum'?sum:op==='min'?v[0]:op==='max'?v[n-1]:op==='median'?(v[Math.floor((n-1)/2)]+v[Math.floor(n/2)])/2:sum/n,n};
 }
 function normalized(stocks,days){
  if(!stocks.length)return [];
  let dates=stocks[0].history.map(p=>p.date);
  for(const s of stocks.slice(1)){const set=new Set(s.history.map(p=>p.date));dates=dates.filter(d=>set.has(d));}
  if(!dates.length)return [];
  const cutoff=new Date(dates[dates.length-1]);cutoff.setUTCDate(cutoff.getUTCDate()-days);dates=dates.filter(d=>d>=cutoff.toISOString().slice(0,10));
  return stocks.map(s=>{const map=new Map(s.history.map(p=>[p.date,p.close]));const base=map.get(dates[0]);return {name:s.kod,history:dates.map(d=>({date:d,close:map.get(d)/base*100}))};});
 }
 const api={metrics,aggregate,normalized};if(typeof module!=='undefined')module.exports=api;else root.Analytics=api;
})(typeof window!=='undefined'?window:globalThis);
