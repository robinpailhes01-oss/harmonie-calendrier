import { useState, useEffect, useCallback, useMemo } from "react";

const SB="https://utyfpmjhtfoxsxncfoxe.supabase.co",SK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0eWZwbWpodGZveHN4bmNmb3hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzgzMTUsImV4cCI6MjA4OTYxNDMxNX0.OGLR8d0GOZVMM48WlhUYrGsnthaaNNxBGPUHpJoSong";
const LAT=43.5283,LON=3.9816;
const MN=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DL=["L","M","M","J","V","S","D"],DFL=["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const TX={nuit_classique:150,nuit_prestige:350,sortie_mer_2h:380,sortie_mer_3h:550,sortie_mer_4h:750};
const FM={nuit_classique:{c:"#007AFF",l:"Classique",i:"🌙"},nuit_prestige:{c:"#AF52DE",l:"Prestige",i:"✨"},sortie_mer_2h:{c:"#30D158",l:"Sortie 2h",i:"⛵"},sortie_mer_3h:{c:"#30D158",l:"Sortie 3h",i:"⛵"},sortie_mer_4h:{c:"#30D158",l:"Sortie 4h",i:"⛵"}};

function pda(ds,ref){if(!ds)return null;const d=ds.toLowerCase().trim(),y=ref.getFullYear(),cm=ref.getMonth(),cd=ref.getDate();
if(/attendre|pas encore|incertain|sait pas|aucune|planning/.test(d))return null;
if(/ce mois/.test(d))return new Date(y,cm,20);if(/mois prochain/.test(d))return new Date(y,cm+1,15);
const jrs={lundi:1,mardi:2,mercredi:3,jeudi:4,vendredi:5,samedi:6,dimanche:0};
for(const j in jrs){if(d.includes(j)){const n=d.match(/\d+/);if(n){let c=new Date(y,cm,parseInt(n[0]));if(c<ref)c=new Date(y,cm+1,parseInt(n[0]));return c;}let f=(jrs[j]-ref.getDay()+7)%7;if(!f)f=7;return new Date(y,cm,cd+f);}}
const ms={janvier:0,fevrier:1,"février":1,mars:2,avril:3,mai:4,juin:5,juillet:6,aout:7,"août":7,septembre:8,octobre:9,novembre:10,decembre:11,"décembre":11};
for(const m in ms){if(d.includes(m)){const dm=d.match(/(\d+)/);let dy=dm?parseInt(dm[1]):/début/.test(d)?5:/mi[- ]/.test(d)?15:/fin/.test(d)?25:15;
const ym=d.match(/20\d{2}/);const yr=ym?parseInt(ym[0]):y;
let r=new Date(yr,ms[m],dy);if(!ym&&r<new Date(y,cm-2,1))r=new Date(y+1,ms[m],dy);return r;}}
const nm=d.match(/(\d{1,2})[/-](\d{1,2})/);if(nm)return new Date(y,parseInt(nm[2])-1,parseInt(nm[1]));return null;}

function useW(){const[w,s]=useState(typeof window!=="undefined"?window.innerWidth:1200);useEffect(()=>{const h=()=>s(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);return w;}

const st=`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
@keyframes au{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
@keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
.au{animation:au .2s ease both}.su{animation:su .25s cubic-bezier(.32,.72,0,1) both}`;

export default function App(){
  const[dk,setDk]=useState(true);const[cur,setCur]=useState(new Date());
  const[allLeads,setAllLeads]=useState([]);const[datedLeads,setDatedLeads]=useState([]);
  const[wx,setWx]=useState({});const[sel,setSel]=useState(null);const[tab,setTab]=useState("all");
  const[fin,setFin]=useState({rev:0,dep:0,nR:0,nD:0});
  const W=useW();const mob=W<768;
  const yr=cur.getFullYear(),mo=cur.getMonth();
  const fd=(new Date(yr,mo,1).getDay()+6)%7,dim=new Date(yr,mo+1,0).getDate();
  const now=useMemo(()=>new Date(),[]);

  const c=dk
    ?{bg:"#000",s:"#1c1c1e",s2:"#2c2c2e",s3:"#3a3a3c",bd:"#38383a",tx:"#f5f5f7",tx2:"#a1a1a6",tx3:"#636366",ac:"#0A84FF",red:"#FF453A",or:"#FF9F0A",gn:"#30D158",pu:"#BF5AF2",sel:"rgba(10,132,255,0.12)"}
    :{bg:"#f5f5f7",s:"#fff",s2:"#f2f2f7",s3:"#e5e5ea",bd:"#d1d1d6",tx:"#1d1d1f",tx2:"#86868b",tx3:"#aeaeb2",ac:"#007AFF",red:"#FF3B30",or:"#FF9F0A",gn:"#34C759",pu:"#AF52DE",sel:"rgba(0,122,255,0.07)"};

  const sb=useCallback(async(p)=>{const r=await fetch(`${SB}/rest/v1/${p}`,{headers:{apikey:SK,Authorization:`Bearer ${SK}`}});return r.json();},[]);

  const load=useCallback(async()=>{
    try{const d=await sb("leads?select=*&statut=not.eq.perdu");
    const f=d.filter(l=>!["robinpailhes","robinai_consulting"].includes(l.instagram_username)).sort((a,b)=>(b.score||0)-(a.score||0));
    setAllLeads(f);setDatedLeads(f.filter(l=>l.date_souhaitee).map(l=>({...l,pd:pda(l.date_souhaitee,now)})));}catch(e){}
    try{const[rv,dp]=await Promise.all([sb("revenus?select=montant"),sb("depenses?select=montant")]);
    setFin({rev:rv.reduce((s,r)=>s+parseFloat(r.montant||0),0),dep:dp.reduce((s,r)=>s+parseFloat(r.montant||0),0),nR:rv.length,nD:dp.length});}catch(e){}
    try{const s=new Date(yr,mo,1).toISOString().split("T")[0],e=new Date(yr,mo+1,0).toISOString().split("T")[0];
    const[mt,mr]=await Promise.all([fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weathercode,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&start_date=${s}&end_date=${e}&timezone=Europe/Paris`).then(r=>r.json()),
    fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}&daily=wave_height_max&start_date=${s}&end_date=${e}&timezone=Europe/Paris`).then(r=>r.json()).catch(()=>null)]);
    const m={};if(mt.daily)mt.daily.time.forEach((d,i)=>{m[d]={code:mt.daily.weathercode[i],hi:Math.round(mt.daily.temperature_2m_max[i]),lo:Math.round(mt.daily.temperature_2m_min[i]),wind:Math.round(mt.daily.wind_speed_10m_max[i]),wave:mr?.daily?.wave_height_max?.[i]?parseFloat(mr.daily.wave_height_max[i]).toFixed(1):null};});
    setWx(m);}catch(e){}
  },[yr,mo,now,sb]);
  useEffect(()=>{load();},[load]);

  const lfd=d=>datedLeads.filter(l=>l.pd&&l.pd.getFullYear()===yr&&l.pd.getMonth()===mo&&l.pd.getDate()===d);
  const wfd=d=>wx[`${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`]||null;
  const itd=d=>d===now.getDate()&&mo===now.getMonth()&&yr===now.getFullYear();
  const wi=code=>{if(code==null)return"";if(code>=61)return"🌧";if(code>=51)return"🌦";if(code>=45)return"🌫";if(code>=3)return"⛅";if(code>=1)return"🌤";return"☀️";};
  const isG=w=>w&&w.code<3&&w.hi>=20&&w.wind<30&&(!w.wave||parseFloat(w.wave)<1);

  const mP=useMemo(()=>datedLeads.filter(l=>l.pd&&l.pd.getMonth()===mo&&l.pd.getFullYear()===yr).sort((a,b)=>(b.score||0)-(a.score||0)),[datedLeads,mo,yr]);
  const up=useMemo(()=>datedLeads.filter(l=>l.pd&&l.pd>=new Date(now.getFullYear(),now.getMonth(),now.getDate())).sort((a,b)=>a.pd-b.pd),[datedLeads,now]);
  const pipe=useMemo(()=>datedLeads.reduce((s,l)=>s+(TX[l.type_interet]||0),0),[datedLeads]);
  const sl=sel?lfd(sel):[];const sw=sel?wfd(sel):null;
  const profit=fin.rev-fin.dep;

  const filtered=useMemo(()=>{
    if(tab==="all")return allLeads;
    if(tab==="chaud")return allLeads.filter(l=>l.temperature==="chaud");
    if(tab==="tiede")return allLeads.filter(l=>l.temperature==="tiede");
    return allLeads.filter(l=>l.temperature==="froid");
  },[allLeads,tab]);

  const f="-apple-system,BlinkMacSystemFont,'Inter','Helvetica Neue',sans-serif";
  const Chip=({children,color})=><span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,background:`${color}14`,color}}>{children}</span>;

  // Dot color logic for calendar
  const dotColor=(dl)=>{
    if(dl.some(l=>l.statut==="reserve"))return c.gn;
    if(dl.some(l=>l.temperature==="chaud"))return c.red;
    if(dl.some(l=>l.temperature==="tiede"))return c.or;
    return c.tx3;
  };

  const Card=({l,compact})=>{
    const fm=FM[l.type_interet]||{c:c.tx3,l:"—",i:"👤"};const rv=l.statut==="reserve";
    const dl=l.pd?Math.max(0,Math.round((l.pd-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/864e5)):null;
    const ago=l.derniere_interaction?Math.round((now-new Date(l.derniere_interaction))/864e5):null;
    return(
      <div className="au" style={{background:c.s,borderRadius:compact?10:14,padding:compact?10:16,border:`0.5px solid ${c.bd}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:compact?6:8,flex:1,minWidth:0}}>
            <div style={{width:compact?24:32,height:compact?24:32,borderRadius:compact?7:10,background:`${fm.c}12`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:compact?11:14,flexShrink:0}}>{fm.i}</div>
            <div style={{minWidth:0}}>
              <div style={{fontWeight:600,fontSize:compact?12:15,letterSpacing:"-0.02em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.prenom?.replace(/^\w/,x=>x.toUpperCase())||l.instagram_username}</div>
              <div style={{fontSize:compact?10:11,color:c.tx2}}>{fm.l}{l.occasion?` · ${l.occasion}`:""}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:compact?4:6,flexShrink:0}}>
            {dl!==null&&dl<90&&<span style={{fontSize:compact?11:13,fontWeight:700,letterSpacing:"-0.02em",color:dl<=7?c.red:dl<=21?c.or:c.gn}}>J-{dl}</span>}
            {rv?<Chip color={c.gn}>Réservé</Chip>
            :l.temperature==="chaud"?<Chip color={c.red}>Chaud</Chip>
            :l.temperature==="tiede"?<Chip color={c.or}>Tiède</Chip>
            :<Chip color={c.tx3}>Froid</Chip>}
          </div>
        </div>
        {!compact&&<div style={{marginTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:c.tx3}}>@{l.instagram_username}</span>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:40,height:3,borderRadius:2,background:`${c.tx3}25`,overflow:"hidden"}}><div style={{width:`${l.score}%`,height:"100%",borderRadius:2,background:c.ac}}/></div>
            <span style={{fontSize:11,fontWeight:600,color:c.tx2}}>{l.score}</span>
          </div>
        </div>}
        {!compact&&<div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap",fontSize:11,color:c.tx3}}>
          {l.date_souhaitee&&<span>📅 {l.date_souhaitee}</span>}
          {l.nombre_messages>0&&<span>💬 {l.nombre_messages}</span>}
          {l.telephone&&<span style={{color:c.gn}}>📱 {l.telephone}</span>}
          {ago!==null&&<span style={{marginLeft:"auto"}}>{ago===0?"Auj.":ago===1?"Hier":`${ago}j`}</span>}
        </div>}
        {!compact&&!rv&&l.date_souhaitee&&l.pd&&<div style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:c.or,marginTop:8,padding:"5px 8px",background:`${c.or}08`,borderRadius:8,fontWeight:500}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:l.temperature==="chaud"?c.red:c.or}}/>En attente de confirmation
        </div>}
      </div>
    );
  };

  return(
    <div style={{background:c.bg,color:c.tx,minHeight:"100vh",fontFamily:f}}>
      <style>{st}</style>

      {/* Header */}
      <header style={{borderBottom:`0.5px solid ${c.bd}`,background:dk?"rgba(0,0,0,0.8)":"rgba(245,245,247,0.8)",backdropFilter:"saturate(180%) blur(20px)",WebkitBackdropFilter:"saturate(180%) blur(20px)",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:mob?"10px 16px":"12px 28px"}}>
          <div style={{display:"flex",alignItems:"center",gap:mob?8:12}}>
            <span style={{fontSize:mob?20:24}}>⛵</span>
            <div><div style={{fontSize:mob?15:17,fontWeight:700,letterSpacing:"-0.03em"}}>Harmonie Yacht</div>
            {!mob&&<div style={{fontSize:11,color:c.tx3}}>Port de Carnon</div>}</div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {!mob&&<div style={{display:"flex",gap:3,fontSize:9,color:c.tx3,alignItems:"center",marginRight:8}}>
              <span style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:6,height:6,borderRadius:"50%",background:c.red}}/>Chaud</span>
              <span style={{display:"flex",alignItems:"center",gap:3,marginLeft:6}}><span style={{width:6,height:6,borderRadius:"50%",background:c.or}}/>Tiède</span>
              <span style={{display:"flex",alignItems:"center",gap:3,marginLeft:6}}><span style={{width:6,height:6,borderRadius:"50%",background:c.gn}}/>Réservé</span>
            </div>}
            <button onClick={()=>setDk(!dk)} style={{background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:10,padding:"6px 10px",cursor:"pointer",fontSize:14,color:c.tx}}>{dk?"☀️":"🌙"}</button>
          </div>
        </div>
        {/* KPIs */}
        <div style={{display:"flex",borderTop:`0.5px solid ${c.bd}`,overflow:"auto"}}>
          {[{l:"Revenus",v:`${fin.rev}€`,s:`${fin.nR} op.`,cl:c.gn},{l:"Dépenses",v:`${fin.dep}€`,s:`${fin.nD} op.`,cl:c.red},
            {l:"Résultat",v:`${profit>=0?"+":""}${profit}€`,s:profit>=0?"Positif":"Déficit",cl:profit>=0?c.gn:c.red},
            {l:"Pipeline",v:`${pipe}€`,s:`${up.length} datés`,cl:c.ac},
            {l:"Leads",v:`${allLeads.length}`,s:`${allLeads.filter(l=>l.temperature==="chaud").length} chauds`,cl:c.or}
          ].map((k,i)=>(
            <div key={i} style={{flex:1,padding:mob?"8px 10px":"10px 16px",borderRight:i<4?`0.5px solid ${c.bd}`:"none",minWidth:mob?75:0}}>
              <div style={{fontSize:mob?9:10,color:c.tx3,fontWeight:500,marginBottom:2}}>{k.l}</div>
              <div style={{fontSize:mob?15:18,fontWeight:700,letterSpacing:"-0.04em",color:k.cl}}>{k.v}</div>
              <div style={{fontSize:mob?9:10,color:c.tx3,marginTop:1}}>{k.s}</div>
            </div>
          ))}
        </div>
      </header>

      {/* Nav */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:mob?"14px 16px":"18px 28px"}}>
        <div style={{display:"flex",alignItems:"center"}}>
          <button onClick={()=>{setCur(new Date(yr,mo-1,1));setSel(null);}} style={{background:"none",border:"none",color:c.ac,fontSize:18,cursor:"pointer",padding:"4px 8px"}}>‹</button>
          <div style={{fontSize:mob?20:24,fontWeight:700,minWidth:mob?150:200,textAlign:"center",letterSpacing:"-0.04em"}}>{MN[mo]} {yr}</div>
          <button onClick={()=>{setCur(new Date(yr,mo+1,1));setSel(null);}} style={{background:"none",border:"none",color:c.ac,fontSize:18,cursor:"pointer",padding:"4px 8px"}}>›</button>
        </div>
        <button onClick={()=>{setCur(new Date());setSel(null);}} style={{background:"none",border:"none",color:c.ac,fontSize:13,cursor:"pointer",fontWeight:500}}>Aujourd'hui</button>
      </div>

      <div style={{display:"flex",flexDirection:mob?"column":"row",padding:mob?"0 12px 16px":"0 28px 24px",gap:mob?12:20}}>
        {/* Grid */}
        <div style={{flex:1}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
            {(mob?DL:DFL).map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:500,color:c.tx3,padding:"4px 0"}}>{d}</div>)}
            {Array.from({length:fd}).map((_,i)=><div key={`e${i}`} style={{minHeight:mob?56:108}}/>)}
            {Array.from({length:dim}).map((_,i)=>{
              const day=i+1,dl=lfd(day),w=wfd(day),td=itd(day),s=sel===day;
              const dc=dl.length>0?dotColor(dl):null;
              return(
                <div key={day} onClick={()=>setSel(s?null:day)} style={{minHeight:mob?56:108,padding:mob?3:6,cursor:"pointer",background:s?c.sel:"transparent",borderRadius:12,transition:"background 0.1s",position:"relative"}}>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:mob?2:4}}>
                    <div style={{width:mob?26:30,height:mob?26:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:mob?12:14,fontWeight:td?600:400,letterSpacing:"-0.02em",background:td?c.ac:"transparent",color:td?"#fff":s?c.ac:c.tx}}>{day}</div>
                  </div>
                  {/* Dot: red=chaud, orange=tiède, green=réservé */}
                  {dc&&<div style={{position:"absolute",top:mob?3:5,right:mob?6:10}}><div style={{width:mob?5:7,height:mob?5:7,borderRadius:"50%",background:dc}}/></div>}
                  {/* Weather desktop */}
                  {!mob&&w&&<div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:2,marginBottom:2}}>
                    <span style={{fontSize:10}}>{wi(w.code)}</span>
                    <span style={{fontSize:9,fontWeight:500,color:c.tx3}}>{w.hi}°</span>
                    {w.wave&&<span style={{fontSize:8,color:parseFloat(w.wave)>=1.5?c.red:c.tx3}}>🌊{w.wave}</span>}
                  </div>}
                  {/* Names desktop */}
                  {!mob&&dl.slice(0,2).map((l,idx)=>{const fm=FM[l.type_interet]||{c:c.tx3};return(
                    <div key={idx} style={{fontSize:9,fontWeight:500,color:fm.c,textAlign:"center",lineHeight:"13px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",padding:"0 2px"}}>{l.prenom?.replace(/^\w/,x=>x.toUpperCase())||l.instagram_username}</div>);})}
                  {!mob&&dl.length>2&&<div style={{fontSize:8,color:c.tx3,textAlign:"center"}}>+{dl.length-2}</div>}
                  {/* Mobile dots for multiple leads */}
                  {mob&&dl.length>0&&<div style={{display:"flex",justifyContent:"center",gap:2,marginTop:1}}>
                    {dl.slice(0,3).map((l,idx)=><span key={idx} style={{width:4,height:4,borderRadius:"50%",background:l.temperature==="chaud"?c.red:l.temperature==="tiede"?c.or:c.tx3}}/>)}
                  </div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Panel */}
        {!mob&&sel&&(
          <div style={{width:300,flexShrink:0}} className="au">
            <div style={{background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:16,padding:20,position:"sticky",top:150}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontSize:20,fontWeight:700,letterSpacing:"-0.04em"}}>{sel} {MN[mo]}</div>
                <button onClick={()=>setSel(null)} style={{background:c.s2,border:"none",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:c.tx2,fontSize:14}}>×</button>
              </div>
              {sw&&<div style={{background:c.s2,borderRadius:12,padding:14,marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:28}}>{wi(sw.code)}</span><div><div style={{fontSize:24,fontWeight:700,letterSpacing:"-0.04em"}}>{sw.hi}°<span style={{fontSize:14,fontWeight:400,color:c.tx3}}>/{sw.lo}°</span></div></div></div>
                  {isG(sw)&&<Chip color={c.gn}>Idéal</Chip>}
                </div>
                <div style={{display:"flex",gap:12,marginTop:8,fontSize:12,color:c.tx2}}><span>💨 {sw.wind} km/h</span>{sw.wave&&<span>🌊 {sw.wave}m</span>}</div>
              </div>}
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {sl.length===0?<div style={{textAlign:"center",padding:"20px 0",color:c.tx3,fontSize:13}}>{isG(sw)?"Créneau disponible":"Aucun prospect"}</div>
                :sl.map((l,i)=><Card key={i} l={l} compact={false}/>)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Drawer */}
      {mob&&sel&&(
        <div className="su" style={{position:"fixed",bottom:0,left:0,right:0,background:dk?"rgba(28,28,30,0.95)":"rgba(255,255,255,0.95)",backdropFilter:"saturate(180%) blur(20px)",borderTop:`0.5px solid ${c.bd}`,borderRadius:"16px 16px 0 0",padding:16,maxHeight:"60vh",overflowY:"auto",zIndex:100}}>
          <div style={{width:36,height:4,borderRadius:2,background:c.s3,margin:"0 auto 14px"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.03em"}}>{sel} {MN[mo]}</div>
            <button onClick={()=>setSel(null)} style={{background:c.s2,border:"none",borderRadius:8,padding:"4px 12px",cursor:"pointer",color:c.ac,fontSize:13,fontWeight:500}}>OK</button>
          </div>
          {sw&&<div style={{background:c.s2,borderRadius:12,padding:12,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:24}}>{wi(sw.code)}</span><div><div style={{fontSize:20,fontWeight:700}}>{sw.hi}°<span style={{fontSize:12,color:c.tx3}}>/{sw.lo}°</span></div><div style={{fontSize:10,color:c.tx2}}>💨 {sw.wind}km/h{sw.wave?` · 🌊 ${sw.wave}m`:""}</div></div></div>
            {isG(sw)&&<Chip color={c.gn}>Idéal</Chip>}
          </div>}
          {sl.length===0?<div style={{textAlign:"center",padding:16,color:c.tx3,fontSize:12}}>{isG(sw)?"Créneau dispo":"Pas de prospect"}</div>
          :sl.map((l,i)=><div key={i} style={{marginBottom:6}}><Card l={l} compact={false}/></div>)}
        </div>
      )}

      {/* Prospects ce mois */}
      {mP.length>0&&<div style={{padding:mob?"0 12px 16px":"0 28px 24px"}}>
        <div style={{background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:16,padding:mob?16:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:mob?17:20,fontWeight:700,letterSpacing:"-0.04em"}}>Prospects — {MN[mo]}</div>
            <span style={{fontSize:12,color:c.tx3}}>{mP.length}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(auto-fill,minmax(300px,1fr))",gap:8}}>
            {mP.map((l,i)=><Card key={i} l={l} compact={mob}/>)}
          </div>
        </div>
      </div>}

      {/* Mois suivants */}
      {up.filter(l=>l.pd?.getMonth()!==mo||l.pd?.getFullYear()!==yr).length>0&&(
        <div style={{padding:mob?"0 12px 16px":"0 28px 24px"}}>
          <div style={{background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:16,padding:mob?16:24}}>
            <div style={{fontSize:mob?17:20,fontWeight:700,letterSpacing:"-0.04em",marginBottom:20}}>Mois suivants</div>
            {[...new Set(up.filter(l=>l.pd?.getMonth()!==mo||l.pd?.getFullYear()!==yr).map(l=>`${l.pd.getFullYear()}-${l.pd.getMonth()}`))].sort().map(key=>{
              const[y2,m2]=key.split("-").map(Number);const ml=up.filter(l=>l.pd?.getMonth()===m2&&l.pd?.getFullYear()===y2);
              const mp=ml.reduce((s,l)=>s+(TX[l.type_interet]||0),0);
              return(<div key={key} style={{marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                  <span style={{fontSize:14,fontWeight:600}}>{MN[m2]}</span><div style={{flex:1,height:0.5,background:c.bd}}/><span style={{fontSize:12,color:c.tx2}}>{ml.length} · {mp}€</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(auto-fill,minmax(300px,1fr))",gap:8}}>
                  {ml.map((l,i)=><div key={i} onClick={()=>{setCur(new Date(l.pd.getFullYear(),l.pd.getMonth(),1));setSel(l.pd.getDate());window.scrollTo({top:0,behavior:"smooth"});}} style={{cursor:"pointer"}}><Card l={l} compact={mob}/></div>)}
                </div>
              </div>);
            })}
          </div>
        </div>
      )}

      {/* ALL PROSPECTS — Full CRM with tabs */}
      <div style={{padding:mob?"0 12px 28px":"0 28px 32px"}}>
        <div style={{background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:16,padding:mob?16:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <div style={{fontSize:mob?17:20,fontWeight:700,letterSpacing:"-0.04em"}}>Tous les prospects</div>
            <span style={{fontSize:12,color:c.tx3}}>{allLeads.length} contacts</span>
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:0,marginBottom:16,marginTop:8,borderRadius:10,background:c.s2,padding:2}}>
            {[{k:"all",l:"Tous",n:allLeads.length},{k:"chaud",l:"Chauds",n:allLeads.filter(l=>l.temperature==="chaud").length,cl:c.red},
              {k:"tiede",l:"Tièdes",n:allLeads.filter(l=>l.temperature==="tiede").length,cl:c.or},
              {k:"froid",l:"Froids",n:allLeads.filter(l=>l.temperature==="froid").length,cl:c.tx3}
            ].map(t=>(
              <button key={t.k} onClick={()=>setTab(t.k)} style={{flex:1,padding:"7px 4px",border:"none",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:tab===t.k?600:400,
                background:tab===t.k?c.s:"transparent",color:tab===t.k?c.tx:c.tx2,
                boxShadow:tab===t.k?(dk?"0 1px 3px rgba(0,0,0,0.3)":"0 1px 3px rgba(0,0,0,0.08)"):"none",transition:"all 0.15s"}}>
                {t.l} <span style={{color:t.cl||c.tx2,fontWeight:600,marginLeft:2}}>{t.n}</span>
              </button>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(auto-fill,minmax(300px,1fr))",gap:6}}>
            {filtered.map((l,i)=>{
              const fm=FM[l.type_interet]||{c:c.tx3,l:"—",i:"👤"};
              const ago=l.derniere_interaction?Math.round((now-new Date(l.derniere_interaction))/864e5):null;
              return(
                <div key={i} style={{background:c.s2,borderRadius:12,padding:mob?10:12,border:`0.5px solid ${c.bd}`,display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:34,height:34,borderRadius:10,background:`${fm.c}10`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{fm.i}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontWeight:600,fontSize:13,letterSpacing:"-0.02em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.prenom?.replace(/^\w/,x=>x.toUpperCase())||l.instagram_username}</span>
                      <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                        <div style={{width:36,height:3,borderRadius:2,background:`${c.tx3}20`,overflow:"hidden"}}><div style={{width:`${l.score}%`,height:"100%",borderRadius:2,background:c.ac}}/></div>
                        <span style={{fontSize:10,fontWeight:600,color:c.tx2}}>{l.score}</span>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginTop:3,fontSize:10,color:c.tx3,flexWrap:"wrap"}}>
                      <span>{fm.l}</span>
                      {l.date_souhaitee&&<span>· 📅 {l.date_souhaitee}</span>}
                      {l.occasion&&<span>· {l.occasion}</span>}
                      {ago!==null&&<span style={{marginLeft:"auto"}}>{ago===0?"Auj.":ago===1?"Hier":`${ago}j`}</span>}
                    </div>
                  </div>
                  <div style={{width:8,height:8,borderRadius:"50%",background:l.temperature==="chaud"?c.red:l.temperature==="tiede"?c.or:`${c.tx3}40`,flexShrink:0}}/>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
