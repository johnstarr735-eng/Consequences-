# Consequences — iPhone and Android release

Build 0.8.1 · 18 October 2026

Consequences now has one shared React interface, the existing authoritative multiplayer server, and generated iOS and Android projects using Capacitor 8.5.3. The native app bundles the interface and the simulator for **device-only practice**. The private online game currently opens in the system browser. Native multiplayer authentication is a release blocker.

No signed APK, Android App Bundle, IPA or TestFlight release has been produced. The phone web bundle is compiled; that is a different milestone from compiling, installing and testing the native applications.

## Implemented

| Area | Current behavior |
| --- | --- |
| Multiplayer | New matches resolve several actions within fifteen-minute control turns and permit brief direct responses. Existing paired saves keep their original protocol; perspectives remain separately filtered. Site access remains owner-private. |
| Native projects | `ios/` has an Xcode/SPM project; `android/` has a Gradle project. Both use development identity `dev.consequences.alpha`, version 0.8.1, build 11. |
| Native practice | Runs the existing simulator locally with the same helper and ending rules. Worlds are saved in IndexedDB; the adapter cannot create or submit an online multiplayer world. |
| Turn flow | World/character setup, a live virtual-time ribbon, immediate follow-up prompts, unfinished-action continuation, elapsed-time recap, intention review and a case board built only from the player’s acquired records. The board does not validate a suspect. |
| Situated orientation | Private purpose/self-account, timed directed attention, supported inspection, delivered introductions and a spatial Will adapter use the same simulator in web and local practice. The original game objective remains separate. |
| Drafts | Intentions and unfinished notes persist per seat. An intention draft belongs to one exchange. Commit retry identifiers survive a reopening. Confirmed commits clear the draft. Late replies are scoped to their originating match; new-client note writes detect conflicting saved versions. |
| Invitations | The web app accepts pasted invitations and offers sharing/copying. A one-use invitation stays in the URL fragment. Other origins and incomplete links are rejected. A recovered host can replace a lost invitation while the other seat remains open; earlier links expire. |
| Native links | Development scheme `consequences-alpha://join?room=…#invite=…` validates and opens an invitation in the private online browser game. Verified Universal Links/App Links are pending final app identifiers and domain association. |
| Reading and controls | Safe-area padding, keyboard resizing, larger touch targets, adjustable story text, reduced-motion support and Android back handling are implemented. |
| Settings | Explains current data handling and installation, exports the saved player journal, and removes this device’s data after an explicit confirmation. |
| Export privacy | The export enumerates only the requesting player’s saved perspective. It excludes keys, invitations, unsubmitted drafts, executable plans and the authoritative world. Closed-case debriefs are included only when already visible. |
| Native services | Share sheet, browser handoff, light commit haptics, app-resume refresh and Preferences backup for lightweight UI data. Full practice worlds are kept out of Preferences. |
| Branding | Compiled existing vector mark into Apple touch and iOS/Android icons; added a launch screen and the required Preferences API reason in the iOS privacy manifest. |

Practice saves on a phone and online matches are separate. Local practice is not uploaded or merged into a competitive match. Online writes are never queued for replay while disconnected. Native practice has no connected language model. Unsupported wording asks for clarification without consuming a turn.

The play review is recorded in [PLAY_REVIEW.md](PLAY_REVIEW.md). Saved seat keys are retained rather than automatically dropped at twelve entries. The native practice engine now loads on demand; its assets are still included in the package for offline use.

## Before a two-person native beta

1. **Finish native multiplayer access.** The private Site’s browser sign-in is not a supported native API credential. Provide a native-compatible authenticated API path and verify browser sign-in and return to the app. Preserve account/seat ownership, use revocable device credentials in Keychain/Keystore, and test reinstall and lost-phone recovery. Do not embed a Site bypass token or provider secret in the app, enable wildcard origins, or use Capacitor’s development `server.url` as a production wrapper.
2. **Connect and qualify language interpretation.** Add the provider secret through environment settings, then test live interpretation, refusals, slow replies, ambiguous actions and cost limits. The server must remain the authority on feasibility and outcomes. The bridge is implemented, but no live provider is connected.
3. **Deliver turn notifications while closed.** Register opt-in APNs/FCM device tokens, bind them to authenticated seats, persist deduplicated turn events after a successful world save, handle logout/token expiry, and open the correct seat on notification tap. Notifications must not reveal private prompts or discoveries. No closed-app push is currently implemented.
4. **Run on real phones.** Compile/install on an iPhone and an Android device, then test keyboard/safe areas, background and resume, a killed app, offline/reconnect, invitation cancellation, duplicate taps and large text. Complete a two-person match on separate phones and a full local-practice ending after restart.
5. **Open access to the chosen testers.** A game invitation is not permission to enter the owner-private Site. Decide the tester audience and grant access through the supported sharing flow. Sharing has not been changed by this build.

