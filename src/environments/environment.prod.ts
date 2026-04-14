import {commonEnvironment} from "./commonEnvironment";

export const environment = {
  ...commonEnvironment,
  strava: {
    ...commonEnvironment.strava
  },
  production: true,
};
