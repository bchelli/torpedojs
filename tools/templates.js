var fs = require(process.env.ROOT_DIR+'/utils/fs')
  , hb = require('handlebars')
  ;

var tmplRegExp = /\<template([^\>]*)\>([^]*)\<\/template\>/
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

module.exports = {
  processTemplates:function(output, cb){
    fs.scanDir({
      cb:function(files){
        var templates = [];
        for(var i in files){
          var content = ''+fs.readFileSync(files[i]);
          var tmpls = extractTemplates(content);
          for(var i in tmpls){
            templates[templates.length] = 'Templates["'+tmpls[i].attrs['name']+'"] = new Template({\n'
                                            +'"_handlebars_render":'+hb.precompile(tmpls[i].inner)+',\n'
                                            +'"_attrs":'+JSON.stringify(tmpls[i].attrs)+'\n'
                                          +'});\n\n';
            templates[templates.length] = 'Handlebars.registerPartial(\n'
                                            +'"'+tmpls[i].attrs['name']+'",\n'
                                            +'Templates["'+tmpls[i].attrs['name']+'"]._handlebars_render'
                                          +');\n\n';
          }
        }
        fs.writeFileSync(output, templates.join(''));
        cb();
      },
      pattern: /^.*\.html$/
    });
  }
, processJavascripts:function(output, cb){
    fs.scanDir({
      cb:function(files){
        var result = [];
        for(var i in files){
          result[result.length] = ''+fs.readFileSync(files[i]);
        }
        fs.writeFileSync(output, result.join(''));
        cb();
      },
      pattern: /^.*\.js$/
    });
  }
}
