# Consequences 0.8 — situated setup and fifteen-minute turns

17 October 2026 · app 0.8.0 · native build 10 · new world format 5

## What is implemented

New web matches and new phone practice games use a shared setup followed by sequential control turns. A turn can contain multiple prompts. Actions resolve immediately and charge actual simulated duration against a fifteen-minute ceiling. A response from an NPC can therefore be followed up without waiting for the other player's normal turn.

The shared world clock advances sequentially: an A interval ending at 12:15 is followed by B's interval beginning at 12:15. Review, typing and network delay advance no simulated time. An early handoff transfers control immediately and does not bank unused minutes. This is an app participation protocol, not a new ontological global turn or a modification of the canonical Moment.

Existing saves without the new setup/turn state retain their paired contribution protocol. New API/UI creation explicitly selects the new mode. No old match is silently reinterpreted halfway through an exchange.

## Time, continuity and response

`case-time-turns.mjs` uses the existing physical resolver with a finite duration ceiling and event checkpoints. A truncated plan retains unfinished tasks, their remaining durations and supported attention already performed. The character can continue it or replace it with a new intention. During the other player's turn, existing activity can keep progressing; the inactive body is not frozen. Later steps cannot complete before their own elapsed time. A supported long intention can describe up to one day of activity, but its first control interval still stops at fifteen minutes or the earlier inquiry deadline.

A reachable, perceivable direct encounter opens a response before new harmful contact resolves. Its notice is an app control-protocol message, not a firsthand harm record or evidence that the attempted result occurred. Delivered speech or an actually read message can also open a response. The response covers at most one simulated minute within the active interval, not another full fifteen-minute turn. An attack proposed as a response permits a counter-response; the existing intentions then meet without an endless zero-time reaction chain. There is no response notice for an absent or unaware character merely because a private plan names them. Speech delivery, device arrival, reading and agreement remain distinct.

Temporary incapacity runs through supported physical intervals until a conscious seat can act, recovery occurs or the inquiry closes. Permanent player elimination closes this first two-player format without awarding an unsupported original goal. A correct evidence-supported case still wins; unmet original goals still fail. The player can resign. The physical deadline cuts activity off exactly.

Equal-time attempts at taking the same reachable object no longer use the A-before-B task loop as a tie breaker. Neither opens an uncontested coupling in that instant. This deliberately conservative app policy preserves the object and the encounter; it is not a complete contested-grasp physics model.

## Environments and challenge

Three complete profiles use the existing records-court geometry and investigation mechanics:

| Profile | Setting | Actually supported communication |
| --- | --- | --- |
| Port Serein | Fictional harbour observatory, 2026 | Local speech, writing, finite handsets, mobile voice/SMS/data and supported WiFi. |
| Roman Records Court | Historical fiction in Rome, AD 100 | Local speech and hand-carried ink writing. Electrical devices and their couplings/known positions are removed. The timeline is a written sequence; there is no electronic recorder or stopped wristwatch. |
| Lantern Keep | Invented trading city, Year 312 | Speech and carried writing. This initial fantasy profile has no working magic or telepathy. |

These are bounded court environments, not whole cities. New historical, present-day and fantasy profiles can use the same schema, but an unsupported technology or supernatural ability needs a real mechanism first.

The Roman incident, characters, court and inquiry arrangement are fictional. The writing medium is informed by the British Museum's ink-written wooden leaf tablet, museum object 1986,1001.64: https://www.britishmuseum.org/collection/object/H_1986-1001-64. This is not evidence for a reconstructed Roman murder-inquiry procedure. Research located museum evidence for ink writing on wood; the rest of the local incident is explicitly game fiction.

Easy supplies four hours and clearer starting guidance; medium supplies three hours and one initial lead each; difficult supplies two hours and less initial direction. Existing bodily/evidence rules and source provenance remain comparable. Higher difficulty introduces no secret strength bonus or guaranteed deceptive observation. These presets do not yet vary actor count or implement new institutions.

## Character creation and actual differences

Both players choose and confirm before physical time advances. Presets or a bounded custom builder specify a distinct name, present position, main practised background and ordinary adult physical build. Supported positions are records investigator, caregiver, officer/guard and local civilian. Main backgrounds are records work, practical care, recent grappling practice, former service and local working life. Extra state fields, unsupported backgrounds and giant/omniscient body profiles are rejected. Scenario identities cannot be reused as ambiguous target names. Names and retained histories persist through save/reload and remain usable targets.

A position creates a stated starting history and situates the person in this open inquiry; it grants neither force nor automatic obedience, access to confidential material or trust. All current starting characters have prior schooling in the local archive script. There is no general institutional authority/recognition engine in this release.

Ordinary lighter/heavier frames change initial material mass, force and mobility within narrow bounds. Repeated setup editing starts from the original baseline, so differences cannot stack. These are explicit scene hypotheses about initial bodies, not a stored Power score.

