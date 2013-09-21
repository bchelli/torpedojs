

var sockjs = require('sockjs');

var LiveReload = module.exports = function(){
  var that = this;

  // init connection pool
  that.pool = {};

  // create the web socket server
  that.ws = sockjs.createServer();

  // listen to new connections
  that.ws.on('connection', function(conn) {
    pushConn.call(that, conn);
    conn.on('close', function() {
      popConn.call(that, conn);
    });
  });
}

LiveReload.prototype.installHandlers = function(server) {
  this.ws.installHandlers(server, {prefix:'/livereload'});
};

LiveReload.prototype.setVersion = function(version) {
  if(this.version !== version){
    this.version = version;
    for(var id in this.pool){
      this.pool[id].write(version);
    }
  }
};


/*
 * HELPERS
 */
var pushConn = function(connection){
  if(!this.pool[connection.id]){
    this.pool[connection.id] = connection;
  }
};
var popConn = function(connection){
  if(this.pool[connection.id]){
    delete this.pool[connection.id];
  }
};
