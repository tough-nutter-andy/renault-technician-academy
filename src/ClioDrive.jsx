import React,{useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Play,Pause,RotateCcw,Trophy,Info} from 'lucide-react';
import './clio-drive.css';

const W=360,H=560;
const CHECKPOINTS=[
 {at:380,question:'A rested 12V battery reads 12.1V. What does this suggest?',answers:['It is fully charged','It may be partially discharged','The alternator is definitely faulty'],correct:1,explanation:'A rested 12.1V reading suggests a partially discharged lead-acid battery. Confirm with approved checks.'},
 {at:800,question:'You find several network-related fault codes. What should you do first?',answers:['Replace the first ECU listed','Check the full fault picture and power supply','Clear all faults and release the car'],correct:1,explanation:'Check the full diagnostic picture, including battery condition and relevant vehicle procedures.'}
];
function pixelRect(ctx,x,y,w,h,col){ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h))}
function drawClio(ctx,x,y){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));
 // Distinctive cobalt hatchback, top-down 8-bit pixel art (not an exact vehicle depiction).
 pixelRect(ctx,-19,-38,38,78,'#101010');pixelRect(ctx,-23,-21,46,43,'#101010');
 pixelRect(ctx,-19,-34,38,70,'#0649c5');pixelRect(ctx,-21,-18,42,39,'#1168ff');
 pixelRect(ctx,-15,-28,30,24,'#0b2449');pixelRect(ctx,-13,-26,26,17,'#243e62');
 pixelRect(ctx,-16,6,32,17,'#12355e');pixelRect(ctx,-13,8,26,12,'#31547b');
 pixelRect(ctx,-17,-37,10,5,'#eff8ff');pixelRect(ctx,7,-37,10,5,'#eff8ff');
 pixelRect(ctx,-17,31,8,5,'#f44d51');pixelRect(ctx,9,31,8,5,'#f44d51');
 pixelRect(ctx,-22,-7,4,10,'#111');pixelRect(ctx,18,-7,4,10,'#111');
 pixelRect(ctx,-13,25,26,3,'#043388');pixelRect(ctx,-9,-1,18,3,'#5c9bff');
 pixelRect(ctx,-3,-39,6,3,'#d7e1ea');
 ctx.restore();
}
function drawTraffic(ctx,x,y,tint='#777'){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));
 pixelRect(ctx,-22,-39,44,79,'#121212');pixelRect(ctx,-19,-35,38,72,tint);
 pixelRect(ctx,-15,-27,30,21,'#202b33');pixelRect(ctx,-15,9,30,19,'#202b33');
 pixelRect(ctx,-19,31,9,5,'#b22');pixelRect(ctx,10,31,9,5,'#b22');
 ctx.restore();
}
function drawBackground(ctx,state){
 pixelRect(ctx,0,0,W,H,'#4c5651');
 for(let i=0;i<20;i++){
  const y=((i*39+state.distance*1.6)%(H+39))-39;
  pixelRect(ctx,0,y,32,18,i%2?'#748178':'#596b5c');pixelRect(ctx,W-32,y,32,18,i%2?'#748178':'#596b5c');
 }
 pixelRect(ctx,32,0,W-64,H,'#303237');pixelRect(ctx,40,0,4,H,'#e2e2e2');pixelRect(ctx,W-44,0,4,H,'#e2e2e2');
 for(let y=-80+(state.distance*3)%80;y<H;y+=80){pixelRect(ctx,145,y,4,35,'#d8d8d3');pixelRect(ctx,247,y,4,35,'#d8d8d3')}
 // pixel roadside markers
 for(let y=-90+(state.distance*2)%110;y<H;y+=110){pixelRect(ctx,12,y,10,23,'#e7e7e7');pixelRect(ctx,338,y,10,23,'#e7e7e7')}
 const laneX=[95,196,298];
 for(const car of state.obstacles)drawTraffic(ctx,laneX[car.lane],car.y,car.color);
 drawClio(ctx,laneX[state.lane],455);
 // very light scanline effect
 ctx.fillStyle='rgba(0,0,0,.06)';for(let y=0;y<H;y+=4)ctx.fillRect(0,y,W,1);
}
function fresh(){return {lane:1,distance:0,obstacles:[],lastSpawn:0,spawnCount:0,hit:0,invuln:0,mode:'ready',check:0,answered:[],points:0};}
export default function ClioDrive({onReward,personalBest=0,onBack}){
 const canvas=useRef(null),engine=useRef(fresh()),frame=useRef(0),last=useRef(0);
 const [ui,setUi]=useState({mode:'ready',distance:0,hit:0,points:0,check:0});
 const [feedback,setFeedback]=useState(null),[chosen,setChosen]=useState(null),[runBest,setRunBest]=useState(personalBest);
 const update=useCallback(()=>{const s=engine.current;setUi({mode:s.mode,distance:Math.floor(s.distance),hit:s.hit,points:s.points,check:s.check});},[]);
 const start=useCallback(()=>{engine.current=fresh();engine.current.mode='playing';setFeedback(null);setChosen(null);last.current=0;update();},[update]);
 const move=useCallback((d)=>{const s=engine.current;if(s.mode==='playing')s.lane=Math.max(0,Math.min(2,s.lane+d));},[]);
 const pause=useCallback(()=>{const s=engine.current;if(s.mode==='playing')s.mode='paused';else if(s.mode==='paused')s.mode='playing';update();},[update]);
 useEffect(()=>{
  const handler=e=>{if(['ArrowLeft','ArrowRight','ArrowUp',' ','a','A','d','D'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')move(-1);if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')move(1);if(e.key===' '||e.key==='Escape')pause();};
  window.addEventListener('keydown',handler);return ()=>window.removeEventListener('keydown',handler);
 },[move,pause]);
 useEffect(()=>{
  const ctx=canvas.current?.getContext('2d');if(!ctx)return;ctx.imageSmoothingEnabled=false;
  const colors=['#a8b2b6','#d84b44','#62696c','#b8b1a2'];
  const laneX=[95,196,298];
  const loop=(now)=>{
   const s=engine.current;
   const dt=Math.min((now-(last.current||now))/16.667,2);last.current=now;
   if(s.mode==='playing'){
    s.distance+=0.87*dt;
    s.invuln=Math.max(0,s.invuln-dt);
    s.lastSpawn+=dt;
    if(s.lastSpawn>61){s.lastSpawn=0;s.obstacles.push({lane:Math.floor(Math.random()*3),y:-45,color:colors[s.spawnCount%colors.length]});s.spawnCount++;}
    for(const o of s.obstacles){o.y+=2.2*dt;if(o.lane===s.lane&&Math.abs(o.y-455)<57&&s.invuln===0){s.hit++;s.invuln=110;o.y=H+100;if(s.hit>=3)s.mode='crashed';}}
    s.obstacles=s.obstacles.filter(o=>o.y<H+60);
    if(s.mode==='playing'&&s.check<CHECKPOINTS.length&&s.distance>=CHECKPOINTS[s.check].at)s.mode='checkpoint';
    if(s.mode==='playing'&&s.distance>=1200){s.mode='finished';s.points+=100;}
    if(Math.floor(now/150)!==Math.floor((now-16*dt)/150)||s.mode!=='playing')update();
   }
   drawBackground(ctx,s);
   if(s.invuln>0&&Math.floor(now/120)%2===0){pixelRect(ctx,laneX[s.lane]-23,412,46,84,'rgba(255,255,255,.28)')}
   frame.current=requestAnimationFrame(loop);
  };
  frame.current=requestAnimationFrame(loop);return ()=>cancelAnimationFrame(frame.current);
 },[update]);
 const submit=(choice)=>{if(chosen!==null)return;setChosen(choice);const q=CHECKPOINTS[engine.current.check];const good=choice===q.correct;setFeedback({good,message:q.explanation});if(good)engine.current.points+=50;update();};
 const resume=()=>{const s=engine.current;s.check++;s.mode='playing';setFeedback(null);setChosen(null);update();};
 const finishRef=useRef(false);
 useEffect(()=>{if(ui.mode!=='finished'||finishRef.current)return;finishRef.current=true;const earned=engine.current.points;setRunBest(x=>Math.max(x,earned));onReward?.(earned);},[ui.mode,onReward]);
 useEffect(()=>{if(ui.mode==='playing'&&ui.distance<5)finishRef.current=false;},[ui.mode,ui.distance]);
 const question=CHECKPOINTS[Math.min(ui.check,CHECKPOINTS.length-1)];
 return <section className="drive-layout">
  <div className="drive-header"><div><span className="drive-eyebrow">8-BIT TECHNICIAN CHALLENGE</span><h1>CLIO DRIVE.</h1><p>Keep your Clio on the road. Reach the workshop checkpoints, answer technical questions and collect XP.</p></div><button className="drive-back" onClick={onBack}>BACK TO CHALLENGES</button></div>
  <div className="drive-grid"><div className="drive-console">
   <div className="drive-hud"><span>DISTANCE <b>{Math.min(ui.distance,1200)} / 1200</b></span><span>DAMAGE <b>{'■'.repeat(ui.hit)}{'□'.repeat(3-ui.hit)}</b></span><span>RUN XP <b>{ui.points}</b></span></div>
   <div className="drive-stage"><canvas ref={canvas} width={W} height={H} aria-label="Pixel-art top-down driving game with a blue Renault Clio. Use arrow keys or the buttons below to steer."/>
    {ui.mode!=='playing'&&<div className="drive-overlay">
      {ui.mode==='ready'&&<div className="drive-modal"><span>RENAULT TECHNICIAN ACADEMY</span><h2>READY, TECHNICIAN?</h2><p>Steer left or right to avoid traffic. Three hits end the run. Technical checkpoints pause the race.</p><button onClick={start}><Play size={16}/> START ENGINE</button></div>}
      {ui.mode==='paused'&&<div className="drive-modal"><h2>PAUSED</h2><button onClick={pause}><Play size={16}/> CONTINUE</button></div>}
      {ui.mode==='crashed'&&<div className="drive-modal"><h2>RUN ENDED</h2><p>Three collisions. No XP earned for this attempt. Try again!</p><button onClick={start}><RotateCcw size={16}/> RETRY</button></div>}
      {ui.mode==='checkpoint'&&<div className="drive-modal checkpoint"><span>WORKSHOP CHECKPOINT {ui.check+1} / 2</span><h2>TECHNICAL PIT STOP</h2><p>{question.question}</p><div className="drive-answers">{question.answers.map((a,i)=><button key={a} className={chosen===i?'selected':''} disabled={chosen!==null} onClick={()=>submit(i)}>{String.fromCharCode(65+i)}. {a}</button>)}</div>{feedback&&<><div className="drive-feedback"><b>{feedback.good?'CORRECT! +50 XP':'NOT QUITE'}</b><p>{feedback.message}</p></div><button onClick={resume}>BACK TO THE ROAD <ArrowRight size={16}/></button></>}</div>}
      {ui.mode==='finished'&&<div className="drive-modal"><Trophy size={35}/><span>FINISH LINE</span><h2>DRIVE COMPLETE!</h2><p>Run total: <b>{ui.points} XP</b>. Great work completing the drive and technical checkpoints.</p><button onClick={start}><RotateCcw size={16}/> DRIVE AGAIN</button></div>}
    </div>}
   </div>
   <div className="drive-controls"><button onPointerDown={()=>move(-1)} aria-label="Steer left"><ArrowLeft/> LEFT</button><button onClick={pause} aria-label="Pause or resume"><Pause/> PAUSE</button><button onPointerDown={()=>move(1)} aria-label="Steer right">RIGHT <ArrowRight/></button></div>
  </div><aside className="drive-side"><div className="drive-rule"><span>01 / YOUR MISSION</span><h3>DRIVE. DIAGNOSE. WIN.</h3><p>Complete a 1,200 metre run and answer two workshop questions. Watch out for other vehicles!</p></div><div className="drive-rule"><span>02 / REWARDS</span><strong>+50 XP</strong><p>For each correct technical answer.</p><strong>+100 XP</strong><p>For crossing the finish line.</p></div><div className="drive-rule"><span>03 / CONTROLS</span><p><b>Desktop:</b> ← and → or A / D. Space to pause.</p><p><b>Mobile:</b> use the LEFT and RIGHT buttons.</p></div><div className="drive-rule disclaimer"><Info size={17}/>Prototype game. The blue pixel-art hatchback is an illustrative Clio-inspired sprite. This is not a driving or workshop safety training simulation. Personal-best and XP are local demo data.</div></aside></div>
 </section>;
}
