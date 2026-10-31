import React, { useEffect, useState } from 'react';
import story from './data/story.json';
import type { Scene, SceneMedia, Story } from './data/story.d';

const DATA = story as unknown as Story;
const SCENES = DATA.scenes;
const SITE = 'https://bpvsbuckler.bucklerfamily.estate';
const MONTHS: Record<string, number> = {
 jan:0,january:0,feb:1,february:1,mar:2,march:2,apr:3,april:3,may:4,
 jun:5,june:5,jul:6,july:6,aug:7,august:7,sep:8,sept:8,september:8,
 oct:9,october:9,nov:10,november:10,dec:11,december:11
};
type Picture = { key:string; url:string; title:string; date:string; released:string; source:string; event:string };
type Year = { year:number; scenes:{scene:Scene;index:number}[]; images:Picture[]; first:number|null; label:string; summary:string };

function yearOf(v?:string|null):number|null {
 const m=(v||'').match(/^(-?\\d{1,4})/);
 if(!m)return null;
 const y=Number(m[1]);
 return Number.isFinite(y)&&Math.abs(y)<9998?y:null;
}
function urlOf(v:string):string {
 return /^https?:\\/\\//i.test(v)?encodeURI(decodeURI(v)):new URL(v,SITE).toString();
}
function labelOf(year:number, scenes:Scene[]):string {
 if(year<0)return Math.abs(year)+' BC';
 const c=scenes.find(s=>/century/i.test(s.when));
 if(c)return c.when;
 const a=scenes.find(s=>/^(c\\.|circa|approx)/i.test(s.when));
 return a?.when||String(year);
}
function pictureKind(text:string):string {
 const t=text.toLowerCase();
 if(/marconi|wireless|radio|telegraph|preece/.test(t))return 'radio';
 if(/quarry|limeworks|lime kiln/.test(t))return 'quarry';
 if(/demolition|razed|eviction|chainsaw|rubble/.test(t))return 'demolition';
 if(/cemetery|burial|excavation|archaeolog|roman villa|iron age/.test(t))return 'archaeology';
 if(/church|monastery|st dochdwy|manor/.test(t))return 'church';
 if(/planning|development|houses|reserved matters/.test(t))return 'development';
 if(/court|judgment|writ|deed|lease|tenancy|conveyance|registration|land registry|petition|order/.test(t))return 'paper';
 return 'farm';
}
function YearArtwork({year,scenes}:{year:number;scenes:Scene[]}) {
 const kind=pictureKind(scenes.map(s=>s.title+' '+s.narration+' '+s.place).join(' '));
 const era=year<1700?'antique':year<1950?'pastoral':year<1990?'slate':'documentary';
 const id='year-'+String(year).replace('-','b');
 return <svg className={'year-art year-art-'+era} viewBox="0 0 640 360" role="img" aria-label={'Illustrative reconstruction for '+(year<0?Math.abs(year)+' BC':year)}>
  <defs><linearGradient id={id+'-sky'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#526a78"/><stop offset="1" stopColor="#d9c9a6"/></linearGradient><linearGradient id={id+'-land'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#849477"/><stop offset="1" stopColor="#35483b"/></linearGradient></defs>
  <rect width="640" height="360" fill={'url(#'+id+'-sky)'}/><circle cx="510" cy="75" r="34" fill="#f2d39a"/>
  <path d="M0 225Q120 175 230 220T450 210T640 203V360H0Z" fill="#879477"/><path d="M0 270Q170 226 315 270T640 254V360H0Z" fill={'url(#'+id+'-land)'}/>
  {kind==='church'&&<g stroke="#3c4240" strokeWidth="6" strokeLinejoin="round"><path d="M180 265V170L280 110L380 170V265Z" fill="#a9a18e"/><path d="M245 145V84H310V145Z" fill="#8d887b"/><path d="M265 84V48M290 84V48M255 48H300" fill="none"/><path d="M270 197Q280 174 290 197V265H270Z" fill="#42535a"/></g>}
  {kind==='radio'&&<g stroke="#38454c" strokeWidth="5" fill="none"><path d="M315 270L345 64L375 270M330 170H360M323 216H368M335 112H355M345 64V34L326 15M345 34L364 15"/><path d="M395 83Q445 126 395 169M420 55Q500 126 420 197M295 83Q245 126 295 169" stroke="#ead9b5" strokeWidth="8"/></g>}
  {kind==='quarry'&&<g stroke="#474b47" strokeWidth="5"><path d="M70 268L150 102L240 236L330 72L460 256L520 130L610 270Z" fill="#999183"/><path d="M125 183H232M212 222H344M315 164H450M450 211H558" fill="none" stroke="#d5c4a1" strokeWidth="9"/></g>}
  {kind==='paper'&&<g stroke="#454a49" strokeWidth="5"><path d="M190 105H405L455 155V284H190Z" fill="#e6ddc7"/><path d="M405 105V155H455" fill="#c6b99e"/><path d="M225 177H400M225 205H405M225 233H375" stroke="#7a756b" strokeWidth="7" fill="none"/></g>}
  {kind==='demolition'&&<g stroke="#3c4544" strokeWidth="6"><path d="M160 265V178L260 118L348 174L430 125L510 188V265Z" fill="#9a9789"/><path d="M90 291L160 265L210 298L275 276L345 312L420 277L505 302L570 286" fill="none" stroke="#c2ad88" strokeWidth="14"/></g>}
  {kind==='archaeology'&&<g stroke="#454b49" strokeWidth="6"><path d="M115 190H500L455 295H165Z" fill="#af9678"/><path d="M160 230Q245 200 320 240T470 230" fill="none" stroke="#745c49" strokeWidth="10"/><path d="M300 238Q260 193 285 160Q320 136 348 173Q365 210 330 238Z" fill="#c5a77f"/></g>}
  {kind==='development'&&<g stroke="#424a49" strokeWidth="5"><path d="M100 270V188L185 131L270 188V270Z" fill="#d0c7b1"/><path d="M300 270V177L390 120L480 177V270Z" fill="#e0d7c2"/><path d="M490 270V205L555 160L620 205V270Z" fill="#b8b09e"/></g>}
  {kind==='farm'&&<g stroke="#414947" strokeWidth="6"><path d="M154 270V175L278 100L402 175V270Z" fill="#d7cdb7"/><path d="M128 180L278 88L428 180" fill="none" stroke="#524f48" strokeWidth="17"/><path d="M238 270V207Q278 172 318 207V270Z" fill="#59676b"/><path d="M485 270Q470 222 500 202Q540 175 548 215Q570 250 550 270Z" fill="#4c634d"/></g>}
  <path d="M0 315Q160 286 300 315T640 305" stroke="#d7c49c" strokeWidth="3" fill="none" opacity=".7"/>
 </svg>;
}
function buildYears():Year[] {
 const map=new Map<number,Year>();
 const ensure=(year:number)=>{
  if(!map.has(year))map.set(year,{year,scenes:[],images:[],first:null,label:'',summary:''});
  return map.get(year)!;
 };
 SCENES.forEach((scene,index)=>{
  const y=yearOf(scene.date);if(y===null)return;
  const g=ensure(y);g.scenes.push({scene,index});if(g.first===null)g.first=index;
 });
 SCENES.forEach(scene=>(scene.media||[]).forEach((m:SceneMedia)=>{
  const y=yearOf(m.date);if(y===null)return;
  const g=ensure(y),key=m.item||m.url,url=urlOf(m.url);
  const p:Picture={key,url,title:m.title,date:m.date||'',released:m.released||'',source:m.source==='curated'?'Curated scene image':'Archive image · dated by source',event:scene.title};
  const same=g.images.findIndex(x=>x.key===key||x.url===url);
  if(same<0)g.images.push(p);
  else if(m.url.startsWith('/media/')&&!g.images[same].url.includes('/media/'))g.images[same]=p;
 }));
 return [...map.values()].sort((a,b)=>a.year-b.year).map(g=>{
  g.images.sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title));
  const ss=g.scenes.map(x=>x.scene);g.label=labelOf(g.year,ss);
  g.summary=ss.slice(0,3).map(s=>s.title).join(' · ')+(ss.length>3?' · +'+(ss.length-3)+' more events':'');
  return g;
 });
}
const YEARS=buildYears();
function forYear(year:number):Year|undefined{return YEARS.find(y=>y.year===year);}
function scenePictures(scene:Scene):Picture[]{
 const y=yearOf(scene.date);if(y===null)return [];
 const used=new Set<string>(),out:Picture[]=[];
 (scene.media||[]).filter(m=>m.source==='curated'&&(yearOf(m.date)===y||yearOf(m.released)===y)).forEach(m=>{
  const key=m.item||m.url;if(used.has(key))return;used.add(key);
  out.push({key,url:urlOf(m.url),title:m.title,date:m.date||'',released:m.released||'',source:'Scene evidence',event:scene.title});
 });
 return out;
}
function Gallery({year,items,onClose}:{year:number;items:Picture[];onClose:()=>void}) {
 const [index,setIndex]=useState(0),[failed,setFailed]=useState<Record<string,true>>({});
 const current=items[index]||items[0];
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();if(e.key==='ArrowRight')setIndex(i=>(i+1)%items.length);if(e.key==='ArrowLeft')setIndex(i=>(i-1+items.length)%items.length);};
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 },[onClose,items.length]);
 if(!current)return null;
 return <div className="year-lightbox" role="dialog" aria-modal="true" aria-label={year+' image gallery'} onClick={onClose}>
  <figure onClick={e=>e.stopPropagation()}>
   {failed[current.url]?<div className="year-broken">Image unavailable. Open the event to see its source record.</div>:<img src={current.url} alt={current.title} onError={()=>setFailed(p=>({...p,[current.url]:true}))}/>}
   <figcaption><b>{current.title}</b><span>{current.date}{current.released?' · released '+current.released:''} · {current.source} · {current.event}</span><small>{index+1} of {items.length}</small></figcaption>
  </figure>
  <button className="year-lightbox-close" onClick={onClose} aria-label="Close gallery">×</button>
  {items.length>1&&<><button className="year-lightbox-prev" onClick={()=>setIndex(i=>(i-1+items.length)%items.length)} aria-label="Previous image">‹</button><button className="year-lightbox-next" onClick={()=>setIndex(i=>(i+1)%items.length)} aria-label="Next image">›</button></>}
 </div>;
}
export function YearGallery({onPick}:{onPick:(i:number)=>void}) {
 const [gallery,setGallery]=useState<Year|null>(null),[broken,setBroken]=useState<Record<string,true>>({});
 return <div className="sheet year-sheet">
  <header className="year-intro"><div className="year-kicker">THE STORY, BY YEAR</div><h1>Years in pictures</h1>
   <p>Start with photographs and dated records. Open a year’s gallery, then follow its events into the account, source documents and competing interpretations. Each image is grouped by the date it depicts—not the broader period of a scene.</p>
   <div className="year-count">{YEARS.length} years · {YEARS.reduce((n,y)=>n+y.images.length,0)} dated images in the archive</div>
  </header>
  <div className="year-grid">{YEARS.map(g=>{
   const first=g.scenes[0]?.scene,has=g.images.length>0&&!broken[String(g.year)];
   return <article className="year-card" key={g.year}>
    <button className="year-cover" onClick={()=>g.images.length?setGallery(g):g.first!==null&&onPick(g.first)} aria-label={g.images.length?'Open images from '+g.label:'Read '+g.label}>
     {has?<img src={g.images[0].url} alt={g.images[0].title} loading="lazy" onError={()=>setBroken(p=>({...p,[String(g.year)]:true}))}/>:<YearArtwork year={g.year} scenes={g.scenes.map(x=>x.scene)}/>}
     <span className="year-number">{g.year<0?Math.abs(g.year)+' BC':g.year}</span>
     {!has&&<span className="year-art-label">{g.images.length?'Image unavailable':'Illustrative reconstruction'}</span>}
     {g.images.length>1&&<span className="year-image-count">{g.images.length} images</span>}
    </button>
    <div className="year-card-copy">
     <div className="year-card-meta"><b>{g.label}</b><span>{g.scenes.length} event{g.scenes.length===1?'':'s'}</span></div>
     <h2>{first?.title||'Archive image'}</h2><p>{g.summary||'Dated image in the archive'}</p>
     <div className="year-events">{g.scenes.slice(0,3).map(({scene,index})=><button key={scene.id} onClick={()=>onPick(index)}>{scene.title}</button>)}{g.scenes.length>3&&<span>+{g.scenes.length-3} further events</span>}</div>
     <div className="year-card-actions">{g.first!==null&&<button onClick={()=>onPick(g.first!)}>Read year</button>}{g.images.length>0&&<button onClick={()=>setGallery(g)}>Open gallery ({g.images.length})</button>}</div>
    </div>
   </article>;
  })}</div>
  {gallery&&<Gallery year={gallery.year} items={gallery.images} onClose={()=>setGallery(null)}/>}
 </div>;
}
export function YearMediaViewer({scene}:{scene:Scene}) {
 const year=yearOf(scene.date),group=year===null?undefined:forYear(year);
 const specific=scenePictures(scene),items=specific.length?specific:group?.images||[],all=group?.images||items;
 const [index,setIndex]=useState(0),[open,setOpen]=useState(false),[failed,setFailed]=useState<Record<string,true>>({});
 useEffect(()=>{setIndex(0);setOpen(false);setFailed({});},[scene.id]);
 const current=items[index]||items[0],visible=!!current&&!failed[current.url];
 return <section className="year-stage">
  <div className="year-stage-heading"><span>PICTURES FROM THE RECORD</span><b>{scene.when}</b></div>
  {visible?<div className="year-stage-photo">
   <img src={current.url} alt={current.title} onError={()=>setFailed(p=>({...p,[current.url]:true}))}/>
   <div className="year-stage-caption"><b>{current.title}</b><span>{current.date}{current.released?' · released '+current.released:''} · {index+1} of {items.length}</span></div>
   {items.length>1&&<div className="year-stage-controls"><button onClick={()=>setIndex(i=>(i-1+items.length)%items.length)} aria-label="Previous image">‹</button><button onClick={()=>setIndex(i=>(i+1)%items.length)} aria-label="Next image">›</button></div>}
   {all.length>0&&<button className="year-stage-expand" onClick={()=>setOpen(true)}>Open year gallery ⤢</button>}
  </div>:<div className="year-stage-art"><YearArtwork year={year??0} scenes={[scene]}/><span>{specific.length?'The linked image could not be loaded.':'No dated photograph is linked to this particular event. This is an illustrative signpost, not a historical image.'}</span></div>}
  {open&&all.length>0&&<Gallery year={year??0} items={all} onClose={()=>setOpen(false)}/>}
 </section>;
}
