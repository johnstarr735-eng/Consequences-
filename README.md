# Consequences — 0.8.1

The notebooks are the primary philosophical source; DESTINY is their source-reviewed executable interpretation; Consequences makes the resulting world playable. Read [the foundation](docs/FOUNDATION.md), [working instructions](AGENTS.md) and [current timed-world implementation](docs/TIMED_WORLDS.md).

New matches use **several prompts within a fifteen-minute virtual turn**. Consequences resolve immediately, so a conversation can continue without passing control after every question. Each player chooses a situated character, confirms the shared environment, and pursues one clear starting goal.

## Current review

[The 0.8.1 gameplay review](docs/GAMEPLAY_REVIEW_0_8_1.md) records the assessment, repaired naming/recap/response bugs and clean-install correction. The intended world choices are historical, fantasy and present generation modes. The prepared profiles below remain a bounded demonstration; the full world generator and live AI connection are unfinished.

## GitHub source and selectable AI

The complete game is unpacked into the repository's working source directories. The earlier 0.8.0 ZIP is a retained backup. Make changes in `app/`, `lib/`, `engine/` and the other source directories; the canonical foundation and reviews are in `docs/`.

The prepared integration supports backend configuration `AI_PROVIDER=ollama`, `openai` or `disabled` through the existing interpreter and compiler. Ollama uses an explicitly configured installed model and loopback address on the backend machine. Interpretation, existing scenario recipes and optional NPC wording share the selected provider; selecting Ollama never falls back to paid OpenAI calls. [AI_PROVIDER_SETUP.md](docs/AI_PROVIDER_SETUP.md) explains configuration, tests and the still-unconfigured public multiplayer connection. This is source integration; live AI quality and the user's Windows installation have not been tested.

## New matches

Choose present-day Port Serein, the Roman Records Court (historical fiction, AD 100), or the invented Lantern Keep. All three are supported small court environments with consistent physical records and a prior killing. Modern communications exist only in Port Serein. The other profiles remove electronic devices and use written sequence records. This first fantasy profile has no working magic.

Easy, medium and difficult provide four, three or two simulated hours, with different starting guidance. Both players confirm their character before the clock starts. Presets or a bounded custom builder specify name, present position, main practised background and ordinary adult physical build. Names/titles alone grant no force, knowledge, compulsory cooperation or guaranteed outcome. Relevant retained history can affect supported observation or sustained unarmed handling; the exact narrow rates are explicit app calibrations.

During a turn, review an attempted action and choose **Act**. Ask a follow-up, move, inspect, help, deceive, use force, reflect or change plans while time remains. Typing, review and network waiting cost no virtual time. The shared clock advances sequentially. Long activity stops at the fifteen-minute ceiling and persists into later physical time. **Continue unfinished action** resumes an existing plan; **End turn** hands control over without banking time.

Direct reachable encounters can open a brief response opportunity. A response has at most one minute within the active interval; a new attack offered as a response permits a counter-response. No distant character is notified simply because a private plan names them. Delivered words, acquired information, agreement and physical consequences remain distinct.

To win, lodge the correct killer at the case desk with three independent acquired sources covering access, means and timeline, including two firsthand inspections. A guess, forged statement or copied source is insufficient. Deadline, resignation or permanent player elimination closes unmet original goals honestly. Temporary incapacity cannot strand the other player behind a missing contribution. New commitments remain player-chosen and do not replace the original goal.

## Generation and AI

The scenario compiler prepares a validated starting configuration and coherent prior evidence for the selected environment. Without a provider connection it uses local variation. The selected optional AI connection can choose a supported recipe, interpret free wording into attempted processes, and supply bounded NPC dialogue. Invalid recipes/outages fall back to a valid same-environment scenario. The private recipe and culprit are never returned before case closure.

Checking out the source does **not activate an AI connection**. Local supported processes and scenario generation work without it. The generator currently varies this investigation; it does not generate arbitrary cities, new physics, elections or protection-game mechanics. Provider dialogue is an attributed claim and cannot manufacture physical evidence or an achieved action. Live provider quality and latency remain unverified.

## Saved games and platforms

Existing paired-contribution saves retain their original protocol. The earlier last-entry scenario also remains supported. World compression, immutable large snapshots, seat-scoped views, revision compare-and-swap, durable retry IDs, account-linked recovery and private notes remain active.

