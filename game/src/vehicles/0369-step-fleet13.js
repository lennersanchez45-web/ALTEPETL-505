// Circulación por la derecha: cada sentido tiene su propio carril.
function trafficLaneV4(axis,center,direction){
 return center+(axis==='z'?-direction:direction)*2.8;
}

// Velocidad máxima para detenerse antes de un semáforo en amarillo o rojo.
function signalLimitV4(v){
 const {axis,lane,target}=v.route,center=lane-trafficLaneV4(axis,0,target);
 const coord=axis==='x'?v.root.position.x:v.root.position.z;
 let limit=Infinity;
 for(const c of [-111,-37,37,111]){
  // 8,5 m antes del centro del cruce, medidos desde el frente.
  const gap=(c-coord)*target-v.length*.5-8.5;
  if(gap<-.6||gap>12)continue;
  // El paso a desnivel no se cruza a nivel.
  if(typeof overpass50!=='undefined'&&overpass50.installed&&
   (axis==='z'&&center===37&&c===-37||axis==='x'&&center===-37&&c===37))continue;
  const phase=trafficPhase28(axis,c,center);
  // En amarillo, quien ya está encima de la línea termina de cruzar.
  if(phase==='green'||phase==='yellow'&&gap<2)continue;
  limit=Math.min(limit,gap<.15?0:gap*1.2);
 }
 return limit;
}

// Tráfico V4: un número fijo de GLB sigue al jugador por las calles reales.
// Reutilizar las 18 instancias conserva texturas, animaciones y RAM en Android.
let trafficStreamClockV4=0;
function streamTrafficV4(dt){
 trafficStreamClockV4+=dt;
 if(trafficStreamClockV4<1)return;
 trafficStreamClockV4=0;
 const hero=driving?current.root.position:player.root.position;
 const roads=[-111,-37,37,111];
 const pool=fleet.filter(v=>v.streamV4);
 for(let i=0;i<pool.length;i++){
  const v=pool[i];
  // Nunca teletransportar el vehículo conducido ni uno a la vista.
  if(v===current&&driving)continue;
  const distance=Math.hypot(v.root.position.x-hero.x,v.root.position.z-hero.z);
  // El vehículo que dejó el jugador se queda donde lo estacionó mientras
  // siga cerca; solo al alejarse vuelve al tráfico.
  if(v.playerHeld){
   if(distance<130)continue;
   v.playerHeld=false;v.streamV4NeedsPlace=true;
  }
  if(!v.streamV4NeedsPlace&&distance<130&&inWorld(v.root.position.x,v.root.position.z)){
   v.traffic=true;v.retired28=false;continue;
  }
  if(distance<125&&!v.streamV4NeedsPlace)continue;
  let found=false;
  const candidates=roads.map(center=>({axis:'z',center,metric:Math.abs(hero.x-center)}))
   .concat(roads.map(center=>({axis:'x',center,metric:Math.abs(hero.z-center)})))
   .sort((a,b)=>a.metric-b.metric);
  for(let j=0;j<candidates.length&&!found;j++){
   const route=candidates[(j+i)%candidates.length];
   if(route.metric>90)continue;
   const dir=(i+j)%3===0?-1:1;
   const lane=trafficLaneV4(route.axis,route.center,dir);
   // Solo reaparecer a 65-113 m; no materializar autos delante de la cámara.
   const step=67+(i%6)*9+(j%3)*5;
   const along=(route.axis==='z'?hero.z:hero.x)+dir*step;
   const x=route.axis==='x'?along:lane,z=route.axis==='z'?along:lane;
   const angle=route.axis==='x'?(dir>0?-Math.PI/2:Math.PI/2):(dir>0?Math.PI:0);
   if(!inWorld(x,z)||blocked(x,z,v.width*.53,v,true))continue;
   // No aparecer con un obstáculo justo delante.
   if(blocked(x-Math.sin(angle)*8,z-Math.cos(angle)*8,v.width*.5,v,true))continue;
   const localDistance=Math.hypot(x-hero.x,z-hero.z);
   if(localDistance<56||localDistance>118)continue;
   if(pool.some(other=>other!==v&&Math.hypot(other.root.position.x-x,other.root.position.z-z)<8))continue;
   v.root.position.set(x,roadSurface50(x,z,false),z);
   v.root.rotation.set(0,angle,0);
   v.heading=angle;v.trafficSpeed=0;v.stuckV4=0;v.route={axis:route.axis,lane,min:-410,max:530,target:dir};
   v.traffic=true;v.retired28=false;v.streamV4NeedsPlace=false;
   v.visibleRender49=undefined;
   found=true;
  }
  if(!found){
   v.streamV4NeedsPlace=true;v.traffic=false;v.retired28=false;
   v.root.position.set(1800+i*8,0,1800);
   v.root.setEnabled(false);
   v.visibleRender49=false;
  }
 }
 // Semáforos/riders usan solo las instancias de la zona actual.
 traffic23.cars=pool.filter(v=>v.traffic);
}