Recent grappling history retains a bounded handling description: direct, sustained, unarmed contact with another person. Only a matching current encounter can improve the manipulation contribution within its existing upper bound. It creates no extra force or bodily fuel. An impulsive strike or an implement-assisted act does not match that retained handling. Former service by itself has no such record. Records work and practical care retain different observation histories; a matching close encounter with an inscribed surface or visible body can modestly improve supported attention work. Access, literacy, resistance, bodily condition and material support remain prerequisites.

These are app-level bridges from stipulated prior history, not fabricated canonical Praxis episodes or a completed model of practical learning. Current gameplay does not automatically award new skills after a successful command. Habit narrowing and richer contextual transfer remain open mechanisms.

## AI generation and continuity

The optional existing provider connection now supports three distinct operations: interpreting attempted processes, choosing a scenario recipe and a bounded NPC dialogue reply. They use the existing server-held API secret and model setting. No provider key is present in the browser or native bundles. No live provider is configured at this release.

The first generator chooses among supported title variants, prior culprit, opening circumstance and starting lead order for a chosen environment. The server validates the recipe and compiles actual objects, distinct prior events and consistent evidence before play. The private recipe and culprit flags are not in player views. Local title/lead draws use separate mixes so a public title is not a fixed oracle for the culprit. There is no generated authored ending, mid-game culprit rewrite or arbitrary world-edit JSON.

With no key, a locally generated, validated scenario is immediately playable. Provider errors or invalid generated recipes fall back to the same chosen environment and disclose the fallback. This is bounded configuration of the existing investigation, not an unrestricted procedural city, election or protection-scenario generator.

Optional NPC wording sees only the addressed NPC's own account, role, heard words and limited condition. It receives no other player's notes, authoritative culprit flag or complete world graph. At most one optional dialogue call is made per committed prompt. Existing source-specific testimony, refusals after encountered harm, hearing and body constraints remain authoritative. Generated words are delivered claims and never become original physical evidence or a completed action. Transport failures leave the deterministic situated reply available. Tests use injected providers; live model quality, cost and latency remain unqualified.

## Source reconciliation

| Source | Interpretation used | Boundary |
| --- | --- | --- |
| *Light & Chaos*, PDF pp.13–16, extracted lines 285–335 and 389–442 | Present understanding and possibility depend on bodily faculties, experience and technological/social circumstances. Repeated handling can become efficient and can also narrow agency. | No manuscript coefficient or universal profession-based competence. The 1.15 handling and 1.12 observation factors are bounded app calibrations; habitual narrowing is not implemented. |
| *Light & Chaos*, PDF pp.78–81, lines 2895–2905 and 2983–3007 | Social markers participate in identity; the later Camus discussion concerns limits revealed in refusal/rebellion. | Self-account, received identity claims, prior capacity and actual world effects remain separate. These passages do not author another person's recognition or obedience. |
| Canonical `SOURCE_REVIEW_v102.md` | Committed practice may alter later conductance under structural resemblance without a universal skill scalar or guaranteed truth. | The initial backstory bridge is app-level. It does not claim canonical practical-trace episode formation. |
| Current V1.13 geometry, material dynamics, physiology and Will adapter | Actual movement, support, resistance and retained orientation still constrain attempts. | No upstream file or formation threshold was changed. Control-window durations and the one-minute response interval are game protocol calibrations. |

The earlier source reviews in `SITUATED_AGENCY.md`, `SOCIAL_ENVIRONMENT.md` and `DESTINY_PHILOSOPHY_REVIEW.md` remain relevant. This release does not close the general canonical app-event attribution, social recognition or nonspatial Will/Imagination/Praxis gaps. The notebooks are not consulted live on each prompt.

## Falsification and verification

New regression fixtures cover immediate follow-up questions, the exact fifteen-minute cutoff, long intentions, persisted unfinished inspection, concurrent activity, unavailable turns, retries after restart, direct responses/counter-responses, delayed message reading, temporary/permanent incapacity, exact deadlines, equal-time taking, setup agreement, rejected powers, non-stacking bodies, relevant/irrelevant handling, dynamic names/privacy, missing electronic devices, independent title/culprit mappings, generator validation/fallback and optional provider perspectives. Every environment completes an acquired-evidence case inside its difficult deadline.

An end-to-end Roman playthrough exposed a finite-navigation bug: the direct-blocker visibility graph omitted obstacles encountered by its detour, and an intermediate waypoint could stop just outside the next segment's clearance. The adapter now expands to the other encountered obstacles and approaches intermediate waypoints more closely. Actual finite routes still resolve through the unchanged kernel; no teleport or world knowledge was added.

Case saves now use a lossless compact graph encoding with shared property-name indices and compact references. Earlier gzip/format-1 saves remain readable. The busy-match fixture keeps its complete world and immutable chunk snapshots; the expanded-size safety bound is unchanged. No event history is deleted to fit storage.

Verification consists of the complete automated suite, type checking, the mobile production bundle, native asset synchronization, mobile credential/packaging guard and the web production build. Source hashes for all 23 vendor files remain unchanged. Browser control and physical-device QA are unavailable here. Android/iOS signing, native multiplayer authentication, installation, closed-app push and real two-person pacing remain release work.