## Before store submission

| Requirement | Work remaining |
| --- | --- |
| Publisher identity | Apple Developer and Google Play Console accounts under the owner’s chosen identity; final bundle/package identifiers, signing certificates/keys and a controlled release process. The current identifier is for development. |
| Data controls | An actual app-account/data deletion flow and retention rules for shared worlds, account links and old save chunks. “Forget this device” removes local data only; it does not delete server data or a ChatGPT account. |
| Privacy and support | Public privacy policy, support/contact URL, accurate store privacy/Data Safety answers and provider disclosure based on the final data flows. The current in-app explanation is not a complete store privacy policy. Recheck the privacy manifest after adding native SDKs. |
| Player conduct | Working report/block handling and a support process for player-supplied text before opening to general users. Preserve fictional attempts and consequence simulation while handling harassment and prohibited content. The current case is a private alpha. |
| Content and ratings | Complete the stores’ content questionnaires for the actual murder/violence and user-text features. No official age rating has been assigned. |
| Review package | Screenshots from the actual devices, store descriptions, review access/demo mode, final encryption/export declarations and live backend availability. |
| Release validation | Signed builds in TestFlight and Play internal/closed testing, crash/reconnect checks and reviewed rollout. Additional Google testing requirements can depend on the publisher’s account type and creation date. |

Apple requires in-app account-deletion initiation when an app supports account creation. Google likewise specifies in-app and external account-deletion access for apps in scope. Apple’s review guidelines also cover user content, minimum functionality and reviewer access. These requirements must be checked against the final app, not inferred as already satisfied by its local-data button.

After the first two-person beta, use the playthrough results to tune pacing and social consequences. Then add the protection and power/election cases discussed earlier. Store billing and a business model can follow demonstrated play value; no purchases or paid plan are implemented.

## Build and verify

From the repository root, with its locked dependencies installed:

```sh
pnpm test
pnpm run typecheck
pnpm run mobile:build
pnpm exec cap sync
pnpm run mobile:check
```

The last command checks asset synchronization and packaging boundaries. It does not compile Swift/Java or verify a phone installation. Regenerate branded raster assets only when their source mark changes:

```sh
pnpm run mobile:assets
```

For Android, install a JDK 21 and Android SDK 36 with suitable build tools, synchronize the project, then open it with `pnpm run mobile:android` or run `./gradlew assembleDebug` from `android/`. Use the resulting debug APK only for development. Store distribution needs a signed release bundle and the owner’s signing arrangement.

For iOS, use macOS with Xcode 26 or later, synchronize, then run `pnpm run mobile:ios` to open the SPM project. Select the owner’s signing team and a device/simulator. The app’s selected deployment target is iOS 16.4. Package-manager dependency minimums can be lower. No owner signing identity is configured.

This build environment has a Java 17 runtime, no Android SDK/JDK 21 and no macOS/Xcode. Native compilation and device verification are therefore still outstanding. The supported browser-control capability is also unavailable, so UI interaction and installation have not been verified here.

## Primary references

- [Capacitor installation and native project sync](https://capacitorjs.com/docs/getting-started)
- [Capacitor build environment requirements](https://capacitorjs.com/docs/getting-started/environment-setup)
- [Capacitor configuration: bundled assets and development-only server URL](https://capacitorjs.com/docs/config)
- [Preferences storage and Apple required-reason API](https://capacitorjs.com/docs/apis/preferences)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple account deletion](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion)
- [Google Play account deletion](https://support.google.com/googleplay/android-developer/answer/13327111)
- [Google Play testing requirements for new personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465)
