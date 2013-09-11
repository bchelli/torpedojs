(function(){

  /*
   * INIT TORPEDO OBJECT
   */
  var Torpedo = window.Torpedo = window.Torpedo || {};


  /*
   * LIST OF THE ROUTES
   */
  var routes = [], lastFragment, _pageId=0;
  var error404Urls = '#error/404';


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
   * CONSTRUCTOR
   */
  var Route = Torpedo.Route = function(template){

    if(!template)                                   throw new Error('Route Error: no template passed to the route constructor');
    if(!template.routes || !template.routes.length) throw new Error('Route Error: no routes in the template');

    var renderView = renderFactory(template);
    for(var i=0,l=template.routes.length;i<l;i++){
      routes.push(_.extend({fn:renderView}, routeToRegExp(template.routes[i])));
    }
  };


  /*
   * EXTENDS WITH EVENTS
   */
  _.extend(Route.prototype, Torpedo.Events);


  /*
   * EXTENDS WITH EVENTS
   */
  Route.init = function(){
    $(function(){
      window.$(window).on('hashchange', checkUrl);
      checkUrl();
    });
  };


  /*
   * HELPERS
   */

  // render factory
  function renderFactory(template){
    return function(params){

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
  function routeToRegExp(route) {
    var attrsName = []
      , routeInit = route
      , routeCheck = route
      ;
    route = route.replace(escapeRegExp, '\\$&')
                 .replace(namedParam, function(match){
                   attrsName.push(match.substr(1));
                   return '([^\/]+)';
                 })
                 .replace(splatParam, function(match){
                   attrsName.push(match.substr(1));
                   return '(.*?)';
                 });
    return {regexp:new RegExp('^' + route + '$'), attrsName:attrsName};
  }

  // check url
  function checkUrl(){
    var match = window.location.href.match(/#(.*)$/) || ['#', '']
      , fragment = match[1]
      ;
    if(lastFragment === fragment) return;
    lastFragment = fragment;
    for(var i=0,l=routes.length;i<l;i++){
      var m = fragment.match(routes[i].regexp);
      if(m){
        m = Array.prototype.slice.call(m);
        m.shift();
        var o = {};
        _.each(routes[i].attrsName, function(name, index){ o[name] = m[index]; });
        routes[i].fn(o);
        return;
      }
    }
    if(location.hash != error404Urls) {
      location.hash = error404Urls;
    }
  }

})();