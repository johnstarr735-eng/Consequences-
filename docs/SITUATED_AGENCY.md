# Consequences — environment, attention, Will, purpose and identity

17 October 2026 · app 0.7.0 · canonical source V1.13

## What this build establishes

An environment supplies finite materials, people, access, geography, received signs and inherited arrangements. A person enters it with a bodily condition, learned practices, retained encounters and a situated history. Attention, represented possibility, purpose and identity concern that relation; they are not four independent character scores.

The build separates a reusable world constructor, the first environment definition, the Night Watch case's prior events/objective, and the player's developing private orientation. It implements supported inspection time, directed observation, private reflections, delivered introductions and the first explicit spatial bridge to canonical Will. It does not finish general social recognition, identity formation, learned practices or all reflective agency.

## Primary-source reading

This pass reread selected manuscript passages from the uploaded notebooks. The existing notebook audit supplies the wider corpus map; this is not a claim to have reread every page of every notebook. Prefaces and later commentary were distinguished from the following manuscript passages.

| Source and locator | Reading carried into this build | Boundary |
| --- | --- | --- |
| *Light & Chaos*, supplied PDF pp. 13–16, extracted lines 304–413 | Will emerges through condition, represented reality and human history. The interval before action differs from what has actually happened. Practices develop through an actor's encounters with their environment. | Early cosmological equivalences and historical/general social assertions are not installed as empirical physical or psychological laws. The mature source-reviewed savepoint governs the executable interpretation. |
| *Black with Red Stripe*, section 2, rendered p. 2, lines 63–100 | A walk, bodily condition, an open door, sound, terrain, other people and a changing intention reorganise attention and action. | A location label or authored role cannot supply the sequence's capacities. There is no universal distraction or personality stat inferred from this scene. |
| *Small Green With Binders*, rendered p. 4, lines 180–199 | The narrator distinguishes observation from the orientation/interpretation through which something becomes significant. | The soul/captain metaphor is not a separate Force, homunculus or guaranteed decision-maker. |
| *Green Notebook*, manuscript Act 2 Scene 1, rendered p. 15, lines 663–669 | Professional identity and a relation's reception can exceed an individual's account of themselves. | An introduction is not an institutionally verified credential. Earlier introductory commentary on identity is not substituted for the manuscript. |
| *Blue Notebook*, rendered p. 29, lines 1645–1682 | A person's represented position, ambition, social designation and material dependencies are intertwined and can conflict. | The narrator's social generalisations are not character attributes or universal response policies. |
| *Black with Red Stripe*, section 79, rendered p. 33, lines 1864–1876 | Intended purpose, actual action, reception and later interpretation are distinguishable. Identity is affected through action and encounter. | The app retains an anticipated purpose and actual conduct separately. It does not announce the final meaning of someone's action or assign a moral identity. |
| *Wavey Grey*, Act 6, rendered p. 35, lines 2002–2029 | A future-facing word can leave an expectation in another person; a later moment may meet it differently. | A private purpose is not a delivered promise. Hearing, interpretation and obligation are distinct; the current promise policy remains a bounded scenario hypothesis. |

The uploaded savepoint's `01_CURRENT_ENGINE/SOURCE_REVIEW_v099.md` provides the reviewed synthesis of Will: finite pre-collapse orientation of an available process toward a represented configuration; body, history, access and plural live possibilities constrain it. `SOURCE_REVIEW_v100.md` keeps represented configurations non-Physical until an actual relation obtains. The v105 Power review prevents the resultant actuality from becoming an owned bonus or a truth certificate.

## A reusable environment, then a particular game

`lib/environment-model.mjs` creates a World from an explicit definition: space, chronology, actual people, finite material Forms, supplied bodily conditions, learned scripts/procedures, prior histories and attributed prior encounters. Definitions are copied into saved state. Duplicate Forms, invalid positions and references to nonexistent encounter participants are rejected.

`lib/night-watch-profile.mjs` now contains the first configuration's names, dimensions, people, materials and prior familiarity. It contains no murder, culprit selection, evidence predicate or victory. Those remain in the case layer. This prevents a future environment from inheriting a murder or a telephone merely because it shares the engine.

A second, synthetic market fixture uses different dimensions, names, material and script with the same constructor. It has no phones, officer or murder goal. This verifies reuse at world construction, not a finished Roman scenario. A historically grounded Rome profile still needs a chosen period, supported institutions/practices, spatial connections and a distinct starting situation. The current playable interface, reply policies and intention referents still use the Night Watch adapter. They are not yet a complete setting-independent game runner.

The observatory's telecom and police arrangement remains the bounded profile-specific slice described in [SOCIAL_ENVIRONMENT.md](SOCIAL_ENVIRONMENT.md). The rest of town remains contextual external support, not an implemented city simulation.

## Attention: an encounter has support and duration

The existing apparatus supplies attention and reception; body energy, water and integrity bound activity. No attention-points reservoir or attention bonus is added. For a supported inspection interval, the app accumulates:

`work += attention × receptor × sqrt(energy × water) × integrity × physical_minutes`

This is a provisional, dimensionless engineering bridge, not a manuscript equation. It is zero without consciousness or the required sensory/reach access. Splitting the same supported duration into smaller integration intervals does not manufacture more work.

An inspection needs one work unit, actual reach at completion, a surviving readable carrier, and the learned script for written contents. Default inspection lasts two minutes. `Inspect register for 20 minutes` can support a slower inspection; naming the object supplies no reading. An interrupted or inaccessible interval contributes no work. Existing acquisitions survive a later failure or material change.

