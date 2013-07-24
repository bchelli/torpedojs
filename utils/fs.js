
var fs = module.exports = require('fs');



/*
 * SCAN DIR HELPER
 */
var scanDir = module.exports.scanDir = function(obj){
  // set default values
  obj =         obj         || {};
  obj.cb =      obj.cb      || function(){};
  obj.hidden =  obj.hidden  || false;
  obj.pattern = obj.pattern || /.*/;
  obj.path =    obj.path    || './';

  // clean path
  if(obj.path.substr(obj.path.length-1, 1)!=='/') obj.path += '/';

  // read dir content
  fs.readdir(obj.path, function(err, files){
    if(err) throw err;

    // intermediate call back
    var result = [], count = files.length+1;
    function icb(fls){
      count--;
      for(var i=0; i<fls.length; i++){
        result[result.length] = fls[i];
      }
      if(count === 0) obj.cb(result);
    }
    icb([]);

    // loop over dir content
    for(var i=0; i<files.length; i++){
      (function(file){
        fs.stat(obj.path+file, function(err, stats){
          if(err) throw err;
          if(obj.hidden || !/^\./.test(file)){
            if(stats.isDirectory()){
              scanDir({
                cb:      icb,
                pattern: obj.pattern,
                path:    obj.path+file
              });
            } else {
                if(obj.pattern.test(obj.path+file)){
                  icb([obj.path+file]);
                } else icb([]);
            }
          } else icb([]);
        });
      })(files[i]);
    }
  });
};



/*
 * MERGE FILES HELPER
 */
var mergeFiles = module.exports.mergeFiles = function(srcs, dest){
  var content = '';
  for(var i=0,l=srcs.length;i<l;i++){
    content += fs.readFileSync(srcs[i]);
  }
  fs.writeFileSync(dest, content);
};

