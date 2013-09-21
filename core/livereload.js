(function(){
  var sock = new SockJS('/livereload');
  sock.onmessage = function(e) {
    location.reload();
  };
  sock.onclose = function() {
    location.reload();
  };
})();