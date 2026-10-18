# Consequences — DESTINY philosophy review

> Historical mechanism audit: the measurements and verification counts below describe build 0.5.1. Later spatial intention integration and timed control protocols are documented in [situated agency](SITUATED_AGENCY.md) and [timed worlds](TIMED_WORLDS.md). For the current gameplay assessment and remaining generated-world gap, see [the 0.8.1 review](GAMEPLAY_REVIEW_0_8_1.md). This record is retained rather than presenting earlier measurements as a fresh audit.

17 October 2026 · app 0.5.1 · canonical engine V1.13

**Subsequent implementation:** [SITUATED_AGENCY.md](SITUATED_AGENCY.md) records app 0.7.0's supported attention, reusable world definitions and first explicit spatial Will bridge. Its sustained-orientation fixture forms a canonical projection and demonstrates a changed route under the original eligibility gates. The measurements below remain the historical 0.5.1 baseline; they have not been relabelled as current results. The broader attribution, social recognition and nonspatial agency gaps remain open.

## Verdict

DESTINY is an active foundation of the game, but the complete philosophical loop is only partially integrated. Finite bodies, situated access, material resistance, represented possibility and preserved history constrain play. A prompt cannot directly create an object, establish a fact, decide another human's choice or guarantee an outcome.

The main shortfall is between intention and the next horizon. Much of the playable investigation, communication and contact behaviour is implemented by bounded app rules around the kernel. Those rules produce consequences, but many do not enter the canonical Will, Imagination, Praxis and relational-trace mechanisms. It would overstate the build to call every important action a complete DESTINY actualisation.

## Basis and scope

The reviewed starting application commit is `b12cd5f6317145be9b16fed566e114156312dd64` (app 0.5). The sensory-access correction described below is the 0.5.1 follow-up.

The source is the supplied `DESTINY_SAVEPOINT_2026-09-20(6).zip`, whose bytes match the previously used archive:
`cfb79cd9c1d9a72ddb2ea967dffb12b33f67d042a6c7357d547f7514cadf549d`.

All 23 vendored runtime files were compared with `01_CURRENT_ENGINE/` in that archive; all match exactly. This review concerns that V1.13 lineage, not every later development of DESTINY.

Primary guidance reviewed:

- `START_HERE.md`
- `07_PROJECT_KNOWLEDGE/CANONICAL_INVARIANTS.md`
- `07_PROJECT_KNOWLEDGE/CURRENT_STATE_AND_NEXT_STEP.md`
- `01_CURRENT_ENGINE/SOURCE_REVIEW_v099.md` (Will)
- `01_CURRENT_ENGINE/SOURCE_REVIEW_v105.md` (Power/becoming)
- `01_CURRENT_ENGINE/SOURCE_REVIEW_v113.md` and `MODEL_AUDIT_v113.md` (physiology)

The current Library notebook-source audit and product brief were also reread for source reconciliation and the agreed game rules. This is not a new reading of every original notebook passage.

The canonical savepoint asks for an engine of possibility rather than a catalogue of authored outcomes. It also explicitly leaves relational capacity and several emergence questions open. Importing its modules does not resolve that debt.

## What shapes possibility and action now

