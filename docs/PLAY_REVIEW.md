# Consequences — play and reliability review

Build 0.5 · 17 October 2026

The review focused on whether a player can understand the current moment, form an intention freely, assess the result and return without losing their place. It used source inspection, simulation fixtures, regression tests, type checks and compiled web/native asset checks. It did not include a browser walkthrough or a phone installation.

## Findings and changes

| Finding | Improvement |
| --- | --- |
| Waiting had little useful feedback. | A contribution ribbon identifies whose input is pending and offers the notebook while the world waits. It never reveals another player’s prompt. |
| Consequences were buried in a long journal. | The latest completed exchange has a compact recap using actual elapsed simulation time, the player’s own intention and counts of received events. Opening/history remains accessible. |
| Evidence collection did not make the disclosed winning standard easy to understand. | A case board organises acquired sources around access, means and timeline, with firsthand counts and an explicit warning that coverage does not establish truth or guilt. A prepared accusation only fills the composer. |
| Short combined intentions were rejected by a command-style restriction. | Up to six immediate clauses can be reviewed in one contribution within the same 30-minute bound used by interpreted plans. Each task still needs actual capacity and access. |
| A later unsupported clause could be hidden inside a target phrase. | Explicit plan separators are parsed before individual processes. An unsupported later step causes clarification, without committing a partial plan. Quoted commands stay spoken/written content. |
| Later movement reports used the exchange’s initial position. | Each movement task now records and compares its own starting position, avoiding false progress reports after an earlier movement. |
| A slow reply could apply to a different match or changed intention. | Navigation generations gate replies. Reviews also check the originating perspective, exchange and live draft. Leaving invalidates pending UI updates. An already-sent server action may still complete; leaving does not undo it. |
| A stalled network request could leave the interface waiting indefinitely. | A response deadline releases the UI with an honest “not confirmed” message. The original commit identifier remains available for a safe retry. |
| Two devices could silently overwrite the same note. | New clients send the saved base text. Conflicting writes return a conflict and preserve the local draft; the interface offers saved/draft choices. Older clients without a base remain compatible and lack this protection. |
| Only four local matches were visible and older player keys were evicted at twelve entries. | Recent stories appear before the introduction, the entire local list is available, and creating a new save no longer discards older seat capabilities. Display metadata is sanitised. |
| A recovered host could have no raw invitation to share. | The host can create/replace the invitation for an open second seat. This revokes the earlier unconsumed link and changes neither world time nor Site audience. |
| Native startup loaded the full simulator before it was needed. | The bundled engine loads when opening or creating practice. The minified main entry fell from about 535 kB to 272 kB, with a separate 263 kB local-engine chunk. No device timing claim is made. |
| Every keystroke queued a native Preferences write. | UI backups are coalesced while typing and flushed when backgrounding. Full practice worlds remain in IndexedDB and are confirmed only after persistence. |

## Boundaries preserved

The original simulator dependency closure remains unchanged. New process plans describe attempts and cannot author another person’s decision, manufacture material, supply unearned evidence or change the fixed starting goal. Different tasks retain their own physical durations; the contribution barrier is not a universal physical turn.

The board and recap consume only the existing filtered player view. There is no client-side proof solver, live hidden-person tracker, automatic culprit suggestion or assumption that a reported claim is true. The authoritative case predicate and original-history disclosure remain server responsibilities.

Native practice remains separate from online matches. The Site remains owner-private. No live provider key, native multiplayer credential, push service or signing identity has been added. Free-form interpretation beyond the bounded grammar still depends on connecting and qualifying the optional language provider.

## Verification

The 82-test suite passes, including the new plan, movement, privacy, conflict, recovery and request-lifetime cases. TypeScript and the bundled mobile client compile. The source includes iOS and Android projects; native Swift/Java compilation and interactive browser/phone QA remain unverified in this environment. Use the [mobile release plan](MOBILE_RELEASE.md) for those release gates and build commands.

The next playtest should use two separate people and devices. Check whether each understands when the world advances, can phrase a short plan without referring to a command list, recognises the difference between firsthand findings and reports, and can resume after closing the app. Assess pacing and meaningful social consequences after that interaction test.
