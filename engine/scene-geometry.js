// Explicit scene calibration. Upstream geometry and its body-condition limits remain
// unchanged; only people with an opted-in rate use the smaller scene time scale.
export * from './destiny-v113/destiny_embodied_geometry.js';
import { maxTravel as upstreamTravel } from './destiny-v113/destiny_embodied_geometry.js';

export function maxTravel(form, dtDays = 1) {
  const scale = form?.sceneMotionScale;
  if (!(scale > 0)) return upstreamTravel(form, dtDays);
  return upstreamTravel(form, Math.max(0, dtDays) * scale);
}
