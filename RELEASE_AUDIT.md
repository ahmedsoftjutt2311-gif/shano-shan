# SHANO SHAN FRAGRANCE — Release Audit

This release keeps the requested production architecture and does not reset D1.

## Cleanup/fixes beyond the visible feature requests
- Removed obsolete internal AI binding/remnant code because the latest instruction was to remove the customer AI assistant.
- Removed unused AI-band CSS so no hidden assistant section remains in the customer build.
- Kept the requested onboarding tour with Skip.
- Kept the requested Install App control; it remains visible until the site is actually installed/standalone.
- Removed backup/temp files from the release archive so the ZIP contains the deployable source rather than internal scratch copies.
- Kept the exact supplied horizontal `/shanoshan.png` brand logo; no logo recreation or redesign.

## Important
- Existing D1 data is not included in this ZIP and must not be reset.
- Existing production secrets are not included.
- Run the existing migration/deployment process before using newly added database features.
