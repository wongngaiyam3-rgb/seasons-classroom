'use client';
import {useEffect,useRef,useState} from 'react';
// @ts-ignore
import * as THREE from 'three';
// @ts-ignore
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {phase,stops} from '@/lib/solar';
import {SoftwareRenderer} from './SoftwareRenderer';
import {EARTH_TEXTURE} from './EarthTexture';
import {Plus,Minus,Focus,RotateCcw,Pause,Play,Move,Layers} from 'lucide-react';
type Props={day:number;axis:boolean;lat:number;light:boolean;resetToken:number;south:boolean};
export default function Scene3D(props:Props){
 const mount=useRef<HTMLDivElement>(null),label=useRef<HTMLDivElement>(null),seasonLabels=useRef<(HTMLDivElement|null)[]>([]),landmarkLabels=useRef<(HTMLDivElement|null)[]>([]),landmarkLines=useRef<(SVGLineElement|null)[]>([]),current=useRef(props),actions=useRef<any>(null),spin=useRef(true),compare=useRef(false);current.current=props;
 const [spinning,setSpinning]=useState(true),[mode,setMode]=useState('overview'),[moving,setMoving]=useState(false),[comparing,setComparing]=useState(false),[textureStatus,setTextureStatus]=useState('loading');const panMode=useRef(false);
 useEffect(()=>{
 const host=mount.current!;let renderer:any;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});}catch{renderer=new SoftwareRenderer();}
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.domElement.setAttribute('aria-label','立體太陽與地球模型：拖曳旋轉，滾輪或雙指縮放，方向鍵平移');renderer.domElement.setAttribute('tabindex','0');host.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(43,1,.05,180),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.1;controls.minDistance=2.6;controls.maxDistance=65;controls.enablePan=true;controls.screenSpacePanning=true;controls.rotateSpeed=.65;controls.zoomSpeed=.9;controls.keyPanSpeed=25;controls.listenToKeyEvents(renderer.domElement);
 const Y=new THREE.Vector3(0,1,0),north=new THREE.Vector3(-Math.sin(23.5*Math.PI/180),Math.cos(23.5*Math.PI/180),0),tilt=new THREE.Quaternion().setFromUnitVectors(Y,north),previousEarth=new THREE.Vector3();let focus=false,first=true,lastTime=0,rotation=0,raf=0,disposed=false;
 let textureReady=false;
 renderer.domElement.dataset.texture='loading';
 const tex=new THREE.TextureLoader().load(EARTH_TEXTURE,(loaded:any)=>{if(disposed){loaded.dispose();return;}loaded.colorSpace=THREE.SRGBColorSpace;loaded.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());loaded.needsUpdate=true;textureReady=true;setTextureStatus('loaded');renderer.domElement.dataset.texture='loaded';renderer.domElement.dataset.textureSize=loaded.image.width+'x'+loaded.image.height;},undefined,()=>{if(disposed)return;setTextureStatus('failed');renderer.domElement.dataset.texture='failed';});tex.colorSpace=THREE.SRGBColorSpace;
 const earthGeo=new THREE.SphereGeometry(1,96,64),earthMat=new THREE.MeshPhongMaterial({map:tex,shininess:8,specular:0x12334b});
 const line=(points:any[],color:number,opacity=1)=>new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));
 const personMat=new THREE.MeshBasicMaterial({color:0xff9d21}),whiteMat=new THREE.MeshBasicMaterial({color:0xfff8df}),darkMat=new THREE.MeshBasicMaterial({color:0x152c44});
 function makeGlobe(){
  const group=new THREE.Group(),tilted=new THREE.Group(),surface=new THREE.Group();scene.add(group);group.add(tilted);tilted.quaternion.copy(tilt);tilted.add(surface);const earth=new THREE.Mesh(earthGeo,earthMat);earth.userData.softwareGlobe=true;surface.add(earth);
  const axisLine=line([new THREE.Vector3(0,-1.5,0),new THREE.Vector3(0,1.5,0)],0xdbeafe);tilted.add(axisLine);
  const equator=line(Array.from({length:129},(_,i)=>new THREE.Vector3(1.012*Math.cos(i/128*Math.PI*2),0,1.012*Math.sin(i/128*Math.PI*2))),0xffd86f);tilted.add(equator);
  const latitudeLine=line(Array.from({length:129},()=>new THREE.Vector3()),0x43e5dd,.75);tilted.add(latitudeLine);
  const marker=new THREE.Group();group.add(marker);const part=(geo:any,mat:any,x:number,y:number,z:number)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);marker.add(m);return m;};
  part(new THREE.SphereGeometry(.105,18,12),personMat,0,.55,0);part(new THREE.CylinderGeometry(.09,.065,.23,14),personMat,0,.32,0);for(const x of [-.047,.047])part(new THREE.CylinderGeometry(.025,.025,.20,10),whiteMat,x,.13,0);for(const x of [-.12,.12]){const arm=part(new THREE.CylinderGeometry(.024,.024,.19,10),personMat,x,.31,.025);arm.rotation.z=x<0?-.35:.35;}for(const x of [-.035,.035])part(new THREE.SphereGeometry(.015,8,6),darkMat,x,.575,.092);part(new THREE.ConeGeometry(.035,.07,10),whiteMat,0,.54,.125).rotation.x=Math.PI/2;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.18,.025,8,36),new THREE.MeshBasicMaterial({color:0x36fff0}));ring.rotation.x=Math.PI/2;ring.position.y=.01;marker.add(ring);
  const arrow=new THREE.ArrowHelper(Y,new THREE.Vector3(),.95,0xffe497,.2,.09);group.add(arrow);
  const rays=[-1,0,1].map(()=>{const ray=new THREE.ArrowHelper(Y,new THREE.Vector3(),5,0xffd65b,.28,.10);group.add(ray);return ray;});
  return {group,tilted,surface,axisLine,latitudeLine,marker,arrow,rays,radial:new THREE.Vector3(),S:new THREE.Vector3(),previousLat:NaN};
 }
 const globes=Array.from({length:4},makeGlobe);globes.slice(1).forEach(g=>g.group.visible=false);
 const sun=new THREE.Mesh(new THREE.SphereGeometry(1.5,48,32),new THREE.MeshBasicMaterial({color:0xffdf89}));scene.add(sun);
 const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=128;const gc=glowCanvas.getContext('2d')!,gr=gc.createRadialGradient(64,64,20,64,64,64);gr.addColorStop(0,'rgba(255,216,128,.30)');gr.addColorStop(.5,'rgba(255,216,128,.10)');gr.addColorStop(1,'rgba(255,216,128,0)');gc.fillStyle=gr;gc.fillRect(0,0,128,128);const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glowCanvas),transparent:true,depthWrite:false}));glow.scale.set(7,7,1);scene.add(glow);
 scene.add(new THREE.AmbientLight(0xffffff,.025));const sunlight=new THREE.PointLight(0xffffff,2.2,0,0);scene.add(sunlight);
 const orbit=line(Array.from({length:181},(_,i)=>new THREE.Vector3(8*Math.cos(i/180*Math.PI*2),0,8*Math.sin(i/180*Math.PI*2))),0x557496,.65);scene.add(orbit);
 function overview(){focus=false;setMode('overview');controls.target.set(0,0,0);camera.position.set(0,compare.current?16:11.5,compare.current?19:26);controls.update();}
 function closeup(){compare.current=false;setComparing(false);focus=true;setMode('earth');const a=phase(current.current.day)-Math.PI/2,pos=globes[0].group.position.set(8*Math.cos(a),0,8*Math.sin(a)),S=pos.clone().normalize().negate(),tangent=new THREE.Vector3().crossVectors(north,S).normalize(),dir=S.clone().multiplyScalar(3.5).add(tangent.multiplyScalar(5.1)).add(north.clone().multiplyScalar(2.2));controls.target.copy(pos);camera.position.copy(pos).add(dir);controls.update();first=true;}
 actions.current={zoom:(factor:number)=>{camera.position.sub(controls.target).multiplyScalar(factor).clampLength(controls.minDistance,controls.maxDistance).add(controls.target);controls.update();},overview,closeup,compare:()=>{compare.current=!compare.current;setComparing(compare.current);first=true;overview();},reset:()=>{compare.current=false;setComparing(false);first=true;overview();},pan:(on:boolean)=>{panMode.current=on;controls.mouseButtons.LEFT=on?THREE.MOUSE.PAN:THREE.MOUSE.ROTATE;controls.touches.ONE=on?THREE.TOUCH.PAN:THREE.TOUCH.ROTATE;}};overview();
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(w<1||h<1)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const ro=new ResizeObserver(resize);ro.observe(host);resize();
 const eqSun=new THREE.Vector3(),facing=new THREE.Vector3(),right=new THREE.Vector3(),basis=new THREE.Matrix4(),proj=new THREE.Vector3();
 function frame(now:number){if(disposed)return;const dt=Math.min((now-lastTime)/1000||0,.15);lastTime=now;const p=current.current;if(spin.current)rotation+=dt*.32;
 globes.forEach((g,i)=>{g.group.visible=textureReady&&(i===0||compare.current);if(!g.group.visible)return;const day=compare.current?stops[i]:p.day,a=phase(day)-Math.PI/2,pos=g.group.position;pos.set(8*Math.cos(a),0,8*Math.sin(a));if(i===0){if(focus&&!first){const delta=pos.clone().sub(previousEarth);camera.position.add(delta);controls.target.add(delta);}previousEarth.copy(pos);first=false;}g.surface.rotation.y=rotation;g.axisLine.visible=p.axis;
 const S=g.S.copy(pos).normalize().negate(),radial=g.radial,phi=p.lat*Math.PI/180;eqSun.copy(S).addScaledVector(north,-S.dot(north)).normalize();radial.copy(north).multiplyScalar(Math.sin(phi)).addScaledVector(eqSun,Math.cos(phi)).normalize();g.marker.position.copy(radial).multiplyScalar(1.03);facing.copy(S).addScaledVector(radial,-S.dot(radial));if(facing.lengthSq()<1e-8)facing.copy(north).addScaledVector(radial,-north.dot(radial));facing.normalize();right.crossVectors(radial,facing).normalize();basis.makeBasis(right,radial,facing);g.marker.quaternion.setFromRotationMatrix(basis);g.arrow.position.copy(g.marker.position).addScaledVector(radial,.64);g.arrow.setDirection(S);
 // Three parallel rays meet the sunlit hemisphere, with arrowheads pointing from Sun to Earth.
 const perpendicular=north.clone().addScaledVector(S,-north.dot(S)).normalize();g.rays.forEach((ray:any,j:number)=>{const off=(j-1)*.52,start=S.clone().multiplyScalar(6.35).addScaledVector(perpendicular,off),end=S.clone().multiplyScalar(Math.sqrt(1-off*off)+.015).addScaledVector(perpendicular,off);ray.position.copy(start);ray.setDirection(S.clone().negate());ray.setLength(start.distanceTo(end),.28,.10);});
 if(g.previousLat!==p.lat){const points=g.latitudeLine.geometry.attributes.position;for(let k=0;k<129;k++){const t=k/128*Math.PI*2;points.setXYZ(k,1.016*Math.cos(phi)*Math.cos(t),1.016*Math.sin(phi),1.016*Math.cos(phi)*Math.sin(t));}points.needsUpdate=true;g.previousLat=p.lat;}
 });controls.update();renderer.render(scene,camera);
 const w=host.clientWidth,h=host.clientHeight;
 if(label.current){const g=globes[0];proj.copy(g.marker.position).add(g.group.position).addScaledVector(g.radial,.95).project(camera);const x=(proj.x*.5+.5)*w,y=(-proj.y*.5+.5)*h;label.current.style.display=textureReady&&!compare.current&&proj.z<1&&x>0&&x<w&&y>0&&y<h?'block':'none';label.current.style.left=`${Math.max(74,Math.min(w-74,x))}px`;label.current.style.top=`${Math.max(90,Math.min(h-45,y))}px`;const behind=g.radial.dot(camera.position.clone().sub(g.group.position).normalize())<-.04;label.current.dataset.behind=String(behind);const state=label.current.querySelector('small');if(state)state.textContent=behind?'位於地球背面 · 拖曳查看':'正午定位 · 面向太陽';}
 seasonLabels.current.forEach((el,i)=>{if(!el)return;proj.copy(globes[i].group.position).project(camera);const x=(proj.x*.5+.5)*w,y=(-proj.y*.5+.5)*h;el.style.display=textureReady&&compare.current&&proj.z<1&&x>0&&x<w&&y>0&&y<h?'block':'none';const sunScreen=new THREE.Vector3().project(camera),sx=(sunScreen.x*.5+.5)*w,sy=(-sunScreen.y*.5+.5)*h,vertical=Math.abs(y-sy)>Math.abs(x-sx);el.style.left=Math.max(50,Math.min(w-50,x+(vertical?65:0)))+'px';el.style.top=Math.max(100,Math.min(h-80,y+(vertical?-20:45)))+'px';});
 // Project geographic landmarks after camera movement; labels keep a readable screen size.
 const shellBounds=host.getBoundingClientRect(),occupied:{left:number;top:number;right:number;bottom:number}[]=[];
 const reserve=(el:HTMLElement|null)=>{if(!el||getComputedStyle(el).display==='none')return;const r=el.getBoundingClientRect();occupied.push({left:r.left-shellBounds.left-6,top:r.top-shellBounds.top-6,right:r.right-shellBounds.left+6,bottom:r.bottom-shellBounds.top+6});};
 reserve(label.current);seasonLabels.current.forEach(reserve);reserve(host.parentElement?.querySelector('.scene-help') as HTMLElement|null);
 globes.forEach((g,i)=>{
  const towardCamera=camera.position.clone().sub(g.group.position);
  const equatorPoint=towardCamera.addScaledVector(north,-towardCamera.dot(north)).normalize().multiplyScalar(1.012);
  if(equatorPoint.lengthSq()<.01)equatorPoint.set(1,0,0).applyQuaternion(tilt).multiplyScalar(1.012);
  const points=[north.clone(),north.clone().negate(),north.clone().multiplyScalar(1.4),equatorPoint];
  const center=g.group.position.clone().project(camera),cx=(center.x*.5+.5)*w,cy=(-center.y*.5+.5)*h;
  points.forEach((point,j)=>{
   const k=i*4+j,el=landmarkLabels.current[k],leader=landmarkLines.current[k];if(!el||!leader)return;
   proj.copy(point).add(g.group.position).project(camera);const x=(proj.x*.5+.5)*w,y=(-proj.y*.5+.5)*h;
   const visible=g.group.visible&&(j!==2||p.axis)&&proj.z>-1&&proj.z<1&&x>=0&&x<=w&&y>=0&&y<=h;
   el.style.display=visible?'block':'none';leader.style.display=visible?'block':'none';if(!visible)return;
   let dx=0,dy=0;
   if(j<2){const length=Math.hypot(x-cx,y-cy)||1;dx=(x-cx)/length*42;dy=(y-cy)/length*42;}
   else if(j===2){dx=78;dy=12;}else{dx=84;dy=28;}
   const halfW=el.offsetWidth/2,halfH=el.offsetHeight/2;
   const candidates=[[dx,dy],[dx-75,dy],[dx+75,dy],[dx,dy-44],[dx,dy+44],[-85,-42],[85,-42],[-85,42],[85,42],[0,-75],[0,75],[-140,0],[140,0],[-140,-65],[140,-65],[-140,65],[140,65]];
   let lx=0,ly=0,best=Infinity;
   for(const [ox,oy] of candidates){const tx=Math.max(halfW+10,Math.min(w-halfW-10,x+ox)),ty=Math.max(76+halfH,Math.min(h-45-halfH,y+oy));const box={left:tx-halfW-5,top:ty-halfH-5,right:tx+halfW+5,bottom:ty+halfH+5};const overlap=occupied.reduce((sum,r)=>sum+Math.max(0,Math.min(box.right,r.right)-Math.max(box.left,r.left))*Math.max(0,Math.min(box.bottom,r.bottom)-Math.max(box.top,r.top)),0);if(overlap<best){best=overlap;lx=tx;ly=ty;}if(overlap===0)break;}
   occupied.push({left:lx-halfW-5,top:ly-halfH-5,right:lx+halfW+5,bottom:ly+halfH+5});
   el.style.left=lx+'px';el.style.top=ly+'px';
   leader.setAttribute('x1',String(x));leader.setAttribute('y1',String(y));leader.setAttribute('x2',String(lx));leader.setAttribute('y2',String(ly));
  });
 });
 renderer.domElement.dataset.renderer=renderer instanceof SoftwareRenderer?'canvas3d':'webgl';renderer.domElement.dataset.spin=rotation.toFixed(4);renderer.domElement.dataset.camera=camera.position.toArray().map((v:number)=>v.toFixed(3)).join(',');renderer.domElement.dataset.observer=globes[0].radial.toArray().map((v:number)=>v.toFixed(6)).join(',');renderer.domElement.dataset.sun=globes[0].S.toArray().map((v:number)=>v.toFixed(6)).join(',');renderer.domElement.dataset.day=p.day.toFixed(2);renderer.domElement.dataset.mode=compare.current?'seasons':focus?'earth':'overview';renderer.domElement.dataset.earthCount=textureReady?(compare.current?'4':'1'):'0';renderer.domElement.dataset.sunRays=compare.current?'12':'3';
 raf=requestAnimationFrame(frame);}
 raf=requestAnimationFrame(frame);
 return()=>{disposed=true;cancelAnimationFrame(raf);ro.disconnect();controls.dispose();scene.traverse((o:any)=>{o.geometry?.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach((m:any)=>{if(m){m.map?.dispose();m.dispose();}});});renderer.dispose();renderer.domElement.remove();actions.current=null;};
 },[]);
 useEffect(()=>{actions.current?.reset();},[props.resetToken]);
 return <div className="scene3d-shell"><div ref={mount} className="scene3d-mount"/><div className="camera-toolbar" aria-label="立體模型視角控制"><button aria-label="放大模型" onClick={()=>actions.current?.zoom(.8)}><Plus size={18}/></button><button aria-label="縮小模型" onClick={()=>actions.current?.zoom(1.25)}><Minus size={18}/></button><button aria-pressed={mode==='earth'} onClick={()=>actions.current?.closeup()}><Focus size={17}/>聚焦地球</button><button onClick={()=>actions.current?.overview()} aria-label="重設全景視角"><RotateCcw size={17}/><span>全景</span></button><button aria-label="拖曳平移模式" aria-pressed={moving} onClick={()=>{setMoving(!moving);actions.current?.pan(!moving);}}><Move size={17}/></button><button className="seasons-toggle" aria-pressed={comparing} onClick={()=>actions.current?.compare()}><Layers size={17}/>{comparing?'返回單一地球':'四季對照'}</button></div><svg className="landmark-leaders" aria-hidden="true">{Array.from({length:16},(_,k)=><line key={k} ref={el=>{landmarkLines.current[k]=el;}} className={`landmark-line landmark-${k%4}`}/>)}</svg>{Array.from({length:4},(_,i)=>['北極','南極','地軸','赤道'].map((text,j)=><div key={`${i}-${j}`} ref={el=>{landmarkLabels.current[i*4+j]=el;}} className={`landmark-label landmark-${j}`}>{text}</div>))}<div ref={label} className="observer-marker-label"><strong>● 觀測者</strong><small>正午定位 · 面向太陽</small></div>{stops.map((d,i)=><div key={d} ref={el=>{seasonLabels.current[i]=el;}} className={`season-earth-label season-${(i+(props.south?2:0))%4}`}><strong>{['春季','夏季','秋季','冬季'][(i+(props.south?2:0))%4]}</strong><small>{['春分 · 3月20日','夏至 · 6月21日','秋分 · 9月22日','冬至 · 12月21日'][i]}</small></div>)}<div className="scene-help"><span className="texture-status" role="status">{textureStatus==='loaded'?'教學海陸貼圖 v6':textureStatus==='failed'?'地球貼圖載入失敗，請重新整理':'載入地球貼圖…'}</span>{comparing&&<span className="comparison-note">{props.south?'南':'北'}半球四季 · 地軸保持同向 · 左右數據依所選日期</span>}<span>拖曳旋轉 · 滾輪／雙指縮放 · 右鍵拖曳平移</span><button aria-label={spinning?'暫停地球自轉':'恢復地球自轉'} onClick={()=>{spin.current=!spinning;setSpinning(!spinning);}}>{spinning?<Pause size={13}/>:<Play size={13}/>} 自轉{spinning?'中':'已暫停'}</button></div></div>;
}
