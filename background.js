var civioConfig = {
  CLIENT_ID: "721138563269-4s8dv4crl8869lfkgqrb51mj77u77ojc.apps.googleusercontent.com",
  CLIENT_SECRET: "228ffe6c8b4e_4681d6c869_f8bbf6cd43",
  SCOPE: 'gmail_civi_extension',
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
var setStatusMessage = function(message, time = 8000) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'content_setstatus', message : message, time : time}, function(response) {});
  });
}
var informButtons = function(token) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    // DS: if you receive this error : the error Error in response to tabs.query: TypeError: Cannot read property 'id' of undefined
    // try close dev consoles
    chrome.tabs.sendMessage(tabs[0].id, {action: 'content_resetbuttons', token: token}, function(response) {});
  });
}

launchAuthorizer = function() {
  chrome.storage.sync.get("civioAuthUrl", function (obj) {
    civioAuthUrl = obj.civioAuthUrl;
    if ($.isEmptyObject(civioAuthUrl)) { 
      setStatusMessage('CiviCRM OAuth URL not configured or known. Check options for installed CiviGmail extension.');
      informButtons(false);
      return false;
    }
    civioAuthUrl.replace(/\/$/, "");// remove any trailing slash
    console.log("civioAuthUrl in launchAuthorizer = " + civioAuthUrl);
    console.log("Trying to login for oauth.");
    oauthUrl = civioAuthUrl + '?' + $.param({
      "client_id": civioConfig.CLIENT_ID,
      "scope": civioConfig.SCOPE,
      "redirect_uri": 'https://' + chrome.runtime.id + '.chromiumapp.org/',
      "response_type":"token",
      "state" : 'null',
      "access_type":"offline",
      "prompt":"consent"
    });
    console.log("oauthUrl = " + oauthUrl);
    chrome.identity.launchWebAuthFlow(
      {"url": oauthUrl, "interactive": true},
      function(code) {
        console.log('auth code= ' + code);
        if (typeof code == 'undefined') {
          setStatusMessage('Authorization failed to launch. Something wrong with OAuth configs at civi site.');
          informButtons(false);
        } else {
          var accessTokenStart = code.indexOf(ACCESS_TOKEN_PREFIX);
          if (accessTokenStart < 0) {
            console.log('Unexpected code: ' + code);
            setStatusMessage('Authorization failed with error url "' + code + '"', 12000);
            informButtons(false);
          } else {
            var accessToken = code.substring(accessTokenStart + ACCESS_TOKEN_PREFIX.length);
            setAccessToken(accessToken);
            informButtons(accessToken);
            console.log(accessToken);
          }
        }
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
      if (request.action == "reconnect" && request.button == 'Connect Civi') {
        if (!token) {
          launchAuthorizer();
          // sendresponse assuming successfull. Post launch content would be notified anyway
          sendResponse({'token': true});
        } else {
          sendResponse({'token': token});
        }
      } else if (request.action == "reconnect" && request.button == 'Disconnect Civi') {
        clearAccessToken();
        token = getAccessToken();
        sendResponse({'token': token});
      }
    }
    else if (request.action == "gmailapi") {
      if (request.email_id) {
        get({
          'url': 'https://www.googleapis.com/gmail/v1/users/me/messages/' + request.email_id,
          'callback': createActivity,
          'callbackParams' : request,
        });
      } else {
        console.log('Message id not known. Filing activity based on params.');
        createActivity({}, request);
      }
    }
    else if (request.action == "civiurl") {
      checkContactExists(request);
    }
  }
);

function checkContactExists(request) {
  // if empty email address
  if (request.email == '') {
    console.log('email address not found');
    return;
  }
  chrome.storage.sync.get("civiUrl", function (obj) {
    civiUrl = obj.civiUrl;
    civiUrl.replace(/\/$/, "");// remove any trailing slash
    console.log("civiUrl in action:civiurl = " + civiUrl);
    console.log('request in checkContactExists', request);

    $.ajax({
      method: 'GET',
      url: civiUrl + '/gmail/logactivity?oauth_token=' + getAccessToken(),
      data: request,
      dataType: "text",
      crossDomain: true,
      success: function (data, textStatus ) {
        result = JSON.parse(data);
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          // DS: if you receive this error : the error Error in response to tabs.query: TypeError: Cannot read property 'id' of undefined
          // try close dev consoles
          chrome.tabs.sendMessage(tabs[0].id, {action: 'content_civiurl',result: result, params: request}, function(response) {});
        });
      },
      error: function(xhr, textStatus, errorThrown){
        console.log('error test', xhr);
        return;
      }
    });
  });
}

function createActivity(message, params) {
  chrome.storage.sync.get("civiUrl", function (obj) {
    civiUrl = obj.civiUrl;
    civiUrl.replace(/\/$/, "");// remove any trailing slash
    console.log("civiUrl in createActivity = " + civiUrl);

    var formData = new FormData();
    formData.append('email', params.email);
    formData.append('subject', params.subject);
    formData.append('email_body', params.email_body);
    formData.append('ot_target_contact_id', params.ot_target_contact_id);

    $.ajax({
      type: "POST",
      //FIXME: use a constant or config
      url: civiUrl + '/gmail/logactivity?oauth_token=' + getAccessToken(),
      crossDomain: true,
      contentType: false,
      processData: false,
      data: formData,
      success: function (data, textStatus) {
        console.log("activity posted with..");
        console.log(data);
        console.log(textStatus);
        if (data.id && !$.isEmptyObject(message)) {
          // FIXME: move to function
          var parts = message.payload.parts;
          //var params.attachment = [];
          if (!$.isEmptyObject(parts)) { 
            for (var i = 0; i < parts.length; i++) {
              var part = parts[i];
              if (part.filename && part.filename.length > 0) {
                var attachId = part.body.attachmentId;
                console.log("attachId = " + attachId);
                get({
                  'url': 'https://www.googleapis.com/gmail/v1/users/me/messages/' + message.id + '/attachments/' + attachId,
                  'callback': createAttachment,
                  'callbackParams' : {
                    'activityID' : data.id,
                    'filename' : part.filename,
                    'mimetype' : part.mimeType
                  }
                });
              }
            }
          }
        }
      },
    });
  });
}

function createAttachment(attachment, params) {
  chrome.storage.sync.get("civiUrl", function (obj) {
    civiUrl = obj.civiUrl;
    civiUrl.replace(/\/$/, "");// remove any trailing slash
    console.log("civiUrl in createAttachment = " + civiUrl);

    var formData = new FormData();
    formData.append('activityID', params.activityID);
    formData.append('mimeType', params.mimetype);

    formData.append('file', new Blob([attachment.data], {type: params.mimetype}), params.filename);
    console.log(formData);

    $.ajax({
      type: "POST",
      url: civiUrl + '/gmail/logattachment?oauth_token=' + getAccessToken(),
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
