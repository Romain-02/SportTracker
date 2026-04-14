import type {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.sport.tracker',
  appName: 'sport-tracker',
  "webDir": "www",
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
      backgroundColor: "#ffffffff"
    },
  },
};

export default config;
