import { useState, useEffect, useCallback, useMemo } from "react";

const SB="https://utyfpmjhtfoxsxncfoxe.supabase.co",SK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0eWZwbWpodGZveHN4bmNmb3hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzgzMTUsImV4cCI6MjA4OTYxNDMxNX0.OGLR8d0GOZVMM48WlhUYrGsnthaaNNxBGPUHpJoSong";
const LAT=43.5283,LON=3.9816;
const MN=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const MNC=["Jan","Fév","Mar","Avr","Mai","Jui","Jul","Aoû","Sep","Oct","Nov","Déc"];
const DL=["L","M","M","J","V","S","D"],DFLS=["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"],DFL=["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const TX={nuit_classique:150,nuit_prestige:350,sortie_mer_2h:380,sortie_mer_3h:550,sortie_mer_4h:750};
const FM={nuit_classique:{c:"#007AFF",l:"Classique",i:"🌙"},nuit_prestige:{c:"#AF52DE",l:"Prestige",i:"✨"},sortie_mer_2h:{c:"#30D158",l:"Sortie 2h",i:"⛵"},sortie_mer_3h:{c:"#34C759",l:"Sortie 3h",i:"⛵"},sortie_mer_4h:{c:"#28BD4F",l:"Sortie 4h",i:"⛵"}};
const TYPES=[{v:"nuit_classique",l:"Nuit Classique 150€"},{v:"nuit_prestige",l:"Nuit Prestige 350€"},{v:"sortie_mer_2h",l:"Sortie 2h 380€"},{v:"sortie_mer_3h",l:"Sortie 3h 550€"},{v:"sortie_mer_4h",l:"Sortie 4h 750€"}];
const STATUTS=[{v:"nouveau",l:"Nouveau"},{v:"en_conversation",l:"En conversation"},{v:"qualifie",l:"Qualifié"},{v:"reserve",l:"Réservé"},{v:"termine",l:"Terminé"},{v:"perdu",l:"Perdu"}];
const TEMPS=[{v:"chaud",l:"Chaud"},{v:"tiede",l:"Tiède"},{v:"froid",l:"Froid"}];
const DT={nuit_classique:[17,12],nuit_prestige:[17,12],sortie_mer_2h:[10,12],sortie_mer_3h:[10,13],sortie_mer_4h:[10,14]};
const HOURS=Array.from({length:16},(_,i)=>i+7);

function pda(ds,ref){
  if(!ds)return null;
  const d=ds.toLowerCase().trim(),y=ref.getFullYear(),cm=ref.getMonth(),cd=ref.getDate();
  if(/attendre|pas encore|incertain|sait pas|aucune|planning/.test(d))return null;
  if(/ce mois/.test(d))return new Date(y,cm,20);
  if(/mois prochain/.test(d))return new Date(y,cm+1,15);
  const jrs={lundi:1,mardi:2,mercredi:3,jeudi:4,vendredi:5,samedi:6,dimanche:0};
  for(const j in jrs){if(d.includes(j)){const n=d.match(/\d+/);if(n){let c2=new Date(y,cm,parseInt(n[0]));if(c2<ref)c2=new Date(y,cm+1,parseInt(n[0]));return c2;}let f=(jrs[j]-ref.getDay()+7)%7;if(!f)f=7;return new Date(y,cm,cd+f);}}
  const ms={janvier:0,fevrier:1,"février":1,mars:2,avril:3,mai:4,juin:5,juillet:6,aout:7,"août":7,septembre:8,octobre:9,novembre:10,decembre:11,"décembre":11};
  for(const m in ms){if(d.includes(m)){const dm=d.match(/(\d+)/);let dy=dm?parseInt(dm[1]):/début/.test(d)?5:/mi[- ]/.test(d)?15:/fin/.test(d)?25:15;const ym=d.match(/20\d{2}/);const yr2=ym?parseInt(ym[0]):y;let r=new Date(yr2,ms[m],dy);if(!ym&&r<new Date(y,cm-2,1))r=new Date(y+1,ms[m],dy);return r;}}
  const nm=d.match(/(\d{1,2})[/-](\d{1,2})/);if(nm)return new Date(y,parseInt(nm[2])-1,parseInt(nm[1]));
  return null;
}

function getWeekStart(date){const d=new Date(date);const day=d.getDay();const diff=d.getDate()-(day===0?6:day-1);return new Date(d.getFullYear(),d.getMonth(),diff);}
function sameDay(a,b){return a&&b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
function useWin(){const[w,s]=useState(typeof window!=="undefined"?window.innerWidth:1200);useEffect(()=>{const h=()=>s(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);return w;}

export default function App(){
  const[dk,setDk]=useState(true);
  const[view,setView]=useState("month");
  const[cur,setCur]=useState(new Date());
  const[weekStart,setWeekStart]=useState(getWeekStart(new Date()));
  const[dayView,setDayView]=useState(new Date());
  const[allLeads,setAllLeads]=useState([]);
  const[datedLeads,setDatedLeads]=useState([]);
  const[wx,setWx]=useState({});
  const[sel,setSel]=useState(null);
  const[tab,setTab]=useState("all");
  const[fin,setFin]=useState({rev:0,dep:0,nR:0,nD:0});
  const[edit,setEdit]=useState(null);
  const[saving,setSaving]=useState(false);
  const[creating,setCreating]=useState(false);
  const W=useWin();const mob=W<768;
  const yr=cur.getFullYear(),mo=cur.getMonth();
  const fd=(new Date(yr,mo,1).getDay()+6)%7,dim=new Date(yr,mo+1,0).getDate();
  const now=useMemo(()=>new Date(),[]);

  const c=dk
    ?{bg:"#000",s:"#1c1c1e",s2:"#2c2c2e",s3:"#3a3a3c",bd:"#38383a",tx:"#f5f5f7",tx2:"#a1a1a6",tx3:"#636366",ac:"#0A84FF",red:"#FF453A",or:"#FF9F0A",gn:"#30D158",pu:"#BF5AF2",sel:"rgba(10,132,255,0.12)"}
    :{bg:"#f2f2f7",s:"#fff",s2:"#f2f2f7",s3:"#e5e5ea",bd:"#d1d1d6",tx:"#1d1d1f",tx2:"#86868b",tx3:"#aeaeb2",ac:"#007AFF",red:"#FF3B30",or:"#FF9F0A",gn:"#34C759",pu:"#AF52DE",sel:"rgba(0,122,255,0.08)"};

  const sb=useCallback(async(p)=>{const r=await fetch(`${SB}/rest/v1/${p}`,{headers:{apikey:SK,Authorization:`Bearer ${SK}`}});return r.json();},[]);

  const load=useCallback(async()=>{
    try{
      const d=await sb("leads?select=*&statut=not.eq.perdu&statut=not.eq.termine");
      const f=d.filter(l=>!["robinpailhes","robinai_consulting"].includes(l.instagram_username)).sort((a,b)=>(b.score||0)-(a.score||0));
      setAllLeads(f);
      // Deduplicate by instagram_username — one entry per person
      const seen=new Set();const deduped=[];
      for(const l of f){if(!seen.has(l.instagram_username)){seen.add(l.instagram_username);const pd=pda(l.date_souhaitee,now);deduped.push({...l,pd});}}
      setDatedLeads(deduped.filter(l=>l.pd));
    }catch(e){}
    try{
      const[rv,dp]=await Promise.all([sb("revenus?select=montant"),sb("depenses?select=montant")]);
      setFin({rev:rv.reduce((s,r)=>s+parseFloat(r.montant||0),0),dep:dp.reduce((s,r)=>s+parseFloat(r.montant||0),0),nR:rv.length,nD:dp.length});
    }catch(e){}
    try{
      const s2=new Date(yr,mo,1).toISOString().split("T")[0],e2=new Date(yr,mo+1,0).toISOString().split("T")[0];
      const[mt,mr]=await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weathercode,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&start_date=${s2}&end_date=${e2}&timezone=Europe/Paris`).then(r=>r.json()),
        fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}&daily=wave_height_max&start_date=${s2}&end_date=${e2}&timezone=Europe/Paris`).then(r=>r.json()).catch(()=>null)
      ]);
      const m={};if(mt.daily)mt.daily.time.forEach((d2,i)=>{m[d2]={code:mt.daily.weathercode[i],hi:Math.round(mt.daily.temperature_2m_max[i]),lo:Math.round(mt.daily.temperature_2m_min[i]),wind:Math.round(mt.daily.wind_speed_10m_max[i]),wave:mr?.daily?.wave_height_max?.[i]?parseFloat(mr.daily.wave_height_max[i]).toFixed(1):null};});
      setWx(m);
    }catch(e){}
  },[yr,mo,now,sb]);
  useEffect(()=>{load();},[load]);

  const saveLead=async(updates)=>{if(!edit?.id)return;setSaving(true);try{const cl={};for(const k in updates){if(updates[k]!==edit[k])cl[k]=updates[k]===""?null:updates[k];}if(Object.keys(cl).length>0)await fetch(`${SB}/rest/v1/leads?id=eq.${edit.id}`,{method:"PATCH",headers:{apikey:SK,Authorization:`Bearer ${SK}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(cl)});await load();setEdit(null);}catch(e){alert("Erreur sauvegarde");}setSaving(false);};
  const createLead=async(data)=>{setSaving(true);try{const cl={...data};cl.instagram_username=cl.instagram_username||("manuel_"+Date.now());cl.source=cl.source||"manuel";cl.statut=cl.statut||"nouveau";cl.temperature=cl.temperature||"tiede";cl.score=cl.score||50;cl.nombre_messages=0;const r=await fetch(`${SB}/rest/v1/leads`,{method:"POST",headers:{apikey:SK,Authorization:`Bearer ${SK}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(cl)});if(!r.ok)throw new Error(await r.text());await load();setCreating(false);}catch(e){alert("Erreur: "+e.message);}setSaving(false);};
  const deleteLead=async(id)=>{if(!confirm("Supprimer ce prospect ?"))return;setSaving(true);try{await fetch(`${SB}/rest/v1/leads?id=eq.${id}`,{method:"DELETE",headers:{apikey:SK,Authorization:`Bearer ${SK}`}});await load();setEdit(null);}catch(e){}setSaving(false);};

  const lfd=d=>datedLeads.filter(l=>l.pd&&l.pd.getFullYear()===yr&&l.pd.getMonth()===mo&&l.pd.getDate()===d);
  const wfd=d=>wx[`${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`]||null;
  const wxForDate=d=>wx[`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`]||null;
  const isToday=d=>d instanceof Date?sameDay(d,now):(d===now.getDate()&&mo===now.getMonth()&&yr===now.getFullYear());
  const wi=code=>{if(code==null)return"";if(code>=61)return"🌧";if(code>=51)return"🌦";if(code>=45)return"🌫";if(code>=3)return"⛅";if(code>=1)return"🌤";return"☀️";};
  const isG=w=>w&&w.code<3&&w.hi>=20&&w.wind<30&&(!w.wave||parseFloat(w.wave)<1);
  const lc=l=>l.statut==="reserve"?c.gn:l.temperature==="chaud"?c.red:l.temperature==="tiede"?c.or:c.tx3;

  const mP=useMemo(()=>datedLeads.filter(l=>l.pd&&l.pd.getMonth()===mo&&l.pd.getFullYear()===yr),[datedLeads,mo,yr]);
  const up=useMemo(()=>datedLeads.filter(l=>l.pd&&l.pd>=new Date(now.getFullYear(),now.getMonth(),now.getDate())).sort((a,b)=>a.pd-b.pd),[datedLeads,now]);
  const pipe=useMemo(()=>datedLeads.reduce((s,l)=>s+(TX[l.type_interet]||0),0),[datedLeads]);
  const profit=fin.rev-fin.dep;
  const filtered=useMemo(()=>{if(tab==="all")return allLeads;if(tab==="chaud")return allLeads.filter(l=>l.temperature==="chaud");if(tab==="tiede")return allLeads.filter(l=>l.temperature==="tiede");return allLeads.filter(l=>l.temperature==="froid");},[allLeads,tab]);
  const weekDays=useMemo(()=>{const days=[];for(let i=0;i<7;i++){const d=new Date(weekStart);d.setDate(weekStart.getDate()+i);days.push(d);}return days;},[weekStart]);
  const leadsForDate=d=>datedLeads.filter(l=>l.pd&&sameDay(l.pd,d));

  const goBack=()=>{if(view==="month")setCur(new Date(yr,mo-1,1));else if(view==="week"){const d=new Date(weekStart);d.setDate(d.getDate()-7);setWeekStart(new Date(d));}else{const d=new Date(dayView);d.setDate(d.getDate()-1);setDayView(new Date(d));}setSel(null);};
  const goFwd=()=>{if(view==="month")setCur(new Date(yr,mo+1,1));else if(view==="week"){const d=new Date(weekStart);d.setDate(d.getDate()+7);setWeekStart(new Date(d));}else{const d=new Date(dayView);d.setDate(d.getDate()+1);setDayView(new Date(d));}setSel(null);};
  const goToday=()=>{const t=new Date();setCur(t);setWeekStart(getWeekStart(t));setDayView(t);setSel(null);};
  const openDay=d=>{setDayView(new Date(d));setView("day");setSel(null);};
  const navTitle=()=>{if(view==="month")return`${MN[mo]} ${yr}`;if(view==="week"){const e=weekDays[6];return`${weekDays[0].getDate()} – ${e.getDate()} ${MNC[e.getMonth()]} ${e.getFullYear()}`;}return`${dayView.getDate()} ${MN[dayView.getMonth()]} ${dayView.getFullYear()}`;};

  const ff="-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif";
  const inputStyle={width:"100%",padding:"10px 12px",borderRadius:10,border:`0.5px solid ${c.bd}`,background:c.s2,color:c.tx,fontSize:14,marginTop:4};
  const labelStyle={fontSize:11,fontWeight:600,color:c.tx2,letterSpacing:"0.02em",textTransform:"uppercase"};

  // ---- MONTH VIEW ----
  const MonthView=()=>(
    <div style={{padding:mob?"0 10px 16px":"0 28px 24px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:4}}>
        {(mob?DL:DFLS).map((d,i)=><div key={i} style={{textAlign:"center",fontSize:11,fontWeight:500,color:c.tx3,padding:"4px 0",letterSpacing:"0.03em"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {Array.from({length:fd}).map((_,i)=><div key={`e${i}`} style={{minHeight:mob?52:96}}/>)}
        {Array.from({length:dim}).map((_,i)=>{
          const day=i+1,dl=lfd(day),w=wfd(day),td=isToday(day),s=sel===day;
          return(
            <div key={day} onClick={()=>setSel(s?null:day)} style={{minHeight:mob?52:96,padding:mob?"2px":"4px",cursor:"pointer",background:s?c.sel:"transparent",borderRadius:8,border:`0.5px solid ${s?c.ac+"50":c.bd+"25"}`,overflow:"hidden",transition:"background 0.1s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"2px 3px 2px"}}>
                <div style={{width:mob?22:26,height:mob?22:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:mob?11:13,fontWeight:td?700:400,background:td?c.ac:"transparent",color:td?"#fff":s?c.ac:c.tx,flexShrink:0}}>{day}</div>
                {!mob&&w&&<span style={{fontSize:9,color:c.tx3,marginTop:3}}>{wi(w.code)}{w.hi}°</span>}
              </div>
              {!mob&&dl.slice(0,3).map((l,idx)=>(
                <div key={idx} onClick={e=>{e.stopPropagation();setEdit(l);}} style={{fontSize:9,fontWeight:600,padding:"1px 4px 1px 6px",borderRadius:3,marginBottom:1,background:`${lc(l)}20`,color:lc(l),cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",borderLeft:`2px solid ${lc(l)}`}}>
                  {(FM[l.type_interet]||{i:"👤"}).i} {l.prenom?.replace(/^\w/,x=>x.toUpperCase())||"?"}
                </div>
              ))}
              {!mob&&dl.length>3&&<div style={{fontSize:8,color:c.tx3,padding:"0 4px"}}>+{dl.length-3}</div>}
              {mob&&dl.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:2,padding:"1px 3px"}}>
                {dl.slice(0,4).map((l,idx)=><div key={idx} style={{width:5,height:5,borderRadius:"50%",background:lc(l)}}/>)}
              </div>}
            </div>
          );
        })}
      </div>
      {sel&&(
        <div className="au" style={{marginTop:14,background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:14,padding:mob?14:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <div style={{fontSize:20,fontWeight:700,letterSpacing:"-0.04em"}}>{sel} {MN[mo]}</div>
              {wfd(sel)&&<div style={{fontSize:11,color:c.tx2,marginTop:2}}>{wi(wfd(sel).code)} {wfd(sel).hi}°/{wfd(sel).lo}° · 💨{wfd(sel).wind}km/h{wfd(sel).wave?` · 🌊${wfd(sel).wave}m`:""}
                {isG(wfd(sel))&&<span style={{color:c.gn,marginLeft:6}}>✓ Idéal</span>}</div>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>openDay(new Date(yr,mo,sel))} style={{background:c.ac,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Vue jour →</button>
              <button onClick={()=>setSel(null)} style={{background:c.s2,border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",color:c.tx2,fontSize:16}}>×</button>
            </div>
          </div>
          {lfd(sel).length===0
            ?<div style={{textAlign:"center",padding:"20px 0",color:c.tx3,fontSize:13}}>{isG(wfd(sel))?"✨ Créneau libre":"Aucun prospect"}</div>
            :<div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(auto-fill,minmax(250px,1fr))",gap:8}}>
              {lfd(sel).map((l,i)=><MiniCard key={i} l={l} c={c} now={now} lc={lc} setEdit={setEdit} FM={FM}/>)}
            </div>}
        </div>
      )}
    </div>
  );

  // ---- WEEK VIEW ----
  const WeekView=()=>(
    <div style={{padding:mob?"0 8px 16px":"0 28px 24px",overflowX:"auto"}}>
      <div style={{minWidth:mob?580:0}}>
        <div style={{display:"grid",gridTemplateColumns:`50px repeat(7,1fr)`,marginBottom:0,borderBottom:`0.5px solid ${c.bd}30`}}>
          <div/>
          {weekDays.map((d,i)=>{
            const td=isToday(d);const dl=leadsForDate(d);const w=wxForDate(d);
            return(
              <div key={i} onClick={()=>openDay(d)} style={{textAlign:"center",padding:"8px 4px 6px",cursor:"pointer",borderLeft:`0.5px solid ${c.bd}25`,background:td?`${c.ac}08`:"transparent"}}>
                <div style={{fontSize:10,color:c.tx3,fontWeight:500,letterSpacing:"0.04em",textTransform:"uppercase"}}>{DFLS[i]}</div>
                <div style={{width:30,height:30,borderRadius:"50%",background:td?c.ac:"transparent",color:td?"#fff":c.tx,fontSize:15,fontWeight:700,margin:"4px auto 2px",display:"flex",alignItems:"center",justifyContent:"center"}}>{d.getDate()}</div>
                {w&&<div style={{fontSize:9,color:c.tx3}}>{wi(w.code)}{w.hi}°</div>}
                {dl.length>0&&<div style={{fontSize:9,color:c.tx3}}>{dl.length} rdv</div>}
              </div>
            );
          })}
        </div>
        <div style={{border:`0.5px solid ${c.bd}25`,borderTop:"none",borderRadius:"0 0 12px 12px",overflow:"hidden"}}>
          {HOURS.map((h,hi)=>(
            <div key={h} style={{display:"grid",gridTemplateColumns:"50px repeat(7,1fr)",borderBottom:hi<HOURS.length-1?`0.5px solid ${c.bd}18`:"none",minHeight:54}}>
              <div style={{fontSize:10,color:c.tx3,padding:"6px 8px 0",fontWeight:500,textAlign:"right",borderRight:`0.5px solid ${c.bd}25`,flexShrink:0}}>{h}h</div>
              {weekDays.map((d,di)=>{
                const hLeads=leadsForDate(d).filter(l=>{const dt=DT[l.type_interet];return dt&&dt[0]===h;});
                const isNow=isToday(d)&&now.getHours()===h;
                return(
                  <div key={di} style={{borderLeft:`0.5px solid ${c.bd}18`,padding:"3px 3px",position:"relative",background:isNow?`${c.ac}06`:"transparent"}}>
                    {isNow&&<div style={{position:"absolute",top:0,left:0,right:0,height:1.5,background:c.ac,zIndex:2}}/>}
                    {hLeads.map((l,li)=>{
                      const lcol=lc(l);const fm=FM[l.type_interet]||{i:"👤",l:"—"};const dt=DT[l.type_interet]||[h,h+2];
                      return(
                        <div key={li} onClick={e=>{e.stopPropagation();setEdit(l);}}
                          style={{background:`${lcol}18`,border:`0.5px solid ${lcol}50`,borderLeft:`2.5px solid ${lcol}`,borderRadius:5,padding:"3px 5px",cursor:"pointer",marginBottom:2,minHeight:44,overflow:"hidden"}}>
                          <div style={{fontSize:10,fontWeight:700,color:lcol,lineHeight:"14px"}}>{l.prenom?.replace(/^\w/,x=>x.toUpperCase())||"?"}</div>
                          <div style={{fontSize:9,color:lcol,opacity:0.75}}>{fm.i} {dt[0]}h→{dt[1]}h</div>
                          {l.occasion&&<div style={{fontSize:8,color:c.tx3,marginTop:1}}>{l.occasion}</div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ---- DAY VIEW ----
  const DayView=()=>{
    const dl=leadsForDate(dayView);const w=wxForDate(dayView);
    return(
      <div style={{padding:mob?"0 12px 24px":"0 28px 32px"}}>
        {w&&<div style={{background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:28}}>{wi(w.code)}</span>
            <div><div style={{fontSize:22,fontWeight:700,letterSpacing:"-0.05em"}}>{w.hi}°<span style={{fontSize:14,fontWeight:400,color:c.tx2}}>/{w.lo}°</span></div>
            <div style={{fontSize:11,color:c.tx2}}>💨 {w.wind}km/h{w.wave?` · 🌊${w.wave}m`:""}</div></div>
          </div>
          {isG(w)&&<div style={{background:`${c.gn}15`,border:`0.5px solid ${c.gn}40`,borderRadius:8,padding:"6px 12px",color:c.gn,fontSize:12,fontWeight:600}}>✓ Conditions idéales</div>}
        </div>}
        <div style={{background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:12,overflow:"hidden"}}>
          {dl.length===0&&<div style={{textAlign:"center",padding:"48px 20px",color:c.tx3}}>
            <div style={{fontSize:28,marginBottom:8}}>📅</div>
            <div style={{fontSize:14,fontWeight:600,color:c.tx2}}>Journée libre</div>
            <div style={{fontSize:12,marginTop:4,color:c.tx3}}>{isG(w)?"Conditions parfaites pour une sortie":""}</div>
          </div>}
          {HOURS.map((h,hi)=>{
            const hLeads=dl.filter(l=>{const dt=DT[l.type_interet];return dt&&dt[0]===h;});
            const isNow=isToday(dayView)&&now.getHours()===h;
            if(hLeads.length===0&&!isNow)return(
              <div key={h} style={{display:"flex",borderBottom:hi<HOURS.length-1?`0.5px solid ${c.bd}15`:"none",minHeight:40,opacity:0.4}}>
                <div style={{width:52,padding:"10px 10px 0",fontSize:10,color:c.tx3,textAlign:"right",flexShrink:0}}>{h}h</div>
                <div style={{flex:1,borderLeft:`0.5px solid ${c.bd}15`}}/>
              </div>
            );
            return(
              <div key={h} style={{display:"flex",borderBottom:hi<HOURS.length-1?`0.5px solid ${c.bd}15`:"none",minHeight:hLeads.length>0?88:40,background:isNow?`${c.ac}04`:"transparent"}}>
                <div style={{width:52,padding:"10px 10px 0",fontSize:10,color:isNow?c.ac:c.tx3,fontWeight:isNow?600:400,textAlign:"right",flexShrink:0}}>
                  {h}h{isNow&&<div style={{width:6,height:6,borderRadius:"50%",background:c.ac,margin:"4px auto 0"}}/>}
                </div>
                <div style={{flex:1,borderLeft:`0.5px solid ${isNow?c.ac+"40":c.bd+"15"}`,padding:"6px 10px",display:"flex",flexDirection:"column",gap:6}}>
                  {hLeads.map((l,li)=>{
                    const lcol=lc(l);const fm=FM[l.type_interet]||{c:c.tx3,l:"—",i:"👤"};const dt=DT[l.type_interet]||[h,h+2];
                    return(
                      <div key={li} onClick={()=>setEdit(l)} style={{background:`${lcol}10`,border:`0.5px solid ${lcol}40`,borderLeft:`3px solid ${lcol}`,borderRadius:10,padding:"10px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div>
                          <div style={{fontSize:16,fontWeight:700,letterSpacing:"-0.03em",color:lcol}}>{l.prenom?.replace(/^\w/,x=>x.toUpperCase())||"?"}</div>
                          <div style={{fontSize:12,color:c.tx2,marginTop:2}}>{fm.i} {fm.l}{l.occasion?` · ${l.occasion}`:""}</div>
                          {l.telephone&&<div style={{fontSize:11,color:c.gn,marginTop:3}}>📱 {l.telephone}</div>}
                          {l.email&&<div style={{fontSize:11,color:c.tx3,marginTop:1}}>✉ {l.email}</div>}
                          {l.notes&&<div style={{fontSize:11,color:c.tx3,marginTop:5,fontStyle:"italic",maxWidth:300}}>{l.notes.substring(0,80)}</div>}
                        </div>
                        <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                          <div style={{fontSize:14,fontWeight:700,color:lcol}}>{dt[0]}h → {dt[1]}h</div>
                          {l.nombre_personnes&&<div style={{fontSize:11,color:c.tx2,marginTop:2}}>👥 {l.nombre_personnes} pers.</div>}
                          <div style={{marginTop:6,display:"flex",justifyContent:"flex-end"}}>
                            <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:12,background:`${lcol}18`,color:lcol}}>{l.statut==="reserve"?"Réservé":l.temperature==="chaud"?"Chaud":l.temperature==="tiede"?"Tiède":"Froid"}</span>
                          </div>
                          {l.score&&<div style={{fontSize:10,color:c.tx3,marginTop:4}}>Score {l.score}</div>}
                          <div style={{fontSize:11,color:c.tx2,marginTop:2}}>{TX[l.type_interet]?TX[l.type_interet]+"€":""}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return(
    <div style={{background:c.bg,color:c.tx,minHeight:"100vh",fontFamily:ff}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased}
        @keyframes au{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes fade{from{opacity:0}to{opacity:1}}
        .au{animation:au .2s ease both}.su{animation:su .25s cubic-bezier(.32,.72,0,1) both}.fade{animation:fade .15s ease both}
        input,select,textarea{font-family:inherit;outline:none}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${c.bd};border-radius:2px}
      `}</style>

      {/* MODALS */}
      {creating&&<Modal onClose={()=>!saving&&setCreating(false)} mob={mob} c={c} saving={saving} title="Ajouter manuellement" subtitle="Nouveau prospect">
        <CreateForm onSave={createLead} saving={saving} c={c} inputStyle={inputStyle} labelStyle={labelStyle}/>
      </Modal>}
      {edit&&<Modal onClose={()=>!saving&&setEdit(null)} mob={mob} c={c} saving={saving} title={edit.prenom?.replace(/^\w/,x=>x.toUpperCase())||edit.instagram_username} subtitle="Modifier prospect">
        <EditForm lead={edit} onSave={saveLead} onDelete={deleteLead} saving={saving} c={c} inputStyle={inputStyle} labelStyle={labelStyle}/>
      </Modal>}

      {/* HEADER */}
      <header style={{borderBottom:`0.5px solid ${c.bd}`,background:dk?"rgba(0,0,0,0.88)":"rgba(242,242,247,0.88)",backdropFilter:"saturate(180%) blur(20px)",WebkitBackdropFilter:"saturate(180%) blur(20px)",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:mob?"10px 16px":"12px 28px"}}>
          <div style={{display:"flex",alignItems:"center",gap:mob?8:12}}>
            <span style={{fontSize:mob?20:24}}>⛵</span>
            <div><div style={{fontSize:mob?15:17,fontWeight:700,letterSpacing:"-0.03em"}}>Harmonie Yacht</div>{!mob&&<div style={{fontSize:11,color:c.tx3}}>Port de Carnon</div>}</div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {!mob&&<div style={{display:"flex",gap:3,fontSize:9,color:c.tx3,alignItems:"center",marginRight:8}}>
              <span style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:6,height:6,borderRadius:"50%",background:c.red}}/>Chaud</span>
              <span style={{display:"flex",alignItems:"center",gap:3,marginLeft:6}}><span style={{width:6,height:6,borderRadius:"50%",background:c.or}}/>Tiède</span>
              <span style={{display:"flex",alignItems:"center",gap:3,marginLeft:6}}><span style={{width:6,height:6,borderRadius:"50%",background:c.gn}}/>Réservé</span>
            </div>}
            <button onClick={()=>setCreating(true)} style={{background:c.ac,border:"none",borderRadius:10,padding:mob?"6px 10px":"6px 14px",cursor:"pointer",fontSize:13,color:"#fff",fontWeight:600}}>+ {mob?"":"Nouveau lead"}</button>
            <button onClick={()=>setDk(!dk)} style={{background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:10,padding:"6px 10px",cursor:"pointer",fontSize:14}}>{dk?"☀️":"🌙"}</button>
          </div>
        </div>
        <div style={{display:"flex",borderTop:`0.5px solid ${c.bd}`,overflow:"auto"}}>
          {[{l:"Revenus",v:`${fin.rev}€`,s:`${fin.nR} op.`,cl:c.gn},{l:"Dépenses",v:`${fin.dep}€`,s:`${fin.nD} op.`,cl:c.red},
            {l:"Résultat",v:`${profit>=0?"+":""}${profit}€`,s:profit>=0?"Positif":"Déficit",cl:profit>=0?c.gn:c.red},
            {l:"Pipeline",v:`${pipe}€`,s:`${up.length} datés`,cl:c.ac},
            {l:"Leads",v:`${allLeads.length}`,s:`${allLeads.filter(l=>l.temperature==="chaud").length} chauds`,cl:c.or}
          ].map((k,i)=>(
            <div key={i} style={{flex:1,padding:mob?"8px 10px":"10px 16px",borderRight:i<4?`0.5px solid ${c.bd}`:"none",minWidth:mob?70:0}}>
              <div style={{fontSize:mob?9:10,color:c.tx3,fontWeight:500,marginBottom:2}}>{k.l}</div>
              <div style={{fontSize:mob?14:18,fontWeight:700,letterSpacing:"-0.04em",color:k.cl}}>{k.v}</div>
              <div style={{fontSize:mob?9:10,color:c.tx3,marginTop:1}}>{k.s}</div>
            </div>
          ))}
        </div>
      </header>

      {/* NAV */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:mob?"10px 14px":"14px 28px"}}>
        <div style={{display:"flex",alignItems:"center",gap:2}}>
          <button onClick={goBack} style={{background:"none",border:"none",color:c.ac,fontSize:22,cursor:"pointer",padding:"2px 8px",lineHeight:1}}>‹</button>
          <div style={{fontSize:mob?17:21,fontWeight:700,minWidth:mob?150:220,textAlign:"center",letterSpacing:"-0.04em"}}>{navTitle()}</div>
          <button onClick={goFwd} style={{background:"none",border:"none",color:c.ac,fontSize:22,cursor:"pointer",padding:"2px 8px",lineHeight:1}}>›</button>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <button onClick={goToday} style={{background:"none",border:"none",color:c.ac,fontSize:13,cursor:"pointer",fontWeight:500}}>Auj.</button>
          <div style={{display:"flex",background:c.s2,borderRadius:10,padding:2,gap:1}}>
            {[{k:"month",l:mob?"M":"Mois"},{k:"week",l:mob?"S":"Semaine"},{k:"day",l:mob?"J":"Jour"}].map(v=>(
              <button key={v.k} onClick={()=>setView(v.k)} style={{padding:"5px 9px",border:"none",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:view===v.k?600:400,background:view===v.k?c.s:"transparent",color:view===v.k?c.tx:c.tx2,transition:"all 0.15s",boxShadow:view===v.k?(dk?"0 1px 3px rgba(0,0,0,.3)":"0 1px 3px rgba(0,0,0,.08)"):"none"}}>{v.l}</button>
            ))}
          </div>
        </div>
      </div>

      {view==="month"&&<MonthView/>}
      {view==="week"&&<WeekView/>}
      {view==="day"&&<DayView/>}

      {/* CRM */}
      <div style={{padding:mob?"0 12px 28px":"0 28px 32px"}}>
        <div style={{background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:16,padding:mob?16:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <div style={{fontSize:mob?17:20,fontWeight:700,letterSpacing:"-0.04em"}}>Tous les prospects</div>
            <span style={{fontSize:12,color:c.tx3}}>{allLeads.length} contacts</span>
          </div>
          <div style={{display:"flex",gap:0,marginBottom:16,marginTop:8,borderRadius:10,background:c.s2,padding:2}}>
            {[{k:"all",l:"Tous",n:allLeads.length},{k:"chaud",l:"Chauds",n:allLeads.filter(l=>l.temperature==="chaud").length,cl:c.red},
              {k:"tiede",l:"Tièdes",n:allLeads.filter(l=>l.temperature==="tiede").length,cl:c.or},
              {k:"froid",l:"Froids",n:allLeads.filter(l=>l.temperature==="froid").length,cl:c.tx3}
            ].map(t=>(
              <button key={t.k} onClick={()=>setTab(t.k)} style={{flex:1,padding:"7px 4px",border:"none",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:tab===t.k?600:400,background:tab===t.k?c.s:"transparent",color:tab===t.k?c.tx:c.tx2,boxShadow:tab===t.k?(dk?"0 1px 3px rgba(0,0,0,.3)":"0 1px 3px rgba(0,0,0,.08)"):"none",transition:"all 0.15s"}}>
                {t.l} <span style={{color:t.cl||c.tx2,fontWeight:600,marginLeft:2}}>{t.n}</span>
              </button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(auto-fill,minmax(300px,1fr))",gap:6}}>
            {filtered.map((l,i)=>{
              const fm=FM[l.type_interet]||{c:c.tx3,l:"—",i:"👤"};
              const ago=l.derniere_interaction?Math.round((now-new Date(l.derniere_interaction))/864e5):null;
              const lcol=lc(l);
              return(
                <div key={i} onClick={()=>setEdit(l)} style={{background:c.s2,borderRadius:12,padding:mob?10:12,border:`0.5px solid ${c.bd}`,display:"flex",alignItems:"center",gap:10,cursor:"pointer",transition:"transform 0.1s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.01)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                  <div style={{width:34,height:34,borderRadius:10,background:`${fm.c}10`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{fm.i}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontWeight:600,fontSize:13,letterSpacing:"-0.02em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.prenom?.replace(/^\w/,x=>x.toUpperCase())||l.instagram_username}</span>
                      <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                        <div style={{width:36,height:3,borderRadius:2,background:`${c.tx3}20`,overflow:"hidden"}}><div style={{width:`${l.score}%`,height:"100%",borderRadius:2,background:c.ac}}/></div>
                        <span style={{fontSize:10,fontWeight:600,color:c.tx2}}>{l.score}</span>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:4,marginTop:3,fontSize:10,color:c.tx3,flexWrap:"wrap"}}>
                      <span>{fm.l}</span>
                      {l.date_souhaitee&&<span>· 📅 {l.date_souhaitee}</span>}
                      {l.occasion&&<span>· {l.occasion}</span>}
                      {l.telephone&&<span style={{color:c.gn}}>· 📱</span>}
                      {ago!==null&&<span style={{marginLeft:"auto"}}>{ago===0?"Auj.":ago===1?"Hier":`${ago}j`}</span>}
                    </div>
                  </div>
                  <div style={{width:8,height:8,borderRadius:"50%",background:lcol,flexShrink:0}}/>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Modal({children,onClose,mob,c,saving,title,subtitle}){
  return(
    <div className="fade" onClick={()=>!saving&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:mob?"flex-end":"center",justifyContent:"center",padding:mob?0:20}}>
      <div className={mob?"su":"au"} onClick={e=>e.stopPropagation()} style={{background:c.s,borderRadius:mob?"20px 20px 0 0":18,padding:mob?20:28,width:mob?"100%":480,maxHeight:mob?"90vh":"85vh",overflowY:"auto",border:`0.5px solid ${c.bd}`}}>
        {mob&&<div style={{width:36,height:4,borderRadius:2,background:c.s3,margin:"0 auto 16px"}}/>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div><div style={{fontSize:11,color:c.tx3,fontWeight:500,letterSpacing:"0.04em",textTransform:"uppercase"}}>{subtitle}</div><div style={{fontSize:22,fontWeight:700,letterSpacing:"-0.03em",marginTop:2}}>{title}</div></div>
          <button onClick={onClose} disabled={saving} style={{background:c.s2,border:"none",borderRadius:10,width:32,height:32,fontSize:18,color:c.tx2,cursor:"pointer"}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function MiniCard({l,c,now,lc,setEdit,FM}){
  const fm=FM[l.type_interet]||{c:c.tx3,l:"—",i:"👤"};const lcol=lc(l);
  const ago=l.derniere_interaction?Math.round((now-new Date(l.derniere_interaction))/864e5):null;
  return(
    <div onClick={e=>{e.stopPropagation();setEdit(l);}} style={{background:c.s2,borderRadius:10,padding:12,border:`0.5px solid ${c.bd}`,cursor:"pointer",borderLeft:`3px solid ${lcol}`}} onMouseEnter={e=>e.currentTarget.style.opacity="0.85"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontWeight:600,fontSize:13,letterSpacing:"-0.02em"}}>{fm.i} {l.prenom?.replace(/^\w/,x=>x.toUpperCase())||"?"}</div>
        <span style={{fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:12,background:`${lcol}18`,color:lcol}}>{l.statut==="reserve"?"Réservé":l.temperature==="chaud"?"Chaud":l.temperature==="tiede"?"Tiède":"Froid"}</span>
      </div>
      <div style={{fontSize:11,color:c.tx2,marginTop:4}}>{fm.l}{l.occasion?` · ${l.occasion}`:""}</div>
      <div style={{display:"flex",gap:8,marginTop:6,fontSize:10,color:c.tx3,flexWrap:"wrap"}}>
        {l.telephone&&<span style={{color:c.gn}}>📱 {l.telephone}</span>}
        {l.nombre_personnes&&<span>👥 {l.nombre_personnes}</span>}
        {ago!==null&&<span style={{marginLeft:"auto"}}>{ago===0?"Auj.":ago===1?"Hier":`${ago}j`}</span>}
      </div>
    </div>
  );
}

function EditForm({lead,onSave,onDelete,saving,c,inputStyle,labelStyle}){
  const[f,setF]=useState({prenom:lead.prenom||"",email:lead.email||"",telephone:lead.telephone||"",type_interet:lead.type_interet||"",date_souhaitee:lead.date_souhaitee||"",occasion:lead.occasion||"",nombre_personnes:lead.nombre_personnes||"",statut:lead.statut||"nouveau",temperature:lead.temperature||"froid",score:lead.score||0,notes:lead.notes||""});
  const upd=(k,v)=>setF({...f,[k]:v});
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div><label style={labelStyle}>Prénom</label><input value={f.prenom} onChange={e=>upd("prenom",e.target.value)} style={inputStyle}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><label style={labelStyle}>Email</label><input value={f.email} onChange={e=>upd("email",e.target.value)} style={inputStyle}/></div>
        <div><label style={labelStyle}>Téléphone</label><input value={f.telephone} onChange={e=>upd("telephone",e.target.value)} style={inputStyle}/></div>
      </div>
      <div><label style={labelStyle}>Prestation</label><select value={f.type_interet} onChange={e=>upd("type_interet",e.target.value)} style={inputStyle}><option value="">— Aucun —</option>{TYPES.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}</select></div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10}}>
        <div><label style={labelStyle}>Date souhaitée</label><input value={f.date_souhaitee} onChange={e=>upd("date_souhaitee",e.target.value)} style={inputStyle}/></div>
        <div><label style={labelStyle}>Pers.</label><input type="number" value={f.nombre_personnes} onChange={e=>upd("nombre_personnes",e.target.value?parseInt(e.target.value):"")} style={inputStyle}/></div>
      </div>
      <div><label style={labelStyle}>Occasion</label><input value={f.occasion} onChange={e=>upd("occasion",e.target.value)} style={inputStyle}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><label style={labelStyle}>Statut</label><select value={f.statut} onChange={e=>upd("statut",e.target.value)} style={inputStyle}>{STATUTS.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
        <div><label style={labelStyle}>Température</label><select value={f.temperature} onChange={e=>upd("temperature",e.target.value)} style={inputStyle}>{TEMPS.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
      </div>
      <div><label style={labelStyle}>Score (/100)</label><input type="number" min="0" max="100" value={f.score} onChange={e=>upd("score",parseInt(e.target.value)||0)} style={inputStyle}/></div>
      <div><label style={labelStyle}>Notes</label><textarea value={f.notes} onChange={e=>upd("notes",e.target.value)} rows={3} style={{...inputStyle,resize:"vertical",fontFamily:"inherit"}}/></div>
      <div style={{display:"flex",gap:10,marginTop:8}}>
        <button onClick={()=>onDelete(lead.id)} disabled={saving} style={{background:"transparent",color:c.red,border:`0.5px solid ${c.red}`,borderRadius:12,padding:"14px 18px",fontSize:14,fontWeight:600,cursor:"pointer",opacity:saving?0.5:1}}>Supprimer</button>
        <button onClick={()=>onSave(f)} disabled={saving} style={{flex:1,background:c.ac,color:"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:15,fontWeight:600,cursor:"pointer",opacity:saving?0.5:1}}>{saving?"Sauvegarde…":"Enregistrer"}</button>
      </div>
    </div>
  );
}

function CreateForm({onSave,saving,c,inputStyle,labelStyle}){
  const[f,setF]=useState({prenom:"",email:"",telephone:"",type_interet:"",date_souhaitee:"",occasion:"",nombre_personnes:"",statut:"nouveau",temperature:"tiede",score:50,notes:""});
  const upd=(k,v)=>setF({...f,[k]:v});
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div><label style={labelStyle}>Prénom *</label><input value={f.prenom} onChange={e=>upd("prenom",e.target.value)} placeholder="Nom du client" style={inputStyle}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><label style={labelStyle}>Email</label><input value={f.email} onChange={e=>upd("email",e.target.value)} placeholder="email@exemple.fr" style={inputStyle}/></div>
        <div><label style={labelStyle}>Téléphone</label><input value={f.telephone} onChange={e=>upd("telephone",e.target.value)} placeholder="06 XX XX XX XX" style={inputStyle}/></div>
      </div>
      <div><label style={labelStyle}>Prestation</label><select value={f.type_interet} onChange={e=>upd("type_interet",e.target.value)} style={inputStyle}><option value="">— Aucun —</option>{TYPES.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}</select></div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10}}>
        <div><label style={labelStyle}>Date souhaitée</label><input value={f.date_souhaitee} onChange={e=>upd("date_souhaitee",e.target.value)} placeholder="ex: 15 mai" style={inputStyle}/></div>
        <div><label style={labelStyle}>Pers.</label><input type="number" value={f.nombre_personnes} onChange={e=>upd("nombre_personnes",e.target.value?parseInt(e.target.value):"")} style={inputStyle}/></div>
      </div>
      <div><label style={labelStyle}>Occasion</label><input value={f.occasion} onChange={e=>upd("occasion",e.target.value)} placeholder="anniversaire, EVJF..." style={inputStyle}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><label style={labelStyle}>Statut</label><select value={f.statut} onChange={e=>upd("statut",e.target.value)} style={inputStyle}>{STATUTS.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
        <div><label style={labelStyle}>Température</label><select value={f.temperature} onChange={e=>upd("temperature",e.target.value)} style={inputStyle}>{TEMPS.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
      </div>
      <div><label style={labelStyle}>Score (/100)</label><input type="number" min="0" max="100" value={f.score} onChange={e=>upd("score",parseInt(e.target.value)||0)} style={inputStyle}/></div>
      <div><label style={labelStyle}>Notes</label><textarea value={f.notes} onChange={e=>upd("notes",e.target.value)} rows={3} placeholder="Infos utiles..." style={{...inputStyle,resize:"vertical",fontFamily:"inherit"}}/></div>
      <button onClick={()=>{if(!f.prenom){alert("Prénom obligatoire");return;}onSave(f);}} disabled={saving} style={{background:c.ac,color:"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:15,fontWeight:600,cursor:"pointer",opacity:saving?0.5:1,marginTop:8}}>{saving?"Création…":"Créer le prospect"}</button>
    </div>
  );
}