| Principle | Implemented effect in play | Assessment |
| --- | --- | --- |
| One situated condition | Bodies, objects, positions and material histories have authoritative state. Players receive filtered views of that state. | Active foundation; app knowledge, commitments and incidents are additional structures that are not fully represented in canonical condition diagnostics. |
| Cosmic, Social and Existential Fields | The kernel computes three sovereign demand profiles before conditioning candidate motion. Scale/participation, external visibility/retained placement, and finite agency/mortality contribute differently. | Active numerical demand grammar. The equations are engineering proxies, not validated final Field physics. |
| Consciousness, Mental and Physical | The kernel projects one condition into presence/possibility, ordering/meaning, and actuality/consequence. These are distinct from the three Fields. | Active canonical architecture. The app's detailed acquired records and spoken commitments have only partial connections to these projections. Ontological Consciousness is not identical to a character being awake. |
| Moira | Present demand consumes situated bodily, ordering and horizon capacity before candidate burdens are assessed. Overload can remove routes from the live set. | Active and causally demonstrated in a controlled boundary fixture. Moira is not a fate value or a single character stat. |
| Intention differs from actualisation | A plan supplies attempts and geometric orientation. Actual movement still passes through finite routes and the contact solver; follow-up tasks check the position actually reached. | Active. The route adapter is a player-control hypothesis, rather than canonical reflective Will. |
| Will | The kernel invokes finite pre-collapse orientation based on body, represented targets, history and plural live possibilities. | Invoked, but dormant in the tested complete investigations. Player prompts do not become canonical Will projections. |
| Imagination and Praxis | The kernel can retain encountered configurations, project a non-actual relation, test it against physical consequences and revise a later route. | Invoked capacity; no episodes occurred in the tested cases. Navigation detours and player-written plans should not be advertised as canonical Praxis or Imagination. |
| Force, Flow and resistance | Geometry, bodily force/manipulation, carried material, load, opposing bodies and available paths constrain effects. | Active. The compression/injury extension uses explicit dimensionless game rates; it is not a source-derived or medically validated model. |
| Power as becoming | Local canonical Moments carry structured relational-actualisation readings. Power is not stored as a possession, used as a bonus or treated as truth. | Correctly restrained. The Power audit describes canonical actualisations; it does not account for all app-ledger events. |
| Trace changes later possibility | Canonical relational traces are committed after resolution. App records separately retain inspected sources, delivered words, incidents and breached commitments. | Active, but divided between two systems. App memories affect specified later responses without generally becoming canonical relational consequence. |
| Truth differs from belief and influence | A witness can lie. Speech delivery does not rewrite the prior killing. Reported copies keep the same source root. A forged claim cannot become original proof. | Active. The evidence standard and winner predicate are published game rules. |
| Cause precedes capacity and consequence | Intent supplies no ignition heat; writing needs existing ink and a receptive surface; bodily costs persist; rest supplies neither calories nor water. | Active constraints. The app still has a finite operation vocabulary and cannot represent every physically conceivable attempt. |
| Physical chronology differs from a turn or Moment | Both contributions are required before resolution. Once resolving, activity durations and numerical intervals advance physical time; a call can produce zero or several local Moments. | Active distinction. The solver uses a shared numerical clock; this is not a fully asynchronous local-event solver. |
| No authored moral destiny | Harm is not a universal reputation penalty. An unachieved original objective remains unachieved. Retraction does not erase earlier words. | Active rules. NPC intervention, refusal and commitment handling are scenario policies, not a general emergent ethics or social model. |

## Measured findings

The reproducible diagnostic is `scripts/audit-destiny-philosophy.mjs`. It creates fresh in-memory worlds and does not edit any saved match. Its captured output is `docs/DESTINY_PHILOSOPHY_DIAGNOSTICS.json`.

Run from the project root:

```sh
node scripts/audit-destiny-philosophy.mjs
```

### 1. Three complete investigations did not activate canonical reflective agency

For seeds 1, 2 and 3, Mara inspected the key register, brass weight and Rowan, then lodged a case against the corresponding culprit. Jonah waited two minutes per exchange.

Each fixture:

- reached Mara's published goal in four exchanges and approximately 56.636963 simulated minutes;
- used 53 numerical frames and recorded 12 canonical local Moments;
- opened zero Will projections, zero Imagination projections and zero Praxis episodes;
- retained seven canonical relational-trace episodes, with zero Physical relational consequence in that particular investigation.

This demonstrates a meaningful integration gap. It does not prove that those mechanisms can never activate in any possible match, and zero Physical interpersonal consequence is not itself an error in an investigation. A six-exchange, 180-minute waiting fixture also opened none.

The code explains the gap: `_playerOrientations` supplies a candidate before Field conditioning, then the adapter chooses a surviving route by distance to the requested goal. It does not translate the player's intended discrepancy into the canonical Will representation. The kernel's autonomous driver-based projections have different prerequisites and time scales.

### 2. Field conditioning can genuinely close routes, but its score changes often do not affect player selection

A healthy one-minute motion fixture had 17 generated routes and 17 survivors. A depleted fixture still had 17 survivors, although admissibility and scores worsened. The adapter sorts surviving routes geometrically, so a Field penalty to their scores alone does not change that choice.

A separate controlled fixture held body and the same finite pool of 17 routes fixed near a carrying limit. With normal computed Field demand, only one route survived. With Field-demand contributions removed for that diagnostic, all 17 survived. Thus the conditioning has a causal gate, rather than being decorative metadata.

That boundary fixture deliberately uses severe depletion. It establishes a mechanism, not the frequency or dramatic quality of Field effects in ordinary play. No engine thresholds were changed to force emergence. Semantic incompatibility between different Field grammars remains unresolved; the canonical implementation explicitly keeps `contradiction` at zero.

### 3. A social encounter changes the app without entering canonical history

In a reached-speech fixture, Mara promised Nell to show evidence before accusing, then publicly accused Ada. The app recorded four speech signals, marked the commitment broken and registered Nell's breach response. The encoded canonical World remained exactly unchanged by those task completions.

