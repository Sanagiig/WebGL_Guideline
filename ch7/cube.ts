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

      uniform mat4 u_MvpMatrix;

      varying vec4 v_Color;
      void main(){
        gl_Position =  u_MvpMatrix * a_Position;
        gl_PointSize = 10.0;
        v_Color = a_Color;
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

  function initVetexBuffers(gl: WebGLRenderingContext): number {
    const vertices = new Float32Array([
      1.0,  1.0,  1.0,     1.0,  1.0,  1.0,  // v0 White
    -1.0,  1.0,  1.0,     1.0,  0.0,  1.0,  // v1 Magenta
    -1.0, -1.0,  1.0,     1.0,  0.0,  0.0,  // v2 Red
     1.0, -1.0,  1.0,     1.0,  1.0,  0.0,  // v3 Yellow
     1.0, -1.0, -1.0,     0.0,  1.0,  0.0,  // v4 Green
     1.0,  1.0, -1.0,     0.0,  1.0,  1.0,  // v5 Cyan
    -1.0,  1.0, -1.0,     0.0,  0.0,  1.0,  // v6 Blue
    -1.0, -1.0, -1.0,     0.0,  0.0,  0.0   // v7 Black
    ]);

     // Indices of the vertices
    var indices = new Uint8Array([
      0, 1, 2,   0, 2, 3,    // front
      0, 3, 4,   0, 4, 5,    // right
      0, 5, 6,   0, 6, 1,    // up
      1, 6, 7,   1, 7, 2,    // left
      7, 4, 3,   7, 3, 2,    // down
      4, 7, 6,   4, 6, 5     // back
  ]);

    const n = indices.length;
    const eleSize = vertices.BYTES_PER_ELEMENT; 
    const vertexBuffer = gl.createBuffer();
    const indicesBuffer = gl.createBuffer();

    let a_Position = gl.getAttribLocation((gl as any).program, "a_Position");
    let a_Color = gl.getAttribLocation((gl as any).program, "a_Color");

    if (!vertexBuffer || !indicesBuffer) {
      console.error("createBuffer  err");
      return -1;
    }

    // 将缓冲区对象绑定到目标
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 向缓冲区写入数据
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    // 将缓冲区对象分配给 a_Position 变量
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, eleSize *6, 0);
    // 连接 a_Position 变量 & 分配给它的缓冲区对象
    gl.enableVertexAttribArray(a_Position);

    // 将缓冲区对象分配给 a_Position 变量
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, eleSize * 6, eleSize * 3);
    // 连接 a_Position 变量 & 分配给它的缓冲区对象
    gl.enableVertexAttribArray(a_Color);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
    return n;
  }

  function setMatrix(gl: WebGLRenderingContext) {
    const u_MvpMatrix = gl.getUniformLocation((gl as any).program, "u_MvpMatrix");
    const m = new Matrix();
    const v = new Matrix();
    const p = new Matrix();

    m.setRotate(globalSetting.ang, 0, 1, 1);
    v.setLookAt(3, 3, 7, 0, 0, 0, 0, 1, 0)
    p.setPerspective(30, 1, 1, 100);

    v.multiply(p);
    m.multiply(v);
    gl.uniformMatrix4fv(u_MvpMatrix, false, m.originData());
  }

  function render() {
    const {gl} = globalSetting;
    const n = initVetexBuffers(gl);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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
