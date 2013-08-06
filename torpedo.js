
/*
 * INIT ROOT DIR
 */
process.env.ROOT_DIR = __dirname;



/*
 * REQUIRES
 */
var fs =        require(process.env.ROOT_DIR+'/utils/fs')
  , tmpl =      require(process.env.ROOT_DIR+'/tools/templates')
  , parallel =  require(process.env.ROOT_DIR+'/utils/parallel')
  , curry =     require(process.env.ROOT_DIR+'/utils/curry')
  , Server =    require(process.env.ROOT_DIR+'/utils/server')
  , server =    new Server('.torpedo/build', process.argv[2] || 8080, process.argv[3] || 'us.venteprivee.com:443')
  , watch =     require('watch')
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
    , process.env.ROOT_DIR+'/boilerplate/_before.js'
    , '.torpedo/tmp/templates_config.js'
    , '.torpedo/tmp/custom.js'
    , '.torpedo/tmp/templates_instantiation.js'
    , process.env.ROOT_DIR+'/boilerplate/_after.js'
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

var activeRes = [];
function allProcess(f){
  if(f && f.indexOf && f.indexOf('.torpedo/') === 0) return;
  server.stop();
  build(function(){
    server.get('/torpedo/version', function(req, res){activeRes[activeRes.length] = res;});
    server.start();
  });
}

watch.watchTree('./', allProcess);