The Site remains owner-private. A seat invitation does not itself grant app access. The iOS/Android source projects bundle the same interface and device-only practice; native multiplayer opens the private browser game. Version 0.8.1, native build 11. No signed APK/IPA or physical-device playthrough is claimed. See [mobile release status](docs/MOBILE_RELEASE.md).

## Foundation and checks

The 23 vendored V1.13 engine files remain unchanged. New time control, scenarios and initial-history bridges are identified app adaptations, not a new canonical ontology. General canonical app-event attribution, institutional recognition and nonspatial Will/Imagination/Praxis remain partial. The notebooks are not retrieved live on every prompt.

Run `pnpm test`, `pnpm run typecheck`, `pnpm run mobile:sync`, `pnpm run mobile:check` and the supported Sites production build. The complete suite covers legacy saves plus timed turns, responses, partial activity, capacity/identity boundaries, all three complete cases, generation fallback, private provider inputs and concurrent retries. Browser control and real-phone QA are unavailable in this environment.

## Earlier implementation records

The following sections preserve release history; the current behavior and boundaries are documented above and in [TIMED_WORLDS.md](docs/TIMED_WORLDS.md).

## Process build 0.3 — after the first playtest

The playtest exposed the principal restriction: a text field backed by a command list cannot deliver an open simulation. This update adds general, explicit bodily-contact and material-change processes plus an optional language-to-process boundary. It does not claim unlimited interpretation is live.

Harmful contact can be attempted against a player or NPC. Existing bodily force transmission, manipulation, condition, distance and available implements constrain it. The other body resists; a human can guard or flee, and a witness who actually encounters the contact can approach and oppose it. Sustained pressure can exhaust an abstract bodily reserve, constrain speech, cause incapacity and damage integrity. Existing kernel mortality and material return remain authoritative. These added rates are dimensionless fiction/game calibration, not validated physiology or clinical timing. No fixed attack-success or kill-result branch is used. Explicit `Kill Nell` remains an attempt, with no guarantee of death.

Events have separately retained firsthand witnesses and reached reports. An absent player does not receive an omniscient attack notice. A survivor can report their own encounter when speech and a listener's hearing path become possible. Retellings keep the original root and distinguish the received account from firsthand experience. An injured NPC can refuse the attacker rather than return to the original conversation unchanged. Destroying or obscuring a surface leaves earlier acquisitions intact. The original murder history and starting goal remain unchanged.

The optional Responses API interpreter accepts free wording and emits a bounded, validated process plan rather than world edits. It receives only the requesting player's filtered perspective, with no culprit flag, private NPC history, other queued intention or other player's notes. A reviewed plan is persisted privately and bound to seat, exchange and exact prompt; the client cannot supply an arbitrary executable plan. Refusals, outages and clarification do not commit an intention or advance time. This bridge has transport/schema and persistence tests with injected fixtures. Live model quality, latency and provider access are unverified until activation.

Activation requires a hosted secret named `OPENAI_API_KEY`, supplied through the supported key setup or the environment-settings secret entry already offered to the owner. The Developers plugin is an assisted setup route, not a technical runtime dependency. No key is currently configured. `OPENAI_INTENT_MODEL` may choose a supported model; the verified default is `gpt-5.4-mini`. The API uses schema-constrained Responses output, no external tools, bounded output and `store:false`; API usage is separately billed by the provider. Production keys must be supplied through the supported secret setup, never source or chat. Without a connection, direct known processes still work and other wording receives an explicit no-turn-cost clarification. The bridge does not manufacture a physical mechanism that the simulator does not implement.

The new checks cover pending-attack privacy, survival and later testimony, absent listeners, intervening witnesses, human defense, sustained contact and mortality with body stores still available, persistent trace destruction, private interpretation context, rejected state-edit parameters, refusal handling and seat-bound reviewed-plan recovery. Browser/device QA remains unavailable in this environment.

