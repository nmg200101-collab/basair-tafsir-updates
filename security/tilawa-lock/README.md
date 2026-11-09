# BASAIR — قفل استقرار قسم التلاوة | Tilawa Owner Lock

**Reference:** V690 + owner-qa **QA-050** (9 Nov 2026). Owner-accepted field state.

## Protected / محمي

- Original printed Mushaf, coloured Tajweed print, zoom/scroll/follow, selected reciters, ayah navigation, meaning/highlight, saved reading position and local assets.
- **Uthmani printed option stays disabled**. No experiment may re-enable it without owner authorization.
- Current signed owner QA release (`p92/owner-qa-001/release.json`), all eight pinned CSS/JS resource hashes, alternate `p93/` OTA paths, main update manifest and Tajweed source manifests.
- Existing code and publishing workflows, including the lock itself, are covered by the authorization check.
- Tafsir and Library *independent JSON content updates* are not blocked if they do not edit any protected path or the locked manifest.

## Owner approval / آلية كلمة المرور

The secret was supplied privately by the owner. **It is NOT stored in this public repository**, neither in app JavaScript, workflow YAML, issues, logs nor plaintext file. The lock uses a memory-hard scrypt-derived, Ed25519 owner verification public key (safe to distribute) and requires an individual, expiring cryptographic signature for the *exact* proposed changes. The app's existing RSA owner-signed OTA manifest remains separately required.

A later developer/change author must:

1. Propose changes in a pull request; **never** modify the active release directly.
2. Check the impact on Tilawa. If no protected paths change, the freeze checker passes without requesting owner password.
3. For protected changes, request *explicit owner permission* to unlock. Owner enters the password **locally, not in a PR/issue/workflow input**, using `python security/tilawa-lock/approve.py --pr <PR> --base origin/main --purpose "reason for unlock"`. Python `cryptography` is needed on the signing machine. Only `approvals/pr-<PR>.json` (public signature, not password) is committed.
4. The `Tilawa Owner Lock / Protect Tilawa` check verifies the owner's Ed25519 signature against the precise changed file digests. A file change after approval invalidates the signature. Approval expires after seven days and is specific to that PR.
5. The updated OTA release **still requires a valid native RSA signature**, correct asset sizes/digests, valid receiver ID, and a new freeze baseline signed in the same PR. Test original+colored print and selected audio on the owner's device before regarding changes as accepted.

## CRITICAL: GitHub enforcement is not automatic

The repository was **observed with zero GitHub Rulesets** on 9 Nov 2026. An Actions job that fails is **not** sufficient to prevent a maintainer with push access from directly changing `main`. To make this a hard GitHub gate, repository owner must set a branch **Ruleset** in GitHub:

- Repository `Settings` → `Rules` → `Rulesets` → `New branch ruleset`.
- Target `main`; **Require a pull request before merging**, **Require status checks to pass** → select **`Protect Tilawa`** (workflow `Tilawa Owner Lock`); block force-push/deletion and restrict bypass actors. Require CODEOWNERS reviews where the account/plan permits it.
- If the GitHub UI offers `Do not allow bypassing` or restricted push, enable it as appropriate. The user remains responsible for security of their account.

**Until ruleset is enabled and confirmed, status = audit/fail-closed CI, NOT unbypassable enforcement.** The guard only covers this server OTA repository. Protecting *every APK update and every external code repository* also requires integrating this check into those independent release pipelines. A client-side immutable lock would require changes to the V690 native OTA receiver and a newly signed APK, which this task does not do.

## Baseline recovery

- QA-050 is the accepted production owner baseline. Its whole signed manifest and eight assets are pinned in `qa050-freeze.json`.
- QA-049 is the archived previous stable baseline; it is not automatically activated.
- Never revert by uploading a lower OTA sequence; use the app's built-in rollback if viable or a newly signed owner-approved higher sequence.
- Do not erase local Qur'an downloads, saved selected recitations, bookmarks, Hifz or Tafsir data.
- Password rotation/recovery requires a new owner-approved authorization key baseline and an updated ruleset; losing the password leaves protected changes blocked by design.

## Stability acceptance for future approved Tilawa changes

Check on an Android device: original Mushaf pages 1/2/6/604; colored Tajweed pages 1/2/6/604; zoom 150/200%; audio follow + manual drag + resume; ayah selection/shading; Back/navigation; reciter sources; switch print styles; offline use; Hifz/Tafsir/Library unchanged; QA-049 rollback path. No white page, unexpected movement, or off-by-one highlight.
