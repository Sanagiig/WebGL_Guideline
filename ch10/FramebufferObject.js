// FramebufferObject.js (c) matsuda and kanda
// Vertex shader program
var VSHADER_SOURCE =`
attribute vec4 a_Position;
attribute vec2 a_TexCoord;
attribute vec4 a_Color;

uniform mat4 u_MvpMatrix;
varying vec2 v_TexCoord;
varying vec4 v_Color;

void main(){
  v_TexCoord = a_TexCoord;
  v_Color = a_Color;
  gl_Position =   u_MvpMatrix * a_Position;
}
`;

// Fragment shader program
var FSHADER_SOURCE =
`
#ifdef GL_ES
precision mediump float;
#endif

uniform float u_UseColor;
uniform sampler2D u_Sampler;

varying vec4 v_Color;
varying vec2 v_TexCoord;
void main(){
  gl_FragColor = u_UseColor == 0.0 
    ? texture2D(u_Sampler,v_TexCoord) 
    : v_Color;
}
`;

// Size of off screen
var OFFSCREEN_WIDTH = 256;
var OFFSCREEN_HEIGHT = 256;
let eyePosition = [ 0.0, 0.0, 7.0];

var fbo;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of attribute variables and uniform variables
  var program = gl.program; // Get program object
  program.a_Position = gl.getAttribLocation(program, 'a_Position');
  program.a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');
  program.a_Color = gl.getAttribLocation(program, 'a_Color');
  program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
  if (program.a_Position < 0 || program.a_TexCoord < 0 || program.a_Color < 0 || !program.u_MvpMatrix) {
    console.log('Failed to get the storage location of a_Position, a_TexCoord, u_MvpMatrix');
    return;
  }

  // Set the vertex information
  var cube = initVertexBuffersForCube(gl);
  var plane = initVertexBuffersForPlane(gl);
  if (!cube || !plane) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Set texture
  var texture = initTextures(gl);
  if (!texture) {
    console.log('Failed to intialize the texture.');
    return;
  }

  // Initialize framebuffer object (FBO)
  fbo = initFramebufferObject(gl);
  if (!fbo) {
    console.log('Failed to intialize the framebuffer object (FBO)');
    return;
  }

  // Enable depth test
  gl.enable(gl.DEPTH_TEST);   //  gl.enable(gl.CULL_FACE);

  var viewProjMatrix = new Matrix4();   // Prepare view projection matrix for color buffer
  viewProjMatrix.setPerspective(30, canvas.width/canvas.height, 1.0, 100.0);
  viewProjMatrix.lookAt(0.0, 0.0, 7.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

  var viewProjMatrixFBO = new Matrix4();   // Prepare view projection matrix for FBO
  viewProjMatrixFBO.setPerspective(30.0, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, 1.0, 100.0);
  viewProjMatrixFBO.lookAt(0.0, 2.0, 7.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

  // Start drawing
  var currentAngle = 0.0; // Current rotation angle (degrees)
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update current rotation angle
    draw(gl, canvas, fbo, plane, cube, currentAngle, texture, viewProjMatrix, viewProjMatrixFBO);
    window.requestAnimationFrame(tick, canvas);
  };
  tick();
}

