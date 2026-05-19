import { useState, useMemo, useEffect, useRef } from "react";
import { Clock, MapPin, MessageCircle, Plus, Pencil, Trash2, X, Send, ChevronDown, ChevronUp, Sun, Moon, ArrowRightLeft, Image } from "lucide-react";
import { db } from "./firebase";
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  onSnapshot, writeBatch, serverTimestamp, query, orderBy, where,
} from "firebase/firestore";

const T={
  light:{canvas:"#FFFFFF",card:"#FFFFFF",hdr:"#222222",ink:"#222222",sec:"#717171",hint:"#9CA3AF",bdr:"#DDDDDD",bdrLt:"#EBEBEB",surf:"#F7F7F7",accent:"#FF385C",accentH:"#E00B41",sh:"rgba(0,0,0,0.02) 0px 0px 0px 1px,rgba(0,0,0,0.04) 0px 2px 6px,rgba(0,0,0,0.10) 0px 4px 8px",shH:"rgba(0,0,0,0.08) 0px 4px 12px",tabOn:{bg:"#222222",fg:"#FFFFFF"},tabOff:{bg:"#F7F7F7",fg:"#717171"},pillOn:{bg:"#222222",fg:"#FFFFFF",bd:"#222222"},pillOff:{bg:"#FFFFFF",fg:"#222222",bd:"#DDDDDD"},dayOn:{bg:"#222222",fg:"#FFFFFF"},dayOff:{bg:"#F2F2F2",fg:"#717171"},profBd:"#DDDDDD",profActBd:"currentColor",inputBg:"#FFFFFF",inputFocus:"#222222",addBdr:"#DDDDDD",addHov:"#222222"},
  dark:{canvas:"#1A1A1A",card:"#222222",hdr:"#111111",ink:"#F7F7F7",sec:"#888888",hint:"#666666",bdr:"#2E2E2E",bdrLt:"#2E2E2E",surf:"#1A1A1A",accent:"#FF385C",accentH:"#E00B41",sh:"rgba(0,0,0,0.4) 0px 0px 0px 1px",shH:"rgba(0,0,0,0.6) 0px 2px 8px",tabOn:{bg:"#F7F7F7",fg:"#1A1A1A"},tabOff:{bg:"#262626",fg:"#666666"},pillOn:{bg:"#F7F7F7",fg:"#1A1A1A",bd:"#F7F7F7"},pillOff:{bg:"transparent",fg:"#A0A0A0",bd:"#333333"},dayOn:{bg:"#F7F7F7",fg:"#1A1A1A"},dayOff:{bg:"#262626",fg:"#666666"},profBd:"#333333",profActBd:"#FF385C",inputBg:"#262626",inputFocus:"#F7F7F7",addBdr:"#333333",addHov:"#F7F7F7"}
};
const UC={
  light:[{id:"prashanth",name:"Prashanth",init:"P",role:"Dad",bg:"#EDE9FE",fg:"#5B21B6"},{id:"kavi",name:"Kavi",init:"K",role:"Mom",bg:"#FCE7F3",fg:"#9D174D"},{id:"nishu",name:"Nishu",init:"N",role:"Me",bg:"#D1FAE5",fg:"#065F46"}],
  dark:[{id:"prashanth",name:"Prashanth",init:"P",role:"Dad",bg:"#2D2654",fg:"#AFA9EC"},{id:"kavi",name:"Kavi",init:"K",role:"Mom",bg:"#3D1A2E",fg:"#ED93B1"},{id:"nishu",name:"Nishu",init:"N",role:"Me",bg:"#0A3324",fg:"#5DCAA5"}]
};
const CATS=["Restaurants","Bars","Activities","Food Walks","Markets","Coffee"];
const CL={
  light:{Restaurants:{bg:"#FEF3C7",fg:"#92400E",bd:"#F59E0B",icon:"🍽️"},Bars:{bg:"#EDE9FE",fg:"#5B21B6",bd:"#8B5CF6",icon:"🍺"},Activities:{bg:"#DBEAFE",fg:"#1E40AF",bd:"#3B82F6",icon:"🎯"},"Food Walks":{bg:"#FCE7F3",fg:"#9D174D",bd:"#EC4899",icon:"🚶"},Markets:{bg:"#D1FAE5",fg:"#065F46",bd:"#10B981",icon:"🛍️"},Coffee:{bg:"#FFF7ED",fg:"#9A3412",bd:"#FB923C",icon:"☕"}},
  dark:{Restaurants:{bg:"#3A2810",fg:"#FBBF24",bd:"#B45309",icon:"🍽️"},Bars:{bg:"#2D2654",fg:"#AFA9EC",bd:"#7F77DD",icon:"🍺"},Activities:{bg:"#112240",fg:"#85B7EB",bd:"#378ADD",icon:"🎯"},"Food Walks":{bg:"#3D1A2E",fg:"#ED93B1",bd:"#D4537E",icon:"🚶"},Markets:{bg:"#0A3324",fg:"#5DCAA5",bd:"#1D9E75",icon:"🛍️"},Coffee:{bg:"#3A2810",fg:"#FB923C",bd:"#D85A30",icon:"☕"}}
};
const START=new Date(2026,5,2);
const fmtD=i=>{const d=new Date(START);d.setDate(d.getDate()+i);return d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});};
const WEEKS=[{label:"Week 1",sub:"Jun 2 – 8",s:0,e:6},{label:"Week 2",sub:"Jun 9 – 15",s:7,e:13},{label:"Week 3",sub:"Jun 16 – 22",s:14,e:20},{label:"Week 4",sub:"Jun 23 – 29",s:21,e:27},{label:"Week 5",sub:"Jun 30 – Jul 5",s:28,e:33}];

