import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const TAU = Math.PI * 2;
const clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
const ease = v => v*v*(3-2*v);

export async function createPossibilityEngine(host, onFrame, onUnavailable) {
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.25 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  host.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','A scroll-controlled journey through the MOKI Possibility Engine');
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a1527,.009);
  const camera = new THREE.PerspectiveCamera(51,1,.15,420);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room,.04).texture;
  scene.environment = environment;
  room.dispose();
  scene.add(new THREE.HemisphereLight(0xe6efff,0x19356d,2.1));
  const key = new THREE.DirectionalLight(0xf3f4ff,3.3); key.position.set(-10,16,18);scene.add(key);
  const blueLight = new THREE.DirectionalLight(0x78a9ff,2.9);blueLight.position.set(15,3,-15);scene.add(blueLight);
  const rim = new THREE.DirectionalLight(0xffffff,1.8);rim.position.set(-15,-3,-40);scene.add(rim);

  const ivory = new THREE.MeshPhysicalMaterial({color:0xe6ecf7,metalness:.55,roughness:.25,clearcoat:.7,envMapIntensity:1.2});
  const cobalt = new THREE.MeshPhysicalMaterial({color:0x2458d1,metalness:.68,roughness:.19,clearcoat:1,envMapIntensity:1.8});
  const navy = new THREE.MeshStandardMaterial({color:0x132440,metalness:.82,roughness:.29,envMapIntensity:1.2});
  const silver = new THREE.MeshStandardMaterial({color:0xc1d3e5,metalness:1,roughness:.19,envMapIntensity:1.5});
  const glow = new THREE.MeshBasicMaterial({color:0x78baff,toneMapped:false});
  const glass = new THREE.MeshPhysicalMaterial({color:0x7aa9fc,metalness:.7,roughness:.08,transparent:true,opacity:.24,clearcoat:1,side:THREE.DoubleSide,envMapIntensity:2});

  function mesh(geo,mat,x=0,y=0,z=0,parent=scene) {const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;}
  function ring(r,tube,x,y,z,mat=silver,parent=scene){return mesh(new THREE.TorusGeometry(r,tube,10,96),mat,x,y,z,parent);}
  function roundedBox(w,h,d,r=.1){
    const s=new THREE.Shape(); const x=-w/2,y=-h/2;
    s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
    const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.035,bevelThickness:.035,curveSegments:5});g.translate(0,0,-d/2);return g;
  }
  function label(text,w=2.6,h=.7,parent=scene){
    const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');
    ctx.fillStyle='#f2f5fc';ctx.fillRect(0,0,512,128);ctx.fillStyle='#1c3975';ctx.font='500 43px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,66);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
    return mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}),0,0,0,parent);
  }
  function logo(parent,scale=1){
    const group=new THREE.Group();parent.add(group);
    const polygons=[[[0,0],[219,161],[219,264],[91,167],[91,291],[0,349]],[[438,0],[219,161],[219,264],[347,167],[347,291],[438,349]]];
    polygons.forEach((points,i)=>{
      const shape=new THREE.Shape(points.map(([x,y])=>new THREE.Vector2((x-219)/55,(174.5-y)/55)));
      const mat=new THREE.MeshPhysicalMaterial({color:i?0x16347d:0x2c5abc,metalness:.62,roughness:.2,clearcoat:1,envMapIntensity:1.8});
      mesh(new THREE.ExtrudeGeometry(shape,{depth:.58,bevelEnabled:true,bevelSegments:3,bevelSize:.06,bevelThickness:.05,steps:1}),mat,0,0,0,group);
    });group.scale.setScalar(scale);return group;
  }

  const loader=new THREE.TextureLoader();
  const [portalTexture,panorama]=await Promise.all([
    loader.loadAsync('./assets/images/engine-portal.webp'),
    loader.loadAsync('./assets/images/engine-interior.webp'),
  ]).catch(error=>{environment.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();throw error;});
  portalTexture.colorSpace=THREE.SRGBColorSpace;panorama.colorSpace=THREE.SRGBColorSpace;
  portalTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  // The original architectural render forms the distant environment. Foreground
  // chambers are separate objects, so passing the camera through them has depth.
  const shell=mesh(new THREE.PlaneGeometry(650,325),new THREE.MeshBasicMaterial({map:panorama,color:0xc8d7ef,toneMapped:false,fog:false}),0,8,-242);
  panorama.mapping=THREE.EquirectangularReflectionMapping;
  const artEnvironment=pmrem.fromEquirectangular(panorama).texture;
  scene.environment=artEnvironment;

  // A transparent, physically placed aperture lets the actual camera pass through.
  const entrance=new THREE.Group();entrance.position.set(3.5,1.2,0);scene.add(entrance);
  mesh(new THREE.PlaneGeometry(20,19.62),new THREE.MeshBasicMaterial({map:portalTexture,transparent:true,alphaTest:.025,depthWrite:true,toneMapped:false,side:THREE.DoubleSide}),0,0,0,entrance);
  ring(5.65,.14,0,0,-.35,cobalt,entrance);
  ring(5.93,.06,0,0,-.7,glow,entrance);
  ring(7.85,.17,0,0,-1.15,silver,entrance);
  const irisLabel=label('MOKI SYSTEMS',2.1,.5,entrance);irisLabel.position.set(0,-6.25,.08);

  // The backbone continues through all four chambers, rather than swapping photos.
  const corridor = new THREE.Group();scene.add(corridor);
  const chamberFrames=[];
  for(let i=0;i<6;i++){
    const z=-16-i*27;
    const frame=new THREE.Group();frame.position.set(Math.sin(i*2)*1.1,1,z);corridor.add(frame);
    ring(10.6,.34,0,0,0,silver,frame).scale.x=1.23;
    ring(11.2,.54,0,0,-.55,navy,frame).scale.x=1.23;
    ring(10.15,.055,0,0,.25,glow,frame).scale.x=1.23;
    ring(11.95,.18,0,0,-1.3,cobalt,frame).scale.x=1.23;
    // Repeating mechanical teeth add real depth and catch the environmental light.
    const teeth=new THREE.InstancedMesh(new THREE.BoxGeometry(.17,.7,.4),ivory,48);
    const tooth=new THREE.Object3D();
    for(let n=0;n<48;n++){const a=n/48*TAU;tooth.position.set(Math.cos(a)*13.1,Math.sin(a)*10.7,-.45);tooth.rotation.z=a-Math.PI/2;tooth.updateMatrix();teeth.setMatrixAt(n,tooth.matrix);}
    frame.add(teeth);chamberFrames.push(frame);
  }
  // Deep, parallel conduits make the camera's lateral sweep legible.
  for(const side of [-1,1])for(let lane=0;lane<3;lane++){
    const conduit=new THREE.CatmullRomCurve3([
      new THREE.Vector3(side*(11+lane*.7),-4+lane*.8,9),
      new THREE.Vector3(side*(12+lane*.7),-4+lane*.8,-40),
      new THREE.Vector3(side*(10+lane*.7),-4+lane*.8,-100),
      new THREE.Vector3(side*(12+lane*.7),-4+lane*.8,-177),
    ]);
    mesh(new THREE.TubeGeometry(conduit,80,.22,8,false),lane===1?ivory:cobalt);
  }

  // MAP — information exists at different depths; camera motion reveals the pieces.
  const mapRoom=new THREE.Group();mapRoom.position.z=-28;scene.add(mapRoom);
  const cardGeometry=roundedBox(1.65,1.02,.1,.1);
  const cards=new THREE.InstancedMesh(cardGeometry,ivory,44);mapRoom.add(cards);
  const cardCanvas=document.createElement('canvas');cardCanvas.width=640;cardCanvas.height=384;
  const cardInk=cardCanvas.getContext('2d');cardInk.fillStyle='#eaf0fa';cardInk.fillRect(0,0,640,384);
  cardInk.fillStyle='#2c5abc';cardInk.fillRect(38,34,26,26);cardInk.fillStyle='#19375f';cardInk.font='500 23px Arial';cardInk.fillText('A BETTER WAY TO WORK',82,55);
  cardInk.fillStyle='#b8c9e0';[102,126,150].forEach((y,i)=>cardInk.fillRect(39,y,420-i*65,7));
  cardInk.strokeStyle='#5f88d1';cardInk.lineWidth=4;cardInk.beginPath();cardInk.moveTo(44,308);cardInk.bezierCurveTo(170,330,170,220,295,251);cardInk.bezierCurveTo(402,277,435,181,592,186);cardInk.stroke();
  for(let n=0;n<7;n++){cardInk.fillStyle=n>3?'#3971d6':'#c5d5ee';cardInk.fillRect(40+n*82,339,56,6);}
  const cardMap=new THREE.CanvasTexture(cardCanvas);cardMap.colorSpace=THREE.SRGBColorSpace;
  const faces=new THREE.InstancedMesh(new THREE.PlaneGeometry(1.53,.91),new THREE.MeshBasicMaterial({map:cardMap,toneMapped:false}),44);mapRoom.add(faces);
  const cardData=[];const dummy=new THREE.Object3D();
  let seed=79;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  for(let i=0;i<44;i++){
    const a=random()*TAU,r=4.4+random()*5.5;
    cardData.push({x:Math.cos(a)*r,y:Math.sin(a)*r*.65+1,z:(random()-.5)*21,rx:(random()-.5)*.8,ry:(random()-.5)*1.2,rz:(random()-.5)*1.6});
    cards.setColorAt(i,new THREE.Color(i%5===0?0x487bff:0xe2ebff));
  }
  const mapLabels=[];
  [['Enquiries',-5,3,-3],['Documents',5,-1,-4],['Follow-ups',-4,-2,4]].forEach(([text,x,y,z])=>{
    const panel=mesh(roundedBox(3.1,.9,.15,.15),ivory,x,y,z,mapRoom);const l=label(text,2.8,.68,panel);l.position.z=.13;mapLabels.push(panel);
  });

  // OPTIMIZE — scattered routes become a flowing, engineered rhythm.
  const optimizeRoom=new THREE.Group();scene.add(optimizeRoom);
  const flows=[];
  for(let lane=0;lane<7;lane++){
    const side=lane<4?-1:1;const offset=lane<4?lane:lane-4;
    const curve=new THREE.CatmullRomCurve3([
      new THREE.Vector3(side*(6+offset*.6),-2.5+offset*1.2,-42),
      new THREE.Vector3(side*(7+offset*.6),3.3+offset*.5,-52),
      new THREE.Vector3(side*(4+offset*.55),3.9-offset*.6,-64),
      new THREE.Vector3(side*(3.6+offset*.55),-2+offset*.4,-78),
    ]);
    mesh(new THREE.TubeGeometry(curve,100,.22+offset*.018,10,false),lane%2?ivory:cobalt,0,0,0,optimizeRoom);
    mesh(new THREE.TubeGeometry(curve,100,.035,6,false),glow,0,.28,0,optimizeRoom);
    const bead=mesh(new THREE.SphereGeometry(.18,12,8),glow);flows.push({curve,bead,offset:lane/7});
  }
  const optimizeHalo=ring(5.6,.16,0,1,-61,silver);optimizeHalo.rotation.y=.38;
  const optimizeHalo2=ring(6.1,.04,0,1,-62,glow);optimizeHalo2.rotation.x=.25;

  // KIT — tools orbit a shared intelligence core in a dimensional instrument.
  const kitRoom=new THREE.Group();kitRoom.position.set(0,1,-111);scene.add(kitRoom);
  const orb=mesh(new THREE.SphereGeometry(3.5,48,32),glass,0,0,0,kitRoom);
  mesh(new THREE.IcosahedronGeometry(1.6,1),cobalt,0,0,0,kitRoom);
  const orbitA=ring(5.2,.13,0,0,0,silver,kitRoom);orbitA.rotation.y=.65;
  const orbitB=ring(4.7,.065,0,0,0,glow,kitRoom);orbitB.rotation.x=1.15;
  const orbitC=ring(4.1,.12,0,0,0,cobalt,kitRoom);orbitC.rotation.x=.55;orbitC.rotation.y=-.6;
  const modules=[];
  ['AI','Automation','Data','CRM','Web','SEO'].forEach((text,i)=>{
    const group=new THREE.Group();kitRoom.add(group);const a=i/6*TAU;
    group.position.set(Math.cos(a)*6,Math.sin(a)*3.9,Math.sin(a)*1.2);
    mesh(roundedBox(2.1,1.3,.45,.18),i%2?cobalt:ivory,0,0,0,group);
    const l=label(text,1.86,.6,group);l.position.z=.27;modules.push({group,a});
  });

  // INTEGRATE — physical conduits converge on one complete MOKI system.
  const integration=new THREE.Group();integration.position.set(0,1,-159);scene.add(integration);
  const finalM=logo(integration,1.25);finalM.position.y=.7;
  const mRingA=ring(7.4,.14,0,.5,0,silver,integration);mRingA.rotation.y=.5;
  const mRingB=ring(8.2,.07,0,.5,-.4,glow,integration);mRingB.rotation.x=.65;
  const halo=mesh(new THREE.CircleGeometry(11,80),new THREE.MeshBasicMaterial({color:0xb5d2ff,transparent:true,opacity:.045,depthWrite:false,side:THREE.DoubleSide}),0,.4,-1.4,integration);
  const nodePositions=[[-8,3],[-7,-3],[0,6.5],[7,4],[8,-2],[0,-5]];
  nodePositions.forEach(([x,y],i)=>{
    mesh(new THREE.SphereGeometry(.32,16,12),ivory,x,y,.1,integration);
    const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(x,y,0),new THREE.Vector3(x*.3,y*.6,1),new THREE.Vector3(0,.5,.1));
    mesh(new THREE.TubeGeometry(curve,22,.035,6,false),i%2?glow:cobalt,0,0,0,integration);
  });
  const luminousBack=mesh(new THREE.TorusGeometry(11.7,.4,12,100),ivory,0,1,-171);luminousBack.scale.x=1.4;

  const positions=new Float32Array(300*3);
  for(let i=0;i<300;i++){positions[i*3]=(random()-.5)*25;positions[i*3+1]=(random()-.5)*15;positions[i*3+2]=-random()*178;}
  const particleGeometry=new THREE.BufferGeometry();particleGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const particles=new THREE.Points(particleGeometry,new THREE.PointsMaterial({color:0xa8ceff,size:.045,transparent:true,opacity:.5,depthWrite:false,sizeAttenuation:true}));scene.add(particles);

  const path=new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4,1.3,26),new THREE.Vector3(3.5,1.1,0),new THREE.Vector3(-2.8,1,-29),
    new THREE.Vector3(2.7,.7,-60),new THREE.Vector3(-1.8,1.5,-96),new THREE.Vector3(2.4,1.1,-124),new THREE.Vector3(0,1.3,-143),
  ],false,'catmullrom',.45);
  let target=0,current=0,frame=0,paused=false,disposed=false,renderedFrames=0,lastFrameTime=performance.now();
  const direction=new THREE.Vector3();
  function draw() {
    frame=0;if(disposed||document.hidden)return;
    const now=performance.now(),dt=Math.max(.001,(now-lastFrameTime)/1000);lastFrameTime=now;
    if(!paused)current=THREE.MathUtils.damp(current,target,8,dt);
    const p=clamp(current);
    const pos=path.getPoint(p);
    const phone=host.clientWidth<=650;
    const entry=1-clamp(p/.17);
    if(phone){pos.x+=7.3*entry;pos.z+=6*entry;}
    camera.position.copy(pos);
    direction.set(pos.x+Math.sin(p*7)*.35,pos.y-.1,pos.z-35);camera.lookAt(direction);camera.rotation.z=Math.sin(p*8)*.018;
    entrance.rotation.z=p*.22;
    const order=ease(clamp((p-.18)/.18));
    cardData.forEach((c,i)=>{
      const a=i/44*TAU;
      dummy.position.set(THREE.MathUtils.lerp(c.x,Math.cos(a)*5,order),THREE.MathUtils.lerp(c.y,Math.sin(a)*3.5+1,order),c.z);
      dummy.rotation.set(c.rx*(1-order),c.ry*(1-order),c.rz*(1-order)+p*.12);dummy.updateMatrix();cards.setMatrixAt(i,dummy.matrix);
      dummy.translateZ(.095);dummy.updateMatrix();faces.setMatrixAt(i,dummy.matrix);
    });cards.instanceMatrix.needsUpdate=true;faces.instanceMatrix.needsUpdate=true;
    flows.forEach(({curve,bead,offset})=>{bead.position.copy(curve.getPoint((p*1.6+offset)%1));});
    kitRoom.rotation.z=p*.4;orb.rotation.y=p*2;
    modules.forEach(({group,a},i)=>{group.rotation.y=Math.sin(p*4+a)*.18;group.position.z=Math.sin(a+p*1.7)*1.5;});
    orbitA.rotation.z=p*.7;orbitB.rotation.y=p*.8;
    finalM.rotation.y=Math.sin((1-p)*3)*.13;mRingA.rotation.z=p*.6;mRingB.rotation.z=-p*.5;
    shell.position.x=Math.sin(p*5)*9;
    chamberFrames.forEach((f,i)=>{f.rotation.z=Math.sin(p*3+i)*.09;});
    renderer.render(scene,camera);renderedFrames++;
    host.dataset.renderer='webgl';host.dataset.cameraDepth=camera.position.z.toFixed(2);host.dataset.progress=p.toFixed(4);host.dataset.frames=String(renderedFrames);
    onFrame?.(p);
    if(!paused&&Math.abs(target-current)>.00015) frame=requestAnimationFrame(draw);
  }
  function request(){if(!frame&&!disposed&&!document.hidden)frame=requestAnimationFrame(draw);}
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio,w<700?1.25:1.5));renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.fov=w<700?58:51;camera.updateProjectionMatrix();request();
  }
  const observer=new ResizeObserver(resize);observer.observe(host);
  const visible=()=>request();document.addEventListener('visibilitychange',visible);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();host.dataset.renderer='static';paused=true;cancelAnimationFrame(frame);onUnavailable?.();});
  resize();
  return {
    setProgress(value){target=clamp(value);request();},
    setPaused(value){paused=value;request();},
    setProgressImmediately(value){target=current=clamp(value);request();},
    dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visible);scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});environment.dispose();artEnvironment.dispose();pmrem.dispose();portalTexture.dispose();panorama.dispose();cardMap.dispose();renderer.dispose();renderer.domElement.remove();},
  };
}
