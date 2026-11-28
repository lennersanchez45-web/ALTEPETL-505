function equipItem(name){if(!itemDefinitions[name])return;player.equipment?.dispose();equipped=name;player.equipment=null;if(name!=='hands'){const hand=player.root.getDescendants().find(n=>/(hand_r|wrist\.R)$/.test(n.name));if(hand){player.equipment=equipmentModel(name,hand);heldObserver||=scene.onBeforeRenderObservable.add(holdEquipment);holdEquipment();}}refreshEquipmentUI();controlsUI();}
let heldObserver=null;
// Los huesos V4 tienen otros ejes: la herramienta se orienta en el mundo, después
// de animar, con el mango en la mano y la hoja hacia abajo y adelante.
function holdEquipment(){const item=player?.equipment,hand=item?.parent;if(!hand)return;item.setEnabled(!driving);if(driving)return;
 const swing=Math.sin(clamp(actionTimer/.38,0,1)*Math.PI),rotation=B.Quaternion.RotationYawPitchRoll(player.root.rotation.y,-2.69+swing*.75,0);
 hand.computeWorldMatrix(true);const local=B.Matrix.Compose(V(1,1,1),rotation,hand.getAbsolutePosition()).multiply(hand.getWorldMatrix().clone().invert()),scale=V(),turn=new B.Quaternion(),position=V();local.decompose(scale,turn,position);item.scaling.copyFrom(scale);item.position.copyFrom(position);item.rotationQuaternion=turn;}
