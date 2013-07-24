module.exports = function(functions, cb){
  var cnt = 0;
  function cbFactory(){
    cnt++;
    return function(){
      cnt--;
      if(cnt===0 && cb) cb();
    }
  }
  var initEnded = cbFactory();
  for(var i in functions){
    functions[i](cbFactory());
  }
  initEnded();
}
