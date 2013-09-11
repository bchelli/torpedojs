var fs = require(process.env.ROOT_DIR+'/utils/fs')
  , hb = require('handlebars')
  , path = require('path')
  ;

var tmplRegExp = /\<template([^\>]*)\>([^]*)\<\/template\>/
  , headRegExp = /\<head([^\>]*)\>([^]*)\<\/head\>/
  , attrRegExp = [
      /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/,
      /(\S+)/
    ]
  ;

function parseAttributes(content){
  var attrs = {}, m;
  content = content.trim();
  for(var i in attrRegExp){
    while(m = attrRegExp[i].exec(content)){
      content = content.replace(m[0], '').trim();
      attrs[m[1]] = m[2] ? m[2].replace(/\\"/g, '"').replace(/\\'/g, "'") : '';
    }
  }
  return attrs;
}

function appendAttrs(attrs, values){
  for(var i in values){
    if(i === 'class' && attrs['class']){
      attrs['class']+=' '+values['class'];
    } else attrs[i]=values[i];
  }
}

function generateAttributes(attrs){
  var result = '';
  for(var i in attrs){
    result += ' '+i;
    if(attrs[i]!==''){
      result += '="'+attrs[i].replace('"', '\\"')+'"'
    }
  }
  return result;
}

function extractTemplates(content){
  var templates = [], m;
  while(m = tmplRegExp.exec(content)){
    if(m[0].indexOf('</template>')!=-1) m[0] = m[0].substr(0, m[0].indexOf('</template>')+11);
    if(m[2].indexOf('</template>')!=-1) m[2] = m[2].substr(0, m[2].indexOf('</template>'));
    content = content.replace(m[0], '');
    if(m && m[0]){
      templates.push({
        attrs: parseAttributes(m[1]),
        inner: m[2]
      });
    }
  }
  return templates;
}

function extractHead(content){
  var m;
  if(m = headRegExp.exec(content)){
    if(m[2]){
      return m[2];
    }
  }
  return null;
}

module.exports = {
  processHTMLs:function(outputTemplatesConfig, outputTemplatesInstantiation, outputHeaders, cb){
    fs.scanDir({
      cb:function(files){
        var templatesConfig = [];
        var templatesInstantiation = [];
        var heads = [];
        templatesConfig[templatesConfig.length] = 'Templates = {};\n'
        for(var i in files){

          if(files[i].indexOf('./static/') === 0) continue;

          var content = ''+fs.readFileSync(files[i]);

          // step 1 - extract the templates
          var tmpls = extractTemplates(content);
          for(var j in tmpls){
            templatesConfig[templatesConfig.length] = 'Templates["'+tmpls[j].attrs['name']+'"] = {\n'
                                                        +'"templateName":"'+tmpls[j].attrs['name']+'",\n'
                                                        +'"template":Handlebars.compile('+JSON.stringify(tmpls[j].inner)+'),\n'
                                                        +'"attrs":'+JSON.stringify(tmpls[j].attrs)+'\n'
                                                      +'};\n\n';

            templatesInstantiation[templatesInstantiation.length] = 'new Torpedo.Template(Templates["'+tmpls[j].attrs['name']+'"]);\n\n';
          }

          // step 2 - extract the headers
          var head = extractHead(content);
          if(head){
            heads[heads.length] = head;
          }

        }
        if(fs.existsSync(outputHeaders)){
          fs.appendFileSync(outputHeaders, heads.join('\n'));
        } else {
          fs.writeFileSync(outputHeaders, heads.join('\n'));
        }
        fs.writeFileSync(outputTemplatesConfig,         templatesConfig.join(''));
        fs.writeFileSync(outputTemplatesInstantiation,  templatesInstantiation.join(''));
        cb();
      },
      pattern: /^.*\.html$/
    });
  }
, processJavascripts:function(outputDir, outputHeaders, cb){
    fs.scanDir({
      cb:function(files){
        var heads = [];
        for(var i in files){
          if(files[i].indexOf('./static/') === 0) continue;
          heads[heads.length] = '    <script src="'+path.normalize('js/'+files[i])+'" type="text/javascript"></script>';
          fs.mkPath(outputDir+files[i]);
          fs.writeFileSync(outputDir+files[i], fs.readFileSync(files[i]));
        }
        if(fs.existsSync(outputHeaders)){
          fs.appendFileSync(outputHeaders, heads.join('\n'));
        } else {
          fs.writeFileSync(outputHeaders, heads.join('\n'));
        }
        cb();
      },
      pattern: /^.*\.js$/
    });
  }
}
