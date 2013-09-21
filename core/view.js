
(function (window) {


  /*
   * INIT TORPEDO OBJECT
   */
  var Torpedo = window.Torpedo = window.Torpedo || {};


  /*
   * INIT VIEW MANAGER
   */
  var viewPile = [];
  Torpedo.getActiveView = function(){
    return viewPile[0];
  };


  /*
   * LOADING HELPERS
   */
  var isLoading = 0, isLoadingTo;
  Torpedo.loading = function(state){
    isLoading += state ? 1 : -1;
    if(isLoadingTo) clearTimeout(isLoadingTo);
    if(isLoading>0){
      // start the loading screen only if the loading is actually long
      isLoadingTo = setTimeout(function(){
        $('#torpedo-loading').css({'display':'block'});
      }, 200);
    } else {
      $('#torpedo-loading').css({'display':'none'});
    }
  }


  /*
   * VIEW CONSTRUCTOR
   */
  var View = Torpedo.View = function(opts){

    // add as subview
    if(opts && opts.parent) opts.parent._subViews.push(this);

    // initialize the options
    this._opts    = opts = opts   || {};
    opts.context  = opts.context  || {};
    opts.events   = opts.events   || {};
    opts.options  = opts.options  || {};
    opts.parent   = opts.parent   || {};

    // initialize the params (from the route)
    this.params = opts.params     || {};

    // initialize the childs (node point of view)
    this._childs = [];

    // initialize the sub views
    this._subViews = [];

    // initialize the sub views
    this._reactives = [];

    // required options
    this.requiredOptions('id', 'templateName');

    // init events
    initEvents.call(this);

    // run custom initialize function
    if(_.isFunction(opts.initialize)) _.bind(opts.initialize, this)();

  };


  /*
   * EXTENDS FROM BASE
   */
  _.extend(View.prototype, Torpedo.Base);


  /*
   * EXTENDS WITH EVENTS
   */
  _.extend(View.prototype, Backbone.Events);


  /*
   * REFRESH / RERENDER THE VIEW
   */
  View.prototype.render = function() {

    var self = this;

    // trigger render-before
    self.trigger('render-before');

    // fetch the data
    fetchContext.call(self, function(context){

      // see if rendering is needed
      var newContext = JSON.stringify(context);
      if(self._oldContext && self._oldContext === newContext) return;
      self._oldContext = newContext;

      // generate the container if needed
      if(!generateContainer.call(self)) return;

      // destroy old view and keep reactives
      self.destroy(true);

      // generate the content and put it in the placeholder
      window.$('#'+self._opts.id).html(
        getContent.call(self, context)
      );

      // attach events
      attachEvents.call(self);

      // save child nodes
      saveChildNodes.call(self);

      // trigger render-after
      self.trigger('render-after');
    });

  };


  /*
   * DESTROY THE VIEW
   */
  View.prototype.destroy = function(doNotCleanReactives) {

    // detach DOM events
    detachEvents.call(this);

    // destroy subviews
    var sv;
    while(sv = this._subViews.shift()) {
      sv.destroy();
    };

    // clean childs
    var ch;
    while(ch = this._childs.shift()) {
      ch.remove();
    };

    if(!doNotCleanReactives){
      // detach events
      this.stopListening();

      // clean childs
      var r;
      while(r = this._reactives.shift()) {
        Torpedo.Reactive.Manager.stop(r);
      };
    }

  };











  /*
   * PRIVATE METHODS
   */


  // FETCH IF NEEDED THE CONTEXT
  var fetchContext = function(callback) {
    Torpedo.loading(true);
    var self = this
      , count = 0
      , context = {}
      , triggered = false
      ;

    // on fetch factory
    function onContextFetched(key){
      var cb = function(value){
        if(key){
          context[key] = value;
          count--;
        }
        if(count === 0 && !!callback) {
          callback(context);
          Torpedo.loading(false);
        }
      }
      if(key){
        return cb;
      } else {
        cb();
      }
    };

    // fetch all context to be fetched
    //   + set all static values
    count++; // force to finish the loop
    for(var key in this._opts.context){
      var getContextForKey = (function(key){
        var setContextForKey = onContextFetched(key);
        return function(){
          var d = self._opts.context[key];
          if(typeof d == 'function') d = d.call(self);
          count++;

          // manage Reactive
          if(d && d.get) d.get();

          // manage promise
          var prom = d && d.promise ? d.promise() : d;
          if(prom && prom.then) prom.always(setContextForKey);
          // if a regular value
          else setContextForKey(d);
        }
      })(key);
      pushReactive.call(self, Torpedo.Reactive.Manager.start(getContextForKey));
    }
    count--; // now can be triggered

    // if no context to fetch force the callback
    onContextFetched();
  };


  // INIT THE EVENTS
  var initEvents = function() {
    var self = this;
    self._events = {};
    for(var key in self._opts.events){
      // 1 - parse event
      var attrs       = key.trim().split(' ')
        , name        = attrs.shift()
        , cssSelector = attrs.join(' ')
        ;

      // if the event is valid
      if(name){
        // by default select all the elements
        if(!cssSelector || cssSelector.length === 0){
          cssSelector = '*';
        }

        // create the callback
        var cb = (function(key){
          return function(){
            self._opts.events[key].apply(self, Array.prototype.slice.call(arguments));
          }
        })(key);

        // save the inited event
        self._events[key] = {
          eventName   : name
        , selector    : cssSelector
        , callback    : cb
        };
      } else {
        throw new Error('Unable to init/parse event '+key);
      }
    }
  };


  // ATTACH THE EVENTS TO THE DOM
  var attachEvents = function() {
    var self = this
      , $el = window.$('#'+self._opts.id)
      ;
    for(var key in self._events){
      var evnt = self._events[key];
      self._events[key].$els = $el.find(evnt.selector);
      self._events[key].$els.on(
        evnt.eventName
      , evnt.callback
      );
    }
  };

  // ATTACH THE EVENTS TO THE DOM
  var detachEvents = function() {
    var self = this;
    for(var key in self._events){
      if(self._events[key].$els){
        var evnt = self._events[key];
        evnt.$els.off(
          evnt.eventName
        , evnt.callback
        );
        delete self._events[key].$els;
      }
    }
  };

  // TAG FIRST CHILD NODES
  var saveChildNodes = function(){
    this._childs = Array.prototype.slice.call(window.$('#'+this._opts.id)[0].childNodes);
  };

  // CREATE THE CONTAINER IF NEEDED
  var generateContainer = function(){
    var $el =  window.$('#'+this._opts.id);
    if($el.length === 0){
      // test if tag can be generated
      if(this._childs.length === 0) return false;

      // insert the tag
      $el = document.createElement('div');
      $el.id = this._opts.id;

      this._childs[0].parentNode.insertBefore($el, this._childs[0]);

      $el =  window.$('#'+this._opts.id)
    }
    return true;
  }

  // GENERATE THE HTML CONTENT
  var getContent = function(context){
    var tmpl = Torpedo.getTemplate(this._opts.templateName)
      , parentTmpl = this._opts.parent.templateName ? Torpedo.getTemplate(this._opts.parent.templateName) : {_opts:{}}
      ;

    // propagate helpers
    this._opts.options.helpers = this._opts.options.helpers || {};
    _.extend(
      this._opts.options.helpers
    , Templates.helpers           || {}
    , parentTmpl._opts.helpers    || {}
    , tmpl._opts.helpers          || {}
    );

    // init view pile
    viewPile.unshift(this);
    // get the content of the template
    var content = tmpl.getHtml(context, this._opts.options);
    // init view pile
    viewPile.shift();

    if(content.trim().length == 0) return '<!-- EMPTY -->';
    return content;
  }

  // PUSH THE REACTIVE FUNCTION IN THE PILE
  var pushReactive = function(reactiveFn){
    if(reactiveFn){
      this._reactives.push(reactiveFn);
    }
  }

})(window);

