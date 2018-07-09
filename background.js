var civioConfig = {
  SCOPE: 'civigmail_extension',
}
var ACCESS_TOKEN_PREFIX = '#access_token=';
var ACCESS_TOKEN_STORAGE_KEY = 'gmail-access-token';

var gapioConfig = {
  CLIENT_ID: '1068079364088-hhbgj9mtqsv731qj973q9qo7jhpuhtsr.apps.googleusercontent.com',
  SCOPE: [
    'https://www.googleapis.com/auth/gmail.readonly'
  ],
}
var GAPI_ACCESS_TOKEN = 'gapi-token';
var CG_COUNTER_TOTAL  = 'cg-counter-total';
var GC_COUNTER_PROGRESS = 'cg-counter-progress';
localStorage[CG_COUNTER_TOTAL] = 0;
localStorage[GC_COUNTER_PROGRESS] = 0;

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
var setStatusMessage = function(message, showProgress = false, time = 10000) {
  console.log('setStatusMessage', message);
  if (showProgress) {
    var progress = getOverallProgress();
    message = progress + '% ' + message;
  }
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'content_setstatus', message : message, time : time}, function(response) {});
  });
  if (showProgress && progress == 100) {
    setTimeout(function() { setStatusMessage('Done uploading to CiviCRM.'); }, 2000);
  }
}
var informButtons = function(token) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    // DS: if you receive this error : the error Error in response to tabs.query: TypeError: Cannot read property 'id' of undefined
    // try close dev consoles
    chrome.tabs.sendMessage(tabs[0].id, {action: 'content_resetbuttons', token: token}, function(response) {});
  });
}

function setCounterTotal(total) {
  localStorage[CG_COUNTER_TOTAL] = total;
  localStorage[GC_COUNTER_PROGRESS] = 0;
}
function getCounterTotal() {
  return localStorage[CG_COUNTER_TOTAL];
}
function setCounterProgress() {
  localStorage[GC_COUNTER_PROGRESS]++;
}
function getCounterProgress() {
  return localStorage[GC_COUNTER_PROGRESS];
}
function getOverallProgress() {
  var progress = 0;
  if (getCounterProgress() > 0 && getCounterTotal() > 0) {
    progress = parseFloat(parseInt(getCounterProgress()) / parseInt(getCounterTotal())) * 100;
  }
  return progress;
}

