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
    this.requiredOptions('name', 'url');

    // add to model manager
    models[opts.name] = this;

  };


  /*
   * EXTENDS FROM BASE
   */
  _.extend(ModelFactory.prototype, Torpedo.Base);


  /*
   * EXTENDS WITH EVENTS
   */
  _.extend(ModelFactory.prototype, Backbone.Events);


  /*
   * GET MODEL FUNCTION
   */
  ModelFactory.prototype.getModel = function(params) {
    var self = this;

    // generate the URL
    var url = this._opts.url;
    if(_.isFunction(url)) url = url(params);

    // get the cached version of the object
    var model = getCache.call(this, url);

    // if not chached => generate it
    if(!model){
      // new model
      model = new Torpedo.Model({
        url:          url
      , expire:       this._opts.expire
      , processData:  this._opts.processData
      });

      // set the cache
      model.on('set-expire', function(expire){
        setCache.call(self, url, model, expire);
      });

      // fetch
      model.fetch();
    }

    return model;
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

})();
