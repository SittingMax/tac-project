#!/usr/bin/env bash
set -euo pipefail

echo "======================================"
echo "TAC THEME AUDIT — Vite + Tailwind v4"
echo "======================================"
echo

# 0) Basic environment
echo "[0] Environment"
node -v || true
npm -v || true
echo

# 1) Verify Tailwind v4 import style
echo "[1] Checking Tailwind v4 import"
if grep -RIn --include="*.css" '@import "tailwindcss";' src styles . 2>/dev/null | head -n 5; then
  echo "✅ Found @import \"tailwindcss\";"
else
  echo "❌ Not found: @import \"tailwindcss\";"
  echo "   Fix: global CSS must include: @import \"tailwindcss\";"
  exit 1
fi
echo

# 2) Locate theme token definitions
echo "[2] Checking token definitions (:root/.dark)"
ROOT_COUNT=$(grep -RIn --include="*.css" ":root" src styles . 2>/dev/null | wc -l | tr -d ' ')
DARK_COUNT=$(grep -RIn --include="*.css" "\.dark" src styles . 2>/dev/null | wc -l | tr -d ' ')
echo "Found :root occurrences: $ROOT_COUNT"
echo "Found .dark occurrences:  $DARK_COUNT"
echo

echo "Top hits:"
grep -RIn --include="*.css" -E "(:root|\.dark)" src styles . 2>/dev/null | head -n 20 || true
echo

# 3) Detect duplicate theme sources (very common bug)
echo "[3] Detecting duplicate theme variable definitions"
DUP_BG=$(grep -RIn --include="*.css" -- "--background:" src styles . 2>/dev/null | wc -l | tr -d ' ')
DUP_PRIMARY=$(grep -RIn --include="*.css" -- "--primary:" src styles . 2>/dev/null | wc -l | tr -d ' ')
echo "--background definitions: $DUP_BG"
echo "--primary definitions:    $DUP_PRIMARY"
if [ "$DUP_BG" -gt 2 ] || [ "$DUP_PRIMARY" -gt 2 ]; then
  echo "⚠️ Likely multiple theme files overriding each other."
  echo "   Action: keep ONE globals.css as source of truth."
fi
echo

# 4) Hardcoded slate/gray bypass scan
echo "[4] Scanning for hardcoded slate/gray usage in src/"
if grep -RInE "(text|bg|border|ring)-(slate|gray)-" src; then
  echo
  echo "❌ Found hardcoded slate/gray classes."
  echo "   These bypass theme tokens, causing UI to look 'basic/old'."
  echo "   Action: migrate to semantic tokens (text-muted-foreground, bg-muted, border-border, etc.)"
  exit 2
else
  echo "✅ No hardcoded slate/gray classes found."
fi
echo

# 5) Vite cache info
echo "[5] Vite cache directory check"
if [ -d "node_modules/.vite" ]; then
  echo "Found node_modules/.vite"
else
  echo "node_modules/.vite not found (ok)"
fi
echo

echo "======================================"
echo "✅ THEME AUDIT COMPLETED"
echo "======================================"
