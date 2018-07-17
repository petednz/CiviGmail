var j = document.createElement('script');
j.src = chrome.extension.getURL('lib/jquery-1.11.3.min.js');
(document.head || document.documentElement).appendChild(j);

var g = document.createElement('script');
g.src = chrome.extension.getURL('lib/gmail.js');
(document.head || document.documentElement).appendChild(g);

var p = document.createElement('script');
p.src = chrome.extension.getURL('page.js');
(document.head || document.documentElement).appendChild(p);

var resetButtons = function(token) {
  if (token === true) {
    $('div.coge_bttn_container > div').text('Connecting..');
  } else if (token) {
    $('div.coge_bttn_container > div').text('Disconnect Civi');
  } else {
    $('div.coge_bttn_container > div').text('Connect Civi');
  }
}

var resetRecordButton = function(recordSentMail) {
  // &#9744; is empty checkbox; &#9745; is filled checkbox
  if (recordSentMail) {
    $('div.recsent_bttn_container > div').text(String.fromCharCode(9745) + ' Record Sent Mails');
  } else {
    $('div.recsent_bttn_container > div').text(String.fromCharCode(9744) + ' Record Sent Mails');
  }
}

// Event listener for page
document.addEventListener('content_reconnect', function(e) {
  // fixme: could use some class than label
  var detail = Object.assign({ 'button': $('div.coge_bttn_container > div').text() }, e.detail);

  // send message to background
  chrome.runtime.sendMessage(detail, function(response) {
    var token = response.token;
    resetButtons(token);
  });
});

// Event listener for page
document.addEventListener('record_sent_mail', function(e) {
  var action = e.detail.action;
  chrome.storage.sync.get({
    "recordSentMail": false
  }, function (rec) {
    if (action == 'toggle') {
      var value = !rec.recordSentMail;
      chrome.storage.sync.set({
        recordSentMail: value
      }, function() {
        resetRecordButton(value);
      });
    } else if (action == 'get') {
      resetRecordButton(rec.recordSentMail);
    }
  });
});

// listen to background
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "content_resetbuttons") {
      var token = request.token;
      resetButtons(token);
      document.dispatchEvent(new CustomEvent('record_sent_mail', {detail: {'action' : 'get'}}));
    }
    if (request.action == "content_civiurl") {
      document.dispatchEvent(new CustomEvent('page_civiurl', {detail: request}));
    }
    if (request.action == "content_setstatus") {
      document.dispatchEvent(new CustomEvent('page_setstatus', {detail : request}));
    }
  }
);

// Event listener for page
document.addEventListener('content_gmailapi', function(e) {
  var detail = Object.assign({ 'action': 'gmailapi' }, e.detail);
  // send message to background
  chrome.runtime.sendMessage(detail, function(response) {
    console.log('gmailapi response', response);
  });
});

// Event listener for page
document.addEventListener('content_civiurl', function(e) {
  var detail = Object.assign({ 'action': 'civiurl' }, e.detail);
  if (detail.email_id) {
    // send message to background
    chrome.runtime.sendMessage(detail, function(response) {
      console.log('civiurl response', response);
    });
  } else {
    // If this is a sent mail, check if we're supposed to record it
    chrome.storage.sync.get({
      "recordSentMail": false
    }, function (rec) {
      if (rec.recordSentMail) {
        // send message to background
        chrome.runtime.sendMessage(detail, function(response) {
          console.log('civiurl response', response);
        });
      }
    });
  }
});
