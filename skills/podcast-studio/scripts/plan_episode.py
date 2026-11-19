#!/usr/bin/env python3
"""Validate and cost a two-host podcast script before rendering.

Usage:
    python3 plan_episode.py script.json
    python3 plan_episode.py script.json --parts 2
    python3 plan_episode.py script.json --price-per-1k 0.052

Reads one JSON file shaped like:
    {"title": "...", "turns": [{"speaker": "Host A", "text": "..."}, ...]}

Exit code 0 when the script is renderable, 1 when it has violations.
Only stdlib. No network. Reads nothing but the file given on the command line.
"""

import json
import re
import sys

PRICE_PER_1K = 0.052
CHARS_PER_MINUTE = 900
MAX_CHARS_PER_RENDER = 10000  # advisory only; the tool's real limit comes from find_tools

AUDIO_TAGS = {
    "laughs", "laughing", "giggling", "giggles", "chuckles", "sighs",
    "whispering", "whispers", "excited", "curious", "sarcastic", "sad",
    "crying", "clears throat", "pause", "breathless", "shouting", "softly",
}

EMOJI_RANGES = (
    (0x1F300, 0x1FAFF),
    (0x1F000, 0x1F2FF),
    (0x2600, 0x27BF),
    (0xFE00, 0xFE0F),
    (0x1F1E6, 0x1F1FF),
)


def is_emoji(ch):
    code = ord(ch)
    return any(lo <= code <= hi for lo, hi in EMOJI_RANGES)


def slugify(text, limit=60):
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return (slug[:limit].rstrip("-")) or "episode"


