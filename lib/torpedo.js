

/*
 * REQUIRES
 */
var fs =        require(process.env.ROOT_DIR+'/utils/fs')
  , tmpl =      require(process.env.ROOT_DIR+'/tools/templates')
  , parallel =  require(process.env.ROOT_DIR+'/utils/parallel')
  , curry =     require(process.env.ROOT_DIR+'/utils/curry')
  , Server =    require(process.env.ROOT_DIR+'/utils/server')
  , LiveReload =require(process.env.ROOT_DIR+'/utils/livereload')
  ;


function build(theCB){
  /*
   * INIT DIRS
   */
  if(!fs.existsSync('.torpedo'))        fs.mkdirSync('.torpedo');

  // create tmp directory
  fs.rmdirRecursiveSync('.torpedo/tmp');
  fs.mkdirSync('.torpedo/tmp');

  // create build directory
  fs.rmdirRecursiveSync('.torpedo/build');
  fs.mkdirSync('.torpedo/build');

  // create js directory
  fs.rmdirRecursiveSync('.torpedo/build/js');
  fs.mkdirSync('.torpedo/build/js');



  /*
   * PROCESS FILES
   */
  parallel([
    curry(tmpl.processHTMLs,       tmpl)('.torpedo/build/templates_config.js', '.torpedo/build/templates_instantiation.js', '.torpedo/tmp/head.html')
  , curry(tmpl.processJavascripts, tmpl)('.torpedo/build/js/', '.torpedo/tmp/scripts.html')
  , curry(fs.copyDir,              fs)  ('static', '.torpedo/build/')
  , curry(fs.copyDir,              fs)  (process.env.ROOT_DIR+'/vendors/', '.torpedo/build/')
  , curry(fs.copyDir,              fs)  (process.env.ROOT_DIR+'/core/', '.torpedo/build/')
  ], function(){

    // build index.html
    var head = fs.readFileSync('.torpedo/tmp/head.html');
    var scripts = fs.readFileSync('.torpedo/tmp/scripts.html');
    fs.writeFileSync(
      '.torpedo/build/index.html'
    , (''+fs.readFileSync(process.env.ROOT_DIR+'/boilerplate/index.html'))
          .replace('{{head}}', head)
          .replace('{{scripts}}', scripts)
    );

    // copy loading.gif
    fs.writeFileSync(
      '.torpedo/build/loading.gif'
    , fs.readFileSync(process.env.ROOT_DIR+'/boilerplate/loading.gif')
    );

    // clean tmp directory
    fs.rmdirRecursiveSync('.torpedo/tmp');

    console.log('');
    console.log('');
    console.log('TorpedoJS: BUILD OK');
    console.log('');
    theCB();
  });
}

var Torpedo = module.exports = function (serverPort, proxyDomain){
  this.server = new Server('.torpedo/build', serverPort, proxyDomain);
  this.livereload = new LiveReload();
  this._serveStack = 0;
}

Torpedo.prototype.build = build;

Torpedo.prototype.serve = function(){
  var that = this;

  that._serveStack++;
  if(that._serveStack!==1) return;

  that.server.stop();
  that.build(function(){
    that.server.start();
    that.livereload.setVersion(Date.now());
    that.livereload.installHandlers(that.server.getServer());

    that._serveStack--;
    if(that._serveStack!==0){
      that._serveStack--;
      that.serve();
    }

  });
};

