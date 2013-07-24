
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
  ;



/*
 * INIT DIRS
 */
if(!fs.existsSync('.torpedo'))        fs.mkdirSync('.torpedo');
if(!fs.existsSync('.torpedo/tmp'))    fs.mkdirSync('.torpedo/tmp');
if(!fs.existsSync('.torpedo/build'))  fs.mkdirSync('.torpedo/build');



/*
 * PROCESS FILES
 */
parallel([
  curry(tmpl.processTemplates,   tmpl)('.torpedo/tmp/templates_compiled.js')
, curry(tmpl.processJavascripts, tmpl)('.torpedo/tmp/custom.js')
], function(){

  // build app.js
  fs.mergeFiles([
    process.env.ROOT_DIR+'/node_modules/underscore/underscore.js'
  , process.env.ROOT_DIR+'/node_modules/handlebars/dist/handlebars.runtime.min.js'
  , process.env.ROOT_DIR+'/node_modules/backbone/backbone-min.js'
  , process.env.ROOT_DIR+'/boilerplate/_before.js'
  , '.torpedo/tmp/templates_compiled.js'
  , '.torpedo/tmp/custom.js'
  , process.env.ROOT_DIR+'/boilerplate/_after.js'
  ],'.torpedo/build/app.js');

  // build index.html
  fs.writeFileSync(
    '.torpedo/build/index.html'
  , fs.readFileSync(process.env.ROOT_DIR+'/boilerplate/index.html')
  );

  console.log('DONE');
});
