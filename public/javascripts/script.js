// Init scrollers
(function(window, document){
  var scrollers = document.getElementsByClassName('scroller'),
    length = scrollers.length,
    i = 0;
  function makeScroller(scrollToPath) {
    return function(){
      var path = scrollToPath;
      scrollTo(window, document.getElementById(path).offsetTop, 1000);
      window.history.pushState({path: path}, ('bbbench ' + path), '/#' + path);
    };
  }
  for (; i < length; i++) {
    scrollers[i].onclick = makeScroller(scrollers[i].dataset.scrollTo);
  }
})(this, this.document);

function dismissAlert(elem){
  elem.innerHTML = '';
  document.getElementById('messages').style.display = 'none';
}

// Set up sockets
window.socket = io.connect(window.location.hostname);