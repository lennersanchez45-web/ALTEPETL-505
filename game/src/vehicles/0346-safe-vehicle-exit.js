// No bajar al otro lado de un muro delgado: revisar el trayecto, no solo el destino.
function clearExitPathV4(v,x,z){
 const from=v.root.position;
 for(let i=1;i<8;i++){
  if(blocked(from.x+(x-from.x)*i/8,from.z+(z-from.z)*i/8,.12,v,false))return false;
 }
 return true;
}
function safeVehicleExit(v){for(const side of [1,-1])for(const offset of [0,-.8,.8]){const d=v.width/2+.78,x=v.root.position.x+Math.cos(v.heading)*d*side+Math.sin(v.heading)*offset,z=v.root.position.z-Math.sin(v.heading)*d*side+Math.cos(v.heading)*offset;if(!blocked(x,z,.34,v)&&clearExitPathV4(v,x,z))return V(x,roadSurface50(x,z,!!v.overpass50),z);}return null;}
