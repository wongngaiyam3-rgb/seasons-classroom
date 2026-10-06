'use client';
import {useEffect,useState} from 'react';
import {Slider} from '@/components/ui/slider';
import {Checkbox} from '@/components/ui/checkbox';
import {Switch} from '@/components/ui/switch';
import {RadioGroup,RadioGroupItem} from '@/components/ui/radio-group';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Sun,Moon,RotateCcw,Play,Pause,HelpCircle,Globe,Clock} from 'lucide-react';
import Scene3D from './Scene3D';
import {OBSERVER_TEXTURE} from './ObserverTexture';
import {dailySolar,timeLabel} from '@/lib/dayNight';

const questions=[
 {q:'日與夜交替主要由甚麼造成？',a:['地球自轉','太陽繞地球轉','月球擋住陽光'],correct:0,why:'地球自轉時，同一地點會輪流朝向和背向太陽。'},
 {q:'地球上受到太陽直接照射的一面是甚麼？',a:['黑夜','白天','所有地方同時日出'],correct:1,why:'朝向太陽並受到陽光照射的地點處於白天。'},
 {q:'地球自轉一周大約需要多久？',a:['一小時','一年','24小時'],correct:2,why:'相對太陽而言，地球自轉一周大約是一天，即24小時。'},
 {q:'在模型中，橙色觀測者怎樣移動？',a:['一直追着太陽走','隨地面一起自轉','離開地球繞太陽飛行'],correct:1,why:'觀測者固定在同一地面位置，隨地球一起自轉。'},
 {q:'同一時間，地球上所有地方都是白天嗎？',a:['是，太陽照亮整個地球','是，只在中午才有黑夜','不是，地球有光亮和黑暗的一面'],correct:2,why:'太陽只能照亮地球朝向它的一面；另一面處於黑夜。'}
];

function SkyView({hour,latitude}:{hour:number;latitude:number}){
 const s=dailySolar(hour,latitude),angle=(s.hour-12)*Math.PI/12;
 const x=130+100*Math.sin(angle),y=159-116*Math.sin(s.altitude*Math.PI/180);
 const day=s.altitude>=0;
 return <svg className="sun-view" viewBox="0 0 260 220" role="img" aria-label={`${timeLabel(hour)}，太陽高度角${s.altitude.toFixed(1)}度`}>
 <defs><linearGradient id="daily-sky" x2="0" y2="1"><stop stopColor={day?'#4e9bd8':'#101b38'}/><stop offset="1" stopColor={day?'#cce6ef':'#384363'}/></linearGradient></defs>
 <rect width="260" height="220" fill="url(#daily-sky)"/>
 {day?<><circle cx={x} cy={y} r="14" fill="#ffdb77"/><path d={`M${x},${y} L130,159`} stroke="#ffe3a0" strokeWidth="2"/></>:<><circle cx="35" cy="38" r="1.5" fill="white"/><circle cx="213" cy="55" r="1.3" fill="white"/><circle cx="169" cy="29" r="1.5" fill="white"/><text x="130" y="52" textAnchor="middle" fill="white" fontSize="15">太陽在地平線下</text></>}
 <rect y="159" width="260" height="61" fill={day?'#425f34':'#263831'}/><path d="M0 159H260" stroke="#f2f4f8" strokeWidth="1"/>
 <image href={OBSERVER_TEXTURE} x="108" y="96" width="44" height="66"/>
 <text x="8" y="183" fill="#dce4e9" fontSize="13">東</text><text x="238" y="183" fill="#dce4e9" fontSize="13">西</text><text x="174" y="147" fill="white" fontSize="14">{s.altitude.toFixed(1)}°</text>
 </svg>;
}

