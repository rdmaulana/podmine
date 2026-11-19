# Agensi skills

Skills sold or listed on [Agensi](https://www.agensi.io). Each folder is one listing; `build.sh` packs it into a ZIP whose root is `SKILL.md`.

```bash
./skills/build.sh                 # build every skill
./skills/build.sh podcast-studio  # build one
```

Agensi constraints that shape these packages:

- Text only. Executables fail the security scan; `node_modules` and venvs are not allowed.
- Each script runs from a temp file and **cannot read other files in the package**, so data a script needs must live inside the script.
- Keep a script under 20 KB so it stays reviewable.
- SKILL.md at the ZIP root; two or more SKILL.md files make it a skill pack instead of a skill.
- Voice/image/video tools are called through Agensi (`find_tools`, `quote_tool`, `run_tool`), max 10 tools per skill, paid from the buyer's balance — never the creator's.

## Listings

| Skill | What it does | Tools |
| --- | --- | --- |
| `podcast-studio` | Topic or article → two-host episode: script, one MP3 with two ElevenLabs voices, chapters, show notes, titles | `elevenlabs:voices`, `elevenlabs:v1.text-to-dialogue` |
