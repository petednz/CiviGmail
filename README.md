# CiviGmail
Gmail Chrome Extension to communicate with CiviCRM inorder to file emails as activities in CiviCRM.

https://d7,civicrm.org/blog/deepaksrivastava/civigmail-integration-with-gmail

CiviGmail is a chrome extension for Gmail, which allows Gmail to directly interact with CiviCRM via OAuth2. Once authorized emails can be filed as activities in CiviCRM. Idea is to support same set of features like CiviOutlook, reusing its apis.

# Features
Record emails from Gmail inbox against CiviCRM contacts
Use email address deduplication to attach emails to the correct contact including creation of a new contact if they don't exist.
Prompts for duplicate contacts so that user can select which ones they want to create the activity with.
Supports multiple attachments

# Prerequisites
Setup OAuth2 Server on your civi site - https://www.drupal.org/project/oauth2_server.
Download and install civicrm extensions - gmailapi and outlookapi on civi site, where you want activities to be created -
https://github.com/veda-consulting/uk.co.vedaconsulting.gmailapi/releases/latest
https://github.com/veda-consulting/uk.co.vedaconsulting.outlookapi/releases/latest
Setting Up OAuth2 on Civi Site (Drupal)
Download and install drupal module - https://www.drupal.org/project/oauth2_server.
Enable the OAuth2 server module.

Create a server. Go to admin/structure/oauth2-servers and create a server. Leave the default values in settings, they will be explained later.

Create a scope. Click the "scopes" link, and you will be taken to the scopes listing page. Make sure you have at least one scope with label as “civigmail_extension”. Description could be anything say “CiviGmail Scope”.

A client is an application requesting authorization from the resource owner (logged-in user on your website). In our its going to be CiviGmail user.
Client ID. This could be set to chrome extension ID “egjglhooblpbneakhiphjdicboojpamj”.
Client Secret. Set this to some key that you going to share with CiviGmail users. The Client ID and Client Secret can be thought of as the client username and password. The client id is considered public information while the client secret must be kept private at all cost.
Redirect URI. Set this to “https://egjglhooblpbneakhiphjdicboojpamj.chromiumapp.org/”

Give permission for using the OAuth2 Server. In admin/people/permissions, in section OAuth2 Server, check the permission Use OAuth2 Server (Use OAuth2 Server for authorization.) for anonymous users.
You are now ready to handle authorization requests.
Setting Up CiviGmail for Chrome
From your chrome browser visit - https://chrome.google.com/webstore/detail/civigmail/egjglhooblpbneakhiphjdicboojpamj?hl=en-GB&gl=GB&authuser=1 and click “ADD TO CHROME”.
Agree to permission prompt and click “Add Extension”.
Visit extensions page in your chrome browser - chrome://extensions/.

Locate CiviGmail and click options. Specify url options and save:
CiviCRM URL e.g https://example.org/civicrm
CiviCRM OAuth URL e.g: https://example.org/oauth2/authorize
CiviCRM OAuth Secret. Set it to a value set as Client Secret on the civi site.

Go to your gmail. Make sure to reload your gmail by visiting - https://mail.google.com (without any # params).
On load you will see two buttons “Connect Civi” and “Record Activity”.

Initiate OAuth by clicking “Connect Civi” button. This will trigger a new pop-up where you will need to enter site username and password, followed by “Yes, I want to authorize this request” button.

Once authorized, click select any email from inbox, and click “Record Activity” to file it in Civi.

#Known Issues
Its an initital release that only works with Inbox for now.
Limited to Drupal at this point due to OAuth2. We exploring other CMS.
