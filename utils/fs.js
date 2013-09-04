
var fs = module.exports =   require('fs')
  , path =                  require('path')
  , parallel =              require(process.env.ROOT_DIR+'/utils/parallel')
  , curry =                 require(process.env.ROOT_DIR+'/utils/curry')
  ;



/*
 * SCAN DIR HELPER
 */
var mkPath = module.exports.mkPath = function(file){
  var p = path.dirname(file);
  if(!fs.existsSync(p)){
    mkPath(p);
    fs.mkdirSync(p);
  }
}



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



/*
 * COPY A DIRECTORY AND ITS CONTENT
 */
var copyDir = module.exports.copyDir = function(src, dest, cb){

  // clean paths
  src = path.resolve(src);
  dest = path.resolve(dest);

  // do nothing if does not exists
  if(!fs.existsSync(src)) cb();
  else {

    // read info of the src
    var stats = fs.statSync(src);

    // create dest file path
    var destContent = path.resolve(dest, path.basename(src));

    if(stats.isDirectory()){

      // create dir
      fs.mkdirSync(destContent);

      // read content of the src dir
      var files = fs.readdirSync(src);
      var fns = [];
      for(var i in files){
        fns[i] = curry(copyDir)(path.resolve(src, files[i]), destContent);
      }

      // copy content
      parallel(fns, cb);

    } else {

      // copy the file
      fs.writeFileSync(destContent, fs.readFileSync(src));
      cb();

    }

  }

};



/*
 * REMOVE A DIRECTORY AND ITS CONTENT
 */
var rmdirRecursiveSync = module.exports.rmdirRecursiveSync = function(src){

  // clean paths
  src = path.resolve(src);

  // do nothing if does not exists
  if(!fs.existsSync(src)) return;

  // read info of the src
  var stats = fs.statSync(src);

  if(stats.isDirectory()){

    // read content of the src dir
    var files = fs.readdirSync(src);

    // remove content
    for(var i in files){
      rmdirRecursiveSync(path.resolve(src, files[i]))
    }

    // remove the actual directory
    fs.rmdirSync(src);

  } else {

    // remove the file
    fs.unlinkSync(src);

  }

};

