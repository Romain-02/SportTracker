export const commonEnvironment = {
  production: false,
  strava: {
    clientId: '',
    refreshToken: '',
    baseUrl: 'https://www.strava.com/api/v3',
    authUrl: 'https://www.strava.com/oauth/mobile/authorize',
    perPage: 100
  },
  redirectUrl: 'http://localhost:4200/strava-auth-callback',
  githubApiUrl: 'https://api.github.com/repos/Romain-02/SportTracker/releases/latest'
};
