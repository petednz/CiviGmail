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

  // Function to call outlook API
  static function callOutlookApi(){

    $result = array();
    $email = '';
    $processAttachment= FALSE;

    // function to validate token
    // $isValidUser = self::authenticate();
    // FIXME ::: setting validuser to true & assign source contact for now
    $isValidUser = TRUE;
    // FIX ME:
    // outlook api need api_key in the request
    // get source contacts api key and assign it into the request
    // getApiKey();
    $_REQUEST['api_key'] = 'server123';

    if ($isValidUser) {

      $params = array();
      // if email address found, assign params to call activty API
      if (isset($_REQUEST['email'])) {
        // extract valid email address from the email string : Eg: Gopi Krishna <gopi@vedaconsulting.co.uk>
        $email = self::extractValidEmail($_REQUEST['email'], '<', '>');
        $params['email'] = $email;
      }
      if (isset($_REQUEST['subject'])) {
        $params['subject'] = $_REQUEST['subject'];
      }
      if (isset($_REQUEST['email_body'])) {
        $params['email_body'] = $_REQUEST['email_body'];
      }
      if (isset($_REQUEST['ot_target_contact_id'])) {
        $params['ot_target_contact_id'] = $_REQUEST['ot_target_contact_id'];
      }
      // if email attachment not empty, set process attchment true
      if (isset($_REQUEST['email_attachment']) && !empty($_REQUEST['email_attachment'])) {
        $processAttachment = TRUE;
        $params['attachment'] = $_REQUEST['email_attachment'];
      }

      // FIX ME : using email activity type id for now
      $params['activity_type_id'] = 3;

    } else{
      $result['is_error'] = 1;
      $result['message'] = 'Please authenticate your Gmail with Civi';
      // return API result with error message, if not a valid user
      self::returnApiResult($result);
    }

    // if valid email address found, continue with log activity API call
    if (!empty($email) && !empty($params) ) {
      CRM_Core_Error::debug_var('Params received from ajax', $params);
      // call createactivity API in outlook API extension
      $result = civicrm_api3('CiviOutlook', 'createactivity', $params);

      // Process Attachment, if activity created and attachments found in the request
      if ($result['id'] && $processAttachment){
        $attachments = $params['attachment'];
        if(!empty($attachments)){

          // TO DO : Process attachments
          foreach ($attachments as $key => $value) {
            # code...
          }
          CRM_Core_Error::debug_var('attachment in final activity result ', $attachments);
        }
      }

      // return API response received from outlook API
      self::returnApiResult($result);

    } else{
      $result['is_error'] = 1;
      $result['message'] = 'No Valid email address found to record activity';
      // return API result with error message, if no valid email found
      self::returnApiResult($result);
    }

  }

  // Function to return the API results back to extension
  static function returnApiResult($result){
    CRM_Core_Error::debug_var('API $result', $result);
    CRM_Utils_JSON::output($result);
    CRM_Utils_System::civiExit();
  }

  // Function to to extract valid email addres from email string
  static function extractValidEmail($string, $start, $end){
    $pos = stripos($string, $start);
    // return the actual email string, if '<' not found in the email string
    if ($pos == '') {
      return $string;
    }

    $str = substr($string, $pos);

    $str_two = substr($str, strlen($start));

    $second_pos = stripos($str_two, $end);

    $str_three = substr($str_two, 0, $second_pos);

    $unit = trim($str_three); // remove whitespaces

    return $unit;
  }


}
