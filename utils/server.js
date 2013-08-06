

var http = require("http")
  , https = require("https")
  , url = require("url")
  , path = require("path")
  , fs = require("fs")
  ;



var Server = module.exports = function(path, port, proxyDomain){
  this.path =         path        || process.cwd();
  this.port =         port        || 8080;

  proxyDomain =       proxyDomain || null;
  if(proxyDomain){
    this.proxy = {
      hostname: proxyDomain.indexOf(':') === -1 ? proxyDomain : proxyDomain.substr(0, proxyDomain.indexOf(':'))
    , port:     proxyDomain.indexOf(':') === -1 ? '80'        : proxyDomain.substr(proxyDomain.indexOf(':')+1)
    };
  }

  this.cbs = {};
};



Server.prototype.get = function(path, cb){
  this.cbs['get-'+path] = cb;
};



Server.prototype.start = function(){
  var that = this;

  function makeNDigits(str, nb, separator, before){
    separator = separator || ' ';
    if(before) {
      str = ((new Array(nb)).join(separator) + str);
      return str.substr(str.length - nb);
    } else return (str + (new Array(nb)).join(separator)).substr(0,nb);
  }

  function  getTimeStamp(){
    var now = new Date();
    return (
        now.getUTCFullYear()
      + '-'
      + makeNDigits(now.getUTCMonth(), 2, '0', true)
      + '-'
      + makeNDigits(now.getUTCDate(), 2, '0', true)
      + ' '
      + makeNDigits(now.getUTCHours(), 2, '0', true)
      + '-'
      + makeNDigits(now.getUTCMinutes(), 2, '0', true)
      + '-'
      + makeNDigits(now.getUTCSeconds(), 2, '0', true)
      + '.'
      + makeNDigits(now.getUTCMilliseconds(), 4, '0', true)
    );
  }

  function logEntry(type, req, res){
    console.log(
        '['+getTimeStamp()+']'            // DATE
      + ' - '
      + makeNDigits(type, 6)              // TYPE
      + ' - '
      + makeNDigits(res.statusCode, 3)    // HTTP STATUS CODE
      + ' - '
      + req.connection.remoteAddress      // IP
      + ' - '
      + req.method+' '+req.url            // URL
    );
  }


  // static server 
  function staticServer(request, response) {
    var uri = url.parse(request.url).pathname
      , filename = path.join(that.path, uri)
      ;
    
    if(that.cbs['get-'+uri]){
      that.cbs['get-'+uri](request, response);
      return;
    }

    fs.exists(filename, function(exists) {
      if(!exists) {
        proxyServer(request, response);
        return;
      }
   
      if (fs.statSync(filename).isDirectory()) filename += '/index.html';
   
      fs.readFile(filename, "binary", function(err, file) {
        if(err) {
          response.writeHead(500, {"Content-Type": "text/plain"});
          response.write(err + "\n");
          response.end();
          logEntry('STATIC', request, response);
          return;
        }

        if(filename.substr(filename.length-4) === '.css'){
          response.writeHead(200, {"Content-Type": "text/css"});
        } else if(filename.substr(filename.length-3) === '.js'){
          response.writeHead(200, {"Content-Type": "text/javascript"});
        } else if(filename.substr(filename.length-5) === '.html'){
          response.writeHead(200, {"Content-Type": "text/html"});
        } else {
          response.writeHead(200);
        }
        response.write(file, "binary");
        response.end();
        logEntry('STATIC', request, response);
      });
    });
  }

  // error 404
  function error404(req,res) {
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.write("404 Not Found\n");
    res.end();
    logEntry('PROXY', req, res);
    return;
  };

  // static server 
  function proxyServer(req,res) {

    if(that.proxy){

      var options = {
        hostname:   that.proxy.hostname,
        port:       that.proxy.port,
        path:       req.url,
        method:     req.method,
        headers:    req.headers
      };

      options.headers.host = that.proxy.hostname + ':' + that.proxy.port;

      var proxy = (that.proxy.port == '443' ? https : http).request(options, function(proxy_response){

        // parse cookies
        var headers = proxy_response.headers;
        if(headers && headers['set-cookie']){
          headers['set-cookie'].forEach(function(str, index, array){
            array[index] = str.replace(/domain=([^;]+);/, '');
          });
        }

        //send headers as received
        res.writeHead(proxy_response.statusCode, headers);

        //easy data forward
        proxy_response.addListener('data', function(chunk) {
          res.write(chunk, 'binary');
        });

        //response received
        proxy_response.addListener('end', function() {
          res.end();
          logEntry('PROXY', req, res);
        });
      });

      proxy.on('error', function(err){
        error404(req, res);
      });
      
      //proxies to SEND request to real server
      req.addListener('data', function(chunk) {
        proxy.write(chunk, 'binary');
      });

      req.addListener('end', function() {
        proxy.end();
      });
    } else {
      error404(req, res);
    }

  }

  that._server = http.createServer(staticServer).listen(that.port);
  console.log("Static file server running at\n  => http://localhost:" + that.port + "/\nCTRL + C to shutdown");
};



Server.prototype.stop = function(cb){
  if(this._server && this._server.close){
    this._server.close(cb);
    this._server = null;
  }
};


