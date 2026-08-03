
import{initializeApp}from'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import{getAuth,GoogleAuthProvider,signInWithPopup,signOut as fbOut,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import{getFirestore,collection,doc,getDoc,getDocs,setDoc,deleteDoc,addDoc,updateDoc,onSnapshot,query,orderBy,where,serverTimestamp}from'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const APP_VERSION='1.0.4';

const cfg={apiKey:"AIzaSyCbANGtwm-1x2ZX2kGN2zX6C36YvXBE9UQ",authDomain:"soc-calculator.firebaseapp.com",projectId:"soc-calculator",storageBucket:"soc-calculator.firebasestorage.app",messagingSenderId:"555241038540",appId:"1:555241038540:web:93d4d777688cb2e4e95869"};
const fbApp=initializeApp(cfg);
const auth=getAuth(fbApp);
const db=getFirestore(fbApp);

// ── UNSPLASH (no key needed for source.unsplash.com) ──
function getLocationImg(location,w=800,h=600){
  // Use Lorem Picsum (free, reliable, no API key needed)
  // Format: https://picsum.photos/{width}/{height}?random={seed}
  const hash=(location||'adventure').split('').reduce((acc,c)=>((acc<<5)-acc)+c.charCodeAt(0),0);
  const seed=Math.abs(hash%10000);
  return `https://picsum.photos/${w}/${h}?random=${seed}`;
}

// ── BASE PACK ITEMS ──
function baseCats(px){return[
  {cat:'Pack & Sleep',items:[
    {id:`${px}1`,name:'Backpack (with hip/waist belt)',qty:'1',note:'Loaded pack < 1/3 of body weight.'},
    {id:`${px}2`,name:'Warm sleeping bag (winter-rated)',qty:'1',note:'Check comfort rating for season.',crit:true},
    {id:`${px}3`,name:'Sleeping bag waterproof cover',qty:'1'},
    {id:`${px}4`,name:'Pack liner / dry-bags / ziplocks',qty:'set'},
    {id:`${px}5`,name:'Small pillow or stuff-sack',qty:'1',note:'Optional.'},
  ]},
  {cat:'Worn on Trail',items:[
    {id:`${px}6`,name:'Hiking boots / trail shoes (broken in)',qty:'1',note:'No new boots — blisters.'},
    {id:`${px}7`,name:'Hiking socks (worn)',qty:'1',note:'Wool/synthetic, not cotton.'},
    {id:`${px}8`,name:'Quick-dry trousers or zip-off pants',qty:'1'},
    {id:`${px}9`,name:'Base layer / t-shirt (worn)',qty:'1'},
    {id:`${px}10`,name:'Sun hat or cap',qty:'1'},
    {id:`${px}11`,name:'Buff / neck gaiter',qty:'1'},
  ]},
  {cat:'Warm Layers',items:[
    {id:`${px}12`,name:'Thermal base layer — top',qty:'1'},
    {id:`${px}13`,name:'Thermal base layer — bottoms',qty:'1'},
    {id:`${px}14`,name:'Fleece / warm jumper',qty:'1'},
    {id:`${px}15`,name:'Warm jacket / puffer',qty:'1'},
    {id:`${px}16`,name:'Rain jacket',qty:'1',note:'NON-NEGOTIABLE.',crit:true},
    {id:`${px}17`,name:'Beanie',qty:'1'},
    {id:`${px}18`,name:'Gloves',qty:'1'},
    {id:`${px}19`,name:'Spare hiking socks',qty:'2'},
    {id:`${px}20`,name:'Warm socks for sleeping',qty:'1'},
    {id:`${px}21`,name:'Long pants / tracksuit for evening',qty:'1'},
    {id:`${px}22`,name:'Spare shirt / base layer',qty:'1'},
    {id:`${px}23`,name:'Underwear x3',qty:'3'},
  ]},
  {cat:'Water, Food & Eating',items:[
    {id:`${px}24`,name:'Water bottles / bladder (~2L)',qty:'2L',note:'Fill at every water point.'},
    {id:`${px}25`,name:'Personal trail snacks',qty:'—'},
    {id:`${px}26`,name:'Mug',qty:'1'},
    {id:`${px}27`,name:'Plate / bowl',qty:'1'},
    {id:`${px}28`,name:'Utensils / spork',qty:'1'},
    {id:`${px}29`,name:'Pocket knife',qty:'1'},
  ]},
  {cat:'Light & Safety',items:[
    {id:`${px}30`,name:'Headlamp + spare batteries',qty:'1',crit:true},
    {id:`${px}31`,name:'Whistle',qty:'1',note:'3 blasts = help.'},
    {id:`${px}32`,name:'Phone + power bank',qty:'1'},
  ]},
  {cat:'Toiletries & Personal',items:[
    {id:`${px}33`,name:'Toothbrush & toothpaste (travel)',qty:'1'},
    {id:`${px}34`,name:'Quick-dry towel & face cloth',qty:'1'},
    {id:`${px}35`,name:'Toilet paper (in ziplock)',qty:'1'},
    {id:`${px}36`,name:'Wet wipes / hand sanitiser',qty:'1'},
    {id:`${px}37`,name:'Lip balm & sunscreen',qty:'1'},
    {id:`${px}38`,name:'Personal medication',qty:'—'},
  ]},
];}

function groupCats(px,dad,mom){return[
  {cat:`Cooking (${dad})`,items:[
    {id:`${px}g1`,name:'Gas stove + gas canister(s)',qty:'1-2',crit:true},
    {id:`${px}g2`,name:'Pot / pan set + cooking spoon',qty:'1'},
    {id:`${px}g3`,name:'Matches / lighter + firelighters',qty:'1'},
    {id:`${px}g4`,name:'Tin opener',qty:'1'},
    {id:`${px}g5`,name:'Biodegradable dishwashing liquid + scourer',qty:'1'},
    {id:`${px}g6`,name:'All food (per meal plan)',qty:'—'},
    {id:`${px}g7`,name:'Salt, pepper, cooking oil (small)',qty:'—'},
  ]},
  {cat:'Camp & Hygiene',items:[
    {id:`${px}g8`,name:'Toilet spade / trowel',qty:'1'},
    {id:`${px}g9`,name:'Rubbish bags',qty:'3-4',note:'Pack out ALL trash.'},
    {id:`${px}g10`,name:'Nylon string / paracord',qty:'1'},
    {id:`${px}g11`,name:'Water-purifying tablets',qty:'1 pack'},
    {id:`${px}g12`,name:'Insect repellent (DEET)',qty:'1'},
    {id:`${px}g13`,name:'Spare batteries (headlamp size)',qty:'set'},
  ]},
  {cat:'Group First-Aid',items:[
    {id:`${px}g14`,name:'Blister plasters + regular plasters',qty:'1',crit:true},
    {id:`${px}g15`,name:'Crepe bandage',qty:'1'},
    {id:`${px}g16`,name:'Antiseptic cream + wound wipes',qty:'1'},
    {id:`${px}g17`,name:'Painkillers — adult & child',qty:'1'},
    {id:`${px}g18`,name:'Anti-inflammatory gel (Voltaren)',qty:'1'},
    {id:`${px}g19`,name:'Rehydrate / electrolyte sachets',qty:'4'},
    {id:`${px}g20`,name:'Tweezers, scissors, duct tape',qty:'1'},
    {id:`${px}g21`,name:'Antihistamine + chronic meds',qty:'—'},
  ]},
  {cat:`Documents (${dad})`,items:[
    {id:`${px}g22`,name:'Booking receipt / permit',qty:'1',crit:true},
    {id:`${px}g23`,name:'Printed route map + trail description',qty:'1',note:'In a ziplock.'},
    {id:`${px}g24`,name:'Emergency contacts',qty:'1'},
    {id:`${px}g25`,name:'Cash (small)',qty:'—'},
  ]},
];}

// ── APP VERSION ──
// Bump this string with every deploy so it's easy to check (right on the
// ── STATE ──
let cu=null,isAdmin=false,isGlobalAdmin=false,isFamilyAdmin=false,userFamKey=null,userRole='member';
let editingFamKey=null; // When admin edits another family, this tracks which one
let allHikes=[],currentHike=null,currentHikeData=null;
let checks={},users=[],qa=[];
let unsubs=[],hikeUnsub=null;
let ctxCtx=null,editCtx=null,addCtx=null,replyCtx=null,hikeManagerCtx=null;
let lpTimer=null,lpWasLong=false;
let wizStep=0,wizData={};
let didInitialHikeRoute=false;

// ── SCREENS ──
// The app is split across separate HTML pages (login.html, hub.html,
// adventure.html, admin.html), each containing only its own
// `.screen` element. showScreen() shows that screen if it's on the current
// page, or redirects to the page that has it otherwise.
const PAGE_FOR_SCREEN={'s-login':'login.html','s-hub':'hub.html','s-app':'adventure.html','s-admin':'admin.html'};
function showScreen(id){
  const s=document.getElementById(id);
  if(s){
    document.querySelectorAll('.screen').forEach(el=>{el.classList.remove('active');el.style.display='none';});
    s.style.display='flex';
    s.classList.add('active');
    return;
  }
  const page=PAGE_FOR_SCREEN[id];
  if(page)window.location.href=page;
}
window.showHub=()=>{localStorage.removeItem('trail_lastHikeId');showScreen('s-hub');renderHub();};

function ini(n){return(n||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);}
function priorityBadge(item){
  if(item.priority==='critical'||item.crit)return'<span class="crit-badge">critical</span>';
  if(item.priority==='nice')return'<span class="nice-badge">nice to have</span>';
  return'';
}
function fmtTime(ts){const d=ts?.toDate?.();if(!d)return'';return d.toLocaleDateString('en-ZA',{day:'2-digit',month:'short'})+' '+d.toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'});}

// ── PARTICLES (entry screen) ──
function makeParticles(containerId,count=12){
  const c=document.getElementById(containerId);if(!c)return;c.innerHTML='';
  for(let i=0;i<count;i++){
    const p=document.createElement('div');const size=Math.random()*6+3;
    p.className='particle';
    p.style.cssText=`width:${size}px;height:${size}px;left:${Math.random()*100}%;animation-duration:${Math.random()*12+8}s;animation-delay:${Math.random()*8}s`;
    c.appendChild(p);
  }
}
function makeStars(){
  const c=document.getElementById('login-stars');if(!c)return;c.innerHTML='';
  for(let i=0;i<80;i++){
    const s=document.createElement('div');s.className='star';
    const size=Math.random()*2.5+0.5;
    s.style.cssText=`width:${size}px;height:${size}px;top:${Math.random()*65}%;left:${Math.random()*100}%;animation-duration:${2+Math.random()*4}s;animation-delay:${Math.random()*4}s`;
    c.appendChild(s);
  }
}

// ── WEATHER (Open-Meteo — free, no key) ──
const WX_CODES={0:'☀️ Clear',1:'🌤️ Mainly clear',2:'⛅ Partly cloudy',3:'☁️ Overcast',45:'🌫️ Foggy',48:'🌫️ Icy fog',51:'🌦️ Light drizzle',53:'🌦️ Drizzle',55:'🌧️ Heavy drizzle',61:'🌧️ Light rain',63:'🌧️ Rain',65:'⛈️ Heavy rain',71:'🌨️ Light snow',73:'🌨️ Snow',75:'❄️ Heavy snow',80:'🌦️ Showers',81:'🌧️ Heavy showers',95:'⛈️ Thunderstorm',99:'⛈️ Hail storm'};

async function fetchWeatherForEntry(lat,lon,targetId='entry-weather'){
  try{
    const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`);
    const d=await r.json();
    const c=d.current;
    const desc=WX_CODES[c.weathercode]||'🌡️ Weather';
    const strip=document.getElementById(targetId);
    if(strip)strip.innerHTML=`
      <div class="weather-chip">${desc}</div>
      <div class="weather-chip">🌡️ ${Math.round(c.temperature_2m)}°C</div>
      <div class="weather-chip">💨 ${Math.round(c.windspeed_10m)} km/h</div>`;
  }catch(e){console.log('Weather unavailable');}
}

// Fetches weather for a hike card on the hub, using its saved coords or
// geocoding its location name as a fallback. targetId is the card's own
// weather-chip container so multiple cards can load independently.
function loadCardWeather(hike,targetId){
  const coords=hike.coords||null;
  if(coords?.lat){
    fetchWeatherForEntry(coords.lat,coords.lon,targetId);
    return;
  }
  fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(hike.location||hike.name)}&format=json&limit=1`,{headers:{'Accept-Language':'en'}})
    .then(r=>r.json()).then(res=>{
      if(res[0])fetchWeatherForEntry(parseFloat(res[0].lat),parseFloat(res[0].lon),targetId);
    }).catch(()=>{});
}

// ── LOCATION SEARCH (Nominatim — free, no key) ──
let wizLocCoords=null;
async function searchLocation(query){
  if(!query||query.length<3)return;
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,{headers:{'Accept-Language':'en'}});
    const results=await r.json();
    renderLocResults(results);
  }catch(e){console.log('Location search failed');}
}

function renderLocResults(results){
  const el=document.getElementById('loc-results');if(!el)return;
  if(!results.length){el.innerHTML='<div style="padding:8px;font-size:12px;color:var(--muted)">No results</div>';return;}
  el.innerHTML=results.map((r,i)=>
    `<div onclick="pickLocation(${i})" data-lat="${r.lat}" data-lon="${r.lon}" data-name="${r.display_name.replace(/"/g,'')}"
      style="padding:10px 12px;border-bottom:1px solid var(--border);cursor:pointer;font-size:13px;line-height:1.4">
      📍 ${r.display_name.split(',').slice(0,3).join(', ')}
    </div>`
  ).join('');
  el.style.display='block';
}

window.pickLocation=idx=>{
  const items=document.querySelectorAll('#loc-results [data-lat]');
  const el=items[idx];if(!el)return;
  const lat=parseFloat(el.dataset.lat);
  const lon=parseFloat(el.dataset.lon);
  const name=el.dataset.name.split(',').slice(0,3).join(', ');
  wizLocCoords={lat,lon};
  const inp=document.getElementById('w-loc');
  if(inp)inp.value=name.split(',').slice(0,2).join(', ');
  wizData.location=inp?.value||name;
  wizData.coords={lat,lon};
  document.getElementById('loc-results').style.display='none';
  showToast('📍 '+name.split(',')[0]);
};

// ── AUTH ──
onAuthStateChanged(auth,async user=>{
  if(!user){showScreen('s-login');makeStars();unsubs.forEach(u=>u());unsubs=[];didInitialHikeRoute=false;return;}
  cu=user;
  const ud=await getDoc(doc(db,'trail_users',user.email));
  if(!ud.exists()){
    // First ever user → bootstrap as global admin
    const snap=await getDocs(collection(db,'trail_users'));
    if(snap.empty){
      await setDoc(doc(db,'trail_users',user.email),{
        email:user.email,name:user.displayName||'',
        role:'globalAdmin',familyKey:null,addedAt:serverTimestamp()
      });
      userRole='globalAdmin';isGlobalAdmin=true;isAdmin=true;isFamilyAdmin=false;
    } else {
      showScreen('s-login');
      showToast('Access denied — ask Pieter to add you','#EF5350');
      await fbOut(auth);return;
    }
  } else {
    const d=ud.data();
    const roles=Array.isArray(d.roles)?d.roles:(d.role?[d.role]:[]);
    userRole=d.role||'member';
    isGlobalAdmin=roles.includes('globalAdmin');
    isFamilyAdmin=roles.includes('familyAdmin');
    isAdmin=isGlobalAdmin;
    userFamKey=d.familyKey!==undefined&&d.familyKey!==null?d.familyKey:null;
  }
  const hubInit=document.getElementById('hub-init');
  if(hubInit)hubInit.textContent=ini(cu.displayName||cu.email);
  subscribeUsers();
  subscribeHikes();
});

