(function(){

  /*
   * INIT TORPEDO OBJECT
   */
  var Torpedo = window.Torpedo = window.Torpedo || {};


  /*
   * MODEL
   */
  var Model = Torpedo.Model = function(opts){

    var self = this;

    // initialize the options
    this._opts        = opts = opts       || {};
    opts.expire       = opts.expire       || 60;
    opts.processData  = opts.processData  || function(i){return i};

    // required options
    this.requiredOptions('url');

    // create a promise
    this._promise = new Torpedo.Promise();

    // create the Backbone model handling the data
    var BackboneStandardModel = Backbone.Model.extend();
    this._model = new BackboneStandardModel();

    // proxy events from the Backbone Model to the Torpedo Model 
    this._model.on('all', function(eventType){
      if(eventType === 'change'){
        self._promise.fulfill(
          self._model.toJSON()
        );
      }
      self.trigger.apply(self, Array.prototype.slice.call(arguments));
    });

  };


  /*
   * EXTENDS FROM BASE
   */
  _.extend(Model.prototype, Torpedo.Base);


  /*
   * EXTENDS WITH EVENTS
   */
  _.extend(Model.prototype, Backbone.Events);


  /*
   * FETCH FUNCTION
   */
  Model.prototype.promise = function(){
    return this._promise;
  };


  /*
   * FETCH FUNCTION
   */
  Model.prototype.fetch = function(){

    var self = this;

    // AJAX request
    $.ajax({

      url:this._opts.url
    , dataType:'json'

    }).then(function(data, textStatus, jqXHR){

      self.trigger('set-expire', getExpireFromXHR.call(self, jqXHR));

      // preprocess the data
      data = self._opts.processData(data)

      // set the data to the model
      self._model.set(data);

    }, function(jqXHR, textStatus, errorThrown){

      self.trigger('set-expire', getExpireFromXHR.call(self, jqXHR));

      self._promise.reject();

    });

  };


  /*
   * PRIVATE FUNCTION
   */
  function getExpireFromXHR(xhr){
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
            return 0;
          }
          if(attr.toLowerCase().replace(/\s+/, '').indexOf(maxAge)===0){
            return parseFloat(attr.split('=')[1].trim());
          }
        }
      }
    }
    return this._opts.expire;
  }

})();