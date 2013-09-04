(function(){

  /*
   * INIT TORPEDO OBJECT
   */
  var Torpedo = window.Torpedo = window.Torpedo || {};


  /*
   * EVENTS
   */
  var evStack = {}
    , evId = 0
    , Events = Torpedo.Events = {
        on:function(key, cb){
          evStack[key] = evStack[key] || [];
          evId++;
          cb._evId = evId;
          evStack[key].push(cb);
        }
      , off:function(key, cb){
          if(!_.isArray(evStack[key])) return;
          var evs = evStack[key];
          for(var i=evs.length-1;i>=0;i--){
            if(evs[i]._evId === cb._evId){
              evs.splice(i, 1);
            }
          }
        }
      , trigger:function(key, obj){
          if(!_.isArray(evStack[key])) return;
          var evs = evStack[key];
          for(var i=evs.length-1;i>=0;i--){
            setTimeout((function(index){
              return function(){
                if(evs[index]){
                  evs[index](obj);
                }
              }
            })(i), 0);
          }
        }
      }
    ;

  // Allow the `Torpedo` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Torpedo, Events);


})();