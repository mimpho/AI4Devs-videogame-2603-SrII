#!/usr/bin/env python3
"""
One-off generator for the six MVP SFX clips.
Creates short 16-bit PCM mono WAVs at 44.1 kHz under contra-AC/resources/audio/.
Run from repo root or this directory:  python3 contra-AC/resources/audio/_generate.py
"""
import math
import os
import struct
import wave

SR = 44100  # sample rate

OUT_DIR = os.path.dirname(os.path.abspath(__file__))


def write_wav(name, samples):
    path = os.path.join(OUT_DIR, name)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        # Clamp and convert float -> int16
        frames = b"".join(
            struct.pack("<h", max(-32768, min(32767, int(s * 32767))))
            for s in samples
        )
        w.writeframes(frames)
    print(f"{name}: {len(samples)/SR*1000:.0f} ms, {os.path.getsize(path)} bytes")


def envelope(n, attack=0.005, release=0.05):
    """Return a list of n samples ramped up then exponentially down."""
    a = max(1, int(attack * SR))
    r = max(1, int(release * SR))
    env = [0.0] * n
    for i in range(min(a, n)):
        env[i] = i / a
    sustain_end = n - r
    for i in range(a, sustain_end):
        env[i] = 1.0
    for i in range(max(sustain_end, 0), n):
        t = (i - sustain_end) / r
        env[i] = math.exp(-3 * t)
    return env


def square(freq, t):
    return 1.0 if math.sin(2 * math.pi * freq * t) >= 0 else -1.0


def saw(freq, t):
    phase = (freq * t) % 1.0
    return 2 * phase - 1


def sine(freq, t):
    return math.sin(2 * math.pi * freq * t)


def shoot():
    """Short high zap with downward sweep."""
    dur = 0.06
    n = int(dur * SR)
    env = envelope(n, attack=0.001, release=0.04)
    out = []
    for i in range(n):
        t = i / SR
        # Sweep 1500 -> 400 Hz
        f = 1500 - (1500 - 400) * (i / n)
        out.append(0.18 * square(f, t) * env[i])
    return out


def enemy_hit():
    """Short woody thud."""
    dur = 0.08
    n = int(dur * SR)
    env = envelope(n, attack=0.001, release=0.06)
    out = []
    for i in range(n):
        t = i / SR
        f = 220 - 100 * (i / n)
        # Mix of square and a bit of noise via phase modulation
        s = 0.6 * square(f, t) + 0.3 * saw(f * 1.5, t)
        out.append(0.22 * s * env[i])
    return out


def enemy_death():
    """Descending sweep, slightly longer."""
    dur = 0.25
    n = int(dur * SR)
    env = envelope(n, attack=0.005, release=0.18)
    out = []
    for i in range(n):
        t = i / SR
        f = 600 - 500 * (i / n)
        out.append(0.22 * (0.5 * square(f, t) + 0.5 * saw(f, t)) * env[i])
    return out


def player_hit():
    """Mid-low buzzy hit."""
    dur = 0.14
    n = int(dur * SR)
    env = envelope(n, attack=0.001, release=0.1)
    out = []
    for i in range(n):
        t = i / SR
        f = 320 - 180 * (i / n)
        out.append(0.26 * saw(f, t) * env[i])
    return out


def player_death():
    """Long descending sweep, sad."""
    dur = 0.6
    n = int(dur * SR)
    env = envelope(n, attack=0.01, release=0.45)
    out = []
    for i in range(n):
        t = i / SR
        f = 300 * math.exp(-1.6 * (i / n))  # 300 Hz down to ~60 Hz
        s = 0.7 * saw(f, t) + 0.3 * sine(f * 2, t)
        out.append(0.24 * s * env[i])
    return out


def victory():
    """Two-note rising triangle chord."""
    dur = 0.55
    n = int(dur * SR)
    env = envelope(n, attack=0.005, release=0.4)
    out = []
    note1_end = int(0.18 * SR)
    note2_end = int(0.36 * SR)
    for i in range(n):
        t = i / SR
        if i < note1_end:
            f = 660
        elif i < note2_end:
            f = 880
        else:
            f = 1320  # high resolve
        # Triangle = abs(saw)*2 - 1 isn't quite triangle; use math
        phase = (f * t) % 1.0
        tri = 4 * abs(phase - 0.5) - 1
        out.append(0.22 * tri * env[i])
    return out


CLIPS = {
    "shoot.wav": shoot,
    "enemy_hit.wav": enemy_hit,
    "enemy_death.wav": enemy_death,
    "player_hit.wav": player_hit,
    "player_death.wav": player_death,
    "victory.wav": victory,
}


if __name__ == "__main__":
    for name, fn in CLIPS.items():
        write_wav(name, fn())
