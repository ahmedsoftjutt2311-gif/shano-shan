# SHANO SHAN — Professional Final Polish — 2026-09-25

- Customer global loading overlay is now transparent/non-blocking; the SS + crown mark remains the loading indicator without creating a black page overlay.
- Shop page received a visible professional gradient/background and stronger card/toolbar states so it no longer presents as an empty black screen while API data loads.
- Promotional Banners admin form is simplified to one poster upload with automatic desktop/mobile responsive cropping. Manual banner text/title positioning controls were removed. Optional CTA button can be enabled and configured.
- Admin Website Controls now use clean feature names only and cover store, navigation, shopping, and commerce controls wired to the customer site.
- Admin notification delete buttons have a dedicated visible hit target and server DELETE endpoint remains enabled.
- Admin password recovery added using the existing password_reset_challenges table; Store Settings password change still requires the current password.
- Customer forgot password remains math-question recovery with a fresh challenge per request.
- Return requests require at least one product image and remain restricted to 48 hours after delivery; the Return button is disabled until an image is selected.
- Payment/order receipt previews are constrained for desktop/mobile instead of displaying huge images.
- Product cards/details use ADD TO CART and share actions; featured products use the product image badge rather than a separate text section.
- Social icons in footer/contact now use recognizable platform colors.
- Existing Worker/Hono, D1, Cloudinary, authentication, and existing data architecture are preserved. No database reset/recreation was introduced.
