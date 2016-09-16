var j = document.createElement('script');
j.src = chrome.extension.getURL('lib/jquery-1.11.3.min.js');
(document.head || document.documentElement).appendChild(j);

var g = document.createElement('script');
g.src = chrome.extension.getURL('lib/gmail.js');
(document.head || document.documentElement).appendChild(g);

//var c = document.createElement('script');
////c.src = "https://apis.google.com/js/client.js?onload=handleClientLoad";;
//c.src = "https://apis.google.com/js/client.js";;
//(document.head || document.documentElement).appendChild(c);

var p = document.createElement('script');
p.src = chrome.extension.getURL('page.js');
(document.head || document.documentElement).appendChild(p);

// Event listener for page
document.addEventListener('content_reconnect', function(e) {
  var action = e.detail.action;
  // fixme: could use some class than label
  buttonLabel = $('div.coge_bttn_container > div').text();

  // send message to background
  chrome.runtime.sendMessage({'action': action, 'button': buttonLabel}, function(response) {
    var token;
    token = response.token;
    if (token === true) {
      $('div.coge_bttn_container > div').text('Connecting..');
    } else if (token) {
      $('div.coge_bttn_container > div').text('Disconnect Outlook');
    } else {
      $('div.coge_bttn_container > div').text('Connect Outlook');
    }
  });
});

// listen to background
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "post_webauthflow") {
      var token;
      token = request.token;
      if (token) {
        $('div.coge_bttn_container > div').text('Disconnect Outlook');
      } else {
        $('div.coge_bttn_container > div').text('Connect Outlook');
      }
    }
  }
);


// Event listener for page
document.addEventListener('content_gmailapi', function(e) {
  var action = e.detail.action;
  // fixme: could use some class than label
  buttonLabel = $('div.coge_bttn_container > div').text();

  // send message to background
  chrome.runtime.sendMessage(e.detail, function(response) {
    console.log(response);
  });
});

//function handleClientLoad() {
//  console.log('handleClientLoad() called');
//  // send message to background
//  chrome.runtime.sendMessage({'action': 'gmail_api', 'button': 'dnc'}, function(response) {
//    console.log(response);
//  });
//  //gapi.client.setApiKey(apiKey);
//  //window.setTimeout(checkAuth, 1);
//}
