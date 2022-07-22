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

      uniform mat4 u_ModelMatrix;
      uniform mat4 u_ViewMatrix;
      uniform mat4 u_ProjectionMatrix;
      uniform mat4 u_MVPMatrix;
      uniform mat4 u_NormalMatrix;

      uniform vec3 u_LightColor;
      uniform vec3 u_LightDirection;
      uniform vec3 u_PointLightColor;
      uniform vec3 u_PointLightPosition;
      uniform vec3 u_Ambient;

      varying vec4 v_Color;

      void main(){
        vec3 ambient = u_Ambient * a_Color.rgb;
        vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
        vec4 position = u_ModelMatrix * a_Position;
        vec3 lightDirection = normalize(u_LightDirection);
        vec3 pointLightDirection = normalize(u_PointLightPosition - position.xyz);

        // 平行光线和法向量的点积
        float directDot = max(dot(lightDirection ,normal),0.0);
        // 点光源和法向量的点积
        float pointDot = max(dot(pointLightDirection ,normal),0.0);

        // 计算漫反射光的颜色
        vec3 diffuse = (u_LightColor * directDot  +  u_PointLightColor * pointDot) * a_Color.rgb;

        // diffuse.r = min(diffuse.r,1.0);
        // diffuse.g = min(diffuse.g,1.0);
        // diffuse.b = min(diffuse.b,1.0);
        // diffuse *= a_Color.rgb;

        gl_Position =  u_MVPMatrix * a_Position;
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
    const u_PointLightColor = gl.getUniformLocation((gl as any).program, 'u_PointLightColor');
    const u_PointLightPosition = gl.getUniformLocation((gl as any).program, 'u_PointLightPosition');
    const u_Ambient = gl.getUniformLocation((gl as any).program, 'u_Ambient');
    
    // gl.uniform3f(u_LightColor, 0.3, 0.3, 1.0);
    // gl.uniform3f(u_LightDirection, 5.0, 10.0, 4.0);
    gl.uniform3f(u_PointLightColor, 1, 1, 1);
    gl.uniform3f(u_PointLightPosition, 0, 1.5, 1.5);
    gl.uniform3f(u_Ambient, 0.2, 0.2, 0.2);
  }

  function setMatrix(gl: WebGLRenderingContext) {
    const u_ModelMatrix = gl.getUniformLocation((gl as any).program, "u_ModelMatrix");
    const u_ViewMatrix = gl.getUniformLocation((gl as any).program, "u_ViewMatrix");
    const u_ProjectionMatrix = gl.getUniformLocation((gl as any).program, "u_ProjectionMatrix");
    const u_NormalMatrix = gl.getUniformLocation((gl as any).program, 'u_NormalMatrix');
    const u_MVPMatrix = gl.getUniformLocation((gl as any).program, 'u_MVPMatrix');

    const m = new Matrix();
    const v = new Matrix();
    const p = new Matrix();
    const n = new Matrix();
    const mvp = new Matrix();

    m.setRotate(globalSetting.ang, 0, 1, 0);
    v.setLookAt(0, 5, 7, 0, 0, 0, 0, 1, 0)
    p.setPerspective(30, 1, 1, 100);
    n.setInverseOf(m).transpose();
    mvp.multiply(m).multiply(v).multiply(p);

    gl.uniformMatrix4fv(u_ModelMatrix, false, m.originData());
    gl.uniformMatrix4fv(u_ViewMatrix, false, v.originData());
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, p.originData());
    gl.uniformMatrix4fv(u_NormalMatrix,false,n.originData());
    gl.uniformMatrix4fv(u_MVPMatrix,false,mvp.originData());
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
    globalSetting.ang += 0.2;
    render();
    updateFPS();
  }

  initGL(gl);
  tic();
}

window.addEventListener("load", (e) => {
  main();
});