def load(path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def validate(script):
    errors = []
    warnings = []

    if not isinstance(script, dict):
        return ["top level must be a JSON object"], [], []

    title = script.get("title")
    if not isinstance(title, str) or not title.strip():
        errors.append("title is missing or empty")
        title = ""

    turns = script.get("turns")
    if not isinstance(turns, list) or not turns:
        errors.append("turns must be a non-empty array")
        return errors, warnings, []

    speakers = []
    clean = []
    for index, turn in enumerate(turns, start=1):
        where = "turn %d" % index
        if not isinstance(turn, dict):
            errors.append("%s is not an object" % where)
            continue

        speaker = turn.get("speaker")
        if speaker not in ("Host A", "Host B"):
            errors.append("%s has speaker %r; use exactly 'Host A' or 'Host B'" % (where, speaker))
        else:
            speakers.append(speaker)

        text = turn.get("text")
        if not isinstance(text, str) or not text.strip():
            errors.append("%s has empty text" % where)
            continue

        if re.search(r"https?://\S+", text):
            errors.append("%s contains a URL; it would be read aloud" % where)
        if re.search(r"!?\[[^\]]*\]\([^)]*\)", text):
            errors.append("%s contains a markdown link" % where)
        if re.search(r"[*_#`]{1,3}\w", text) or re.search(r"\w[*_`]{1,3}", text):
            warnings.append("%s contains markdown emphasis; it may be spoken" % where)
        if re.match(r"^\s*(Host A|Host B|Speaker|A|B)\s*:", text):
            errors.append("%s starts with a speaker label; strip it" % where)
        if any(is_emoji(ch) for ch in text):
            errors.append("%s contains emoji; it would be read or dropped oddly" % where)
        if re.search(r"\([^)]{0,40}(music|laughter|applause|sfx|sound effect)", text, re.I):
            errors.append("%s contains a stage direction in parentheses" % where)

        for tag in re.findall(r"\[([^\]]{0,40})\]", text):
            if tag.strip().lower() not in AUDIO_TAGS:
                errors.append("%s uses unknown audio tag [%s]; use only documented tags or plain text"
                              % (where, tag))

        clean.append({"speaker": speaker, "text": text.strip()})

    for index in range(1, len(speakers)):
        if speakers[index] == speakers[index - 1]:
            warnings.append("turns %d and %d are the same speaker; merge or reorder for real turn-taking"
                            % (index, index + 1))

    used = sorted(set(speakers))
    if len(used) < 2:
        errors.append("script uses %d speaker(s); a two-host episode needs both Host A and Host B"
                      % len(used))

    return errors, warnings, clean


def report(title, turns):
    chars = sum(len(turn["text"]) for turn in turns)
    minutes = chars / CHARS_PER_MINUTE
    cost = chars / 1000.0 * PRICE_PER_1K
    speakers = {}
    for turn in turns:
        speakers[turn["speaker"]] = speakers.get(turn["speaker"], 0) + len(turn["text"])

    print("title        %s" % (title or "(none)"))
    print("slug         %s.mp3" % slugify(title or "episode"))
    print("turns        %d" % len(turns))
    print("characters   %d" % chars)
    print("duration     %.1f min" % minutes)
    print("cost         $%.2f at $%.3f per 1,000 characters" % (cost, PRICE_PER_1K))
    for speaker, count in sorted(speakers.items()):
        share = 100.0 * count / chars if chars else 0
        print("  %-9s  %6d chars  %4.1f%%" % (speaker, count, share))
    if chars > MAX_CHARS_PER_RENDER:
        parts = (chars + MAX_CHARS_PER_RENDER - 1) // MAX_CHARS_PER_RENDER
        print("note         long script; consider rendering in %d parts if the tool rejects the size"
              % parts)
    return chars, cost


def split_parts(turns, parts):
    if parts < 2 or len(turns) < parts:
        return [turns]
    total = sum(len(turn["text"]) for turn in turns)
    target = total / float(parts)
    buckets = []
    current = []
    running = 0
    remaining_parts = parts
    for turn in turns:
        current.append(turn)
        running += len(turn["text"])
        remaining_turns = len(turns) - (sum(len(b) for b in buckets) + len(current))
        if (running >= target and remaining_parts > 1
                and remaining_turns >= remaining_parts - 1):
            buckets.append(current)
            current = []
            running = 0
            remaining_parts -= 1
    if current:
        buckets.append(current)
    return buckets


def main(argv):
    global PRICE_PER_1K
    args = list(argv[1:])
    if not args:
        print(__doc__)
        return 2

    parts = 1
    if "--parts" in args:
        index = args.index("--parts")
        try:
            parts = int(args[index + 1])
        except (IndexError, ValueError):
            print("--parts needs an integer")
            return 2
        del args[index:index + 2]

    if "--price-per-1k" in args:
        index = args.index("--price-per-1k")
        try:
            PRICE_PER_1K = float(args[index + 1])
        except (IndexError, ValueError):
            print("--price-per-1k needs a number")
            return 2
        del args[index:index + 2]

    path = args[0]
    try:
        script = load(path)
    except FileNotFoundError:
        print("no such file: %s" % path)
        return 2
    except json.JSONDecodeError as error:
        print("invalid JSON in %s: %s" % (path, error))
        return 2

    errors, warnings, turns = validate(script)
    title = script.get("title") if isinstance(script, dict) else ""

    if errors:
        print("BLOCKED — fix these before rendering:\n")
        for error in errors:
            print("  - %s" % error)
        print("\n%d problem(s). Nothing was rendered, nothing was charged." % len(errors))
        return 1

    print("READY\n")
    report(title, turns)

    if warnings:
        print("\nwarnings:")
        for warning in warnings:
            print("  - %s" % warning)

    if parts > 1:
        buckets = split_parts(turns, parts)
        print("\nparts (%d):" % len(buckets))
        for number, bucket in enumerate(buckets, start=1):
            chars = sum(len(turn["text"]) for turn in bucket)
            print("  part %d  %3d turns  %5d chars  $%.2f  %s.mp3"
                  % (number, len(bucket), chars, chars / 1000.0 * PRICE_PER_1K,
                     slugify(title or "episode") + "-part-%d" % number))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
