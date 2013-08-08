
;(function(){

  /*
   * helpers
   */
  var ts =          Object.prototype.toString
    , is =          function(obj,type){return ts.apply(obj) === '[object '+type+']'}
    , isFunction =  function(obj)     {return is(obj, 'Function')}
    , isArray =     function(obj)     {return is(obj, 'Array')}
    , isObject =    function(obj)     {return is(obj, 'Object')}
    , isUndefined = function(obj)     {return is(obj, 'Undefined')}
    ;

  /*
   * vars
   */
  var stack = []
    , vars = {}
    ;

  /*
   * events
   */
  var evStack = {}
    , evId = 0
    , ev = {
        on:function(key, cb){
          evStack[key] = evStack[key] || [];
          evId++;
          cb._evId = evId;
          evStack[key].push(cb);
        }
      , off:function(key, cb){
          if(!isArray(evStack[key])) return;
          var evs = evStack[key];
          for(var i=evs.length-1;i>=0;i--){
            if(evs[i]._evId === cb._evId){
              evs.splice(i, 1);
            }
          }
        }
      , trigger:function(key, obj){
          if(!isArray(evStack[key])) return;
          var evs = evStack[key];
          for(var i=0,l=evs.length;i<l;i++){
            evs[i](obj);
          }
        }
      }
    ;

  /*
   * reactive
   */
  Torpedo.reactive = {
    start:function(fn){
      if(!isFunction(fn)) return;

      // add to execution stack
      fn._in_reactive_exec = true;
      stack.unshift(fn);

      // init function as reactive
      fn._reactive =    fn._reactive    || {};
      fn._reactive_cb = fn._reactive_cb || function(){
        // only exec if not already in execution
        if(!fn._in_reactive_exec){
          Torpedo.reactive.start(fn);
        }
      };

      // execute function
      fn();

      // remove from execution stack
      fn._in_reactive_exec = false;
      stack.shift();
    }
  , stop:function(){
      if(!isFunction(stack[0])) return;
      for(var key in fn._reactive){
        if(stack[0]._reactive[key]){
          stack[0]._reactive[key] = false;
          ev.off(key, fn._reactive_cb);
        }
      }
      stack[0]._reactive = {};
    }
  , get:function(key, opt){
      opt = opt || {};
      if(isFunction(stack[0]) && opt.trigger !== false) {
        fn = stack[0];
        // attach event once only
        if(!fn._reactive[key]){
          fn._reactive[key] = true;
          ev.on(key, fn._reactive_cb);
        }
      }
      return vars[key];
    }
  , set:function(key, value, opt){
      opt = opt || {};
      var oldValue = vars[key];
      vars[key] = value;
      if(opt.trigger !== false) {
        ev.trigger(key, {
          value:    value
        , oldValue: oldValue
        }, stack);
      }
    }
  };

})();
