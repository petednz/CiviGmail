function refresh(f) {
  if( (/in/.test(document.readyState)) || (typeof Gmail === "undefined")) {
    setTimeout('refresh(' + f + ')', 10);
  } else {
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
  var url = 'https://cms46.loc/civicrm/gmail/logactivity?email=gopi@gmail.com';

  var xhr = createCORSRequest('GET', url);
  if (!xhr) {
    console.log('CORS not supported');
    return;
  }

  // Response handlers.
  xhr.onload = function() {
    var text = xhr.responseText;
    var title = getTitle(text);
    console.log('Response from CORS request to ' + url + ': ' + title);
  };

  xhr.onerror = function() {
    console.log('Woops, there was an error making the request.');
  };

  xhr.send();
}

// function to display confirmation screen
//function confirmation (data) {
//  gmail.tools.add_modal_window('Record activity on Civi', 'Do you want to record this activity on Civi?',
//  function() {
//    getCiviData(data);
//    gmail.tools.remove_modal_window();
//  });
//}

// function to get Civi Data
function getCiviData() {
  //console.log('data in get civi data', data);

  $.ajax({
      method: 'GET',
      url: 'https://cms46.loc/civicrm/gmail/logactivity',
      //data: {},
      dataType: "text",
      crossDomain: true,
      success: function (data, textStatus ) {
        result = JSON.parse(data);
        console.log('success call data', result);
        // show details on a popup
        displayData(result);
      },
      error: function(xhr, textStatus, errorThrown){
        console.log('error test', xhr);
      }
  }); // End of get Civi Data ajax call
}

// function to display the result received frmo Civi
function displayData(result) {
  console.log('rersult in display result', result);
  if (!result.is_loggedin && result.message != '') {
    gmail.tools.add_modal_window('Civi Result', result.message);
    return;
  }

  //if (!result.is_error && result.values != '') {
  //  contactDetails = result.values[0];
  //  $html = '<div>Name : '+ contactDetails.display_name +'</div>'+
  //          '<div>Email : '+contactDetails.email+'</div>'+
  //          '<div>Contact ID : '+contactDetails.id+'</div>';

  //  gmail.tools.add_modal_window('Civi Result', $html);
  //}
}
