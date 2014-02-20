###
@author kaosat-dev 
###
#XMLWriter = require 'XMLWriter'
XmlWriter = require('simple-xml-writer').XmlWriter

AMFSerializer:: =
  constructor: AMFSerializer
  
  _writeColor:(xw, element)->
    xw.writeStartElement( "color" )
    xw.writeElementString("r", String(element.material.color[0]))
    xw.writeElementString("g", String(element.material.color[1]))
    xw.writeElementString("b", String(element.material.color[2]))
    xw.writeElementString("a","0")
    xw.writeEndElement()
  
  _writeMaterials:( writer, materials )->
    writer.writeStartElement( "materials" )
    for material, index in materials
      @_writeMaterial( writer, material)
    writer.writeEndElement()
  
  _writeMaterial:( writer, material )->
    writer.writeStartElement( "material" )
    @_writeMetaData(writer,"Name",material.name)
    #TODO: add support for composite, graded etc materials
    writer.writeEndElement()
    
  _writeTexture:( writer, texture )->
    writer.writeStartElement( "materials" )
    writer.writeEndElement() 
  
  _writeConstellation:(writer, hierarchy)->
    writer.writeStartElement( "constellation" )
    writer.writeAttributeString("id", "1")
    for child in hierarchy.children
      id = child.id
      writer.writeStartElement( "instance" )
      
      writer.writeAttributeString("objectid", "#{id}")
      writer.writeElementString( "deltax","#{child.position.x}" )
      writer.writeElementString( "deltay","#{child.position.y}" )
      writer.writeElementString( "deltaz","#{child.position.z}" )
      
      writer.writeElementString( "rx","#{child.rotation.x}" )
      writer.writeElementString( "ry","#{child.rotation.y}" )
      writer.writeElementString( "rz","#{child.rotation.z}" )
      
      writer.writeEndElement()
    
    #close constellation
    writer.writeEndElement()  
  
  
  _writeObject:(writer, object)->
    id = object.id
    writer.writeStartElement( "object" )
    writer.writeAttributeString("id", "#{id}")
    if object.name?
      if object.name != ""
        @_writeMetaData(writer,"name","#{object.name}")
    @_writeMesh(writer, object)
    
    writer.writeEndElement()
  
  _writeMesh:(writer, mesh)->
    geometry = mesh.geometry
    writer.writeStartElement( "mesh" )
    
    @_writeVertices( writer, geometry.vertices )
    @_writeVolumes( writer, geometry.faces )
    
    writer.writeEndElement()
  
  _writeVertices:(writer, vertices)->
    writer.writeStartElement( "vertices" )
    
    for vertex in vertices
      @_writeVertexNode( writer, vertex )
      
    writer.writeEndElement()
    
  _writeVertexNode:( writer, vertex )->
    writer.writeStartElement( "vertex" )
    writer.writeStartElement( "coordinates" )
    
    writer.writeElementString( "x","#{vertex.x}" )
    writer.writeElementString( "y","#{vertex.y}" )
    writer.writeElementString( "z","#{vertex.z}" )
    
    writer.writeEndElement()
    writer.writeEndElement()
  
  _writeVolumes:(writer, faces)->
    writer.writeStartElement( "volume" )
    
    for face in faces
      @_writeTriangle( writer, face )
    
    writer.writeEndElement() 
  
  _writeTriangle:(writer, face)->
    if face instanceof THREE.Face3
      writer.writeStartElement( "triangle" )
      writer.writeElementString( "v1" , "#{face.a}" )
      writer.writeElementString( "v2" , "#{face.b}" )
      writer.writeElementString( "v3" , "#{face.c}" )
      writer.writeEndElement()
    else if face instanceof THREE.Face4
      writer.writeStartElement( "triangle" )
      writer.writeElementString( "v1" , "#{face.a}" )
      writer.writeElementString( "v2" , "#{face.b}" )
      writer.writeElementString( "v3" , "#{face.c}" )
      writer.writeEndElement()
      
      writer.writeStartElement( "triangle" )
      writer.writeElementString( "v1" , "#{face.c}" )
      writer.writeElementString( "v2" , "#{face.d}" )
      writer.writeElementString( "v3" , "#{face.a}" )
      writer.writeEndElement()
    
  
  _writeMetaData:(writer, type="cad", data="Generated by coffeescad v0.33")->
    writer.writeStartElement("metadata")
    writer.writeAttributeString("type", "#{type}")
    writer.writeString(data)
    writer.writeEndElement()
    
  
  serialize: ( rootElement ) ->
    console.log object
    @unit = "milimeter"
    @origin = "Generated by coffeescad v0.33"

    #------prepare xml------
    writer = new XMLWriter( 'UTF-8', '1.0' )
    writer.writeStartDocument()
    writer.writeStartElement("amf")
    @_writeMetaData(writer,"cad","Generated by coffeescad v0.33")
    writer.writeAttributeString("unit",unit)
    @_writeMaterials( writer, [])
    
    #-------------------------------
    
    for part, index in object.children
      @_writeObject(writer, part)
      
    @_writeConstellation(writer, object)
    
    writer.writeEndDocument()
    result = writer.flush()
    return result
    
    
if (detectEnv.isModule)
  module.exports = AMFSerializer
