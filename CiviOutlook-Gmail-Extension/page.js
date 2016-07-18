function refresh(f) {
  if((/in/.test(document.readyState)) || (undefined === window.Gmail) || (undefined === window.jQuery)) {
    console.log('waiting for 10 sec');
    setTimeout('refresh(' + f + ')', 1000);
  } else {
    console.log('calling main()');
    f();
  }
}

var main = function() {
  var gmail = new Gmail();
  bttn = gmail.tools.add_toolbar_button('Connect Outlook' , reConnect);
  bttn.addClass('coge_bttn_container');

  // add test button on Gmail tool bar TEST
  gmail.tools.add_toolbar_button('Fetch Civi Data' , makeCorsRequest);
}
refresh(main);

function reConnect() {
  //detail could be used to pass more info
  document.dispatchEvent(new CustomEvent('content_reconnect', {detail: {'action' : 'reconnect'}}));
}

// Create the XHR object.
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // XHR for Chrome/Firefox/Opera/Safari.
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // CORS not supported.
    xhr = null;
  }
  return xhr;
}

// Make the actual CORS request.
function makeCorsRequest() {
  // All HTML5 Rocks properties support CORS.
  var url = 'https://cms46.loc/civicrm/gmail/logactivity';

  var xhr = createCORSRequest('GET', url);
  if (!xhr) {
    console.log('CORS not supported');
    return;
  }

  // Response handlers.
  xhr.onload = function() {
    var text = xhr.responseText;
    //var title = getTitle(text);
    console.log('Response from CORS request to ' + url + ': ' + text);
  };

  xhr.onerror = function() {
    console.log('Woops, there was an error making the request.');
  };

  xhr.send();
}