Implementation references: [Responses structured output](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses) and the [configured model](https://developers.openai.com/api/docs/models/gpt-5.4-mini). These document the optional transport, not the simulation’s physics or an activated provider account.


## Mobile foundation 0.4

The shared interface now saves intention/notes drafts per player, retains commit retry identifiers, accepts pasted invitations, supports share sheets/copying, offers comfortable reading sizes and exports an explicitly filtered player journal. Device-local removal explains exactly what remains on the server. Safe areas, input sizes, focus trapping, Android back navigation and app-resume refresh have been added; real-device interaction is still unverified.

`ios/` and `android/` are generated native source projects with branded assets and a local web bundle, not a remote-URL production wrapper. `mobile/` boots the existing React interface with native Share, Browser, App, Keyboard, Preferences and Haptics services. Local practice uses the same simulator, helper, codec and resignation rule; writes are serialized and persist before confirmation. Its world storage is isolated from online matches. Lightweight UI data uses Preferences as a recovery copy; full worlds use IndexedDB. No online account or provider key is stored in the native project.

The eight mobile tests cover invitation origin checks, seat-scoped drafts/retry IDs, local data removal, export filtering, practice restart and duplicate commits, storage failure/retry, clarification without advancing, and refusal to create an authoritative online room. Native asset synchronization is checked separately by `pnpm run mobile:check`. These do not replace Swift/Java compilation or device tests.

See [the release plan](docs/MOBILE_RELEASE.md) for the implemented/pending distinction, reproducible build commands and primary platform references. Native online authentication, live language qualification, closed-app push, server data deletion/retention, public support/privacy information, signing and device beta tests remain release work. No store submission or paid plan has been created.


## DESTINY philosophy review 0.5.1

The source and runtime audit is in [docs/DESTINY_PHILOSOPHY_REVIEW.md](docs/DESTINY_PHILOSOPHY_REVIEW.md). Its diagnostic can be repeated with `node scripts/audit-destiny-philosophy.mjs`; the captured results are alongside the report. DESTINY's finite bodies, access, Field-conditioned route availability and truth/provenance restraints are active. Human prompts are not canonical Will projections, and many app incidents and social memories do not yet enter canonical relational feedback. Three tested complete investigations opened no Will, Imagination or Praxis episodes. The report distinguishes these gaps from working constraints.

This review fixes an access leak: unconscious characters no longer receive live surroundings or fresh positional renderings. Prior knowledge survives and sensory access can reopen after recovery. The generated adapter adds this boundary without changing the 23 upstream files. Two regression tests cover it. Native source projects are version 0.5.2, build 7; a signed app and device QA remain pending.

## Play review 0.5

The play interface now shows the contribution barrier, an actual elapsed-time recap of the last completed exchange, and an evidence board organised around access, means and timeline. Source counts deduplicate original roots. The board does not validate accusations or infer the culprit; the unchanged case predicate remains in the authoritative simulation. Firsthand/reported filters, opening/history access and a sticky mobile panel switch keep the current scene readable.

Immediate plans can contain up to six clauses within 30 simulated minutes, including follow-up pronouns with an explicit earlier target. Unsupported later clauses fail the whole interpretation rather than silently vanishing. Commands inside quoted speech and writing remain content. Review exposes all process steps and planned durations before a single commit. Actual reach, bodily capacity, finite materials and the other contribution still determine results. Subsequent movement reports compare against each task's own starting position.

Navigation scopes discard stale replies; a changed draft or exchange invalidates an outstanding review. A network deadline stops waiting without asserting that a write failed, and a retry retains its durable identifier. Notes submitted with a saved base detect concurrent edits and offer a local/saved choice. Older clients that omit the base remain supported and do not receive this new conflict protection. Invalid, locked and out-of-turn reviews fail before any language-provider call.

Saved seat capabilities are no longer evicted at twelve entries. Home shows recent stories first and can reveal the full local list; corrupt display metadata is discarded. A recovered host can generate a new open-seat invitation without advancing the world. Replacing a link revokes the previous unconsumed invitation and does not change Site audience. Local data removal invalidates pending UI replies before clearing data.

The native home defers loading the bundled practice engine until a practice save is opened or created. At this build, the main JavaScript entry is about 272 kB instead of 535 kB before splitting, with a separate 263 kB local engine chunk. These are compiled/minified byte measurements, not a phone startup-time benchmark. UI backup writes are coalesced while typing and flushed on backgrounding.

The twelve added regression tests exercise compound attempts, quoted content, physical access, repeated movements, non-oracular summaries, stale replies, network deadlines, retention of older seats, invitation recovery, concurrent notes and provider-call gating. See [the review record](docs/PLAY_REVIEW.md) and [mobile release requirements](docs/MOBILE_RELEASE.md). Live language interpretation, native multiplayer authentication, closed-app push, native compilation and real-device UI verification remain outstanding.