window.signIn=async()=>{try{await signInWithPopup(auth,new GoogleAuthProvider());}catch(e){showToast('Sign in failed','#EF5350');}};
window.signOut=async()=>{await fbOut(auth);showScreen('s-login');makeStars();unsubs.forEach(u=>u());unsubs=[];allHikes=[];didInitialHikeRoute=false;localStorage.removeItem('trail_lastHikeId');};

// ── HIKE SUBSCRIPTIONS ──
function subscribeUsers(){
  const u=onSnapshot(collection(db,'trail_users'),snap=>{
    users=snap.docs.map(d=>({id:d.id,...d.data()}));
    // Re-render the settings panel live if it's currently open, so newly
    // invited users show up immediately without needing a refresh.
    if(document.getElementById('s-app')?.classList.contains('active')){
      const settingsPanel=document.getElementById('ap_settings');
      if(settingsPanel&&settingsPanel.offsetParent!==null)renderSettings();
    }
  });
  unsubs.push(u);
}

function subscribeHikes(){
  const u=onSnapshot(query(collection(db,'trail_hikes'),orderBy('createdAt','desc')),snap=>{
    allHikes=snap.docs.map(d=>({id:d.id,...d.data()}));
    // Keep the open hike's data fresh (e.g. archived/progress changes from others)
    // without yanking the user back to the hub.
    if(currentHike){
      const fresh=allHikes.find(h=>h.id===currentHike.id);
      if(fresh)currentHike=fresh;
    }

    if(!didInitialHikeRoute){
      didInitialHikeRoute=true;
      const lastId=localStorage.getItem('trail_lastHikeId');
      if(lastId){
        const h=allHikes.find(x=>x.id===lastId);
        const canSee=h&&(isGlobalAdmin||h.invitedEmails?.includes(cu.email)||(userFamKey!==null&&h.families?.[userFamKey]));
        if(canSee){
          currentHike=h;
          enterHike();
          return;
        }
        // Saved hike no longer accessible — forget it and fall through to hub.
        localStorage.removeItem('trail_lastHikeId');
      }
      // Route to appropriate page
      if(document.getElementById('s-admin')){
        showScreen('s-admin');
        renderAdmin();
      } else {
        showScreen('s-hub');
        renderHub();
      }
      return;
    }

    // Subsequent snapshot updates
    if(document.getElementById('s-hub')?.classList.contains('active')){
      renderHub();
    }
    if(document.getElementById('s-admin')?.classList.contains('active')&&isGlobalAdmin){
      renderAdmin();
    }
  });
  unsubs.push(u);
}

// ── HUB ──
function renderHub(){
  const content=document.getElementById('hub-content');
  if(!content)return;

  // Filter hikes user can see
  const myHikes=allHikes.filter(h=>{
    if(isGlobalAdmin)return true;
    // Check invitedEmails (legacy) OR the user has a familyKey that exists in this hike
    if(h.invitedEmails?.includes(cu.email))return true;
    if(userFamKey!==null&&h.families?.[userFamKey])return true;
    return false;
  });
  const active=myHikes.filter(h=>!h.archived);
  const archived=myHikes.filter(h=>h.archived);

  let html='';

  if(isGlobalAdmin){
    html+=`<div style="padding:0 16px 16px">
      <button class="create-hike-btn" onclick="openCreateHike()">
        <span style="font-size:20px">＋</span> Create new adventure
      </button>
    </div>`;
  }

  if(!active.length&&!archived.length){
    html+=`<div style="text-align:center;padding:60px 28px;color:var(--muted)">
      <div style="font-size:48px;margin-bottom:12px">🏕️</div>
      <div style="font-size:16px;font-weight:700;margin-bottom:6px">No adventures yet</div>
      <div style="font-size:13px">Plan your first trip: camping, hiking, road trip, or expedition!</div>
    </div>`;
  }

  if(active.length){
    html+=`<div class="hub-section-label">📋 Upcoming adventures</div>`;
    html+=`<div class="hike-grid">`;
    active.forEach(h=>{html+=hikeCard(h,false);});
    html+=`</div>`;
  }

  if(archived.length){
    html+=`<div class="hub-section-label" style="margin-top:12px">📦 Past adventures</div>`;
    html+=`<div class="hike-grid">`;
    archived.forEach(h=>{html+=hikeCard(h,true);});
    html+=`</div>`;
  }

  content.innerHTML=html;
  active.forEach(h=>loadCardWeather(h,`card-weather-${h.id}`));
}

function hikeCard(h,archived){
  const img=h.imageUrl||getLocationImg(h.location||h.name);
  const fams=h.families||[];
  const prog=h.progress||0;
  return `<div class="hike-card" onclick="openHike('${h.id}')">
    <div class="hike-card-img" style="background-image:url('${img}');background-size:cover;background-position:center" onerror="this.style.background='linear-gradient(135deg,#667eea 0%,#764ba2 100%)';this.style.display='flex';this.style.alignItems='center';this.style.justifyContent='center';this.style.fontSize='48px';this.textContent='🏕️'" onload=""></div>
    <div class="hike-card-overlay"></div>
    <div style="position:absolute;top:12px;right:12px;z-index:10">
      <button onclick="event.stopPropagation();openHikeManager('${h.id}')" style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);border-radius:20px;color:#fff;font-size:18px;padding:8px 10px;cursor:pointer;width:36px;height:36px;display:flex;align-items:center;justify-content:center">⚙️</button>
    </div>
    <div class="hike-card-body">
      <div class="hike-card-status ${archived?'archived':''}">${archived?'📦 Archived':'🟢 Active'}</div>
      <div class="hike-card-name">${h.name}</div>
      <div class="hike-card-loc">📍 ${h.location||'—'}</div>
      <div class="hike-card-dates">📅 ${h.dates||'—'}</div>
      <div class="hike-card-fams">${fams.map(f=>`<span class="fam-chip">🏠 ${f.name}</span>`).join('')}</div>
      ${archived?'':`<div class="weather-strip" id="card-weather-${h.id}" style="justify-content:flex-start;margin:6px 0 10px;animation:none"></div>`}
      <div class="hike-card-prog"><div class="hike-card-prog-fill" style="width:${prog}%"></div></div>
    </div>
  </div>`;
}

// ── SELECT HIKE → ANIMATED ENTRY ──
window.openHike=hikeId=>{
  const hike=allHikes.find(h=>h.id===hikeId);
  if(!hike)return;
  currentHike=hike;
  enterHike();
};

window.enterHike=async()=>{
  if(!currentHike)return;
  localStorage.setItem('trail_lastHikeId',currentHike.id);
  if(!document.getElementById('s-app')){
    window.location.href='adventure.html';
    return;
  }
  await renderAppScreen();
};

async function renderAppScreen(){
  // Display version number
  const verEl=document.getElementById('app-ver');
  if(verEl)verEl.textContent=APP_VERSION;
  
  const fams=currentHike.families||[];

  // Re-read user doc to get latest familyKey (may have changed since login)
  const ud=await getDoc(doc(db,'trail_users',cu.email));
  const storedFamKey=ud.exists()?(ud.data().familyKey!==undefined&&ud.data().familyKey!==null?ud.data().familyKey:null):null;

  if(storedFamKey!==null&&storedFamKey<fams.length){
    // Explicit assignment always wins — works for all roles including global admin
    userFamKey=storedFamKey;
  } else if(isGlobalAdmin){
    // Global admin with no family assigned yet — default to 0
    userFamKey=0;
  } else {
    // Fallback: scan invitedEmails (legacy support), take FIRST match only
    userFamKey=null;
    for(let i=0;i<fams.length;i++){
      if(fams[i].invitedEmails?.includes(cu.email)){userFamKey=i;break;}
    }
    if(userFamKey===null){
      showToast('You are not assigned to a family — ask Pieter to set this up','#FFB300');
      userFamKey=0;
    }
  }

  // Build hike data from current hike config
  currentHikeData=buildHikeData(currentHike);

  // Setup app topbar
  const famName=fams[userFamKey]?.name||'My Family';
  document.getElementById('u-init').textContent=ini(cu.displayName||cu.email);
  document.getElementById('u-name').textContent=(cu.displayName||cu.email).split(' ')[0];
  document.getElementById('u-fam').textContent=famName;

  buildAppTabs();
  subscribeHikeData(currentHike.id);
  showScreen('s-app');
}

// ── BUILD HIKE DATA FROM FIREBASE HIKE CONFIG ──
function buildHikeData(hike){
  const data={};
  (hike.families||[]).forEach((fam,fi)=>{
    const famKey='f'+fi;
    const members={};
    (fam.members||[]).forEach((m,mi)=>{
      const px=`${hike.id}_f${fi}_m${mi}_`;
      members['m'+mi]={
        label:m.name+(m.age?' ('+m.age+')':''),
        name:m.name,age:m.age||'',gender:m.gender||'',
        note:m.note||'',
        // Use this person's saved packing list if they have one, so
        // added/renamed/removed categories & items actually stick.
        cats:Array.isArray(m.cats)?m.cats:baseCats(px)
      };
    });
    // Group kit
    const dad=fam.members?.[0]?.name||'Dad';
    const mom=fam.members?.[1]?.name||'Mum';
    const gpx=`${hike.id}_f${fi}_g_`;
    members['group']={label:'Group Kit',note:`Carried mainly by ${dad}`,cats:Array.isArray(fam.groupCats)?fam.groupCats:groupCats(gpx,dad,mom)};
    data[famKey]={name:fam.name,members,meals:fam.meals||defaultMeals(hike),shopping:Array.isArray(fam.shopping)?fam.shopping:defaultShopping(hike.id+'_f'+fi)};
  });
  return data;
}

function defaultMeals(hike){
  const id=hike.id;
  return[
    {
      dayNum:1,dayName:'Day 1',
      breakfast:{type:'Breakfast',food:'Instant oats + beskuit',tip:'Fast & warm'},
      lunch:{type:'Lunch',food:'Trail snacks',tip:'No cooking'},
      dinner:{type:'Dinner',food:'One-pot pasta or nachos',tip:'Pre-cook at home if possible'},
      snacks:{type:'All-day snacks',food:'Biltong, energy bars, dried fruit, nuts',tip:'Pack plenty'}
    },
    {
      dayNum:2,dayName:'Day 2',
      breakfast:{type:'Breakfast',food:'Instant oats + beskuit',tip:'Quick before packing up'},
      lunch:{type:'Lunch',food:'Wraps + biltong + cheese',tip:'No cooking needed'},
      dinner:{type:'Dinner',food:'Pasta & sauce + chorizo',tip:'One pot, easy cleanup'},
      snacks:{type:'All-day snacks',food:'Trail mix, fruit',tip:'Light refueling'}
    },
  ];
}

function defaultShopping(px){return[
  {cat:'Fresh / Chilled',items:[{id:`${px}_s1`,name:'Cheese + cold meats',qty:'—'},{id:`${px}_s2`,name:'Fresh fruit',qty:'—'}]},
  {cat:'Dry / Pantry',items:[{id:`${px}_s3`,name:'Instant oats',qty:'1 box'},{id:`${px}_s4`,name:'Beskuit (rusks)',qty:'1 pack'},{id:`${px}_s5`,name:'Pasta & sauce',qty:'2 packs'},{id:`${px}_s6`,name:'Provitas / wraps',qty:'2 packs'}]},
  {cat:'Snacks',items:[{id:`${px}_s7`,name:'Biltong',qty:'big bag'},{id:`${px}_s8`,name:'Droewors',qty:'big bag'},{id:`${px}_s9`,name:'Energy bars',qty:'1 box'},{id:`${px}_s10`,name:'Trail mix',qty:'1 bag'},{id:`${px}_s11`,name:'Dried fruit',qty:'1 bag'},{id:`${px}_s12`,name:'Marshmallows',qty:'1 bag'}]},
  {cat:'Drinks',items:[{id:`${px}_s13`,name:'Coffee + tea bags',qty:'—'},{id:`${px}_s14`,name:'Hot chocolate + Milo',qty:'—'},{id:`${px}_s15`,name:'Powdered milk + sugar',qty:'—'}]},
  {cat:'Cooking',items:[{id:`${px}_s16`,name:'Salt, pepper, oil',qty:'—'},{id:`${px}_s17`,name:'Firelighters + matches',qty:'1'},{id:`${px}_s18`,name:'Water tablets',qty:'1 pack'}]},
];}

// ── SUBSCRIBE HIKE DATA ──
function subscribeHikeData(hikeId){
  unsubs.filter(u=>u._hikeUnsub).forEach(u=>u());
  const u1=onSnapshot(collection(db,`trail_hikes/${hikeId}/checks`),snap=>{
    checks={};snap.docs.forEach(d=>{checks[d.id]=d.data();});
    renderAppAll();
  });
  const u2=onSnapshot(query(collection(db,`trail_hikes/${hikeId}/qa`),orderBy('createdAt','asc')),snap=>{
    qa=snap.docs.map(d=>({id:d.id,...d.data()}));
    renderQA();
  });
  [u1,u2].forEach(u=>{u._hikeUnsub=true;unsubs.push(u);});
}

// ── BUILD APP TABS ──
function buildAppTabs(){
  const prevActiveId=document.querySelector('.app-tab.active')?.dataset.tabId;
  const verEl=document.getElementById('app-ver');
  if(verEl)verEl.textContent=APP_VERSION;
  otherFamActive=null;
  const bar=document.getElementById('app-tabs');
  const pnls=document.getElementById('app-panels');
  bar.innerHTML='';pnls.innerHTML='';
  if(!currentHikeData)return;

  // Determine which family to show tabs for: editing family (if global admin editing another), or user's own family
  let activeFamKey=getEditFamKey();
  // Normalize: if it's already 'f0', keep it; if it's integer 0, convert to 'f0'
  if(typeof activeFamKey==='number')activeFamKey='f'+activeFamKey;
  const activeFam=currentHikeData[activeFamKey];
  if(!activeFam)return;

  // No separate family selector bar — global admins use family cards below instead

  // Other family panels (hidden, rendered on fam-card tap — not shown as tabs)
  const otherFamPanels=Object.entries(currentHikeData)
    .filter(([fk,fam],fi)=>fk!=activeFamKey)
    .flatMap(([fk,fam])=>
      Object.entries(fam.members).map(([mk,mv])=>({
        id:`other_${fk}_${mk}`,
        famKey:fk, memberKey:mk, readOnly:true
      }))
    );

  const tabs=[
    {id:'dash',label:'📊 Dashboard'},
    ...Object.entries(activeFam.members).map(([k,v])=>({id:'m_'+k,label:'🎒 '+(v.name||v.label.split(' ')[0])})),
    {id:'shop',label:'🛒 Shopping'},
    {id:'meals',label:'🍲 Meals'},
    {id:'qa',label:'💬 Q&A'},
    {id:'settings',label:'⚙️'},
  ];

  tabs.forEach(t=>{
    const tab=document.createElement('div');
    tab.className='app-tab';
    tab.textContent=t.label;
    tab.dataset.tabId=t.id;
    tab.onclick=()=>showAppTab(t.id);
    bar.appendChild(tab);
    const panel=document.createElement('div');
    panel.className='app-panel';
    panel.id='ap_'+t.id;
    pnls.appendChild(panel);
  });

  // Add hidden panels for other families (not shown as tabs)
  otherFamPanels.forEach(t=>{
    const panel=document.createElement('div');
    panel.className='app-panel';
    panel.id='ap_'+t.id;
    pnls.appendChild(panel);
  });

  // Build family cards in header
  buildFamCards();

  // Rebuilding the tab bar wipes every panel's HTML, so restore whichever
  // tab the person was actually looking at (e.g. Settings) instead of
  // always dropping them back on the Dashboard, and refill its content.
  const targetId=(prevActiveId&&tabs.some(t=>t.id===prevActiveId))?prevActiveId:tabs[0].id;
  showAppTab(targetId);
  if(targetId==='settings')renderSettings();
  else if(targetId==='qa')renderQA();
}

