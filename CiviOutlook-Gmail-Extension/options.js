// Saves options to chrome.storage
function save_options() {
  var civiUrl = document.getElementById('civiUrl').value;
  var civioAuthUrl = document.getElementById('civioAuthUrl').value;
  chrome.storage.sync.set({
    civiUrl: civiUrl,
    civioAuthUrl: civioAuthUrl
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 1000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    //civiUrl: 'https://example.org/civicrm',
    civiUrl: 'https://mailchimp.vedaconsulting.co.uk/civicrm',
    //civioAuthUrl: 'https://example.org/oauth2/authorize'
    civioAuthUrl: 'https://mailchimp.vedaconsulting.co.uk/oauth2/authorize'
  }, function(items) {
    document.getElementById('civiUrl').value = items.civiUrl;
    document.getElementById('civioAuthUrl').value = items.civioAuthUrl;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
