/* Mapa interactivo (Leaflet + imagen) */
const qs = new URLSearchParams(location.search);
const editMode = qs.get('edit') === '1';
const elList = document.getElementById('list');
const elSearch = document.getElementById('search');
const elEditPanel = document.getElementById('editPanel');
const elBadge = document.getElementById('modeBadge');
const elExport = document.getElementById('exportBox');
const btnExport = document.getElementById('btnExport');
const btnClear = document.getElementById('btnClear');
const btnLanguage = document.getElementById('btnLanguage');
let lang = 'es';
let data = null; let map = null; let markers = new Map(); let selectedId = null;
function t(point, field){ if(lang==='en'){ if(field==='name') return point.name_en || point.name; if(field==='desc') return point.desc_en || point.desc || ''; } return point[field] || ''; }
function isPlaced(p){ return Number.isFinite(p.x) && Number.isFinite(p.y); }
function popupHtml(p){ const name=t(p,'name'); const desc=t(p,'desc'); const coord=isPlaced(p)?`<div class="sub">x:${Math.round(p.x)} y:${Math.round(p.y)}</div>`:''; return `<div style="min-width:200px"><b>${name}</b><div style="margin-top:6px">${desc || '<span style="color:#888">(sin descripción)</span>'}</div>${editMode?coord:''}</div>`; }
function renderList(){ const q=(elSearch.value||'').toLowerCase().trim(); elList.innerHTML=''; data.points.filter(p=>{ const name=(t(p,'name')+' '+(t(p,'desc')||'')).toLowerCase(); return !q||name.includes(q); }).forEach(p=>{ const li=document.createElement('li'); li.className='item'+(p.id===selectedId?' active':''); li.dataset.id=p.id; const placed=isPlaced(p)?'📍':'⬚'; li.innerHTML=`<div class="title">${placed} ${t(p,'name')}</div><div class="sub">${t(p,'desc')||(lang==='es'?'Sin descripción':'No description')}</div>`; li.addEventListener('click',()=>selectPoint(p.id,true)); elList.appendChild(li); }); }
function selectPoint(id,panTo){ selectedId=id; renderList(); const p=data.points.find(x=>x.id===id); if(!p) return; const mk=markers.get(id); if(mk){ mk.openPopup(); if(panTo) map.panTo(mk.getLatLng()); } else if(panTo && isPlaced(p)) { map.panTo([p.y,p.x]); } }
function rebuildMarkers(){ for(const mk of markers.values()) mk.remove(); markers.clear(); data.points.forEach(p=>{ if(!isPlaced(p)) return; const mk=L.marker([p.y,p.x],{keyboard:false}).addTo(map); mk.bindPopup(popupHtml(p)); mk.on('click',()=>selectPoint(p.id,false)); markers.set(p.id,mk); }); }
function updateOneMarker(p){ const existing=markers.get(p.id); if(existing) existing.remove(); if(isPlaced(p)){ const mk=L.marker([p.y,p.x],{keyboard:false}).addTo(map); mk.bindPopup(popupHtml(p)); mk.on('click',()=>selectPoint(p.id,false)); markers.set(p.id,mk); } }
function exportJson(){ const payload=JSON.stringify(data,null,2); elExport.value=payload; elExport.focus(); elExport.select(); try{document.execCommand('copy');}catch(e){} }
async function init(){ data=await (await fetch('data.json',{cache:'no-store'})).json(); if(editMode){ elEditPanel.hidden=false; elBadge.hidden=false; }
  map=L.map('map',{crs:L.CRS.Simple,minZoom:-2,maxZoom:3,zoomSnap:0.25,wheelPxPerZoomLevel:120});
  if(!data.image){ alert('No se encontró imagen base. Sube mapa.png y actualiza data.json'); return; }
  const w=data.imageWidth, h=data.imageHeight; const bounds=[[0,0],[h,w]]; L.imageOverlay(data.image,bounds).addTo(map); map.fitBounds(bounds);
  rebuildMarkers(); renderList();
  map.on('click',(e)=>{ if(!editMode) return; if(!selectedId){ alert(lang==='es'?'Selecciona un lugar en la lista primero.':'Select a place from the list first.'); return; } const p=data.points.find(x=>x.id===selectedId); p.x=e.latlng.lng; p.y=e.latlng.lat; updateOneMarker(p); exportJson(); renderList(); });
  elSearch.addEventListener('input',renderList); btnExport?.addEventListener('click',exportJson);
  btnClear?.addEventListener('click',()=>{ if(!selectedId) return; const p=data.points.find(x=>x.id===selectedId); p.x=null; p.y=null; updateOneMarker(p); exportJson(); renderList(); });
  btnLanguage.addEventListener('click',()=>{ lang=(lang==='es')?'en':'es'; for(const p of data.points){ const mk=markers.get(p.id); if(mk) mk.setPopupContent(popupHtml(p)); } renderList(); });
  selectPoint(1,false);
}
init();
