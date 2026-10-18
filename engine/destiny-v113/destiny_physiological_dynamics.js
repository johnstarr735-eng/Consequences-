// DESTINY v1.13 — EMBODIED CONSEQUENCE / PHYSIOLOGICAL MEDIATION
//
// Canonical law:
//   The body is a finite material coherence. Intake, expenditure, thermoregulation,
//   injury, repair, fatigue and systemic illness are physical processes through which
//   Reality can alter the later horizon of possibility.
//
// Source law determines *that* bodily consequence must exist and condition becoming.
// Numerical rates are engineering calibration informed by human physiology; they are
// not metaphysical constants and are deliberately kept coarse.
//
// Important restraints:
// - Rest lowers expenditure / sleep debt; it never creates calories or water.
// - Food is ingested before it is absorbed. Eating is not instantaneous energy.
// - Heat/cold alter expenditure through thermoregulation; weather does not itself create infection.
// - Injury can create repair demand. Healing consumes time and depends on material support.
// - Illness/fever can alter expenditure when a biological insult exists, but this module does not
//   invent pathogens or diagnoses. Future ecology must supply the causal insult.

const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const expFraction=(ratePerDay,dtDays)=>1-Math.exp(-Math.max(0,ratePerDay)*Math.max(0,dtDays));

export const PHYSIOLOGY_CALIBRATION=Object.freeze({
  // Existing v1.11 day-scale stores, retained as the calibration baseline.
  energyBasalPerDay:.024,
  energyActivityPerDay:.014,
  waterBasalPerDay:.040,
  waterActivityPerDay:.014,

  // Thermoregulatory additions. Exact response varies strongly by body/environment;
  // these are normalized capacities, not literal kcal/L values.
  coldThermogenesisPerDay:.010,
  severeColdThermogenesisPerDay:.008,
  heatSweatWaterPerDay:.016,
  severeHeatWaterPerDay:.010,

  // Fatigue / sleep. Sleep is not fuel; it changes debt and lowers activity cost.
  sleepDebtPerDay:.20,
  stationarySleepRecoveryPerDay:.30,
  exposureSleepPerDay:.025,

  // Digestion / absorption. First-order day rates correspond to hours, not instantaneous transfer.
  nutrientAbsorptionPerDay:5.0,
  waterAbsorptionPerDay:14.0,
  thermicEffectFraction:.10,

  // Repair / systemic load. Injury and illness are normalized burdens; rates are intentionally
  // conservative because the engine has no clinical severity classes.
  injuryEnergyPerDay:.020,
  injuryWaterPerDay:.004,
  repairFractionPerDay:.16,
  integrityRestoreFraction:.72,
  illnessEnergyPerDay:.018,
  illnessWaterPerDay:.010,
  illnessRecoveryPerDay:.06,
  feverEnergyPerDay:.020,
  feverWaterPerDay:.016,
  feverDecayPerDay:.20
});

export function ensurePhysiology(person){
  if(!person.physiology||typeof person.physiology!=='object')person.physiology={};
  const p=person.physiology;
  p.gutEnergy=Math.max(0,p.gutEnergy||0);
  p.gutWater=Math.max(0,p.gutWater||0);
  p.repairLoad=clamp(Number.isFinite(p.repairLoad)?p.repairLoad:(person.injury||0));
  p.systemicLoad=clamp(Number.isFinite(p.systemicLoad)?p.systemicLoad:(person.illness||0));
  p.feverLoad=clamp(p.feverLoad||0);
  p.absorbedEnergyTotal=Math.max(0,p.absorbedEnergyTotal||0);
  p.absorbedWaterTotal=Math.max(0,p.absorbedWaterTotal||0);
  p.repairedTotal=Math.max(0,p.repairedTotal||0);
  return p;
}

// Material transfer becomes ingestion first. `availableEnergy` is the eventual normalized
// energy contribution already inferred from material composition/assimilation potential.
export function ingestEnergy(person,availableEnergy){
  const p=ensurePhysiology(person),q=Math.max(0,availableEnergy||0);
  p.gutEnergy+=q;
  return q;
}
export function ingestWater(person,availableWater){
  const p=ensurePhysiology(person),q=Math.max(0,availableWater||0);
  p.gutWater+=q;
  return q;
}

