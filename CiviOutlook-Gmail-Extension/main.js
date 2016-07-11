var gmail;
var serverUrl = 'https://mailchimp.vedaconsulting.co.uk/civicrm/gmail/logactivity';


function refresh(f) {
  if( (/in/.test(document.readyState)) || (typeof Gmail === undefined) ) {
    setTimeout('refresh(' + f + ')', 10);
  } else {
    f();
  }
}


var main = function(){
  // NOTE: Always use the latest version of gmail.js from
  // https://github.com/KartikTalwar/gmail.js
  gmail = new Gmail();
  console.log('Hello,', gmail.get.user_email());

  // add setting button on Gmail tool bar TEST
  gmail.tools.add_toolbar_button('Veda CRM' , settings);

  // Call email sent function after sending the email
  gmail.observe.after("send_message", emailsent);

  // add test button on Gmail tool bar TEST
  gmail.tools.add_toolbar_button('Test Button' , confirmation);

  // Storage TEST
  gmail.tools.add_toolbar_button('Store' , settingscreen);


}


refresh(main);


function settingscreen() {

  var param = 'testes';
  utils.signIn(param);

  // var utils = new utils();
  // utils.signIn('testes pass');
 /* utils.signIn(
      location.hostname, // the app's ID
      'JP3SRNV00FA1P11W0PHONEUDRQJVSCNODBTCGBKSOPSXIVMX', // Foursquare API client ID
      initUi,
      function(error) {
        console.log('Sign-in error: ' + error);
      });*/
}



function saveSettings() {
  // Get a value saved in a form.
  // var theValue = textarea.value;
  var apikey = 'ioioioiuiuuiapi';
  var sitekey = ',jhkjgsitekey';
  if (apikey == '' || sitekey == '') {
    console.log('sitekey or api is empty');
    return;
  }
  settings = JSON.stringify({
    'apikey': apikey,
    'sitekey': sitekey
  });
  console.log(settings);
  // Check that there's some code there.
  if (!settings) {
    message('Error: No value specified');
    return;
  }
  // Save it using the Chrome extension storage API.
  chrome.storage.sync.set({'Settings': settings}, function() {
    // Notify that we saved.
    message('Settings saved');
    console.log('Settings Saved', settings);
  });
}

function getSettings(){

  // document.body.onload = function() {
    chrome.storage.sync.get("settings", function(items) {
      if (!chrome.runtime.error) {
        console.log(items);
        // document.getElementById("data").innerText = items.data;
      }
    });
  // }

 /* chrome.storage.sync.get(settings, function(settings) {
    console.log('Settings retrieved', settings);
  });*/

}











// storage test
function storage() {
  window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

  window.requestFileSystem(window.PERSISTENT, 5*1024*1024 /*5MB*/, onInitFs, errorHandler);
}

function onInitFs(fs) {

  /*fs.root.getDirectory('VedaExt', {create: true}, function(dirEntry) {*/

    fs.root.getFile('veda.txt', {}, function(fileEntry) {

      // Create a FileWriter object for our FileEntry (log.txt).
      /*fileEntry.createWriter(function(fileWriter) {

        fileWriter.onwriteend = function(e) {
          console.log('Write completed.');
        };

        fileWriter.onerror = function(e) {
          console.log('Write failed: ' + e.toString());
        };

        // Create a new Blob and write it to log.txt.
        var blob = new Blob(['Gopi Test fddfdfsdfsdfsdfsd'], {type: 'text/plain'});

        fileWriter.write(blob);

      }, errorHandler);*/

      // then use FileReader to read its contents.
      fileEntry.file(function(file) {
         var reader = new FileReader();

         reader.onloadend = function(e) {
           console.log(this.result);
         };

         reader.readAsText(file);
      }, errorHandler);



    }, errorHandler);


    console.log('Opened file system: ' + fs.name);

 /* }, errorHandler);*/

}

function errorHandler(e) {
  var msg = '';
  console.log('e'+e.name);
  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  };

  console.log('Error: ' + msg);
}