const INIT=[
  {id:"1",day:0,name:"Intelligentsia Coffee",cat:"Coffee",desc:"Ease into Chicago with the city's pioneering third-wave roaster. Try the Black Cat espresso.",loc:"53 E Randolph St",time:"09:00",img:"https://images.unsplash.com/photo-1595928642581-f50f4f3453a5?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"2",day:2,name:"Millennium Park & Cloud Gate",cat:"Activities",desc:"A relaxed walk to see the iconic Bean, Lurie Garden, and Crown Fountain. Free admission.",loc:"201 E Randolph St",time:"14:00",img:"https://images.unsplash.com/photo-1599769422132-d52e5214277d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"3",day:5,name:"Nadu",cat:"Restaurants",desc:"South Indian cuisine — dosas, uttapam, and thalis. Excellent vegetarian selection. ~$100 for three.",loc:"2423 N Clark St, Lincoln Park",time:"19:00",img:"https://images.unsplash.com/photo-1668236543090-82eba5ee5976?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"4",day:7,name:"Metric Coffee",cat:"Coffee",desc:"Minimalist roastery in Fulton Market. Single-origin pourovers in an industrial-chic space.",loc:"2021 W Fulton St",time:"10:00",img:"https://images.unsplash.com/photo-1770579673873-8da37e35d54e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"5",day:8,name:"Planta",cat:"Restaurants",desc:"Upscale plant-based dining. Creative sushi, truffle pizza, and craft cocktails. ~$130 for three.",loc:"18 E Bellevue Pl, Gold Coast",time:"19:30",img:"https://images.unsplash.com/photo-1622115837997-90c89ae689f9?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"6",day:10,name:"Chicago French Market",cat:"Markets",desc:"Indoor European-style market with artisan vendors, fresh produce, and prepared foods.",loc:"131 N Clinton St",time:"11:00",img:"https://images.unsplash.com/photo-1776007699209-5d68bbdfdfcb?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"7",day:12,name:"Revolution Brewing",cat:"Bars",desc:"Chicago's largest independent brewery. Great craft beers on tap — try the Anti-Hero IPA.",loc:"2323 N Milwaukee Ave",time:"17:00",img:"https://images.unsplash.com/photo-1646241651636-49549005a1a3?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"8",day:14,name:"Sawada Coffee",cat:"Coffee",desc:"Military Latte is legendary — matcha meets espresso. Cool West Loop vibes.",loc:"112 N Green St",time:"09:30",img:"https://images.unsplash.com/photo-1561658286-ecb9fe9d8480?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"9",day:15,name:"Art Institute of Chicago",cat:"Activities",desc:"World-class museum — Monet, Seurat, Hopper, and the Thorne Miniature Rooms. Plan 3+ hours.",loc:"111 S Michigan Ave",time:"10:00",img:"https://images.unsplash.com/photo-1554907984-15263bfd63bd?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"10",day:16,name:"Pilsen Food Crawl",cat:"Food Walks",desc:"Vibrant Pilsen — taquerias, bakeries, and amazing street art murals along 18th Street.",loc:"18th St & Blue Island Ave",time:"12:00",img:"https://images.unsplash.com/photo-1638689253215-0e730f5b9e1e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"11",day:17,name:"Strings Ramen",cat:"Restaurants",desc:"Rich tonkotsu and veggie ramen with great sides. Solid vegetarian broth. ~$80 for three.",loc:"2141 N Western Ave",time:"18:30",img:"https://images.unsplash.com/photo-1591814468924-caf88d1232e1?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"12",day:19,name:"Half Acre Beer Company",cat:"Bars",desc:"Beloved neighborhood brewery. Daisy Cutter pale ale is the flagship. Great taproom vibes.",loc:"4257 N Lincoln Ave",time:"16:00",img:"https://images.unsplash.com/photo-1612528443702-f6741f70a049?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"13",day:21,name:"Gaslight Coffee Roasters",cat:"Coffee",desc:"Cozy Logan Square café with house-roasted beans and excellent pastries.",loc:"2385 N Milwaukee Ave",time:"09:00",img:"https://images.unsplash.com/photo-1621343607959-5d11ff0f1e39?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"14",day:22,name:"Architecture Boat Tour",cat:"Activities",desc:"Cruise the Chicago River learning about iconic skyscrapers. A must-do experience.",loc:"112 E Wacker Dr",time:"11:00",img:"https://images.unsplash.com/photo-1548260616-b71c60ccea3a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"15",day:23,name:"Devon Ave Food Crawl",cat:"Food Walks",desc:"Chicago's Little India — chaat counters, sweet shops, and full-service vegetarian restaurants.",loc:"Devon Ave & Washtenaw",time:"12:00",img:"https://images.unsplash.com/photo-1614435842039-e842b002c342?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"16",day:24,name:"Indienne",cat:"Restaurants",desc:"Fine-dining Indian with a modern twist. Tasting menus and à la carte. Splurge night — ~$200+ for three.",loc:"217 W Huron St, River North",time:"19:00",img:"https://images.unsplash.com/photo-1565556250026-9ba22083e3e0?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"17",day:25,name:"Wicker Park Shops",cat:"Markets",desc:"Browse indie boutiques, vintage stores, and record shops along Milwaukee and Division.",loc:"Milwaukee Ave & North Ave",time:"13:00",img:"https://images.unsplash.com/photo-1759803495048-9ce5f228d2b9?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"18",day:26,name:"Lincoln Park Zoo",cat:"Activities",desc:"Free zoo in the heart of Lincoln Park. Lions, gorillas, penguins, and a nature boardwalk.",loc:"2001 N Clark St",time:"10:00",img:"https://images.unsplash.com/photo-1562533603-08d7d0355dba?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"19",day:27,name:"Mott St",cat:"Restaurants",desc:"Asian-inspired shareable plates. Great vegetarian options — coconut rice and mushroom dishes. ~$110 for three.",loc:"1401 N Ashland Ave",time:"19:00",img:"https://images.unsplash.com/photo-1624223875266-81ebbb795584?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"20",day:28,name:"Forbidden Root",cat:"Bars",desc:"Botanical brewery — beers brewed with roots, herbs, and flowers. Unique and delicious.",loc:"1746 W Chicago Ave",time:"17:00",img:"https://images.unsplash.com/photo-1609345265499-2133bbeb6ce5?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"21",day:29,name:"Garfield Park Conservatory",cat:"Activities",desc:"One of the largest conservatories in the US — lush tropical rooms and desert landscapes. Free.",loc:"300 N Central Park Ave",time:"11:00",img:"https://images.unsplash.com/photo-1506277450472-30e3f3f55129?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"22",day:30,name:"Chinatown Food Crawl",cat:"Food Walks",desc:"Dim sum, bubble tea, and bakeries in Chicago's lively Chinatown district.",loc:"Wentworth Ave & Cermak Rd",time:"12:00",img:"https://images.unsplash.com/photo-1563245372-f21724e3856d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"23",day:31,name:"Randolph Street Market",cat:"Markets",desc:"Indoor/outdoor market with vintage finds, antiques, and gourmet food stalls.",loc:"1340 W Washington Blvd",time:"10:00",img:"https://images.unsplash.com/photo-1597668900045-b9283c0de174?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"24",day:32,name:"Handlebar",cat:"Restaurants",desc:"Bike-themed bar & grill with an extensive vegetarian and vegan menu. Casual. ~$70 for three.",loc:"2311 W North Ave",time:"12:30",img:"https://images.unsplash.com/photo-1661257711676-79a0fc533569?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"25",day:32,name:"Chicago Riverwalk",cat:"Activities",desc:"Stroll, dine, and kayak along the scenic downtown river path. Beautiful at sunset.",loc:"Chicago Riverwalk, Wacker Dr",time:"17:00",img:"https://images.unsplash.com/photo-1521901581118-62fa7443883d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
  {id:"26",day:33,name:"Museum of Science & Industry",cat:"Activities",desc:"Real U-505 submarine, coal mine tour, and hands-on science exhibits. Epic finale day.",loc:"5700 S DuSable Lake Shore Dr",time:"10:00",img:"https://images.unsplash.com/photo-1769664748202-7d2674cb4395?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200&h=400"},
];

const UNSPLASH_KEY=import.meta.env.VITE_UNSPLASH_ACCESS_KEY||"";
async function fetchUnsplashPhoto(query){
  if(!UNSPLASH_KEY) return "";
  try{
    const res=await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {headers:{Authorization:`Client-ID ${UNSPLASH_KEY}`}}
    );
    const data=await res.json();
    const raw=data.results?.[0]?.urls?.raw;
    return raw?`${raw}?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1200&h=400`:"";
  }catch{return "";}
}
const NC={"1":"Hot chocolate for me though!","2":"Can we get ice cream near the Bean??","3":"DOSAS! Extra chutney please!","4":"Another coffee stop?? I'm getting a pastry","5":"Plant-based sushi sounds wild but I'm in","6":"Ooh can we get macarons here?","7":"Dad's spot. Root beer for me!","8":"Matcha AND espresso?? Genius","9":"I wanna see the tiny rooms!","10":"Street art photos are going to be amazing","11":"Ramen day is best day","12":"Cheese fries while y'all have beer?","13":"Pastry + hot cocoa combo incoming","14":"I call window seat on the boat!","15":"Devon Ave sweets are THE BEST. Jalebi!","16":"Fancy dinner!! Can I dress up?","17":"Can we check out vintage toy stores??","18":"FREE ZOO! Penguins first!","19":"Coconut rice sounds sooo good","20":"Flower beer sounds weird ngl","21":"The tropical room is like a jungle!","22":"Bubble tea AND dim sum?? Best day ever","23":"I hope they have vintage comics","24":"A bike restaurant?! So cool","25":"Can we do the kayaking?? PLEASE","26":"THE SUBMARINE. I need to see it."};

