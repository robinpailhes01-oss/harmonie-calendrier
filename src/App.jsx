import { useState, useEffect, useCallback, useMemo } from "react";

const SB="https://utyfpmjhtfoxsxncfoxe.supabase.co",SK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0eWZwbWpodGZveHN4bmNmb3hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzgzMTUsImV4cCI6MjA4OTYxNDMxNX0.OGLR8d0GOZVMM48WlhUYrGsnthaaNNxBGPUHpJoSong";
const LAT=43.5283,LON=3.9816;
const MN=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const MNC=["Jan","Fév","Mar","Avr","Mai","Jui","Jul","Aoû","Sep","Oct","Nov","Déc"];
const DL=["L","M","M","J","V","S","D"],DFLS=["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const TX={nuit_classique:180,nuit_prestige:350,nuit_signature:750,sortie_mer_2h:380,sortie_mer_3h:550,sortie_mer_4h:750};
const FM={nuit_classique:{c:"#007AFF",l:"Essentielle",i:"🌙"},nuit_prestige:{c:"#AF52DE",l:"Prestige",i:"✨"},nuit_signature:{c:"#C9A96E",l:"Signature",i:"👑"},sortie_mer_2h:{c:"#30D158",l:"Sortie 2h",i:"⛵"},sortie_mer_3h:{c:"#34C759",l:"Sortie 3h",i:"⛵"},sortie_mer_4h:{c:"#28BD4F",l:"Sortie 4h",i:"⛵"}};
const SOURCES=[
  {v:"instagram_dm",l:"Instagram DM"},
  {v:"site_web",l:"Site web"},
  {v:"whatsapp",l:"WhatsApp"},
  {v:"telephone",l:"Téléphone"},
  {v:"recommandation",l:"Recommandation"},
  {v:"manuel",l:"Manuel"},
  {v:"autre",l:"Autre"},
];
const TYPES=[{v:"nuit_classique",l:"Essentielle 180€"},{v:"nuit_prestige",l:"Prestige 350€"},{v:"nuit_signature",l:"Signature 750€"},{v:"sortie_mer_2h",l:"Sortie 2h 380€"},{v:"sortie_mer_3h",l:"Sortie 3h 550€"},{v:"sortie_mer_4h",l:"Sortie 4h 750€"}];
const STATUTS=[{v:"nouveau",l:"Nouveau"},{v:"en_conversation",l:"En conversation"},{v:"qualifie",l:"Qualifié"},{v:"reserve",l:"Réservé"},{v:"termine",l:"Terminé"},{v:"perdu",l:"Perdu"}];
const TEMPS=[{v:"chaud",l:"Chaud"},{v:"tiede",l:"Tiède"},{v:"froid",l:"Froid"}];
const DT={nuit_classique:[17,12],nuit_prestige:[17,12],nuit_signature:[17,12],sortie_mer_2h:[10,12],sortie_mer_3h:[10,13],sortie_mer_4h:[10,14]};
// Heure d'affichage dans la vue jour (heure de début pour ce jour)
const getDTForDay=(l,isNextDay)=>{
  if(isNuit(l.type_interet)){
    return isNextDay?{h:8,label:"8h → 12h (Départ)",fin:12}:{h:17,label:"17h → 12h J+1",fin:23};
  }
  const dt=DT[l.type_interet]||[10,12];
  return{h:dt[0],label:dt[0]+"h → "+dt[1]+"h",fin:dt[1]};
};
// Demi-heures : 7h00=7.0, 7h30=7.5, ..., 23h00=23.0
const HOURS=Array.from({length:33},(_,i)=>7+i*0.5);
const fmtH=h=>{const hh=Math.floor(h);const mm=h%1===0.5?"30":"00";return hh+"h"+mm;};

// Sort leads: réservé first, then chaud, then tiède, then froid
function sortLeads(leads){
  const order={reserve:0,chaud:1,tiede:2,froid:3};
  return [...leads].sort((a,b)=>{
    const ao=a.statut==="reserve"?0:order[a.temperature]||3;
    const bo=b.statut==="reserve"?0:order[b.temperature]||3;
    if(ao!==bo)return ao-bo;
    return (b.score||0)-(a.score||0);
  });
}

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
function fmt(n){return n>=1000?`${(n/1000).toFixed(1)}k€`:`${n}€`;}

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
  const[mainTab,setMainTab]=useState("cal");
  const[depenses,setDepenses]=useState([]);
  const[newDep,setNewDep]=useState({montant:"",categorie:"carburant",description:"",date:new Date().toISOString().split("T")[0]});
  const[savingDep,setSavingDep]=useState(false);
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
      const f=d.filter(l=>!["robinpailhes","robinai_consulting"].includes(l.instagram_username));
      setAllLeads(sortLeads(f));
      const seen=new Set();const deduped=[];
      for(const l of sortLeads(f)){if(!seen.has(l.instagram_username)){seen.add(l.instagram_username);const pd=pda(l.date_souhaitee,now);deduped.push({...l,pd});}}
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
    try{const dp2=await sb("depenses?select=*&order=date.desc&limit=200");setDepenses(Array.isArray(dp2)?dp2:[]);}catch(e){}
  },[yr,mo,now,sb]);
  useEffect(()=>{load();},[load]);

  // Prix effectif d'un lead : prix_custom si défini, sinon tarif catalogue
  const prixEffectif=l=>parseFloat(l.prix_custom||0)||TX[l.type_interet]||0;

  // Financial calculations — réactif à chaque sauvegarde via allLeads
  const finCalc=useMemo(()=>{
    const reserves=allLeads.filter(l=>l.statut==="reserve");
    const encaisse=reserves.reduce((s,l)=>s+parseFloat(l.acompte_recu||0),0);
    const totalReserve=reserves.reduce((s,l)=>s+prixEffectif(l),0);
    const restant=totalReserve-encaisse;
    const potentiel=datedLeads.filter(l=>l.statut!=="reserve").reduce((s,l)=>s+prixEffectif(l),0);
    // CA global = tout ce qui a été encaissé (acomptes + soldés)
    const caGlobal=allLeads.reduce((s,l)=>s+parseFloat(l.montant_total_encaisse||l.acompte_recu||0),0);
    // CA mois en cours
    const moisCourant=new Date().toISOString().substring(0,7);
    const caMoisEnCours=allLeads.filter(l=>{
      const d=l.date_solde||l.updated_at||l.created_at||"";
      return d.substring(0,7)===moisCourant;
    }).reduce((s,l)=>s+parseFloat(l.montant_total_encaisse||l.acompte_recu||0),0);
    // Nb résas mois en cours
    const resasMois=reserves.filter(l=>{
      const d=l.date_souhaitee||"";
      // Check si la date souhaitée est dans le mois courant
      try{
        const pd=new Date(l.pd||0);
        return pd.getFullYear()===new Date().getFullYear()&&pd.getMonth()===new Date().getMonth();
      }catch(e){return false;}
    }).length;
    return{encaisse,restant,totalReserve,potentiel,nReserves:reserves.length,caGlobal,caMoisEnCours,resasMois};
  },[allLeads,datedLeads]);

  const saveLead=async(updates)=>{
    if(!edit?.id)return;setSaving(true);
    try{
      const cl={};
      // Champs financiers : toujours envoyés (types mixtes string/number sinon ignorés)
      const financialKeys=["acompte_recu","montant_total_encaisse","prix_custom","moyen_paiement_solde","numero_facture","heure_debut","heure_fin"];
      for(const k in updates){
        const isDiff=String(updates[k])!==String(edit[k]??'');
        const isFinancial=financialKeys.includes(k);
        if(isDiff||isFinancial){cl[k]=updates[k]===""?null:updates[k];}
      }
      if(Object.keys(cl).length>0)
        await fetch(`${SB}/rest/v1/leads?id=eq.${edit.id}`,{method:"PATCH",headers:{apikey:SK,Authorization:`Bearer ${SK}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(cl)});
      await load();setEdit(null);
    }catch(e){alert("Erreur sauvegarde");}
    setSaving(false);
  };
  const createLead=async(data)=>{setSaving(true);try{const cl={...data};cl.instagram_username=cl.instagram_username||("manuel_"+Date.now());cl.source=cl.source||"manuel";cl.statut=cl.statut||"nouveau";cl.temperature=cl.temperature||"tiede";cl.score=cl.score||50;cl.nombre_messages=0;const r=await fetch(`${SB}/rest/v1/leads`,{method:"POST",headers:{apikey:SK,Authorization:`Bearer ${SK}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(cl)});if(!r.ok)throw new Error(await r.text());await load();setCreating(false);}catch(e){alert("Erreur: "+e.message);}setSaving(false);};
  const deleteLead=async(id)=>{if(!confirm("Supprimer ce prospect ?"))return;setSaving(true);try{await fetch(`${SB}/rest/v1/leads?id=eq.${id}`,{method:"DELETE",headers:{apikey:SK,Authorization:`Bearer ${SK}`}});await load();setEdit(null);}catch(e){}setSaving(false);};

  const marquerSolde=async(leadId,moyen)=>{
    setSaving(true);
    try{
      const lead=allLeads.find(l=>l.id===leadId);
      if(!lead)throw new Error("Lead introuvable");
      const prix=parseFloat(lead.prix_custom||0)||TX[lead.type_interet]||0;
      const numRes=await fetch(`${SB}/rest/v1/rpc/next_facture_numero`,{
        method:"POST",
        headers:{apikey:SK,Authorization:`Bearer ${SK}`,"Content-Type":"application/json"},
        body:JSON.stringify({p_annee:new Date().getFullYear()})
      });
      const numero=await numRes.json();
      await fetch(`${SB}/rest/v1/leads?id=eq.${leadId}`,{
        method:"PATCH",
        headers:{apikey:SK,Authorization:`Bearer ${SK}`,"Content-Type":"application/json","Prefer":"return=minimal"},
        body:JSON.stringify({acompte_recu:prix,montant_total_encaisse:prix,statut:"reserve",moyen_paiement_solde:moyen,numero_facture:numero,date_solde:new Date().toISOString()})
      });
      fetch("https://robinplhs.app.n8n.cloud/webhook/solde-facture",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({lead_id:leadId,prenom:lead.prenom,email:lead.email,telephone:lead.telephone,type_interet:lead.type_interet,date_souhaitee:lead.date_souhaitee,occasion:lead.occasion,nb_personnes:lead.nombre_personnes,prix_total:prix,moyen_paiement:moyen,numero_facture:numero,notes:lead.notes||""})
      }).catch(()=>{});
      await load();setEdit(null);
      alert(`✅ ${lead.prenom} soldé — Facture ${numero} en cours de génération`);
    }catch(e){alert("Erreur: "+e.message);}
    setSaving(false);
  };

  const addDepense=async()=>{
    if(!newDep.montant||parseFloat(newDep.montant)<=0){alert("Montant requis");return;}
    setSavingDep(true);
    try{
      await fetch(SB+"/rest/v1/depenses",{method:"POST",headers:{apikey:SK,Authorization:"Bearer "+SK,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({montant:parseFloat(newDep.montant),categorie:newDep.categorie,description:newDep.description,date:newDep.date})});
      setNewDep({montant:"",categorie:"carburant",description:"",date:new Date().toISOString().split("T")[0]});
      await load();
    }catch(e){alert("Erreur: "+e.message);}
    setSavingDep(false);
  };
  const deleteDepense=async(id)=>{
    if(!confirm("Supprimer ?"))return;
    await fetch(SB+"/rest/v1/depenses?id=eq."+id,{method:"DELETE",headers:{apikey:SK,Authorization:"Bearer "+SK}});
    await load();
  };
  const lfd=d=>sortLeads(datedLeads.filter(l=>l.pd&&l.pd.getFullYear()===yr&&l.pd.getMonth()===mo&&l.pd.getDate()===d));
  const wfd=d=>wx[`${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`]||null;
  const wxForDate=d=>wx[`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`]||null;
  const isToday=d=>d instanceof Date?sameDay(d,now):(d===now.getDate()&&mo===now.getMonth()&&yr===now.getFullYear());
  const wi=code=>{if(code==null)return"";if(code>=61)return"🌧";if(code>=51)return"🌦";if(code>=45)return"🌫";if(code>=3)return"⛅";if(code>=1)return"🌤";return"☀️";};
  const isG=w=>w&&w.code<3&&w.hi>=20&&w.wind<30&&(!w.wave||parseFloat(w.wave)<1);
  const lc=l=>{
  if(l.statut==="reserve")return"#10B981";   // vert émeraude
  if(l.statut==="termine")return"#6B7280";   // gris
  if(l.statut==="perdu")return"#6B7280";
  if(l.temperature==="chaud")return"#EF4444"; // rouge vif
  if(l.temperature==="tiede")return"#F59E0B"; // orange
  return"#94A3B8";                             // gris bleu froid
};

  const up=useMemo(()=>datedLeads.filter(l=>l.pd&&l.pd>=new Date(now.getFullYear(),now.getMonth(),now.getDate())).sort((a,b)=>a.pd-b.pd),[datedLeads,now]);
  const profit=fin.rev-fin.dep;
  const filtered=useMemo(()=>{
    let base=allLeads;
    if(tab==="chaud")base=allLeads.filter(l=>l.temperature==="chaud");
    else if(tab==="tiede")base=allLeads.filter(l=>l.temperature==="tiede");
    else if(tab==="froid")base=allLeads.filter(l=>l.temperature==="froid");
    return sortLeads(base);
  },[allLeads,tab]);
  const weekDays=useMemo(()=>{const days=[];for(let i=0;i<7;i++){const d=new Date(weekStart);d.setDate(weekStart.getDate()+i);days.push(d);}return days;},[weekStart]);
  const isNuit=t=>t==="nuit_classique"||t==="nuit_prestige"||t==="nuit_signature";
const srcIcon=s=>({instagram_dm:"📸",site_web:"🌐",whatsapp:"💬",telephone:"📞",recommandation:"⭐",manuel:"✏️"})[s]||"📋";
const srcLabel=s=>({instagram_dm:"Instagram",site_web:"Site web",whatsapp:"WhatsApp",telephone:"Tél",recommandation:"Reco",manuel:"Manuel"})[s]||s||"?";
  const leadsForDate=d=>sortLeads(datedLeads.filter(l=>l.pd&&sameDay(l.pd,d)));

  const goBack=()=>{if(view==="month")setCur(new Date(yr,mo-1,1));else if(view==="week"){const d=new Date(weekStart);d.setDate(d.getDate()-7);setWeekStart(new Date(d));}else{const d=new Date(dayView);d.setDate(d.getDate()-1);setDayView(new Date(d));}setSel(null);};
  const goFwd=()=>{if(view==="month")setCur(new Date(yr,mo+1,1));else if(view==="week"){const d=new Date(weekStart);d.setDate(d.getDate()+7);setWeekStart(new Date(d));}else{const d=new Date(dayView);d.setDate(d.getDate()+1);setDayView(new Date(d));}setSel(null);};
  const goToday=()=>{const t=new Date();setCur(t);setWeekStart(getWeekStart(t));setDayView(t);setSel(null);};
  const openDay=d=>{setDayView(new Date(d));setView("day");setSel(null);};
  const navTitle=()=>{if(view==="month")return`${MN[mo]} ${yr}`;if(view==="week"){const e=weekDays[6];return`${weekDays[0].getDate()} – ${e.getDate()} ${MNC[e.getMonth()]} ${e.getFullYear()}`;}return`${dayView.getDate()} ${MN[dayView.getMonth()]} ${dayView.getFullYear()}`;};

  const ff="-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif";
  const inputStyle={width:"100%",padding:"10px 12px",borderRadius:10,border:`0.5px solid ${c.bd}`,background:c.s2,color:c.tx,fontSize:14,marginTop:4};
  const labelStyle={fontSize:11,fontWeight:600,color:c.tx2,letterSpacing:"0.02em",textTransform:"uppercase"};

  // ---- EVENT BAR (used on both mobile and desktop) ----
  const EventBar=({l,compact})=>{
    const lcol=lc(l);const fm=FM[l.type_interet]||{i:"👤"};
    return(
      <div onClick={e=>{e.stopPropagation();setEdit(l);}}
        style={{fontSize:compact?9:9,fontWeight:600,padding:compact?"1px 3px 1px 5px":"1px 4px 1px 6px",borderRadius:3,marginBottom:1,background:`${lcol}22`,color:lcol,cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",borderLeft:`2px solid ${lcol}`,lineHeight:"14px"}}>
        {fm.i} {l.prenom?.replace(/^\w/,x=>x.toUpperCase())||"?"}
        {l.statut==="reserve"&&" ✓"}
      </div>
    );
  };

  // ---- MONTH VIEW ----
  const MonthView=()=>(
    <div style={{padding:mob?"0 8px 16px":"0 28px 24px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:4}}>
        {(mob?DL:DFLS).map((d,i)=><div key={i} style={{textAlign:"center",fontSize:11,fontWeight:500,color:c.tx3,padding:"4px 0",letterSpacing:"0.03em"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:mob?1:2}}>
        {Array.from({length:fd}).map((_,i)=><div key={`e${i}`} style={{minHeight:mob?60:96}}/>)}
        {Array.from({length:dim}).map((_,i)=>{
          const day=i+1,dl=lfd(day),w=wfd(day),td=isToday(day),s=sel===day;
          const maxBars=mob?2:3;
          return(
            <div key={day} onClick={()=>setSel(s?null:day)}
              style={{minHeight:mob?60:96,padding:mob?"2px 2px":"4px 4px",cursor:"pointer",background:s?c.sel:"transparent",borderRadius:8,border:`0.5px solid ${s?c.ac+"50":c.bd+"25"}`,overflow:"hidden",transition:"background 0.1s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"2px 3px 2px"}}>
                <div style={{width:mob?20:26,height:mob?20:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:mob?10:13,fontWeight:td?700:400,background:td?c.ac:"transparent",color:td?"#fff":s?c.ac:c.tx,flexShrink:0}}>{day}</div>
                {!mob&&w&&<span style={{fontSize:9,color:c.tx3,marginTop:3}}>{wi(w.code)}{w.hi}°</span>}
              </div>
              {/* Bars on ALL screen sizes */}
              {dl.slice(0,maxBars).map((l,idx)=><EventBar key={idx} l={l} compact={mob}/>)}
              {dl.length>maxBars&&<div style={{fontSize:mob?7:8,color:c.tx3,padding:"0 3px"}}>+{dl.length-maxBars}</div>}
            </div>
          );
        })}
      </div>
      {sel&&(
        <div className="au" style={{marginTop:12,background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:14,padding:mob?14:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <div style={{fontSize:20,fontWeight:700,letterSpacing:"-0.04em"}}>{sel} {MN[mo]}</div>
              {wfd(sel)&&<div style={{fontSize:11,color:c.tx2,marginTop:2}}>{wi(wfd(sel).code)} {wfd(sel).hi}°/{wfd(sel).lo}° · 💨{wfd(sel).wind}km/h{wfd(sel).wave?` · 🌊${wfd(sel).wave}m`:""}{isG(wfd(sel))&&<span style={{color:c.gn,marginLeft:6}}>✓ Idéal</span>}</div>}
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
  const WeekView=()=>{
    const SLOT_H=28; // px par demi-heure
    const H_START=7;
    const parseHDec=s=>{if(!s)return null;const p=s.split(":");return parseInt(p[0])+(parseInt(p[1]||"0")>=30?0.5:0);};
    const totalH=HOURS.length*SLOT_H;
    return(
    <div style={{padding:mob?"0 4px 16px":"0 28px 24px",overflowX:"auto"}}>
      <div style={{minWidth:mob?520:0}}>
        {/* Header jours */}
        <div style={{display:"grid",gridTemplateColumns:`44px repeat(7,1fr)`,borderBottom:`1px solid ${c.bd}40`,background:c.s,position:"sticky",top:0,zIndex:10}}>
          <div/>
          {weekDays.map((d,i)=>{
            const td=isToday(d);
            const dl=leadsForDate(d);
            const hasResa=dl.some(l=>l.statut==="reserve");
            const hasChaud=dl.some(l=>l.temperature==="chaud"&&l.statut!=="reserve");
            const w=wxForDate(d);
            return(
              <div key={i} onClick={()=>openDay(d)} style={{textAlign:"center",padding:"6px 2px 4px",cursor:"pointer",borderLeft:`0.5px solid ${c.bd}20`,background:td?`${c.ac}06`:"transparent"}}>
                <div style={{fontSize:9,color:c.tx3,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>{DFLS[i]}</div>
                <div style={{width:28,height:28,borderRadius:"50%",background:td?c.ac:"transparent",color:td?"#fff":c.tx,fontSize:14,fontWeight:700,margin:"3px auto 1px",display:"flex",alignItems:"center",justifyContent:"center"}}>{d.getDate()}</div>
                {w&&<div style={{fontSize:8,color:c.tx3,marginBottom:1}}>{wi(w.code)}{w.hi}°</div>}
                {/* Indicateurs leads */}
                {dl.length>0&&<div style={{display:"flex",justifyContent:"center",gap:2,marginBottom:2}}>
                  {hasResa&&<div style={{width:6,height:6,borderRadius:"50%",background:"#10B981"}}/>}
                  {hasChaud&&<div style={{width:6,height:6,borderRadius:"50%",background:"#EF4444"}}/>}
                  {!hasResa&&!hasChaud&&dl.length>0&&<div style={{width:6,height:6,borderRadius:"50%",background:"#F59E0B"}}/>}
                </div>}
              </div>
            );
          })}
        </div>
        {/* Grille + cartes */}
        <div style={{border:`0.5px solid ${c.bd}20`,borderTop:"none",borderRadius:"0 0 12px 12px",overflow:"hidden",position:"relative"}}>
          <div style={{display:"grid",gridTemplateColumns:`44px repeat(7,1fr)`,height:totalH}}>
            {/* Colonne heures */}
            <div style={{borderRight:`0.5px solid ${c.bd}20`}}>
              {HOURS.map((h,hi)=>(
                <div key={h} style={{height:SLOT_H,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingRight:6,paddingTop:3,borderBottom:h%1===0?`0.5px solid ${c.bd}20`:`0.5px solid ${c.bd}08`}}>
                  <span style={{fontSize:8,color:c.tx3,fontWeight:h%1===0?500:300}}>{h%1===0?Math.floor(h)+"h":""}</span>
                </div>
              ))}
            </div>
            {/* 7 colonnes jours — grille */}
            {weekDays.map((d,di)=>{
              const isNowLine=isToday(d);
              const nowDec=now.getHours()+(now.getMinutes()>=30?0.5:0);
              const nowTop=(nowDec-H_START)*SLOT_H*2;
              return(
                <div key={di} onClick={()=>openDay(d)} style={{borderLeft:`0.5px solid ${c.bd}15`,position:"relative",cursor:"pointer",background:isToday(d)?`${c.ac}03`:"transparent"}}>
                  {/* Lignes de grille */}
                  {HOURS.map((h,hi)=>(
                    <div key={h} style={{position:"absolute",top:hi*SLOT_H,left:0,right:0,height:SLOT_H,borderBottom:h%1===0?`0.5px solid ${c.bd}20`:`0.5px solid ${c.bd}06`}}/>
                  ))}
                  {/* Ligne heure actuelle */}
                  {isNowLine&&<div style={{position:"absolute",top:nowTop,left:0,right:0,height:2,background:c.ac,zIndex:5,boxShadow:`0 0 4px ${c.ac}`}}/>}
                  {/* Cartes leads */}
                  {leadsForDate(d).map((l,li)=>{
                    const lcol=lc(l);
                    const fm=FM[l.type_interet]||{i:"?",l:"?"};
                    const hDebut=parseHDec(l.heure_debut)||(DT[l.type_interet]?.[0]||10);
                    const hFinDefault=isNuit(l.type_interet)?(hDebut+2):(DT[l.type_interet]?.[1]||hDebut+2);
                    const hFin=parseHDec(l.heure_fin)||hFinDefault;
                    const topPx=(hDebut-H_START)*SLOT_H*2;
                    const heightPx=Math.max(SLOT_H*2,(hFin-hDebut)*SLOT_H*2-2);
                    const prix=parseFloat(l.prix_custom||0)||TX[l.type_interet]||0;
                    const acompte=parseFloat(l.acompte_recu||0);
                    return(
                      <div key={li} onClick={e=>{e.stopPropagation();setEdit(l);}}
                        style={{position:"absolute",left:2,right:2,top:topPx,height:heightPx,
                          background:`${lcol}15`,border:`0.5px solid ${lcol}40`,borderLeft:`3px solid ${lcol}`,
                          borderRadius:6,padding:"4px 6px",cursor:"pointer",zIndex:4,overflow:"hidden",
                          boxSizing:"border-box"}}>
                        <div style={{fontSize:10,fontWeight:700,color:lcol,lineHeight:"13px",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
                          {l.prenom?.replace(/^\w/,x=>x.toUpperCase())||"?"}
                          {l.statut==="reserve"&&<span style={{marginLeft:3,fontSize:8,fontWeight:600,color:"#10B981"}}>✓</span>}
                        </div>
                        {heightPx>=42&&<div style={{fontSize:8,color:lcol,opacity:0.8,marginTop:1,overflow:"hidden",whiteSpace:"nowrap"}}>
                          {fm.i} {l.heure_debut||DT[l.type_interet]?.[0]+"h"}→{l.heure_fin||(isNuit(l.type_interet)?"12h J+1":DT[l.type_interet]?.[1]+"h")}
                        </div>}
                        {heightPx>=56&&acompte>0&&<div style={{fontSize:8,color:"#10B981",fontWeight:600,marginTop:1}}>+{acompte}€</div>}
                        {heightPx>=56&&prix>0&&acompte<prix&&<div style={{fontSize:8,color:"#F59E0B",fontWeight:600}}>⏳{prix-acompte}€</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        {/* Légende */}
        <div style={{display:"flex",gap:12,marginTop:10,paddingLeft:4,flexWrap:"wrap"}}>
          {[{col:"#10B981",l:"Réservé"},{col:"#EF4444",l:"Chaud"},{col:"#F59E0B",l:"Tiède"},{col:"#94A3B8",l:"Froid"}].map((x,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:10,height:10,borderRadius:2,background:x.col}}/>
              <span style={{fontSize:10,color:c.tx3}}>{x.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );};

  // ---- DAY VIEW ----
  const DayView=()=>{
    const dl=leadsForDate(dayView);
    const w=wxForDate(dayView);
    const ROW_H=56; // px par heure
    // Heure début pour positionnement — custom si défini sinon défaut
    const getH=(l)=>{
      if(l.heure_debut){
        const parts=l.heure_debut.split(":");
        const hh=parseInt(parts[0])||10;
        const mm=parseInt(parts[1]||"0");
        return hh+(mm>=30?0.5:0);
      }
      return DT[l.type_interet]?.[0]||10;
    };
    const getHeureLabel=(l)=>{
      const debut=l.heure_debut||((DT[l.type_interet]?.[0]||10)+"h00");
      const fin=l.heure_fin||(isNuit(l.type_interet)?"12h00 J+1":((DT[l.type_interet]?.[1]||12)+"h00"));
      return debut.replace(":",":")+` → `+fin;
    };

    return(
      <div style={{padding:mob?"0 12px 24px":"0 28px 32px"}}>
        {/* Météo */}
        {w&&<div style={{background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:12,padding:"10px 16px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:24}}>{wi(w.code)}</span>
            <div>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.04em"}}>{w.hi}°<span style={{fontSize:12,fontWeight:400,color:c.tx2}}>/{w.lo}°</span></div>
              <div style={{fontSize:10,color:c.tx2}}>💨{w.wind}km/h{w.wave?` · 🌊${w.wave}m`:""}</div>
            </div>
          </div>
          {isG(w)&&<div style={{background:`${c.gn}15`,border:`0.5px solid ${c.gn}40`,borderRadius:8,padding:"5px 10px",color:c.gn,fontSize:11,fontWeight:600}}>✓ Idéal</div>}
        </div>}

        {/* Résumé événements du jour */}
        {dl.length>0&&<div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          {dl.map((l,i)=>{
            const lcol=lc(l);const fm=FM[l.type_interet]||{i:"👤",l:"?"};
            return(
              <div key={i} onClick={()=>setEdit(l)} style={{display:"flex",alignItems:"center",gap:8,background:c.s,border:`1px solid ${lcol}40`,borderLeft:`3px solid ${lcol}`,borderRadius:10,padding:"8px 12px",cursor:"pointer",flex:1,minWidth:mob?120:180}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:lcol}}>{fm.i} {l.prenom?.replace(/^\w/,x=>x.toUpperCase())||"?"}</div>
                  <div style={{fontSize:10,color:c.tx2,marginTop:1}}>{fm.l}{l.occasion?` · ${l.occasion}`:""}</div>
                  <div style={{fontSize:10,color:c.tx3,marginTop:1}}>
                    {l.heure_debut?l.heure_debut+" → "+(l.heure_fin||""):(DT[l.type_interet]?DT[l.type_interet][0]+"h00 → "+(isNuit(l.type_interet)?"12h00 J+1":DT[l.type_interet][1]+"h00"):"")}
                  </div>
                </div>
                {l.statut==="reserve"&&<div style={{marginLeft:"auto",fontSize:9,fontWeight:600,padding:"2px 6px",borderRadius:8,background:`${c.gn}20`,color:c.gn}}>✓</div>}
              </div>
            );
          })}
        </div>}

        {/* Timeline Google Calendar style — position absolute comme GCal */}
        <div style={{background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:12,overflow:"hidden"}}>
          {dl.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:c.tx3}}>
            <div style={{fontSize:24,marginBottom:6}}>📅</div>
            <div style={{fontSize:13,fontWeight:600,color:c.tx2}}>Journée libre</div>
            {isG(w)&&<div style={{fontSize:11,color:c.gn,marginTop:4}}>Conditions parfaites</div>}
          </div>}
          {/* Grille de fond — slots de 30min fixes */}
          <div style={{position:"relative"}}>
            {/* Lignes de la grille */}
            {HOURS.map((h,hi)=>{
              const isNow=isToday(dayView)&&(now.getHours()+(now.getMinutes()>=30?0.5:0))===h;
              return(
                <div key={h} style={{display:"flex",height:32,borderBottom:`0.5px solid ${c.bd}${h%1===0?"25":"10"}`,background:isNow?`${c.ac}04`:"transparent"}}>
                  <div style={{width:48,paddingRight:8,paddingTop:4,fontSize:9,color:isNow?c.ac:c.tx3,fontWeight:isNow?600:400,textAlign:"right",flexShrink:0}}>
                    {h%1===0?Math.floor(h)+"h":""}
                  </div>
                  <div style={{flex:1,borderLeft:`0.5px solid ${isNow?c.ac+"60":c.bd+"20"}`,position:"relative"}}>
                    {isNow&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:c.ac,zIndex:3}}/>}
                  </div>
                </div>
              );
            })}
            {/* Cartes positionnées en absolu comme Google Calendar */}
            <div style={{position:"absolute",top:0,left:48,right:0,bottom:0,pointerEvents:"none"}}>
              {dl.map((l,li)=>{
                const lcol=lc(l);
                const fm=FM[l.type_interet]||{c:c.tx3,l:"?",i:"👤"};
                const prix=parseFloat(l.prix_custom||0)||TX[l.type_interet]||0;
                const acompte=parseFloat(l.acompte_recu||0);
                const restant=prix-acompte;
                const heureLabel=getHeureLabel(l);
                const SLOT_H=32; // px par slot 30min — doit correspondre à height:32 ci-dessus
                const H_START=7; // heure de début de la grille
                const parseHDec=s=>{if(!s)return null;const p=s.split(":");return parseInt(p[0])+(parseInt(p[1]||"0")>=30?0.5:0);};
                const hDebut=parseHDec(l.heure_debut)||(DT[l.type_interet]?.[0]||10);
                const hFinDefault=isNuit(l.type_interet)?(hDebut+19):(DT[l.type_interet]?.[1]||hDebut+2);
                const hFin=parseHDec(l.heure_fin)||hFinDefault;
                const topPx=(hDebut-H_START)*SLOT_H*2; // *2 car SLOT_H = 30min
                const heightPx=Math.max(SLOT_H,(hFin-hDebut)*SLOT_H*2-2);
                return(
                  <div key={li} onClick={()=>setEdit(l)}
                    style={{position:"absolute",left:4,right:4,top:topPx,height:heightPx,
                      background:`${lcol}18`,border:`0.5px solid ${lcol}50`,borderLeft:`3px solid ${lcol}`,
                      borderRadius:8,padding:"6px 10px",cursor:"pointer",pointerEvents:"all",
                      overflow:"hidden",boxSizing:"border-box",zIndex:2}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                          <div style={{flex:1,minWidth:0}}>
                            {/* Nom + badge */}
                            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                              <div style={{fontSize:15,fontWeight:700,color:lcol}}>{l.prenom?.replace(/^\w/,x=>x.toUpperCase())||"?"}</div>
                              {l.statut==="reserve"&&<span style={{fontSize:9,fontWeight:600,padding:"2px 6px",borderRadius:8,background:`${c.gn}20`,color:c.gn}}>✓ Réservé</span>}
                            </div>
                            {/* Prestation */}
                            <div style={{fontSize:11,color:c.tx2,marginTop:2}}>{fm.i} {fm.l}{l.occasion?` · ${l.occasion}`:""}</div>
                            {/* Contacts */}
                            <div style={{display:"flex",gap:8,marginTop:4,flexWrap:"wrap"}}>
                              {l.telephone&&<span style={{fontSize:10,color:c.gn}}>📱 {l.telephone}</span>}
                              {l.email&&<span style={{fontSize:10,color:c.tx3}}>✉ {l.email}</span>}
                              {l.source&&<span style={{fontSize:10,color:c.tx3}}>{srcIcon(l.source)} {srcLabel(l.source)}</span>}
                              {l.nombre_personnes&&<span style={{fontSize:10,color:c.tx3}}>👥 {l.nombre_personnes} pers.</span>}
                            </div>
                            {/* Notes */}
                            {l.notes&&<div style={{fontSize:10,color:c.tx3,marginTop:4,fontStyle:"italic"}}>{l.notes.substring(0,100)}</div>}
                            {/* Finances */}
                            {prix>0&&<div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                              <span style={{fontSize:9,fontWeight:600,padding:"2px 7px",borderRadius:6,background:`${c.gn}15`,color:c.gn}}>💰 {prix}€</span>
                              {acompte>0&&<span style={{fontSize:9,fontWeight:600,padding:"2px 7px",borderRadius:6,background:`${c.ac}15`,color:c.ac}}>✓ {acompte}€ reçu</span>}
                              {restant>0&&<span style={{fontSize:9,fontWeight:600,padding:"2px 7px",borderRadius:6,background:`${c.or}15`,color:c.or}}>⏳ {restant}€ restant</span>}
                            </div>}
                          </div>
                          {/* Horaires */}
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{fontSize:13,fontWeight:700,color:lcol,whiteSpace:"nowrap"}}>{heureLabel}</div>
                            {l.score&&<div style={{fontSize:9,color:c.tx3,marginTop:3}}>Score {l.score}</div>}
                          </div>
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
        <EditForm lead={edit} onSave={saveLead} onDelete={deleteLead} onSolde={marquerSolde} saving={saving} c={c} inputStyle={inputStyle} labelStyle={labelStyle}/>
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
            <button onClick={()=>setCreating(true)} style={{background:c.ac,border:"none",borderRadius:10,padding:mob?"6px 10px":"6px 14px",cursor:"pointer",fontSize:13,color:"#fff",fontWeight:600}}>+ {mob?"":"Lead"}</button>
            <button onClick={()=>setDk(!dk)} style={{background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:10,padding:"6px 10px",cursor:"pointer",fontSize:14}}>{dk?"☀️":"🌙"}</button>
          </div>
        </div>

        {/* KPI STRIP — 3 rows on mobile, scrollable */}
        <div style={{borderTop:`0.5px solid ${c.bd}`,overflowX:"auto"}}>
          {/* Row 1: CA Global + CA Mois + Dépenses + Leads */}
          <div style={{display:"flex"}}>
            {[
              {l:"CA Global",v:`${fmt(finCalc.caGlobal)}`,s:"Total encaissé",cl:c.gn},
              {l:"CA "+new Date().toLocaleDateString("fr-FR",{month:"short"}),v:`${fmt(finCalc.caMoisEnCours)}`,s:"Ce mois",cl:"#007AFF"},
              {l:"Dépenses",v:`${fmt(fin.dep)}`,s:`${fin.nD} op.`,cl:c.red},
            ].map((k,i)=>(
              <div key={i} style={{flex:1,padding:mob?"7px 10px":"9px 16px",borderRight:`0.5px solid ${c.bd}`,minWidth:mob?80:0}}>
                <div style={{fontSize:mob?8:9,color:c.tx3,fontWeight:500}}>{k.l}</div>
                <div style={{fontSize:mob?13:17,fontWeight:700,letterSpacing:"-0.04em",color:k.cl}}>{k.v}</div>
                <div style={{fontSize:mob?8:9,color:c.tx3}}>{k.s}</div>
              </div>
            ))}
            <div style={{flex:1,padding:mob?"7px 10px":"9px 16px",minWidth:mob?80:0}}>
              <div style={{fontSize:mob?8:9,color:c.tx3,fontWeight:500}}>Leads</div>
              <div style={{fontSize:mob?13:17,fontWeight:700,letterSpacing:"-0.04em",color:c.or}}>{allLeads.length}</div>
              <div style={{fontSize:mob?8:9,color:c.tx3}}>{allLeads.filter(l=>l.temperature==="chaud").length} chauds</div>
            </div>
          </div>
          {/* Row 2: Financier réservations */}
          <div style={{display:"flex",borderTop:`0.5px solid ${c.bd}30`}}>
            {[
              {l:"Encaissé",v:`${fmt(finCalc.encaisse)}`,s:`${finCalc.nReserves} rés.`,cl:c.gn,icon:"✓"},
              {l:"Restant",v:`${fmt(finCalc.restant)}`,s:"à encaisser",cl:c.or,icon:"⏳"},
              {l:"Pipeline",v:`${fmt(finCalc.potentiel)}`,s:`${up.length} datés`,cl:c.ac,icon:"🔥"},
              {l:"Total résas",v:`${fmt(finCalc.totalReserve)}`,s:"confirmé",cl:c.pu,icon:"⛵"},
            ].map((k,i)=>(
              <div key={i} style={{flex:1,padding:mob?"6px 10px":"8px 16px",borderRight:i<3?`0.5px solid ${c.bd}30`:"none",minWidth:mob?80:0}}>
                <div style={{fontSize:mob?7:9,color:c.tx3,fontWeight:500}}>{k.icon} {k.l}</div>
                <div style={{fontSize:mob?12:16,fontWeight:700,letterSpacing:"-0.03em",color:k.cl}}>{k.v}</div>
                <div style={{fontSize:mob?7:9,color:c.tx3}}>{k.s}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* NAV */}
      <div style={{display:"flex",borderBottom:`0.5px solid ${c.bd}`,overflowX:"auto"}}>
        {[{k:"cal",l:"Calendrier"},{k:"crm",l:"Prospects"},{k:"finances",l:"Finances"}].map(t=>(
          <button key={t.k} onClick={()=>setMainTab(t.k)} style={{padding:"10px 16px",border:"none",borderBottom:mainTab===t.k?`2px solid ${c.ac}`:"2px solid transparent",background:"transparent",color:mainTab===t.k?c.ac:c.tx2,fontSize:mob?12:13,fontWeight:mainTab===t.k?600:400,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
            {t.l}
          </button>
        ))}
      </div>
      {mainTab==="cal"&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:mob?"10px 12px":"14px 28px"}}>
        <div style={{display:"flex",alignItems:"center",gap:2}}>
          <button onClick={goBack} style={{background:"none",border:"none",color:c.ac,fontSize:22,cursor:"pointer",padding:"2px 8px",lineHeight:1}}>‹</button>
          <div style={{fontSize:mob?16:21,fontWeight:700,minWidth:mob?140:220,textAlign:"center",letterSpacing:"-0.04em"}}>{navTitle()}</div>
          <button onClick={goFwd} style={{background:"none",border:"none",color:c.ac,fontSize:22,cursor:"pointer",padding:"2px 8px",lineHeight:1}}>›</button>
        </div>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          <button onClick={goToday} style={{background:"none",border:"none",color:c.ac,fontSize:13,cursor:"pointer",fontWeight:500}}>Auj.</button>
          <div style={{display:"flex",background:c.s2,borderRadius:10,padding:2,gap:1}}>
            {[{k:"month",l:mob?"M":"Mois"},{k:"week",l:mob?"S":"Sem."},{k:"day",l:mob?"J":"Jour"}].map(v=>(
              <button key={v.k} onClick={()=>setView(v.k)} style={{padding:mob?"5px 7px":"5px 9px",border:"none",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:view===v.k?600:400,background:view===v.k?c.s:"transparent",color:view===v.k?c.tx:c.tx2,transition:"all 0.15s",boxShadow:view===v.k?(dk?"0 1px 3px rgba(0,0,0,.3)":"0 1px 3px rgba(0,0,0,.08)"):"none"}}>{v.l}</button>
            ))}
          </div>
        </div>
      </div>}

      {mainTab==="cal"&&view==="month"&&<MonthView/>}
      {mainTab==="cal"&&view==="week"&&<WeekView/>}
      {mainTab==="cal"&&view==="day"&&<DayView/>}
      {mainTab==="finances"&&<FinancesView c={c} mob={mob} depenses={depenses} fin={fin} allLeads={allLeads} newDep={newDep} setNewDep={setNewDep} addDepense={addDepense} deleteDepense={deleteDepense} savingDep={savingDep}/>}

      {/* CRM — toujours visible */}
      <div style={{padding:mob?"0 12px 28px":"0 28px 32px"}}>
        <div style={{background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:16,padding:mob?16:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <div style={{fontSize:mob?17:20,fontWeight:700,letterSpacing:"-0.04em"}}>Tous les prospects</div>
            <span style={{fontSize:12,color:c.tx3}}>{allLeads.length}</span>
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
              const prix=parseFloat(l.prix_custom||0)||TX[l.type_interet]||0;const acompte=parseFloat(l.acompte_recu||0);
              return(
                <div key={i} onClick={()=>setEdit(l)} style={{background:c.s2,borderRadius:12,padding:mob?10:12,border:`0.5px solid ${c.bd}`,display:"flex",alignItems:"center",gap:10,cursor:"pointer",transition:"transform 0.1s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.005)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                  <div style={{width:34,height:34,borderRadius:10,background:`${fm.c}10`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{fm.i}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontWeight:600,fontSize:13,letterSpacing:"-0.02em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.prenom?.replace(/^\w/,x=>x.toUpperCase())||l.instagram_username}{l.statut==="reserve"?" ✓":""}</span>
                      <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                        {prix>0&&<span style={{fontSize:10,fontWeight:600,color:acompte>=prix?c.gn:acompte>0?c.or:c.tx3}}>{acompte>=prix?"Soldé":acompte>0?`${acompte}/${prix}€`:`${prix}€`}</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:4,marginTop:3,fontSize:10,color:c.tx3,flexWrap:"wrap"}}>
                      <span>{fm.l}</span>
                      {l.date_souhaitee&&<span>· 📅 {l.date_souhaitee}</span>}
                      {l.occasion&&<span>· {l.occasion}</span>}
                      {l.source&&l.source!=="manuel"&&<span style={{background:c.s2,borderRadius:4,padding:"1px 5px",fontSize:9,color:c.tx3}}>{srcIcon(l.source)} {srcLabel(l.source)}</span>}
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
  const prix=parseFloat(l.prix_custom||0)||TX[l.type_interet]||0;const acompte=parseFloat(l.acompte_recu||0);
  return(
    <div onClick={e=>{e.stopPropagation();setEdit(l);}} style={{background:c.s2,borderRadius:10,padding:12,border:`0.5px solid ${c.bd}`,cursor:"pointer",borderLeft:`3px solid ${lcol}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontWeight:600,fontSize:13,letterSpacing:"-0.02em"}}>{fm.i} {l.prenom?.replace(/^\w/,x=>x.toUpperCase())||"?"}{l.statut==="reserve"?" ✓":""}</div>
        <span style={{fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:12,background:`${lcol}18`,color:lcol}}>{l.statut==="reserve"?"Réservé":l.temperature==="chaud"?"Chaud":l.temperature==="tiede"?"Tiède":"Froid"}</span>
      </div>
      <div style={{fontSize:11,color:c.tx2,marginTop:4}}>{fm.l}{l.occasion?` · ${l.occasion}`:""}</div>
      <div style={{display:"flex",gap:8,marginTop:6,fontSize:10,color:c.tx3,flexWrap:"wrap"}}>
        {l.telephone&&<span style={{color:c.gn}}>📱 {l.telephone}</span>}
        {prix>0&&<span style={{color:acompte>=prix?c.gn:acompte>0?c.or:c.tx2,fontWeight:600}}>{acompte>=prix?"Soldé":acompte>0?`${acompte}€//${prix}€`:`${prix}€`}</span>}
        {ago!==null&&<span style={{marginLeft:"auto"}}>{ago===0?"Auj.":ago===1?"Hier":`${ago}j`}</span>}
      </div>
    </div>
  );
}

function EditForm({lead,onSave,onDelete,onSolde,saving,c,inputStyle,labelStyle}){
  const prixBase=TX[lead.type_interet]||0;
  const[f,setF]=useState({
    prenom:lead.prenom||"",email:lead.email||"",telephone:lead.telephone||"",
    type_interet:lead.type_interet||"",date_souhaitee:lead.date_souhaitee||"",
    source:lead.source||"manuel",occasion:lead.occasion||"",nombre_personnes:lead.nombre_personnes||"",
    statut:lead.statut||"nouveau",temperature:lead.temperature||"froid",
    score:lead.score||0,notes:lead.notes||"",
    acompte_recu:lead.acompte_recu||"",
    montant_total_encaisse:lead.montant_total_encaisse||"",
    prix_custom:lead.prix_custom||"",
    heure_debut:lead.heure_debut||"",
    heure_fin:lead.heure_fin||""
  });
  const[moyenSolde,setMoyenSolde]=useState(lead.moyen_paiement_solde||null);
  const[soldePending,setSoldePending]=useState(false);
  const upd=(k,v)=>setF({...f,[k]:v});
  const prixStandard=TX[f.type_interet]||0;
  const prix=parseFloat(f.prix_custom||0)||prixStandard;
  const acompte=parseFloat(f.acompte_recu||0);
  const restant=prix>0?prix-acompte:0;
  const isSolde=lead.moyen_paiement_solde||acompte>=prix;

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
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><label style={labelStyle}>Heure début</label><input type="time" value={f.heure_debut} onChange={e=>upd("heure_debut",e.target.value)} style={inputStyle} placeholder="ex: 10:00"/></div>
        <div><label style={labelStyle}>Heure fin</label><input type="time" value={f.heure_fin} onChange={e=>upd("heure_fin",e.target.value)} style={inputStyle} placeholder="ex: 13:00"/></div>
      </div>
      <div>
        <label style={labelStyle}>Provenance</label>
        <select value={f.source} onChange={e=>upd("source",e.target.value)} style={{...inputStyle,cursor:"pointer"}}>
          {SOURCES.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
      </div>
      <div><label style={labelStyle}>Occasion</label><input value={f.occasion} onChange={e=>upd("occasion",e.target.value)} style={inputStyle}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><label style={labelStyle}>Statut</label><select value={f.statut} onChange={e=>upd("statut",e.target.value)} style={inputStyle}>{STATUTS.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
        <div><label style={labelStyle}>Température</label><select value={f.temperature} onChange={e=>upd("temperature",e.target.value)} style={inputStyle}>{TEMPS.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
      </div>

      {/* SECTION FINANCES */}
      {prixStandard>0&&<div style={{background:`${c.gn}08`,border:`0.5px solid ${c.gn}30`,borderRadius:10,padding:12}}>
        <div style={{fontSize:11,fontWeight:600,color:c.tx2,letterSpacing:"0.02em",textTransform:"uppercase",marginBottom:10}}>💰 Finances</div>
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          <div style={{flex:1,background:c.s2,borderRadius:8,padding:"8px 10px",minWidth:80,border:f.prix_custom&&parseFloat(f.prix_custom)!==prixStandard?`1px solid ${c.or}50`:"none"}}>
            <div style={{fontSize:9,color:c.tx3,marginBottom:2}}>
              Prix total {f.prix_custom&&parseFloat(f.prix_custom)!==prixStandard&&<span style={{color:c.or,fontSize:8,marginLeft:2}}>✎ offre spéciale</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:2}}>
              <input type="number"
                value={f.prix_custom!==undefined&&f.prix_custom!==""?f.prix_custom:prixStandard}
                onChange={e=>upd("prix_custom",e.target.value)}
                style={{width:"100%",background:"transparent",border:"none",fontSize:16,fontWeight:700,
                  color:f.prix_custom&&parseFloat(f.prix_custom)!==prixStandard?c.or:c.tx,
                  padding:0,outline:"none"}}
              />
              <span style={{fontSize:12,color:c.tx3,flexShrink:0}}>€</span>
            </div>
            {f.prix_custom&&parseFloat(f.prix_custom)!==prixStandard&&
              <button onClick={()=>upd("prix_custom","")} style={{fontSize:8,color:c.tx3,background:"none",border:"none",cursor:"pointer",padding:0,marginTop:2}}>
                ↩ Tarif standard ({prixStandard}€)
              </button>}
          </div>
          <div style={{flex:1,background:c.s2,borderRadius:8,padding:"8px 10px",minWidth:80}}>
            <div style={{fontSize:9,color:c.tx3,marginBottom:2}}>Reçu</div>
            <div style={{fontSize:16,fontWeight:700,color:acompte>=prix?c.gn:acompte>0?c.or:c.tx3}}>{acompte}€</div>
          </div>
          <div style={{flex:1,background:c.s2,borderRadius:8,padding:"8px 10px",minWidth:80}}>
            <div style={{fontSize:9,color:c.tx3,marginBottom:2}}>Restant</div>
            <div style={{fontSize:16,fontWeight:700,color:restant<=0?c.gn:c.or}}>{restant<=0?"✓":restant+"€"}</div>
          </div>
        </div>
        <div><label style={labelStyle}>Acompte / montant reçu (€)</label>
          <input type="number" min="0" value={f.acompte_recu} onChange={e=>upd("acompte_recu",e.target.value)} placeholder="0" style={inputStyle}/>
        </div>
        <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
          <button onClick={()=>upd("acompte_recu","50")} style={{background:c.s3,border:"none",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",color:c.tx}}>50€</button>
          <button onClick={()=>upd("acompte_recu","100")} style={{background:c.s3,border:"none",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",color:c.tx}}>100€</button>
          <button onClick={()=>upd("acompte_recu",String(Math.round(prix/2)))} style={{background:c.s3,border:"none",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",color:c.tx}}>50% ({Math.round(prix/2)}€)</button>
        </div>
        {/* BOUTON SOLDÉ avec choix du moyen */}
        {!isSolde&&prix>0&&<div style={{marginTop:12,background:`${c.gn}08`,border:`0.5px solid ${c.gn}30`,borderRadius:10,padding:12}}>
          <div style={{fontSize:10,fontWeight:600,color:c.gn,marginBottom:8}}>💳 Marquer comme soldé</div>
          <div style={{fontSize:11,color:c.tx2,marginBottom:10}}>Solde restant : <b style={{color:c.gn}}>{restant}€</b> — Choisir le mode de paiement :</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{if(confirm(`Confirmer paiement en ESPÈCES de ${restant}€ ?`)){onSolde(lead.id,"especes");}}}
              disabled={saving||restant<=0}
              style={{flex:1,background:`${c.or}15`,border:`1.5px solid ${c.or}`,borderRadius:10,padding:"10px 8px",fontSize:13,fontWeight:700,cursor:"pointer",color:c.or,opacity:saving?0.5:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              💵 Espèces
            </button>
            <button onClick={()=>{if(confirm(`Confirmer paiement CB SumUp de ${restant}€ ?`)){onSolde(lead.id,"cb");}}}
              disabled={saving||restant<=0}
              style={{flex:1,background:`${c.ac}15`,border:`1.5px solid ${c.ac}`,borderRadius:10,padding:"10px 8px",fontSize:13,fontWeight:700,cursor:"pointer",color:c.ac,opacity:saving?0.5:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              💳 CB SumUp
            </button>
          </div>
        </div>}
        {isSolde&&<div style={{marginTop:10,background:`${c.gn}12`,border:`0.5px solid ${c.gn}40`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>✅</span>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:c.gn}}>Soldé</div>
            <div style={{fontSize:10,color:c.tx3}}>{lead.moyen_paiement_solde==="especes"?"Réglé en espèces":lead.moyen_paiement_solde==="cb"?"Réglé par CB SumUp":"Paiement complet"}{lead.numero_facture?` · Facture ${lead.numero_facture}`:""}</div>
          </div>
        </div>}
      </div>}

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
  const[f,setF]=useState({prenom:"",email:"",telephone:"",type_interet:"",date_souhaitee:"",heure_debut:"",heure_fin:"",source:"manuel",occasion:"",nombre_personnes:"",statut:"nouveau",temperature:"tiede",score:50,notes:"",acompte_recu:""});
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
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><label style={labelStyle}>Heure début</label><input type="time" value={f.heure_debut} onChange={e=>upd("heure_debut",e.target.value)} style={inputStyle}/></div>
        <div><label style={labelStyle}>Heure fin</label><input type="time" value={f.heure_fin} onChange={e=>upd("heure_fin",e.target.value)} style={inputStyle}/></div>
      </div>
      <div>
        <label style={labelStyle}>Provenance</label>
        <select value={f.source} onChange={e=>upd("source",e.target.value)} style={{...inputStyle,cursor:"pointer"}}>
          {SOURCES.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
      </div>
      <div><label style={labelStyle}>Occasion</label><input value={f.occasion} onChange={e=>upd("occasion",e.target.value)} placeholder="anniversaire, EVJF..." style={inputStyle}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><label style={labelStyle}>Statut</label><select value={f.statut} onChange={e=>upd("statut",e.target.value)} style={inputStyle}>{STATUTS.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
        <div><label style={labelStyle}>Température</label><select value={f.temperature} onChange={e=>upd("temperature",e.target.value)} style={inputStyle}>{TEMPS.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
      </div>
      <div><label style={labelStyle}>Acompte reçu (€)</label><input type="number" value={f.acompte_recu} onChange={e=>upd("acompte_recu",e.target.value)} placeholder="0" style={inputStyle}/></div>
      <div><label style={labelStyle}>Notes</label><textarea value={f.notes} onChange={e=>upd("notes",e.target.value)} rows={2} placeholder="Infos utiles..." style={{...inputStyle,resize:"vertical",fontFamily:"inherit"}}/></div>
      <button onClick={()=>{if(!f.prenom){alert("Prénom obligatoire");return;}onSave(f);}} disabled={saving} style={{background:c.ac,color:"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:15,fontWeight:600,cursor:"pointer",opacity:saving?0.5:1,marginTop:8}}>{saving?"Création…":"Créer le prospect"}</button>
    </div>
  );
}
function FinancesView({c,mob,depenses,fin,allLeads,newDep,setNewDep,addDepense,deleteDepense,savingDep}){
  const CATS=[
    {v:"carburant",l:"Carburant",col:"#FF9F0A"},
    {v:"maintenance",l:"Maintenance",col:"#007AFF"},
    {v:"assurance",l:"Assurance",col:"#5856D6"},
    {v:"marina",l:"Port/Marina",col:"#34C759"},
    {v:"marketing",l:"Marketing",col:"#FF2D55"},
    {v:"materiel",l:"Materiel",col:"#64D2FF"},
    {v:"salaires",l:"Prestataires",col:"#BF5AF2"},
    {v:"autre",l:"Autre",col:"#8A8A9A"},
  ];
  const catCol=v=>(CATS.find(x=>x.v===v)||CATS[7]).col;
  const catLbl=v=>(CATS.find(x=>x.v===v)||CATS[7]).l;
  const totalDep=depenses.reduce((s,d)=>s+parseFloat(d.montant||0),0);
  const profit=fin.rev-totalDep;
  const byMonth=depenses.reduce((acc,d)=>{const m=(d.date||"").substring(0,7);if(!acc[m])acc[m]=[];acc[m].push(d);return acc;},{});

  // Dépenses par catégorie pour le mini graphique
  const byCat=CATS.map(cat=>{
    const tot=depenses.filter(d=>d.categorie===cat.v).reduce((s,d)=>s+parseFloat(d.montant||0),0);
    return{...cat,tot};
  }).filter(x=>x.tot>0).sort((a,b)=>b.tot-a.tot);
  const maxCat=byCat[0]?.tot||1;

  const inputS={width:"100%",padding:"10px 12px",borderRadius:10,border:`0.5px solid ${c.bd}`,background:c.s2,color:c.tx,fontSize:14,marginTop:4};

  return(
    <div style={{padding:mob?"0 12px 32px":"0 28px 40px"}}>

      {/* KPIs CA — en haut */}
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[
          {l:"CA Global",v:(finCalc.caGlobal||0).toFixed(0)+"€",sub:"Total encaissé",cl:"#10B981",icon:"💰"},
          {l:"CA " + new Date().toLocaleDateString("fr-FR",{month:"long"}),v:(finCalc.caMoisEnCours||0).toFixed(0)+"€",sub:"Ce mois-ci",cl:"#007AFF",icon:"📅"},
          {l:"Résultat net",v:(()=>{const td=depenses.reduce((s,d)=>s+parseFloat(d.montant||0),0);const r=(finCalc.caGlobal||0)-td;return(r>=0?"+":"")+r.toFixed(0)+"€";})(),sub:(()=>{const td=depenses.reduce((s,d)=>s+parseFloat(d.montant||0),0);return (finCalc.caGlobal||0)-td>=0?"Bénéfice":"Déficit";})(),cl:(()=>{const td=depenses.reduce((s,d)=>s+parseFloat(d.montant||0),0);return (finCalc.caGlobal||0)-td>=0?"#10B981":"#EF4444";})(),icon:"📊"},
          {l:"Pipeline",v:(finCalc.potentiel||0).toFixed(0)+"€",sub:(finCalc.nReserves||0)+" résas confirmées",cl:"#F59E0B",icon:"🔥"},
        ].map((k,i)=>(
          <div key={i} style={{background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:14,padding:"14px 16px"}}>
            <div style={{fontSize:10,color:c.tx3,fontWeight:500,marginBottom:4}}>{k.icon} {k.l}</div>
            <div style={{fontSize:mob?20:26,fontWeight:700,letterSpacing:"-0.04em",color:k.cl}}>{k.v}</div>
            <div style={{fontSize:10,color:c.tx3,marginTop:2}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* FORMULAIRE RAPIDE — au top, ultra compact */}
      <div style={{background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:16,padding:mob?"14px":"16px 20px",marginBottom:16}}>
        <div style={{display:"flex",gap:8,alignItems:"flex-end",flexWrap:mob?"wrap":"nowrap"}}>
          <div style={{flex:3,minWidth:mob?"100%":0}}>
            <input value={newDep.description} onChange={e=>setNewDep({...newDep,description:e.target.value})
            } placeholder="Description de la dépense..." style={{...inputS,marginTop:0}}/>
          </div>
          <div style={{flex:1,minWidth:80}}>
            <input type="number" min="0" step="0.01" value={newDep.montant} onChange={e=>setNewDep({...newDep,montant:e.target.value})} placeholder="0 €" style={{...inputS,marginTop:0}}/>
          </div>
          <div style={{flex:1,minWidth:120}}>
            <input type="date" value={newDep.date} onChange={e=>setNewDep({...newDep,date:e.target.value})} style={{...inputS,marginTop:0}}/>
          </div>
          <button onClick={addDepense} disabled={savingDep||!newDep.montant}
            style={{background:c.ac,color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer",opacity:savingDep||!newDep.montant?0.5:1,whiteSpace:"nowrap",flexShrink:0}}>
            {savingDep?"...":"+ Ajouter"}
          </button>
        </div>
        {/* Catégories */}
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:10}}>
          {CATS.map(cat=>(
            <button key={cat.v} onClick={()=>setNewDep({...newDep,categorie:cat.v})}
              style={{padding:"4px 10px",borderRadius:16,border:`1px solid ${newDep.categorie===cat.v?cat.col:c.bd}`,background:newDep.categorie===cat.v?cat.col+"20":"transparent",color:newDep.categorie===cat.v?cat.col:c.tx3,fontSize:10,fontWeight:newDep.categorie===cat.v?600:400,cursor:"pointer"}}>
              {cat.l}
            </button>
          ))}
        </div>
      </div>

      {/* GRAPHIQUE BARRES PAR CATÉGORIE */}
      {byCat.length>0&&<div style={{background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:16,padding:mob?14:20,marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:600,color:c.tx2,marginBottom:12}}>Dépenses par catégorie</div>
        {byCat.map((cat,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{fontSize:11,color:c.tx2,width:mob?70:90,flexShrink:0}}>{cat.l}</div>
            <div style={{flex:1,height:8,background:c.s2,borderRadius:4,overflow:"hidden"}}>
              <div style={{width:`${(cat.tot/totalDep)*100}%`,height:"100%",background:cat.col,borderRadius:4,transition:"width 0.4s ease"}}/>
            </div>
            <div style={{fontSize:11,fontWeight:600,color:cat.col,width:60,textAlign:"right",flexShrink:0}}>{cat.tot.toFixed(0)}€</div>
          </div>
        ))}
      </div>}

      {/* LISTE PAR MOIS */}
      <div style={{background:c.s,border:`0.5px solid ${c.bd}`,borderRadius:16,padding:mob?16:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:700}}>Historique</div>
          <div style={{fontSize:12,color:c.tx3}}>{depenses.length} entrées · {totalDep.toFixed(0)}€</div>
        </div>
        {depenses.length===0&&<div style={{textAlign:"center",padding:"32px",color:c.tx3,fontSize:13}}>Aucune dépense — utilisez le formulaire ci-dessus</div>}
        {Object.keys(byMonth).sort().reverse().map(mois=>{
          const items=byMonth[mois];
          const tot=items.reduce((s,d)=>s+parseFloat(d.montant||0),0);
          const[yr2,mo2]=mois.split("-");
          const lbl=new Date(parseInt(yr2),parseInt(mo2)-1,1).toLocaleDateString("fr-FR",{month:"long",year:"numeric"});
          return(
            <div key={mois} style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,paddingBottom:6,borderBottom:`0.5px solid ${c.bd}`}}>
                <div style={{fontSize:11,fontWeight:600,color:c.tx2,textTransform:"capitalize"}}>{lbl}</div>
                <div style={{fontSize:11,fontWeight:700,color:c.red}}>{tot.toFixed(2)}€</div>
              </div>
              {items.map((dep,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:i<items.length-1?`0.5px solid ${c.bd}20`:"none"}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:catCol(dep.categorie),flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dep.description||catLbl(dep.categorie)}</div>
                    <div style={{fontSize:10,color:c.tx3}}>{catLbl(dep.categorie)} · {new Date(dep.date).toLocaleDateString("fr-FR")}</div>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:c.red,flexShrink:0}}>{parseFloat(dep.montant).toFixed(2)}€</div>
                  <button onClick={()=>deleteDepense(dep.id)} style={{background:"transparent",border:"none",color:c.tx3,fontSize:16,cursor:"pointer",padding:"0 2px",flexShrink:0,lineHeight:1}}>×</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
