var oConfig = {
  CLIENT_ID: "client123id",
  CLIENT_SECRET: "client123id",
  SCOPE: 'gmail_extension',
  REDIRECT_URI: 'https://oocdkbejkcafojlbdpkpmffejenhpkfb.chromiumapp.org/' // fixme: auto generate it
} 
var ACCESS_TOKEN_PREFIX = '#access_token=';
var ACCESS_TOKEN_STORAGE_KEY = 'outlook-access-token';

var setAccessToken = function(accessToken) {
  localStorage[ACCESS_TOKEN_STORAGE_KEY] = accessToken;
}
var getAccessToken = function() {
  var token = localStorage[ACCESS_TOKEN_STORAGE_KEY];
  console.log('getAccessToken result = ' + token);
  return token;
}
var clearAccessToken = function() {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
}

launchAuthorizer = function() {
  console.log("Trying to login for oauth.");
  oauthUrl = "https://cms46.loc/oauth2/authorize?" + $.param({
    "client_id": oConfig.CLIENT_ID,
    "scope": oConfig.SCOPE,
    "redirect_uri": oConfig.REDIRECT_URI,
    "response_type":"token",
    "state" : 'null',
    "access_type":"offline",
    "login_hint":'welldeepak@gmail.com',
    "prompt":"consent"
  });
  console.log(oauthUrl);
  chrome.identity.launchWebAuthFlow(
    {"url": oauthUrl, "interactive": true},
    function(code) {
      console.log('auth code= ' + code);
      var accessTokenStart = code.indexOf(ACCESS_TOKEN_PREFIX);
      if (accessTokenStart < 0) {
        console.log('Unexpected code: ' + code);
        accessToken = false;//false
      } else {
        var accessToken = code.substring(accessTokenStart + ACCESS_TOKEN_PREFIX.length);
        setAccessToken(accessToken);
      }
      console.log('access token= ' + accessToken);
      // send message to content
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'post_webauthflow',token: accessToken}, function(response) {});
      });
    }
  );
}

// listen from content
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var token;
    token = getAccessToken();
    if (request.action == "reconnect" && request.button == 'Connect Outlook') {
      if (!token) {
        launchAuthorizer();
        // sendresponse assuming successfull. Post launch content would be notified anyway
        sendResponse({'token': true});
      } else {
        sendResponse({'token': token});
      }
    } else if (request.action == "reconnect" && request.button == 'Disconnect Outlook') {
      clearAccessToken();
      token = getAccessToken();
      sendResponse({'token': token});
    }
  }
);
