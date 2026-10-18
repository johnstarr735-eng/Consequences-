// One spelling rule for character creation and encountered targets. Preserve
// every writing system while treating accent/punctuation variants consistently.
export function nameKey(value){
  return String(value||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[’']/g,'').replace(/[^\p{L}\p{N} ]/gu,' ').replace(/\s+/g,' ').trim();
}
export const TARGET_ALIASES={
  register:['key register','service key register','register','key book'],clock:['signal log','recorder','signal recorder','clock log','clock'],weight:['brass weight','weight'],body:['rowan','body','victim'],manifest:['cargo manifest','manifest','cargo tally','tally'],cabinet:['case desk','inquiry desk','desk'],
  noteA:['maras paper'],noteB:['jonahs paper'],penA:['maras pen'],penB:['jonahs pen'],A:['mara'],B:['jonah'],N:['nell'],D:['ada'],S:['silas'],P:['officer vale','vale','duty officer','local police','police'],phoneA:['maras phone'],phoneB:['jonahs phone'],phoneP:['duty phone'],router:['wifi router','wi fi router','router','wifi','wi fi'],
};
export function reservedTargetName(name,seat){
  const key=nameKey(name);
  return /\bmy (?:phone|handset|paper|sheet|pen)\b|\b(?:blank|writing) paper\b|^(?:phone|handset|paper|pen)$/.test(key)||Object.entries(TARGET_ALIASES).some(([id,aliases])=>id!==seat&&aliases.some(alias=>nameKey(alias)===key));
}
