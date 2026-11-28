function slide(p,dx,dz,r,ignore=null){
// Si un vehículo quedó encima, dejar salir; paredes y límites siguen valiendo.
const vehicles=!(blocked(p.x,p.z,r,ignore)&&!blocked(p.x,p.z,r,ignore,false));const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.18));for(let i=0;i<count;i++){if(!blocked(p.x+dx/count,p.z,r,ignore,vehicles))p.x+=dx/count;if(!blocked(p.x,p.z+dz/count,r,ignore,vehicles))p.z+=dz/count;}}