window.showAppTab=id=>{
  document.querySelectorAll('.app-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.app-panel').forEach(p=>p.classList.remove('active'));
  const panels=Array.from(document.querySelectorAll('.app-panel'));
  const tabs=Array.from(document.querySelectorAll('.app-tab'));
  const idx=panels.findIndex(p=>p.id==='ap_'+id);
  if(idx>=0){tabs[idx].classList.add('active');panels[idx].classList.add('active');}
};

function buildFamCards(){
  const fc=document.getElementById('fam-cards');
  if(!fc||!currentHikeData)return;
  fc.innerHTML=Object.entries(currentHikeData).map(([fk,fam],fi)=>{
    const isMine=fi===userFamKey;
    const firstMemberKey=Object.keys(fam.members)[0];
    let clickTarget;
    if(isMine){
      clickTarget=`showAppTab('m_${firstMemberKey}')`;
    } else if(isGlobalAdmin){
      // Global admin: can edit any family
      clickTarget=`switchEditFamily('${fk}','m_${firstMemberKey}')`;
    } else {
      // Family admin or member: read-only view of other families
      const safeFamName=(fam.name||'').replace(/'/g,"\\'");
      clickTarget=`openOtherFamView('${fk}','${firstMemberKey}','${safeFamName}')`;
    }
    return`<div class="fam-card${isMine?' mine':''}" onclick="${clickTarget}" style="cursor:pointer">
      <div class="fc-name">🏠 ${fam.name}${isMine?' ✓':isGlobalAdmin?'':' 👀'}</div>
      <div class="fc-pct" id="fc-pct-${fk}">—%</div>
      <div class="fc-sub" id="fc-sub-${fk}">loading…</div>
      <div class="fc-bar-bg"><div class="fc-bar-fill" id="fc-bar-${fk}" style="width:0%;background:${fi===0?'var(--green)':'var(--teal)'}"></div></div>
      <div style="font-size:9px;color:${isMine?'var(--green)':isGlobalAdmin?'var(--amber)':'var(--teal)'};margin-top:4px;font-weight:700">${isMine?'Tap to pack':isGlobalAdmin?'Tap to edit':' Tap to view →'}</div>
    </div>`;
  }).join('');
}

window.switchEditFamily=(famKey,memberTabId)=>{
  editingFamKey=famKey; // Keep as 'f0', 'f1' etc
  buildAppTabs();
  renderAppAll();
  showAppTab(memberTabId);
};

// ── OTHER FAMILY VIEW — same tab layout as own family ──
let otherFamActive=null; // {famKey, famName}

window.openOtherFamView=(famKey,firstMemberKey,famName)=>{
  const fam=currentHikeData?.[famKey];if(!fam)return;
  otherFamActive={famKey,famName};
  // Allow global admin to edit this family
  if(isGlobalAdmin)editingFamKey=famKey; // Keep as 'f0', 'f1' etc

  // Rebuild tab bar with other fam's members + Shopping + Meals + a back button
  const bar=document.getElementById('app-tabs');
  const pnls=document.getElementById('app-panels');
  bar.innerHTML='';pnls.innerHTML='';

  // Back tab
  const backTab=document.createElement('div');
  backTab.className='app-tab';
  backTab.style.cssText='color:var(--teal);font-weight:800;flex-shrink:0';
  backTab.textContent=isGlobalAdmin&&editingFamKey===famKey?'← Back (admin mode)':'← Back';
  backTab.onclick=()=>{otherFamActive=null;editingFamKey=null;buildAppTabs();renderAppAll();showAppTab('dash');};
  bar.appendChild(backTab);

  // Member tabs for the other family
  Object.entries(fam.members).forEach(([mk,mv],i)=>{
    const tab=document.createElement('div');
    tab.className='app-tab'+(i===0?' active':'');
    tab.dataset.tabId='ofm_'+mk;
    tab.style.cssText=i===0?'color:var(--teal);border-bottom-color:var(--teal)':'';
    const eyeIcon=isGlobalAdmin&&editingFamKey===famKey?'✏️':'👀'; // Edit icon for admin, eye for read-only
    tab.textContent=eyeIcon+' '+(mv.name||mv.label.split(' ')[0]);
    tab.onclick=()=>{
      bar.querySelectorAll('.app-tab').forEach(t=>{t.classList.remove('active');t.style.color='';t.style.borderBottomColor='';});
      tab.classList.add('active');tab.style.color='var(--teal)';tab.style.borderBottomColor='var(--teal)';
      pnls.querySelectorAll('.app-panel').forEach(p=>p.classList.remove('active'));
      const p=document.getElementById('ap_ofm_'+mk);if(p){p.classList.add('active');renderOtherFamMember(famKey,mk);}
    };
    bar.appendChild(tab);
    const panel=document.createElement('div');
    panel.className='app-panel'+(i===0?' active':'');
    panel.id='ap_ofm_'+mk;
    pnls.appendChild(panel);
  });

  // Shopping tab
  const shopTab=document.createElement('div');
  shopTab.className='app-tab';
  shopTab.dataset.tabId='ofm_shop';
  shopTab.textContent='🛒 Shopping';
  shopTab.onclick=()=>{
    bar.querySelectorAll('.app-tab').forEach(t=>{t.classList.remove('active');t.style.color='';t.style.borderBottomColor='';});
    shopTab.classList.add('active');shopTab.style.color='var(--teal)';shopTab.style.borderBottomColor='var(--teal)';
    pnls.querySelectorAll('.app-panel').forEach(p=>p.classList.remove('active'));
    const p=document.getElementById('ap_ofm_shop');if(p){p.classList.add('active');renderOtherFamShop(famKey);}
  };
  bar.appendChild(shopTab);
  const shopPanel=document.createElement('div');
  shopPanel.className='app-panel';
  shopPanel.id='ap_ofm_shop';
  pnls.appendChild(shopPanel);

  // Meals tab
  const mealsTab=document.createElement('div');
  mealsTab.className='app-tab';
  mealsTab.dataset.tabId='ofm_meals';
  mealsTab.textContent='🍲 Meals';
  mealsTab.onclick=()=>{
    bar.querySelectorAll('.app-tab').forEach(t=>{t.classList.remove('active');t.style.color='';t.style.borderBottomColor='';});
    mealsTab.classList.add('active');mealsTab.style.color='var(--teal)';mealsTab.style.borderBottomColor='var(--teal)';
    pnls.querySelectorAll('.app-panel').forEach(p=>p.classList.remove('active'));
    const p=document.getElementById('ap_ofm_meals');if(p){p.classList.add('active');renderOtherFamMeals(famKey);}
  };
  bar.appendChild(mealsTab);
  const mealsPanel=document.createElement('div');
  mealsPanel.className='app-panel';
  mealsPanel.id='ap_ofm_meals';
  pnls.appendChild(mealsPanel);

  // Settings tab (only for global admin editing)
  if(isGlobalAdmin&&editingFamKey===famKey){
    const settingsTab=document.createElement('div');
    settingsTab.className='app-tab';
    settingsTab.dataset.tabId='ofm_settings';
    settingsTab.textContent='⚙️ Settings';
    settingsTab.onclick=()=>{
      bar.querySelectorAll('.app-tab').forEach(t=>{t.classList.remove('active');t.style.color='';t.style.borderBottomColor='';});
      settingsTab.classList.add('active');settingsTab.style.color='var(--teal)';settingsTab.style.borderBottomColor='var(--teal)';
      pnls.querySelectorAll('.app-panel').forEach(p=>p.classList.remove('active'));
      const p=document.getElementById('ap_ofm_settings');if(p){p.classList.add('active');renderSettings();}
    };
    bar.appendChild(settingsTab);
    const settingsPanel=document.createElement('div');
    settingsPanel.className='app-panel';
    settingsPanel.id='ap_ofm_settings';
    pnls.appendChild(settingsPanel);
  }

  // Render first member immediately
  const firstPanel=document.getElementById('ap_ofm_'+firstMemberKey);
  if(firstPanel){firstPanel.classList.add('active');renderOtherFamMember(famKey,firstMemberKey);}
};

function renderOtherFamMember(famKey,memberKey){
  const panel=document.getElementById('ap_ofm_'+memberKey);if(!panel)return;
  const fam=currentHikeData?.[famKey];const member=fam?.members[memberKey];if(!member)return;
  let t=0,d=0;
  member.cats.forEach(c=>c.items.forEach(i=>{if(checks[i.id]?.visibility!=='private'){t++;if(checks[i.id]?.checked)d++;}}));
  const pct=t?Math.round(d/t*100):0;
  let html=`<div class="card"><div class="p-hdr" style="background:rgba(128,203,196,0.08)">
    <div style="font-size:11px;font-weight:700;color:var(--teal);margin-bottom:4px;letter-spacing:.08em;text-transform:uppercase">👀 ${fam.name||'Other Family'} — Read Only</div>
    ${member.note?`<div class="p-hdr-note">${member.note}</div>`:''}
    <div class="p-hdr-row"><span class="p-hdr-lbl">Progress</span><span class="p-hdr-cnt" style="color:var(--teal)">${d}/${t} packed</span></div>
    <div class="prog-bg"><div class="prog-fill" style="width:${pct}%;background:var(--teal)"></div></div>
  </div>`;
  member.cats.forEach((cat,ci)=>{
    const visibleItems=cat.items.filter(i=>checks[i.id]?.visibility!=='private');
    if(!visibleItems.length)return;
    const done=visibleItems.filter(i=>checks[i.id]?.checked).length;
    const allDone=done===visibleItems.length;
    const catId=`ofm_${memberKey}_${ci}`;
    html+=`<div class="cat-hdr" style="color:var(--teal);cursor:pointer;user-select:none" onclick="toggleCat('${catId}')">
      <span><span id="${catId}-arrow">${allDone?'▶':'▼'}</span> ${cat.cat}</span>
      <span style="font-size:10px;color:${allDone?'var(--green)':'var(--muted)'}">${done}/${visibleItems.length}</span>
    </div>
    <div id="${catId}" style="display:${allDone?'none':'block'}">`;
    visibleItems.forEach(item=>{
      const chk=checks[item.id]||{};const isChecked=chk.checked;
      const cloneData=JSON.stringify({id:item.id,name:item.name,qty:item.qty,note:item.note||''}).replace(/"/g,'&quot;');
      html+=`<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-top:1px solid var(--border);${isChecked?'opacity:.5':''}">
        <div class="chk-box${isChecked?' done':''}" style="flex-shrink:0;margin-top:2px"></div>
        <div class="ib" style="flex:1;min-width:0">
          <div class="i-name${isChecked?' struck':''}">${item.name}${priorityBadge(item)}${chk.visibility==='shared'?'<span class="shared-badge">shared</span>':''}</div>
          <div class="i-qty">Qty: ${item.qty}${chk.who?' · ✓ '+chk.who:''}</div>
          ${item.note?`<div class="i-note">${item.note}</div>`:''}
        </div>
        <button onclick="promptCloneItem(${cloneData})" style="flex-shrink:0;background:none;border:1px solid var(--fl);border-radius:6px;color:var(--fl);font-size:10px;font-weight:700;padding:4px 10px;cursor:pointer;white-space:nowrap;margin-top:1px">+ Clone</button>
      </div>`;
    });
    html+='</div>';
  });
  html+='</div>';
  panel.innerHTML=html;
}

function renderOtherFamShop(famKey){
  const panel=document.getElementById('ap_ofm_shop');if(!panel)return;
  const fam=currentHikeData?.[famKey];if(!fam)return;
  let t=0,d=0;fam.shopping.forEach(c=>c.items.forEach(i=>{t++;if(checks[i.id]?.checked)d++;}));
  const pct=t?Math.round(d/t*100):0;
  let html=`<div class="card"><div class="p-hdr" style="background:rgba(128,203,196,0.08)">
    <div style="font-size:11px;font-weight:700;color:var(--teal);margin-bottom:6px">👀 ${fam.name} — Shopping (Read Only)</div>
    <div class="p-hdr-row"><span class="p-hdr-lbl">Progress</span><span class="p-hdr-cnt" style="color:var(--teal)">${d}/${t} bought</span></div>
    <div class="prog-bg"><div class="prog-fill" style="width:${pct}%;background:var(--teal)"></div></div>
  </div>`;
  fam.shopping.forEach(cat=>{
    const catId='ofmshopcat_'+cat.cat.replace(/\W/g,'_');
    const done=cat.items.filter(i=>checks[i.id]?.checked).length;
    const total=cat.items.length;
    const allDone=done===total&&total>0;
    html+=`<div class="cat-hdr" style="color:var(--teal);cursor:pointer;user-select:none" onclick="toggleCat('${catId}')">
      <span><span id="${catId}-arrow" style="font-size:10px;margin-right:4px">${allDone?'▶':'▼'}</span>${cat.cat}</span>
      <span style="font-size:10px;color:${allDone?'var(--green)':'var(--muted)'}">${done}/${total}</span>
    </div>
    <div id="${catId}" style="display:${allDone?'none':'block'}">`;
    cat.items.forEach(item=>{
      const isChecked=checks[item.id]?.checked;const chk=checks[item.id]||{};
      html+=`<div class="shop-row${isChecked?' checked':''}">
        <div class="chk-box${isChecked?' done':''}"></div>
        <span class="shop-qty">${item.qty}</span>
        <div class="ib">
          <div class="i-name${isChecked?' struck':''}">${item.name}${priorityBadge(item)}</div>
          ${item.note?`<div class="i-note">${item.note}</div>`:''}
          ${chk.who?`<div class="i-who">✓ ${chk.who}</div>`:''}
        </div>
      </div>`;
    });
    html+='</div>';
  });
  html+='</div>';panel.innerHTML=html;
}

function renderOtherFamMeals(famKey){
  const panel=document.getElementById('ap_ofm_meals');if(!panel)return;
  const fam=currentHikeData?.[famKey];if(!fam)return;
  let html=`<div style="padding:0 8px"><div style="font-size:12px;color:var(--teal);font-weight:700;padding:12px 0;margin-bottom:8px">👀 ${fam.name} — Meals (Read Only)</div>`;
  const meals=fam.meals||[];
  if(!meals.length){html+='<div style="text-align:center;color:var(--muted);padding:20px">No meals planned</div>';panel.innerHTML=html+'</div>';return;}
  
  meals.forEach(day=>{
    const dayName=day.dayName||day.day;
    html+=`<div class="card" style="margin-bottom:12px;opacity:0.85">
      <div style="padding:10px 14px;font-size:12px;font-weight:700;color:var(--teal)">${dayName}</div>`;
    const mealTypes=[
      {key:'breakfast',icon:'🌅',label:'Breakfast'},
      {key:'lunch',icon:'🥪',label:'Lunch'},
      {key:'dinner',icon:'🍽️',label:'Dinner'},
      {key:'snacks',icon:'🍫',label:'All-day snacks'}
    ];
    mealTypes.forEach(mt=>{
      const meal=day[mt.key]||{food:'',tip:''};
      const food=meal.food||'(none)';const tip=meal.tip||'';
      html+=`<div style="padding:10px 14px;border-top:1px solid var(--border)">
        <div style="font-size:11px;font-weight:700;color:var(--teal);margin-bottom:2px">${mt.icon} ${mt.label}</div>
        <div style="font-size:12px;margin-bottom:2px">${food}</div>
        ${tip?`<div style="font-size:11px;color:var(--teal);font-style:italic">💡 ${tip}</div>`:''}
      </div>`;
    });
    html+=`</div>`;
  });
  html+=`</div>`;
  panel.innerHTML=html;
}
window.closeOtherFamModal=()=>{}; // no-op, kept for compat

// ── RENDER ALL ──
function renderAppAll(){
  if(!currentHikeData)return;
  if(otherFamActive){
    // Re-render whichever other-fam panel is visible
    document.querySelectorAll('.app-panel.active').forEach(p=>{
      const m=p.id.match(/^ap_ofm_(.+)$/);
      if(m){
        const mk=m[1];
        if(mk==='shop')renderOtherFamShop(otherFamActive.famKey);
        else if(mk==='meals')renderOtherFamMeals(otherFamActive.famKey);
        else renderOtherFamMember(otherFamActive.famKey,mk);
      }
    });
    updateFamCards();return;
  }
  renderDashboard();
  let activeFamKey=getEditFamKey();
  if(typeof activeFamKey==='number')activeFamKey='f'+activeFamKey;
  const activeFam=currentHikeData[activeFamKey];
  if(activeFam)Object.keys(activeFam.members).forEach(k=>renderMember(k));
  renderShop();
  renderMeals();
  updateFamCards();
}

function updateFamCards(){
  if(!currentHikeData)return;
  let totalAll=0,doneAll=0;
  Object.entries(currentHikeData).forEach(([fk,fam])=>{
    let t=0,d=0;
    Object.values(fam.members).forEach(m=>m.cats.forEach(c=>c.items.forEach(i=>{t++;if(checks[i.id]?.checked)d++;})));
    fam.shopping.forEach(c=>c.items.forEach(i=>{t++;if(checks[i.id]?.checked)d++;}));
    const pct=t?Math.round(d/t*100):0;
    totalAll+=t;doneAll+=d;
    const pe=document.getElementById('fc-pct-'+fk);
    const se=document.getElementById('fc-sub-'+fk);
    const be=document.getElementById('fc-bar-'+fk);
    if(pe)pe.textContent=pct+'%';
    if(se)se.textContent=d+'/'+t+' packed';
    if(be)be.style.width=pct+'%';
  });
  const overall=totalAll?Math.round(doneAll/totalAll*100):0;
  const op=document.getElementById('overall-pct');
  const of=document.getElementById('overall-fill');
  if(op)op.textContent=overall+'%';
  if(of)of.style.width=overall+'%';
  // Update hub card progress
  if(currentHike)updateDoc(doc(db,'trail_hikes',currentHike.id),{progress:overall}).catch(()=>{});
}

// ── DASHBOARD ──
function renderDashboard(){
  const panel=document.getElementById('ap_dash');
  if(!panel||!currentHikeData)return;
  let html='';
  Object.entries(currentHikeData).forEach(([fk,fam],fi)=>{
    const isMine=fi===userFamKey;
    let t=0,d=0;
    Object.values(fam.members).forEach(m=>m.cats.forEach(c=>c.items.forEach(i=>{t++;if(checks[i.id]?.checked)d++;})));
    const famPct=t?Math.round(d/t*100):0;
    html+=`<div class="dash-fam-section">
      <div class="dash-fam-hdr">
        <span class="dash-fam-title">🏠 ${fam.name}${isMine?' (You)':''}</span>
        <span class="dash-member-pct" style="color:${isMine?'var(--green)':'var(--teal)'}">${famPct}%</span>
      </div>`;
    Object.entries(fam.members).forEach(([mk,mv])=>{
      let mt=0,md=0;
      mv.cats.forEach(c=>c.items.forEach(i=>{mt++;if(checks[i.id]?.checked)md++;}));
      const mp=mt?Math.round(md/mt*100):0;
      const color=mp>=80?'var(--green)':mp>=40?'var(--amber)':'var(--red)';
      html+=`<div class="dash-member-row" ${isMine?`onclick="showAppTab('m_${mk}')"`:'style="cursor:default"'}>
        <span class="dash-member-name">${mv.label}</span>
        <div class="dash-member-bar"><div class="dash-member-fill" style="width:${mp}%;background:${color}"></div></div>
        <span class="dash-member-pct" style="color:${color}">${mp}%</span>
      </div>`;
    });
    html+='</div>';
  });

  // Shared items from other families
  Object.entries(currentHikeData).forEach(([fk,fam],fi)=>{
    if(fi===userFamKey)return;
    const sharedItems=[];
    Object.values(fam.members).forEach(m=>m.cats.forEach(c=>c.items.forEach(i=>{
      if(checks[i.id]?.visibility==='shared')sharedItems.push({...i,who:checks[i.id]?.who});
    })));
    if(sharedItems.length){
      html+=`<div class="card"><div class="card-title">👥 ${fam.name} — Shared Items</div>`;
      sharedItems.forEach(i=>{
        html+=`<div style="padding:9px 14px;border-top:1px solid var(--border)">
          <div style="font-size:13px;font-weight:600">${i.name} <span class="shared-badge">shared</span></div>
          <div style="font-size:11px;color:var(--muted)">Qty: ${i.qty}${i.who?' · '+i.who+' is bringing this':''}</div>
        </div>`;
      });
      html+='</div>';
    }
  });
  panel.innerHTML=html||'<div style="padding:20px;text-align:center;color:var(--muted)">No data yet</div>';
}

// ── MEMBER ──
function memberProgress(famIdx,memberKey){
  const fam=currentHikeData?.['f'+famIdx];if(!fam)return{t:0,d:0,pct:0};
  let t=0,d=0;fam.members[memberKey]?.cats.forEach(c=>c.items.forEach(i=>{t++;if(checks[i.id]?.checked)d++;}));
  return{t,d,pct:t?Math.round(d/t*100):0};
}

function renderMember(memberKey){
  const panel=document.getElementById('ap_m_'+memberKey);if(!panel)return;
  let famKey=getEditFamKey();
  if(typeof famKey==='number')famKey='f'+famKey;
  const fam=currentHikeData?.[famKey];if(!fam)return;
  const member=fam.members[memberKey];if(!member)return;
  const{t,d,pct}=memberProgress(famKey,memberKey);
  let html=`<div class="card">
    <div class="p-hdr">
      ${member.note?`<div class="p-hdr-note">${member.note}</div>`:''}
      <div class="p-hdr-row"><span class="p-hdr-lbl">Progress</span><span class="p-hdr-cnt">${d}/${t} packed</span></div>
      <div class="prog-bg"><div class="prog-fill" style="width:${pct}%"></div></div>
    </div>`;
  member.cats.forEach(cat=>{
    const catId='cat_'+memberKey+'_'+cat.cat.replace(/\W/g,'_');
    const done=cat.items.filter(i=>checks[i.id]?.checked).length;
    const total=cat.items.length;
    const allDone=done===total&&total>0;
    html+=`<div class="cat-hdr" onclick="toggleCat('${catId}')" style="cursor:pointer;user-select:none">
      <span><span id="${catId}-arrow" style="font-size:10px;margin-right:4px">${allDone?'▶':'▼'}</span>${cat.cat}</span>
      <span style="display:flex;align-items:center;gap:6px">
        <span style="font-size:10px;color:${allDone?'var(--green)':'var(--muted)'}">${done}/${total}</span>
        <button onclick="event.stopPropagation();renameCat('${memberKey}','${cat.cat.replace(/'/g,"\\'")}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;padding:2px">✏️</button>
        <button onclick="event.stopPropagation();deleteCat('${memberKey}','${cat.cat.replace(/'/g,"\\'")}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;padding:2px">🗑️</button>
        <button class="add-item-btn" onclick="event.stopPropagation();openAdd('${memberKey}','${cat.cat}',event)">+ Add</button>
      </span>
    </div>
    <div id="${catId}" style="display:${allDone?'none':'block'}">`;
    cat.items.forEach(item=>{
      const chk=checks[item.id]||{};const isChecked=chk.checked;const vis=chk.visibility;
      html+=`<div class="chk${isChecked?' checked':''}"
        ontouchstart="startLP('${item.id}','${memberKey}','pack',event)" ontouchend="endLP()" ontouchmove="endLP()"
        onmousedown="startLP('${item.id}','${memberKey}','pack',event)" onmouseup="endLP()" onmouseleave="endLP()"
        onclick="tapChk('${item.id}',event)">
        <div class="chk-box${isChecked?' done':''}"></div>
        <div class="ib">
          <div class="i-name${isChecked?' struck':''}">${item.name}${priorityBadge(item)}${vis==='shared'?'<span class="shared-badge">shared</span>':''}${vis==='private'?'<span class="priv-badge">private</span>':''}</div>
          <div class="i-qty">Qty: ${item.qty}${chk.who?' · ✓ '+chk.who:''}</div>
          ${item.note?`<div class="i-note">${item.note}</div>`:''}
        </div>
      </div>`;
    });
    html+='</div>';
  });
  html+='</div>';
  html+=`<button class="reset-link" style="text-decoration:none;color:var(--fl);font-weight:700" onclick="addCat('${memberKey}')">+ Add Category</button>`;
  html+=`<button class="reset-link" onclick="resetMember('${memberKey}')">Reset ${member.name||member.label}'s checklist</button>`;
  panel.innerHTML=html;
}

// ── SHOPPING ──
function renderShop(){
  const panel=document.getElementById('ap_shop');if(!panel)return;
  let famKey=getEditFamKey();
  if(typeof famKey==='number')famKey='f'+famKey;
  const fam=currentHikeData?.[famKey];if(!fam)return;
  let t=0,d=0;fam.shopping.forEach(c=>c.items.forEach(i=>{t++;if(checks[i.id]?.checked)d++;}));
  const pct=t?Math.round(d/t*100):0;
  let html=`<div class="card"><div class="p-hdr">
    <div style="font-size:11px;font-weight:700;color:var(--fl);margin-bottom:6px">🏠 ${fam.name} — Shopping</div>
    <div class="p-hdr-row"><span class="p-hdr-lbl">Progress</span><span class="p-hdr-cnt">${d}/${t} bought</span></div>
    <div class="prog-bg"><div class="prog-fill" style="width:${pct}%"></div></div>
  </div>`;
  fam.shopping.forEach(cat=>{
    const catId='shopcat_'+cat.cat.replace(/\W/g,'_');
    const done=cat.items.filter(i=>checks[i.id]?.checked).length;
    const total=cat.items.length;
    const allDone=done===total&&total>0;
    html+=`<div class="cat-hdr" onclick="toggleCat('${catId}')" style="cursor:pointer;user-select:none">
      <span><span id="${catId}-arrow" style="font-size:10px;margin-right:4px">${allDone?'▶':'▼'}</span>${cat.cat}</span>
      <span style="display:flex;align-items:center;gap:6px">
        <span style="font-size:10px;color:${allDone?'var(--green)':'var(--muted)'}">${done}/${total}</span>
        <button onclick="event.stopPropagation();renameCat('shopping','${cat.cat.replace(/'/g,"\\'")}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;padding:2px">✏️</button>
        <button onclick="event.stopPropagation();deleteCat('shopping','${cat.cat.replace(/'/g,"\\'")}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;padding:2px">🗑️</button>
        <button class="add-item-btn" onclick="event.stopPropagation();openAdd('shopping','${cat.cat}',event)">+ Add</button>
      </span>
    </div>
    <div id="${catId}" style="display:${allDone?'none':'block'}">`;
    cat.items.forEach(item=>{
      const isChecked=checks[item.id]?.checked;const chk=checks[item.id]||{};
      html+=`<div class="shop-row${isChecked?' checked':''}"
        ontouchstart="startLP('${item.id}','shopping','shop',event)" ontouchend="endLP()" ontouchmove="endLP()"
        onmousedown="startLP('${item.id}','shopping','shop',event)" onmouseup="endLP()" onmouseleave="endLP()"
        onclick="tapChk('${item.id}',event)">
        <div class="chk-box${isChecked?' done':''}"></div>
        <span class="shop-qty">${item.qty}</span>
        <div class="ib">
          <div class="i-name${isChecked?' struck':''}">${item.name}${priorityBadge(item)}</div>
          ${item.note?`<div class="i-note">${item.note}</div>`:''}
          ${chk.who?`<div class="i-who">✓ ${chk.who}</div>`:''}
        </div>
      </div>`;
    });
    html+='</div>';
  });
  html+='</div>';
  html+=`<button class="reset-link" style="text-decoration:none;color:var(--fl);font-weight:700" onclick="addCat('shopping')">+ Add Category</button>`;
  panel.innerHTML=html;
}

// ── MEALS ──
function renderMeals(){
  const panel=document.getElementById('ap_meals');if(!panel)return;
  if(!currentHikeData)return;
  let famKey=getEditFamKey();
  if(typeof famKey==='number')famKey='f'+famKey;
  const fam=currentHikeData?.[famKey];if(!fam)return;
  const meals=fam.meals||[];
  if(!meals.length){panel.innerHTML='<div style="padding:20px;text-align:center;color:var(--muted)">No meals planned yet</div>';return;}
  let html=`<div style="padding:0 8px">`;
  meals.forEach(day=>{
    const dayNum=day.dayNum||day.day;
    const dayName=day.dayName||day.day;
    html+=`<div class="card" style="margin-bottom:12px">
      <div class="p-hdr" style="padding:10px 14px;display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:13px;font-weight:700">${dayName}</div>
        <button onclick="removeDay(${dayNum})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px">🗑️</button>
      </div>`;
    const mealTypes=[
      {key:'breakfast',icon:'🌅',label:'Breakfast'},
      {key:'lunch',icon:'🥪',label:'Lunch'},
      {key:'dinner',icon:'🍽️',label:'Dinner'},
      {key:'snacks',icon:'🍫',label:'All-day snacks'}
    ];
    mealTypes.forEach(mt=>{
      const meal=day[mt.key]||{type:mt.label,food:'',tip:''};
      const food=meal.food||'';const tip=meal.tip||'';
      html+=`<div style="padding:11px 14px;border-top:1px solid var(--border);cursor:pointer;transition:background .15s" onclick="editMeal(${dayNum},'${mt.key}')" onmousedown="this.style.background='var(--s2)'" onmouseup="this.style.background=''" onmouseleave="this.style.background=''">
        <div style="font-size:11px;font-weight:700;color:var(--amber);margin-bottom:4px">${mt.icon} ${mt.label}</div>
        <div style="font-size:13px;font-weight:600;margin-bottom:2px">${food||'(empty)'}</div>
        ${tip?`<div style="font-size:11px;color:var(--teal);font-style:italic">💡 ${tip}</div>`:''}
      </div>`;
    });
    html+=`</div>`;
  });
  html+=`<button class="reset-link" style="text-decoration:none;color:var(--fl);font-weight:700;margin:12px 0" onclick="addDay()">+ Add Day</button>`;
  html+=`</div>`;
  panel.innerHTML=html;
}

// ── Q&A ──
function renderQA(){
  const panel=document.getElementById('ap_qa');if(!panel)return;
  let html=`<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;padding:4px 2px 8px">💬 Hike-wide — all families see this</div>
  <div class="card" style="padding:12px">
    <div class="qa-compose">
      <textarea class="qa-inp" id="qa-inp" rows="2" placeholder="Ask the whole group something…"></textarea>
      <button class="qa-send" onclick="postQA()">Post</button>
    </div>
  </div>`;
  if(!qa.length){html+=`<div style="text-align:center;color:var(--muted);font-size:13px;padding:20px">No posts yet!</div>`;}
  else{
    [...qa].reverse().forEach(post=>{
      const isMe=post.userEmail===cu?.email;
      html+=`<div class="qa-post">
        <div class="qa-meta"><span class="qa-who">${post.who}</span>${post.famName?`<span style="background:rgba(67,160,71,.15);border-radius:8px;padding:1px 7px;font-size:10px;font-weight:700;color:var(--fl)">🏠 ${post.famName}</span>`:''}<span style="margin-left:auto">${fmtTime(post.createdAt)}</span></div>
        <div class="qa-text">${post.text}</div>
        ${(post.replies||[]).length?`<div class="qa-replies">${post.replies.map(r=>`<div class="qa-reply"><span class="qa-reply-who">${r.who}: </span>${r.text}</div>`).join('')}</div>`:''}
        <div><button class="qa-btn" onclick="openReply('${post.id}')">↩ Reply</button>${isMe?`<button class="qa-btn" style="color:var(--red)" onclick="delPost('${post.id}')">Delete</button>`:''}</div>
      </div>`;
    });
  }
  panel.innerHTML=html;
}

window.postQA=async()=>{
  const inp=document.getElementById('qa-inp');const text=inp?.value.trim();if(!text||!currentHike)return;
  const fam=currentHikeData?.['f'+userFamKey];
  await addDoc(collection(db,`trail_hikes/${currentHike.id}/qa`),{text,who:cu.displayName?.split(' ')[0]||'?',famName:fam?.name||'',userEmail:cu.email,replies:[],createdAt:serverTimestamp()});
  if(inp)inp.value='';
};
window.openReply=id=>{replyCtx=id;document.getElementById('reply-modal').classList.add('open');setTimeout(()=>document.getElementById('reply-txt').focus(),150);};
window.closeReplyModal=()=>{document.getElementById('reply-modal').classList.remove('open');replyCtx=null;};
window.sendReply=async()=>{
  const text=document.getElementById('reply-txt').value.trim();
  if(!text||!replyCtx||!currentHike)return;
  const ref=doc(db,`trail_hikes/${currentHike.id}/qa`,replyCtx);
  const snap=await getDoc(ref);
  const replies=[...(snap.data().replies||[]),{who:cu.displayName?.split(' ')[0]||'?',text}];
  await updateDoc(ref,{replies});
  document.getElementById('reply-txt').value='';closeReplyModal();
};
window.delPost=async id=>{if(!currentHike)return;if(confirm('Delete post?'))await deleteDoc(doc(db,`trail_hikes/${currentHike.id}/qa`,id));};

// ── SETTINGS ──
function renderSettings(){
  const panel=document.getElementById('ap_settings');if(!panel)return;
  const name=cu?.displayName||cu?.email||'';
  let famKey=getEditFamKey();
  if(typeof famKey==='number')famKey='f'+famKey;
  const fam=currentHikeData?.[famKey];

  const memberRows=fam?Object.entries(fam.members).map(([k,v])=>`
    <div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-top:1px solid var(--border)">
      <div style="flex:1">
        <input class="add-u-inp" id="mn-${k}" style="width:100%;margin-bottom:4px;padding:7px 10px;font-size:13px"
          placeholder="Name" value="${v.name||''}">
        <div style="display:flex;gap:6px">
          <input class="add-u-inp" id="ma-${k}" style="width:60px;padding:5px 8px;font-size:12px" type="number"
            placeholder="Age" value="${v.age||''}">
          <select class="add-u-inp" id="mg-${k}" style="flex:1;padding:5px 8px;font-size:12px">
            <option value="" ${!v.gender?'selected':''}>Gender</option>
            <option value="male" ${v.gender==='male'?'selected':''}>Male</option>
            <option value="female" ${v.gender==='female'?'selected':''}>Female</option>
          </select>
          <button class="add-u-btn" style="padding:5px 12px;font-size:12px" onclick="saveMember('${k}')">💾 Save</button>
        </div>
      </div>
      ${k!=='group'?`<button class="rm-btn" onclick="removeMember('${k}')">🗑️</button>`:''}
    </div>`).join(''):'';

  // Clone options
  const cloneOpts=currentHikeData?Object.entries(currentHikeData).flatMap(([fk,f],fi)=>
    Object.entries(f.members).filter(([k])=>k!=='group').map(([k,v])=>
      `<option value="${fk}_${k}">${f.name}: ${v.label}</option>`)
  ).join(''):'';

  panel.innerHTML=`
    <div class="card">
      <div class="card-title">Signed In As</div>
      <div class="p-row">
        <div class="p-init">${ini(name)}</div>
        <div><div class="p-name">${name}</div><div class="p-email">${cu?.email||''}</div></div>
        <span class="ubadge ${isGlobalAdmin?'badge-admin':isFamilyAdmin?'badge-admin':'badge-user'}" style="margin-left:auto">${isGlobalAdmin?'🌍 Global Admin':isFamilyAdmin?'👨‍👩‍👧 Fam Admin':'👤 Member'}</span>
      </div>
      <button class="so-btn" onclick="signOut()">Sign Out</button>
    </div>

    ${fam?`<div class="card">
      <div class="card-title">🏠 My Family</div>
      <div style="padding:10px 14px 6px;display:flex;gap:8px">
        <input class="add-u-inp" id="fam-name-inp" style="flex:1;padding:8px 12px;font-size:14px;font-weight:700" value="${fam.name}">
        <button class="add-u-btn" style="padding:8px 14px" onclick="saveFamName()">Save</button>
      </div>
      ${memberRows}
      <div style="padding:10px 14px 14px;display:flex;gap:8px">
        <input class="add-u-inp" id="new-member-name" style="flex:1;padding:8px 12px;font-size:13px" placeholder="New member name">
        <button class="add-u-btn" style="padding:8px 14px" onclick="addMember()">+ Add</button>
      </div>
    </div>`:''}

    ${cloneOpts?`<div class="card">
      <div class="card-title">📋 Clone a Pack List</div>
      <div class="hint">Private items from source are excluded.</div>
      <div style="padding:0 14px 8px;display:flex;flex-direction:column;gap:8px">
        <label class="ml" style="padding:0">Clone FROM:</label>
        <select class="add-u-inp" id="clone-from" style="padding:9px 12px">${cloneOpts}</select>
        <label class="ml" style="padding:0;margin-top:4px">Clone INTO (my member):</label>
        <select class="add-u-inp" id="clone-into" style="padding:9px 12px">
          ${fam?Object.entries(fam.members).filter(([k])=>k!=='group').map(([k,v])=>`<option value="${k}">${v.label}</option>`).join(''):''}
        </select>
        <button class="add-u-btn" style="padding:10px;width:100%;margin-top:4px" onclick="cloneList()">📋 Clone List</button>
      </div>
      <div class="hint" style="color:var(--amber)">⚠️ Adds items to target — existing items kept. Private items skipped.</div>
    </div>`:''}

    ${isGlobalAdmin?`<div class="card">
      <div class="card-title">⚙️ Administration</div>
      <button class="add-u-btn" style="padding:10px;width:100%;margin:0" onclick="showAdmin()">Go to Admin Panel →</button>
    </div>`:''}
  `;
}

// Helper: return the family key that's being edited (either user's own or admin editing another)
function getEditFamKey(){return editingFamKey!==null?editingFamKey:userFamKey;}

window.showAdmin=()=>{
  // Clear hike context so admin page doesn't auto-redirect to adventure
  localStorage.removeItem('trail_lastHikeId');
  window.location.href='admin.html';
};

function renderAdmin(){
  if(!isGlobalAdmin)return;
  const content=document.getElementById('admin-content');
  if(!content)return;

  content.innerHTML=`
    <div class="admin-tabs">
      <button class="admin-tab-btn active" onclick="switchAdminTab('users')">👥 Users & Families</button>
      <button class="admin-tab-btn" onclick="switchAdminTab('hikes')">🏔️ Adventure Management</button>
      <button class="admin-tab-btn" onclick="switchAdminTab('repair')">🔧 Data Repair</button>
    </div>

    <div id="admin-tab-users" class="admin-tab-content">
      <div class="card" style="border-color:rgba(255,179,0,.3)">
        <div class="card-title" style="color:var(--amber)">Users & Family Assignment</div>
        <div style="padding:0 14px 14px">
          <div style="font-size:11px;font-weight:700;color:var(--amber);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">All Users</div>
          <div class="u-list" style="padding:0;margin-bottom:10px">${users.map(u=>{
            const famIdx=u.familyKey!==null&&u.familyKey!==undefined?u.familyKey:null;
            const famName=famIdx!==null?(currentHike?.families?.[famIdx]?.name||'Fam '+famIdx):'Unassigned';
            const roleLabel=u.role==='globalAdmin'?'🌍 Global Admin':u.role==='familyAdmin'?'👨‍👩‍👧 Fam Admin':'👤 Member';
            const roleBg=u.role==='globalAdmin'?'badge-admin':u.role==='familyAdmin'?'badge-admin':'badge-user';
            return`<div class="u-item" style="flex-wrap:wrap;gap:6px">
              <div class="u-item-info" style="flex:1;min-width:120px">
                <div class="u-item-name">${u.name||u.email.split('@')[0]}</div>
                <div class="u-item-email">${u.email}</div>
                <div style="font-size:10px;color:var(--fl);margin-top:2px">📍 ${famName}</div>
              </div>
              <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
                <span class="ubadge ${roleBg}" style="font-size:9px">${roleLabel}</span>
                <div style="display:flex;gap:4px">
                  <button onclick="sendInviteEmail('${u.email}')" title="Open a pre-filled email invite" style="background:none;border:1px solid var(--border);border-radius:6px;color:var(--blue);font-size:10px;font-weight:700;padding:3px 8px;cursor:pointer">✉️ Invite</button>
                  <button onclick="openAssignUser('${u.email}')" style="background:none;border:1px solid var(--border);border-radius:6px;color:var(--fl);font-size:10px;font-weight:700;padding:3px 8px;cursor:pointer">Edit${u.email===cu?.email?' (You)':''}</button>
                </div>
              </div>
            </div>`;
          }).join('')}</div>
          <div style="display:flex;gap:6px">
            <input class="add-u-inp" id="add-u-email" type="email" placeholder="Add: friend@gmail.com" style="flex:1;padding:8px 12px;font-size:13px">
            <button class="add-u-btn" onclick="addUser()">Add</button>
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:8px">This app can't send emails itself — after adding someone, tap ✉️ Invite to open a pre-filled email (or just message them) telling them to sign in with Google using this exact address.</div>
        </div>
      </div>
    </div>

    <div id="admin-tab-hikes" class="admin-tab-content" style="display:none">
      <div class="card">
        <div class="card-title">🗄️ Archive This Adventure</div>
        <div style="padding:0 14px 14px">
          <button onclick="archiveHike()" style="background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:10px;color:var(--muted);font-size:13px;font-weight:600;padding:12px;cursor:pointer;width:100%">${currentHike?.archived?'Unarchive Adventure':'Archive This Adventure'}</button>
        </div>
      </div>
      <div class="card" style="border-color:rgba(239,83,80,.3)">
        <div class="card-title" style="color:var(--red)">🗑️ Delete This Adventure</div>
        <div style="padding:0 14px 14px">
          <div class="hint" style="margin-bottom:8px">Permanently deletes this adventure and all its checklists, meals, and posts. This cannot be undone — archiving is usually safer if you just want it out of the way.</div>
          <button onclick="deleteHike()" style="background:rgba(239,83,80,.1);border:1px solid var(--red);border-radius:10px;color:var(--red);font-size:13px;font-weight:600;padding:12px;cursor:pointer;width:100%">Delete This Adventure Permanently</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">⚠️ Reset</div>
        <div style="padding:0 14px 14px">
          <button onclick="resetAll()" style="background:rgba(239,83,80,.1);border:1px solid var(--red);border-radius:10px;color:var(--red);font-size:13px;font-weight:600;padding:12px;cursor:pointer;width:100%">Reset all family checklists</button>
        </div>
      </div>
    </div>

    <div id="admin-tab-repair" class="admin-tab-content" style="display:none">
      <div class="card" style="border-color:rgba(255,179,0,.3)">
        <div class="card-title" style="color:var(--amber)">Data Repair</div>
        <div style="padding:0 14px 14px">
          <div style="font-size:11px;font-weight:700;color:var(--amber);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Utilities</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button onclick="repairFindUnassigned()" style="background:rgba(255,179,0,.08);border:1px solid rgba(255,179,0,.3);border-radius:10px;color:var(--amber);font-size:13px;font-weight:600;padding:11px;cursor:pointer;width:100%">🔍 Find users without a family</button>
            <button onclick="repairExportJSON()" style="background:rgba(100,181,246,.08);border:1px solid rgba(100,181,246,.3);border-radius:10px;color:var(--blue);font-size:13px;font-weight:600;padding:11px;cursor:pointer;width:100%">📤 Export adventure data (JSON)</button>
          </div>
          <div id="repair-log" style="background:#071510;border-radius:8px;padding:10px;font-size:12px;color:var(--green);font-family:monospace;margin-top:10px;display:none;max-height:200px;overflow-y:auto;line-height:1.6"></div>
        </div>
      </div>
    </div>
  `;
}

window.switchAdminTab=tab=>{
  document.querySelectorAll('.admin-tab-content').forEach(el=>el.style.display='none');
  document.querySelectorAll('.admin-tab-btn').forEach(el=>el.classList.remove('active'));
  document.getElementById('admin-tab-'+tab).style.display='block';
  event.target.classList.add('active');
};

// ── PERSIST FAMILY ──
async function persistFamily(famIdx){
    if(!currentHike || !currentHikeData) return;

    const fam = currentHikeData['f' + famIdx];
    if(!fam) return;

    const membersArr = Object.entries(fam.members)
        .filter(([k]) => k !== 'group')
        .map(([,v]) => ({
            name: v.name || '',
            age: v.age || '',
            gender: v.gender || '',
            note: v.note || '',
            cats: v.cats || []
        }));

    const groupCatsData = fam.members['group']?.cats || [];

    const families = (currentHike.families || []).map((f,i)=>
        i===famIdx
            ? {...f,name:fam.name,members:membersArr,groupCats:groupCatsData,shopping:fam.shopping||[]}
            : f
    );

    try{
        await updateDoc(doc(db,'trail_hikes',currentHike.id),{families});
        currentHike.families = families;
    }catch(e){
        showToast('⚠️ Could not save — check your connection','#EF5350');
    }
}

window.saveFamName=async()=>{
  const val=document.getElementById('fam-name-inp')?.value.trim();
  if(!val||!currentHikeData)return;
  let famKey=getEditFamKey();
  if(typeof famKey==='number')famKey='f'+famKey;
  currentHikeData[famKey].name=val;
  document.getElementById('u-fam').textContent=val;
  buildFamCards();renderDashboard();
  await persistFamily(famKey);
  showToast('✅ Family name updated');
};

// Saves one person's name/age/gender in a single tap. This deliberately
// avoids rebuilding the whole Settings panel or tab bar (that's what was
// causing the "kicked out of settings" feeling) — it only patches the
// tiny bits elsewhere that show this person's name (their tab label and
// the dashboard), then persists.
window.saveMember=async k=>{
  if(!currentHikeData)return;
  let famKey=getEditFamKey();
  if(typeof famKey==='number')famKey='f'+famKey;
  const fam=currentHikeData[famKey];const m=fam?.members[k];if(!m)return;
  const name=document.getElementById('mn-'+k)?.value.trim();
  if(!name){showToast('Name can\'t be empty','#EF5350');return;}
  const age=document.getElementById('ma-'+k)?.value.trim()||'';
  const gender=document.getElementById('mg-'+k)?.value||'';
  m.name=name;m.age=age;m.gender=gender;m.label=name+(age?' ('+age+')':'');
  const tab=document.querySelector(`.app-tab[data-tab-id="m_${k}"]`);
  if(tab)tab.textContent='🎒 '+name.split(' ')[0];
  renderDashboard();updateFamCards();
  await persistFamily(famKey);
  showToast('✅ '+name+' saved');
};
window.addMember=async()=>{
  const inp=document.getElementById('new-member-name');
  const name=inp?.value.trim();if(!name){showToast('Enter a name','#EF5350');return;}
  if(!currentHikeData)return;
  let famKey=getEditFamKey();
  if(typeof famKey==='number')famKey='f'+famKey;
  const fam=currentHikeData[famKey];
  const key='m'+Date.now();
  const px=`${currentHike?.id}_f${famKey}_${key}_`;
  fam.members[key]={label:name,name,age:'',gender:'',note:'',cats:baseCats(px)};
  inp.value='';buildAppTabs();renderAppAll();renderSettings();
  await persistFamily(famKey);
  showToast('✅ '+name+' added!');
};
window.removeMember=async k=>{
  if(!currentHikeData)return;
  let famKey=getEditFamKey();
  if(typeof famKey==='number')famKey='f'+famKey;
  const fam=currentHikeData[famKey];
  if(!fam?.members[k])return;
  const lbl=fam.members[k].label;
  if(!confirm('Remove '+lbl+'?'))return;
  delete fam.members[k];
  buildAppTabs();renderAppAll();renderSettings();
  await persistFamily(famKey);
  showToast(lbl+' removed');
};
window.cloneList=()=>{
  const fromVal=document.getElementById('clone-from')?.value;
  const intoKey=document.getElementById('clone-into')?.value;
  if(!fromVal||!intoKey||!currentHikeData){showToast('Select source and target','#EF5350');return;}
  if(!confirm('Clone list? Existing items kept. Private items skipped.'))return;
  const[srcFamKey,srcMemberKey]=fromVal.split('_');
  const srcFam=currentHikeData[srcFamKey];
  const srcMember=srcFam?.members[srcMemberKey];
  if(!srcMember){showToast('Source not found','#EF5350');return;}
  const targetMember=currentHikeData['f'+getEditFamKey()]?.members[intoKey];
  if(!targetMember){showToast('Target not found','#EF5350');return;}
  const existingNames=new Set();
  targetMember.cats.forEach(c=>c.items.forEach(i=>existingNames.add(i.name.toLowerCase())));
  let added=0;
  srcMember.cats.forEach(cat=>{
    cat.items.forEach(srcItem=>{
      if(checks[srcItem.id]?.visibility==='private')return;
      if(existingNames.has(srcItem.name.toLowerCase()))return;
      const newId='clone_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
      const newItem={id:newId,name:srcItem.name,qty:srcItem.qty,note:srcItem.note||''};
      const tCat=targetMember.cats.find(c=>c.cat===cat.cat)||targetMember.cats[0];
      tCat.items.push(newItem);existingNames.add(srcItem.name.toLowerCase());added++;
    });
  });
  buildAppTabs();renderAppAll();showToast(`✅ ${added} item${added!==1?'s':''} cloned!`);
};

window.addUser=async()=>{
  const email=document.getElementById('add-u-email')?.value.trim().toLowerCase();
  if(!email||!email.includes('@')){showToast('Enter a valid email','#EF5350');return;}
  const exists=await getDoc(doc(db,'trail_users',email));
  if(exists.exists()){
    showToast('User already exists — opening their settings','#FFB300');
    openAssignUser(email);
    return;
  }
  await setDoc(doc(db,'trail_users',email),{email,name:'',role:'member',familyKey:null,addedBy:cu.email,addedAt:serverTimestamp()});
  document.getElementById('add-u-email').value='';
  showToast('✅ '+email+' added!');
  // Make sure the local users list has the new record, then go straight
  // into role + family assignment so it's all done in one flow.
  if(!users.find(u=>u.email===email))users.push({email,name:'',role:'member',roles:['familyMember'],familyKey:null});
  openAssignUser(email);
};

// Opens the user's default mail app with a pre-filled invite. There is no
// backend email service wired up, so this is the closest thing to a
// one-click "email invite" — it just prepares the message for you to send.
window.sendInviteEmail=email=>{
  const hikeName=currentHike?.name||'our hike';
  const subject=`You're invited to ${hikeName} on Trail Adventures`;
  const body=`Hi!\n\nYou've been added to "${hikeName}" on Trail Adventures.\n\nTo get access, just open the app link and sign in with Google using this exact email address:\n${email}\n\nSee you on the trail!`;
  window.location.href=`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
window.rmUser=async email=>{
  if(email===cu?.email){showToast('Cannot remove yourself','#FFB300');return;}
  if(!confirm('Remove '+email+'?'))return;
  await deleteDoc(doc(db,'trail_users',email));
};

// ── ASSIGN USER MODAL ──
let assignCtx=null;
window.openAssignUser=email=>{
  const u=users.find(u=>u.email===email);if(!u)return;
  assignCtx=email;
  const fams=currentHike?.families||[];
  const famOpts=fams.map((f,i)=>`<option value="${i}" ${u.familyKey===i?'selected':''}>${f.name}</option>`).join('');
  // roles is now an array e.g. ['globalAdmin','familyMember']
  // fall back: if old single role string exists, convert
  const userRoles=Array.isArray(u.roles)?u.roles:(u.role?[u.role]:[]);
  const roleChecks=[
    {id:'globalAdmin',label:'🌍 Global Admin',desc:'Can see & manage everything'},
    {id:'familyAdmin',label:'👨‍👩‍👧 Family Admin',desc:'Manages their own family'},
    {id:'familyMember',label:'👤 Family Member',desc:'Packs their own checklist'},
  ].map(r=>`
    <label style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer">
      <input type="checkbox" id="role-${r.id}" ${userRoles.includes(r.id)?'checked':''} style="width:18px;height:18px;accent-color:var(--fl);margin-top:2px;flex-shrink:0">
      <div><div style="font-size:13px;font-weight:700">${r.label}</div><div style="font-size:11px;color:var(--muted)">${r.desc}</div></div>
    </label>`).join('');

  document.querySelector('#reply-modal h3').textContent='Edit: '+(u.name||u.email.split('@')[0]);
  document.getElementById('reply-txt').style.display='none';
  const extra=document.getElementById('assign-extra')||(() => {
    const d=document.createElement('div');d.id='assign-extra';
    document.querySelector('#reply-modal .modal').insertBefore(d,document.querySelector('#reply-modal .mbtns'));
    return d;
  })();
  extra.innerHTML=`
    <div style="margin-bottom:14px">
      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Family</div>
      <select class="mi" id="assign-fam" style="padding:10px 12px">
        <option value="">— Unassigned —</option>${famOpts}
      </select>
    </div>
    <div>
      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Roles (pick all that apply)</div>
      ${roleChecks}
    </div>`;
  extra.style.display='block';
  document.querySelector('#reply-modal .mbtns .m-save').textContent='Save';
  document.querySelector('#reply-modal .mbtns .m-save').onclick=saveAssignUser;
  document.querySelector('#reply-modal .mbtns .m-cancel').onclick=closeAssignUser;
  document.getElementById('reply-modal').classList.add('open');
};
function closeAssignUser(){
  document.getElementById('reply-modal').classList.remove('open');
  const extra=document.getElementById('assign-extra');if(extra)extra.style.display='none';
  document.getElementById('reply-txt').style.display='';
  assignCtx=null;
}
async function saveAssignUser(){
  if(!assignCtx)return;
  const famVal=document.getElementById('assign-fam')?.value;
  const famKey=famVal===''||famVal===undefined?null:parseInt(famVal);
  const roles=['globalAdmin','familyAdmin','familyMember'].filter(r=>document.getElementById('role-'+r)?.checked);
  if(!roles.length)roles.push('familyMember'); // always at least member
  // Derive primary role for backward compat
  const primaryRole=roles.includes('globalAdmin')?'globalAdmin':roles.includes('familyAdmin')?'familyAdmin':'member';
  await updateDoc(doc(db,'trail_users',assignCtx),{roles,role:primaryRole,familyKey:famKey});
  // Update local state if editing self
  if(assignCtx===cu?.email){
    userRole=primaryRole;isGlobalAdmin=roles.includes('globalAdmin');
    isFamilyAdmin=roles.includes('familyAdmin');isAdmin=isGlobalAdmin;
  }
  showToast('✅ Saved');closeAssignUser();renderSettings();
}

// ── DATA REPAIR ──
window.repairFindUnassigned=async()=>{
  const log=document.getElementById('repair-log');log.style.display='block';log.innerHTML='';
  const addLog=(msg,color='#4CAF50')=>{const d=document.createElement('div');d.style.color=color;d.textContent='['+new Date().toLocaleTimeString()+'] '+msg;log.appendChild(d);log.scrollTop=log.scrollHeight;};
  addLog('Scanning users…');
  const snap=await getDocs(collection(db,'trail_users'));
  let unassigned=0;
  snap.docs.forEach(d=>{
    const data=d.data();
    if(data.familyKey===null||data.familyKey===undefined){
      addLog('⚠️ Unassigned: '+data.email,'#FFB300');unassigned++;
    }
  });
  addLog(unassigned?`Found ${unassigned} unassigned user(s) — use Edit to assign them.`:'All users are assigned! ✅');
};
window.repairExportJSON=async()=>{
  if(!currentHike)return;
  const log=document.getElementById('repair-log');log.style.display='block';log.innerHTML='';
  const addLog=msg=>{const d=document.createElement('div');d.textContent=msg;log.appendChild(d);};
  addLog('Exporting…');
  const checksSnap=await getDocs(collection(db,`trail_hikes/${currentHike.id}/checks`));
  const mealsSnap=await getDocs(collection(db,`trail_hikes/${currentHike.id}/meals`));
  const qaSnap=await getDocs(collection(db,`trail_hikes/${currentHike.id}/qa`));
  const out={hike:currentHike,checks:Object.fromEntries(checksSnap.docs.map(d=>[d.id,d.data()])),meals:Object.fromEntries(mealsSnap.docs.map(d=>[d.id,d.data()])),qa:qaSnap.docs.map(d=>({id:d.id,...d.data()}))};
  const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`trail-export-${currentHike.id}.json`;a.click();
  addLog('✅ Downloaded');
};
window.archiveHike=async()=>{
  if(!currentHike||(!isGlobalAdmin&&!isFamilyAdmin))return;
  const archived=!currentHike.archived;
  await updateDoc(doc(db,'trail_hikes',currentHike.id),{archived});
  currentHike.archived=archived;
  showToast(archived?'Hike archived':'Hike unarchived');
  renderSettings();
};

window.deleteHike=async()=>{
  if(!currentHike||!isGlobalAdmin)return;
  const name=currentHike.name;
  const typed=prompt(`This permanently deletes "${name}" and all its checklists, meals, and posts. This can't be undone.\n\nType the hike name to confirm:`);
  if(typed===null)return;
  if(typed.trim()!==name){showToast("Name didn't match — nothing deleted",'#FFB300');return;}
  try{
    showToast('Deleting…','#FFB300');
    const[checksSnap,mealsSnap,qaSnap]=await Promise.all([
      getDocs(collection(db,`trail_hikes/${currentHike.id}/checks`)),
      getDocs(collection(db,`trail_hikes/${currentHike.id}/meals`)),
      getDocs(collection(db,`trail_hikes/${currentHike.id}/qa`)),
    ]);
    await Promise.all([
      ...checksSnap.docs.map(d=>deleteDoc(d.ref)),
      ...mealsSnap.docs.map(d=>deleteDoc(d.ref)),
      ...qaSnap.docs.map(d=>deleteDoc(d.ref)),
    ]);
    await deleteDoc(doc(db,'trail_hikes',currentHike.id));
    localStorage.removeItem('trail_lastHikeId');
    showToast('🗑️ Hike deleted');
    showHub();
  }catch(e){
    showToast('⚠️ Could not delete — check your connection','#EF5350');
  }
};

// ── HIKE MANAGER (from hub) ──
window.openHikeManager=async hikeId=>{
  if(!isGlobalAdmin)return;
  const hike=allHikes.find(h=>h.id===hikeId);
  if(!hike)return;
  hikeManagerCtx=hike;
  document.getElementById('hm-name').value=hike.name||'';
  document.getElementById('hm-location').value=hike.location||'';
  // Try to parse existing dates string into from/to, or use stored dateFrom/dateTo fields
  document.getElementById('hm-date-from').value=hike.dateFrom||'';
  document.getElementById('hm-date-to').value=hike.dateTo||'';
  document.getElementById('hm-image').value=hike.imageUrl||'';
  document.getElementById('hm-archive-btn').textContent=hike.archived?'Unarchive This Adventure':'Archive This Adventure';
  document.getElementById('hike-manager-modal').classList.add('open');
};
window.closeHikeManager=()=>{document.getElementById('hike-manager-modal').classList.remove('open');hikeManagerCtx=null;};
window.saveHikeDetails=async()=>{
  if(!hikeManagerCtx)return;
  const name=document.getElementById('hm-name').value.trim();
  const location=document.getElementById('hm-location').value.trim();
  const dateFrom=document.getElementById('hm-date-from').value;
  const dateTo=document.getElementById('hm-date-to').value;
  const imageUrl=document.getElementById('hm-image').value.trim();
  if(!name){showToast('Hike name is required','#EF5350');return;}
  
  // Format dates nicely for display (e.g., "7-9 August 2026")
  let dates='';
  if(dateFrom&&dateTo){
    const from=new Date(dateFrom);
    const to=new Date(dateTo);
    const fromDay=from.getDate();
    const toDay=to.getDate();
    const month=from.toLocaleString('en-US',{month:'long'});
    const year=from.getFullYear();
    dates=fromDay===toDay?`${fromDay} ${month} ${year}`:`${fromDay}-${toDay} ${month} ${year}`;
  }else if(dateFrom){
    const from=new Date(dateFrom);
    dates=from.toLocaleDateString('en-US',{day:'numeric',month:'long',year:'numeric'});
  }
  
  try{
    await updateDoc(doc(db,'trail_hikes',hikeManagerCtx.id),{name,location,dates,dateFrom,dateTo,imageUrl});
    // Update local cache
    const idx=allHikes.findIndex(h=>h.id===hikeManagerCtx.id);
    if(idx>=0){allHikes[idx]={...allHikes[idx],name,location,dates,dateFrom,dateTo,imageUrl};}
    closeHikeManager();
    renderHub();
    showToast('✅ Hike details saved');
  }catch(e){
    showToast('⚠️ Could not save — check your connection','#EF5350');
  }
};
window.archiveHikeFromManager=async()=>{
  if(!hikeManagerCtx)return;
  const archived=!hikeManagerCtx.archived;
  try{
    await updateDoc(doc(db,'trail_hikes',hikeManagerCtx.id),{archived});
    const idx=allHikes.findIndex(h=>h.id===hikeManagerCtx.id);
    if(idx>=0)allHikes[idx].archived=archived;
    document.getElementById('hm-archive-btn').textContent=archived?'Unarchive This Adventure':'Archive This Adventure';
    renderHub();
    showToast(archived?'Adventure archived':'Adventure unarchived');
  }catch(e){
    showToast('⚠️ Could not update — check your connection','#EF5350');
  }
};
window.deleteHikeFromManager=async()=>{
  if(!hikeManagerCtx||!isGlobalAdmin)return;
  const name=hikeManagerCtx.name;
  const typed=prompt(`This permanently deletes "${name}" and all its data. This can't be undone.\n\nType the adventure name to confirm:`);
  if(typed===null)return;
  if(typed.trim()!==name){showToast("Name didn't match — nothing deleted",'#FFB300');return;}
  try{
    showToast('Deleting…','#FFB300');
    const[checksSnap,qaSnap]=await Promise.all([
      getDocs(collection(db,`trail_hikes/${hikeManagerCtx.id}/checks`)),
      getDocs(collection(db,`trail_hikes/${hikeManagerCtx.id}/qa`)),
    ]);
    await Promise.all([
      ...checksSnap.docs.map(d=>deleteDoc(d.ref)),
      ...qaSnap.docs.map(d=>deleteDoc(d.ref)),
    ]);
    await deleteDoc(doc(db,'trail_hikes',hikeManagerCtx.id));
    allHikes=allHikes.filter(h=>h.id!==hikeManagerCtx.id);
    closeHikeManager();
    renderHub();
    showToast('🗑️ Adventure deleted');
  }catch(e){
    showToast('⚠️ Could not delete — check your connection','#EF5350');
  }
};

// ── CHECK ITEMS ──
window.startLP=(itemId,member,type,e)=>{
  lpWasLong=false;
  lpTimer=setTimeout(()=>{lpWasLong=true;openCtx(itemId,member,type);},500);
};
window.endLP=()=>{if(lpTimer){clearTimeout(lpTimer);lpTimer=null;}};
window.tapChk=async(itemId,e)=>{
  if(lpWasLong){lpWasLong=false;return;}
  if(!currentHike)return;
  const chk=checks[itemId];const nowChecked=!chk?.checked;
  if(nowChecked){
    await setDoc(doc(db,`trail_hikes/${currentHike.id}/checks`,itemId),{...(chk||{}),checked:true,who:cu.displayName?.split(' ')[0]||'?',userEmail:cu.email,when:serverTimestamp()},{merge:true});
  } else {
    if(chk?.visibility){await updateDoc(doc(db,`trail_hikes/${currentHike.id}/checks`,itemId),{checked:false,who:null,when:null});}
    else{await deleteDoc(doc(db,`trail_hikes/${currentHike.id}/checks`,itemId));}
  }
};

function openCtx(itemId,member,type){
  const chk=checks[itemId]||{};const vis=chk.visibility;
  const isOther=type==='other_readonly';
  ctxCtx={itemId,member,type};

  // Find item name — search all fams if other
  let name='Item';let srcItem=null;
  if(isOther){
    Object.values(currentHikeData||{}).forEach(fam=>
      Object.values(fam.members||{}).forEach(m=>
        m.cats.forEach(c=>c.items.forEach(i=>{if(i.id===itemId){name=i.name;srcItem=i;}}))
      )
    );
  } else if(member&&currentHikeData){
    const fam=currentHikeData['f'+userFamKey];
    if(member==='shopping'){fam?.shopping.forEach(c=>c.items.forEach(i=>{if(i.id===itemId){name=i.name;srcItem=i;}}));}
    else{fam?.members[member]?.cats.forEach(c=>c.items.forEach(i=>{if(i.id===itemId){name=i.name;srcItem=i;}}));}
  }
  document.getElementById('ctx-title').textContent=name;

  // Show/hide options based on context
  document.getElementById('ctx-edit').style.display=isOther?'none':'flex';
  document.getElementById('ctx-shared').style.display=(!isOther&&vis!=='shared')?'flex':'none';
  document.getElementById('ctx-private').style.display=(!isOther&&vis!=='private')?'flex':'none';
  document.getElementById('ctx-unmark').style.display=(!isOther&&vis)?'flex':'none';
  document.getElementById('ctx-delete').style.display=isOther?'none':'flex';

  // Clone-to-me button (only for other family items)
  let cloneBtn=document.getElementById('ctx-clone');
  if(!cloneBtn){
    cloneBtn=document.createElement('button');
    cloneBtn.id='ctx-clone';cloneBtn.className='ctx-opt';
    cloneBtn.innerHTML='<span class="ctx-icon">📋</span>Clone this item to my list';
    document.getElementById('ctx-delete').before(cloneBtn);
  }
  cloneBtn.style.display=isOther?'flex':'none';
  cloneBtn.onclick=()=>{closeCtx();if(srcItem)promptCloneItem(srcItem);};

  document.getElementById('ctx-edit').onclick=()=>{closeCtx();openEditModal(itemId,member,type);};
  document.getElementById('ctx-shared').onclick=async()=>{await setVis(itemId,'shared');closeCtx();};
  document.getElementById('ctx-private').onclick=async()=>{await setVis(itemId,'private');closeCtx();};
  document.getElementById('ctx-unmark').onclick=async()=>{await setVis(itemId,null);closeCtx();};
  document.getElementById('ctx-delete').onclick=()=>{closeCtx();delItem(itemId,member,type);};
  document.getElementById('ctx-bg').classList.add('open');
}

// Show member picker before cloning
let cloneSrcItem=null;
window.promptCloneItem=srcItem=>{
  cloneSrcItem=srcItem;
  const myFam=currentHikeData?.['f'+userFamKey];
  if(!myFam)return;
  const members=Object.entries(myFam.members).filter(([k])=>k!=='group');
  const checksHtml=members.map(([k,v])=>`
    <label style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer">
      <input type="checkbox" id="clone-to-${k}" style="width:18px;height:18px;accent-color:var(--fl)">
      <span style="font-size:14px;font-weight:600">${v.name||v.label.split(' ')[0]}</span>
    </label>`).join('');
  document.querySelector('#reply-modal h3').textContent='Clone to…';
  document.getElementById('reply-txt').style.display='none';
  const extra=document.getElementById('assign-extra')||(() => {
    const d=document.createElement('div');d.id='assign-extra';
    document.querySelector('#reply-modal .modal').insertBefore(d,document.querySelector('#reply-modal .mbtns'));
    return d;
  })();
  extra.innerHTML=`<div style="font-size:13px;color:var(--muted);margin-bottom:8px">Cloning: <strong>${srcItem.name}</strong></div>${checksHtml}`;
  extra.style.display='block';
  document.querySelector('#reply-modal .mbtns .m-save').textContent='Clone ✓';
  document.querySelector('#reply-modal .mbtns .m-save').onclick=doCloneToSelected;
  document.querySelector('#reply-modal .mbtns .m-cancel').onclick=closeAssignUser;
  document.getElementById('reply-modal').classList.add('open');
};

function doCloneToSelected(){
  if(!cloneSrcItem||!currentHikeData)return;
  const myFam=currentHikeData['f'+userFamKey];
  const members=Object.entries(myFam.members).filter(([k])=>k!=='group');
  let cloned=0;
  members.forEach(([k,v])=>{
    if(!document.getElementById('clone-to-'+k)?.checked)return;
    // Find matching cat or use first
    const srcCatName=Object.values(currentHikeData).flatMap(f=>Object.values(f.members)).flatMap(m=>m.cats).find(c=>c.items.some(i=>i.id===cloneSrcItem.id))?.cat;
    const targetCat=v.cats.find(c=>c.cat===srcCatName)||v.cats[0];
    if(targetCat.items.some(i=>i.name.toLowerCase()===cloneSrcItem.name.toLowerCase())){return;}
    const newId='clone_'+Date.now()+'_'+Math.random().toString(36).slice(2,5);
    targetCat.items.push({id:newId,name:cloneSrcItem.name,qty:cloneSrcItem.qty,note:cloneSrcItem.note||''});
    renderMember(k);cloned++;
  });
  closeAssignUser();cloneSrcItem=null;
  showToast(cloned?`✅ Cloned to ${cloned} member${cloned>1?'s':''}!`:'No members selected','#FFB300');
}
window.closeCtx=()=>document.getElementById('ctx-bg').classList.remove('open');

async function setVis(itemId,vis){
  if(!currentHike)return;
  const chk=checks[itemId]||{};
  if(vis){await setDoc(doc(db,`trail_hikes/${currentHike.id}/checks`,itemId),{...chk,visibility:vis,who:chk.who||cu.displayName?.split(' ')[0]||'?'},{merge:true});}
  else{await updateDoc(doc(db,`trail_hikes/${currentHike.id}/checks`,itemId),{visibility:null}).catch(()=>{});}
}

function openEditModal(itemId,member,type){
  if(!currentHikeData)return;
  const fam=currentHikeData['f'+userFamKey];let item=null;
  if(member==='shopping'){fam?.shopping.forEach(c=>c.items.forEach(i=>{if(i.id===itemId)item=i;}));}
  else{fam?.members[member]?.cats.forEach(c=>c.items.forEach(i=>{if(i.id===itemId)item=i;}));}
  if(!item)return;
  editCtx={itemId,member,type,item};
  document.getElementById('e-name').value=item.name;
  document.getElementById('e-qty').value=item.qty;
  document.getElementById('e-note').value=item.note||'';
  document.getElementById('e-priority').value=item.priority||(item.crit?'critical':'recommended');
  document.getElementById('edit-modal').classList.add('open');
  setTimeout(()=>document.getElementById('e-name').focus(),150);
}
window.closeEditModal=()=>{document.getElementById('edit-modal').classList.remove('open');editCtx=null;};
window.saveEdit=async()=>{
  if(!editCtx)return;const{item,member}=editCtx;
  item.name=document.getElementById('e-name').value.trim()||item.name;
  item.qty=document.getElementById('e-qty').value.trim()||item.qty;
  item.note=document.getElementById('e-note').value.trim();
  item.priority=document.getElementById('e-priority').value;
  item.crit=item.priority==='critical'; // keep legacy flag in sync
  closeEditModal();
  if(member==='shopping')renderShop();else renderMember(member);
  showToast('✅ Updated');
  await persistFamily(userFamKey);
};

async function delItem(itemId,member,type){
  if(!confirm('Delete this item?')||!currentHikeData)return;
  const fam=currentHikeData['f'+userFamKey];
  if(member==='shopping'){fam?.shopping.forEach(c=>{c.items=c.items.filter(i=>i.id!==itemId);});}
  else{fam?.members[member]?.cats.forEach(c=>{c.items=c.items.filter(i=>i.id!==itemId);});}
  if(currentHike)deleteDoc(doc(db,`trail_hikes/${currentHike.id}/checks`,itemId)).catch(()=>{});
  if(member==='shopping')renderShop();else renderMember(member);
  showToast('Deleted');
  await persistFamily(userFamKey);
}

window.openAdd=(member,cat,e)=>{
  e.stopPropagation();addCtx={member,cat};
  document.getElementById('a-name').value='';document.getElementById('a-qty').value='1';document.getElementById('a-note').value='';
  document.getElementById('a-priority').value='recommended';
  document.getElementById('add-modal').classList.add('open');
  setTimeout(()=>document.getElementById('a-name').focus(),150);
};
window.closeAddModal=()=>{document.getElementById('add-modal').classList.remove('open');addCtx=null;};
window.saveAdd=async()=>{
  const name=document.getElementById('a-name').value.trim();if(!name){showToast('Enter a name','#EF5350');return;}
  const qty=document.getElementById('a-qty').value.trim()||'1';const note=document.getElementById('a-note').value.trim();
  const priority=document.getElementById('a-priority').value;
  const newItem={id:'c_'+Date.now(),name,qty,note,priority,crit:priority==='critical'};const{member,cat}=addCtx;
  const fam=currentHikeData?.['f'+userFamKey];
  if(member==='shopping'){const c=fam?.shopping.find(c=>c.cat===cat);if(c)c.items.push(newItem);}
  else{fam?.members[member]?.cats.forEach(c=>{if(c.cat===cat)c.items.push(newItem);});}
  closeAddModal();if(member==='shopping')renderShop();else renderMember(member);showToast('✅ Added');
  await persistFamily(userFamKey);
};

// ── CATEGORY MANAGEMENT (add / rename / delete whole categories) ──
window.addCat=async member=>{
  const val=prompt('New category name:');
  if(!val||!val.trim())return;
  const famKey=getEditFamKey();
  const fam=currentHikeData?.['f'+famKey];if(!fam)return;
  const arr=member==='shopping'?fam.shopping:fam.members[member]?.cats;
  if(!arr)return;
  if(arr.some(c=>c.cat.toLowerCase()===val.trim().toLowerCase())){showToast('That category already exists','#FFB300');return;}
  arr.push({cat:val.trim(),items:[]});
  if(member==='shopping')renderShop();else renderMember(member);
  showToast('✅ Category added');
  await persistFamily(famKey);
};
window.renameCat=async(member,oldName)=>{
  const val=prompt('Rename category:',oldName);
  if(!val||!val.trim()||val.trim()===oldName)return;
  const famKey=getEditFamKey();
  const fam=currentHikeData?.['f'+famKey];if(!fam)return;
  const arr=member==='shopping'?fam.shopping:fam.members[member]?.cats;
  const c=arr?.find(c=>c.cat===oldName);if(!c)return;
  c.cat=val.trim();
  if(member==='shopping')renderShop();else renderMember(member);
  showToast('✅ Renamed');
  await persistFamily(famKey);
};
window.deleteCat=async(member,catName)=>{
  if(!confirm(`Delete "${catName}" and all its items? This can't be undone.`))return;
  const famKey=getEditFamKey();
  const fam=currentHikeData?.['f'+famKey];if(!fam)return;
  const arr=member==='shopping'?fam.shopping:fam.members[member]?.cats;
  const idx=arr?.findIndex(c=>c.cat===catName);
  if(idx===undefined||idx<0)return;
  const removedIds=arr[idx].items.map(i=>i.id);
  arr.splice(idx,1);
  removedIds.forEach(id=>{if(currentHike)deleteDoc(doc(db,`trail_hikes/${currentHike.id}/checks`,id)).catch(()=>{});});
  if(member==='shopping')renderShop();else renderMember(member);
  showToast('Category deleted');
  await persistFamily(famKey);
};

// Meal editing context: {dayNum, mealKey: 'breakfast'/'lunch'/'dinner'/'snacks'}
let mealEditCtx=null;

window.editMeal=(dayNum,mealKey)=>{
  if(!currentHikeData)return;
  const fam=currentHikeData['f'+userFamKey];
  const day=fam?.meals?.find(d=>d.dayNum===dayNum);
  if(!day)return;
  const meal=day[mealKey]||{food:'',tip:''};
  mealEditCtx={dayNum,mealKey};
  const mealLabel={breakfast:'Breakfast',lunch:'Lunch',dinner:'Dinner',snacks:'All-day snacks'}[mealKey];
  document.getElementById('meal-modal-title').textContent=`Edit ${day.dayName||'Day '+dayNum} — ${mealLabel}`;
  document.getElementById('m-food').value=meal.food||'';
  document.getElementById('m-tip').value=meal.tip||'';
  document.getElementById('meal-modal').classList.add('open');
  setTimeout(()=>document.getElementById('m-food').focus(),150);
};
window.closeMealModal=()=>{document.getElementById('meal-modal').classList.remove('open');mealEditCtx=null;};
window.saveMeal=async()=>{
  if(!mealEditCtx||!currentHikeData)return;
  const {dayNum,mealKey}=mealEditCtx;
  const food=document.getElementById('m-food').value.trim();
  const tip=document.getElementById('m-tip').value.trim();
  const famKey=getEditFamKey();
  const fam=currentHikeData['f'+famKey];
  const day=fam?.meals?.find(d=>d.dayNum===dayNum);
  if(!day)return;
  day[mealKey]={type:day[mealKey]?.type||{breakfast:'Breakfast',lunch:'Lunch',dinner:'Dinner',snacks:'All-day snacks'}[mealKey],food,tip};
  closeMealModal();
  renderMeals();
  showToast('✅ Meal saved');
  await persistFamily(famKey);
};

window.addDay=async()=>{
  if(!currentHikeData)return;
  const famKey=getEditFamKey();
  const fam=currentHikeData['f'+famKey];
  if(!fam.meals)fam.meals=[];
  const maxDay=Math.max(...fam.meals.map(d=>d.dayNum||0),0);
  const newDayNum=maxDay+1;
  fam.meals.push({
    dayNum:newDayNum,
    dayName:`Day ${newDayNum}`,
    breakfast:{type:'Breakfast',food:'',tip:''},
    lunch:{type:'Lunch',food:'',tip:''},
    dinner:{type:'Dinner',food:'',tip:''},
    snacks:{type:'All-day snacks',food:'',tip:''}
  });
  renderMeals();
  showToast('✅ Day added');
  await persistFamily(famKey);
};

window.removeDay=async dayNum=>{
  if(!currentHikeData)return;
  const famKey=getEditFamKey();
  const fam=currentHikeData['f'+famKey];
  if(!confirm(`Remove ${fam.meals?.find(d=>d.dayNum===dayNum)?.dayName}? This can't be undone.`))return;
  fam.meals=fam.meals?.filter(d=>d.dayNum!==dayNum)||[];
  renderMeals();
  showToast('Day removed');
  await persistFamily(famKey);
};


window.resetMember=async memberKey=>{
  if(!confirm('Reset checklist?')||!currentHike||!currentHikeData)return;
  const ids=[];currentHikeData['f'+userFamKey]?.members[memberKey]?.cats.forEach(c=>c.items.forEach(i=>ids.push(i.id)));
  await Promise.all(ids.map(id=>deleteDoc(doc(db,`trail_hikes/${currentHike.id}/checks`,id))));
  showToast('Reset done');
};
window.resetAll=async()=>{
  if(!confirm('Reset all your family checklists?')||!currentHike||!currentHikeData)return;
  const ids=[];
  const fam=currentHikeData['f'+userFamKey];
  Object.values(fam?.members||{}).forEach(m=>m.cats.forEach(c=>c.items.forEach(i=>ids.push(i.id))));
  fam?.shopping.forEach(c=>c.items.forEach(i=>ids.push(i.id)));
  await Promise.all(ids.map(id=>deleteDoc(doc(db,`trail_hikes/${currentHike.id}/checks`,id))));
  showToast('All reset');
};

// ── CREATE HIKE WIZARD ──
const WIZ_STEPS=['Details','Families','Invite'];
window.openCreateHike=()=>{
  wizStep=0;wizData={name:'',location:'',dates:'',families:[{name:'',members:[],invitedEmails:[]}]};
  renderWizStep();document.getElementById('create-hike-modal').classList.add('open');
};
window.closeCreateHike=()=>{document.getElementById('create-hike-modal').classList.remove('open');};
window.nextWizStep=()=>{wizStep++;renderWizStep();};
window.prevWizStep=()=>{wizStep--;renderWizStep();};

function renderWizStep(){
  const prog=document.getElementById('wiz-prog');
  const content=document.getElementById('wiz-content');
  prog.innerHTML=WIZ_STEPS.map((_,i)=>`<div class="wp${i<=wizStep?' done':''}"></div>`).join('');

  if(wizStep===0){
    content.innerHTML=`
      <div class="mf"><label class="ml">Hike name</label><input class="mi" id="w-name" placeholder="e.g. Magoebaskloof Aug 2026" value="${wizData.name}"></div>
      <div class="mf">
        <label class="ml">Location</label>
        <input class="mi" id="w-loc" placeholder="Search location…" value="${wizData.location}" oninput="wizLocSearch(this.value)" autocomplete="off">
        <div id="loc-results" style="display:none;background:var(--card);border:1px solid var(--border);border-radius:10px;margin-top:4px;overflow:hidden;max-height:200px;overflow-y:auto"></div>
        ${wizData.coords?`<div style="font-size:11px;color:var(--fl);margin-top:4px">📍 Coords saved — weather & distance will show on entry screen</div>`:'<div style="font-size:11px;color:var(--muted);margin-top:4px">Type to search and select a location for weather & distance</div>'}
      </div>
      <div style="display:flex;gap:12px">
        <div class="mf" style="flex:1"><label class="ml">From Date</label><input class="mi" id="w-date-from" type="date" value="${wizData.dateFrom||''}"></div>
        <div class="mf" style="flex:1"><label class="ml">To Date</label><input class="mi" id="w-date-to" type="date" value="${wizData.dateTo||''}"></div>
      </div>
      <div class="mbtns">
        <button class="m-cancel" onclick="closeCreateHike()">Cancel</button>
        <button class="m-save" onclick="wiz1Next()">Next →</button>
      </div>`;
  } else if(wizStep===1){
    // Previous hikes families to clone from
    const prevFams=allHikes.filter(h=>h.id!==currentHike?.id).flatMap(h=>(h.families||[]).map(f=>({...f,hikeName:h.name})));
    const prevFamOpts=prevFams.length?prevFams.map((f,i)=>`<option value="${i}">${f.hikeName} — ${f.name}</option>`).join(''):'';
    const hikeOptions=allHikes.filter(h=>(h.families||[]).length).map(h=>`<option value="${h.id}">${h.name}${h.dates?' ('+h.dates+')':''}</option>`).join('');
    const copyPrevHikeBlock=hikeOptions?`
      <div style="background:var(--s2);border-radius:10px;padding:12px;margin-bottom:12px">
        <div style="font-size:12px;font-weight:700;color:var(--fl);margin-bottom:4px">📋 Start from a previous hike</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:8px">Brings across all families & members. You can then remove anyone not coming, or add new people/families below.</div>
        <div style="display:flex;gap:6px">
          <select class="mi" id="copy-prev-hike" style="flex:1;padding:8px 10px;font-size:12px">
            <option value="">Select a previous hike…</option>${hikeOptions}
          </select>
          <button class="add-u-btn" style="padding:8px 14px;font-size:12px" onclick="wizCopyPrevHike()">Copy</button>
        </div>
      </div>`:'';
    let famsHtml=wizData.families.map((f,fi)=>`
      <div style="background:var(--s2);border-radius:10px;padding:12px;margin-bottom:8px">
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <input class="mi" style="flex:1;padding:8px 12px;font-size:13px" placeholder="Family name e.g. Fun Heerdens" value="${f.name}" onchange="wizSetFamName(${fi},this.value)">
          ${fi>0?`<button class="rm-btn" onclick="wizRemoveFam(${fi})">✕</button>`:''}
        </div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:6px">Members:</div>
        <div id="wiz-members-${fi}">${(f.members||[]).map((m,mi)=>`
          <div style="display:flex;gap:6px;margin-bottom:6px">
            <input class="mi" style="flex:1;padding:6px 10px;font-size:13px" placeholder="Name" value="${m.name}" onchange="wizSetMember(${fi},${mi},'name',this.value)">
            <input class="mi" style="width:50px;padding:6px 8px;font-size:12px" type="number" placeholder="Age" value="${m.age||''}" onchange="wizSetMember(${fi},${mi},'age',this.value)">
            <select class="mi" style="width:80px;padding:6px 8px;font-size:11px" onchange="wizSetMember(${fi},${mi},'gender',this.value)">
              <option value="">—</option>
              <option value="male" ${m.gender==='male'?'selected':''}>Male</option>
              <option value="female" ${m.gender==='female'?'selected':''}>Female</option>
            </select>
            <button class="rm-btn" onclick="wizRemoveMember(${fi},${mi})">✕</button>
          </div>`).join('')}
        </div>
        <button onclick="wizAddMember(${fi})" style="background:none;border:1px dashed var(--border);border-radius:8px;color:var(--fl);font-size:12px;font-weight:700;padding:6px 12px;cursor:pointer;width:100%;margin-bottom:8px">+ Add Member</button>
        ${prevFamOpts?`<div style="font-size:11px;color:var(--muted);margin-bottom:4px">Or clone members from previous hike:</div>
        <div style="display:flex;gap:6px">
          <select class="mi" id="clone-prev-${fi}" style="flex:1;padding:7px 10px;font-size:12px"><option value="">Select previous family…</option>${prevFamOpts}</select>
          <button class="add-u-btn" style="padding:7px 12px;font-size:12px" onclick="wizClonePrevFam(${fi},${JSON.stringify(prevFams).replace(/"/g,'&quot;')})">Clone</button>
        </div>`:''}
      </div>`).join('');

    content.innerHTML=`${copyPrevHikeBlock}${famsHtml}
      <button onclick="wizAddFam()" style="background:none;border:2px dashed var(--border);border-radius:10px;color:var(--fl);font-size:13px;font-weight:700;padding:12px;cursor:pointer;width:100%;margin-bottom:12px">+ Add Another Family</button>
      <div class="mbtns">
        <button class="m-cancel" onclick="prevWizStep()">← Back</button>
        <button class="m-save" onclick="nextWizStep()">Next →</button>
      </div>`;
  } else if(wizStep===2){
    content.innerHTML=`
      <div style="font-size:13px;color:var(--muted);margin-bottom:12px">Add Gmail addresses for all hikers. They'll see this hike after signing in.</div>
      ${wizData.families.map((f,fi)=>`
        <div style="margin-bottom:12px">
          <div style="font-size:12px;font-weight:700;color:var(--fl);margin-bottom:6px">🏠 ${f.name||'Family '+(fi+1)}</div>
          <div id="wiz-emails-${fi}">${(f.invitedEmails||[]).map((e,ei)=>`
            <div style="display:flex;gap:6px;margin-bottom:6px">
              <input class="mi" style="flex:1;padding:8px 12px;font-size:13px" type="email" value="${e}" onchange="wizSetEmail(${fi},${ei},this.value)">
              <button class="rm-btn" onclick="wizRemoveEmail(${fi},${ei})">✕</button>
            </div>`).join('')}
          </div>
          <button onclick="wizAddEmail(${fi})" style="background:none;border:1px dashed var(--border);border-radius:8px;color:var(--fl);font-size:12px;font-weight:700;padding:6px 12px;cursor:pointer;width:100%">+ Add Email</button>
        </div>`).join('')}
      <div class="mbtns" style="margin-top:16px">
        <button class="m-cancel" onclick="prevWizStep()">← Back</button>
        <button class="m-save" onclick="createHike()">🏔️ Create Adventure!</button>
      </div>`;
  }
}

