var civioConfig = {
  CLIENT_ID: "client123id",
  CLIENT_SECRET: "client123id",
  SCOPE: 'gmail_extension',
  REDIRECT_URI: 'https://oocdkbejkcafojlbdpkpmffejenhpkfb.chromiumapp.org/', // fixme: auto generate it
}
var ACCESS_TOKEN_PREFIX = '#access_token=';
var ACCESS_TOKEN_STORAGE_KEY = 'outlook-access-token';

var gapioConfig = {
  CLIENT_ID: '721138563269-4s8dv4crl8869lfkgqrb51mj77u77ojc.apps.googleusercontent.com',
  SCOPE: [
    'https://www.googleapis.com/auth/gmail.readonly'
  ],
}
var GAPI_ACCESS_TOKEN = 'gapi-token';

// DS FIXME: if we use chrome storage https://developer.chrome.com/extensions/storage#property-sync
// extension's content scripts can directly access user data without the need for a background page.
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
  chrome.storage.sync.get("civioAuthUrl", function (obj) {
    civioAuthUrl = obj.civioAuthUrl;
    civioAuthUrl.replace(/\/$/, "");// remove any trailing slash
    console.log("civioAuthUrl in launchAuthorizer = " + civioAuthUrl);
    console.log("Trying to login for oauth.");
    oauthUrl = civioAuthUrl + '?' + $.param({
      "client_id": civioConfig.CLIENT_ID,
      "scope": civioConfig.SCOPE,
      "redirect_uri": civioConfig.REDIRECT_URI,
      "response_type":"token",
      "state" : 'null',
      "access_type":"offline",
      "login_hint":'welldeepak@gmail.com',
      "prompt":"consent"
    });
    console.log("oauthUrl = " + oauthUrl);
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
          // DS: if you receive this error : the error Error in response to tabs.query: TypeError: Cannot read property 'id' of undefined
          // try close dev consoles
          chrome.tabs.sendMessage(tabs[0].id, {action: 'post_webauthflow',token: accessToken}, function(response) {});
        });
      }
    );
  });
}

// gmail api oauth
chrome.identity.getAuthToken(
  {'interactive': true},
  function(gapiToken) {
    //load Google's javascript client libraries
    window.gapi_onload = authorize;
    loadScript('https://apis.google.com/js/client.js');
    localStorage[GAPI_ACCESS_TOKEN] = gapiToken;
    console.log('google api authorization response token = ' + gapiToken);
  }
);

function loadScript(url){
  var request = new XMLHttpRequest();

  request.onreadystatechange = function(){
    if(request.readyState !== 4) {
      return;
    }

    if(request.status !== 200){
      return;
    }

    eval(request.responseText);
  };

  request.open('GET', url);
  request.send();
}

function authorize(){
  gapi.auth.authorize(
    {
      client_id: gapioConfig.CLIENT_ID,
      immediate: true,
      scope: gapioConfig.SCOPE
    },
    function() {
      var gapiToken = localStorage[GAPI_ACCESS_TOKEN];
      console.log('post authorization gapiToken from cache= ' + gapiToken);
    }
  );
}


// listen from content for event raised
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "reconnect") {
      console.log("request in listener");
      console.log(request);
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
    else if (request.action == "gmailapi") {
      if (request.email_id) {
        get({
          'url': 'https://www.googleapis.com/gmail/v1/users/me/messages/' + request.email_id,
          'callback': getMessage,
          'callbackParams' : request,
        });
      } else {
        console.log('message id not known.');
      }
    }
  }
);

function getMessage(message, params) {
  chrome.storage.sync.get("civiUrl", function (obj) {
    civiUrl = obj.civiUrl;
    civiUrl.replace(/\/$/, "");// remove any trailing slash
    console.log("civiUrl in getMessage = " + civiUrl);

    var formData = new FormData();
    formData.append('email', params.email);
    formData.append('subject', params.subject);
    formData.append('email_body', params.email_body);
    formData.append('ot_target_contact_id', params.ot_target_contact_id);

    $.ajax({
      type: "POST",
      //FIXME: use a constant or config
      url: civiUrl + '/gmail/logactivity',
      crossDomain: true,
      contentType: false,
      processData: false,
      data: formData,
      success: function (data, textStatus) {
        console.log("activity posted with..");
        console.log(data);
        console.log(textStatus);
        //getAttachment();
        if (data.id) {
          // FIXME: move to function
          var parts = message.payload.parts;
          //var params.attachment = [];
          for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part.filename && part.filename.length > 0) {
              var attachId = part.body.attachmentId;
              console.log("attachId = " + attachId);
              get({
                'url': 'https://www.googleapis.com/gmail/v1/users/me/messages/' + message.id + '/attachments/' + attachId,
                'callback': getAttachment,
                'callbackParams' : {
                  'activityID' : data.id,
                  'filename' : part.filename,
                  'mimetype' : part.mimeType
                }
              });
            }
          }
        }
      },
    });
  });
}

function getAttachment(attachment, params) {
  chrome.storage.sync.get("civiUrl", function (obj) {
    civiUrl = obj.civiUrl;
    civiUrl.replace(/\/$/, "");// remove any trailing slash
    console.log("civiUrl in getAttachment = " + civiUrl);

    var formData = new FormData();
    formData.append('activityID', params.activityID);
    formData.append('mimeType', params.mimetype);

    formData.append('file', new Blob([attachment.data], {type: params.mimetype}), params.filename);
    console.log(formData);

    $.ajax({
      type: "POST",
      // FIXME: use a constant or config
      url: civiUrl + '/gmail/logattachment',
      crossDomain: true,
      contentType: false,
      processData: false,
      data: formData,
      success: function (data, textStatus ) {
        // FIXME: inform user of any failures
        console.log(textStatus);
      },
    });
  });
}

/**
 * Make an authenticated HTTP GET request.
 *
 * @param {object} options
 *   @value {string} url - URL to make the request to. Must be whitelisted in manifest.json
 *   @value {function} callback - Function to receive response.
 */
function get(options) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      // JSON response assumed. Other APIs may have different responses.
      options.callback(JSON.parse(xhr.responseText), options.callbackParams);
    } else {
      console.log('get', xhr.readyState, xhr.status, xhr.responseText);
    }
  };
  xhr.open("GET", options.url, true);
  // Set standard Google APIs authentication header.
  var gapiToken = localStorage[GAPI_ACCESS_TOKEN];
  if (!gapiToken || 0 === gapiToken.length) {
    console.log('Google API Token not known.');
  }
  xhr.setRequestHeader('Authorization', 'Bearer ' + gapiToken);
  console.log("xhr call: " + options.url)
  xhr.send();
}
