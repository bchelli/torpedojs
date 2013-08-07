var Torpedo = {};

Torpedo.loading = function(state){
  $('#torpedo-loading').css({'display':(state?'block':'none')});
}

;(function(){

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


  Torpedo.attachEvent = function(classSelector, eventName, func, el){

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

  Torpedo.detachEvents = function(){
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




var Templates = {};

var Template;

;(function(){

  var tmplCount = 0, tmplStack = [], toTmp;

  function renderTmpl($target, obj){

    var $el = $(obj.content);

    // attach events
    if(obj.template.events){
      for(var classSelector in obj.template.events){

        (function(classSelector, el){

          // get function 
          var fnName = obj.template.events[classSelector];
          var func = function(){
            obj.template[fnName].apply(obj.template, Array.prototype.slice.apply(arguments));
          };

          // extract event
          var args = classSelector.split(' ');
          var eventName = args.shift();
          classSelector = args.join(' ');

          // attach event
          Torpedo.attachEvent(classSelector, eventName, func, el);

        })(classSelector, $el);

      }
    }

    // add el to the DOM
    $target.after($el);
    $target.remove();

  }

  function renderStack(){
    var tmpStack = tmplStack.slice(0);
    tmplStack.length = 0;
    for(var i=tmpStack.length-1; i>=0; i--){
      var $el = $('#'+tmpStack[i].id);
      if($el.length === 0){
        tmplStack.push(tmpStack[i]);
      } else {
        renderTmpl($el, tmpStack[i]);
      }
    }
    if(tmplStack.length !== 0) setTimeout(renderStack, 1);
  }

  function addToStack(obj){
    tmplStack.push(obj);
    if(toTmp) clearTimeout(toTmp);
    toTmp = setTimeout(renderStack, 1);
  }

  function createHandlebarsTemplate(obj, precompiled){
    var _handlebars_render = Handlebars.template(precompiled);
    return function(ctx, opts){

      // generate helpers
      ctx = _.extend(ctx, obj.helpers || {});
      obj._data = ctx;

      // render
      tmplCount++;
      var id = 'torpedo-tmp-template-'+tmplCount;
      var content = _handlebars_render(ctx, opts);

      addToStack({
        id:       id
      , content:  content
      , template: obj
      })

      return '<div id="'+id+'"></div>';
    }
  }

  Template = function(obj){
    for(var i in obj){
      if(i !== '_handlebars_render'){
        this[i] = obj[i];
      }
    }
    this['_handlebars_render'] = createHandlebarsTemplate(this, obj['_handlebars_render'])
  };

  Template.prototype.render = function(helpers){
    var that = this
      , nbPromises = 0
      ;
    helpers = helpers || {};
    function renderFactory(attr){
      return function(value){
        if(attr){
          nbPromises--;
          helpers[attr] = value;
        }
        if(nbPromises>0) return;
        helpers = _.extend(that.helpers || {}, helpers);
        var content = that._handlebars_render(helpers);
        $('#torpedo-page').html(content);
        if(that.afterRender) setTimeout(function(){that.afterRender()}, 1);
        Torpedo.loading(false);
      }
    }
    if(that.data){
      for(var d in that.data){
        if(that.data[d].promise){
          nbPromises++;
          that.data[d].then(renderFactory(d));
        } else {
          helpers[d] = that.data[d];
        }
      }
    }
    renderFactory()();
  };

})();
