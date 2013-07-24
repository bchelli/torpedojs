
var Templates = {};

var Template = function(obj){
  var that = this;
  for(var i in obj){
    if(i === '_handlebars_render'){
      var _handlebars_render = Handlebars.template(obj[i])
      that[i] = function(ctx, opts){
        ctx = _.extend(ctx, that.helpers || {})
        return _handlebars_render(ctx, opts);
      }
    } else {
      that[i] = obj[i];
    }
  }
};

Template.prototype.render = function(){
  $('body').html(this._handlebars_render(this.helpers || {}));
};
