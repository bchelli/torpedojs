(function(){

  /*
   * INIT TORPEDO OBJECT
   */
  var Torpedo = window.Torpedo = window.Torpedo || {};


  /*
   * MODEL MANAGER
   */
  var models = {};
  Torpedo.getModel = function(name){
    return models[name];
  }


  /*
   * EVENTS
   */
  var Model = Torpedo.Model = function(opts){

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
  _.extend(Model.prototype, Torpedo.Events);


  /*
   * GET FUNCTION
   */
  Model.prototype.get = function(opts, forceRefresh) {
    var url = this._opts.url;
    if(_.isFunction(url)) url = _.bind(url, this)(opts);

    var result = getCache.call(this, url);

    if(!result || !!forceRefresh){
      // create a promise
      result = new Torpedo.Promise();
      // AJAX request
      $.ajax({url:url, dataType:'json'}).then(function(value){
        result.fulfill(value);
      }, function(error){
        result.reject(error);
      });
      // get the expire (default 60s)
      var expire = this._opts.expire || 60;
      if(_.isFunction(expire)) expire = _.bind(expire, this)(opts);
      // set the cache
      setCache.call(this, url, result, Date.now() + expire*1000);
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
      expire: expire
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

})();