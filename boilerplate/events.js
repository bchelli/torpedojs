

;(function(){

  Torpedo.events = {};

  var eventList = [];
  var nativeEventsCalls = {};
  var nativeEventsFn = {};

  function nativeEventsFactory(eventName){
    return function(){
      for(var i=0,l=nativeEventsFn[eventName].length;i<l;i++){
        nativeEventsFn[eventName][i]();
      }
    }
  }


  Torpedo.events.attachEvent = function(classSelector, eventName, func, el){

    el = $(el || '#torpedo-page');

    // add to event list
    eventList.push({
      el:             el
    , classSelector:  classSelector
    , eventName:      eventName
    , func:           func
    });

    // attach native events
    if(eventName.indexOf('.')!==-1){
      if(!nativeEventsFn[eventName]){
        ;(function(eventName){
          var ev = eventName.split('.');
          nativeEventsFn[eventName] = []
          nativeEventsCalls[eventName] = nativeEventsFactory(eventName);
          $(window[ev[0]]).on(ev[1], nativeEventsCalls[eventName]);
        })(eventName);
      }
      nativeEventsFn[eventName].push(func);
    } else {
      // attach delegate
      el.delegate(classSelector, eventName, func);
    }
  }

  Torpedo.events.detachEvents = function(){
    var ev;
    while(ev = eventList.shift()){

      // detach native events
      if(ev.eventName.indexOf('.')!==-1 && nativeEvents[ev.eventName]){
        nativeEventsFn[ev.eventName].length = 0;
        nativeEventsFn[ev.eventName] = false;
        $(window[evs[0]]).off(evs[1], nativeEventsCalls[eventName]);
      } else {
        // detach delegate
        ev.el.undelegate(ev.classSelector, ev.eventName, ev.func);
      }
    }
  }

})();

