import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.astravex.app',
  appName: 'AstraVex',
  webDir: 'out',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    GoogleSignIn: {
      clientId: '176531876007-qhf2afne5m6ff2qhp7m5830bafj82t98.apps.googleusercontent.com',
    },
  },
};

export default config;
