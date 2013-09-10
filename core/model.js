(function(){

  /*
   * INIT TORPEDO OBJECT
   */
  var Torpedo = window.Torpedo = window.Torpedo || {};


  /*
   * MODEL MANAGER
   */
  var models = {};
  Torpedo.getModelFactory = function(name){
    return models[name];
  }


  /*
   * MODEL FACTORY
   */
  var ModelFactory = Torpedo.ModelFactory = function(opts){

    // initialize the options
    this._opts    = opts = opts   || {};

    // init cache
    initCache.call(this);

    // required options
    var requiredOpts = ['name', 'url'];
    for(var i=0,l=requiredOpts.length;i<l;i++){
      var o = requiredOpts[i];
      if(typeof opts[o] == 'undefined'){
        throw new Error('Required parameter '+o+' is missing');
      }
    }

    // add to model manager
    models[opts.name] = this;

  };


  /*
   * EXTENDS WITH EVENTS
   */
  _.extend(ModelFactory.prototype, Torpedo.Events);


  /*
   * GET FUNCTION
   */
  ModelFactory.prototype.get = function(opts, forceRefresh) {
    var url = this._opts.url;
    if(_.isFunction(url)) url = _.bind(url, this)(opts);

    var result = getCache.call(this, url);

    if(!result || !!forceRefresh){
      // create a promise
      result = new Torpedo.Promise();
      // AJAX request
      var self = this;
      $.ajax({
        url:url
      , dataType:'json'
      , cache:false
      }).then(function(data, textStatus, jqXHR){
        setCacheFromXHR.call(self, url, result, jqXHR);
        result.fulfill(data);
      }, function(jqXHR, textStatus, errorThrown){
        setCacheFromXHR.call(self, url, result, jqXHR);
        result.reject();
      });
      // get the expire (default 60s)
      var expire = this._opts.expire || 60;
      if(_.isFunction(expire)) expire = _.bind(expire, this)(opts);
      // set the cache
      setCache.call(this, url, result, expire);
    }

    return result;
  };


  /*
   * CACHE MANAGMENT (PRIVATE METHODS)
   */
  function initCache(){
    this._opts.cache = {};
  }
  function setCache(url, value, expire){
    this._opts.cache[url] = {
      expire: Date.now() + expire * 1000
    , value:  value
    };
  }
  function getCache(url){
    // no cache
    if(!this._opts.cache[url]) return;
    // cache expired
    if(this._opts.cache[url].expire < Date.now()) return;
    // valid value
    return this._opts.cache[url].value;
  }
  function setCacheFromXHR(url, value, xhr){
    var headers = xhr.getAllResponseHeaders().split('\n')
      , header
      , cacheControl = 'cache-control:'
      , maxAge = 'max-age='
      , noCache = 'no-cache'
      ;
    while(header = headers.shift()){
      if(header.toLowerCase().replace(/\s+/, '').indexOf(cacheControl)===0){
        var attrs = header.split(':')[1].trim().split(','), attr;
        while(attr = attrs.shift()){
          if(attr.toLowerCase().replace(/\s+/, '').indexOf(noCache)===0){
            setCache.call(this, url, value, 0);
            return;
          }
          if(attr.toLowerCase().replace(/\s+/, '').indexOf(maxAge)===0){
            setCache.call(this, url, value, parseFloat(attr.split('=')[1].trim()));
            return;
          }
        }
      }
    }
  }

})();
