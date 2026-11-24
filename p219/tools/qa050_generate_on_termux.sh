#!/usr/bin/env bash
# BASAIR QA050 — OWNER PHONE (TERMUX) OFFLINE KEY CREATION ONLY.
# This does NOT update GitHub trust and does NOT sign any old QA050 approval.
set -Eeuo pipefail
umask 077
export LC_ALL=C
if ! command -v openssl >/dev/null 2>&1; then
  echo 'STOP: OpenSSL is not installed. Run: pkg install openssl'
  exit 2
fi
if ! command -v sha256sum >/dev/null 2>&1; then
  echo 'STOP: sha256sum is required. Run: pkg install coreutils'
  exit 2
fi
if ! openssl list -public-key-algorithms 2>/dev/null | grep -qi ED25519; then
  echo 'STOP: this OpenSSL does not support ED25519'
  exit 2
fi
if [ -z "$HOME" ] || [ ! -d "$HOME" ]; then
  echo 'STOP: HOME not available'
  exit 2
fi
ROOT="$HOME/.local/share/basair/qa050-recovery"
PRIVATE="$ROOT/BASAIR-QA050-REPLACEMENT-PRIVATE-ENCRYPTED.pem"
PUBLIC="$ROOT/BASAIR-QA050-REPLACEMENT-PUBLIC.pem"
if [ -e "$PRIVATE" ] || [ -e "$PUBLIC" ]; then
  echo 'STOP: QA050 replacement already exists. Refusing to overwrite it.'
  echo 'Do not generate another key. Use the existing public PEM if available.'
  exit 3
fi
mkdir -p "$ROOT"
chmod 700 "$ROOT"
TEMP_PRIVATE="$(mktemp "$ROOT/.private.XXXXXXXX")"
TEMP_PUBLIC="$(mktemp "$ROOT/.public.XXXXXXXX")"
cleanup() {
  [ -n "$TEMP_PRIVATE" ] && [ -f "$TEMP_PRIVATE" ] && rm -f "$TEMP_PRIVATE"
  [ -n "$TEMP_PUBLIC" ] && [ -f "$TEMP_PUBLIC" ] && rm -f "$TEMP_PUBLIC"
}
trap cleanup EXIT
echo 'BASAIR QA050 replacement: NEW KEY, NOT YET TRUSTED.'
echo 'Enter a NEW strong password (20+ characters), twice.'
echo 'Never send the password or private PEM to ChatGPT or GitHub.'
openssl genpkey -algorithm ED25519 -aes-256-cbc -out "$TEMP_PRIVATE"
if [ "$(head -n 1 "$TEMP_PRIVATE")" != '-----BEGIN ENCRYPTED PRIVATE KEY-----' ]; then
  echo 'STOP: private key was not encrypted as expected'
  exit 4
fi
echo 'Confirm your password once to derive the public key.'
openssl pkey -in "$TEMP_PRIVATE" -pubout -out "$TEMP_PUBLIC"
openssl pkey -pubin -in "$TEMP_PUBLIC" -noout >/dev/null
PUB_SHA="$(openssl pkey -pubin -in "$TEMP_PUBLIC" -outform DER | tail -c 32 | sha256sum | cut -d' ' -f1)"
OLD_SHA='468a4b0de5066569eb55f22987e1768569de7ff96d95b716ff8ebbed1a90e1c7'
if [ "$PUB_SHA" = "$OLD_SHA" ]; then
  echo 'STOP: unexpectedly matches the old QA050 public key'
  exit 5
fi
mv "$TEMP_PRIVATE" "$PRIVATE"; TEMP_PRIVATE=''
mv "$TEMP_PUBLIC" "$PUBLIC"; TEMP_PUBLIC=''
chmod 600 "$PRIVATE" "$PUBLIC"
printf '%s\n' 'QA050 key generation OK. Status: UNAPPROVED.' \
  "Public raw-key SHA-256: $PUB_SHA" \
  "Encrypted PRIVATE saved inside Termux: $PRIVATE" \
  "PUBLIC saved inside Termux: $PUBLIC" \
  'The PRIVATE PEM and its password must NEVER be uploaded.'
if [ -d "$HOME/storage/downloads" ]; then
  cp "$PUBLIC" "$HOME/storage/downloads/BASAIR-QA050-REPLACEMENT-PUBLIC.pem"
  echo 'Public PEM copied to Downloads for sending to the project.'
else
  echo 'To share ONLY the public PEM: run termux-setup-storage, allow permission,'
  echo 'then run: cp ~/.local/share/basair/qa050-recovery/BASAIR-QA050-REPLACEMENT-PUBLIC.pem ~/storage/downloads/'
fi
echo 'NEXT: store two separately protected encrypted backups of the PRIVATE key.'
echo 'DO NOT publish a new QA050 public key before separate owner review and recovery approval.'
