import {Matrix} from "../lib/Matrix.js";

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
  [k: string]: {
    buffer: WebGLBuffer;
    location: number;
    type: number;
    attribUseSize: number;
    strip: number;
    offset: number;
  };
}

interface IndicesData {
  buffer: WebGLBuffer;
  count: number;
}

interface InitAttributeData {
  attribute: AttributeData;
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
let eyePosition = [2.0, 5.0, 5.0];
let frameBufferObj: WebGLFramebuffer;
let texture: WebGLTexture;
const offsetWidth = 256;
const offsetHeight = 256;

function generateSphereVertex() {
  function getRad(ang: number) {
    return (ang / 180) * Math.PI;
  }

  let {accumulate, ystart, yend, xend, xstart} = globalSetting.renderSetting;
  const ysr = getRad(ystart),
    yer = getRad(yend),
    xsr = getRad(xstart),
    xer = getRad(xend);
  const yang = yer - ysr;
  const xang = xer - xsr;

  const positionList = [];
  const indexList = [];
  
  for (let i = 0; i <= accumulate; ++i) {
    const aAng = (yang / accumulate) * i + ysr;
    const aCos = Math.cos(aAng);
    const aSin = Math.sin(aAng);
    for (let j = 0; j <= accumulate; ++j) {
      const bAng = (xang / accumulate) * j + xsr;
      const bCos = Math.cos(bAng);
      const bSin = Math.sin(bAng);

      // x,y,z
      positionList.push(aSin * bSin);
      positionList.push(aCos);
      positionList.push(aSin * bCos);
    }
  }

  for (let i = 0; i < accumulate; ++i) {
    for (let j = 0; j < accumulate; ++j) {
      const p1 = i * (accumulate + 1) + j;
      const p2 = p1 + accumulate + 1;

      indexList.push(p1);
      indexList.push(p2);
      indexList.push(p1 + 1);

      indexList.push(p1 + 1);
      indexList.push(p2);
      indexList.push(p2 + 1);
    }
  }
  console.log("po:",positionList.reduce((acc,cur) =>{
    return Math.min(acc,cur)
  },0))
  return {
    positionList,
    indexList,
  };
}

function initSphereVertexBuffers(gl: WebGLRenderingContext): InitAttributeData {
  const {positionList, indexList} = generateSphereVertex();
  var vertices = new Float32Array(positionList);

  // var colors = new Float32Array(
  //   colorList
  // );

  // Indices of the vertices
  const indices = new Uint32Array(indexList);
  const buffer = gl.createBuffer();

  if (!buffer) {
    throw new Error("create indices buffer err");
  }

  const a_Position = initArrayBuffer(
    gl,
    "a_Position",
    vertices,
    3,
    gl.FLOAT,
    3,
    0,
  );
  const a_Normal = initArrayBuffer(gl, "a_Normal", vertices, 3, gl.FLOAT, 3, 0);
  // const a_Color = initArrayBuffer(gl, "a_Color", colors, 4, gl.FLOAT, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  return {
    attribute: {
      a_Position,
      a_Normal,
      // a_Color,
    },
    index: {
      buffer,
      count: indices.length,
    },
  };
}

function initGL(gl: WebGLRenderingContext) {
  globalSetting.gl = gl;
  console.log("const ext = gl.getExtension('OES_element_index_uint');",gl.getExtension('OES_element_index_uint'))
  gl.clearColor(0, 0, 0, 1);
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
  const location = gl.getAttribLocation((gl as any).program, attribName);

  if (!buffer) {
    throw new Error(`${attribName} createBuffer  err`);
  }

  if (location < 0) {
    throw new Error(`getAttribLocation ${attribName} error`);
  }

  // 将缓冲区对象绑定到目标
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  // 向缓冲区写入数据
  gl.bufferData(gl.ARRAY_BUFFER, arrData, gl.STATIC_DRAW);

  return {
    buffer,
    location,
    type,
    attribUseSize,
    strip: strip * elementSize,
    offset: offset * elementSize,
  };
}

function initFrameBufferObj(gl: WebGLRenderingContext) {
  const depth = gl.createRenderbuffer()!;
  texture = gl.createTexture()!;
  frameBufferObj = gl.createFramebuffer()!;

  function err() {
    console.error("initFrameBufferObj", texture, depth, frameBufferObj);
    texture && gl.deleteTexture(texture);
    depth && gl.deleteRenderbuffer(depth);
    frameBufferObj && gl.deleteFramebuffer(frameBufferObj);
    throw new Error("initFrameBufferObj");
  }

  if (!texture || !depth || !frameBufferObj) {
    err();
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    offsetWidth,
    offsetHeight,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
  gl.renderbufferStorage(
    gl.RENDERBUFFER,
    gl.DEPTH_COMPONENT16,
    offsetWidth,
    offsetHeight,
  );

  // Attach the texture and the renderbuffer object to the FBO
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBufferObj);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  );
  gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.RENDERBUFFER,
    depth,
  );

  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    console.error("Frame buffer object is incomplete");
    err();
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
}

function initAttributeVariable(
  gl: WebGLRenderingContext,
  vertexObj: InitAttributeData,
) {
  const {attribute} = vertexObj;
  Object.keys(attribute).forEach((key) => {
    if (key.startsWith("a_")) {
      const a = attribute[key];

      gl.bindBuffer(gl.ARRAY_BUFFER, a.buffer);
      gl.vertexAttribPointer(
        a.location,
        a.attribUseSize,
        a.type,
        false,
        a.strip,
        a.offset,
      );
      gl.enableVertexAttribArray(a.location);
    }
  });

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexObj.index.buffer);
  gl.drawElements(gl.TRIANGLES, vertexObj.index.count, gl.UNSIGNED_INT, 0);
}

