/* One market switcher for every Atlas workspace. No portfolio state is copied. */
(() => {
  const page=location.pathname.split('/').pop(), market=new URLSearchParams(location.search).get('market');
  const active=page==='etf.html'?'etf':page==='global.html'?(market==='us'?'us':market==='eu'?'eu':'global'):'bist';
  const items=[['global','G','Global Atlas','Portföyler, testler ve sonuçlar','global.html'],['bist','B','BIST Atlas','Türkiye hisseleri','index.html#market'],['us','US','ABD hisseleri','Amerikan şirketleri','global.html?market=us'],['eu','EU','Avrupa hisseleri','Avrupa şirketleri','global.html?market=eu'],['etf','E','ETF Atlas','Borsa yatırım fonları','etf.html#market']];
  const current=items.find(x=>x[0]===active),menu=document.querySelector('.atlas-menu');
  if(!menu)return;
  menu.innerHTML=`<summary class="brand" aria-label="Piyasa seç: ${current[2]}"><span class="brandmark">${current[1]}</span><span>${current[2]}<span class="brand-sub">Atlas yatırım merkezi</span></span><span class="atlas-chevron" aria-hidden="true">⌄</span></summary><div class="atlas-menu-options" aria-label="Atlas seçimi">${items.map(([id,icon,name,sub,url])=>`<a ${active===id?'class="selected" aria-current="page"':''} href="${url}"><span class="atlas-menu-icon">${icon}</span><span>${name}<small>${sub}</small></span></a>`).join('')}</div>`;
  document.addEventListener('click',e=>{if(!menu.contains(e.target))menu.open=false;});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}});
})();
