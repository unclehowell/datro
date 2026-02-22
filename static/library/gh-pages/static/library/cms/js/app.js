async function fetchJSON(url){const r=await fetch(url); if(!r.ok) throw new Error('HTTP '+r.status); return await r.json();}

function renderInventory(list){
  const el=document.getElementById('inventoryList');
  if(!list||list.length===0){ el.innerHTML='<div>No items</div>'; return; }
  el.innerHTML='<ul>'+list.map(i=>`<li>${i.id} - ${i.path} [${i.language}] (${i.version})</li>`).join('')+'</ul>';
}

document.addEventListener('DOMContentLoaded',async ()=>{
  try{ const inv=await fetchJSON('/api/inventory.php'); renderInventory(inv); }catch(e){ document.getElementById('inventoryList').innerText='Error loading'; }
  document.getElementById('btnRefresh').onclick = async ()=>{ const inv=await fetchJSON('/api/inventory.php'); renderInventory(inv); };
  // New document form
  document.getElementById('formNew').addEventListener('submit', async (ev)=>{ ev.preventDefault(); const payload={ path: document.getElementById('inPath').value, language: document.getElementById('inLang').value, version: document.getElementById('inVersion').value, id: (document.getElementById('inPath').value+'_'+document.getElementById('inVersion').value) , type: document.getElementById('inType').value }; await fetch('/api/inventory.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }); location.reload(); });
  // Archive form
  document.getElementById('formArchive').addEventListener('submit', async (ev)=>{ ev.preventDefault(); const payload={ id: document.getElementById('arcId').value }; await fetch('/api/archive.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }); location.reload(); });
  // Version form
  document.getElementById('formVersion').addEventListener('submit', async (ev)=>{ ev.preventDefault(); const v=document.getElementById('verNew').value; await fetch('/api/version.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'new', version:v }) }); location.reload(); });
  // Export form
  document.getElementById('formExport').addEventListener('submit', async (ev)=>{ ev.preventDefault(); const v=document.getElementById('expVer').value; const fmt=document.getElementById('expFmt').value; const res = await fetch('/api/export.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ version:v, format:fmt }) }); const data = await res.json(); alert(data.ok? 'Export created: '+data.file : data.error); });
});
