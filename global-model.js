/* Pure calculations shared by the dashboard and its regression tests. */
(function(root){
 const finite=v=>typeof v==='number'&&Number.isFinite(v);
 function combined(portfolios){
  const complete=portfolios.length===2&&portfolios.every(p=>p&&p.currency==='TRY'&&finite(p.equityCents)&&finite(p.profitCents)&&finite(p.contributedCents));
  if(!complete)return {complete:false,equityCents:null,profitCents:null,returnPct:null};
  const sum=k=>portfolios.reduce((n,p)=>n+p[k],0),contributed=sum('contributedCents');
  return {complete:true,equityCents:sum('equityCents'),profitCents:sum('profitCents'),returnPct:contributed>0?sum('profitCents')/contributed*100:null};
 }
 function testStats(rows){
  const latest=new Map();
  for(const row of rows){const id=row.namespace+':'+row.code+':'+row.model_version,old=latest.get(id);if(!old||Date.parse(row.observed_at)>Date.parse(old.observed_at))latest.set(id,row);}
  const tested=[...latest.values()].filter(r=>r.report?.forecast?.available&&r.report?.forecast?.test?.samples>0);
  return {unique:latest.size,tested:tested.length,better:tested.filter(r=>r.report.forecast.test.beatsBaselines===true).length};
 }
 const api={combined,testStats};if(typeof module!=='undefined')module.exports=api;else root.AtlasGlobalModel=api;
})(globalThis);
