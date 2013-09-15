(function(){

  /*
   * INIT TORPEDO OBJECT
   */
  var Torpedo = window.Torpedo = window.Torpedo || {};


  /*
   * STATES
   */
  const PENDING = 0
      , FULFILLED = 1
      , REJECTED = 2
      ;


  /*
   * EVENTS
   */
  var Promise = Torpedo.Promise = function(){
    this.state = PENDING;
  };


  /*
   * EXTENDS WITH EVENTS
   */
  _.extend(Promise.prototype, Backbone.Events);


  /*
   * THEN FUNCTION
   */
  Promise.prototype.then = function(onFulfilled, onRejected) {

    // set the events
    if(_.isFunction(onFulfilled)) this.once('onFulfilled', onFulfilled);
    if(_.isFunction(onRejected))  this.once('onRejected',  onRejected);

    // reapply the state for those events to be triggered
    switch(this.state){

      case FULFILLED:
        // trigger events
        this.trigger('onFulfilled', this.value);
        // clean events
        this.off('onRejected');
        break;

      case REJECTED:
        // trigger events
        this.trigger('onRejected', this.value);
        // clean events
        this.off('onFulfilled');
        break;

    }

  };


  /*
   * DONE FUNCTION
   */
  Promise.prototype.done = function(onFulfilled) {
    this.then(onFulfilled);
  };


  /*
   * THEN FUNCTION
   */
  Promise.prototype.fail = function(onRejected) {
    this.then(null, onRejected);
  };


  /*
   * ALWAYS FUNCTION
   */
  Promise.prototype.always = function(onAlways) {
    this.then(onAlways, onAlways);
  };


  /*
   * FULFILL FUNCTION
   */
  Promise.prototype.fulfill = function(value) {
    // set obj
    this.state = FULFILLED;
    this.value = value;
    // trigger events
    this.then();
  };


  /*
   * REJECT FUNCTION
   */
  Promise.prototype.reject = function(value) {
    // set obj
    this.state = REJECTED;
    this.value = value;
    // trigger events
    this.then();
  };

})();