function setup(handler) {
  window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
  requestFileSystem(
    window.PERSISTENT,
    1024*1024,
    function(fs) {
      fs.root.getDirectory(
        "checkins",
        {}, // no "create" option, so this is a read op
        function(dir) {
          checkinsDir = dir;
          handler();
        },
        function() {
          fs.root.getDirectory(
            "checkins",
            {create: true},
            function(dir) {
              checkinsDir = dir;
              handler();
            },
            onError
          );
        }
      );
    },
    function(e) {
      console.log("error "+e.code+"initialising - see http://goo.gl/YW0TI");
    }
  );
}








// function to trigger after sending email
var emailsent = function (url, body, data, response, xhr) {
  console.log("message sent", "url:", url, 'body', body, 'email_data', data, 'response', response, 'xhr', xhr);

  // pass data to the confirmation function
  confirmation(data);

  /*var emailcontent = 'Email Subject : '+ data.subject +'</br> Email Body : '+ data.body;
  var toemails = '';
  $.each( data.to, function( key, value ) {
    if (value != '') {
      toemails = toemails+'<div> To Email : '+value+'</div>';
    }
  });
  var message = 'Do you want to continue?';
  emailcontent = emailcontent + toemails + message;
  gmail.tools.add_modal_window('Do you want to record this on Civi ?', emailcontent, saved(data));*/
}

// function to display confirmation screen
function confirmation (data) {
  //test
  data = 'gopi@gmail.com';
  // end of test
  console.log('confirmation screen', data);

  gmail.tools.add_modal_window('Record activity on Civi', 'Do you want to record this activity on Civi?',
  function() {
    getCiviData(data);
    gmail.tools.remove_modal_window();
  });
}



// function to get Civi Data
function getCiviData(data) {
  console.log('data in get civi data', data);

  $.ajax({
      method: 'GET',
      url: serverUrl,
      data: {email: data},
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

  if (!result.is_error && result.values != '') {
    contactDetails = result.values[0];
    $html = '<div>Name : '+ contactDetails.display_name +'</div>'+
            '<div>Email : '+contactDetails.email+'</div>'+
            '<div>Contact ID : '+contactDetails.id+'</div>';

    gmail.tools.add_modal_window('Civi Result', $html);
  }
}

// Function to display setting screen and save settings
var settings = function () {
  var form = '<form><input type="password" name="apikey"><br><input type="button" value="ap" onclick="savesettings();"></form>';
  gmail.tools.add_modal_window('Veda Gmail Settings', form,
  function() {
    // getCiviData(data);
    gmail.tools.remove_modal_window();
  });
}


// function to save settings
function savesettings() {
  console.log('save setting');
  // Save it using the Chrome extension storage API.
  chrome.storage.sync.set({'value': 987654321}, function() {
    // Notify that we saved.
    message('Settings saved');
  });
}


















// function to call CiviCRM after sending email
var saved =  function (data) {
  console.log('settings saved', data);

  $.ajax({
      method: 'GET',
      url: serverUrl,
      data: {data: data},
      dataType: "text",
      crossDomain: true,
      success: function (data, textStatus ) {
        console.log('success test', data);
        data = JSON.parse(data);
        displayName = data.display_name;
        gmail.tools.add_modal_window('Contact Records', displayName, 'nothing');
      },
      error: function(xhr, textStatus, errorThrown){
        console.log('error test', xhr);
      }
  }); // End of Save Registration ID ajax call


  gmail.tools.remove_modal_window();
}


/*
BELOW CONTENTS ARE TEST
*/


/*function getCiviData(data) {
  console.log('data in clean my inbox', data);
  var civiData = makeCorsRequest(data);
  console.log('civi data received', civiData);
}*/




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

// Helper method to parse the title tag from the response.
function getTitle(text) {
  return text.match('<title>(.*)?</title>')[1];
}

// Make the actual CORS request.
function makeCorsRequest(data) {
  console.log('core request', data);
  // All HTML5 Rocks properties support CORS.
  var url = 'https://mailchimp.vedaconsulting.co.uk/civicrm/gmail/logactivity?email=gopi@gmail.com';

  var xhr = createCORSRequest('GET', url);
  if (!xhr) {
    alert('CORS not supported');
    return;
  }

  // Response handlers.
  xhr.onload = function() {
    var text = xhr.responseText;
    var title = getTitle(text);
    alert('Response from CORS request to ' + url + ': ' + title);
  };

  xhr.onerror = function() {
    alert('Woops, there was an error making the request.');
  };

  xhr.send();
}
