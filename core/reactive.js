
;(function(){

  /*
   * Reactive
   */
  Torpedo.Reactive = {};

  /*
   * Reactive Client
   */
  Torpedo.Reactive.Client = {
    get:function(key, opt){
      initStack(this);
      if(_.isObject(key)){
        opt = key;
        key = null;
      } else opt = opt || {};
      var fn = stack[0];
      if(_.isFunction(fn) && opt.trigger !== false) {
        // set function as reactive
        fn._is_reactive = true;
        // attach event once only
        var eventKey = 'change-'+this._reactive_id;
        if(key) eventKey += ':'+key;
        if(!fn._reactive[eventKey]){
          fn._reactive[eventKey] = true;
          Torpedo.Reactive.Manager.on(eventKey, fn._reactive_cb);
        }
      }
      return this._reactive_vars[key];
    }
  , set:function(key, value, opt){

      if(_.isObject(key)){
        opt = value || {};
        opt.triggerGlobal = false;
        for(var k in key){
          this.set(k, key[k], opt);
        }
        if(opt.trigger !== false) {
          Torpedo.Reactive.Manager.trigger('change-'+this._reactive_id);
        }
        return this;
      }

      initStack(this);

      opt = opt || {};
      var oldValue = this._reactive_vars[key];
      this._reactive_vars[key] = value;
      if(opt.trigger !== false) {
        var eventKey = 'change-'+this._reactive_id;
        Torpedo.Reactive.Manager.trigger(eventKey+':'+key);
        if(opt.triggerGlobal !== false) {
          Torpedo.Reactive.Manager.trigger('change-'+this._reactive_id);
        }
      }

      return this;
    }
  };


  /*
   * Reactive Manager
   */
  var stack = [];
  Torpedo.Reactive.Manager = {
    start:function(fn){
      if(!_.isFunction(fn)) return;

      // add to execution stack
      fn._in_reactive_exec = true;
      stack.unshift(fn);

      // init function as reactive
      fn._is_reactive = fn._is_reactive || false;
      fn._reactive =    fn._reactive    || {};
      fn._reactive_cb = fn._reactive_cb || function(){
        // only exec if not already in execution
        if(!fn._in_reactive_exec){
          this.start(fn);
        }
      };

      // execute function
      fn();

      // remove from execution stack
      fn._in_reactive_exec = false;
      stack.shift();

      return fn._is_reactive ? fn : null;
    }
  , stop:function(fn){
      fn = fn || stack[0];
      if(!_.isFunction(fn)) return;
      for(var key in fn._reactive){
        if(fn._reactive[key]){
          fn._reactive[key] = false;
          this.off(key, fn._reactive_cb);
        }
      }
      fn._reactive = {};
    }
  };


  /*
   * EXTENDS WITH EVENTS
   */
  _.extend(Torpedo.Reactive.Manager, Backbone.Events);


  /*
   * HELPERS
   */
  var reactiveId = 0;
  function initStack(obj){
    if(!obj._reactive_vars){
      reactiveId++;
      obj._reactive_vars = {};
      obj._reactive_id = reactiveId;
    }
  }
})();
