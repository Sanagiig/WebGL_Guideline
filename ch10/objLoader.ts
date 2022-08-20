import {Matrix, Vector3} from "../lib/Matrix.js";
import {ObjModelFactor} from "../lib/ObjFactor.js";

type GlobalSetting = {
  gl: WebGLRenderingContext;
  ang: number;
  time: number;
  fps: number;

  renderSetting: {
    accumulate: number;
    ystart: number;
    yend: number;
    xstart: number;
    xend: number;
  };
};

interface AttributeData {
  buffer: WebGLBuffer;
  location: number;
  type: number;
  attribUseSize: number;
  strip: number;
  offset: number;
}

interface IndicesData {
  buffer: WebGLBuffer;
  type: GLenum;
  count: number;
}

interface InitAttributeData {
  attribute: {[k: string]: AttributeData | null};
  index: IndicesData;
}

const globalSetting: GlobalSetting = {
  gl: null as any,
  ang: 0,
  time: 0,
  fps: 0,

  renderSetting: {
    accumulate: 14,
    ystart: 0,
    yend: 180,
    xstart: 0,
    xend: 360,
  },
};

let eyePosition = [0.0, 0.0, 8.0];
let lightPosition = [2, 8, 3];
let vertexData: InitAttributeData;
let isMouseDown = false;
let isChangingX = false;
let isChangingY = false;
let mouseBtn = -1;
let modelXAng = 0;
let modelYAng = 0;
let modelZAng = 0;
let eyeXAng = 0;
let eyeYAng = 0;
let lastX = 0;
let lastY = 0;
let modelMatrix: Matrix = new Matrix();
let viewMatrix: Matrix = new Matrix();
let canvas: HTMLCanvasElement;
let gl: WebGLRenderingContext;

