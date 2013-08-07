
/*
 * INIT ROOT DIR
 */
process.env.ROOT_DIR = __dirname;




/*
 * REQUIRES
 */
var Torpedo =   require(process.env.ROOT_DIR+'/lib/torpedo')
  , server =    new Torpedo(process.argv[2] || 8080, process.argv[3] || 'us.venteprivee.com:443')
  , watch =     require('watch')
  ;




var activeRes = [];
watch.watchTree('./', function(f){
  if(f && f.indexOf && f.indexOf('.torpedo/') === 0) return;
  server.serve();
});
