

module.exports = function(fn, cntx){
  var args = [];
  var curry = function(){
    var a = Array.prototype.slice.apply(arguments);
    for(var i=0,l=a.length;i<l;i++){
      args[args.length] = a[i];
    }
    if(args.length >= fn.length) return fn.apply(cntx, args);
    else return curry;
  }
  return curry;
}