// Future microbial/ecological layers can call this when Reality supplies a biological insult.
// This is a physiological receiver, not a disease generator or diagnosis table.
export function applySystemicInsult(person,amount,{fever=0}={}){
  const p=ensurePhysiology(person);
  p.systemicLoad=clamp(p.systemicLoad+Math.max(0,amount||0));
  p.feverLoad=clamp(p.feverLoad+Math.max(0,fever||0));
  person.illness=p.systemicLoad; // compatibility view only
  return {systemicLoad:p.systemicLoad,feverLoad:p.feverLoad};
}

export function physiologicalFlux(person,{
  activity=0,cold=0,heat=0,wet=0,cover=0,clothing=0,stationary=false
}={}){
  const c=PHYSIOLOGY_CALIBRATION,p=ensurePhysiology(person);
  activity=clamp(activity);cold=clamp(cold);heat=clamp(heat);wet=clamp(wet);cover=clamp(cover);clothing=clamp(clothing);
  const coldExposure=clamp(cold*(1-cover)*(1-clothing*.62));
  const heatExposure=clamp(heat*(1-cover*.40));
  // A falling warmth state recruits more thermogenesis; extreme heat increases sweating demand.
  const coldStrain=clamp(coldExposure+Math.max(0,.50-(person.body?.warmth??.72))*1.15);
  const heatStrain=clamp(heatExposure+Math.max(0,(person.body?.warmth??.72)-.82)*1.35);
  const injury=clamp(Math.max(person.injury||0,p.repairLoad||0));
  const illness=clamp(Math.max(person.illness||0,p.systemicLoad||0));
  const fever=clamp(p.feverLoad||0);

  const energyRate=c.energyBasalPerDay+c.energyActivityPerDay*activity+
    c.coldThermogenesisPerDay*coldStrain+c.severeColdThermogenesisPerDay*coldStrain*coldStrain+
    c.injuryEnergyPerDay*injury+c.illnessEnergyPerDay*illness+c.feverEnergyPerDay*fever;
  const waterRate=c.waterBasalPerDay+c.waterActivityPerDay*activity+
    c.heatSweatWaterPerDay*heatStrain+c.severeHeatWaterPerDay*heatStrain*heatStrain+
    c.injuryWaterPerDay*injury+c.illnessWaterPerDay*illness+c.feverWaterPerDay*fever;
  const sleepRate=c.sleepDebtPerDay+c.exposureSleepPerDay*((cold+wet)*(1-cover)*.5)-
    (stationary?c.stationarySleepRecoveryPerDay:0);
  return {energyRate,waterRate,sleepRate,activity,coldExposure,heatExposure,coldStrain,heatStrain,injury,illness,fever,stationary};
}

