type GlobalSetting = {
  a_Position: number[];
  a_PointSize: number[];
  u_FragColor: number[];
  gl: WebGLRenderingContext;
};

const globalSetting: GlobalSetting = {
  a_Position: [],
  a_PointSize: [3.0],
  u_FragColor: [],
  gl: null as any,
};

function getVShaderSource() {
  return `
    attribute vec4 a_Position;
    attribute float a_PointSize;
    void main(){
      gl_Position = a_Position;
      gl_PointSize = a_PointSize;
    }
  `;
}

function getFShaderSource() {
  return `
  precision mediump float;
  uniform vec4 u_FragColor;
    void main(){
      gl_FragColor = u_FragColor;
    }
  `;
}

function initGL(gl: WebGLRenderingContext) {
  globalSetting.gl = gl;
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
}

function setPosition(
  gl: WebGLRenderingContext,
  x: number,
  y: number,
  z = 0,
  w = 1,
) {
  let a_Position = gl.getAttribLocation((gl as any).program, "a_Position");
  gl.vertexAttrib4f(a_Position, x, y, z, w);
}

function setPointSize(gl: WebGLRenderingContext, val: number) {
  let a_PointSize = gl.getAttribLocation((gl as any).program, "a_PointSize");
  gl.vertexAttrib1f(a_PointSize, val);
}

function setPointColor(
  gl: WebGLRenderingContext,
  r: number,
  g: number,
  b: number,
  a: number = 1,
) {
  let u_FragColor = gl.getUniformLocation((gl as any).program, "u_FragColor");
  gl.uniform4f(u_FragColor, r, g, b, a);
}

function render() {
  const {gl, a_PointSize, a_Position} = globalSetting;

  gl.clear(gl.COLOR_BUFFER_BIT);
  for (let i = 0; i < a_Position.length; i += 2) {
    setPosition(gl, a_Position[i], a_Position[i + 1]);
    setPointSize(gl, a_PointSize[0]);
    setPointColor(gl, Math.random(), Math.random(), Math.random());
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

function main() {
  let canvas = document.getElementById("webgl") as HTMLCanvasElement;

  let gl = getWebGLContext(canvas);

  if (!initShaders(gl, getVShaderSource(), getFShaderSource())) {
    console.error("initShaders");
  }

  initGL(gl);
  render();
}

window.addEventListener("load", (e) => {
  main();
});

document.getElementById("webgl")!.addEventListener("click", (e) => {
  const {a_Position} = globalSetting;
  const target = e.target as HTMLElement;
  const {height, width, left, top} = target.getBoundingClientRect();
  const midH = height / 2;
  const midW = width / 2;
  const x = e.clientX - midW - left;
  const y = midH - e.clientY + top;
  a_Position.push(x / midW, y / midH);
  render();
});

document.getElementById("sizeAddBtn")!.addEventListener("click", (e) => {
  const {gl, a_PointSize} = globalSetting;
  a_PointSize[0] += 0.5;
  render();
});

document.getElementById("sizeSubBtn")!.addEventListener("click", (e) => {
  const {gl, a_PointSize} = globalSetting;
  a_PointSize[0] -= 0.5;
  render();
});
