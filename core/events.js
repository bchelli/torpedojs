(function(){

  /*
   * INIT TORPEDO OBJECT
   */
  var Torpedo = window.Torpedo = window.Torpedo || {};


  // Allow the `Torpedo` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Torpedo, Backbone.Events);


})();