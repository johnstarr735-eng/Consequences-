// A represented target supplies no Force, material or guaranteed route. It is an
// explicit adapter input to the existing Field -> Moira -> Will -> Process sequence.
export function situatedOrientationDriver(w,entity,es,s){
  const o=w._playerOrientations?.get(entity.id);
  if(entity.kind!=='person'||entity.sceneBody?.conscious===false||!o?.representedTarget||!o.goal)return null;
  const target=o.representedTarget,access=w._accessState?.get(`${entity.id}|${target}`),known=entity.known.get(target);
  const pos=access?.active?s.forms.get(target)?.pos:known?.lastPos;if(!pos)return null;
  const a=entity.apparatus,b=es.body;
  const crisis=Math.max(1-b.energy,1-b.water,1-b.integrity);
  const support=Math.sqrt(Math.max(0,a.attention*a.retention))*(.72+.28*a.receptor)*Math.max(0,1-crisis);
  return{kind:'represented_configuration',target,representedPos:{...pos},weight:.24*support,toward:true};
}
