var oauth = {};
console.log("oauth.js called");

(function(api) {
  var ACCESS_TOKEN_PREFIX = '#access_token=';

  var storage = localStorage;//chrome.storage.local;
  var ACCESS_TOKEN_STORAGE_KEY = 'oauth-access-token';

  var getAccessToken = function() {
    //storage.get(ACCESS_TOKEN_STORAGE_KEY, function(items) {
    //  console.log('items[ACCESS_TOKEN_STORAGE_KEY]= ' + items[ACCESS_TOKEN_STORAGE_KEY]);
    //  callback(items[ACCESS_TOKEN_STORAGE_KEY]);
    //});
    return storage[ACCESS_TOKEN_STORAGE_KEY];
  }

  var setAccessToken = function(accessToken) {
    //var items = {};
    storage[ACCESS_TOKEN_STORAGE_KEY] = accessToken;
    //storage.set(items, callback);
  }

  var clearAccessToken = function() {
    //storage.remove(ACCESS_TOKEN_STORAGE_KEY, callback);
    storage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }

  // Tokens state is not exposed via the API
  //api.isSignedIn = function(callback) {
  //  getAccessToken(function(accessToken) {
  //    callback(!!accessToken);
  //  });
  //};

  api.signIn = function(appId, clientId, successCallback, errorCallback) {
    var redirectUrl = chrome.identity.getRedirectURL();
    var authUrl = 'http://cms46.loc/oauth2/authorize?' +
        'client_id=' + clientId + '&' +
        'response_type=token&' +
        'state=null&' +
        'redirect_uri=' + encodeURIComponent(redirectUrl);
    console.log(authUrl);
    chrome.identity.launchWebAuthFlow(
        {url: authUrl, interactive: true},
        function(responseUrl) {
          console.log("responseUrl= " + responseUrl);
        if (chrome.runtime.lastError) {
          errorCallback(chrome.runtime.lastError.message);
          return;
        }

        var accessTokenStart = responseUrl.indexOf(ACCESS_TOKEN_PREFIX);

        if (!accessTokenStart) {
          errorCallback('Unexpected responseUrl: ' + responseUrl);
          return;
        }

        var accessToken = responseUrl.substring(
            accessTokenStart + ACCESS_TOKEN_PREFIX.length);
console.log('accessToken', accessToken);
        setAccessToken(accessToken, successCallback);
      });
  };
  api.signOut = function(callback) {
    clearAccessToken(callback);
  };

  //var apiMethod = function(
  //    path, postData, params, successCallback, errorCallback) {
  //  getAccessToken(function(accessToken) {
  //    var xhr = new XMLHttpRequest();
  //    // TODO(mihaip): use xhr.responseType = 'json' once it's supported.
  //    //xhr.responseType = 'jsonp';  
  //    xhr.onload = function() {
  //      successCallback(JSON.parse(xhr.responseText).response);
  //    }
  //    xhr.onerror = function() {
  //      errorCallback(xhr.status, xhr.statusText, JSON.parse(xhr.responseText));
  //    }

  //    var encodedParams = [];
  //    for (var paramName in params) {
  //      encodedParams.push(encodeURIComponent(paramName) + '=' +
  //          encodeURIComponent(params[paramName]));
  //    }
  //    //var accessToken = '720a0aae4ead91ac9b28db93745059483e2225a2';
  //    if ("withCredentials" in xhr) {
  //    xhr.open(
  //      'GET',
  //      'http://cms46.loc/' + path + '?oauth_token=' +
  //          accessToken + '&' + encodedParams.join('&'),
  //      true);
  //    console.log();
  //    } else if (typeof XDomainRequest != "undefined") {
  //      xhr = new XDomainRequest();
  //    xhr.open(
  //      'GET',
  //      'http://cms46.loc/' + path + '?oauth_token=' +
  //          accessToken + '&' + encodedParams.join('&')
  //      );
  //    }
  //    //xhr.send(null);
  //  });
  //}

  //api.getRecentCheckins = apiMethod.bind(api, 'oauth2/UserInfo', undefined);
  //api.getRecentCheckins = apiMethod.bind(api, 'civicrm/gmail/logactivity', undefined);
})(oauth);