export default function DayNight({onHome}:{onHome:()=>void}){
 const [hour,setHour]=useState(12),[latitude,setLatitude]=useState(30),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState('1'),[axis,setAxis]=useState(true),[inquiry,setInquiry]=useState(false),[light,setLight]=useState(false),[resetToken,setResetToken]=useState(0),[modal,setModal]=useState(''),[qi,setQi]=useState(0),[answer,setAnswer]=useState<number|null>(null),[score,setScore]=useState(0),[done,setDone]=useState(false);
 const s=dailySolar(hour,latitude),latLabel=`${Math.abs(latitude).toFixed(1)}° ${latitude<0?'S':latitude>0?'N':''}`;
 useEffect(()=>{if(!playing)return;const timer=setInterval(()=>setHour(h=>(h+Number(speed)*.04)%24),40);return()=>clearInterval(timer);},[playing,speed]);
 useEffect(()=>{const context=(document as any).modelContext;if(!context?.registerTool)return;const controller=new AbortController();Promise.resolve(context.registerTool({name:'configure_day_night',description:'設定同一固定地點的地方太陽時與緯度，觀察地球自轉造成的日夜。',inputSchema:{type:'object',properties:{hour:{type:'number',minimum:0,maximum:24},latitude:{type:'number',minimum:-75,maximum:75}},required:['hour','latitude'],additionalProperties:false},execute:(input:any)=>{if(!Number.isFinite(input.hour)||input.hour<0||input.hour>24||!Number.isFinite(input.latitude)||Math.abs(input.latitude)>75)throw new Error('時間或緯度超出範圍');setPlaying(false);setHour(input.hour);setLatitude(input.latitude);return dailySolar(input.hour,input.latitude);}},{signal:controller.signal})).catch(()=>{});return()=>controller.abort();},[]);
 function open(value:string){setPlaying(false);setModal(value);}
 function reset(){setHour(12);setLatitude(30);setPlaying(false);setSpeed('1');setAxis(true);setInquiry(false);setResetToken(t=>t+1);}
 function quiz(){setQi(0);setAnswer(null);setScore(0);setDone(false);open('quiz');}
 function next(){if(qi===4)setDone(true);else{setQi(i=>i+1);setAnswer(null);}}
 return <main className={`simulator daily-simulator ${light?'light-mode':''}`}>
 <div className="stars" aria-hidden="true"/>
 <header className="topbar"><div className="brand"><Sun size={29}/><div><h1>日與夜模擬器・教學版</h1><p>跟隨同一地點，觀察地球自轉</p></div></div><nav><button onClick={onHome}>返回主題</button><button onClick={()=>open('learn')}>學習任務</button><button className="icon-button" aria-label="重設模擬" onClick={reset}><RotateCcw size={19}/></button><button className="icon-button" aria-label="切換深色或淺色模式" onClick={()=>setLight(!light)}>{light?<Sun size={19}/>:<Moon size={19}/>}</button></nav></header>
 <section className="space"><Scene3D lesson="day-night" hour={hour} day={0} axis={axis} lat={latitude} light={light} resetToken={resetToken} south={latitude<0}/></section>
 <aside className="panel data-panel" aria-label="時間與日夜資訊"><h2 data-testid="local-time">{timeLabel(hour)}</h2><p className={`season-tag daily-state ${s.altitude<0?'night':''}`} data-testid="day-night-state">{inquiry?'先觀察光亮與黑暗':s.state}</p><p className="daily-fixed-note">橙色觀測者固定在同一地點</p><div className="stats"><div><span>自轉一周</span><strong>約24小時</strong></div><div><span>自轉方向</span><strong>由西向東</strong></div><div><span>觀測者緯度</span><strong>{latLabel}</strong></div><div><span>太陽高度角</span><strong data-testid="daily-altitude">{s.altitude.toFixed(1)}°</strong></div></div><p className="small-note daily-explainer">朝向太陽的一面受到光照；背向太陽的一面處於黑暗。</p></aside>
 <aside className="panel observer-panel" aria-label="觀測者天空"><h3><Sun size={16}/> 觀測者視角：天空</h3><SkyView hour={hour} latitude={latitude}/><div className="intensity"><strong>{Math.round(s.intensity)}%</strong><span>相對日照強度</span></div><div className="meter"><div style={{width:`${s.intensity}%`}}/></div><dl><div><dt>太陽位置</dt><dd>{s.altitude>.001?'地平線上':s.altitude<-.001?'地平線下':'地平線附近'}</dd></div><div><dt>觀測者位置</dt><dd>固定在地面</dd></div></dl><p className="small-note">時間採用地方太陽時。此模式固定在春分前後，方便觀察一次自轉。</p></aside>
 <section className="panel controls" aria-label="日夜模擬控制"><label className="check-label"><Checkbox checked={inquiry} onCheckedChange={v=>setInquiry(v===true)} aria-label="探究模式"/> 探究模式：隱藏白天／黑夜文字提示</label><p className="date-hemi">選擇時間，再觀察橙色觀測者的位置</p><div className="dates">{[[6,'日出'],[12,'正午'],[18,'日落'],[0,'午夜']].map(([h,text])=><button key={h} aria-pressed={Math.abs(s.hour-Number(h))<.02} onClick={()=>{setPlaying(false);setHour(Number(h));}}>{timeLabel(Number(h))}（{text}）</button>)}</div><div className="slider-title"><label id="daily-time-label"><Clock size={15}/> 時間（一天自轉進度）</label><span>{timeLabel(hour)}</span></div><Slider aria-labelledby="daily-time-label" value={[hour]} min={0} max={24} step={.1} onValueChange={v=>{setPlaying(false);setHour(v[0]);}}/><div className="bottom-controls"><div className="latitude-control"><div className="slider-title"><label id="daily-lat-label"><Globe size={15}/> 觀測者緯度</label><span>{latLabel}</span></div><Slider aria-labelledby="daily-lat-label" value={[latitude]} min={-75} max={75} step={.5} onValueChange={v=>setLatitude(v[0])}/></div><button className="play-button" aria-label={playing?'暫停自轉':'播放自轉'} onClick={()=>setPlaying(!playing)}>{playing?<Pause size={19}/>:<Play size={19} fill="currentColor"/>}</button><RadioGroup value={speed} onValueChange={setSpeed} className="pill-group speed-group" aria-label="播放速度">{['0.5','1','3'].map(v=><label key={v} className={speed===v?'selected':''}><RadioGroupItem value={v} aria-label={`${v}倍速度`}/>{v}×</label>)}</RadioGroup><label className="axis-label">顯示地軸 <Switch checked={axis} onCheckedChange={setAxis} aria-label="顯示地軸"/></label></div></section>
 <footer><button onClick={()=>open('about')}>▸ 模型說明</button><button className="quiz-button" onClick={quiz}><HelpCircle size={19}/> 小測驗 <span>5</span></button></footer>
 <Dialog open={!!modal} onOpenChange={v=>{if(!v)setModal('');}}><DialogContent className="teaching-dialog"><DialogTitle>{modal==='learn'?'日與夜學習任務':modal==='about'?'日與夜模型說明':'日與夜小測驗'}</DialogTitle><DialogDescription>{modal==='learn'?'先預測，再轉動地球，用觀察解釋日與夜。':modal==='about'?'了解模型如何表示地球自轉。':'運用剛才的觀察作答。'}</DialogDescription>
 {modal==='about'&&<div className="prose"><p>地球由西向東自轉。相對太陽而言，自轉一周約24小時，同一地點便會經歷日與夜。</p><p>橙色觀測者固定在同一地面位置，與海陸貼圖一起自轉；轉動視角只會改變你的觀察角度。若觀測者到了背面，可以拖曳地球查看。</p><p>此模式固定在春分前後，太陽直射赤道，並暫停公轉；地軸仍傾斜23.5°。時間採用地方太陽時，正午為12:00，不代表各地的實際鐘錶時間。日出約06:00，日落約18:00。</p><p>太陽、地球的大小和距離不按實際比例；自轉速度加快以方便觀察。模型不計大氣折射、地形或天氣的影響。需要比較季節與晝長時，請返回主題選擇「四季」。</p></div>}
 {modal==='learn'&&<div className="tasks">{[{title:'追蹤同一位觀測者',text:'從06:00開始播放，追蹤橙色觀測者一整天。他何時進入光亮的一面？何時進入黑暗的一面？',hour:6},{title:'同一時間，世界各地一樣嗎？',text:'設定12:00，拖曳視角觀察地球的另一面。兩面是否同時受到太陽光照？用光暗位置解釋。',hour:12},{title:'太陽為甚麼看起來會移動？',text:'依次比較06:00、12:00和18:00的天空。再觀察地球自轉，說明太陽看起來移動的原因。',hour:6}].map((task,i)=><article key={task.title}><span>任務 {i+1}</span><h3>{task.title}</h3><p>{task.text}</p><button onClick={()=>{setHour(task.hour);setPlaying(false);setModal('');}}>開始這個任務</button></article>)}</div>}
 {modal==='quiz'&&(done?<div className="quiz-result"><Sun size={45}/><h3>完成了！</h3><p>答對 <strong>{score} / 5</strong> 題</p><p>再觀察一次地球，解釋你的答案。</p><button onClick={quiz}>再試一次</button></div>:<div className="quiz-body"><p className="question-count">問題 {qi+1} / 5</p><h3>{questions[qi].q}</h3><div className="answers">{questions[qi].a.map((a,i)=><button key={a} disabled={answer!==null} className={answer===null?'':i===questions[qi].correct?'correct':i===answer?'incorrect':''} onClick={()=>{setAnswer(i);if(i===questions[qi].correct)setScore(n=>n+1);}}>{String.fromCharCode(65+i)}. {a}</button>)}</div>{answer!==null&&<p className="feedback" role="status"><strong>{answer===questions[qi].correct?'答對了！':'再想一想。'}</strong>{questions[qi].why}</p>}<div className="quiz-actions"><button onClick={next}>跳過</button><button disabled={answer===null} onClick={next}>{qi===4?'查看結果':'下一題'}</button></div></div>)}
 </DialogContent></Dialog>
 </main>;
}
