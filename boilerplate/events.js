

;(function(){

  Torpedo.events = {};

  var eventCallbacks = {};
  var eventStacks = {};

  function attachNativeEvent(eventName){

    // init event stack
    eventStacks[eventName] = [];

    // create the generic callback
    eventCallbacks[eventName] = function(){
      for(var i=0,l=eventStacks[eventName].length;i<l;i++){
        eventStacks[eventName][i]();
      }
    }

    // attach event
    var ev = eventName.split('.');
    $(window[ev[0]]).on(ev[1], eventCallbacks[eventName]);

  }


  Torpedo.events.attachEvent = function(classSelector, eventName, func, el){

    el = $(el || '#torpedo-page');

    // attach native events
    if(eventName.indexOf('.')!==-1){
      if(!eventCallbacks[eventName]){
        attachNativeEvent(eventName);
      }
      eventStacks[eventName].push(func);
    } else {
      // attach events to first nodes
      el.filter(classSelector).on(eventName, func);
      // attach events to descendents
      el.find(classSelector).on(eventName, func);
    }
  }

  Torpedo.events.detachEvents = function(){

    for(var eventName in eventCallbacks){

      // detach native events
      var ev = eventName.split('.');
      $(window[ev[0]]).off(ev[0], eventCallbacks[eventName]);

      // remove from event stack
      eventStacks[eventName].length = 0;
      eventCallbacks[eventName] = false;

    }

  }

})();

