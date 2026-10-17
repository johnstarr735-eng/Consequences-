import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Development identity; choose the owner's final bundle ID before store setup.
  appId: 'dev.consequences.alpha',
  appName: 'Consequences',
  webDir: 'mobile-dist',
  backgroundColor: '#111b18',
  loggingBehavior: 'debug',
  zoomEnabled: true,
  android: { path: 'android', minWebViewVersion: 108 },
  ios: { path: 'ios', contentInset: 'never', scheme: 'App' },
  plugins: {
    Keyboard: { resize: 'body', resizeOnFullScreen: true },
    SystemBars: { insetsHandling: 'css', initialViewportFitValueHint: 'cover', style: 'LIGHT' },
  },
};
export default config;