function getVShaderSource() {
  return `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    attribute vec4 a_Normal;

    uniform vec3 u_LightPosition;
    uniform mat4 u_NormalMatrix;
    uniform mat4 u_MvpMatrix;

    varying vec4 v_Color;
    void main(){
      vec3 normal = normalize(u_NormalMatrix * a_Normal).xyz;
      float lightDot = dot(normalize(u_LightPosition),normal);

      gl_Position = u_MvpMatrix * a_Position;
      v_Color = vec4(a_Color.rgb * lightDot + a_Color.rgb *0.2,a_Color.a);
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
  console.log(
    "const ext = gl.getExtension('OES_element_index_uint');",
    gl.getExtension("OES_element_index_uint"),
  );
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);
}

function initVertices(gl: WebGLRenderingContext): InitAttributeData {
  const a_Position = initArrayBuffer(gl, "a_Position", 3, gl.FLOAT, 0);
  const a_Color = initArrayBuffer(gl, "a_Color", 4, gl.FLOAT, 0);
  const a_Normal = initArrayBuffer(gl, "a_Normal", 3, gl.FLOAT, 0);
  const buffer = gl.createBuffer()!;

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);

  return {
    attribute: {
      a_Position,
      a_Color,
      a_Normal,
    },
    index: {
      buffer,
      count: -1,
      type: gl.UNSIGNED_INT,
    },
  };
}

function initArrayBuffer(
  gl: WebGLRenderingContext,
  attribName: string,
  attribUseSize: number,
  type: number,
  size: number,
) {
  const buffer = gl.createBuffer();
  const location = gl.getAttribLocation((gl as any).program, attribName);

  if (!buffer) {
    throw new Error(`${attribName} createBuffer  err`);
  }

  if (location < 0) {
    throw new Error(`getAttribLocation ${attribName} error`);
  }

  // 将缓冲区对象绑定到目标
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, attribUseSize, type, false, 0, 0);
  // 向缓冲区写入数据
  // gl.bufferData(gl.ARRAY_BUFFER, arrData, gl.STATIC_DRAW);

  return {
    buffer,
    location,
    type,
    attribUseSize,
    strip: 0,
    offset: 0,
  };
}

function initAttributeVariable(
  gl: WebGLRenderingContext,
  a: AttributeData,
  d: Float32Array,
) {
  if (!a) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, a.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a.location, a.attribUseSize, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a.location);
}

function setLightMatrix(gl: WebGLRenderingContext) {}

function setMatrix(gl: WebGLRenderingContext) {
  const u_MvpMatrix = gl.getUniformLocation((gl as any).program, "u_MvpMatrix");
  const u_NormalMatrix = gl.getUniformLocation(
    (gl as any).program,
    "u_NormalMatrix",
  );
  const u_LightPosition = gl.getUniformLocation(
    (gl as any).program,
    "u_LightPosition",
  );

  if (!modelMatrix) {
    modelMatrix = new Matrix();
  }

  const m = new Matrix().rotate(modelYAng, 0, 1, 0).rotate(modelXAng, 1, 0, 0);

  const n = new Matrix();
  const vp = new Matrix()
    .setPerspective(45, 1, 1.0, 1000.0)
    .lookAt(eyePosition[0], eyePosition[1], eyePosition[2], 0, 0, 0, 0, 1, 0);

  modelYAng = 0;
  modelXAng = 0;

  modelMatrix.multiply(m);
  m.copy(modelMatrix);
  n.setInverseOf(modelMatrix).transpose();
  m.multiply(vp);
  gl.uniform3f(
    u_LightPosition,
    lightPosition[0],
    lightPosition[1],
    lightPosition[2],
  );
  gl.uniformMatrix4fv(u_MvpMatrix, false, m.originData());
  gl.uniformMatrix4fv(u_NormalMatrix, false, n.originData());
}

function render() {
  const {gl} = globalSetting;
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  setMatrix(gl);
  gl.drawElements(
    gl.TRIANGLES,
    vertexData.index.count,
    vertexData.index.type,
    0,
  );
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
    document.body.insertBefore(fpsDisplayer, document.getElementById("webgl")!);
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

function main() {
  canvas = document.getElementById("webgl") as HTMLCanvasElement;
  gl = getWebGLContext(canvas);

  initShaders(gl, getVShaderSource(), getFShaderSource());
  initGL(gl);

  const of = new ObjModelFactor("House 2 N220518.obj");
  of.loadAndParse().then(({positions, normals, colors, indices}) => {
    console.log(
      "positions, normals, colors, indices",
      positions,
      normals,
      colors,
      indices,
    );
    vertexData = initVertices(gl);
    initAttributeVariable(gl, vertexData.attribute.a_Position!, positions);
    initAttributeVariable(gl, vertexData.attribute.a_Color!, colors);
    initAttributeVariable(gl, vertexData.attribute.a_Normal!, normals);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexData.index.buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    vertexData.index.count = indices.length;
    tic();
  });
  console.log("of", of);
}

window.addEventListener("load", (e) => {
  main();

  function modifyEyeAngle(x: number, y: number) {
    function canChange(v: Vector3): boolean {
      const {val} = v;
      const distanceFromY = Math.sqrt(val[0] * val[0] + val[2] * val[2]);
      return distanceFromY > 5;
    }

    const step = 1;
    const v = new Vector3(eyePosition);
    let tmpX: number = 0;
    let tmpY: number = 0;

    if (lastX !== x) {
      tmpY = lastX < x ? step : -step;
      lastX = x;
    }

    if (lastY !== y) {
      tmpX = lastY < y ? step : -step;
      lastY = y;
    }

    viewMatrix.setIdentity().rotate(tmpX, 1, 0, 0).rotate(tmpY, 0, 1, 0);
    v.multiplyMatrix(viewMatrix);
    
    if (canChange(v)) {
      eyeXAng = tmpX;
      eyeYAng = tmpY;
      eyePosition[0] = v.val[0];
      eyePosition[1] = v.val[1];
      eyePosition[2] = v.val[2];
    }
  }

  function modifyModelAngle(x: number, y: number) {
    const step = 1;
    if (!x || !y) return;

    if (lastX !== x) {
      modelYAng = lastX < x ? step : -step;
      lastX = x;
    }

    if (lastY !== y) {
      modelXAng = lastY < y ? step : -step;
      lastY = y;
    }
  }

  function reset() {
    lastX = 0;
    lastY = 0;
    mouseBtn = -1;
    isMouseDown = false;
  }

  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  canvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    isMouseDown = true;
    mouseBtn = e.button;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  canvas.addEventListener("mouseup", (e) => {
    reset();
  });

  canvas.addEventListener("mouseleave", (e) => {
    reset();
  });

  canvas.addEventListener("mousemove", (e) => {
    if (isMouseDown) {
      if (mouseBtn === 2) modifyEyeAngle(e.clientX, e.clientY);
      if (mouseBtn === 0) modifyModelAngle(e.clientX, e.clientY);
    }
  });
});
