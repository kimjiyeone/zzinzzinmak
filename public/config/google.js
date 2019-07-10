window.config = {
  routerBasename: '/',
  relativeWebWorkerScriptsPath: '',
  enableGoogleCloudAdapter: true,
  servers: {
    // This is an array, but we'll only use the first entry for now
    dicomWeb: [],
  },
  // This is an array, but we'll only use the first entry for now
  oidc: [
    {
      // ~ REQUIRED
      // Authorization Server URL
      authority: 'https://accounts.google.com',
      client_id: '723928408739-k9k9r3i44j32rhu69vlnibipmmk9i57p.apps.googleusercontent.com', //'YOURCLIENTID.apps.googleusercontent.com',
      redirect_uri: 'http://localhost:5000/callback', // `OHIFStandaloneViewer.js`
      response_type: 'id_token token',
      scope: 'email profile openid https://www.googleapis.com/auth/cloudplatformprojects.readonly https://www.googleapis.com/auth/cloud-healthcare', // email profile openid
      // ~ OPTIONAL
      post_logout_redirect_uri: '/logout-redirect.html',
      revoke_uri: 'https://accounts.google.com/o/oauth2/revoke?token=',
      "automaticSilentRenew": true,
      "revokeAccessTokenOnSignout": true,
    },
  ],
}
