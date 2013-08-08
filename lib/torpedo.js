

/*
 * REQUIRES
 */
var fs =        require(process.env.ROOT_DIR+'/utils/fs')
  , tmpl =      require(process.env.ROOT_DIR+'/tools/templates')
  , parallel =  require(process.env.ROOT_DIR+'/utils/parallel')
  , curry =     require(process.env.ROOT_DIR+'/utils/curry')
  , Server =    require(process.env.ROOT_DIR+'/utils/server')
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



  /*
   * PROCESS FILES
   */
  parallel([
    curry(tmpl.processHTMLs,       tmpl)('.torpedo/tmp/templates_config.js', '.torpedo/tmp/templates_instantiation.js', '.torpedo/tmp/head.html')
  , curry(tmpl.processJavascripts, tmpl)('.torpedo/tmp/custom.js')
  , curry(fs.copyDir,              fs)  ('static', '.torpedo/build/')
  ], function(){

    // build app.js
    fs.mergeFiles([
      process.env.ROOT_DIR+'/node_modules/underscore/underscore.js'
    , process.env.ROOT_DIR+'/node_modules/handlebars/dist/handlebars.runtime.min.js'
    , process.env.ROOT_DIR+'/node_modules/backbone/backbone-min.js'
    , process.env.ROOT_DIR+'/boilerplate/app.js'
    , process.env.ROOT_DIR+'/boilerplate/reactive.js'
    , process.env.ROOT_DIR+'/boilerplate/events.js'
    , process.env.ROOT_DIR+'/boilerplate/templates.js'
    , '.torpedo/tmp/templates_config.js'
    , '.torpedo/tmp/custom.js'
    , '.torpedo/tmp/templates_instantiation.js'
    , process.env.ROOT_DIR+'/boilerplate/init_app.js'
    ],'.torpedo/build/app.js');

    // build index.html
    var head = fs.readFileSync('.torpedo/tmp/head.html');
    fs.writeFileSync(
      '.torpedo/build/index.html'
    , (''+fs.readFileSync(process.env.ROOT_DIR+'/boilerplate/index.html')).replace('{{head}}', head)
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

    that._serveStack--;
    if(that._serveStack!==0){
      that._serveStack--;
      that.serve();
    }

  });
};

