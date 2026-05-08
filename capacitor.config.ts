import type {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.sport.tracker',
  appName: 'sport-tracker',
  "webDir": "dist",
  plugins: {
    StatusBar: {

      backgroundColor: "#ffffffff"
    },
  },
};

export default config;
