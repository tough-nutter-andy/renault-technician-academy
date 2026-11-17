import React,{useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Play,Pause,RotateCcw,Trophy,Info,CarFront,Wrench,MonitorCog,Cog} from 'lucide-react';
import './clio-drive.css';

// Self-contained, canvas-rendered high-resolution retro-3D arcade challenge.
// Illustrative pixel vehicles, not official Renault artwork.
const W=800,H=500,ROAD_TOP=145,ROAD_BOTTOM=500,FINISH=1800;
const CAR_TYPES={clio:{name:'RENAULT CLIO',color:'#1674e7',dark:'#092e77',light:'#66b8ff',width:70,height:112},r5:{name:'RENAULT 5',color:'#e9da44',dark:'#9d902a',light:'#fff8a6',width:76,height:104}};
const QUIZZES=[
 {at:460,question:'A rested 12V battery measures 12.1 V. What does that usually suggest?',answers:['The battery is fully charged','The battery may be partially discharged','The alternator is definitely faulty'],correct:1,explanation:'A rested 12.1 V lead-acid battery reading can indicate partial discharge. Always follow the approved testing procedure.'},
 {at:990,question:'Multiple network fault codes appear. What is the best starting point?',answers:['Replace the first ECU in the list','Review the complete fault picture and supply voltages','Clear every fault and release the car'],correct:1,explanation:'Check the complete diagnostic picture and relevant power supplies before replacing components.'},
 {at:1510,question:'Before working on a high-voltage vehicle system, what must happen?',answers:['Follow the manufacturer-approved HV safety and isolation procedure','Switch off the radio','Disconnect any convenient connector'],correct:0,explanation:'High-voltage work must be carried out only by appropriately trained personnel following approved vehicle-specific safety procedures.'}
];
const COLLECTIBLES={spanner:{label:'SPANNER',score:15},diagnostic:{label:'DIAGNOSTIC TABLET',score:25},part:{label:'SPARE PART',score:20}};
const laneCenters=[-1,0,1];
const random=(a,b)=>a+Math.random()*(b-a);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const initial=()=>({mode:'select',car:'clio',lane:1,visualLane:1,distance:0,damage:0,objects:[],spawn:0,invuln:0,points:0,quiz:0,chosen:null,feedback:null,collects:{spanner:0,diagnostic:0,part:0},tick:0});
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h)}
function poly(c,pts,color){c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
function clamp01(n){return clamp(n,0,1)}
function roadCurve(s,depth){const a=s.distance/360;const bend=.46*Math.sin(a)+.23*Math.sin(a*.41+1);return bend*Math.pow(clamp01(1-depth),2.0)*168}
function roadWidth(y){const f=clamp01((y-ROAD_TOP)/(H-ROAD_TOP));return 80+830*Math.pow(f,.92)}
function project(depth){const t=clamp01(1-depth);return ROAD_TOP+Math.pow(t,1.5)*(H-ROAD_TOP)}
function lanePosition(lane,y,s){const d=1-Math.pow(clamp01((y-ROAD_TOP)/(H-ROAD_TOP)),1/1.5);return W/2+roadCurve(s,d)+ (lane-1)*roadWidth(y)*.275}
function shadeHex(hex,amount){let n=parseInt(hex.replace('#',''),16);let r=clamp((n>>16)+amount,0,255),g=clamp(((n>>8)&255)+amount,0,255),b=clamp((n&255)+amount,0,255);return `rgb(${r|0},${g|0},${b|0})`}
function rearCar(c,x,y,size,kind,steer=0,otherColor=null){
 const r5=kind==='r5';const base=otherColor||CAR_TYPES[kind]?.color||'#b0b4bc';
 c.save();c.translate(x,y);c.rotate(steer*.015);c.scale(size,size);
 // Ground contact shadow and wheels
 c.fillStyle='rgba(0,0,0,.43)';c.beginPath();c.ellipse(0,10,84,22,0,0,Math.PI*2);c.fill();
 rect(c,-73,-45,18,61,'#111217');rect(c,55,-45,18,61,'#111217');
 rect(c,-76,-18,15,26,'#2f3032');rect(c,61,-18,15,26,'#2f3032');
 // Roof, sculpted shoulders and rear hatch
 poly(c,[[-42,-94],[42,-94],[60,-77],[72,-49],[76,-5],[64,20],[-64,20],[-76,-5],[-72,-49],[-60,-77]],'#14171c');
 poly(c,[[-41,-91],[41,-91],[56,-76],[69,-46],[72,-7],[62,17],[-62,17],[-72,-7],[-69,-46],[-56,-76]],base);
 poly(c,[[-41,-90],[41,-90],[55,-76],[-55,-76]],shadeHex(base,55));
 poly(c,[[-53,-75],[53,-75],[61,-48],[-61,-48]],'#101c29');
 poly(c,[[-49,-73],[49,-73],[54,-55],[-54,-55]],'#294d67');
 poly(c,[[-46,-71],[1,-71],[-20,-56],[-53,-56]],'rgba(178,224,252,.38)');
 rect(c,-56,-49,112,4,'#121820');
 poly(c,[[-65,-44],[65,-44],[72,-7],[62,6],[-62,6],[-72,-7]],shadeHex(base,-13));
 poly(c,[[-61,-42],[61,-42],[66,-17],[-66,-17]],base);
 poly(c,[[-67,-11],[67,-11],[60,12],[-60,12]],shadeHex(base,-34));
 // Lamp signatures and detail cues
 if(r5){
  rect(c,-66,-39,20,15,'#141218');rect(c,46,-39,20,15,'#141218');
  rect(c,-64,-37,16,6,'#f74739');rect(c,48,-37,16,6,'#f74739');
  rect(c,-59,-29,11,3,'#ffb1a2');rect(c,48,-29,11,3,'#ffb1a2');
 }else{
  poly(c,[[-67,-37],[-41,-37],[-48,-27],[-67,-25]],'#f33438');
  poly(c,[[67,-37],[41,-37],[48,-27],[67,-25]],'#f33438');
  rect(c,-64,-32,11,3,'#ffb3ac');rect(c,53,-32,11,3,'#ffb3ac');
 }
 rect(c,-54,5,108,5,'#11131a');rect(c,-46,11,92,5,'#323338');
 rect(c,-19,-5,38,14,'#eceef0');rect(c,-13,-1,26,5,'#333a40');
 // Stylised diamond badge (original geometric illustration)
 poly(c,[[0,-30],[7,-23],[0,-16],[-7,-23]],'#d8e1e9');
 poly(c,[[0,-27],[4,-23],[0,-19],[-4,-23]],shadeHex(base,-35));
 rect(c,-57,-11,4,12,'rgba(255,255,255,.2)');
 c.restore();
}
function pickup(c,x,y,scale,kind,tick){
 c.save();c.translate(x,y-4*Math.sin(tick*.07));c.scale(scale,scale);
 c.shadowColor='rgba(240,245,255,.8)';c.shadowBlur=17;
 c.fillStyle='#f3f5f8';c.beginPath();c.arc(0,0,25,0,Math.PI*2);c.fill();c.shadowBlur=0;
 c.strokeStyle='#161a1e';c.lineWidth=3;c.beginPath();c.arc(0,0,25,0,Math.PI*2);c.stroke();
 c.strokeStyle='#222830';c.fillStyle='#222830';c.lineWidth=6;c.lineJoin='round';
 if(kind==='spanner'){c.save();c.rotate(-.6);rect(c,-3,-4,6,21,'#222830');c.beginPath();c.arc(0,-12,9,-.4,3.55);c.stroke();c.restore()}
 if(kind==='diagnostic'){rect(c,-16,-12,32,23,'#20262e');rect(c,-12,-8,24,14,'#55adc9');rect(c,-5,14,10,3,'#20262e')}
 if(kind==='part'){c.beginPath();for(let i=0;i<16;i++){const r=i%2?12:19,a=i*Math.PI/8;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fill();c.fillStyle='#fff';c.beginPath();c.arc(0,0,6,0,7);c.fill()}
 c.restore();
}
function drawScene(c,s){
 c.clearRect(0,0,W,H);
 // Sky gradients, sunny distant landscape and atmospheric perspective.
 const sky=c.createLinearGradient(0,0,0,ROAD_TOP+90);sky.addColorStop(0,'#4b8ebc');sky.addColorStop(.65,'#a6d0df');sky.addColorStop(1,'#eef0cf');rect(c,0,0,W,H,sky);
 const sunX=650+45*Math.sin(s.distance/1300);c.fillStyle='rgba(255,244,198,.7)';c.beginPath();c.arc(sunX,83,47,0,7);c.fill();
 const horizonShift=roadCurve(s,.72)*.45;
 poly(c,[[0,ROAD_TOP+45],[0,138],[95,115],[177,146],[251,100],[329,133],[420,106],[492,143],[610,118],[700,145],[800,112],[800,ROAD_TOP+45]].map(([x,y])=>[x+horizonShift*.12,y]),'#91adac');
 poly(c,[[0,ROAD_TOP+30],[0,164],[100,130],[204,158],[307,139],[403,169],[530,133],[679,158],[800,134],[800,ROAD_TOP+30]],'#507e72');
 rect(c,0,ROAD_TOP+27,W,H,'#5d886a');
 // Detailed curved road built from 130 screen-space strips.
 for(let i=0;i<134;i++){
  const y1=ROAD_TOP+(H-ROAD_TOP)*i/134,y2=ROAD_TOP+(H-ROAD_TOP)*(i+1)/134+1;
  const d1=1-Math.pow(clamp01((y1-ROAD_TOP)/(H-ROAD_TOP)),1/1.5),d2=1-Math.pow(clamp01((y2-ROAD_TOP)/(H-ROAD_TOP)),1/1.5);
  const x1=W/2+roadCurve(s,d1),x2=W/2+roadCurve(s,d2),w1=roadWidth(y1),w2=roadWidth(y2);
  const phase=((s.distance/48+(1-d1)*24)|0)%2===0;
  poly(c,[[x1-w1*.535,y1],[x1+w1*.535,y1],[x2+w2*.535,y2],[x2-w2*.535,y2]],phase?'#e4e2dc':'#ba4b45');
  const asphalt=phase?'#42494e':'#434b51';
  poly(c,[[x1-w1*.5,y1],[x1+w1*.5,y1],[x2+w2*.5,y2],[x2-w2*.5,y2]],asphalt);
  for(let n=1;n<3;n++){
   const q=n/3-.5,tx1=x1+w1*q,tx2=x2+w2*q;
   const dash=((s.distance/35+(1-d1)*32)|0)%3!==0;
   if(dash)poly(c,[[tx1-w1*.005,y1],[tx1+w1*.005,y1],[tx2+w2*.005,y2],[tx2-w2*.005,y2]],'#edeadd');
  }
 }
 // Guardrails, trees, signs, and occasional structures recede into the vanishing point.
 for(let k=0;k<19;k++){
  const depth=((k/19+s.distance/1850)%1),y=project(1-depth),width=roadWidth(y),curve=roadCurve(s,1-depth),sc=.12+depth*1.8;
  for(const side of [-1,1]){
   const x=W/2+curve+side*(width*.56+35*sc);
   if(y<ROAD_TOP+6||y>H+20)continue;
   c.fillStyle='rgba(12,42,25,.15)';c.beginPath();c.ellipse(x+7*sc,y+4*sc,22*sc,5*sc,0,0,7);c.fill();
   rect(c,x-3*sc,y-35*sc,6*sc,35*sc,'#624c36');
   c.fillStyle=k%3===0?'#2a674a':'#26563d';c.beginPath();c.ellipse(x,y-41*sc,20*sc,27*sc,0,0,7);c.fill();
   c.fillStyle='#458265';c.beginPath();c.ellipse(x-7*sc,y-51*sc,11*sc,15*sc,0,0,7);c.fill();
  }
 }
 // Racing scenery and collectibles/traffic with size scaling into the horizon.
 const objects=[...s.objects].sort((a,b)=>b.depth-a.depth);
 for(const o of objects){const y=project(o.depth),x=lanePosition(o.lane,y,s),scale=.16+Math.pow(clamp01(1-o.depth),1.6)*1.22;
  if(o.type==='traffic')rearCar(c,x,y,scale,'clio',0,o.color);
  else pickup(c,x,y,scale*.9,o.type,s.tick);
 }
 // Camera-follow player. Road motion changes beneath the car; car remains prominent.
 const vx=lanePosition(s.visualLane,410,s);rearCar(c,vx,415,1.18,s.car,(s.lane-s.visualLane)*6);
 // Fast-moving road reflections and vignette add an arcade feel.
 const vignette=c.createRadialGradient(W/2,H/2,130,W/2,H/2,560);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,0,0,.28)');rect(c,0,0,W,H,vignette);
 const mph=Math.min(155,48+s.distance/32);
 if(s.mode==='playing'){
  c.strokeStyle='rgba(246,248,251,.38)';c.lineWidth=2;
  for(let j=0;j<13;j++){const x=((j*73+s.distance*2)%W),y=245+(j*37)%240;c.beginPath();c.moveTo(x,y);c.lineTo(x+(x<W/2?-1:1)*(10+mph/10),y+8+mph/4);c.stroke()}
 }
 // Overlay speedometer embedded in the rendered screen, not a separate label.
 c.fillStyle='rgba(8,12,16,.72)';c.fillRect(W-145,H-74,133,63);
 c.fillStyle='#fff';c.font='900 32px Arial';c.textAlign='right';c.fillText(String(mph|0),W-30,H-37);
 c.font='bold 10px Arial';c.fillStyle='#c9d0d4';c.fillText('KM/H',W-28,H-22);
 c.textAlign='left';
}
export default function ClioDrive({onReward,personalBest=0,onBack}){
 const canvas=useRef(null),engine=useRef(initial()),raf=useRef(0),last=useRef(0),rewardDone=useRef(false);
 const [ui,setUi]=useState({...engine.current});const [best,setBest]=useState(personalBest);
 const sync=useCallback(()=>{const s=engine.current;setUi({...s,collects:{...s.collects},objects:[]})},[]);
 const choose=useCallback(car=>{const s=engine.current;if(s.mode==='select')s.car=car;sync()},[sync]);
 const start=useCallback(()=>{const car=engine.current.car;engine.current={...initial(),car,mode:'playing'};rewardDone.current=false;last.current=0;sync()},[sync]);
 const steer=useCallback(delta=>{const s=engine.current;if(s.mode==='playing')s.lane=clamp(s.lane+delta,0,2)},[]);
 const pause=useCallback(()=>{const s=engine.current;if(s.mode==='playing')s.mode='paused';else if(s.mode==='paused')s.mode='playing';sync()},[sync]);
 const answer=useCallback((n)=>{const s=engine.current;if(s.mode!=='checkpoint'||s.chosen!==null)return;const q=QUIZZES[s.quiz];s.chosen=n;s.feedback={correct:n===q.correct,explanation:q.explanation};if(n===q.correct)s.points+=60;sync()},[sync]);
 const resume=useCallback(()=>{const s=engine.current;s.quiz++;s.chosen=null;s.feedback=null;s.mode='playing';sync()},[sync]);
 useEffect(()=>{const onKey=e=>{if(['ArrowLeft','ArrowRight','a','A','d','D',' ','Escape'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')steer(-1);if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')steer(1);if(e.key===' '||e.key==='Escape')pause()};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[steer,pause]);
 useEffect(()=>{
  const ctx=canvas.current?.getContext('2d');if(!ctx)return;ctx.imageSmoothingEnabled=false;
  const frame=(time)=>{
   const s=engine.current,dt=Math.min((time-(last.current||time))/16.667,2);last.current=time;s.tick+=dt;
   if(s.mode==='playing'){
    const speed=1.15+Math.min(.65,s.distance/2200);
    s.distance+=speed*dt;s.visualLane+=(s.lane-s.visualLane)*Math.min(1,dt*.24);s.invuln=Math.max(0,s.invuln-dt);
    s.spawn+=dt;
    if(s.spawn>48){s.spawn=0;const lane=Math.floor(Math.random()*3),pick=Math.random();
     const type=pick<.57?'traffic':pick<.75?'spanner':pick<.88?'diagnostic':'part';
     const colors=['#b9c0c3','#bd4c47','#739a9c','#a8a6a0','#414e6d'];
     s.objects.push({lane,type,depth:1.05,color:colors[Math.floor(random(0,colors.length))],used:false});
    }
    for(const o of s.objects){o.depth-=.0059*dt*speed;if(o.used||o.depth>.16||o.depth<.065||o.lane!==s.lane)continue;
     o.used=true;
     if(o.type==='traffic'){if(s.invuln<=0){s.damage++;s.invuln=85;if(s.damage>=3)s.mode='crashed'}}
     else{s.collects[o.type]++;s.points+=COLLECTIBLES[o.type].score}
    }
    s.objects=s.objects.filter(o=>!o.used&&o.depth>-.12);
    if(s.mode==='playing'&&s.quiz<QUIZZES.length&&s.distance>=QUIZZES[s.quiz].at)s.mode='checkpoint';
    if(s.mode==='playing'&&s.distance>=FINISH){s.mode='finished';s.points+=120}
    if(Math.floor(time/120)!==Math.floor((time-16*dt)/120)||s.mode!=='playing')sync();
   }else s.visualLane+=(s.lane-s.visualLane)*Math.min(1,dt*.24);
   drawScene(ctx,s);raf.current=requestAnimationFrame(frame);
  };raf.current=requestAnimationFrame(frame);return()=>cancelAnimationFrame(raf.current);
 },[sync]);
 useEffect(()=>{if(ui.mode==='finished'&&!rewardDone.current){rewardDone.current=true;setBest(v=>Math.max(v,ui.points));onReward?.(ui.points)}},[ui.mode,ui.points,onReward]);
 const q=QUIZZES[Math.min(ui.quiz,QUIZZES.length-1)];
 return <section className="drive-layout drive16 drive3d">
  <div className="drive-header"><div><span className="drive-eyebrow">RETRO 3D · TECHNICIAN ARCADE</span><h1>RENAULT ROAD QUEST.</h1><p>Choose your car, weave through traffic, collect tools and pass three technical pit stops.</p></div><button className="drive-back" onClick={onBack}>BACK TO CHALLENGES</button></div>
  <div className="drive-grid"><div className="drive-console">
   <div className="drive-hud"><span>DISTANCE <b>{Math.min(Math.floor(ui.distance),FINISH)} / {FINISH} m</b></span><span>HEALTH <b>{'♥'.repeat(3-ui.damage)}{'♡'.repeat(ui.damage)}</b></span><span>RUN XP <b>{ui.points}</b></span></div>
   <div className="drive-stage"><canvas ref={canvas} width={W} height={H} aria-label="High-resolution arcade-style rear-view driving game. Steer Renault 5 or Clio left and right to avoid traffic and collect workshop tools."/>
    {ui.mode!=='playing'&&<div className="drive-overlay"><div className="drive-modal">
     {ui.mode==='select'&&<><span>RENAULT TECHNICIAN ACADEMY</span><h2>CHOOSE YOUR RIDE.</h2><p>Two iconic Renault hatchbacks. One fast-paced arcade challenge.</p><div className="drive-car-choices">{Object.entries(CAR_TYPES).map(([id,c])=><button key={id} className={ui.car===id?'active':''} onClick={()=>choose(id)}><span className={`car-preview ${id}`}><CarFront size={32}/></span><strong>{c.name}</strong><small>{ui.car===id?'SELECTED':'CHOOSE'}</small></button>)}</div><button className="drive-go" onClick={start}><Play size={16}/> START ENGINE</button></>}
     {ui.mode==='paused'&&<><h2>PAUSED.</h2><p>Take a pit stop. Your distance and collectibles are safe.</p><button className="drive-go" onClick={pause}><Play size={16}/> CONTINUE</button></>}
     {ui.mode==='checkpoint'&&<><span>TECHNICAL PIT STOP {ui.quiz+1} / {QUIZZES.length}</span><h2>KNOW YOUR TECH.</h2><p>{q.question}</p><div className="drive-answers">{q.answers.map((a,i)=><button key={a} disabled={ui.chosen!==null} className={ui.chosen===i?'selected':''} onClick={()=>answer(i)}>{String.fromCharCode(65+i)}. {a}</button>)}</div>{ui.feedback&&<><div className="drive-feedback"><b>{ui.feedback.correct?'CORRECT · +60 XP':'NOT QUITE'}</b><p>{ui.feedback.explanation}</p></div><button className="drive-go" onClick={resume}>CONTINUE DRIVING <ArrowRight size={16}/></button></>}</>}
     {ui.mode==='crashed'&&<><h2>GAME OVER.</h2><p>Three collisions. Keep your eyes on the road and have another go. This run earns no profile XP.</p><button className="drive-go" onClick={start}><RotateCcw size={16}/> RETRY</button></>}
     {ui.mode==='finished'&&<><Trophy size={32}/><span>YOU MADE IT TO THE WORKSHOP</span><h2>MISSION COMPLETE!</h2><p>{CAR_TYPES[ui.car].name} · {ui.points} XP · {Object.values(ui.collects).reduce((a,b)=>a+b,0)} items collected.</p><button className="drive-go" onClick={start}><RotateCcw size={16}/> PLAY AGAIN</button></>}
    </div></div>}
   </div>
   <div className="drive-controls"><button onPointerDown={()=>steer(-1)} aria-label="Steer left"><ArrowLeft/> LEFT</button><button onClick={pause} aria-label="Pause or resume" disabled={ui.mode==='select'||ui.mode==='crashed'||ui.mode==='finished'}><Pause/> PAUSE</button><button onPointerDown={()=>steer(1)} aria-label="Steer right">RIGHT <ArrowRight/></button></div>
  </div><aside className="drive-side">
   <div className="drive-rule"><span>01 / ARCADE MODE</span><h3>DRIVE THE RENAULT 5 OR CLIO.</h3><p>High-resolution chase camera with curving roads and arcade handling. Change lanes to avoid traffic. Three collisions end the drive.</p></div>
   <div className="drive-rule"><span>02 / COLLECT WORKSHOP GEAR</span><div className="drive-pickups"><p><Wrench size={17}/> Spanners <strong>+15 XP</strong></p><p><MonitorCog size={17}/> Diagnostic tablets <strong>+25 XP</strong></p><p><Cog size={17}/> Spare parts <strong>+20 XP</strong></p></div><p>Collected this run: {Object.values(ui.collects).reduce((a,b)=>a+b,0)}</p></div>
   <div className="drive-rule"><span>03 / LEARNING CHECKPOINTS</span><h3>THINK FAST.</h3><p>Three technical questions, each worth 60 XP. Finish the route for another 120 XP.</p></div>
   <div className="drive-rule"><span>04 / CONTROLS</span><p><b>Desktop:</b> ← → or A / D to steer. Space to pause.</p><p><b>Mobile:</b> LEFT and RIGHT controls below the road.</p><p><b>Best completed run:</b> {best} XP</p></div>
   <div className="drive-rule disclaimer"><Info size={20}/><span>Fictional arcade simulation and sample training content; not an official Renault game or a substitute for approved workshop procedures. Progress and rankings remain local to this demo.</span></div>
  </aside></div>
 </section>;
}