function setLightMatrix(gl: WebGLRenderingContext) {
  const u_ambientColor = gl.getUniformLocation(
    (gl as any).program,
    "u_ambientColor",
  );
  const u_LightDirection = gl.getUniformLocation(
    (gl as any).program,
    "u_LightDirection",
  );
  const u_LightColor = gl.getUniformLocation(
    (gl as any).program,
    "u_LightColor",
  );

  gl.uniform3f(u_ambientColor, 0.2, 0.2, 0.2);
  gl.uniform3f(u_LightDirection, 5, 5, 0);
  gl.uniform3f(u_LightColor, 0.8, 0.8, 0.8);
}

function setMatrix(gl: WebGLRenderingContext) {
  const u_MvpMatrix = gl.getUniformLocation((gl as any).program, "u_MvpMatrix");
  const u_NormalMatrix = gl.getUniformLocation(
    (gl as any).program,
    "u_NormalMatrix",
  );

  const m = new Matrix().setRotate(globalSetting.ang, 1, 1, 0);
  const v = new Matrix().setLookAt(
    eyePosition[0],
    eyePosition[1],
    eyePosition[2],
    0,
    0,
    0,
    0,
    1,
    0,
  );
  const p = new Matrix().setPerspective(30, 1, 1.0, 1000);

  const n = new Matrix().setInverseOf(m).transpose();
  v.multiply(p);
  m.multiply(v);

  gl.uniformMatrix4fv(u_MvpMatrix, false, m.originData());
  gl.uniformMatrix4fv(u_NormalMatrix, false, n.originData());
}

function render() {
  const {gl} = globalSetting;
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  setMatrix(gl);
  setLightMatrix(gl);
  initAttributeVariable(gl, sphere);
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

let sphere: InitAttributeData;
function main() {
  let canvas = document.getElementById("webgl") as HTMLCanvasElement;
  let gl = getWebGLContext(canvas);

  if (!initShaders(gl, getVShaderSource(), getFShaderSource())) {
    return console.error("initShaders");
  }

  sphere = initSphereVertexBuffers(gl);
  function getVShaderSource() {
    return `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    attribute vec4 a_Normal;

    uniform float u_HasColor;
    uniform vec3 u_LightDirection;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_NormalMatrix;

    varying float v_Dot;
    varying vec4 v_Color;

    void main(){
      vec3 direction =  normalize(u_LightDirection - a_Position.xyz);
      vec3 normal = normalize(u_NormalMatrix * a_Normal).xyz;

      v_Color = u_HasColor != 0.0 ? a_Position / 2.0 + 0.5 : vec4(1.0,1.0,1.0,1.0);
      v_Dot = max(dot(direction,normal),0.0);
      gl_Position =   u_MvpMatrix * a_Position;
    }
    `;
  }

  function getFShaderSource() {
    return `
      #ifdef GL_ES
      precision mediump float;
      #endif
      
      uniform sampler2D u_Sampler;
      uniform vec3 u_ambientColor;
      uniform vec3 u_LightColor;
      
      varying float v_Dot;
      varying vec4 v_Color;
      varying vec3 v_Normal;
      void main(){
        vec3 ambient = v_Color.rgb * u_ambientColor;
        vec3 directionLight = v_Color.rgb * u_LightColor.rgb * v_Dot;
        gl_FragColor = vec4(directionLight + ambient,v_Color.a);
      }
    `;
  }

  initGL(gl);
  // initFrameBufferObj(gl);
  tic();
}

function updateLimit(id: string) {
  const toggleKey = ["start", "end"];
  const after = toggleKey.reduce((acc, cur, idx, arr) => {
    if (id.includes(cur)) {
      acc.push(cur, arr[1 - idx]);
    }
    return acc;
  }, [] as string[]);

  if (after.length) {
    const originEle = document.getElementById(id)! as HTMLInputElement;
    const effectEle = document.getElementById(
      id.replace(after[0], after[1]),
    )! as HTMLInputElement;
    const effectKey = after[0] == "start" ? "min" : "max";

    effectEle.value =
      effectKey == "min"
        ? Math.max(Number(originEle.value), Number(effectEle.value)).toString()
        : Math.min(Number(originEle.value), Number(effectEle.value)).toString();
    effectEle.setAttribute(effectKey, originEle.value);
  }
}

function updateTag(notUpdateSpan: boolean = false) {
  const inputIds: (keyof GlobalSetting["renderSetting"])[] = [
    "accumulate",
    "ystart",
    "yend",
    "xstart",
    "xend",
  ];
  const {renderSetting} = globalSetting;

  inputIds.forEach((id) => {
    const inputEle = document.querySelector(`#${id}`)! as HTMLInputElement;
    if (!notUpdateSpan) {
      inputEle.parentElement!.querySelector("h2 span")!.textContent =
        inputEle.value = renderSetting[id].toString();
    }
    updateLimit(id);
  });
}

function updateSetting(e: Event) {
  const {renderSetting, gl} = globalSetting;
  const ele = e.target as HTMLInputElement;
  const id = ele.id as keyof GlobalSetting["renderSetting"];

  renderSetting[id] = parseInt(ele.value);
  sphere = initSphereVertexBuffers(gl);
  updateTag();
}

window.addEventListener("load", (e) => {
  document.querySelectorAll("input").forEach((e) => {
    e.addEventListener("change", updateSetting);
  });
  document.getElementById("colorCheck")?.addEventListener("change",(e)=>{
    const { gl} = globalSetting;
    const check = (e.target! as HTMLInputElement).checked ? 1 : 0;
    const u_HasColor = gl.getUniformLocation((gl as any).program,"u_HasColor");

    gl.uniform1f(u_HasColor,check);
  })
  main();
  updateTag();
});
