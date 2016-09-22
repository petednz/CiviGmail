var gmail;

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
  gmail = new Gmail();
  bttn = gmail.tools.add_toolbar_button('Connect Outlook' , reConnect);
  bttn.addClass('coge_bttn_container');

  $userEmail = gmail.get.user_email();
  console.log("user email : ", $userEmail);

  // Add button to record received email data
  gmail.tools.add_toolbar_button('Record Activity' , recordActivityFromInbox);

  // on Email sent
  gmail.observe.after("send_message", recordActivityOnEmailsent);
}
refresh(main);

// Function to record activity for selcted email
function recordActivityFromInbox(){
  // get slected emails data
  var selectedEmailsData = gmail.get.selected_emails_data();
  console.log('selectedEmailsData', selectedEmailsData);

  if (selectedEmailsData.length > 0) {
    for (var i = 0; i < selectedEmailsData.length; i++) {
      console.log('selectedEmailsData[i]', selectedEmailsData[i]);
      // get the last email id from the thread
      var latestEmailId = selectedEmailsData[i].last_email;
  
      // get the email data of the last email from the thread
      for(var key in selectedEmailsData[i].threads){
        if (key == latestEmailId) {
          var emailData = selectedEmailsData[i].threads[key];
        }
      }

      // get required values to pass to civi
      var email = emailData.from_email;
      var emailSubject = emailData.subject;
      var emailBody = emailData.content_plain;

      // get attachments, if any
      //var emailAttachments = [];
      //if (emailData.attachments.length > 0) {

      //  for (var key in emailData.attachments) {
      //    // attached file name
      //    var fileName = emailData.attachments[key];

      //    // get file source URL
      //    // https://mail.google.com/mail/u/0/?ui=2&ik={ik_value}&view=att&th={message_id}&attid=0.{atachment_index}&disp=safe&zw
      //    var ik = gmail.tracker.ik;
      //    var id = latestEmailId;
      //    var aid = key+1; // gets the first attachment
      //    var fileUrl = "https://mail.google.com/mail/u/0/?ui=2&ik=" + ik + "&view=att&th=" + latestEmailId + "&attid=0." + aid + "&disp=safe&zw";

      //    // attached file object
      //    var attachedFile = {name:fileName, url:fileUrl};

      //    // push attachedFile into emailAttachment array
      //    emailAttachments.push(attachedFile);

      //  }
      //}
      // call log activity API
      var params = {email_id: latestEmailId, email: email, subject: emailSubject, email_body: emailBody};
      document.dispatchEvent(new CustomEvent('content_civiurl', {detail: params}));
    }
  } else{
    // if no emails selected, instruct to select one
    console.log('no emails selected');
    alert('select atleast one email to continue');
  }
}

// Function to collect details and pass on Email sent
function recordActivityOnEmailsent(url, body, data, response, xhr){
  console.log('data', data);
  // array of recipient email addresses
  var emailAddresses = [];
  emailAddresses = data.to;

  // get email details
  var emailSubject = data.subject;
  // FIX ME : email body appears with html tags
  var emailBody = data.body;
  var emailAttachments = [];

  for (var i = 0; i < emailAddresses.length; i++) {
    // email sent action returns an empty value in To emails array
    // therefore, proceeding only if it is not empty
    if (emailAddresses[i] != '') {
      // call log activity api in civi
      var params = {email_id: '', email : emailAddresses[i], subject: emailSubject, email_body: emailBody};
      document.dispatchEvent(new CustomEvent('content_civiurl', {detail: params}));
    }
  }
}

// Event listener for event raised in content
document.addEventListener('page_civiurl', function(e) {
  callActivityConfirmation(e.detail.result, e.detail.params);
});

// Process HTTP response and call relevant confirmation screens
function callActivityConfirmation(result, params){
  console.log("callActivityConfirmation");
  console.log(result);
  console.log(params);

  // Display error message and exit, if any
  if (result.is_error) {
    displayErrorMessage(result.error_message);
    return;
  }

  // if single contact exists in Civi
  if (result.singleContactExists) {
    // convert contact Id into integer and assign into api param as ot_target_contact_id
    params['ot_target_contact_id'] = parseInt(result.singleContactExists);
    console.log('single contact found in civi : ', result);
    // display Activity Confirmation screen
    activityConfirmationScreen(params);
  }

  // if single contact created in Civi
  if (result.singleContactCreated) {
    // convert contact Id into integer and assign into api param as ot_target_contact_id
    params['ot_target_contact_id'] = parseInt(result.singleContactCreated);
    console.log('single contact created in civi : ', result);
    // display Activity Confirmation screen
    activityConfirmationScreen(params);
  }

  // if multiple contacts exists in Civi
  if (result.count && result.count > 1) {

    var duplicateContacts = result.values;
    console.log('duplicate contacts found in civi : ', duplicateContacts);
    // select form HTML
    var selectForm = '<div>Select one contact from the list below</div>';
    for (var key in duplicateContacts) {
        // add each contact as option to select
        selectForm = selectForm + '<div><input type="radio" name="contact_id" value='+key+'> '
        +duplicateContacts[key].sort_name
        +'</div>';
    }
    selectForm = selectForm + '</form>';
    // END of select form HTML

    // display Duplicate contacts with option to select
    displayDuplicateContacts(selectForm, params);
  }

  // if id found in result, activity has been created
  if (result.id) {
    // TODO : Display message
  }

}

// Function to display Duplicate Contacts
function displayDuplicateContacts(selectForm, params){
  console.log('displaying duplicate contacts . . .');
   gmail.tools.add_modal_window('Duplicate Contacts found', selectForm, function(){
    params['ot_target_contact_id'] = $('input[name="contact_id"]:checked').val();
    // display Activity Confirmation screen
    activityConfirmationScreen(params);
    // remove model window on Click OK
    gmail.tools.remove_modal_window();
  });
}


// Function to Display Activity Confirmation screen
function activityConfirmationScreen(params){
  console.log('displaying confirmation screen ', params);
  var formCSS = '<style>'
  +'.gopi{color:red;}'
  +'div{margin-top:5px;}'
  +'</style>'
  ;

  var confirmationForm = '<form>'
  +'<div>Subject:</div>'
  +'<textarea name="subject" rows="1" cols="50">'
  + params.subject
  +'</textarea>'
  +'<div>Details:</div>'
  +'<textarea name="email_body" rows="10" cols="50">'
  + params.email_body
  +'</textarea>'
  +'<br><br>'
  +'</form>'
  ;

  var formHtml = formCSS+confirmationForm;

  gmail.tools.add_modal_window('Create Activity', formHtml, function(){
    // assign form submitted values to params
    params['subject'] = $('textarea[name="subject"]').val();
    params['email_body'] = $('textarea[name="email_body"]').val();
    console.log('creating activity', params);

    document.dispatchEvent(new CustomEvent('content_gmailapi', {detail: params}));

    // remove model window on Click OK
    gmail.tools.remove_modal_window();
  });
}

// Function to display Error message
function displayErrorMessage(errorMessage){
  var errorMessage = '<div>'+ errorMessage +'</div>';
  gmail.tools.add_modal_window('Error', errorMessage, function(){
    // remove model window on Click OK
    gmail.tools.remove_modal_window();
  });
}

function reConnect() {
  //detail could be used to pass more info
  document.dispatchEvent(new CustomEvent('content_reconnect', {detail: {'action' : 'reconnect'}}));
}
