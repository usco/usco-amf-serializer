require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"BnLVf3":[function(require,module,exports){
/*
@author kaosat-dev
*/
var detectEnv = require("composite-detect");
if(detectEnv.isNode)    var THREE = require("three");
if(detectEnv.isBrowser) var THREE = window.THREE;
if(detectEnv.isModule)  var XMLWriter = require('xml-writer');
if(detectEnv.isModule)  var JSZip = require( 'jszip' );

AMFSerializer = function(unit, origin)
{
    this.unit = unit || "milimeter";
    this.origin = origin || "Generated by usco";
}

AMFSerializer.prototype = {
  constructor: AMFSerializer,

  serialize: function( rootElement, compress, fileName ){
    this.writer = new XMLWriter('UTF-8', '1.0');
    var compress = compress || false ;
    var amfContent = this.exportHierarchy ( rootElement );

    if(compress){
      var zipped = new JSZip();
      zipped = zipped.file(fileName, amfContent);
      var outputType = "base64";
      if(detectEnv.isModule) outputType = "nodebuffer";
      console.log("zipping",outputType);
      amfContent = zipped.generate({type: outputType,compression:"DEFLATE"});
    }

    return amfContent;
  },

	exportHierarchy : function (hierarchy) {
		var writer = this.writer;
    var meshes = [];

    writer.startDocument();
    writer.startElement("amf");
    writer.writeAttribute("unit", this.unit);

    this._writeMetaData("cad", this.origin);
    this._writeMaterials(writer, []);

    hierarchy.traverse (function (current) {
			if (current instanceof THREE.Mesh) {
				meshes.push (current);
			}
		});
    //this._writeObject( hierarchy );

    for(var i=0 ; i<meshes.length;i++)
    {
      var part = meshes[i];
      this._writeObject( part );
    }

    this._writeConstellation( hierarchy );

    writer.endElement("amf");
    writer.endDocument();
    result = writer.toString();
    return result;
	},

  _writeMetaData: function(type, data) {
    if(!(type)) throw new Error("Attempting to write metadata with no type");
    var writer = this.writer;

    writer.startElement("metadata");
    writer.writeAttribute("type", "" + type);
    writer.text(data);
    return writer.endElement();
  },

  _writeMaterials: function( materials ) {
    var writer = this.writer;
    writer.startElement("materials");

    for (var i=0, len = materials.length; i < len; i++) {
      material = materials[i];
      this._writeMaterial(material);
    }
    return writer.endElement();
  },

  _writeMaterial: function( material ) {
    var writer = this.writer;
    writer.startElement( "material" );
    this._writeMetaData( "Name", material.name );
    return writer.endElement();
  },

  _writeColor: function(xw, element) {
    xw.startElement("color");
    xw.writeElementString("r", String(element.material.color[0]));
    xw.writeElementString("g", String(element.material.color[1]));
    xw.writeElementString("b", String(element.material.color[2]));
    xw.writeElementString("a", "0");
    return xw.endElement();
  },

  _writeTexture: function(writer, texture) {
    writer.startElement("materials");
    return writer.endElement();
  },

  _writeObject: function( object ) {
    var writer = this.writer;
    var id = object.id;

    writer.startElement("object");
    writer.writeAttribute("id", "" + id);
    if (object.name != null) {
      if (object.name !== "") {
        this._writeMetaData("name", "" + object.name);
      }
    }
    this._writeMesh( object );
    return writer.endElement();
  },

  _writeMesh: function(mesh) {
    var writer = this.writer;
    var geometry = mesh.geometry;

    writer.startElement("mesh");
    this._writeVertices( geometry.vertices );
    this._writeVolumes ( geometry.faces );
    return writer.endElement();
  },
  _writeVertices: function( vertices ) {
    var writer = this.writer
    writer.startElement("vertices");
    for (var i = 0, len = vertices.length; i < len; i++) {
      vertex = vertices[ i ];
      this._writeVertexNode(vertex);
    }
    return writer.endElement();
  },

  _writeVertexNode: function( vertex ) {
    var writer = this.writer;
    writer.startElement("vertex");
    writer.startElement("coordinates");
    writer.writeElement("x", "" + vertex.x);
    writer.writeElement("y", "" + vertex.y);
    writer.writeElement("z", "" + vertex.z);
    writer.endElement();
    return writer.endElement();
  },

  _writeConstellation: function( hierarchy ) {
    var writer = this.writer;
    writer.startElement("constellation");
    writer.writeAttribute("id", "1");

    hierarchy.traverse (function (current) {
			if (current instanceof THREE.Mesh) {
        var rotation = current.rotation;
        var position = current.position;
        if(current.parent)
        {
          var parent = current.parent;
          parent.updateMatrixWorld();
          position = new THREE.Vector3();
          rotation = new THREE.Quaternion();
          var scale = new THREE.Vector3();

          var result = current.matrixWorld.decompose( position, rotation, scale );
        }
        var id = current.id;
        writer.startElement("instance");
        writer.writeAttribute("objectid", "" + id);
        writer.writeElement("deltax", "" + position.x);
        writer.writeElement("deltay", "" + position.y);
        writer.writeElement("deltaz", "" + position.z);
        writer.writeElement("rx", "" + rotation.x);
        writer.writeElement("ry", "" + rotation.y);
        writer.writeElement("rz", "" + rotation.z);
        writer.endElement();

			}
		});

   /* var items = hierarchy.children;
    for (var i = 0, len = items.length; i < len; i++) {
      var child = items[i];
      var id = child.id;
      writer.startElement("instance");
      writer.writeAttribute("objectid", "" + id);
      writer.writeElement("deltax", "" + child.position.x);
      writer.writeElement("deltay", "" + child.position.y);
      writer.writeElement("deltaz", "" + child.position.z);
      writer.writeElement("rx", "" + child.rotation.x);
      writer.writeElement("ry", "" + child.rotation.y);
      writer.writeElement("rz", "" + child.rotation.z);
      writer.endElement();
    }*/
    return writer.endElement();
  },
  
  _writeVolumes: function(faces) {
    var writer = this.writer;
    writer.startElement("volume");
    for (var i = 0, len = faces.length; i < len; i++) {
      var face = faces[i];
      this._writeTriangle( face );
    }
    return writer.endElement();
  },
  _writeTriangle: function(face) {
    var writer = this.writer;
      writer.startElement("triangle");
      writer.writeElement("v1", "" + face.a);
      writer.writeElement("v2", "" + face.b);
      writer.writeElement("v3", "" + face.c);
      return writer.endElement();
  },

};

if (detectEnv.isModule) module.exports = AMFSerializer;


},{"composite-detect":false,"jszip":false,"three":false,"xml-writer":3}],"amf-serializer":[function(require,module,exports){
module.exports=require('BnLVf3');
},{}],3:[function(require,module,exports){
module.exports = require('./lib/xml-writer.js');

},{"./lib/xml-writer.js":4}],4:[function(require,module,exports){

function strval(s) {
  if (typeof s == 'string') {
    return s;
  } 
  else if (typeof s == 'function') {
    return s();
  } 
  else if (s instanceof XMLWriter) {
    return s.toString();
  }
  else throw Error('Bad Parameter');
}

function XMLWriter(indent, callback) {

    if (!(this instanceof XMLWriter)) {
        return new XMLWriter();
    }

    this.name_regex = /[_:A-Za-z][-._:A-Za-z0-9]*/;
    this.indent = indent ? true : false;
    this.output = '';
    this.stack = [];
    this.tags = 0;
    this.attributes = 0;
    this.attribute = 0;
    this.texts = 0;
    this.comment = 0;
    this.dtd = 0;
    this.root = '';
    this.pi = 0;
    this.cdata = 0;
    this.started_write = false;
    this.writer;
    this.writer_encoding = 'UTF-8';

    if (typeof callback == 'function') {
        this.writer = callback;
    } else {
        this.writer = function (s, e) {
            this.output += s;
        }
    }
}

XMLWriter.prototype = {
    toString : function () {
        this.flush();
        return this.output;
    },

    indenter : function () {
      if (this.indent) {
        this.write('\n');
        for (var i = 1; i < this.tags; i++) {
          this.write('    ');
        }
      }
    },

    write : function () {
        for (var i = 0; i < arguments.length; i++) {
            this.writer(arguments[i], this.writer_encoding);
        }
    },


    flush : function () {
        for (var i = this.tags; i > 0; i--) {
            this.endElement();
        }
        this.tags = 0;
    },

    startDocument : function (version, encoding, standalone) {
        if (this.tags || this.attributes) return this;
        
        this.startPI('xml');
        this.startAttribute('version');
        this.text(typeof version == "string" ? version : "1.0");
        this.endAttribute();
        if (typeof encoding == "string") {
            this.startAttribute('encoding');
            this.text(encoding);
            this.endAttribute();
            writer_encoding = encoding;
        }
        if (standalone) {
            this.startAttribute('standalone');
            this.text("yes");
            this.endAttribute();
        }
        this.endPI();
        if (!this.indent) {
          this.write('\n');
        }
        return this;
    },

    endDocument : function () {
        if (this.attributes) this.endAttributes();
        return this;
    },

    writeElement : function (name, content) {
        return this.startElement(name).text(content).endElement();
    },

    writeElementNS : function (prefix, name, uri, content) {
        if (!content) {
            content = uri;
        }
        return this.startElementNS(prefix, name, uri).text(content).endElement();
    },

    startElement : function (name) {
        name = strval(name);
        if (!name.match(this.name_regex)) throw Error('Invalid Parameter');
        if (this.tags === 0 && this.root && this.root !== name) throw Error('Invalid Parameter');
        if (this.attributes) this.endAttributes();
        ++this.tags;
        this.texts = 0;
        if (this.stack.length > 0)
          this.stack[this.stack.length-1].containsTag = true;
        
        this.stack.push({
            name: name,
            tags: this.tags
        });
        if (this.started_write) this.indenter();
        this.write('<', name);
        this.startAttributes();
        this.started_write = true;
        return this;
    },
    startElementNS : function (prefix, name, uri) {
        prefix = strval(prefix);
        name = strval(name);

        if (!prefix.match(this.name_regex)) throw Error('Invalid Parameter');
        if (!name.match(this.name_regex)) throw Error('Invalid Parameter');
        if (this.attributes) this.endAttributes();
        ++this.tags;
        this.texts = 0;
        if (this.stack.length > 0)
          this.stack[this.stack.length-1].containsTag = true;
        
        this.stack.push({
            name: prefix + ':' + name,
            tags: this.tags
        });
        if (this.started_write) this.indenter();
        this.write('<', prefix + ':' + name);
        this.startAttributes();
        this.started_write = true;
        return this;
    },

    endElement : function () {
        if (!this.tags) return this;
        var t = this.stack.pop();
        if (this.attributes > 0) {
            if (this.attribute) {
                if (this.texts) this.endAttribute();
                this.endAttribute();
            }
            this.write('/');
            this.endAttributes();
        } else {
            if (t.containsTag) this.indenter();
            this.write('</', t.name, '>');
        }
        --this.tags;
        this.texts = 0;
        return this;
    },

    writeAttribute : function (name, content) {
        return this.startAttribute(name).text(content).endAttribute();
    },
    writeAttributeNS : function (prefix, name, uri, content) {
        if (!content) {
            content = uri;
        }
        return this.startAttributeNS(prefix, name, uri).text(content).endAttribute();
    },

    startAttributes : function () {
        this.attributes = 1;
        return this;
    },

    endAttributes : function () {
        if (!this.attributes) return this;
        if (this.attribute) this.endAttribute();
        this.attributes = 0;
        this.attribute = 0;
        this.texts = 0;
        this.write('>');
        return this;
    },

    startAttribute : function (name) {
        name = strval(name);
        if (!name.match(this.name_regex)) throw Error('Invalid Parameter');
        if (!this.attributes && !this.pi) return this;
        if (this.attribute) return this;
        this.attribute = 1;
        this.write(' ', name, '="');
        return this;
    },
    startAttributeNS : function (prefix, name, uri) {
        prefix = strval(prefix);
        name = strval(name);

        if (!prefix.match(this.name_regex)) throw Error('Invalid Parameter');
        if (!name.match(this.name_regex)) throw Error('Invalid Parameter');
        if (!this.attributes && !this.pi) return this;
        if (this.attribute) return this;
        this.attribute = 1;
        this.write(' ', prefix + ':' + name, '="');
        return this;
    },
    endAttribute : function () {
        if (!this.attribute) return this;
        this.attribute = 0;
        this.texts = 0;
        this.write('"');
        return this;
    },

    text : function (content) {
        content = strval(content);
        if (!this.tags && !this.comment && !this.pi && !this.cdata) return this;
        if (this.attributes && this.attribute) {
            ++this.texts;
            this.write(content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
            return this;
        } else if (this.attributes && !this.attribute) {
            this.endAttributes();
        } 
        if (this.comment) {
            this.write(content);
        }
        else {
          this.write(content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
        }
        ++this.texts;
        this.started_write = true;
        return this;
    },

    writeComment : function (content) {
        return this.startComment().text(content).endComment();
    },

    startComment : function () {
        if (this.comment) return this;
        if (this.attributes) this.endAttributes();
        this.indenter();
        this.write('<!--');
        this.comment = 1;
        this.started_write = true;
        return this;
    },

    endComment : function () {
        if (!this.comment) return this;
        this.write('-->');
        this.comment = 0;
        return this;
    },

    writeDocType : function (name, pubid, sysid, subset) {
        return this.startDocType(name, pubid, sysid, subset).endDocType()
    },

    startDocType : function (name, pubid, sysid, subset) {
        if (this.dtd || this.tags) return this;

        name = strval(name);
        pubid = pubid ? strval(pubid) : pubid;
        sysid = sysid ? strval(sysid) : sysid;
        subset = subset ? strval(subset) : subset;

        if (!name.match(this.name_regex)) throw Error('Invalid Parameter');
        if (pubid && !pubid.match(/^[\w\-][\w\s\-\/\+\:\.]*/)) throw Error('Invalid Parameter');
        if (sysid && !sysid.match(/^[\w\.][\w\-\/\\\:\.]*/)) throw Error('Invalid Parameter');
        if (subset && !subset.match(/[\w\s\<\>\+\.\!\#\-\?\*\,\(\)\|]*/)) throw Error('Invalid Parameter');

        pubid = pubid ? ' PUBLIC "' + pubid + '"' : (sysid) ? ' SYSTEM' : '';
        sysid = sysid ? ' "' + sysid + '"' : '';
        subset = subset ? ' [' + subset + ']': '';

        if (this.started_write) this.indenter();
        this.write('<!DOCTYPE ', name, pubid, sysid, subset);
        this.root = name;
        this.dtd = 1;
        this.started_write = true;
        return this;
    },

    endDocType : function () {
        if (!this.dtd) return this;
        this.write('>');
        return this;
    },

    writePI : function (name, content) {
        return this.startPI(name).text(content).endPI()
    },

    startPI : function (name) {
        name = strval(name);
        if (!name.match(this.name_regex)) throw Error('Invalid Parameter');
        if (this.pi) return this;
        if (this.attributes) this.endAttributes();
        if (this.started_write) this.indenter();
        this.write('<?', name);
        this.pi = 1;
        this.started_write = true;
        return this;
    },

    endPI : function () {
        if (!this.pi) return this;
        this.write('?>');
        this.pi = 0;
        return this;
    },

    writeCData : function (content) {
        return this.startCData().text(content).endCData();
    },

    startCData : function () {
        if (this.cdata) return this;
        if (this.attributes) this.endAttributes();
        this.indenter();
        this.write('<![CDATA[');
        this.cdata = 1;
        this.started_write = true;
        return this;
    },

    endCData : function () {
        if (!this.cdata) return this;
        this.write(']]>');
        this.cdata = 0;
        return this;
    },

    writeRaw : function(content) {  
        content = strval(content);
        if (!this.tags && !this.comment && !this.pi && !this.cdata) return this;
        if (this.attributes && this.attribute) {
            ++this.texts;
            this.write(content.replace('&', '&amp;').replace('"', '&quot;'));
            return this;
        } else if (this.attributes && !this.attribute) {
            this.endAttributes();
        }
        ++this.texts;
        this.write(content);
        this.started_write = true;
        return this;
    }

}

module.exports = XMLWriter;

},{}]},{},["BnLVf3"])