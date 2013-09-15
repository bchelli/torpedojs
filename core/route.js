(function(){

  /*
   * INIT TORPEDO OBJECT
   */
  var Torpedo = window.Torpedo = window.Torpedo || {};


  /*
   * LIST OF THE ROUTES
   */
  var _pageId=0;


  /*
   * PAGE ANIMATION HELPERS
   */
  Torpedo.hidePage = function($page, cb){
    window.scrollTo(0,0);
    if(cb) cb();
  }
  Torpedo.showPage = function($page, cb){
    if(cb) cb();
  }


  /*
   * Manage Route Errors
   */
  var error404Urls = '#error/404';
  var ErrorRouter = Backbone.Router.extend({
    routes: {
      '*errorPath':function(url){
        if(url!==error404Urls.substr(1)){
          Backbone.history.loadUrl(error404Urls);
        }
      }
    }
  });
  new ErrorRouter();


  /*
   * CONSTRUCTOR
   */
  var Route = Torpedo.Route = function(template){

    if(!template)                                   throw new Error('Route Error: no template passed to the route constructor');
    if(!template.routes || !template.routes.length) throw new Error('Route Error: no routes in the template');

    var routes = {};
    for(var i=0,l=template.routes.length;i<l;i++){
      routes[template.routes[i]] = renderFactory(template, template.routes[i]);
    }
    var Router = Backbone.Router.extend({ routes: routes });
    template.router = new Router();
  };


  /*
   * EXTENDS WITH EVENTS
   */
  _.extend(Route.prototype, Backbone.Events);


  /*
   * EXTENDS WITH EVENTS
   */
  Route.init = function(){
    $(function(){
      Backbone.history.start();
    });
  };


  /*
   * HELPERS
   */

  // render factory
  function renderFactory(template, route){
    var attrsName = routeAttrs(route);
    return function(){
      // extract params
      var attrs = Array.prototype.slice.call(arguments);
      var params = {};
      _.each(attrsName, function(name, index){ params[name] = attrs[index]; });

      // create opts for the view
      var opts = {
        id:'torpedo-page-'+(++_pageId)
      , params:params
      };

      // add template opts
      _.extend(opts, template._opts);

      // create the container
      $('#torpedo-app').append('<div class="torpedo-page" id="'+opts.id+'" />');

      // create the view
      var newMasterView = new Torpedo.View(opts);

      // transition from the old view to the new one
      function showNewMasterView(){
        Torpedo.showPage($('#'+newMasterView._opts.id), function(){
          Torpedo.masterView = newMasterView;
        });
      }
      if(Torpedo.masterView){
        Torpedo.hidePage($('#'+Torpedo.masterView._opts.id), function(){
          Torpedo.masterView.destroy();
          $('#'+Torpedo.masterView._opts.id).remove();
          showNewMasterView();
        });
      } else showNewMasterView();
    }
  }

  // route to regexp
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;
  function routeAttrs(route) {
    var attrsName = [];
    route.replace(escapeRegExp, '\\$&')
         .replace(namedParam, function(match){
           attrsName.push(match.substr(1));
           return '([^\/]+)';
         })
         .replace(splatParam, function(match){
           attrsName.push(match.substr(1));
           return '(.*?)';
         });
    return attrsName;
  }

})();