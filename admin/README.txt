ADMIN INSTALL BUTTON

The provided AdminInstallButton.tsx adds a real browser PWA install button.
Import it in the existing admin header/top navigation and render:

<AdminInstallButton />

Do not change the existing admin routing, API, authentication, D1 or other functionality.
The button automatically hides after installation and is shown only when the browser exposes an install prompt.

The existing admin project must already have a valid manifest.webmanifest and service worker/PWA registration for the browser to offer installation.