function initVertexBuffersForCube(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3

  // Vertex coordinates
  var vertices = new Float32Array([
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
  ]);

  var colors = new Float32Array([   // Colors
      1.0, 0.18, 0.56,1.0,  0.32, 0.18, 0.56,1.0,  0.32, 0.18, 0.56,1.0,  0.32, 0.18, 0.56,1.0, // v0-v1-v2-v3 front
      1.0, 0.41, 0.69, 1.0,  0.5, 0.41, 0.69,1.0,   0.5, 0.41, 0.69,1.0,   0.5, 0.41, 0.69,1.0,  // v0-v3-v4-v5 right
      1.0, 0.69, 0.84,1.0,  0.78, 0.69, 0.84,1.0,  0.78, 0.69, 0.84,1.0,  0.78, 0.69, 0.84,1.0, // v0-v5-v6-v1 up
      1.0, 0.32, 0.61, 1.0,  0.0, 0.32, 0.61,1.0,   0.0, 0.32, 0.61,1.0,   0.0, 0.32, 0.61,1.0,  // v1-v6-v7-v2 left
      1.0, 0.58, 0.82, 1.0, 0.27, 0.58, 0.82,1.0,  0.27, 0.58, 0.82,1.0,  0.27, 0.58, 0.82,1.0, // v7-v4-v3-v2 down
      1.0, 0.82, 0.93,1.0,  0.73, 0.82, 0.93,1.0,  0.73, 0.82, 0.93,1.0,  0.73, 0.82, 0.93,1.0, // v4-v7-v6-v5 back
      ]);

  // Texture coordinates
  var texCoords = new Float32Array([
      1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
      0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
      1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    // v0-v5-v6-v1 up
      1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
      0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
      0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ])

  var o = new Object();  // Create the "Object" object to return multiple objects.

  // Write vertex information to buffer object
  o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
  o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
  o.colorBuffer = initArrayBufferForLaterUse(gl, colors, 4, gl.FLOAT);
  o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
  if (!o.vertexBuffer || !o.texCoordBuffer || !o.indexBuffer) return null; 

  o.numIndices = indices.length;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}

function initVertexBuffersForPlane(gl) {
  // Create face
  //  v1------v0
  //  |        | 
  //  |        |
  //  |        |
  //  v2------v3

  // Vertex coordinates
  var vertices = new Float32Array([
    1.0, 1.0, 0.0,  -1.0, 1.0, 0.0,  -1.0,-1.0, 0.0,   1.0,-1.0, 0.0    // v0-v1-v2-v3
  ]);

  // Texture coordinates
  var texCoords = new Float32Array([1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0]);

  var colors = new Float32Array([   // Colors
  1.0, 0.18, 0.56,1.0,  0.32, 0.18, 0.56,1.0,  0.32, 0.18, 0.56,1.0,  0.32, 0.18, 0.56,1.0, // v0-v1-v2-v3 front
  ]);
  // Indices of the vertices
  var indices = new Uint8Array([0, 1, 2,   0, 2, 3]);

  var o = new Object(); // Create the "Object" object to return multiple objects.

  // Write vertex information to buffer object
  o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
  o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
  o.colorBuffer = initArrayBufferForLaterUse(gl, colors, 4, gl.FLOAT);
  o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
  if (!o.vertexBuffer || !o.texCoordBuffer || !o.colorBuffer || !o.indexBuffer) return null; 

  o.numIndices = indices.length;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}

function initArrayBufferForLaterUse(gl, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Store the necessary information to assign the object to the attribute variable later
  buffer.num = num;
  buffer.type = type;

  return buffer;
}

function initElementArrayBufferForLaterUse(gl, data, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

  buffer.type = type;

  return buffer;
}

function initTextures(gl) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the Texture object');
    return null;
  }

  // Get storage location of u_Sampler
  var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!u_Sampler) {
    console.log('Failed to get the storage location of u_Sampler');
    return null;
  }

  var image = new Image();  // Create image object
  if (!image) {
    console.log('Failed to create the Image object');
    return null;
  }
  // Register the event handler to be called when image loading is completed
  image.onload = function() {
    // Write image data to texture object
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image Y coordinate
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    // Pass the texure unit 0 to u_Sampler
    gl.uniform1i(u_Sampler, 0);

    gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture object
  };

  // Tell the browser to load an Image  
  image.src = '../resources/sky_cloud.jpg';

  return texture;
}

