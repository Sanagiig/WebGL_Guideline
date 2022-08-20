import {Matrix} from "../lib/Matrix.js";

type GlobalSetting = {
  gl:WebGLRenderingContext,
  ang: number;
  time: number;
  fps: number;
};

const globalSetting: GlobalSetting = {
  gl:null as any,
  ang: 0,
  time: 0,
  fps: 0,
};
console.log(globalSetting)
function main() {
  let eyePosition = [ 2.0, 5.0, 7.0];
  let check = 0;
  let frogDist = [10,20]
  function getVShaderSource() {
    return `
    attribute float a_Face;
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    attribute vec4 a_Normal;

    uniform float u_Check;
    uniform vec3 u_eyePosition;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_MVPMatrix;

    varying vec4 v_Position;
    varying vec4 v_Normal;
    varying vec4 v_Color;
    varying float v_Dist;

    void main(){
      
      // v_Position = u_ModelMatrix * a_Position;
      // v_Normal = a_Normal;

      float face = a_Face;
      vec3 color = (u_Check == face) ? vec3(1.0) : a_Color.rgb;
      if(u_Check == face){
        v_Color = vec4(color, a_Face/255.0);
      }else{
        v_Color = vec4(color, a_Color.a);
      }

      v_Dist = distance(a_Position.xyz , u_eyePosition);
      gl_Position =   u_MVPMatrix * a_Position;
    }
    `;
  }

  function getFShaderSource() {
    return `
      #ifdef GL_ES
      precision mediump float;
      #endif

      uniform vec2 u_FrogDist;
      uniform vec4 u_FrogColor;
      uniform vec3 u_PointLightPosition;
      uniform vec3 u_Ambient;
      uniform vec3 u_PointLightColor;
      uniform mat4 u_NormalMatrix;

      varying float v_Dist;
      varying vec4 v_Position;
      varying vec4 v_Normal;
      varying vec4 v_Color;
      void main(){
        // vec3 ambient = u_Ambient * v_Color.rgb;
        // vec3 normal = normalize(vec3(u_NormalMatrix * v_Normal));
        // vec3 pointLightDirect = normalize(u_PointLightPosition - v_Position.xyz);
        // float pointLightDot = max(dot(pointLightDirect,normal),0.0);
        // vec3 diffuse = pointLightDot * u_PointLightColor * v_Color.rgb;
        
        float frogVal = clamp((u_FrogDist.y - v_Dist) / (u_FrogDist.y - u_FrogDist.x),0.0,1.0);

        gl_FragColor = v_Color * frogVal + u_FrogColor * (1.0 - frogVal);
      }
    `;
  }

  function initGL(gl: WebGLRenderingContext) {
    globalSetting.gl = gl;
    gl.clearColor(0.3,0.3,0.3,1.0);
    gl.enable(gl.DEPTH_TEST);
  }

  function initArrayBuffer(
    gl: WebGLRenderingContext,
    attribName: string,
    arrData: Float32Array | Uint8Array,
    attribUseSize: number,
    type: number,
    strip: number,
    offset: number,
  ) {
    const elementSize = arrData.BYTES_PER_ELEMENT;
    const buffer = gl.createBuffer();
    const attribPoint = gl.getAttribLocation((gl as any).program, attribName);

    if (!buffer) {
      throw new Error(`${attribName} createBuffer  err`);
    }

    if(attribPoint < 0){
      throw new Error(`getAttribLocation ${attribName} error`);
    }

    // 将缓冲区对象绑定到目标
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // 向缓冲区写入数据
    gl.bufferData(gl.ARRAY_BUFFER, arrData, gl.STATIC_DRAW);
    // 将缓冲区对象分配给 attribute 变量
    gl.vertexAttribPointer(
      attribPoint,
      attribUseSize,
      type,
      false,
      strip * elementSize,
      offset * elementSize,
    );
    // 连接 attribute 变量 & 分配给它的缓冲区对象
    gl.enableVertexAttribArray(attribPoint);
  }

  function initVetexBuffers(gl: WebGLRenderingContext,outerColor?:Float32Array): number {
    var vertices = new Float32Array([   // Vertex coordinates
    1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
    1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
    1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
   -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
   -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
    1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
 ]);

 var colors = outerColor || new Float32Array([   // Colors
   0.32, 0.18, 0.56,1.0,  0.32, 0.18, 0.56,1.0,  0.32, 0.18, 0.56,1.0,  0.32, 0.18, 0.56,1.0, // v0-v1-v2-v3 front
   0.5, 0.41, 0.69, 1.0,  0.5, 0.41, 0.69,1.0,   0.5, 0.41, 0.69,1.0,   0.5, 0.41, 0.69,1.0,  // v0-v3-v4-v5 right
   0.78, 0.69, 0.84,1.0,  0.78, 0.69, 0.84,1.0,  0.78, 0.69, 0.84,1.0,  0.78, 0.69, 0.84,1.0, // v0-v5-v6-v1 up
   0.0, 0.32, 0.61, 1.0,  0.0, 0.32, 0.61,1.0,   0.0, 0.32, 0.61,1.0,   0.0, 0.32, 0.61,1.0,  // v1-v6-v7-v2 left
   0.27, 0.58, 0.82, 1.0, 0.27, 0.58, 0.82,1.0,  0.27, 0.58, 0.82,1.0,  0.27, 0.58, 0.82,1.0, // v7-v4-v3-v2 down
   0.73, 0.82, 0.93,1.0,  0.73, 0.82, 0.93,1.0,  0.73, 0.82, 0.93,1.0,  0.73, 0.82, 0.93,1.0, // v4-v7-v6-v5 back
  ]);
    const faces = new Uint8Array([
      1,1,1,1,
      2,2,2,2,
      3,3,3,3,
      4,4,4,4,
      5,5,5,5,
      6,6,6,6,
    ])


    const normals = new Float32Array([
      // Normal
      0.0,0.0,1.0, 0.0,0.0,1.0, 0.0,0.0,1.0, 0.0,0.0,1.0, 
      0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,
      -1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,
      1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,
      0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,
      0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0
    ]);

    // Indices of the vertices
    const indices = new Uint8Array([
      0, 1, 2,   0, 2, 3,    // front
      4, 5, 6,   4, 6, 7,    // right
      8, 9,10,   8,10,11,    // up
     12,13,14,  12,14,15,    // left
     16,17,18,  16,18,19,    // down
     20,21,22,  20,22,23     // back
    ]);

    const indexBuffer = gl.createBuffer();

    if (!indexBuffer) {
      throw new Error("create indices buffer err");
    }

    initArrayBuffer(gl, "a_Position", vertices, 3, gl.FLOAT, 3, 0);
    initArrayBuffer(gl, "a_Face", faces, 1, gl.UNSIGNED_BYTE, 1, 0);
    initArrayBuffer(gl, "a_Color", colors, 4, gl.FLOAT, 4, 0);
    // initArrayBuffer(gl, "a_Normal", normals, 3, gl.FLOAT, 3, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
  }

  function setLight(gl: WebGLRenderingContext) {
    // const u_Ambient = gl.getUniformLocation((gl as any).program, "u_Ambient");
    // const u_PointLightPosition = gl.getUniformLocation((gl as any).program, "u_PointLightPosition");
    // const u_PointLightColor = gl.getUniformLocation((gl as any).program, "u_PointLightColor");

    const u_eyePosition = gl.getUniformLocation((gl as any).program, "u_eyePosition");
    const u_FrogDist = gl.getUniformLocation((gl as any).program, "u_FrogDist");
    const u_FrogColor = gl.getUniformLocation((gl as any).program, "u_FrogColor");

    gl.uniform3f(u_eyePosition, eyePosition[0], eyePosition[1], eyePosition[2]);
    gl.uniform2f(u_FrogDist, frogDist[0], frogDist[1]);
    gl.uniform4f(u_FrogColor, 0.3, 0.3, 0.3,1.0);
    // gl.uniform3f(u_Ambient, 0.3, 0.3, 0.3);
    // gl.uniform3f(u_PointLightPosition, 50, 50, 50);
    // gl.uniform3f(u_PointLightColor, 1, 1, 1);
  }

  function setMatrix(gl: WebGLRenderingContext) {
    const u_MVPMatrix = gl.getUniformLocation((gl as any).program, "u_MVPMatrix");
    const u_NormalMatrix = gl.getUniformLocation((gl as any).program, 'u_NormalMatrix');

    const normalMatrix = new Matrix();
    const m = new Matrix();
    const v = new Matrix();
    const p = new Matrix();

    // m.setRotate(globalSetting.ang, 1, 1, 1);
    v.setLookAt(eyePosition[0], eyePosition[1], eyePosition[2], 0, 0, 0, 0, 1, 0)
    p.setPerspective(30, 1, 1.0, 100);
    normalMatrix.setInverseOf(m).transpose();

    v.multiply(p);
    m.multiply(v);
    gl.uniformMatrix4fv(u_MVPMatrix, false, m.originData());
    // gl.uniformMatrix4fv(u_NormalMatrix,false,normalMatrix.originData());
  }

  function render(outerColor?:Float32Array) {
    const {gl} = globalSetting;
    const u_Check = gl.getUniformLocation((gl as any).program,"u_Check")
    const n = initVetexBuffers(gl,outerColor);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    setLight(gl);
    setMatrix(gl);
    gl.uniform1f(u_Check,check);
    gl.drawElements(gl.TRIANGLES,n,gl.UNSIGNED_BYTE,0);
  }

  let canvas = document.getElementById("webgl") as HTMLCanvasElement;
  let gl = getWebGLContext(canvas);

  if (!initShaders(gl, getVShaderSource(), getFShaderSource())) {
    console.error("initShaders");
  }

  function updateFPS() {
    let fpsDisplayer = document.getElementById("fpsDisplayer");
    const now = Date.now();
    const time = globalSetting.time
      ? globalSetting.time
      : (globalSetting.time = now);

    if (!fpsDisplayer) {
      fpsDisplayer = document.createElement("h1");
      fpsDisplayer.id = "fpsDisplayer";
      document.body.insertBefore(
        fpsDisplayer,
        document.getElementById("webgl")!,
      );
    }

    if (now - time >= 1000) {
      fpsDisplayer.innerHTML = `FPS : ${globalSetting.fps}`;
      globalSetting.fps = 0;
      globalSetting.time = now;
    }

    ++globalSetting.fps;
  }

  function tic() {
    requestAnimationFrame(tic);
    globalSetting.ang += 0.2;
    render();
    updateFPS();
  }

  initGL(gl);
  tic();

  canvas.addEventListener("mousedown",(ev:MouseEvent) =>{
    
    const rect = (ev.target as HTMLElement ).getBoundingClientRect();
    var x = ev.clientX, y = ev.clientY;
    var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
    const outerColor = new Float32Array([
      0.1,0.0,0.0,0.1, 0.1,0.0,0.0,0.1, 0.1,0.0,0.0,0.1, 0.1,0.0,0.0,0.1, 
      0.2,0.0,0.0,0.2,0.2,0.0,0.0,0.2,0.2,0.0,0.0,0.2,0.2,0.0,0.0,0.2, 
      0.3,0.0,0.0,0.3, 0.3,0.0,0.0,0.3, 0.3,0.0,0.0,0.3, 0.3,0.0,0.0,0.3, 
      0.4,0.0,0.0,0.4, 0.4,0.0,0.0,0.4, 0.4,0.0,0.0,0.4, 0.4,0.0,0.0,0.4, 
      0.5,0.0,0.0,0.5, 0.5,0.0,0.0,0.5, 0.5,0.0,0.0,0.5, 0.5,0.0,0.0,0.5, 
      0.6,0.0,0.0,0.6, 0.6,0.0,0.0,0.6, 0.6,0.0,0.0,0.6, 0.6,0.0,0.0,0.6, 
      0.7,0.0,0.0,0.7, 0.7,0.0,0.0,0.7, 0.7,0.0,0.0,0.7, 0.7,0.0,0.0,0.7, 
    ])

    const checkPixel = new Uint8Array(4);
    render(outerColor);
    gl.readPixels(x_in_canvas,y_in_canvas,1,1,gl.RGBA,gl.UNSIGNED_BYTE,checkPixel);

    console.log("rect",rect)
    console.log("pixel",x,y);

    console.log("pixel2",checkPixel[0],checkPixel[1],checkPixel[2],checkPixel[3]);
    console.log("ok")
    check = Math.ceil(checkPixel[3] / 255 * 10);
    console.log("check",check)
  })

  window.addEventListener("wheel", function(e) { 
    let evt = e || window.event;  //考虑兼容性
    evt.preventDefault();
    if (evt.deltaY > 0) {  //在火狐中 向下滚动是3 谷歌是125
      if(frogDist[1] > frogDist[0]){
        frogDist[1] -= 0.1;
      }
    } else {           //在火狐中 向上滚动是-3 谷歌是-125
        frogDist[1]+= 0.1;
    }
        //检查事件
        console.log("frogDist",frogDist[0],frogDist[1]);  
    }, {
        passive: false
  });
}

window.addEventListener("load", (e) => {
  main();
});

