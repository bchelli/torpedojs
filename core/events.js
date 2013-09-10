(function(){

  /*
   * INIT TORPEDO OBJECT
   */
  var Torpedo = window.Torpedo = window.Torpedo || {};


  /*
   * HELPERS
   */
  var _stackId = 0;
  function initEventStack(obj){
    if(!obj._evStack){
      obj._evStack = {};
      obj._evId    = 0;
      obj._stackId = ++_stackId;
    }
  }


  /*
   * EVENTS
   */
  var Events = Torpedo.Events = {
        on:function(name, cb){
          // init
          initEventStack(this);
          // remove from event if already there
          this.off(name, cb);
          // init stack
          this._evStack[name] = this._evStack[name] || [];
          // affect a cb id
          cb['_evId_'+this._stackId] = ++this._evId;
          // push to the stack
          this._evStack[name].push(cb);
        }
      , off:function(name, cb){
          // init
          initEventStack(this);
          // if no stack exit
          if(!_.isArray(this._evStack[name])) return;
          // if no callback => clean them all
          if(cb){
            var evs = this._evStack[name];
            for(var i=evs.length-1;i>=0;i--){
              if(evs[i]['_evId_'+this._stackId] === cb['_evId_'+this._stackId]){
                evs.splice(i, 1);
              }
            }
          } else {
            this._evStack[name] = [];
          }
        }
      , once:function(name, cb){
          cb._once = true;
          this.on(name, cb);
        }
      , trigger:function(name, obj){
          var self = this;
          initEventStack(this);
          if(!_.isArray(this._evStack[name])) return;
          var evs = this._evStack[name];
          for(var i=evs.length-1;i>=0;i--){
            setTimeout((function(cb){
              return function(){
                // trigger
                if(cb) cb(obj);
                // remove if once
                if(cb._once) self.off(name, cb);
              }
            })(evs[i]), 0);
          }
        }
      , listenTo:function(obj, name, cb){
          obj.on(name, cb);
        }
      , listenToOnce:function(obj, name, cb){
          obj.once(name, cb);
        }
      , stopListening:function(obj, name, cb){
          obj.off(name, cb);
        }
      }
    ;

  // Allow the `Torpedo` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Torpedo, Events);


})();