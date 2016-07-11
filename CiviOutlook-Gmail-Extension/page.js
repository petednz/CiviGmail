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
}
refresh(main);

function reConnect() {
  //detail could be used to pass more info
  document.dispatchEvent(new CustomEvent('content_reconnect', {detail: {'action' : 'reconnect'}}));
}