function initFramebufferObject(gl) {
  var framebuffer, texture, depthBuffer;

  // Define the error handling function
  var error = function() {
    if (framebuffer) gl.deleteFramebuffer(framebuffer);
    if (texture) gl.deleteTexture(texture);
    if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
    return null;
  }

  // Create a frame buffer object (FBO)
  framebuffer = gl.createFramebuffer();
  if (!framebuffer) {
    console.log('Failed to create frame buffer object');
    return error();
  }

  // Create a texture object and set its size and parameters
  texture = gl.createTexture(); // Create a texture object
  if (!texture) {
    console.log('Failed to create texture object');
    return error();
  }
  gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the object to target
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  framebuffer.texture = texture; // Store the texture object

  // Create a renderbuffer object and Set its size and parameters
  depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
  if (!depthBuffer) {
    console.log('Failed to create renderbuffer object');
    return error();
  }
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); // Bind the object to target
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

  // Attach the texture and the renderbuffer object to the FBO
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

  // Check if FBO is configured correctly
  var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (gl.FRAMEBUFFER_COMPLETE !== e) {
    console.log('Frame buffer object is incomplete: ' + e.toString());
    return error();
  }

  // Unbind the buffer object
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);


  return framebuffer;
}
function draw(gl, canvas, fbo, plane, cube, angle, texture, viewProjMatrix, viewProjMatrixFBO) {
  drawTexturedCube(gl, gl.program, cube, angle, texture, viewProjMatrixFBO);   // Draw the cube

  drawTexturedPlane(gl, gl.program, plane, angle, fbo.texture, viewProjMatrix);  // Draw the plane
}

function setMatrix(gl) {
  const u_MvpMatrix = gl.getUniformLocation((gl).program, "u_MvpMatrix");

  const m = new Matrix4().setRotate(ang ,0,1,0);
  const v = new Matrix4().setLookAt(eyePosition[0], eyePosition[1], eyePosition[2], 0, 0, 0, 0, 1, 0);
  const p = new Matrix4().setPerspective(30, 1, 1.0, 1000);
  p.multiply(v);
  gl.uniformMatrix4fv(u_MvpMatrix, false, p.multiply(m).elements);
}

function drawTexturedCube(gl, program, o, angle, texture, viewProjMatrix) {
  const u_UseColor = gl.getUniformLocation((gl).program,"u_UseColor");
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);              // Change the drawing destination to FBO
  gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT); // Set a viewport for FBO

  gl.clearColor(0.2, 0.2, 0.4, 1.0); // Set clear color (the color is slightly changed)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear FBO

  gl.uniform1f(u_UseColor,1);
  setMatrix(gl);
  gl.bindTexture(gl.TEXTURE_2D, null);
  drawTexturedObject(gl, program, o);
}

function drawTexturedPlane(gl, program, o, angle, texture, viewProjMatrix) {
  const u_UseColor = gl.getUniformLocation((gl).program,"u_UseColor");
  const u_Sampler = gl.getUniformLocation((gl).program,"u_Sampler");

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);        // Change the drawing destination to color buffer
  gl.viewport(0, 0, gl.canvas.width,gl.canvas.height);  // Set the size of viewport back to that of <canvas>

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the color buffer

  setMatrix(gl);
  gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
  gl.uniform1f(u_UseColor,0);
  gl.uniform1i(u_Sampler,0);
  drawTexturedObject(gl, program, o);
}

function drawTexturedObject(gl, program, o) {
  // Assign the buffer objects and enable the assignment
  
  initAttributeVariable(gl, program.a_Position, o.vertexBuffer);    // Vertex coordinates
  initAttributeVariable(gl, program.a_TexCoord, o.texCoordBuffer);  // Texture coordinates
  initAttributeVariable(gl, program.a_Color, o.colorBuffer);  // Texture coordinates

  // Draw
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);
  gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);
}

// Assign the buffer objects and enable the assignment
function initAttributeVariable(gl, a_attribute, buffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
}

var ANGLE_STEP = 30;   // The increments of rotation angle (degrees)
var ang = 1;
var last = Date.now(); // Last time that this function was called
function animate(angle) {
  var now = Date.now();   // Calculate the elapsed time
  var elapsed = now - last;
  last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  ang = ang + 0.5 %360;
  return newAngle % 360;
}
