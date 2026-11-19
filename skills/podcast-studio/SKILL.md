---
name: Two-Host Podcast Studio
description: Turns a topic, article, notes or transcript into a finished two-host podcast episode — a spoken script with real turn-taking, one continuous MP3 voiced with two contrasting ElevenLabs voices, plus chapter list, show notes and title options.
summary: Topic or source text in, publish-ready two-host episode out: script, one MP3 with two distinct voices, chapters, show notes and three titles. No API keys; voice runs on the Agensi balance.
version: 1.0.0
tags:
  - podcast
  - audio
  - text-to-speech
  - content-repurposing
  - voice
keywords:
  - podcast generator
  - two host podcast
  - audio from article
  - ai podcast
  - text to dialogue
use_cases:
  - Turn a blog post or newsletter into a podcast episode
  - Make an episode from a topic with no source material
  - Repurpose a meeting transcript or interview into a listenable recap
  - Produce a two-voice dialogue for a course or product demo
---

# Two-Host Podcast Studio

## What you deliver

Four things, in this order:

1. `<slug>.mp3` — one continuous episode, two distinct voices.
2. `<slug>.script.json` — the exact script you rendered.
3. Chapters and show notes — plain text the user can paste into a host.
4. Three title options.

Never hand over the script as the deliverable. The episode is the deliverable.

## Before you start

You need two Agensi tools. Both are listed under "Requires" on the listing:

| Tool | Price | Why |
| --- | --- | --- |
| `elevenlabs:voices` | free | List the voices you may cast |
| `elevenlabs:v1.text-to-dialogue` | $0.052 per 1,000 characters | One MP3, up to 10 voices, emotional tags |

Ask the user for, or infer and state, exactly four things before writing anything:

- **Source.** Pasted text, a URL or file to read, or "no source, just this topic".
- **Length.** Default 5 minutes. Accept "short" (3) or "long" (10).
- **Language.** Default: the source's language. Never translate unless asked.
- **Tone.** Default: two colleagues who know the subject, one curious, one expert.

Say the estimated cost out loud before you render. Do not render first and report after.

## Step 1 — Ingest

If the user gave a URL or file, read it with your own fetch or read tool. Then strip what cannot be spoken:

- navigation, cookie banners, related-article rails, comment threads
- image captions that only make sense visually
- tables, code blocks, bullet lists — rewrite as prose or drop
- anything after a paywall cut-off

Keep the facts, the numbers, the quotes, and the argument's spine. If the source is under about 400 words, say so: it will make a thin episode unless the hosts add context from the topic itself.

## Step 2 — Write the script

Output a JSON object, nothing else:

```json
{
  "title": "One sentence, specific, no clickbait",
  "turns": [
    { "speaker": "Host A", "text": "First line." },
    { "speaker": "Host B", "text": "Response." }
  ]
}
```

Exactly two speakers, `Host A` and `Host B`. Alternating. Short turns — one to three sentences each.

Length maths, so the episode matches what was asked:

| Target | Words | Characters (≈) | Cost at $0.052/1k |
| --- | --- | --- | --- |
| 3 min | 450 | 2,700 | $0.14 |
| 5 min | 750 | 4,500 | $0.23 |
| 10 min | 1,500 | 9,000 | $0.47 |

150 words per minute, 6 characters per word. Count characters across all `text` fields only — that is what you are billed on.

Read `references/dialogue-rules.md` before writing. It is the difference between a script that sounds like two people talking and one that sounds like an article being read by two voices.

## Step 3 — Validate before you spend money

Write the script to a file in your working directory, for example `episode.script.json`. Then save the shipped `plan_episode.py` unchanged to a temp file and run it against that file:

```bash
python3 /tmp/plan_episode.py episode.script.json
```

The validator reads only the file you pass it, so it works from a temp location. It prints character count, estimated duration, estimated cost, per-host balance, and every rule violation it finds. Fix what it reports, then run it again. Add `--parts 2` to split a long script into balanced parts at turn boundaries.

If `python3` is unavailable, do the same checks yourself: characters = sum of `len(text)`, minutes = characters ÷ 900, cost = characters ÷ 1000 × 0.052. Never skip the checks — a broken script costs real money to discover.

## Step 4 — Cast two voices

Call `elevenlabs:voices`. It is free. Then pick a pair that a listener can tell apart with their eyes closed:

- different register (one higher, one lower) — this matters more than accent
- different energy (one warm and curious, one measured and authoritative)
- both native to the episode's language
- avoid two voices that share a similar timbre; listeners lose track of who is speaking

Show the user the two names and their preview links, and let them swap one before rendering. Details and a fallback strategy: `references/voice-casting.md`.

Never invent a `voice_id`. Only use ids returned by `elevenlabs:voices`.

## Step 5 — Quote, then render

1. Call `quote_tool` for `elevenlabs:v1.text-to-dialogue` with the character count. Nothing is charged.
2. Tell the user the exact price. If it is above their stated budget, offer to cut the length instead of silently shrinking it.
3. Call `run_tool`. Get the exact parameter names from `find_tools` for `elevenlabs:v1.text-to-dialogue` first — do not guess a schema. The dialogue tool takes ordered `{text, voice_id}` pairs, one per turn:

```json
[
  { "text": "First line.", "voice_id": "<Host A id>" },
  { "text": "Response.", "voice_id": "<Host B id>" }
]
```

Pass turns in order, each as its own pair. Keep the same `voice_id` for every turn by the same speaker. Never merge turns into one string — that destroys the turn-taking. Never invent a `voice_id`.

`run_tool` returns an `audio` object with `download_link`, `content_type` and the billed `character_count`. Check the billed count against your own estimate; if it is materially higher, say so.

If the call returns a job instead of a file, call `check_job` until it is ready. A failed use is free: retry once with the same payload, then report the error.

If the call is rejected for length, split the episode into parts of roughly equal length, cutting at turn boundaries so a speaker's thought is never split, and tell the user the parts are one episode. Check `find_tools` for the tool's documented input limit instead of assuming one.

## Step 6 — Deliver

- **File.** Name it after the title, slugified: `why-the-sky-is-blue.mp3`. The link lasts 7 days — say so, and tell the user the file also sits in their Agensi dashboard for 30 days.
- **Chapters.** Group turns into 4–8 sections and title each by what is discussed. Without timings these are content chapters, not timestamps; say that plainly. If the user wants real timestamps, `elevenlabs:v1.forced-alignment` returns word timings for $0.0048 per minute — quote it before running.
- **Show notes.** Use `templates/show-notes.md`. Two sentences of summary, the chapters, and every source the episode relies on.
- **Titles.** Three options, different angles: one question, one benefit, one provocation. No numbers you cannot support.

## Failure handling

- **Voice rejected or missing.** Re-cast from `elevenlabs:voices` and tell the user which voice changed.
- **Quote higher than expected.** Your character count was wrong. Re-count from the validated script, not from the draft.
- **Render succeeded but audio is silent or truncated.** Re-run once; if it repeats, cut the script in half and render in parts.
- **User wants music.** That is a separate tool with a separate price. Quote it; never assume it is included.

## Do not

- Invent facts, figures, quotes or names that are not in the source. This is the fastest way to make an episode useless.
- Add music, sound effects or intro stings unless the user asked and approved the extra cost.
- Put stage directions, speaker labels, markdown, emoji or URLs inside a `text` field. They get read aloud.
- Upload, host or publish the audio anywhere. Hand over the link.
- Claim timestamps you do not have.