// Wiz helpers
let wizLocTimer=null;
window.wizLocSearch=q=>{
  clearTimeout(wizLocTimer);
  if(q.length<3){document.getElementById('loc-results').style.display='none';return;}
  wizLocTimer=setTimeout(()=>searchLocation(q),400);
};

window.wiz1Next=()=>{
  wizData.name=document.getElementById('w-name')?.value.trim();
  wizData.location=document.getElementById('w-loc')?.value.trim();
  const dateFrom=document.getElementById('w-date-from')?.value;
  const dateTo=document.getElementById('w-date-to')?.value;
  wizData.dateFrom=dateFrom;
  wizData.dateTo=dateTo;
  
  // Format dates nicely for display (e.g., "7-9 August 2026")
  if(dateFrom&&dateTo){
    const from=new Date(dateFrom);
    const to=new Date(dateTo);
    const fromDay=from.getDate();
    const toDay=to.getDate();
    const month=from.toLocaleString('en-US',{month:'long'});
    const year=from.getFullYear();
    wizData.dates=fromDay===toDay?`${fromDay} ${month} ${year}`:`${fromDay}-${toDay} ${month} ${year}`;
  }else if(dateFrom){
    const from=new Date(dateFrom);
    wizData.dates=from.toLocaleDateString('en-US',{day:'numeric',month:'long',year:'numeric'});
  }else{
    wizData.dates='';
  }
  
  if(!wizData.name){showToast('Enter a hike name','#EF5350');return;}
  nextWizStep();
};
window.wizSetFamName=(fi,val)=>{if(wizData.families[fi])wizData.families[fi].name=val;};
window.wizAddFam=()=>{wizData.families.push({name:'',members:[],invitedEmails:[]});renderWizStep();};
window.wizRemoveFam=fi=>{wizData.families.splice(fi,1);renderWizStep();};
window.wizAddMember=fi=>{if(!wizData.families[fi].members)wizData.families[fi].members=[];wizData.families[fi].members.push({name:'',age:'',gender:''});renderWizStep();};
window.wizRemoveMember=(fi,mi)=>{wizData.families[fi].members.splice(mi,1);renderWizStep();};
window.wizSetMember=(fi,mi,field,val)=>{if(wizData.families[fi]?.members[mi])wizData.families[fi].members[mi][field]=val;};
window.wizAddEmail=fi=>{if(!wizData.families[fi].invitedEmails)wizData.families[fi].invitedEmails=[];wizData.families[fi].invitedEmails.push('');renderWizStep();};
window.wizRemoveEmail=(fi,ei)=>{wizData.families[fi].invitedEmails.splice(ei,1);renderWizStep();};
window.wizSetEmail=(fi,ei,val)=>{if(wizData.families[fi]?.invitedEmails)wizData.families[fi].invitedEmails[ei]=val.trim().toLowerCase();};
window.wizClonePrevFam=(fi,prevFams)=>{
  const sel=document.getElementById('clone-prev-'+fi);
  const idx=parseInt(sel?.value);if(isNaN(idx)||!prevFams[idx])return;
  const src=prevFams[idx];
  wizData.families[fi].members=(src.members||[]).map(m=>({name:m.name||'',age:m.age||'',gender:m.gender||''}));
  if(!wizData.families[fi].name)wizData.families[fi].name=src.name||'';
  if(!wizData.families[fi].invitedEmails?.length)wizData.families[fi].invitedEmails=[...(src.invitedEmails||[])];
  renderWizStep();showToast('Members cloned from '+src.name);
};

