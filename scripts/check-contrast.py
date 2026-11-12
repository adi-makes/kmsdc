#!/usr/bin/env python3
"""WCAG contrast gate for the design tokens in packages/ui/src/styles.css.

Every foreground/background pair the components actually use is listed below. Text pairs
must reach 4.5:1 (WCAG 1.4.3 AA); UI pairs (focus ring, borders that convey state) 3:1
(WCAG 1.4.11). Exits non-zero on any failure so CI blocks low-contrast rebrands.

Usage: python3 scripts/check-contrast.py [path/to/styles.css]
"""
import re
import sys

CSS = sys.argv[1] if len(sys.argv) > 1 else "packages/ui/src/styles.css"

# (background, foreground, minimum ratio, where it is used)
PAIRS = [
    ("neutral-0", "neutral-900", 4.5, "body text on white"),
    ("neutral-0", "neutral-600", 4.5, "muted text on white"),
    ("neutral-0", "neutral-500", 4.5, "subtle text on white"),
    ("neutral-50", "neutral-500", 4.5, "subtle text on app canvas"),
    ("neutral-50", "neutral-600", 4.5, "muted text on app canvas"),
    ("neutral-100", "neutral-600", 4.5, "muted text on muted surfaces"),
    ("brand-600", "neutral-0", 4.5, "primary button"),
    ("brand-700", "neutral-0", 4.5, "primary button hover / links"),
    ("neutral-0", "brand-700", 4.5, "links on white"),
    ("brand-50", "brand-800", 4.5, "active nav item / brand badge"),
    ("brand-100", "brand-800", 4.5, "subtle button"),
    ("brand-950", "neutral-0", 4.5, "inverse sections / footer"),
    ("whatsapp-600", "neutral-0", 4.5, "WhatsApp CTA"),
    ("whatsapp-700", "neutral-0", 4.5, "WhatsApp CTA hover"),
    ("danger-600", "neutral-0", 4.5, "danger button"),
    ("success-50", "success-700", 4.5, "success badge / alert"),
    ("warning-50", "warning-700", 4.5, "warning badge / alert / env banner"),
    ("danger-50", "danger-700", 4.5, "danger badge / alert"),
    ("info-50", "info-700", 4.5, "info badge / alert"),
    ("violet-50", "violet-700", 4.5, "accent badge"),
    ("neutral-0", "danger-700", 4.5, "field error text"),
    ("neutral-0", "brand-500", 3.0, "focus ring on white (non-text)"),
    ("neutral-50", "brand-500", 3.0, "focus ring on app canvas (non-text)"),
]


def luminance(hex_colour: str) -> float:
    channels = [int(hex_colour[i : i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def ratio(a: str, b: str) -> float:
    la, lb = sorted([luminance(a), luminance(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)


def main() -> int:
    css = open(CSS, encoding="utf-8").read()
    tokens = dict(re.findall(r"--color-([\w-]+):\s*(#[0-9a-fA-F]{6})", css))
    failures = 0
    for bg, fg, minimum, usage in PAIRS:
        if bg not in tokens or fg not in tokens:
            print(f"MISSING  {bg} / {fg}  ({usage})")
            failures += 1
            continue
        r = ratio(tokens[bg], tokens[fg])
        ok = r >= minimum
        failures += 0 if ok else 1
        print(f"{'ok  ' if ok else 'FAIL'}  {r:5.2f}:1 (min {minimum})  {fg} on {bg}  — {usage}")
    print(f"\n{len(PAIRS) - failures}/{len(PAIRS)} pairs pass")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
