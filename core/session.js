
;(function(){

  /*
   * vars
   */
  var stack = []
    , vars = {}
    ;

  /*
   * session // reactive pattern
   */
  Torpedo.Session = {
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
          Torpedo.Session.start(fn);
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
  , get:function(key, opt){
      opt = opt || {};
      if(_.isFunction(stack[0]) && opt.trigger !== false) {
        fn = stack[0];
        // set function as reactive
        fn._is_reactive = true;
        // attach event once only
        if(!fn._reactive[key]){
          fn._reactive[key] = true;
          this.on(key, fn._reactive_cb);
        }
      }
      return vars[key];
    }
  , set:function(key, value, opt){
      opt = opt || {};
      var oldValue = vars[key];
      vars[key] = value;
      if(opt.trigger !== false) {
        this.trigger(key, {
          value:    value
        , oldValue: oldValue
        }, stack);
      }
    }
  };


  // Allow the `Torpedo` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Torpedo.Session, Backbone.Events);


})();
