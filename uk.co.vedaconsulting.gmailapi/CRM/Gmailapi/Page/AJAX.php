<?php

class CRM_Gmailapi_Page_AJAX {
  static function authenticate() {

    $response = array();
    $loggedIn = FALSE;

    //check session to check the login status
   /* $session =& CRM_Core_Session::singleton();
    $userID = $session->get('ufID');

    // ask user to log in to Civi, if they haven't logged in yet
    if (isset($userID) || !empty($userID)) {
      $loggedIn = TRUE;
    }else {
      $response['is_loggedin'] = $loggedIn;
      $response['message'] = 'Please Login to your Civi in another tab to continue!';
      CRM_Utils_JSON::output($response);
      CRM_Utils_System::civiExit();
    }*/

    // test
     $loggedIn = TRUE;


    if (isset($_GET['email']) && !empty($_GET['email']) && $loggedIn) {
      $email = $_GET['email'];

      $response = _civicrm_api3_civi_gmailapi_civicrm_api_wrapper('Contact', 'get', array('email' => $email));
    } else {
      $loggedIn = FALSE;
      $response['message'] = 'Some technical error. Please contact admin!';
    }
    $response['is_loggedin'] = $loggedIn;
    CRM_Utils_JSON::output($response);
    CRM_Utils_System::civiExit();


  }
}
