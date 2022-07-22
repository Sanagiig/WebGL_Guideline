import {Matrix} from "../lib/Matrix.js";

function main() {
  type GlobalSetting = {
    gl: WebGLRenderingContext;
    ang: number;
    time: number;
    fps: number;
  };

  const globalSetting: GlobalSetting = {
    gl: null as any,
    ang: 0,
    time: 0,
    fps: 0,
  };

  function getVShaderSource() {
    return `
      attribute vec4 a_Position;
      attribute vec4 a_Color;
      attribute vec4 a_Normal;

      uniform mat4 u_MvpMatrix;
      uniform mat4 u_NormalMatrix;
      uniform vec3 u_LightColor;
      uniform vec3 u_LightDirection;
      uniform vec3 u_Ambient;

      varying vec4 v_Color;
      void main(){
        vec3 ambient = u_Ambient * a_Color.rgb;
        vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
        vec3 lightDirection = normalize(u_LightDirection);
        // 光线和法向量的点积
        float nDotL = max(dot(lightDirection ,normal),0.0);
        // 计算漫反射光的颜色
        vec3 diffuse = u_LightColor * nDotL * vec3(a_Color) ;

        gl_Position =  u_MvpMatrix * a_Position;
        v_Color = vec4(diffuse + ambient,a_Color.a);
      }
    `;
  }

  function getFShaderSource() {
    return `
      #ifdef GL_ES
      precision mediump float;
      #endif

      varying vec4 v_Color;
      void main(){
        gl_FragColor = v_Color;
      }
    `;
  }

  function initGL(gl: WebGLRenderingContext) {
    globalSetting.gl = gl;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
  }

  function initArrayBuffer(gl: WebGLRenderingContext,attribName:string,arrData:Float32Array,attribUseSize:number,type:number,strip:number,offset:number){
    const elementSize = arrData.BYTES_PER_ELEMENT;
    const buffer = gl.createBuffer();
    const attribPoint = gl.getAttribLocation((gl as any).program,attribName);
    
    if (!buffer) {
      throw new Error(`${attribName} createBuffer  err`);
    }

    // 将缓冲区对象绑定到目标
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // 向缓冲区写入数据
    gl.bufferData(gl.ARRAY_BUFFER,arrData,gl.STATIC_DRAW);
    // 将缓冲区对象分配给 attribute 变量
    gl.vertexAttribPointer(attribPoint,attribUseSize,type,false,strip * elementSize,offset *elementSize);
    // 连接 attribute 变量 & 分配给它的缓冲区对象
    gl.enableVertexAttribArray(attribPoint);
  }

  function initVetexBuffers(gl: WebGLRenderingContext): number {
    const vertices = new Float32Array([   // Coordinates
        1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0, // v0-v1-v2-v3 front
        1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0, // v0-v3-v4-v5 right
        1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
      -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, // v1-v6-v7-v2 left
      -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, // v7-v4-v3-v2 down
        1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // v4-v7-v6-v5 back
    ]);

    const colors = new Float32Array([    // Colors
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v1-v2-v3 front
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v3-v4-v5 right
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v5-v6-v1 up
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v1-v6-v7-v2 left
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v7-v4-v3-v2 down
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0　    // v4-v7-v6-v5 back
    ]);

    const normals = new Float32Array([    // Normal
      0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
      1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
      0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
      0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
      0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
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

    if(!indexBuffer){
      throw new Error("create indices buffer err");
    }

    initArrayBuffer(gl,"a_Position",vertices,3,gl.FLOAT,3,0);
    initArrayBuffer(gl,"a_Color",colors,3,gl.FLOAT,3,0);
    initArrayBuffer(gl,"a_Normal",normals,3,gl.FLOAT,3,0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);

    return indices.length;
  }

  function setLight(gl: WebGLRenderingContext){
    const u_LightColor = gl.getUniformLocation((gl as any).program, 'u_LightColor');
    const u_LightDirection = gl.getUniformLocation((gl as any).program, 'u_LightDirection');
    const u_Ambient = gl.getUniformLocation((gl as any).program, 'u_Ambient');
    
    gl.uniform3f(u_LightColor, 1, 1.0, 1.0);
    gl.uniform3f(u_LightDirection, 0.5, 3.0, 4.0);
    gl.uniform3f(u_Ambient, 0.2, 0.2, 0.2);
  }

  function setMatrix(gl: WebGLRenderingContext) {
    const u_MvpMatrix = gl.getUniformLocation((gl as any).program, "u_MvpMatrix");
    const u_NormalMatrix = gl.getUniformLocation((gl as any).program, 'u_NormalMatrix');

    const normalMatrix = new Matrix();
    const m = new Matrix();
    const v = new Matrix();
    const p = new Matrix();

    m.setRotate(globalSetting.ang, 1, 1, 1);
    v.setLookAt(3, 3, 7, 0, 0, 0, 0, 1, 0)
    p.setPerspective(30, 1, 1, 100);
    normalMatrix.setInverseOf(m).transpose();

    v.multiply(p);
    m.multiply(v);
    gl.uniformMatrix4fv(u_MvpMatrix, false, m.originData());
    gl.uniformMatrix4fv(u_NormalMatrix,false,normalMatrix.originData());
  }

  function render() {
    const {gl} = globalSetting;
    const n = initVetexBuffers(gl);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    setLight(gl);
    setMatrix(gl);
    gl.drawElements(gl.TRIANGLES,n,gl.UNSIGNED_BYTE, 0);
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
    globalSetting.ang += 1;
    render();
    updateFPS();
  }

  initGL(gl);
  tic();
}

window.addEventListener("load", (e) => {
  main();
});
