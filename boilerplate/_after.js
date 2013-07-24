
$(function(){

  // init routers
  for(var name in Templates){
    if(Templates[name].routes){
      var routes = {routes:{}};
      for(var route in Templates[name].routes){
        var fn = Templates[name].routes[route];

        // set the route
        routes.routes[route] = fn;

        // set the callback
        routes[fn] = (function(name, fn){
          return function(){
            Templates[name][fn].apply(
              Templates[name]
            , Array.prototype.slice.apply(arguments)
            );
          }
        })(name, fn);

      }
      var PageRouter = Backbone.Router.extend(routes);
      Templates[name].router = new PageRouter();
    }
  }

  // init routing
  Backbone.history.start();

});
