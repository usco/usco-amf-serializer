/*
@author kaosat-dev
*/
var detectEnv = require("composite-detect");
if(detectEnv.isModule) var XMLWriter = require('xml-writer');
if(detectEnv.isModule) var JSZip = require( 'jszip' );
if(detectEnv.isModule) var THREE = require("three");


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

