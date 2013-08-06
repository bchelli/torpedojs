
$(function(){

  var getRouteCallback = function(name, fn){
    return function(){
      // init loading
      Torpedo.loading(true);

      // detatch events
      Torpedo.detachEvents();

      // call the template call back
      Templates[name][fn].apply(
        Templates[name]
      , Array.prototype.slice.apply(arguments)
      );
    }
  };

  // init routers
  for(var name in Templates){
    if(Templates[name].routes){
      var routes = {routes:{}};
      for(var route in Templates[name].routes){
        var fn = Templates[name].routes[route];

        // set the route
        routes.routes[route] = fn;

        // set the callback
        routes[fn] = getRouteCallback(name, fn);

      }
      var PageRouter = Backbone.Router.extend(routes);
      Templates[name].router = new PageRouter();
    }
  }

  // init routing
  Backbone.history.start();

});
