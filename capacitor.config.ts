import type { CapacitorConfig } from "@capacitor/cli";

// Two ways to point the Android app at your backend:
//
// 1) Remote mode (recommended, zero frontend config needed): set CAPACITOR_SERVER_URL to your
//    published app's public URL when running `npx cap sync`/`cap copy`. The WebView loads the
//    real deployed site directly, so relative /api/... calls and window.location.origin already
//    resolve to the correct backend. Example:
//      CAPACITOR_SERVER_URL="https://mi-app.dominio.com" npm run android:sync
//
// 2) Bundled mode (default, no env var set): the web assets from dist/ are packaged inside the
//    APK. In this mode set VITE_API_BASE_URL (in a .env file, see .env.example) to your deployed
//    backend URL *before* running `npm run build`, so API calls target the real server instead of
//    the WebView's local origin.
const remoteServerUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: "ar.com.jactoargentina.planillas",
  appName: "Planillas Jacto",
  webDir: "dist",
  android: {
    allowMixedContent: true,
  },
  ...(remoteServerUrl
    ? {
        server: {
          url: remoteServerUrl,
          cleartext: remoteServerUrl.startsWith("http://"),
        },
      }
    : {}),
};

export default config;