`Focus on Nell for 2 minutes` or `Watch Nell for 1 minute` directs an observation from the actor's actual position. It does not promise movement, acquire fine writing at a distance, reveal thoughts, establish guilt or retroactively witness an event's beginning. The app records what could be observed and when, keeping the observation distinct from the person observed. Directed observation currently needs 0.2 work units. Reflection needs 0.15; both are explicit app calibrations.

This first attention mechanism covers inspection, directed observation and reflection. It is not a general auditory attention/acoustic model, exhaustive salience competition, psychological model of distraction or learned attentional practice. Acute bodily change constrains it through actual condition rather than an invented identity penalty.

## Will: the first explicit represented-configuration bridge

During resolution, an explicit approach can supply an encountered or retained target and the intended proximity. The adapter exposes that represented configuration to the ordinary generation of finite routes, Field/Moira conditioning and canonical Will. Direct access can refresh its target; closed access uses retained position. The represented object is never inserted as a new material Form.

The adapter driver is weighted by the existing reflective aperture and bodily support. Its coefficient, 0.24, is an engineering choice. It supplies orientation, not Force. Candidate and score calculations use the represented position, so moving an unobserved target cannot secretly redirect the actor toward its actual location.

The canonical Will formation checks remain intact: plural materially live possibilities, a representable target, reflective aperture above 0.28, crisis below 0.78 and at least 0.08 days of supported orientation. The last is about 115.2 simulated minutes under this source's calibration. No threshold was reduced to force activity in a short case. A scene-level loss of waking capacity pauses reflective accumulation while retaining the earlier representation.

Before a canonical projection forms, explicit player movement still uses the existing controlled selection among surviving routes. When a matching projection is active, canonical Will rescoring can determine the selected route. A new or paused human instruction does not automatically become a fully formed canonical Will. The requested proximity becomes the projection's fulfilment criterion, with a 1e-7 scene-distance numerical tolerance; native non-adapter projections retain their original criterion.

`engine/situated-orientation.mjs` is the identified integration hypothesis. `scripts/generate-controlled-engine.mjs` generates both the controlled motion adapter and a narrowly adapted Will module from the vendored sources. The canonical 23 upstream files remain unchanged. The generated Will adapter changes external proximity representation and waking availability; its formation thresholds, commitment rates and Force constraints are preserved.

A 120-minute slow-scene fixture forms a canonical projection, records the opening, retains a non-actual configuration and changes the selected route from the raw top through Will bias. The same fixture with very low attention forms none. Physical energy is expended and material Force is unchanged. This establishes a causal bridge under controlled conditions, not that every investigation or prompt now demonstrates reflective Will. Semantic purposes, nonspatial plans and general social intentions are not yet canonical configuration grammars. Imagination and Praxis are still the source implementation's limited mechanisms; this pass does not claim their full game integration.

## Purpose: a player's orientation, distinct from the objective and the result

`Purpose: I want to hear Nell before accusing anyone` retains the player's own statement, its time and encountered named anchors. It is a private reflection that takes simulated time; queued wording changes nothing until resolution. Its anchors provide explicit attention choices in the notebook. The player still chooses the subsequent act.

The original objective and evidence standard remain unchanged. Purpose does not grant a tool, knowledge, another person's choice, a victory or a strength multiplier. The app does not infer a secret ambition, interpret an imagined purpose as physical actuality, or impose a new value after failure. Earlier reflections remain in history when the player revises their account.

The optional language interpreter receives only that player's filtered orientation as context. It remains disconnected in the published alpha. Direct reflection, focus, introductions and timed inspections work without it. A private reflection becomes a social promise only through a separately delivered expression; general obligation formation remains incomplete.

## Identity: self-account, presentation, encounter and recognition

`My identity: a careful investigator` retains a self-account. `Introduce myself to Nell as an inquiry researcher` produces words through actual hearing. The two are separate records. A listener retains a reached introduction as a heard claim, with source and time, not as certified identity or authority. An unheard introduction supplies no listener record.

The notebook now presents private purpose, self-account, directed observations, delivered introductions and the player's encountered conduct. Each other person retains their own history. Existing direct-harm refusal can persist after the actor claims an important office; the claim does not erase what that listener experienced. Introductions and incidental observations do not count as evidence presented under the case's commitment/confrontation policy or as original murder proof.

No global reputation, fixed moral type, profession bonus, universal deference or automatic personality change is created. The app records a situated account and actual meetings rather than announcing who a person essentially is. General learned recognition, disputed credentials, social identity development and the canonical `identityResidue`/Mental trace integration remain open. The new records are not inserted into that canonical ledger merely to make a diagnostic count increase.

## Persistence, privacy and verification

New cases use state format 4. The graph save retains the world definition, acquired practices/history, attention work, private reflections, presentations and canonical Will state. Older saves keep their existing world; no new profile is reconstructed over them. Private reflections are lazily initialized by their own resolved actions. The journal export explicitly enumerates only the requesting player's orientation and conduct, excluding other players and unknown injected fields.

All 110 automated tests pass, including the waking-reflection guard and upstream-equivalence checks. Type checking, the mobile production bundle, native asset synchronization and mobile packaging guard pass. Web production packaging is a release requirement. Browser and physical-phone playtesting have not been performed in this pass.

Falsification fixtures are in `tests/situated-agency.test.mjs`: two different environment definitions; no capacity from identity text; short/long unsupported/supported reading; subdivision-stable attention; inaccessible/unconscious intervals; observation versus writing; private purpose versus objective; a delivered title versus retained conduct; filtered interpreter/export; identical save/resume consequences; finite Will formation and causal route selection; retained target geometry; and paused waking reflection. Existing source-hash, no-orientation upstream-equivalence, case completion, evidence, privacy, server recovery and on-device practice tests remain part of the release checks.
