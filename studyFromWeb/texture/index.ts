// 定义一些卷积核
var kernels = {
  normal: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  gaussianBlur: [0.045, 0.122, 0.045, 0.122, 0.332, 0.122, 0.045, 0.122, 0.045],
  gaussianBlur2: [1, 2, 1, 2, 4, 2, 1, 2, 1],
  gaussianBlur3: [0, 1, 0, 1, 1, 1, 0, 1, 0],
  unsharpen: [-1, -1, -1, -1, 9, -1, -1, -1, -1],
  sharpness: [0, -1, 0, -1, 5, -1, 0, -1, 0],
  sharpen: [-1, -1, -1, -1, 16, -1, -1, -1, -1],
  edgeDetect: [
    -0.125, -0.125, -0.125, -0.125, 1, -0.125, -0.125, -0.125, -0.125,
  ],
  edgeDetect2: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
  edgeDetect3: [-5, 0, 0, 0, 0, 0, 0, 0, 5],
  edgeDetect4: [-1, -1, -1, 0, 0, 0, 1, 1, 1],
  edgeDetect5: [-1, -1, -1, 2, 2, 2, -1, -1, -1],
  edgeDetect6: [-5, -5, -5, -5, 39, -5, -5, -5, -5],
  sobelHorizontal: [1, 2, 1, 0, 0, 0, -1, -2, -1],
  sobelVertical: [1, 0, -1, 2, 0, -2, 1, 0, -1],
  previtHorizontal: [1, 1, 1, 0, 0, 0, -1, -1, -1],
  previtVertical: [1, 0, -1, 1, 0, -1, 1, 0, -1],
  boxBlur: [0.111, 0.111, 0.111, 0.111, 0.111, 0.111, 0.111, 0.111, 0.111],
  triangleBlur: [
    0.0625, 0.125, 0.0625, 0.125, 0.25, 0.125, 0.0625, 0.125, 0.0625,
  ],
  emboss: [-2, -1, 0, -1, 1, 1, 0, 1, 2],
};

type EffectApplyType =
  | "normal"
  | "gaussianBlur3"
  | "sharpness"
  | "edgeDetect"
  | "edgeDetect3"
  | "emboss"
  | "gaussianBlur"
  | "sharpen"
  | "unsharpen";

// 将要使用的效果列表
var effectsToApply: EffectApplyType[] = [];

var effects = [
  "normal",
  "gaussianBlur3",
  "gaussianBlur3",
  "gaussianBlur3",
  "sharpness",
  "sharpness",
  "sharpness",
  "sharpen",
  "sharpen",
  "sharpen",
  "unsharpen",
  "unsharpen",
  "unsharpen",
  "emboss",
  "edgeDetect",
  "edgeDetect",
  "edgeDetect3",
  "edgeDetect3",
];

const textures: any[] = [];
const framebuffers: any[] = [];
let originTexture: any;

function init(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  image: HTMLImageElement,
) {
  const selEle = document.getElementById("sel")!;
  selEle.innerHTML = effects
    .map((item, i) => {
      return `<option value="${item}">${item}</option>`;
    })
    .join("");

  selEle.addEventListener("change", (e) => {
    const ele = e.target! as HTMLSelectElement;
    effectsToApply = [];
    for (let i = 0; i < ele.options.length; ++i) {
      const option = ele.options[i];
      if (option.selected) {
        effectsToApply.push(option.value as EffectApplyType);
      }
    }
    draw(gl, program, image);
  });
}

function main() {
  let image = new Image();
  image.src = "../../resources/blueflower.JPG";
  image.onload = function () {
    render(image);
  };
}

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  } else {
    const info = gl.getShaderInfoLog(shader) || "error";
    gl.deleteShader(shader);
    throw new Error(info);
  }
}

function createProgram(
  gl: WebGLRenderingContext,
  vShaderEle: string,
  fShaderEle: string,
) {
  const vSource = document.getElementById(vShaderEle)!.textContent!;
  const fSource = document.getElementById(fShaderEle)!.textContent!;
  const vShader = createShader(gl, gl.VERTEX_SHADER, vSource);
  const fShader = createShader(gl, gl.FRAGMENT_SHADER, fSource);
  const program = gl.createProgram()!;

  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);

  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return program;
  } else {
    const info = gl.getProgramInfoLog(program) || "error";
    gl.deleteProgram(program);
    throw new Error(info);
  }
}

function createAndSetupTexture(gl: WebGLRenderingContext) {
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // 设置材质，这样我们可以对任意大小的图像进行像素操作
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  return texture;
}