async function seedFirestore() {
  const batch = writeBatch(db);
  INIT.forEach(({ id, ...fields }) => {
    batch.set(doc(db, "items", id), fields);
  });
  Object.entries(NC).forEach(([itemId, text]) => {
    const ref = doc(db, "comments", `seed-${itemId}`);
    batch.set(ref, { itemId, user: "nishu", text, ts: "earlier", createdAt: serverTimestamp() });
  });
  await batch.commit();
}

function Av({u,sz=32}){
  return <div style={{width:sz,height:sz,borderRadius:"50%",background:u.bg,color:u.fg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(sz*.38),fontWeight:600,flexShrink:0}}>{u.init}</div>;
}
function CatIcon({cc,sz=40}){
  return <div style={{width:sz,height:sz,borderRadius:12,background:cc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(sz*.45),flexShrink:0}}>{cc.icon}</div>;
}

function ItemForm({init,onSave,onCancel,t}){
  const [f,setF]=useState(init||{name:"",cat:"Activities",desc:"",loc:"",time:"",img:""});
  const up=(k,v)=>setF(p=>({...p,[k]:v}));
  const ok=f.name.trim()&&f.desc.trim();
  const is={width:"100%",padding:"10px 14px",borderRadius:8,border:`1px solid ${t.bdr}`,fontSize:14,color:t.ink,outline:"none",boxSizing:"border-box",fontFamily:"inherit",background:t.inputBg};
  return (
    <div style={{background:t.surf,borderRadius:20,padding:24}}>
      <div style={{display:"flex",gap:12,marginBottom:16}}>
        <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:t.sec,marginBottom:6}}>Name</div><input value={f.name} onChange={e=>up("name",e.target.value)} placeholder="e.g. Deep Dish Pizza Tour" style={is}/></div>
        <div style={{width:130}}><div style={{fontSize:12,fontWeight:600,color:t.sec,marginBottom:6}}>Time</div><input type="time" value={f.time} onChange={e=>up("time",e.target.value)} style={is}/></div>
      </div>
      <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:t.sec,marginBottom:6}}>Category</div><select value={f.cat} onChange={e=>up("cat",e.target.value)} style={{...is,background:t.inputBg}}>{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
      <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:t.sec,marginBottom:6}}>Description</div><textarea value={f.desc} onChange={e=>up("desc",e.target.value)} rows={2} placeholder="Brief description..." style={{...is,resize:"vertical"}}/></div>
      <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:t.sec,marginBottom:6}}>Location</div><input value={f.loc} onChange={e=>up("loc",e.target.value)} placeholder="Address or area" style={is}/></div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:12,fontWeight:600,color:t.sec,marginBottom:6,display:"flex",alignItems:"center",gap:4}}><Image size={12}/> Photo URL <span style={{fontWeight:400,color:t.hint}}>(optional)</span></div>
        <input value={f.img||""} onChange={e=>up("img",e.target.value)} placeholder="https://images.unsplash.com/..." style={is}/>
        {f.img && <img src={f.img} alt="" style={{width:"100%",height:100,objectFit:"cover",borderRadius:8,marginTop:8}} onError={e=>{e.target.style.display="none";}}/>}
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={onCancel} style={{padding:"10px 20px",borderRadius:8,border:`1px solid ${t.ink}`,background:"transparent",fontSize:14,fontWeight:600,cursor:"pointer",color:t.ink,fontFamily:"inherit"}}>Cancel</button>
        <button onClick={()=>ok&&onSave(f)} disabled={!ok} style={{padding:"10px 20px",borderRadius:8,border:"none",background:ok?t.accent:"#555",color:"white",fontSize:14,fontWeight:600,cursor:ok?"pointer":"default",fontFamily:"inherit"}}>Save</button>
      </div>
    </div>
  );
}

