function mergeStatic24(name,parts,root){
 for(const m of parts)m.computeWorldMatrix(true);
 const merged=B.Mesh.MergeMeshes(parts,true,true);merged.name=name;merged.setParent(root);merged.isPickable=false;merged.receiveShadows=true;return merged;
}
function installSignals24(){
 for(const s of traffic23.signals)s.root.dispose();traffic23.signals.length=0;
 const yellow=pbr('Acero amarillo de señalización','#d5ab39',.55),black=assetMats.seat;
 // Las luces de un mismo eje cambian juntas: bastan seis materiales para toda la ciudad.
 const leds={x:null,z:null};for(const axis in leds)leds[axis]=['#ca322f','#efb647','#60b76c'].map((c,n)=>pbr('LED '+axis+n,c,.5));
 for(const [x,z] of [[-111,37],[-37,37],[37,37],[111,37],[37,-111],[37,-37],[37,111]])for(const axis of ['x','z'])for(const direction of [-1,1]){
 const root=new B.TransformNode('Pórtico vial '+axis+' '+direction,scene);root.position.set(x,0,z);root.rotation.y=axis==='x'?Math.PI/2:0;
 const postx=direction*8.3,postz=direction*9.8;
 const mast=B.MeshBuilder.CreateTube('Brazo elevado amarillo',{path:[V(postx,0,postz),V(postx,5.1,postz),V(postx*.98,5.65,postz),V(postx*.91,5.90,postz),V(-postx*.62,5.90,postz)],radius:.11,tessellation:10},scene);mast.parent=root;mast.material=yellow;mast.isPickable=false;
 const yellowParts=[mast],blackParts=[],lamps=[[],[],[]];
 for(const lx of [-2.45,2.45]){
 const head=new B.TransformNode('Cabezal de tres luces',scene);head.parent=root;head.position.set(lx,5.05,postz);head.rotation.y=direction>0?Math.PI:0;
 yellowParts.push(primitive('CreateBox',{width:.48,height:1.30,depth:.30},yellow,head,V(0,0,0)));blackParts.push(primitive('CreateBox',{width:.63,height:1.46,depth:.04},black,head,V(0,0,-.17)));
 for(let n=0;n<3;n++){lamps[n].push(primitive('CreateSphere',{diameter:.27,segments:10},leds[axis][n],head,V(0,.42-n*.42,.18)));const hood=B.MeshBuilder.CreateCylinder('Visera del semáforo',{height:.24,diameter:.34,tessellation:12,cap:0},scene);hood.parent=head;hood.position.set(0,.42-n*.42,.23);hood.rotation.x=Math.PI/2;hood.material=black;blackParts.push(hood);}
 }
 primitive('CreateCylinder',{height:.18,diameter:.45,tessellation:12},assetMats.steel,root,V(postx,.09,postz));
 // Un pórtico es estático: una malla por material en vez de dieciocho.
 mergeStatic24('Pórtico amarillo',yellowParts,root);mergeStatic24('Pórtico negro y viseras',blackParts,root);
 traffic23.signals.push({axis,root,lights:lamps.map((parts,n)=>mergeStatic24('Luz de semáforo '+n,parts,root))});city24.gantries.push(root);
 }
 // Parked vehicles must not occupy the lanes controlled by the traffic system.
 for(const v of fleet){if(v.traffic||v.garage||v.cityPatrol)continue;const p=v.root.position;if(Math.abs(p.z-37)<5.2&&Math.abs(p.x)<205){p.z=p.z<37?27:47;city24.parkedMoved++;}else if(Math.abs(p.x-37)<5.2&&Math.abs(p.z)<205){p.x=p.x<37?27:47;city24.parkedMoved++;}p.y=groundAt(p.x,p.z);}
}
