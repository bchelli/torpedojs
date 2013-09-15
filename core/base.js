(function(){

  /*
   * INIT TORPEDO OBJECT
   */
  var Torpedo = window.Torpedo = window.Torpedo || {};


  /*
   * MODEL
   */
  var Base = Torpedo.Base = {

    requiredOptions: function(){
      var requiredOpts = Array.prototype.slice.call(arguments);
      for(var i=0,l=requiredOpts.length;i<l;i++){
        var o = requiredOpts[i];
        if(typeof this._opts[o] == 'undefined'){
          throw new Error('Required parameter '+o+' is missing');
        }
      }
    }

  };

})();