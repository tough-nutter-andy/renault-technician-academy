import React,{useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Play,Pause,RotateCcw,Trophy,Info,CarFront,Wrench,MonitorCog,Cog} from 'lucide-react';
import './clio-drive.css';

// Self-contained, canvas-rendered 16-bit-inspired arcade challenge.
// Illustrative pixel vehicles, not official Renault artwork.
const W=384,H=576,ROAD_TOP=110,ROAD_BOTTOM=560,FINISH=1800;
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
function rect(ctx,x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
function poly(ctx,pts,color){ctx.fillStyle=color;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
function roadWidth(y){let t=clamp((y-ROAD_TOP)/(ROAD_BOTTOM-ROAD_TOP),0,1);return 90+290*Math.pow(t,0.85);}
function lanePosition(lane,y){return W/2+laneCenters[lane]*roadWidth(y)*0.29;}
function project(depth){const t=clamp(1-depth,0,1);return ROAD_TOP+Math.pow(t,1.6)*(ROAD_BOTTOM-ROAD_TOP);}
function sedan(ctx,x,y,s,color='#aeb3bc'){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(s,s);
 // Opposing vehicle viewed from the rear, chunky graduated shading.
 rect(ctx,-23,-22,46,49,'#15181c');rect(ctx,-18,-37,36,13,'#292f39');
 poly(ctx,[[-22,-18],[-17,-37],[17,-37],[22,-18]],color);
 rect(ctx,-23,-16,46,35,color);rect(ctx,-17,-31,34,13,'#17283d');rect(ctx,-15,-29,30,8,'#426277');
 rect(ctx,-22,4,44,10,'#30343b');rect(ctx,-19,13,38,4,'#b6bbc2');
 rect(ctx,-22,0,9,7,'#f54442');rect(ctx,13,0,9,7,'#f54442');
 rect(ctx,-20,17,40,7,'#18191b');rect(ctx,-16,24,9,8,'#111');rect(ctx,7,24,9,8,'#111');
 ctx.restore();
}
function playerCar(ctx,x,y,kind,blink){
 const car=CAR_TYPES[kind];const w=car.width,h=car.height;
 ctx.save();ctx.translate(Math.round(x),Math.round(y));
 // Drop shadow / tyres / pixel stepped body. Rear-facing camera view.
 rect(ctx,-w/2+4,8,w-8,9,'rgba(0,0,0,.28)');
 rect(ctx,-w/2-3,-h/2+38,11,55,'#111');rect(ctx,w/2-8,-h/2+38,11,55,'#111');
 if(kind==='clio'){
  poly(ctx,[[-28,-48],[28,-48],[34,-31],[36,36],[29,48],[-29,48],[-36,36],[-34,-31]],'#091526');
  poly(ctx,[[-26,-48],[26,-48],[32,-31],[34,33],[27,45],[-27,45],[-34,33],[-32,-31]],car.color);
  rect(ctx,-27,-41,54,26,'#112239');rect(ctx,-23,-38,46,16,'#264968');
  rect(ctx,-30,-9,60,16,car.dark);rect(ctx,-27,9,54,19,car.light);rect(ctx,-26,14,52,14,car.color);
  rect(ctx,-32,27,64,13,car.dark);rect(ctx,-30,40,60,6,'#111a27');
  rect(ctx,-29,28,19,8,'#e62d39');rect(ctx,10,28,19,8,'#e62d39');
  rect(ctx,-10,36,20,6,'#f1f1ee');rect(ctx,-6,38,12,2,'#333');
  rect(ctx,-4,24,8,5,'#d8e2eb');rect(ctx,-2,25,4,3,'#111');
  rect(ctx,-21,-44,42,3,car.light);
 }else{
  poly(ctx,[[-33,-43],[33,-43],[38,-34],[38,38],[31,48],[-31,48],[-38,38],[-38,-34]],'#111820');
  poly(ctx,[[-30,-43],[30,-43],[35,-32],[35,35],[29,44],[-29,44],[-35,35],[-35,-32]],car.color);
  rect(ctx,-29,-37,58,25,'#161d29');rect(ctx,-26,-35,52,15,'#3e596a');
  rect(ctx,-34,-6,68,12,car.dark);rect(ctx,-32,10,64,17,car.light);rect(ctx,-30,15,60,11,car.color);
  rect(ctx,-35,28,70,13,car.dark);rect(ctx,-32,41,64,5,'#1b2228');
  rect(ctx,-33,24,18,9,'#ed3030');rect(ctx,15,24,18,9,'#ed3030');
  rect(ctx,-10,36,20,7,'#f4f4f4');rect(ctx,-3,25,6,5,'#eaeaea');
  rect(ctx,-26,-39,52,3,car.light);
 }
 if(blink){ctx.fillStyle='rgba(255,255,255,.50)';ctx.fillRect(-w/2,-h/2,w,h)}
 ctx.restore();
}
function collectible(ctx,x,y,size,kind,tick){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));const s=clamp(size,0.3,1.4);ctx.scale(s,s);
 const pulse=Math.sin(tick/11)*2;rect(ctx,-19,-22+pulse,38,40,'#0e1013');rect(ctx,-16,-19+pulse,32,34,'#fff');
 if(kind==='spanner'){rect(ctx,-4,-5+pulse,8,20,'#5a6572');rect(ctx,-9,-16+pulse,6,13,'#5a6572');rect(ctx,3,-16+pulse,6,13,'#5a6572');rect(ctx,-3,-11+pulse,6,9,'#fff');}
 if(kind==='diagnostic'){rect(ctx,-12,-12+pulse,24,20,'#222');rect(ctx,-9,-9+pulse,18,13,'#71b4cc');rect(ctx,-4,10+pulse,8,3,'#333');rect(ctx,-2,-6+pulse,4,5,'#f7f7f7');}
 if(kind==='part'){rect(ctx,-10,-8+pulse,20,20,'#555');rect(ctx,-7,-15+pulse,14,7,'#777');rect(ctx,-4,-20+pulse,8,7,'#555');rect(ctx,-4,-3+pulse,8,8,'#fff');}
 ctx.restore();
}
function drawScene(ctx,s){
 rect(ctx,0,0,W,H,'#6d9ac0'); // horizon sky
 for(let y=0;y<155;y+=7)rect(ctx,0,y,W,7,`hsl(204 36% ${61-y/20}%)`);
 // chunky pixel clouds, mountains, roadside trees
 poly(ctx,[[0,169],[0,115],[38,101],[75,139],[112,110],[156,153],[206,108],[248,137],[288,104],[350,124],[384,100],[384,169]],'#6b8997');
 poly(ctx,[[0,171],[0,137],[44,151],[105,131],[172,160],[246,140],[320,151],[384,130],[384,171]],'#44695a');
 rect(ctx,0,166,W,H-166,'#507653');
 const offset=(s.distance*3)%100;
 for(let k=-2;k<9;k++){
  const y=ROAD_TOP+k*100+offset;const t=clamp((y-ROAD_TOP)/(ROAD_BOTTOM-ROAD_TOP),0,1);
  if(y<ROAD_TOP||y>H)continue;
  const scale=.35+t*1.15;
  for(const side of [-1,1]){const x=W/2+side*(roadWidth(y)/2+25+20*t);
   rect(ctx,x-7*scale,y-29*scale,14*scale,30*scale,'#443d2d');
   rect(ctx,x-17*scale,y-49*scale,34*scale,27*scale,k%2?'#214b31':'#326c37');
   rect(ctx,x-12*scale,y-54*scale,24*scale,10*scale,'#3e7c46');
  }
 }
 // Perspective trapezoid, layered shoulders and 3 racing lanes
 const topW=roadWidth(ROAD_TOP),botW=roadWidth(H);
 poly(ctx,[[W/2-topW/2-8,ROAD_TOP],[W/2+topW/2+8,ROAD_TOP],[W/2+botW/2+10,H],[W/2-botW/2-10,H]],'#d4d2ca');
 poly(ctx,[[W/2-topW/2,ROAD_TOP],[W/2+topW/2,ROAD_TOP],[W/2+botW/2,H],[W/2-botW/2,H]],'#36383e');
 for(const side of [-1,1]){
  for(let k=0;k<16;k++){const depth=((k/16 + s.distance/210)%1);const y1=project(1-depth),y2=project(1-clamp(depth+.035,0,1));
   if(y2<=y1)continue;const edge1=W/2+side*roadWidth(y1)/2,edge2=W/2+side*roadWidth(y2)/2;
   poly(ctx,[[edge1-2,y1],[edge1+2,y1],[edge2+4,y2],[edge2-4,y2]],k%2?'#f8f8f8':'#c34144');
  }
 }
 for(let divider=1;divider<=2;divider++){
  for(let k=0;k<17;k++){
   const depth=((k/17+s.distance/190)%1);const y1=project(1-depth),y2=project(1-clamp(depth+.033,0,1));
   const lx= W/2+(divider-1.5)*roadWidth(y1)/3,rx=W/2+(divider-1.5)*roadWidth(y2)/3;
   poly(ctx,[[lx-1,y1],[lx+1,y1],[rx+2,y2],[rx-2,y2]],'#e8e5d8');
  }
 }
 const objects=[...s.objects].sort((a,b)=>b.depth-a.depth);
 for(const o of objects){const y=project(o.depth),x=lanePosition(o.lane,y);const t=clamp((y-ROAD_TOP)/(ROAD_BOTTOM-ROAD_TOP),0,1),scale=.30+t*1.17;
  if(o.type==='traffic')sedan(ctx,x,y,scale,o.color);
  else collectible(ctx,x,y,scale,o.type,s.tick);
 }
 const px=lanePosition(s.visualLane,465);playerCar(ctx,px,472,s.car,s.invuln>0&&Math.floor(s.tick/7)%2===0);
 rect(ctx,0,H-14,W,14,'#18191e');
 ctx.fillStyle='rgba(0,0,0,.055)';for(let y=0;y<H;y+=4)ctx.fillRect(0,y,W,1);
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
 return <section className="drive-layout drive16">
  <div className="drive-header"><div><span className="drive-eyebrow">16-BIT INSPIRED · TECHNICIAN ARCADE</span><h1>RENAULT ROAD QUEST.</h1><p>Choose your car, weave through traffic, collect tools and pass three technical pit stops.</p></div><button className="drive-back" onClick={onBack}>BACK TO CHALLENGES</button></div>
  <div className="drive-grid"><div className="drive-console">
   <div className="drive-hud"><span>DISTANCE <b>{Math.min(Math.floor(ui.distance),FINISH)} / {FINISH} m</b></span><span>HEALTH <b>{'♥'.repeat(3-ui.damage)}{'♡'.repeat(ui.damage)}</b></span><span>RUN XP <b>{ui.points}</b></span></div>
   <div className="drive-stage"><canvas ref={canvas} width={W} height={H} aria-label="Retro 16-bit-inspired rear-view driving game. Steer Renault 5 or Clio left and right to avoid traffic and collect workshop tools."/>
    {ui.mode!=='playing'&&<div className="drive-overlay"><div className="drive-modal">
     {ui.mode==='select'&&<><span>RENAULT TECHNICIAN ACADEMY</span><h2>CHOOSE YOUR RIDE.</h2><p>Two iconic Renault hatchbacks. One workshop challenge.</p><div className="drive-car-choices">{Object.entries(CAR_TYPES).map(([id,c])=><button key={id} className={ui.car===id?'active':''} onClick={()=>choose(id)}><span className={`car-preview ${id}`}><CarFront size={32}/></span><strong>{c.name}</strong><small>{ui.car===id?'SELECTED':'CHOOSE'}</small></button>)}</div><button className="drive-go" onClick={start}><Play size={16}/> START ENGINE</button></>}
     {ui.mode==='paused'&&<><h2>PAUSED.</h2><p>Take a pit stop. Your distance and collectibles are safe.</p><button className="drive-go" onClick={pause}><Play size={16}/> CONTINUE</button></>}
     {ui.mode==='checkpoint'&&<><span>TECHNICAL PIT STOP {ui.quiz+1} / {QUIZZES.length}</span><h2>KNOW YOUR TECH.</h2><p>{q.question}</p><div className="drive-answers">{q.answers.map((a,i)=><button key={a} disabled={ui.chosen!==null} className={ui.chosen===i?'selected':''} onClick={()=>answer(i)}>{String.fromCharCode(65+i)}. {a}</button>)}</div>{ui.feedback&&<><div className="drive-feedback"><b>{ui.feedback.correct?'CORRECT · +60 XP':'NOT QUITE'}</b><p>{ui.feedback.explanation}</p></div><button className="drive-go" onClick={resume}>CONTINUE DRIVING <ArrowRight size={16}/></button></>}</>}
     {ui.mode==='crashed'&&<><h2>GAME OVER.</h2><p>Three collisions. Keep your eyes on the road and have another go. This run earns no profile XP.</p><button className="drive-go" onClick={start}><RotateCcw size={16}/> RETRY</button></>}
     {ui.mode==='finished'&&<><Trophy size={32}/><span>YOU MADE IT TO THE WORKSHOP</span><h2>MISSION COMPLETE!</h2><p>{CAR_TYPES[ui.car].name} · {ui.points} XP · {Object.values(ui.collects).reduce((a,b)=>a+b,0)} items collected.</p><button className="drive-go" onClick={start}><RotateCcw size={16}/> PLAY AGAIN</button></>}
    </div></div>}
   </div>
   <div className="drive-controls"><button onPointerDown={()=>steer(-1)} aria-label="Steer left"><ArrowLeft/> LEFT</button><button onClick={pause} aria-label="Pause or resume" disabled={ui.mode==='select'||ui.mode==='crashed'||ui.mode==='finished'}><Pause/> PAUSE</button><button onPointerDown={()=>steer(1)} aria-label="Steer right">RIGHT <ArrowRight/></button></div>
  </div><aside className="drive-side">
   <div className="drive-rule"><span>01 / ARCADE MODE</span><h3>DRIVE THE RENAULT 5 OR CLIO.</h3><p>16-bit-inspired third-person road view. Change lanes to avoid traffic. Three collisions end the drive.</p></div>
   <div className="drive-rule"><span>02 / COLLECT WORKSHOP GEAR</span><div className="drive-pickups"><p><Wrench size={17}/> Spanners <strong>+15 XP</strong></p><p><MonitorCog size={17}/> Diagnostic tablets <strong>+25 XP</strong></p><p><Cog size={17}/> Spare parts <strong>+20 XP</strong></p></div><p>Collected this run: {Object.values(ui.collects).reduce((a,b)=>a+b,0)}</p></div>
   <div className="drive-rule"><span>03 / LEARNING CHECKPOINTS</span><h3>THINK FAST.</h3><p>Three technical questions, each worth 60 XP. Finish the route for another 120 XP.</p></div>
   <div className="drive-rule"><span>04 / CONTROLS</span><p><b>Desktop:</b> ← → or A / D to steer. Space to pause.</p><p><b>Mobile:</b> LEFT and RIGHT controls below the road.</p><p><b>Best completed run:</b> {best} XP</p></div>
   <div className="drive-rule disclaimer"><Info size={20}/><span>Fictional arcade simulation and sample training content; not an official Renault game or a substitute for approved workshop procedures. Progress and rankings remain local to this demo.</span></div>
  </aside></div>
 </section>;
}
