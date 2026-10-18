// Scenario body-state extension. Dimensionless gameplay calibration, not medical timing.
export function conscious(p){return !!(p?.alive&&p.kind==='person'&&p.body?.integrity>.015&&p.sceneBody?.conscious!==false);}
export function canSpeak(p){return conscious(p)&&!p.sceneBody?.voiceBlocked;}
export function bodyState(p){return !p?.alive?'dead':!conscious(p)?'unconscious':p.sceneBody?.voiceBlocked?'struggling to speak':(p.injury||0)>.05?'injured':'conscious';}
export function ensureBody(p){return p.sceneBody||=( {reserve:1,conscious:true,voiceBlocked:false} );}
