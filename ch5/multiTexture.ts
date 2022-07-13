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
      attribute vec2 a_Textures;

      varying vec2 v_Textures;
      void main(){
        gl_Position = a_Position;
        v_Textures = a_Textures;
      }
    `;
  }

  function getFShaderSource() {
    return `
      #ifdef GL_ES
      precision mediump float;
      #endif

      uniform sampler2D u_Sampler;
      uniform sampler2D u_Sampler2;
      varying vec2 v_Textures;
      void main(){
        vec4 color1 = texture2D(u_Sampler,v_Textures);
        vec4 color2 = texture2D(u_Sampler2,v_Textures);
        gl_FragColor = color1 * color2;
      }
    `;
  }

  function initGL(gl: WebGLRenderingContext) {
    globalSetting.gl = gl;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
  }

  function initVetexBuffers(gl: WebGLRenderingContext) {
    let vertices = new Float32Array([
      -0.5, 0.5, 0.0, 1.0, 0.5, 0.5, 1.0, 1.0, -0.5, -0.5, 0.0, 0.0, 0.5, -0.5,
      1.0, 0.0,
    ]);

    let n = vertices.length / 4;
    let vertexBuffer = gl.createBuffer();
    let a_Position = gl.getAttribLocation((gl as any).program, "a_Position");
    let a_Textures = gl.getAttribLocation((gl as any).program, "a_Textures");
    const arrElementByte = vertices.BYTES_PER_ELEMENT;

    if (!vertexBuffer || !a_Textures) {
      console.error("createBuffer || a_Textures err");
      return -1;
    }

    // 将缓冲区对象绑定到目标
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 向缓冲区写入数据
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    // 将缓冲区对象分配给 a_Position 变量
    gl.vertexAttribPointer(
      a_Position,
      2,
      gl.FLOAT,
      false,
      arrElementByte * 4,
      0,
    );
    // 连接 a_Position 变量 & 分配给它的缓冲区对象
    gl.enableVertexAttribArray(a_Position);

    gl.vertexAttribPointer(
      a_Textures,
      2,
      gl.FLOAT,
      false,
      arrElementByte * 4,
      arrElementByte * 2,
    );
    gl.enableVertexAttribArray(a_Textures);

    initTextures(gl, n);
  }

  function initTextures(gl: WebGLRenderingContext, n: number) {
    // 创建纹理对象
    const texture = gl.createTexture();
    const texture2 = gl.createTexture();

    const u_Sampler = gl.getUniformLocation((gl as any).program, "u_Sampler");
    const u_Sampler2 = gl.getUniformLocation((gl as any).program, "u_Sampler2");

    const image = new Image();
    const image2 = new Image();

    let count = 0;

    image.onload = function () {
      ++count;
      loadTexture(gl, n, texture!, u_Sampler!, image, count);
    };

    image2.onload = function () {
      ++count;
      loadTexture(gl, n, texture2!, u_Sampler2!, image2, count);
    };

    image.src = "../resources/sky.JPG";
    image2.src = "../resources/circle.gif";
  }

  function loadTexture(
    gl: WebGLRenderingContext,
    n: number,
    texture: WebGLTexture,
    u_Sampler: WebGLUniformLocation,
    image: HTMLImageElement,
    count: number,
  ) {
    const GL_TEXTURE_NUM = count === 1 ? gl.TEXTURE0 : gl.TEXTURE1;
    // 对纹理图像进行 Y 轴翻转
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // 开启 0 号纹理单元
    gl.activeTexture(GL_TEXTURE_NUM);
    // 向 target 绑定纹理对象
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 配置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // 配置纹理图像
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    // 将 0 号纹理传递给着色器
    gl.uniform1i(u_Sampler, count - 1);
    console.log("gl.TEXTURE0", n, GL_TEXTURE_NUM);

    if (count >= 2) {
      tic(n);
    }
  }

  function render(n: number) {
    const {gl} = globalSetting;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
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

  function tic(n: number) {
    requestAnimationFrame(() => {
      tic(n);
    });
    // globalSetting.ang += 1;
    render(n);
    updateFPS();
  }

  initGL(gl);
  initVetexBuffers(gl);
}

window.addEventListener("load", (e) => {
  main();
});
