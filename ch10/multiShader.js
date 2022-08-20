import { Matrix } from "../lib/Matrix.js";
const globalSetting = {
    gl: null,
    ang: 0,
    time: 0,
    fps: 0,
};
console.log(globalSetting);
function main() {
    let isMouseDown = false;
    let eyePosition = [0, 5, 20];
    let check = 0;
    let frogDist = [0, 100];
    function getVShaderSource() {
        return `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    attribute vec4 a_Normal;

    uniform float u_Check;
    uniform vec3 u_eyePosition;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_NormalMatrix;
    uniform vec3 u_Ambient;

    varying float v_DireLightDot;
    varying float v_Dist;
    varying vec4 v_Position;
    varying vec4 v_Color;

    void main(){
      vec3 lightDirection = vec3(1.0,1.0,1.0);
      vec4 position = u_ModelMatrix * a_Position;
      vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
      vec3 ambientColor = u_Ambient * a_Color.rgb;
      float direLightDot = max(dot(normal,lightDirection),0.0);
      v_Color = vec4(vec3(1.0,1.0,1.0) * direLightDot * a_Color.rgb + ambientColor, a_Color.a) ;
      gl_Position =   u_MvpMatrix * a_Position;
      v_Dist = gl_Position.w;
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
      uniform vec3 u_PointLightColor;

      varying float v_Dist;
      varying float v_DireLightDot;
      varying vec4 v_Position;
      varying vec4 v_Color;
      void main(){
        gl_FragColor = v_Color;
      }
    `;
    }
    function getTextureVShader() {
        return `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    attribute vec4 a_Normal;

    uniform float u_Check;
    uniform vec3 u_eyePosition;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_NormalMatrix;
    uniform vec3 u_Ambient;

    varying float v_DireLightDot;
    varying float v_Dist;
    varying vec4 v_Position;
    varying vec4 v_Color;

    void main(){
      vec3 lightDirection = vec3(1.0,1.0,1.0);
      vec4 position = u_ModelMatrix * a_Position;
      vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
      vec3 ambientColor = u_Ambient * a_Color.rgb;
      float direLightDot = max(dot(normal,lightDirection),0.0);
      v_Color = vec4(vec3(1.0,1.0,1.0) * direLightDot * a_Color.rgb + ambientColor, a_Color.a) ;
      gl_Position =   u_MvpMatrix * a_Position;
      v_Dist = gl_Position.w;
    }
    `;
    }
    function getTextureFShader() {
        return `
      #ifdef GL_ES
      precision mediump float;
      #endif

      uniform vec2 u_FrogDist;
      uniform vec4 u_FrogColor;
      uniform vec3 u_PointLightPosition;
      uniform vec3 u_PointLightColor;

      varying float v_Dist;
      varying float v_DireLightDot;
      varying vec4 v_Position;
      varying vec4 v_Color;
      void main(){
        gl_FragColor = v_Color;
      }
    `;
    }
    // function getTextureVShader(){
    //   return `
    //     attribute vec4 a_Position;
    //     attribute vec4 a_Normal;
    //     attribute vec2 a_TexCoord;
    //     uniform mat4 u_MvpMatrix;
    //     uniform mat4 u_NormalMatrix;
    //     varying float v_NdotL;
    //     varying vec2 v_TexCoord;
    //     void main(){
    //       vec3 lightDirection = vec3(1.0,1.0,1.0);
    //       vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
    //       v_NdotL = max(dot(normal, lightDirection), 0.0);
    //       gl_Position = u_MvpMatrix * a_Position;
    //       v_TexCoord = a_TexCoord;
    //     }
    //   `
    // }
    // function getTextureFShader(){
    //   return `
    //     #ifdef GL_ES
    //     precision mediump float;
    //     #endif
    //     uniform sampler2D u_Sampler;
    //     varying vec2 v_TexCoord;
    //     varying float v_NdotL;
    //     void main() {
    //       vec4 color = texture2D(u_Sampler, v_TexCoord);
    //       gl_FragColor = vec4(color.rgb * v_NdotL, color.a);
    //     };
    //   `
    // }
    function initGL(gl) {
        globalSetting.gl = gl;
        gl.clearColor(0, 0, 0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    function initArrayBuffer(gl, program, attribName, arrData, attribUseSize, type, strip, offset) {
        const elementSize = arrData.BYTES_PER_ELEMENT;
        const buffer = gl.createBuffer();
        const attribPoint = gl.getAttribLocation(program, attribName);
        if (!buffer) {
            throw new Error(`${attribName} createBuffer  err`);
        }
        if (attribPoint < 0) {
            throw new Error(`getAttribLocation ${attribName} error`);
        }
        // 将缓冲区对象绑定到目标
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        // 向缓冲区写入数据
        gl.bufferData(gl.ARRAY_BUFFER, arrData, gl.STATIC_DRAW);
        // 将缓冲区对象分配给 attribute 变量
        gl.vertexAttribPointer(attribPoint, attribUseSize, type, false, strip * elementSize, offset * elementSize);
        // 连接 attribute 变量 & 分配给它的缓冲区对象
        gl.enableVertexAttribArray(attribPoint);
    }
    function initVetexBuffers(gl, program) {
        const vertices = new Float32Array([
            1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
            1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0,
            1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,
            -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
            1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0 // v4-v7-v6-v5 back
        ]);
        const colors = new Float32Array([
            // Colors
            1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0,
        ]);
        var normals = new Float32Array([
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0 // v4-v7-v6-v5 back
        ]);
        var texCoords = new Float32Array([
            1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
        ]);
        // Indices of the vertices
        const indices = new Uint8Array([
            0, 1, 2, 0, 2, 3,
            4, 5, 6, 4, 6, 7,
            8, 9, 10, 8, 10, 11,
            12, 13, 14, 12, 14, 15,
            16, 17, 18, 16, 18, 19,
            20, 21, 22, 20, 22, 23 // back
        ]);
        const indexBuffer = gl.createBuffer();
        if (!indexBuffer) {
            throw new Error("create indices buffer err");
        }
        initArrayBuffer(gl, program, "a_Position", vertices, 3, gl.FLOAT, 3, 0);
        initArrayBuffer(gl, program, "a_Color", colors, 4, gl.FLOAT, 4, 0);
        initArrayBuffer(gl, program, "a_Normal", normals, 3, gl.FLOAT, 3, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        return indices.length;
    }
    function setLight(gl, program) {
        const u_Ambient = gl.getUniformLocation(program, "u_Ambient");
        // const u_PointLightPosition = gl.getUniformLocation((gl as any).program, "u_PointLightPosition");
        // const u_PointLightColor = gl.getUniformLocation((gl as any).program, "u_PointLightColor");
        const u_eyePosition = gl.getUniformLocation(program, "u_eyePosition");
        const u_FrogDist = gl.getUniformLocation(program, "u_FrogDist");
        const u_FrogColor = gl.getUniformLocation(program, "u_FrogColor");
        gl.uniform3f(u_eyePosition, eyePosition[0], eyePosition[1], eyePosition[2]);
        gl.uniform2f(u_FrogDist, frogDist[0], frogDist[1]);
        gl.uniform4f(u_FrogColor, 0.3, 0.3, 0.3, 1.0);
        gl.uniform3f(u_Ambient, 0.3, 0.3, 0.3);
        // gl.uniform3f(u_PointLightPosition, 50, 50, 50);
        // gl.uniform3f(u_PointLightColor, 1, 1, 1);
    }
    function setMatrix(gl, program, x) {
        const u_MvpMatrix = gl.getUniformLocation(program, "u_MvpMatrix");
        const u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');
        const normalMatrix = new Matrix();
        const m = new Matrix();
        const v = new Matrix();
        const p = new Matrix();
        m.translate(x, 0, 0);
        m.rotate(globalSetting.ang, 1, 1, 0);
        v.setLookAt(eyePosition[0], eyePosition[1], eyePosition[2], 0, 0, 0, 0, 1, 0);
        p.setPerspective(30, 1, 1.0, 1000);
        normalMatrix.setInverseOf(m).transpose();
        if (isMouseDown) {
            console.log("normalMatrix", normalMatrix.originData());
        }
        v.multiply(p);
        m.multiply(v);
        gl.uniformMatrix4fv(u_MvpMatrix, false, m.originData());
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.originData());
    }
    function render() {
        const { gl } = globalSetting;
        const sn = initVetexBuffers(gl, solidProgram);
        gl.useProgram(solidProgram);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        setLight(gl, solidProgram);
        setMatrix(gl, solidProgram, -4);
        gl.drawElements(gl.TRIANGLES, sn, gl.UNSIGNED_BYTE, 0);
        gl.useProgram(textureProgram);
        setLight(gl, textureProgram);
        setMatrix(gl, textureProgram, 4);
        gl.drawElements(gl.TRIANGLES, sn, gl.UNSIGNED_BYTE, 0);
    }
    let canvas = document.getElementById("webgl");
    let gl = getWebGLContext(canvas);
    let solidProgram = createProgram(gl, getVShaderSource(), getFShaderSource());
    let textureProgram = createProgram(gl, getTextureVShader(), getTextureFShader());
    function updateFPS() {
        let fpsDisplayer = document.getElementById("fpsDisplayer");
        const now = Date.now();
        const time = globalSetting.time
            ? globalSetting.time
            : (globalSetting.time = now);
        if (!fpsDisplayer) {
            fpsDisplayer = document.createElement("h1");
            fpsDisplayer.id = "fpsDisplayer";
            document.body.insertBefore(fpsDisplayer, document.getElementById("webgl"));
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
    window.addEventListener("wheel", function (e) {
        let evt = e || window.event; //考虑兼容性
        evt.preventDefault();
        if (evt.deltaY > 0) { //在火狐中 向下滚动是3 谷歌是125
            eyePosition[0] -= 0.5;
        }
        else { //在火狐中 向上滚动是-3 谷歌是-125
            eyePosition[0] += 0.5;
        }
        //检查事件
        console.log("eyePosition", eyePosition[0], eyePosition[1]);
    }, {
        passive: false
    });
    window.addEventListener("mousedown", function (e) {
        isMouseDown = true;
    });
    window.addEventListener("mouseup", function (e) {
        isMouseDown = false;
    });
}
window.addEventListener("load", (e) => {
    main();
});