// Bulk-copy every family (with members & invited emails) from a previous
// hike, so the admin doesn't have to re-add each family one by one — they
// can then just remove whoever isn't coming this time, or add someone new.
window.wizCopyPrevHike=()=>{
  const sel=document.getElementById('copy-prev-hike');
  const hikeId=sel?.value;if(!hikeId)return;
  const src=allHikes.find(h=>h.id===hikeId);if(!src)return;
  const doCopy=()=>{
    wizData.families=(src.families||[]).map(f=>({
      name:f.name||'',
      members:(f.members||[]).map(m=>({name:m.name||'',age:m.age||'',gender:m.gender||''})),
      invitedEmails:[...(f.invitedEmails||[])]
    }));
    if(!wizData.families.length)wizData.families=[{name:'',members:[],invitedEmails:[]}];
    renderWizStep();
    showToast('✅ Copied families from '+src.name);
  };
  const hasData=wizData.families.some(f=>f.name||f.members?.length);
  if(hasData){
    if(confirm("This replaces the families you've already entered here with "+src.name+"'s. Continue?"))doCopy();
  } else doCopy();
};

window.createHike=async()=>{
  if(!wizData.name){showToast('Enter hike name','#EF5350');return;}
  // Collect all invited emails
  const allEmails=wizData.families.flatMap(f=>f.invitedEmails||[]).filter(e=>e);
  allEmails.push(cu.email); // always include creator
  const hikeDoc={
    name:wizData.name,
    location:wizData.location,
    dates:wizData.dates,
    dateFrom:wizData.dateFrom||null,
    dateTo:wizData.dateTo||null,
    families:wizData.families,
    invitedEmails:allEmails,
    createdBy:cu.email,
    createdAt:serverTimestamp(),
    archived:false,
    progress:0,
    coords:wizData.coords||null,
  };
  const ref=await addDoc(collection(db,'trail_hikes'),hikeDoc);
  closeCreateHike();
  showToast('🏔️ Adventure created!');
  // Auto-open the new hike
  setTimeout(()=>openHike(ref.id),500);
};

// ── TOAST ──
function showToast(msg,bg='#43A047'){
  const t=document.getElementById('toast');t.textContent=msg;t.style.background=bg;
  t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500);
}
window.showToast=showToast;

window.toggleCat=id=>{
  const el=document.getElementById(id);
  const arrow=document.getElementById(id+'-arrow');
  if(!el)return;
  const collapsed=el.style.display==='none';
  el.style.display=collapsed?'block':'none';
  if(arrow)arrow.textContent=collapsed?'▼':'▶';
};

// Render panels on tab click
document.addEventListener('click',e=>{
  const tab=e.target.closest('.app-tab');
  if(!tab)return;
  const id=tab.dataset.tabId;
  if(id==='settings')setTimeout(()=>renderSettings(),50);
  if(id==='qa')setTimeout(()=>renderQA(),50);
});
window.saveFamilyName=async()=>{
  if(!currentHikeData)return;
  const fam=currentHikeData['f'+userFamKey];if(!fam)return;
  const name=prompt('Family name:',fam.name||'');
  if(!name)return;
  fam.name=name;
  await persistFamily(userFamKey);
  renderSettings();updateFamCards();
  showToast('✅ Family name updated');
};

