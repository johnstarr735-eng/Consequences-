# Consequences — existing interpreter, selectable AI provider

Prepared GitHub integration · 18 October 2026 · existing app foundation 0.8.1

## What this branch supplies

The GitHub repository previously contained a complete 0.8.0 ZIP, configuration/document files and two unpacked interpreter modules. The app, engine, runtime adapters and tests now exist as ordinary source files in their original directories. The restored foundation is the already reviewed 0.8.1 source, commit `22f37dac3646a41f830ed8f418fff55bc44838cf`. The older ZIP is retained as a backup, rather than becoming the working source.

The existing `createIntentInterpreter` entry point now selects a provider. `lib/ai-provider.mjs` supplies the shared transport for interpretation, the existing bounded scenario recipe and optional NPC wording. `lib/language-providers.mjs` reads backend-owned configuration and passes the three functions to the existing `Rooms` service.

This incorporates the previously prepared local Ollama adapter's connection approach while fixing its rejection of legitimate clarification-only responses. Instructions, schema, player-specific context, `compilePlan`, reviewed-intention persistence and the current DESTINY-backed resolver remain the existing path. `lib/case-plans.mjs` and all 23 canonical V1.13 files are unchanged.

## Select the provider on the backend

| Configuration | Behavior |
| --- | --- |
| `AI_PROVIDER=ollama` | All three AI operations use the local Ollama API. Requires `OLLAMA_MODEL`; `OLLAMA_BASE_URL` defaults to `http://127.0.0.1:11434`. An existing OpenAI key is ignored by this selection. |
| `AI_PROVIDER=disabled` | No provider requests. Existing local interpretation, scenario preparation and replies remain available. |
| `AI_PROVIDER=openai` | Uses the existing OpenAI Responses API adapter when `OPENAI_API_KEY` is configured. `OPENAI_INTENT_MODEL` retains its existing default. This is an optional paid-provider path, not the free setup. |
| No `AI_PROVIDER` | Backward compatibility: an existing OpenAI key keeps the old provider; without one, AI is disabled. Set `ollama` or `disabled` explicitly for an unambiguous free configuration. |

There is no automatic paid fallback. Provider/model selection is server-owned; a player request cannot choose an endpoint, supply a plan or transmit someone else's private state.

For a strictly local, free setup, disable cloud features in the Ollama service itself with `OLLAMA_NO_CLOUD=1` and restart Ollama. Setting it only in the game's environment does not reconfigure a separately running Ollama process. The app also rejects recognized cloud-model tags, but the service's local-only setting is the protection against a custom model alias routing elsewhere. No Ollama subscription or cloud credits are required for downloaded local models.

For local Worker development, copy `.dev.vars.example` to `.dev.vars` and replace `OLLAMA_MODEL` with an exact name returned by `ollama list`. The template contains no key. `.dev.vars` and its environment variants are ignored by Git.

```dotenv
AI_PROVIDER=ollama
OLLAMA_MODEL=YOUR_INSTALLED_MODEL_NAME
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

On Windows, the existing installation can be checked in PowerShell:

```powershell
ollama list
Invoke-RestMethod http://127.0.0.1:11434/api/tags
```

Install project dependencies with the pinned pnpm version and the checked-in lockfile, then use the existing local backend/D1 development setup. A configured model and a reachable server are required before live AI can be qualified. Neither a model download nor a connection to the user's PC has been performed here.

## Local service versus published multiplayer

The loopback address refers to the machine running the backend. This adapter accepts loopback HTTP addresses only, rejects embedded credentials and rejects redirects. It does not expose the local AI to other hosts or create a tunnel.

A Cloudflare Worker deployed elsewhere cannot reach a user's Windows installation at `127.0.0.1`. A public two-player deployment still needs an explicitly designed, authenticated connection to the inference host, or a provider reachable from that host. A model running on the PC also needs the PC to remain available. No such public bridge is installed or claimed by this branch.

Provider requests have a 25-second deadline, below the client's existing 45-second response deadline. A slower or cold model can time out. Test the actual installed model before choosing its size or claiming acceptable play speed. No graphics hardware or performance is assumed.

## Preserve one simulation

The language adapter proposes attempts. The unchanged compiler resolves encountered references, checks supported processes and compiles their durations and tasks. Existing review IDs remain private and bound to seat, prompt and exchange. Only the existing commit/resolution path changes the saved world.

Changing the configured model/provider changes future AI calls; it does not regenerate established scenario facts, original goals, injuries, acquired evidence or commitments. Already reviewed plans remain compiled and can be committed after a provider change without asking a new model to reinterpret them. Model choice is not yet pinned individually per match. For consistent voice and behavior, change configuration between matches when possible.

Failure behavior follows the existing app: an unsuccessful free-form review commits no intention or virtual time; scenario generation can fall back to a validated local recipe; failed optional NPC wording leaves the existing situated reply available. An AI configuration error does not prevent reading a save or performing a supported local action.

The scenario generator still varies the existing prepared inquiry profiles. This branch does not implement the intended general historical/fantasy/present world specification or invent new physical/social mechanisms. The limits and philosophical source distinctions in [FOUNDATION.md](FOUNDATION.md) remain authoritative. The notebooks are not queried live on every prompt.

## Verification and outstanding work

All 166 automated tests pass. Type checking, the web and mobile production builds, native asset synchronization and the mobile credential/packaging guard pass. All 23 canonical source hashes match; the existing plan compiler is unchanged.

Contract and persistence fixtures use injected provider responses. They cover explicit disabling, selected-provider isolation, all three local AI operations, clarification-only output, rejected state-edit fields, failed/invalid responses, loopback-only addresses, rejected cloud tags, usable saves during configuration failure and a reviewed plan committed after a provider switch. The existing gameplay/save tests remain relevant.

Live model quality, exact JSON behavior across different local models, CPU/GPU latency, Windows interaction and the remote inference bridge remain unverified. No paid service is activated. This prepared GitHub branch does not update the private published Site automatically.

Primary implementation references:

- https://docs.ollama.com/api/chat
- https://docs.ollama.com/capabilities/structured-outputs
- https://docs.ollama.com/faq
- https://developers.cloudflare.com/workers/local-development/environment-variables/
