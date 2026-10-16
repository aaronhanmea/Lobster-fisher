const $ = id => document.getElementById(id);
const STORAGE_KEY = "lobsterFisherSavesV1";
const blankSave = (name="Save 1") => ({name,day:1,money:0,pots:8,inshore:1,offshore:7,phase:"fish",weather:"",message:"Welcome aboard, skipper. Set your pots and roll the die!",earnings:0,lost:0,history:[],finished:false});
let saves = {};
let activeId = "save-1";
let nextId = 2;
function readSaves(){
  try { const d=JSON.parse(localStorage.getItem(STORAGE_KEY)); if(d&&d.saves&&Object.keys(d.saves).length){saves=d.saves;activeId=d.activeId||Object.keys(saves)[0];nextId=d.nextId||Object.keys(saves).length+1; if(!saves[activeId])activeId=Object.keys(saves)[0];return;} } catch(e){}
  saves={"save-1":blankSave()};activeId="save-1";nextId=2;persist();
}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify({saves,activeId,nextId}));}
function s(){return saves[activeId];}
function setError(msg=""){$("error").textContent=msg;}
function updateSelect(){
  const sel=$("saveSelect"), old=sel.value;sel.innerHTML="";
  Object.entries(saves).forEach(([id,v])=>{const o=document.createElement("option");o.value=id;o.textContent=v.name+(id===activeId?" (active)":"");sel.appendChild(o);});
  sel.value=saves[old]?old:activeId;$("saveLabel").textContent=s().name;
}
function setPhase(phase){s().phase=phase;render();}
function render(){
 const g=s(); updateSelect();
 $("money").textContent="£"+g.money;$("pots").textContent=g.pots+" 🦞";
 $("day").textContent=Math.min(g.day,28)+" / 28";$("week").textContent=g.finished?"Complete":"Week "+Math.ceil(g.day/7);
 $("progress").style.width=(g.finished?100:g.day/28*100)+"%";
 $("phaseTitle").textContent=g.finished?"Season complete!":g.phase==="buy"?`Day ${g.day} — Daily results`:`Day ${g.day} — Set your pots`;
 $("message").textContent=g.message;
 $("fishControls").classList.toggle("hidden",g.phase!=="fish"||g.finished);
 $("buyControls").classList.toggle("hidden",g.phase!=="buy"||g.finished);
 $("endControls").classList.toggle("hidden",!g.finished);
 $("inshore").textContent=g.inshore;$("offshore").textContent=g.offshore;
 $("inMinus").disabled=g.inshore<=1;$("offMinus").disabled=g.offshore<=0;
 $("inPlus").disabled=g.inshore+g.offshore>=g.pots;$("offPlus").disabled=g.inshore+g.offshore>=g.pots;
 $("deployment").textContent=`Deployed: ${g.inshore+g.offshore} / ${g.pots} · In reserve: ${g.pots-g.inshore-g.offshore}`;
 $("goodCatch").textContent="£"+(g.inshore*2+g.offshore*6);$("badCatch").textContent="£"+(g.inshore*4);
 $("buyOne").disabled=g.money<10;$("buyMax").disabled=g.money<10;
 $("buyMax").textContent=`Buy maximum (${Math.floor(g.money/10)})`;
 const safeIn=Math.min(g.pots,Math.max(1,g.inshore)),safeOff=Math.min(g.offshore,Math.max(0,g.pots-safeIn));
 $("nextSetup").textContent=`Saved setup for next day: ${safeIn} inshore · ${safeOff} offshore. Your setup is remembered automatically and adjusted only if your remaining fleet cannot support it.`;
 $("nextDay").textContent=g.day>=28?"Finish season":"Start day "+(g.day+1)+" →";
 $("resultBox").innerHTML=`<strong>${g.weather==="Good"?"☀️ Good weather":"🌧️ Bad weather"}</strong><br>${escapeHtml(g.message)}<hr style="border:0;border-top:1px solid #28505a;margin:10px 0"><div class="row"><span>Today's earnings</span><strong class="green">+£${g.earnings}</strong></div><div class="row"><span>Offshore pots lost</span><strong>${g.lost}</strong></div><div class="row"><span>Cash available</span><strong>£${g.money}</strong></div><div class="row"><span>Pots remaining</span><strong>${g.pots}</strong></div>`;
 $("finalResult").innerHTML=`You finished with <strong>${g.pots} pots</strong> and <strong>£${g.money}</strong> cash.<br><br>${g.pots>=30?"Lobster fishing legend!":g.pots>=20?"Successful skipper!":g.pots>=10?"A steady fishing business!":"A tough season at sea!"}`;
 $("logCount").textContent=g.history.length+" days";
 $("log").innerHTML=g.history.length?g.history.map(h=>`<div class="logitem"><div class="daybubble"><strong>${h.day}</strong><small>DAY</small></div><div><strong>Day ${h.day} · ${h.weather} weather</strong><div class="tiny">Die ${h.roll} · Setup ${h.inshore} inshore / ${h.offshore} offshore · Lost ${h.lost}</div></div><strong class="green">+£${h.earn}</strong></div>`).join(""):"Your daily results will appear here.";
 persist();
}
function escapeHtml(str){return String(str).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function adjust(which,delta){const g=s();if(which==="inshore")g.inshore=Math.max(1,Math.min(g.inshore+delta,g.pots-g.offshore));else g.offshore=Math.max(0,Math.min(g.offshore+delta,g.pots-g.inshore));setError();render();}
$("inMinus").onclick=()=>adjust("inshore",-1);$("inPlus").onclick=()=>adjust("inshore",1);$("offMinus").onclick=()=>adjust("offshore",-1);$("offPlus").onclick=()=>adjust("offshore",1);
$("fishBtn").onclick=()=>{
 const g=s();if(g.inshore<1||g.inshore+g.offshore>g.pots){setError("Keep at least one inshore pot and don't deploy more than you own.");return;}
 const roll=Math.floor(Math.random()*6)+1,good=roll<=3,earn=good?g.inshore*2+g.offshore*6:g.inshore*4,loss=good?0:g.offshore;
 g.money+=earn;g.pots-=loss;g.weather=good?"Good":"Bad";g.earnings=earn;g.lost=loss;
 g.message=good?`The die shows ${roll}. Good weather! Your catch is in.`:`The die shows ${roll}. Bad weather! All ${g.offshore} offshore pots are lost.`;
 g.history.unshift({day:g.day,weather:g.weather,roll,earn,lost:loss,inshore:g.inshore,offshore:g.offshore});
 g.phase="buy";setError();render();
};
$("buyOne").onclick=()=>{const g=s();if(g.money<10)return;g.money-=10;g.pots++;g.message="One new pot purchased. Your saved fishing setup remains unchanged.";setError();render();};
$("buyMax").onclick=()=>{const g=s(),n=Math.floor(g.money/10);if(!n)return;g.money-=n*10;g.pots+=n;g.message=`Bought ${n} new pot${n===1?"":"s"}. Your saved fishing setup remains unchanged.`;setError();render();};
$("nextDay").onclick=()=>{const g=s();if(g.day>=28){g.finished=true;g.phase="end";render();return;}const next=g.day+1;g.inshore=Math.min(g.pots,Math.max(1,g.inshore));g.offshore=Math.min(g.offshore,Math.max(0,g.pots-g.inshore));g.day=next;g.weather="";g.phase="fish";g.message=`Day ${next}: your previous fishing setup is ready. Change it if you wish.`;setError();render();};
function createNewSave(){
 const name=prompt("Name your new fishing save:","Career "+nextId);if(name===null)return;
 const id="save-"+nextId++;const clean=name.trim()||("Career "+(nextId-1));
 saves[id]=blankSave(clean);activeId=id;setError();render();
}
$("newSaveBtn").onclick=createNewSave;
$("loadSaveBtn").onclick=()=>{const id=$("saveSelect").value;if(saves[id]){activeId=id;setError();render();}};
$("resetSaveBtn").onclick=()=>{const g=s();if(confirm(`Reset "${g.name}"? This will erase its current season and history, starting again with £0 and 8 pots. Other saves will not be affected.`)){saves[activeId]=blankSave(g.name);setError();render();}};
$("playAgain").onclick=()=>{const g=s();if(confirm(`Start a new season in "${g.name}"? Its current progress and log will be replaced.`)){saves[activeId]=blankSave(g.name);setError();render();}};
if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}
readSaves();render();