Those records are saved and consequential: they can change subsequent dialogue and retreat. However, it would be inaccurate to describe that particular change as a canonical Mental relational trace, learned social capacity or Field-mediated recognition.

### 4. Contact alters bodies, but its causal attribution is incomplete

In an isolated two-minute compression fixture, Nell acquired injury and lost the abstract reserve. The absent Jonah acquired no incident record.

The app retained compression and loss-of-consciousness incidents. The canonical event list contained bodily contact and reciprocal encounter, but no corresponding compression-incident event. The A–N relation retained Physical contact consequence while both participants' canonical directional consequence remained zero in that fixture.

The app changes the body before the kernel snapshot. The changed condition can therefore constrain later motion and physiology, while the specific harmful encounter is still missing from canonical event attribution. This is a boundary to repair, not evidence that all harm is ignored.

### 5. Incapacity had an access leak; corrected in 0.5.1

Before this review, `caseView` could show current surroundings to an unconscious character because `visible` checked whether the observer was alive. The canonical accessibility pass could also refresh that person's remembered positions.

The app now withholds live surroundings during incapacity. The generated adapter closes the unconscious observer's active sensory paths and prevents fresh positional renderings until access reopens. Earlier acquired records, private notes and remembered places remain. Other people can still encounter the unconscious body.

Two regression fixtures verify the view boundary, retained prior positions, sensory closure and reacquisition after recovery. The 23 upstream files remain untouched. This correction concerns finite sensory access; it does not erase the Form from the ontological Consciousness representation.

## What the philosophy should make the game feel like

An action changes the situation from which the next action becomes possible. Its effects can constrain and open possibilities at the same time.

For example, attempting to strangle Nell is already more than a fixed attack roll: reach, bodily condition, resistance and intervention affect the physical result; constrained speech affects immediate communication; a survivor can later report an encountered event; an absent player does not automatically learn it. Nell's later refusal currently comes from a scenario policy.

The deeper DESTINY requirement is that this lived encounter also becomes appropriately attributed history: what each person encountered, retained, interpreted and can now sustain or refuse. That history should alter future possibilities through supported mechanisms. It should not create an unexplained hostility score, material strength bonus, compulsory new ambition or guaranteed future plot.

Similarly, a false accusation can actually alter relations without becoming true about the killing. A useful invention can remain imaginable while the actor lacks the material arrangement needed to actualise it. A failed attempt can teach something without automatically awarding skill. Waiting can preserve one possibility while another closes through physical time.

The starting goal remains clear. Human players can develop attachments, promises and ambitions through play; the simulator must not quietly replace a failed goal with a newly invented victory.

## Priorities for deeper integration

1. **Bridge actual app encounters into the canonical consequence path.** Represent physical changes, reached signs and retained interpretations with appropriate participants, timing, provenance and before/after condition. Commit trace after the producing event. Mere delivery of words must not create Physical productive surplus. Do not copy every app log into a generic Physical event bucket.
2. **Make intended configurations inspectable before action.** Distinguish a requested attempt, a represented but non-actual configuration, live feasible processes and the resolved result. Decide through a source-led adapter review how human orientation relates to finite Will; do not merely rename a prompt field `will`.
3. **Connect practical feedback to later possibility.** Test a failed attempt, retained encountered obstruction, revised attempt and actual result. Keep Imagination non-Physical until its projected relation really obtains. Do not lower the existing projection thresholds just to generate episodes.
4. **Extend causal capacities before broadening command synonyms.** The current interpreter exposes bounded operations, and the optional general-language bridge is not connected. Another language model can interpret wording, but it cannot supply a missing physical process, institution, recognition mechanism or causal ecology.
5. **Test normal-play Field effects and social alternatives.** Compare the same immediate intention under different bodily condition, acquired history, visibility and recognised commitments. Require a supported explanation for any changed possibility. Elections, protection scenarios, learned authority and emergent institutions remain future work.

These are implementation requirements, not completed features. The source savepoint itself leaves general relational capacity open, so the next step is a source-led mechanism design rather than an assertion that every desired social behaviour is already licensed.

## Verification and limits

All 84 automated tests pass after the correction, including the two new sensory-access fixtures. Type checking, the mobile production bundle, native asset synchronization and the mobile packaging guard also pass. Web publication uses the checked source and a production build.

The diagnostic probes are targeted falsification and boundary checks, not a proof of the entire philosophy. The full historical Field harness was not rerun. No interactive browser or physical-phone playthrough was performed in this review. The coarse contact rates, scene movement conversion, fixed prior murder and NPC reply policies remain explicit modelling assumptions.

The canonical engine is preserved. The review implements the finite access correction and documents the broader gaps; it does not silently redefine the user's ontology.

