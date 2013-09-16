
(function (window, undefined) {


  /*
   * The Torpedo.Template Class is responsible
   * of the interface with the template processor
   *   e.g.: Handlebars.js
   */



  /*
   * INIT TORPEDO OBJECT
   */
  var Torpedo = window.Torpedo = window.Torpedo || {};


  /*
   * INIT TEMPLATES MANAGER
   */
  var partialId = 0;
  templates = {};
  Torpedo.getTemplate = function(name){
    return templates[name];
  }


  /*
   * TEMPLATE CONSTRUCTOR
   */
  var Template = Torpedo.Template = function(opts){

    // initialize the options
    this._opts   = opts = opts   || {};

    // required options
    this.requiredOptions('templateName', 'template');

    // add to the template manager
    templates[opts.templateName] = this;

    // register the routes
    if(opts.routes) {
      this.routes = opts.routes;
      new Torpedo.Route(this);
    }

    // register the partial
    Handlebars.registerPartial(
      opts.templateName
    , function(context, options){

        var id = 'torpedo-partial-'+(++partialId)
          , parentView = Torpedo.getActiveView();
          ;

        context = $.extend({}, opts.context, context);

        // render the subview once the container is in place
        setTimeout(function(){

          var v = new Torpedo.View({
            id            : id

          , templateName  : opts.templateName
          , events        : opts.events

          , context       : context
          , options       : options

          , parent        : parentView

          , initialize    : opts.initialize

          });

          // remove container of the sub view
          v.on('render-after', function(){
            $('#'+id).append('<div>')
            $('#'+id+' :last').unwrap().remove();
          });

          // render
          v.render();

        }, 0);

        return '<div id="'+id+'"></div>';
      }
    );
  };


  /*
   * EXTENDS FROM BASE
   */
  _.extend(Template.prototype, Torpedo.Base);


  /*
   * EXTENDS WITH EVENTS
   */
  _.extend(Template.prototype, Backbone.Events);


  /*
   * GET HTML
   */
  Template.prototype.getHtml = function(context, options) {
    return this._opts.template(context, options);
  };

})(window);

