/* Shared progressive disclosure. Moves existing nodes so handlers and form state survive. */
(() => {
 const main=document.querySelector('main');if(!main)return;
 const global=document.body.classList.contains('global-workspace');
 const opened=new Map();
 const fold=(nodes,title,key)=>{
  nodes=nodes.filter(n=>n&&!n.closest('.focus-fold'));if(!nodes.length)return;
  const d=document.createElement('details');d.className='focus-fold';d.dataset.fold=key;
  d.open=opened.get(key)||false;
  const s=document.createElement('summary');s.textContent=title;d.append(s);
  nodes[0].before(d);const content=document.createElement('div');content.className='focus-fold-content';d.append(content);nodes.forEach(n=>content.append(n));
  d.addEventListener('toggle',()=>opened.set(key,d.open));
 };
 if(global){
  const groups={results:['results','portfolios'],instruments:['instruments'],tests:['tests','paper','financial'],health:['health']};
  const titles={results:['Genel özet','Portföylerin ve kâr / zarar durumu.'],instruments:['Piyasalar','Şirketleri ve fonları bul, fiyatlarını karşılaştır.'],tests:['Araştırma','Model testleri, raporlar ve onaylı sanal işlemler.'],health:['Kaynaklar','Verinin kapsamı, tarihi ve bağlantı durumu.']};
  const aliases={portfolios:'results',paper:'tests',financial:'tests'};
  const nav=document.querySelector('.topbar nav');nav.innerHTML=[['results','Özet'],['instruments','Piyasalar'],['tests','Araştırma'],['health','Kaynaklar']].map(([id,label])=>`<a href="#${id}">${label}</a>`).join('');
  function show(){const hash=location.hash.slice(1),key=aliases[hash]|| (groups[hash]?hash:'results');
   for(const [group,ids] of Object.entries(groups))for(const id of ids)document.getElementById(id).hidden=group!==key;
   nav.querySelectorAll('a').forEach(a=>{const active=a.hash==='#'+key;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
   document.getElementById('page-title').textContent=titles[key][0];document.getElementById('page-description').textContent=titles[key][1];
  }
  nav.addEventListener('click',event=>{const a=event.target.closest('a');if(!a||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();location.hash=a.hash;show();window.scrollTo({top:0,behavior:'instant'});});
  show();window.addEventListener('hashchange',show);return;
 }
 let detailed=false;try{detailed=localStorage.getItem('atlasDetailedView')==='true';}catch{}
 document.body.classList.toggle('atlas-simple',!detailed);
 // Keep terminology consistent across the four market workspaces.
 document.querySelectorAll('.topbar nav a').forEach(a=>{if(a.hash==='#intelligence')a.textContent='Analiz';if(a.hash==='#guide')a.textContent='Rehber';if(a.getAttribute('href')==='global.html')a.remove();});
 function enhance(){
  observer.disconnect();
  const market=main.querySelector('#stock-table,#etf-market-table');
  if(market){
   const header=market.closest('.panel')?.querySelector('.section-head');
   if(header&&!header.querySelector('.focus-view')){
    const button=document.createElement('button');button.className='focus-view quiet';
    const update=()=>{button.textContent=detailed?'Sade görünüm':'Ayrıntılı görünüm';button.setAttribute('aria-pressed',String(detailed));};update();
    button.onclick=()=>{detailed=!detailed;document.body.classList.toggle('atlas-simple',!detailed);try{localStorage.setItem('atlasDetailedView',String(detailed));}catch{}update();};header.append(button);
    const hint=header.querySelector('small');if(hint)hint.textContent='Fiyat, günlük değişim, skor ve kaynak kontrolü. Ayrıntılar için varlığı aç.';
   }
   fold([...main.querySelectorAll(':scope > .movers')],'Günün hareketleri ve skor sıralamaları','movers');
   fold([...main.querySelectorAll(':scope > .ai-market-brief')],'Günlük piyasa değerlendirmesi','brief');
   // Put the searchable list ahead of optional reading and rankings.
   for(const key of ['brief','movers']){const d=main.querySelector(`:scope > [data-fold="${key}"]`);if(d&&d.compareDocumentPosition(market)&Node.DOCUMENT_POSITION_FOLLOWING)main.append(d);}
   // Tag columns by their stable semantic key; works after sorting and reordering.
   market.querySelectorAll('table').forEach(table=>{
    const cells=[...table.querySelectorAll('thead th')];
    cells.forEach((th,i)=>{const key=th.dataset.marketColumn||th.dataset.column||th.dataset.etfColumn||th.dataset.col;
     const advanced=key&&!['company','fund','price','change','score','signal','audit','compare'].includes(key);
     th.classList.toggle('focus-advanced',!!advanced);
     table.querySelectorAll('tbody tr').forEach(row=>row.children[i]?.classList.toggle('focus-advanced',!!advanced));
    });
   });
  }
  if(location.hash==='#intelligence'){
   fold([...main.querySelectorAll(':scope > .research-lab')],'Tahmin modeli ve geçmiş testler','research');
   fold([...main.querySelectorAll(':scope > .decision-strip')],'Piyasa göstergeleri','decision');
   fold([...main.querySelectorAll(':scope > .news-impact-panel')],'Haberlerin skora etkisi','news');
   fold([...main.querySelectorAll(':scope > .intelligence-grid, :scope > .two-col')],'Risk, finansal kalite ve takip araçları','analysis');
  }
  observer.observe(main,{childList:true,subtree:true});
 }
 const observer=new MutationObserver(enhance);enhance();
})();
