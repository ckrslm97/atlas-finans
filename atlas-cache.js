/* The two Atlas pages share recent snapshots so switching views never waits for a full dataset download. */
window.AtlasCache=(()=>{
  const maxAge=5*60*1000;
  const database=()=>new Promise((resolve,reject)=>{
    const request=indexedDB.open('atlas-view-cache',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('snapshots',{keyPath:'id'});
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
  const id=async(namespace,key)=>{
    if(!key)return null;
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));
    return namespace+':'+[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
  };
  const read=async(namespace,key)=>{
    try{
      const cacheId=await id(namespace,key);if(!cacheId)return null;
      const db=await database();
      const result=await new Promise((resolve,reject)=>{const request=db.transaction('snapshots').objectStore('snapshots').get(cacheId);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error);});
      db.close();return result;
    }catch{return null;}
  };
  const write=async(namespace,key,value)=>{
    try{
      const cacheId=await id(namespace,key);if(!cacheId)return;
      const db=await database();
      await new Promise((resolve,reject)=>{const request=db.transaction('snapshots','readwrite').objectStore('snapshots').put({id:cacheId,at:Date.now(),value});request.onsuccess=resolve;request.onerror=()=>reject(request.error);});
      db.close();
    }catch{}
  };
  return {read,write,isFresh:entry=>Boolean(entry&&Date.now()-entry.at<maxAge)};
})();
document.addEventListener('click',event=>{const menu=document.querySelector('.atlas-menu');if(menu?.open&&!menu.contains(event.target))menu.open=false;});