function stepFleet13(dt){
 updateTrafficSignals23(dt);
 if(!(dt>0))return;
 streamTrafficV4(dt);
 const hero=driving?current.root.position:player.root.position;
 for(const v of fleet){
  if(!v.traffic||v.retired28||v===current&&driving||v.garage)continue;
  const route=v.route;
  if(!route)continue;
  const pos=v.root.position;
  const angle=route.axis==='x'?(route.target>0?-Math.PI/2:Math.PI/2):(route.target>0?Math.PI:0);
  const turn=Math.atan2(Math.sin(angle-v.heading),Math.cos(angle-v.heading));
  v.heading+=clamp(turn,-dt*2,dt*2);
  const dx=-Math.sin(v.heading),dz=-Math.cos(v.heading);
  const aheadX=pos.x+dx*(v.length*.5+1.4),aheadZ=pos.z+dz*(v.length*.5+1.4);
  const clear=inWorld(aheadX,aheadZ)&&!blocked(aheadX,aheadZ,v.width*.5,v,true);
  const nearby=pedestrians.some(p=>{
   if(!p.root?.isEnabled?.())return false;
   return Math.hypot(p.root.position.x-aheadX,p.root.position.z-aheadZ)<1.6;
  });
  // El jugador a pie también detiene al tráfico.
  const px=hero.x-pos.x,pz=hero.z-pos.z,front=px*dx+pz*dz;
  const onFoot=!driving&&front>0&&front<v.length*.5+2.4&&Math.abs(px*dz-pz*dx)<v.width*.5+.55;
  // Solo cuenta lo que está delante: un vehículo detrás no debe frenar a este.
  const occupied=fleet.some(other=>other!==v&&other.root.isEnabled()&&
   (other.root.position.x-pos.x)*dx+(other.root.position.z-pos.z)*dz>0&&
   Math.hypot(other.root.position.x-aheadX,other.root.position.z-aheadZ)<(v.length+other.length)*.5);
  const safe=clear&&!nearby&&!onFoot&&!occupied&&Math.abs(turn)<.3;
  const signal=signalLimitV4(v);
  const target=safe?Math.min(v.bike?5.5:v.caponera?3.6:4.8,signal):0;
  v.trafficSpeed+=(target-v.trafficSpeed)*(1-Math.exp(-dt*(target<v.trafficSpeed?10:2.2)));
  const nx=pos.x+dx*v.trafficSpeed*dt,nz=pos.z+dz*v.trafficSpeed*dt;
  if(onFoot)v.trafficSpeed=0;
  if(!onFoot&&inWorld(nx,nz)&&!blocked(nx,nz,v.width*.45,v,true)){
   pos.x=nx;pos.z=nz;
  }else v.trafficSpeed=0;
  pos.y=roadSurface50(pos.x,pos.z,!!v.overpass50);
  // Un atasco sin salida se recicla, pero solo lejos del jugador.
  v.stuckV4=v.trafficSpeed<.15&&!nearby&&!onFoot&&signal>=1?(v.stuckV4||0)+dt:0;
  if(v.streamV4&&v.stuckV4>30&&Math.hypot(pos.x-hero.x,pos.z-hero.z)>60){v.streamV4NeedsPlace=true;v.stuckV4=0;}
  v.root.rotation.y=v.heading;
  originalV4.animateWheels(v,v.trafficSpeed,turn,dt);
 }
}