export function applyPhysiologicalTime(person,{dtDays=1/24,...context}={}){
  const c=PHYSIOLOGY_CALIBRATION,p=ensurePhysiology(person),dt=Math.max(0,dtDays||0);
  // Sync newly acquired collision injury into the repair process without double-counting.
  p.repairLoad=clamp(Math.max(p.repairLoad||0,person.injury||0));
  p.systemicLoad=clamp(Math.max(p.systemicLoad||0,person.illness||0));

  const before={energy:person.body.energy,water:person.body.water,sleepDebt:person.sleepDebt||0,
    integrity:person.body.integrity,injury:person.injury||0,illness:person.illness||0,
    gutEnergy:p.gutEnergy,gutWater:p.gutWater,fever:p.feverLoad};

  // Absorption is a physical-time process. TEF is represented as the fraction of ingested
  // chemical energy consumed by processing/absorption/storage rather than usable body store.
  const energyDigest=p.gutEnergy*expFraction(c.nutrientAbsorptionPerDay,dt);
  p.gutEnergy=Math.max(0,p.gutEnergy-energyDigest);
  const usableEnergy=energyDigest*(1-c.thermicEffectFraction);
  person.body.energy=clamp(person.body.energy+usableEnergy);
  p.absorbedEnergyTotal+=usableEnergy;

  const waterAbsorb=p.gutWater*expFraction(c.waterAbsorptionPerDay,dt);
  p.gutWater=Math.max(0,p.gutWater-waterAbsorb);
  person.body.water=clamp(person.body.water+waterAbsorb);
  p.absorbedWaterTotal+=waterAbsorb;

  const flux=physiologicalFlux(person,context);
  person.body.energy=clamp(person.body.energy-flux.energyRate*dt);
  person.body.water=clamp(person.body.water-flux.waterRate*dt);
  person.sleepDebt=clamp((person.sleepDebt||0)+flux.sleepRate*dt,0,1.5);

  // Repair is possible only if there is actual injury and material support. Starvation,
  // dehydration, severe fatigue or systemic illness therefore slows rather than reverses healing.
  const support=clamp(Math.min(person.body.energy/.45,person.body.water/.45,(1.25-(person.sleepDebt||0))/.75));
  const illnessBrake=clamp(1-(p.systemicLoad||0)*.72);
  const repairFraction=expFraction(c.repairFractionPerDay*support*illnessBrake,dt);
  const repaired=(p.repairLoad||0)*repairFraction;
  if(repaired>0){
    p.repairLoad=Math.max(0,p.repairLoad-repaired);
    person.injury=clamp(Math.max(0,(person.injury||0)-repaired));
    person.body.integrity=clamp(person.body.integrity+repaired*c.integrityRestoreFraction);
    p.repairedTotal+=repaired;
  }

  // Illness is allowed to recover in physical time but is never created here from cold/wetness.
  // A future pathogen/toxin ecology must supply the insult through applySystemicInsult().
  const recoverySupport=clamp((person.body.energy*.38+person.body.water*.34+(1-clamp((person.sleepDebt||0)/1.2))*.28));
  const illnessDecay=(p.systemicLoad||0)*expFraction(c.illnessRecoveryPerDay*recoverySupport,dt);
  p.systemicLoad=Math.max(0,(p.systemicLoad||0)-illnessDecay);
  p.feverLoad=Math.max(0,(p.feverLoad||0)*(1-expFraction(c.feverDecayPerDay,dt)));
  person.illness=clamp(p.systemicLoad);

  return {before,after:{energy:person.body.energy,water:person.body.water,sleepDebt:person.sleepDebt,
      integrity:person.body.integrity,injury:person.injury||0,illness:person.illness||0,
      gutEnergy:p.gutEnergy,gutWater:p.gutWater,fever:p.feverLoad},
    flux,absorption:{energyGross:energyDigest,energyUsable:usableEnergy,water:waterAbsorb},repair:{amount:repaired,support},dtDays:dt};
}

// Backward-compatible names used by v1.11 tests/callers.
export const PERSON_METABOLIC_CALIBRATION=PHYSIOLOGY_CALIBRATION;
export function personMetabolicFlux(ctx={}){
  // The legacy function had no Person argument. Preserve only baseline environmental flux.
  const ghost={body:{energy:.72,water:.72,warmth:.72,integrity:1},sleepDebt:0,injury:0,illness:0};
  return physiologicalFlux(ghost,ctx);
}
export function applyPersonMetabolicTime(person,opts={}){return applyPhysiologicalTime(person,opts);}
export function metabolicTimeAudit(person){
  const p=ensurePhysiology(person);
  return {energy:person?.body?.energy??null,water:person?.body?.water??null,sleepDebt:person?.sleepDebt??null,
    integrity:person?.body?.integrity??null,injury:person?.injury??0,illness:person?.illness??0,
    physiology:{gutEnergy:p.gutEnergy,gutWater:p.gutWater,repairLoad:p.repairLoad,systemicLoad:p.systemicLoad,feverLoad:p.feverLoad},
    calibration:{...PHYSIOLOGY_CALIBRATION}};
}
