<?php

class CRM_Gmailapi_Page_AJAX {

  static function authenticate(){

    $result = array();
    $email = '';
    $processAttachment= FALSE;

    // function to validate token
    // $isValidUser = validateUser();
    // FIXME ::: setting validuser to true & assign source contact for now
    $isValidUser = TRUE;
    // FIX ME: get source contacts api key and assign it into the request
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
      CRM_Core_Error::debug_var('API $params', $params);
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
          CRM_Core_Error::debug_var('$attachment in final act result ', $attachments);
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


  // static function authenticate() {

  //   CRM_Core_Error::debug_var('$_REQUEST', $_REQUEST);

  //   $params = array();
  //   foreach ($_GET as $key => $value) {
  //     $params[$key] = $value;
  //   }

  //   CRM_Core_Error::debug_var('$params', $params);

  //   $contactResult = civicrm_api3('Contact', 'get', array(
  //     'sequential' => 1,
  //     'email' => "workatveda@gmail.com",
  //   ));

  //   CRM_Core_Error::debug_var('contact $result', $contactResult);

  //   return $contactResult;

  //   exit();

  //   $output = array();
  //   CRM_Core_Error::debug_var('$_REQUEST', $_REQUEST);

  //   // $result = self::authorizationCodeRequest('token');
  //   // //$this->assertEqual($result->code, 302, 'The implicit flow request completed successfully');
  //   // $redirect_url_parts = explode('#', $result->redirect_url);
  //   // $response = drupal_get_query_array($redirect_url_parts[1]);
  //   // //$this->assertTokenResponse($response, FALSE);

  //   $verification_url = url('oauth2/tokens/' . $_REQUEST['oauth_token'], array('absolute' => TRUE));//, 'query' => array('scope' => 'gmail_extension')));
  //   CRM_Core_Error::debug_var('$verification_url', $verification_url);
  //   $result = self::httpRequest($verification_url);
  //   CRM_Core_Error::debug_var('$result', $result);
  //   $verification_response = json_decode($result->data);
  //   CRM_Core_Error::debug_var('$verification_response', $verification_response);

  //   if ($result->code == '200' && !empty($verification_response->user_id) && ($verification_response->access_token == $_REQUEST['oauth_token'])) {
  //     // consider logged IN
  //     $output[] = 'logged IN';

  //     // DS: to programmatically force user login. It also initializes civi
  //     //$form_state = array();
  //     //$form_state['uid'] = $verification_response->user_id;
  //     //CRM_Core_Error::debug_var('$form_state', $form_state);
  //     //user_login_submit(array(), $form_state);
  //   } else {
  //     $output[] = 'logged OUT';
  //   }

  //   /*
  //   $loggedIn = FALSE;

  //   //check session to check the login status
  //  /* $session =& CRM_Core_Session::singleton();
  //   $userID = $session->get('ufID');

  //   // ask user to log in to Civi, if they haven't logged in yet
  //   if (isset($userID) || !empty($userID)) {
  //     $loggedIn = TRUE;
  //   }else {
  //     $response['is_loggedin'] = $loggedIn;
  //     $response['message'] = 'Please Login to your Civi in another tab to continue!';
  //     CRM_Utils_JSON::output($response);
  //     CRM_Utils_System::civiExit();
  //   }*/

  //   // test


  //    $loggedIn = TRUE;


  //   if (isset($_GET['email']) && !empty($_GET['email']) && $loggedIn) {
  //     $email = $_GET['email'];

  //     $response = _civicrm_api3_civi_gmailapi_civicrm_api_wrapper('Contact', 'get', array('email' => $email));
  //   } else {
  //     $loggedIn = FALSE;
  //     $response['message'] = 'Some technical error. Please contact admin!';
  //   }
  //   $response['is_loggedin'] = $loggedIn;

  //   CRM_Core_Error::debug_var('$_SERVER', $_SERVER);
  //   // FOR GMAIL CORS request - Request header field Access-Control-Allow-Origin is not allowed by Access-Control-Allow-Headers in preflight response.
  //   if (isset($_SERVER['HTTP_ORIGIN'])) {
  //     header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
  //     header('Access-Control-Allow-Credentials: true');
  //     header('Access-Control-Max-Age: 86400');    // cache for 1 day
  //   }
  //   if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
  //     if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
  //       header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

  //     if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
  //       header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
  //   }
  //   CRM_Utils_JSON::output($output);
  //   CRM_Utils_System::civiExit();
  // }

  // /**
  //  * Performs an authorization request and returns it.
  //  *
  //  * Used to test authorization, the implicit flow, and the authorization_code
  //  * grant type.
  //  *
  //  * @return
  //  *   The return value of $this->httpRequest().
  //  */
  // static function authorizationCodeRequest($response_type, $scope = NULL) {
  //   $clientId = 'client123id';
  //   $query = array(
  //     'response_type' => $response_type,//code, token
  //     'client_id' => $clientId,
  //     'state' => drupal_get_token($clientId),
  //     // The "authorized" url doesn't actually exist, but we don't need it.
  //     'redirect_uri' => url('authorized', array('absolute' => TRUE)),
  //     // OpenID Connect requests require a nonce. Others ignore it.
  //     'nonce' => 'test',
  //     'scope' => 'gmail_extension',
  //   );

  //   $authorize_url = url('oauth2/authorize', array('absolute' => TRUE, 'query' => $query));
  //   return self::httpRequest($authorize_url);
  // }

  // /**
  //  * Performs a drupal_http_request() with additional parameters.
  //  *
  //  * Passes along all cookies. This ensures that the test user has access
  //  * to the oauth2 endpoints.
  //  *
  //  * @param $url
  //  *   $url: A string containing a fully qualified URI.
  //  * @param $options
  //  *   The options array passed along to drupal_http_request().
  //  *
  //  * @return
  //  *   The result object as returned by drupal_http_request().
  //  */
  // static function httpRequest($url, array $options = array()) {
  //   // Forward cookies.
  //   $cookie_string = '';

  //   //foreach ($this->cookies as $name => $data) {
  //   //  $cookie_string .= $name . '=' . $data['value'] . ';';
  //   //}

  //   $options['headers']['Cookie'] = $cookie_string;

  //   // Set other general options.
  //   $options += array(
  //     'max_redirects' => 0,
  //   );

  //   return drupal_http_request($url, $options);
  // }
}