launchAuthorizer = function() {
  setStatusMessage('Launching OAuth for Civi..');
  chrome.storage.sync.get(["civioAuthUrl", "civioAuthSec", "civiUrl"], function (obj) {
    console.log("obj", obj);
    var civioAuthUrl = obj.civioAuthUrl;
    var civioAuthSec = obj.civioAuthSec;
    if ($.isEmptyObject(civioAuthUrl) || $.isEmptyObject(civioAuthSec)) { 
      setStatusMessage('OAuth URL or Secret not configured or known. Check options for installed CiviGmail extension.');
      informButtons(false);
      return false;
    }
    civioAuthUrl.replace(/\/$/, "");// remove any trailing slash
    console.log("civioAuthUrl in launchAuthorizer = " + civioAuthUrl);
    console.log("Trying to login for oauth.");
    oauthUrl = civioAuthUrl + '?' + $.param({
      "client_id": chrome.runtime.id,
      "client_secret": civioAuthSec,
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
          setStatusMessage('Authorization failed to launch. Something wrong with OAuth configs at ' + (obj.civiUrl ? obj.civiUrl : 'civicrm site') + '. Possible issues - client id / secret / scope.');
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
            console.log('access token', accessToken);
            setStatusMessage('OAuthorization Successful.');
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
      console.log("request in listener", request);
      var token;
      token = getAccessToken();
      if (request.action == "reconnect" && request.button == 'Connect Civi') {
        if (!token) {
          launchAuthorizer();
          // sendresponse assuming successful. Post launch content would be notified anyway
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
  console.log("checkcontactexists request", request);
  // if empty email address
  if (request.email == '') {
    setStatusMessage('Email address not found');
    return false;
  }
  chrome.storage.sync.get(["civiUrl", "civiApiKey"], function (obj) {
    var token = getAccessToken();
    if (!token) {
      setStatusMessage('Not authorized yet. Try "Connect Civi" first.');
      return false;
    }
    request.api_key = obj.civiApiKey;
    civiUrl = obj.civiUrl;
    if ($.isEmptyObject(civiUrl)) { 
      setStatusMessage('CiviCRM URL not configured or known. Check options for installed CiviGmail extension.');
      return false;
    }
    civiUrl.replace(/\/$/, "");// remove any trailing slash
    console.log("civiUrl in action:civiurl = " + civiUrl);
    console.log('request in checkContactExists', request);

    setStatusMessage('Checking contacts in civi for "' + request.subject + '"', true);
    if (request.count == 1) {
      setCounterTotal(request.total);
    }
    $.ajax({
      method: 'POST',
      url: civiUrl + '/gmail/logactivity?oauth_token=' + getAccessToken(),
      data: request,
      dataType: "text",
      crossDomain: true,
      success: function (data, textStatus ) {
        try {
          result = JSON.parse(data);
        } catch (e) {
          console.log('JSON.parse exception: ', e);
          result = { 'is_error': 1, 'message': e.message + ' (did you install all extension dependencies?)' };
        }
        if (result.is_error) {
          setStatusMessage('Error during contact check for "' + request.subject + '" - ' + result.message);
        }

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          // DS: if you receive this error : the error Error in response to tabs.query: TypeError: Cannot read property 'id' of undefined
          // try close dev consoles
          chrome.tabs.sendMessage(tabs[0].id, {action: 'content_civiurl',result: result, params: request}, function(response) {});
        });
      },
      error: function(xhr, textStatus, errorThrown){
        setStatusMessage('Something went wrong during contact check for "' + request.subject + '"');
        console.log('error test', xhr);
        return false;
      }
    });
  });
  return true;
}

function createActivity(message, params) {
  chrome.storage.sync.get("civiUrl", function (obj) {
    setStatusMessage('Creating activity for "' + params.subject + '" ..', true);
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
        console.log('create activity data', data);
        console.log('activity textStatus', textStatus);
        if (data.id && !$.isEmptyObject(message)) {
          setCounterProgress();
          setStatusMessage('Activity created for "' + params.subject + '"', true);
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
                    'subject'  : params.subject,
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
    setStatusMessage('Uploading activity attachment for "' + params.subject + '" - ' + params.filename, true);
    civiUrl = obj.civiUrl;
    civiUrl.replace(/\/$/, "");// remove any trailing slash
    console.log("civiUrl in createAttachment = " + civiUrl);

    var formData = new FormData();
    formData.append('activityID', params.activityID);
    formData.append('mimeType', params.mimetype);

    formData.append('file', new Blob([attachment.data], {type: params.mimetype}), params.filename);
    console.log('formData:', formData);

    $.ajax({
      type: "POST",
      url: civiUrl + '/gmail/logattachment?oauth_token=' + getAccessToken(),
      crossDomain: true,
      contentType: false,
      processData: false,
      data: formData,
      success: function (data, textStatus ) {
        setCounterProgress();
        setStatusMessage('Uploaded activity attachment for "' + params.subject + '" - ' + params.filename, true);
        // FIXME: inform user of any failures
        console.log('attachment textStatus:', textStatus);
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
    console.log('Google API Token not known. Can\'t make call to ' + options.url);
  }
  xhr.setRequestHeader('Authorization', 'Bearer ' + gapiToken);
  //xhr.setRequestHeader('Authorization', 'Bearer ' + session.access_token);
  console.log("xhr call: " + options.url)
  xhr.send();
  console.log('xhr', xhr);
}
