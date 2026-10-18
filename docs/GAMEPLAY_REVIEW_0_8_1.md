# Consequences — gameplay review and reliability fixes

18 October 2026 · app 0.8.1 · native build 11

## Assessment

The distinctive idea is a shared situation that remembers what happened. A player can speak, hide, cooperate, use force or change their mind, but the resulting possibility depends on bodies, access, witnesses, material conditions and retained history. A survivor's account can matter later without an absent person automatically learning it. A reported claim can change a relation without becoming true. This is where the notebooks and DESTINY give Consequences its identity.

The current alpha demonstrates parts of that idea inside a bounded murder inquiry. It is still closer to an evidence game with a physical simulation than the broadly generated social world intended by the user. More atmosphere or command synonyms would not resolve that difference.

Fifteen-minute control windows improve conversations. They also create a cost: an inactive player can have little to do while the other explores. The private notebook, received events, ongoing activity and brief encounter responses help. Whether fifteen minutes produces satisfying two-person pacing needs an actual two-device playtest. It should remain a ceiling; players can hand over early.

The winning rule is precise and testable, but leads through the same access/means/timeline investigation in all three profiles. Elections, different protection goals, recognisable institutional power and broader social alternatives are not implemented. The game must keep its original goal honest while allowing players to develop their own commitments.

## Problems reproduced and corrected

| Problem | Observable correction |
| --- | --- |
| Character creation accepted Cyrillic and Chinese names, but the target resolver deleted those letters. Speaking sometimes worked through a separate alias adapter while approaching or grappling the same person failed. | Creation and targeting now share a Unicode-preserving spelling rule. The same named character remains addressable after save/reload. |
| Two accepted names could collapse to one target spelling, or a character could take a reserved material alias such as “Paper” or “Key Book”. A name prefix could also redirect a dialogue target. | Setup rejects ambiguous accent/punctuation variants and reserved target expressions. Dialogue canonicalisation checks a complete name boundary and tries longer names first. |
| An accusation naming Lucan in the historical profile could fail because its optional victim suffix expected Rowan. | The profile's actual victim name is accepted in the supported accusation forms. |
| The response screen displayed the active turn's remaining fifteen-minute budget even though a response could use at most one minute. The final inquiry deadline could also shorten that budget. | The server exposes the actual available interval. The ribbon, composer and review display the response/deadline bound; long plans disclose that unfinished activity persists. |
| Automatic practice or activity during the other seat's turn could replace the player's recap with “Continue existing activity” or a blank intention. Scene filtering then hid the consequences of the player's own action. | New history records distinguish the seat that submitted input from concurrent activity. Recaps and the intention list use the player's submitted input; received events since it remain visible. Brief responses retain their actual submitting seat across reload. |
| On-device review could interpret actions before the character/world agreement was complete. | Device practice now applies the same `canSubmit` boundary as online review. |
| Some non-electronic role/reply text retained observatory or Rowan references. | The store role and officer's reply use the current setting and victim. Confirmed character copy uses the saved selection. |
| A fresh dependency installation failed: `package.json` requested the nonexistent `@vitejs/plugin-rsc@0.8.06`, while the lockfile and Vinext peer contract required `0.5.26`. | The manifest uses the existing locked compatible version. The frozen dependency installation succeeds without upgrading the dependency tree. |

These changes repair control, interpretation, presentation and build reliability. They add no physical force, knowledge, social authority or canonical learning capacity. Upstream V1.13 files remain unchanged.

## The required world-generation architecture

The user's corrected direction is **historical / fantasy / present as generation modes**, rather than a fixed Rome map or three permanent worlds.

1. The player chooses a mode and optional preferences.
2. The connected AI proposes the actual place, period, history, geography, people, institutions, technologies, resources and opening situation in a structured world specification.
3. A compiler checks that proposed conditions have executable support. A curfew needs a way to be noticed, communicated and enforced; a title grants no automatic obedience. An extraordinary fantasy process needs a supported mechanism.
4. Accepted conditions and prior events become the saved world. The AI cannot rewrite them to make the next response convenient.
5. Players choose situated characters after seeing that world. Attempts are interpreted against actual capacities; the simulation resolves what happens. New words remain attributed claims unless an actual process changes something.

In this sense the AI is the interpreting and generative brain; DESTINY and the saved state constitute the world in which it operates. Giving the AI more narrative freedom must not let it grant success, disclose private information or invent unsupported capacities.

**This architecture is not implemented by 0.8.1.** The existing generator chooses a recipe within three prepared inquiry profiles. No live AI provider is configured. This release does not claim that replacing the menu or renaming a map would implement generated environments.

## DESTINY and notebook fidelity

The source reconciliation in [the foundation](FOUNDATION.md), [situated agency](SITUATED_AGENCY.md), [timed worlds](TIMED_WORLDS.md) and the [historical philosophy audit](DESTINY_PHILOSOPHY_REVIEW.md) still governs mechanics. Relevant reviewed passages include *Light & Chaos* pp.13–16 on situated faculties, experience and habit, and the later discussion of social markers and identity. They do not license a universal profession bonus or compulsory recognition.

Finite access, physical resistance, distinct source provenance and retained app memories affect play. Canonical app-encounter attribution, general social recognition and nonspatial Will/Imagination/Praxis remain incomplete. The earlier audit's measurements describe its own build; this reliability review does not rerun or replace that theoretical audit. The application does not consult the manuscript corpus live on every prompt.

New history attribution is control-protocol metadata. It records who supplied an instruction; it does not manufacture a canonical trace or claim that involuntary activity was an act of Will. Response durations remain app protocol calibrations. Name resolution and interface timing introduce no new simulation law.

## Recommended next implementation order

1. Build the generated-world specification and causal compiler above. Keep the current inquiry as a disclosed fallback/demo while qualifying that path.
2. Bridge actual app encounters into canonical consequence with participants, timing, provenance and before/after condition. Use falsification fixtures for unheard words, surviving witnesses and later changed possibilities.
3. Give inhabitants supported goals and situated decisions beyond stock testimony. Distinguish their observations, beliefs, practical capacities and interpretation of a player's conduct.
4. Add a second clear goal structure after those foundations work. A protection game would test social encounter and changing access more directly than another reskinned murder inquiry.
5. Play the same game with two people on separate devices. Measure confusion, inactive waiting and whether players can explain why an attempted action succeeded or failed.

## Verification

Seven new regression fixtures cover cross-script names after reload, ambiguous target names, complete-name matching and a historical accusation, response/deadline availability, setup review gating, the practice recap and persisted response attribution. All **156 tests pass**. Type checking, the mobile production build, native asset synchronization, the mobile packaging/credential guard and the web production build also pass. All 23 vendor files match their recorded source hashes. A clean frozen dependency installation succeeds with the repaired manifest.

Browser interaction and physical-phone testing are unavailable in this environment. Native signing, installation, closed-app push and live AI quality/cost/latency remain unverified. The private Site audience is preserved. Existing paired saves remain paired; older history without submission metadata retains its previous interpretation because the app cannot reconstruct an unknown input author reliably.
