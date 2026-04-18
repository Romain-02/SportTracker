// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  strava: {
    clientId: '217729',
    refreshToken: 'a816178cf3c591689d63ed98f22bb6c088b24416',
    baseUrl: 'https://www.strava.com/api/v3',
    authUrl: 'https://www.strava.com/oauth/mobile/authorize',
    perPage: 100
  },
  redirectUrl: 'http://localhost:4200/strava-auth-callback',
  githubApiUrl: 'https://api.github.com/repos/Romain-02/SportTracker/releases/latest'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
