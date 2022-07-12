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
      uniform mat4 u_Matrix;
      void main(){
        gl_Position = a_Position * u_Matrix;
      }
    `;
  }

  function getFShaderSource() {
    return `
      void main(){
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `;
  }

  function initGL(gl: WebGLRenderingContext) {
    globalSetting.gl = gl;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
  }

  function initVetexBuffers(gl: WebGLRenderingContext): number {
    let vertices = new Float32Array([
      -0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
    ]);
    let n = vertices.length / 2;

    let vertexBuffer = gl.createBuffer();
    let a_Position = gl.getAttribLocation((gl as any).program, "a_Position");

    if (!vertexBuffer) {
      console.error("createBuffer err");
      return -1;
    }

    gl.INVALID_VALUE;
    // 将缓冲区对象绑定到目标
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 向缓冲区写入数据
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    // 将缓冲区对象分配给 a_Position 变量
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    // 连接 a_Position 变量 & 分配给它的缓冲区对象
    gl.enableVertexAttribArray(a_Position);

    return n;
  }

  function setMatrix(gl: WebGLRenderingContext) {
    let u_Matrix = gl.getUniformLocation((gl as any).program, "u_Matrix");
    let m2 = new Matrix();
    let m3 = new Matrix();
    m2.translate(0.5, 0, 0);
    m3.rotate(globalSetting.ang);
    m3.multiply(m2);
    gl.uniformMatrix4fv(u_Matrix, false, m3.originData());
  }

  function render() {
    const {gl} = globalSetting;
    const n = initVetexBuffers(gl);
    gl.clear(gl.COLOR_BUFFER_BIT);

    setMatrix(gl);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
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
