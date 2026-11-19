# Voice casting

Casting is the second biggest lever after the script, and it is free to get right.

## Always list first

Call `elevenlabs:voices`. It costs nothing. It returns names, labels and preview links. Never guess a `voice_id` from memory — an invented id fails the render and wastes the user's time.

## The pair test

Play the two candidates back to back and ask: could I tell these apart with my eyes closed, at 1.5× speed, in a car?

If the answer is no, they are the wrong pair. In practice:

| Keep apart | Why |
| --- | --- |
| Register (pitch range) | The strongest cue. One higher, one lower, always. |
| Energy | One warmer and more reactive, one steadier and drier. |
| Tempo | One slightly quicker. Two identical tempos blur together. |
| Accent | Optional. Different accents are memorable but can signal "two unrelated shows" if mismatched. |

Avoid: two voices from the same family (same gender, same pitch, same energy). This is the single most common casting failure and it makes a good script unlistenable.

## Defaults that work

- **Host A** (curious): a warmer, mid-to-high register voice.
- **Host B** (expert): a lower, calmer voice with slower delivery.

Give the user the two names and preview links, and offer one swap. Do not offer a full re-cast — it invites endless browsing.

## Language

Cast voices that are native to the episode's language. A voice that reads English well may mangle a Portuguese proper noun. If the episode is bilingual, pick the dominant language and warn the user that names in the other language may be pronounced oddly.

## Consistency

The same speaker must keep the same `voice_id` for every turn in the episode, including across parts when you split a long render. Changing a voice mid-episode reads as a mistake, not a choice.

## If the user has a preference

Take it. If they name a voice, use it, and pair it with something clearly distinct. If they want a cloned or designed voice, that is not available here — say so and point them at ElevenLabs directly rather than faking it.

## If a render fails on a voice

Re-list voices, pick a replacement in the same register, tell the user which voice changed and why. Do not silently substitute.