function initWebGL(gl: WebGLRenderingContext) {
  // Tell WebGL how to convert from clip space to pixels
  // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 1);
}

function createFrameAndTexture(
  gl: WebGLRenderingContext,
  image: HTMLImageElement,
) {
  for (let i = 0; i < 2; ++i) {
    const texture = createAndSetupTexture(gl);
    const framebuffer = gl.createFramebuffer();

    // make the texture the same size as the image
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      image.width,
      image.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );

    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    textures.push(texture);
    framebuffers.push(framebuffer);
  }

  // gl.bindTexture(gl.TEXTURE_2D, null);
  // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

var canvas = document.querySelector("#canvas") as HTMLCanvasElement;
  var gl = canvas.getContext("webgl")!;
function render(image: HTMLImageElement) {
  
  const program = createProgram(gl, "vshader", "fshader");
  if (!gl) {
    return;
  }

  // lookup uniforms
  init(gl, program, image);
  // Tell it to use our program (pair of shaders)
  initWebGL(gl);
  gl.useProgram(program);
  gl.clear(gl.COLOR_BUFFER_BIT);
  setRectVertex(gl, program, image);
  setFragment(gl, program, image);
  createFrameAndTexture(gl, image);
  console.log("framebuffers", framebuffers, textures);
  // 从原始图像开始
  draw(gl, program, image);
}

function setAttribute(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  key: string,
  data: Float32Array,
  type: number,
  size: number,
  strip: number,
  offset: number,
  normalized: boolean,
) {
  var location = gl.getAttribLocation(program, key);
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.vertexAttribPointer(location, size, type, normalized, strip, offset);
  gl.enableVertexAttribArray(location);
}

function setRectVertex(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  image: HTMLImageElement,
) {
  var x1 = 0;
  var x2 = image.width;
  var y1 = 0;
  var y2 = image.height;

  setAttribute(
    gl,
    program,
    "a_position",
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.FLOAT,
    2,
    0,
    0,
    false,
  );

  setAttribute(
    gl,
    program,
    "a_texCoord",
    new Float32Array([
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
    ]),
    gl.FLOAT,
    2,
    0,
    0,
    false,
  );
  console.log('arr"', gl.canvas.width, gl.canvas.height);
}

function setFragment(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  image: HTMLImageElement,
) {
  var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

  var imageLocation = gl.getUniformLocation(program, "u_image");

  // Create a texture.
  originTexture = createAndSetupTexture(gl);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  // set the resolution
  gl.uniform2f(textureSizeLocation, image.width, image.height);
  gl.uniform1i(imageLocation, 0);
}

function setFramebuffer(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  fbo: WebGLFramebuffer | null,
  width: number,
  height: number,
) {
  var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  // 设定当前使用帧缓冲
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.uniform2f(resolutionLocation, width, height);
  // 告诉WebGL帧缓冲需要的视图大小
  gl.viewport(0, 0, width, height);
}

function drawWithKernel(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: EffectApplyType,
) {
  var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
  var kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");
  const matrix = kernels[name];
  // 设置卷积核
  gl.uniform1fv(kernelLocation, matrix);
  gl.uniform1f(kernelWeightLocation, computeKernelWeight(matrix));
  // 画出矩形
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function computeKernelWeight(kernel: number[]) {
  var weight = kernel.reduce(function (prev, curr) {
    return prev + curr;
  });
  return weight <= 0 ? 1 : weight;
}

function draw(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  image: HTMLImageElement,
) {
  var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
  var flipYLocation = gl.getUniformLocation(program, "u_flipY");
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);

  gl.uniform2f(textureSizeLocation, image.width, image.height);
  gl.bindTexture(gl.TEXTURE_2D, originTexture);
  // 在渲染效果时不翻转y轴
  gl.uniform1f(flipYLocation, 1);

  for (let i = 0; i < effectsToApply.length; ++i) {
    // 使用两个帧缓冲中的一个
    setFramebuffer(
      gl,
      program,
      framebuffers[i % 2]!,
      image.width,
      image.height,
    );
    drawWithKernel(gl, program, effectsToApply[i]);
    gl.bindTexture(gl.TEXTURE_2D, textures[i % 2]);
  }

  // // Draw the rectangle.
  setFramebuffer(gl, program, null, gl.canvas.width, gl.canvas.height);
  // 在渲染效果时不翻转y轴
  gl.uniform1f(flipYLocation, -1);
  drawWithKernel(gl, program, "normal");
}

main();
