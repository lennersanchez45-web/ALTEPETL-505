"use strict";
// Regresiones sin WebGL: carriles, vehículo estacionado, peatón jugador y animaciones ocultas.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=name=>fs.readFileSync(path.join(__dirname,"../game/src/vehicles/",name),"utf8");
const vec=(x=0,z=0)=>({x,y:0,z,set(a,b,c){this.x=a;this.y=b;this.z=c;},clone(){return vec(this.x,this.z);}});
const node=(x,z)=>({position:vec(x,z),rotation:vec(),enabled:true,setEnabled(v){this.enabled=v;},isEnabled(){return this.enabled;}});
const car=(id,x,z)=>({name:"hilux",id,streamV4:true,traffic:true,root:node(x,z),width:1.77,length:5.28,heading:Math.PI,trafficSpeed:0,route:{axis:"z",lane:x,target:1}});
function context(fleet,hero){
 const ctx={fleet,player:{root:node(...hero)},current:null,driving:false,traffic23:{cars:[]},pedestrians:[],
  inWorld:()=>true,blocked:()=>false,roadSurface50:()=>0,updateTrafficSignals23(){},originalV4:{animateWheels(){}},
  clamp:(x,a,b)=>Math.max(a,Math.min(b,x))};
 vm.createContext(ctx);vm.runInContext(read("0369-step-fleet13.js"),ctx);return ctx;
}
{ // Sentidos opuestos usan carriles distintos, siempre a la derecha.
 const ctx=context([],[0,0]);
 for(const axis of ["x","z"])assert.notEqual(ctx.trafficLaneV4(axis,37,1),ctx.trafficLaneV4(axis,37,-1));
 assert(ctx.trafficLaneV4("z",0,1)<0);assert(ctx.trafficLaneV4("x",0,1)>0);
}
{ // El carro que dejó el jugador no arranca solo; al alejarse sí se recicla.
 const v=car(0,0,20);v.traffic=false;v.playerHeld=true;
 const ctx=context([v],[0,0]);
 for(let i=0;i<300;i++)ctx.stepFleet13(1/30);
 assert.equal(v.traffic,false);assert.equal(v.root.position.z,20);
 ctx.player.root.position.set(0,0,400);ctx.streamTrafficV4(1.1);assert.equal(v.playerHeld,false);
}
{ // No atropella al jugador a pie.
 const v=car(0,0,0),ctx=context([v],[0,4]);v.trafficSpeed=4.8;
 for(let i=0;i<90;i++)ctx.stepFleet13(1/30);
 assert.equal(v.root.position.z,0);
}
{ // Un vehículo detrás no frena al de adelante.
 const rear=car(0,0,0),front=car(1,0,5),ctx=context([rear,front],[50,0]);
 for(let i=0;i<30;i++)ctx.stepFleet13(1/30);
 assert(front.root.position.z>5.5,"El de adelante debe avanzar");
}
{ // Las animaciones de personajes ocultos se detienen y se reanudan.
 let before;
 const group=name=>({name:"originalV4_1_"+name,from:0,to:30,isPlaying:false,start(){this.isPlaying=true;},stop(){this.isPlaying=false;}});
 const groups=["Idle","Walk"].map(group);
 class TransformNode{constructor(){this.rotation={};this.position={};this.on=true;}getChildMeshes(){return [];}isEnabled(){return this.on;}}
 const container={rootNodes:[],animationGroups:[],instantiateModelsToScene:()=>({rootNodes:[],animationGroups:groups}),dispose(){}};
 const ctx={B:{TransformNode,SceneLoader:{LoadAssetContainerAsync:async()=>({...container,animationGroups:["Idle","Walk","Run","Punch_L","Punch_R"].map(name=>({name,stop(){}}))})}},
  scene:{onBeforeAnimationsObservable:{add(f){before=f;return f;}}},contactShadow:()=>({}),loadYield25:async()=>{},inflate:async x=>x,
  bytes:()=>{const b=new Uint8Array(20);b.set([103,108,84,70]);new DataView(b.buffer).setUint32(8,20,true);return b;}};
 const ids=["01_mateo","02_ernesto","03_daniel","04_luis","05_rafael","06_valeria","07_marisol","08_xiomara","09_rosa","10_elena"];
 const cars=["hilux","landcruiser","pulsar","taypan","mototaxi-roja","canonera-abierta"];
 const spec=JSON.stringify({characters:ids.map(id=>({id})),vehicles:cars.map(id=>({id}))});
 ctx.document={readyState:"complete",getElementById:id=>({textContent:id==="v4-original-specifications"?spec:"",dataset:{},remove(){}})};
 vm.createContext(ctx);vm.runInContext(read("0286a-original-v4-runtime.js")+";this.api=originalV4;",ctx);
 (async()=>{
  await ctx.api.prepare("people");
  const p=ctx.api.makePerson(1),[idle,walk]=groups;
  assert(idle.isPlaying);p.root.on=false;before();assert(!idle.isPlaying);
  ctx.api.setClip(p,"Walk");assert(!walk.isPlaying);
  p.root.on=true;before();assert(walk.isPlaying&&!idle.isPlaying);
  console.log("V4_TRAFFIC_AND_ANIMATION_OK");
 })().catch(e=>{console.error(e);process.exit(1);});
}