function MoveMenu({itemDay,items,t,dark,onMove}){
  return (
    <div style={{position:"absolute",top:36,right:0,zIndex:10,background:t.card,border:`1px solid ${t.bdr}`,borderRadius:12,boxShadow:dark?"0 8px 28px rgba(0,0,0,0.5)":"0 8px 28px rgba(0,0,0,0.15)",padding:8,width:220,maxHeight:260,overflowY:"auto"}}>
      <div style={{fontSize:11,fontWeight:600,color:t.hint,padding:"4px 8px 8px",letterSpacing:"0.04em",textTransform:"uppercase"}}>Move to</div>
      {Array.from({length:34},(_,i)=>i).filter(d=>d!==itemDay).map(d=>{
        const cnt=items.filter(x=>x.day===d).length;
        return (
          <button key={d} onClick={()=>onMove(d)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"8px 10px",borderRadius:8,border:"none",background:"transparent",cursor:"pointer",fontFamily:"inherit",fontSize:13,color:t.ink,textAlign:"left"}}>
            <span style={{fontWeight:500}}>Day {d+1} · {fmtD(d)}</span>
            {cnt>0 && <span style={{fontSize:11,color:t.hint}}>{cnt}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default function App(){
  const [dark,setDark]=useState(false);
  const [au,setAu]=useState("nishu");
  const [aw,setAw]=useState(0);
  const [fil,setFil]=useState([]);
  const [items,setItems]=useState([]);
  const [cmts,setCmts]=useState({});
  const [loading,setLoading]=useState(true);
  const [drafts,setDrafts]=useState({});
  const [openN,setOpenN]=useState({});
  const [adding,setAdding]=useState(null);
  const [editing,setEditing]=useState(null);
  const [ecId,setEcId]=useState(null);
  const [ecTxt,setEcTxt]=useState("");
  const [hov,setHov]=useState(null);
  const [movingId,setMovingId]=useState(null);
  const seeding=useRef(false);

  useEffect(()=>{
    document.body.style.background=dark?"#1A1A1A":"#FFFFFF";
  },[dark]);

  useEffect(()=>{
    const unsubItems=onSnapshot(collection(db,"items"),async snap=>{
      if(snap.empty&&!seeding.current){
        seeding.current=true;
        setTimeout(async()=>{
          const check=await getDocs(collection(db,"items"));
          if(check.empty) await seedFirestore();
          else seeding.current=false;
        },1000);
        return;
      }
      const its=snap.docs.map(d=>({id:d.id,...d.data()}));
      setItems(its);
      setLoading(false);
    });

    const unsubCmts=onSnapshot(
      query(collection(db,"comments"),orderBy("createdAt")),
      snap=>{
        const grouped={};
        snap.docs.forEach(d=>{
          const {itemId,user,text,ts}=d.data();
          if(!grouped[itemId]) grouped[itemId]=[];
          grouped[itemId].push({id:d.id,user,text,ts});
        });
        setCmts(grouped);
      }
    );

    return()=>{unsubItems();unsubCmts();};
  },[]);

  const mode=dark?"dark":"light";
  const t=T[mode],users=UC[mode],cc=CL[mode];
  const UM=Object.fromEntries(users.map(u=>[u.id,u]));
  const cur=UM[au],wk=WEEKS[aw];

  const toggleFil=c=>setFil(f=>f.includes(c)?f.filter(x=>x!==c):[...f,c]);

  const addItem=async(day,form)=>{
    const img=form.img||(await fetchUnsplashPhoto(form.name));
    await addDoc(collection(db,"items"),{day,...form,img});
    setAdding(null);
  };
  const updateItem=async(id,form)=>{
    await updateDoc(doc(db,"items",id),form);
    setEditing(null);
  };
  const deleteItem=async id=>{
    await deleteDoc(doc(db,"items",id));
    const snap=await getDocs(query(collection(db,"comments"),where("itemId","==",id)));
    if(!snap.empty){
      const batch=writeBatch(db);
      snap.docs.forEach(d=>batch.delete(d.ref));
      await batch.commit();
    }
  };
  const moveItem=async(id,nd)=>{
    await updateDoc(doc(db,"items",id),{day:nd});
    setMovingId(null);
  };
  const addCmt=async iid=>{
    const tx=(drafts[iid]||"").trim();
    if(!tx) return;
    await addDoc(collection(db,"comments"),{itemId:iid,user:au,text:tx,ts:"just now",createdAt:serverTimestamp()});
    setDrafts(d=>({...d,[iid]:""}));
  };
  const delCmt=async(cid)=>{ await deleteDoc(doc(db,"comments",cid)); };
  const saveCmt=async(cid)=>{
    if(!ecTxt.trim()) return;
    await updateDoc(doc(db,"comments",cid),{text:ecTxt.trim(),ts:"edited"});
    setEcId(null);
  };

  const days=useMemo(()=>{
    const r=[];
    for(let d=wk.s;d<=wk.e;d++){
      let its=items.filter(it=>it.day===d);
      if(fil.length) its=its.filter(it=>fil.includes(it.cat));
      its.sort((a,b)=>(a.time||"99:99").localeCompare(b.time||"99:99"));
      r.push({di:d,date:fmtD(d),items:its});
    }
    return r;
  },[aw,fil,items]);

  const renderCard=(it)=>{
    const c=cc[it.cat];
    const notes=cmts[it.id]||[];
    const isOpen=openN[it.id];
    const isH=hov===it.id;

    if(editing===it.id){
      return (
        <div key={it.id} style={{marginLeft:48,marginBottom:16}}>
          <ItemForm t={t} init={{name:it.name,cat:it.cat,desc:it.desc,loc:it.loc||"",time:it.time||"",img:it.img||""}} onSave={f=>updateItem(it.id,f)} onCancel={()=>setEditing(null)}/>
        </div>
      );
    }

    return (
      <div key={it.id} style={{marginLeft:48,marginBottom:16}}>
        <div onMouseEnter={()=>setHov(it.id)} onMouseLeave={()=>setHov(null)} style={{background:t.card,borderRadius:20,boxShadow:isH?t.shH:t.sh,borderLeft:`4px solid ${c.bd}`,overflow:"hidden",transition:"box-shadow 0.2s"}}>
          {it.img && (
            <div style={{width:"100%",height:200,background:`linear-gradient(135deg, ${c.bg}, ${c.bd}40, ${c.bg})`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
              <span style={{fontSize:48,opacity:0.9,filter:"grayscale(20%)",zIndex:1}}>{c.icon}</span>
              {it.img!=="gradient" && (
                <img src={it.img} alt={it.name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:2}} onError={e=>{e.target.style.display="none";}}/>
              )}
              <div style={{position:"absolute",bottom:0,left:0,right:0,height:40,background:`linear-gradient(transparent, ${t.card})`,zIndex:3}}/>
            </div>
          )}
          <div style={{padding:"16px 20px 14px"}}>
            {it.time && <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:10,fontSize:12,fontWeight:700,color:t.sec}}><Clock size={12} strokeWidth={2.5}/> {it.time}</div>}
            <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
              <CatIcon cc={c} sz={40}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.32em",color:c.fg,marginBottom:4}}>{it.cat}</div>
                <div style={{fontSize:16,fontWeight:600,color:t.ink,letterSpacing:"-0.18px",marginBottom:4,lineHeight:1.25}}>{it.name}</div>
                <div style={{fontSize:14,color:t.sec,lineHeight:1.43}}>{it.desc}</div>
                {it.loc && <div style={{display:"flex",alignItems:"center",gap:5,marginTop:8,fontSize:12,color:t.hint}}><MapPin size={12}/> {it.loc}</div>}
              </div>
              <div style={{display:"flex",gap:4,flexShrink:0,opacity:isH?1:0.3,transition:"opacity 0.15s",position:"relative"}}>
                <button onClick={()=>setMovingId(movingId===it.id?null:it.id)} style={{width:32,height:32,borderRadius:8,border:`1px solid ${movingId===it.id?t.accent:t.bdr}`,background:movingId===it.id?(dark?"rgba(255,56,92,0.12)":"#FFF0F3"):"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:movingId===it.id?t.accent:t.sec}} title="Move">
                  <ArrowRightLeft size={14}/>
                </button>
                <button onClick={()=>{setEditing(it.id);setAdding(null);setMovingId(null);}} style={{width:32,height:32,borderRadius:8,border:`1px solid ${t.bdr}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:t.sec}} title="Edit">
                  <Pencil size={14}/>
                </button>
                <button onClick={()=>deleteItem(it.id)} style={{width:32,height:32,borderRadius:8,border:`1px solid ${t.bdr}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:t.sec}} title="Delete">
                  <Trash2 size={14}/>
                </button>
                {movingId===it.id && <MoveMenu itemDay={it.day} items={items} t={t} dark={dark} onMove={d=>moveItem(it.id,d)}/>}
              </div>
            </div>
          </div>

          <div style={{borderTop:`1px solid ${t.bdrLt}`,padding:"0 20px"}}>
            <button onClick={()=>setOpenN(o=>({...o,[it.id]:!o[it.id]}))} style={{display:"flex",alignItems:"center",gap:6,width:"100%",padding:"12px 0",border:"none",background:"none",cursor:"pointer",fontSize:14,fontWeight:500,color:t.sec,fontFamily:"inherit"}}>
              <MessageCircle size={14}/> Notes ({notes.length})
              <span style={{marginLeft:"auto"}}>{isOpen?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</span>
            </button>
          </div>

          {isOpen && (
            <div style={{borderTop:`1px solid ${t.bdrLt}`,padding:"16px 20px 18px",background:t.surf}}>
              {notes.map(n=>{
                const u=UM[n.user];
                const own=n.user===au;
                const ised=ecId===n.id;
                return (
                  <div key={n.id} style={{display:"flex",gap:10,marginBottom:12}}>
                    <Av u={u} sz={26}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <span style={{fontSize:14,fontWeight:600,color:t.ink}}>{u.name}</span>
                        <span style={{fontSize:12,color:t.hint}}>{n.ts}</span>
                        {own&&!ised&&(
                          <span style={{marginLeft:"auto",display:"flex",gap:8}}>
                            <button onClick={()=>{setEcId(n.id);setEcTxt(n.text);}} style={{border:"none",background:"none",cursor:"pointer",fontSize:12,color:t.sec,fontFamily:"inherit",padding:0,textDecoration:"underline"}}>edit</button>
                            <button onClick={()=>delCmt(n.id)} style={{border:"none",background:"none",cursor:"pointer",fontSize:12,color:t.accent,fontFamily:"inherit",padding:0,textDecoration:"underline"}}>delete</button>
                          </span>
                        )}
                      </div>
                      {ised?(
                        <div style={{display:"flex",gap:8,marginTop:6}}>
                          <input value={ecTxt} onChange={e=>setEcTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveCmt(n.id)} style={{flex:1,padding:"8px 14px",borderRadius:8,border:`1px solid ${t.bdr}`,fontSize:14,outline:"none",fontFamily:"inherit",color:t.ink,background:t.inputBg}}/>
                          <button onClick={()=>saveCmt(n.id)} style={{padding:"8px 14px",borderRadius:8,border:"none",background:t.accent,color:"white",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Save</button>
                          <button onClick={()=>setEcId(null)} style={{width:32,height:32,borderRadius:8,border:`1px solid ${t.bdr}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:t.sec}}><X size={14}/></button>
                        </div>
                      ):(
                        <div style={{fontSize:14,color:t.sec,marginTop:3,lineHeight:1.43}}>{n.text}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div style={{display:"flex",gap:10,marginTop:notes.length?8:0,alignItems:"center"}}>
                <Av u={cur} sz={26}/>
                <input value={drafts[it.id]||""} onChange={e=>setDrafts(d=>({...d,[it.id]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addCmt(it.id)} placeholder={`Add a note as ${cur.name}...`} style={{flex:1,padding:"10px 16px",borderRadius:999,border:`1px solid ${t.bdr}`,fontSize:14,outline:"none",fontFamily:"inherit",color:t.ink,background:t.inputBg}}/>
                <button onClick={()=>addCmt(it.id)} style={{width:36,height:36,borderRadius:"50%",border:"none",background:t.accent,color:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Send size={14}/></button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if(loading) return (
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:dark?"#1A1A1A":"#FFFFFF",color:dark?"#F7F7F7":"#222222"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:12}}>✈️</div>
        <div style={{fontSize:16,fontWeight:600}}>Loading your trip...</div>
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif",maxWidth:860,margin:"0 auto",background:t.canvas,color:t.ink,WebkitFontSmoothing:"antialiased",minHeight:"100vh",transition:"background 0.3s,color 0.3s"}}>
      <div style={{background:t.hdr,borderRadius:"0 0 20px 20px",overflow:"hidden",position:"relative"}}>
        <img src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&w=900&h=400&fit=crop&q=80" alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"top",opacity:0.65}} onError={e=>{e.target.style.display="none";}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{padding:"32px 28px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:10,fontWeight:600,color:t.hint,letterSpacing:"0.32em",textTransform:"uppercase"}}>Trip planner</div>
            <button onClick={()=>setDark(!dark)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",padding:0}} aria-label="Toggle dark mode">
              <Sun size={14} color={dark?"#888":"#FBBF24"}/>
              <div style={{width:36,height:20,borderRadius:10,background:dark?"#FF385C":"rgba(255,255,255,0.2)",position:"relative"}}>
                <div style={{width:16,height:16,borderRadius:8,background:"white",position:"absolute",top:2,left:dark?18:2,transition:"left 0.2s"}}/>
              </div>
              <Moon size={14} color={dark?"#FF385C":"#888"}/>
            </button>
          </div>
          <h1 style={{fontSize:28,fontWeight:700,color:"#FFFFFF",margin:0,padding:"12px 28px 0",letterSpacing:"-0.44px",lineHeight:1.2}}>Dad, Mom 'n' Me in Chicago</h1>
          <div style={{padding:"10px 28px 24px",display:"flex",alignItems:"center",gap:16,fontSize:13,color:"#FFFFFF",textShadow:"0 1px 4px rgba(0,0,0,0.7)",flexWrap:"wrap"}}>
            <span style={{display:"flex",alignItems:"center",gap:4}}><MapPin size={13}/> Chicago, IL</span>
            <span style={{display:"flex",alignItems:"center",gap:4}}><Clock size={13}/> Jun 2 – Jul 5, 2026</span>
            <span>{items.length} items</span>
          </div>
        </div>
      </div>

      <div style={{padding:"24px 16px 0"}}>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:10,fontWeight:600,color:t.hint,letterSpacing:"0.32em",textTransform:"uppercase",marginBottom:12}}>Travelers</div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {users.map(u=>(
              <button key={u.id} onClick={()=>setAu(u.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 16px 8px 8px",borderRadius:999,cursor:"pointer",fontFamily:"inherit",border:au===u.id?`2px solid ${t.profActBd}`:`2px solid ${t.profBd}`,background:au===u.id?(dark?"rgba(255,56,92,0.08)":"white"):"transparent",boxShadow:au===u.id&&!dark?T.light.sh:"none",transition:"all 0.15s"}}>
                <Av u={u} sz={32}/><div style={{textAlign:"left"}}><div style={{fontSize:14,fontWeight:600,color:t.ink}}>{u.name}</div><div style={{fontSize:12,color:t.sec}}>{u.role}</div></div>
              </button>
            ))}
          </div>
        </div>

        <div style={{display:"flex",gap:4,marginBottom:20,overflowX:"auto"}}>
          {WEEKS.map((w,i)=>(
            <button key={i} onClick={()=>setAw(i)} style={{flex:1,minWidth:80,padding:"12px 8px 10px",borderRadius:12,border:"none",cursor:"pointer",background:aw===i?t.tabOn.bg:t.tabOff.bg,color:aw===i?t.tabOn.fg:t.tabOff.fg,fontWeight:600,fontSize:14,fontFamily:"inherit",transition:"all 0.15s"}}>
              {w.label}<div style={{fontSize:12,fontWeight:400,marginTop:2,opacity:.7}}>{w.sub}</div>
            </button>
          ))}
        </div>

        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:28}}>
          {CATS.map(cat=>{
            const on=fil.includes(cat);
            const p=on?t.pillOn:t.pillOff;
            return (
              <button key={cat} onClick={()=>toggleFil(cat)} style={{padding:"8px 16px",borderRadius:999,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",border:`1px solid ${p.bd}`,background:p.bg,color:p.fg,transition:"all 0.15s"}}>
                {cc[cat].icon} {cat}
              </button>
            );
          })}
          {fil.length>0&&(
            <button onClick={()=>setFil([])} style={{padding:"8px 16px",borderRadius:999,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${t.bdr}`,background:"transparent",color:t.accent,fontFamily:"inherit"}}>Clear all</button>
          )}
        </div>

        {days.map(({di,date,items:dItems})=>(
          <div key={di} style={{marginBottom:32}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:12,background:dItems.length?t.dayOn.bg:t.dayOff.bg,color:dItems.length?t.dayOn.fg:t.dayOff.fg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,flexShrink:0}}>{di+1}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:16,color:dItems.length?t.ink:t.sec,letterSpacing:"-0.18px"}}>Day {di+1} · {date}</div>
                <div style={{fontSize:12,color:t.hint,marginTop:1}}>{dItems.length?`${dItems.length} item${dItems.length>1?"s":""}`:"Free day — add something!"}</div>
              </div>
              {adding!==di&&(
                <button onClick={()=>{setAdding(di);setEditing(null);setMovingId(null);}} style={{display:"flex",alignItems:"center",gap:5,padding:"8px 16px",borderRadius:8,border:`1px solid ${t.addBdr}`,background:"transparent",fontSize:14,fontWeight:500,cursor:"pointer",color:t.sec,fontFamily:"inherit"}}>
                  <Plus size={15}/> Add
                </button>
              )}
            </div>
            {adding===di&&<div style={{marginLeft:48,marginBottom:16}}><ItemForm t={t} onSave={f=>addItem(di,f)} onCancel={()=>setAdding(null)}/></div>}
            {dItems.map(it=>renderCard(it))}
            {!dItems.length&&adding!==di&&(
              <button onClick={()=>{setAdding(di);setEditing(null);}} style={{width:"calc(100% - 48px)",marginLeft:48,padding:16,border:`1px dashed ${t.addBdr}`,borderRadius:12,background:"transparent",fontSize:14,fontWeight:500,color:t.hint,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:"inherit"}}>
                <Plus size={15}/> Add item to Day {di+1}
              </button>
            )}
          </div>
        ))}
      </div>
      <div style={{textAlign:"center",padding:"24px 0 40px",fontSize:12,color:t.hint}}>Dad, Mom 'n' Me in Chicago · Summer 2026</div>
    </div>
  );
}
