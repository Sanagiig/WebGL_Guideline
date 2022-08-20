import { Matrix } from "../lib/Matrix.js";
const globalSetting = {
    gl: null,
    ang: 0,
    time: 0,
    fps: 0,
};
console.log(globalSetting);
function main() {
    function getVShaderSource() {
        return `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    attribute vec4 a_Normal;

    uniform mat4 u_ModelMatrix;
    uniform mat4 u_MVPMatrix;

    varying vec4 v_Position;
    varying vec4 v_Normal;
    varying vec4 v_Color;
    void main(){
      

      gl_Position =   u_MVPMatrix * a_Position;
      v_Position = u_ModelMatrix * a_Position;
      v_Normal = a_Normal;
      v_Color = a_Color;
    }
    `;
    }
    function getFShaderSource() {
        return `
      #ifdef GL_ES
      precision mediump float;
      #endif
      
      uniform vec3 u_PointLightPosition;
      uniform vec3 u_Ambient;
      uniform vec3 u_PointLightColor;
      uniform mat4 u_NormalMatrix;

      varying vec4 v_Position;
      varying vec4 v_Normal;
      varying vec4 v_Color;
      void main(){
        // vec3 ambient = u_Ambient * v_Color.rgb;
        // vec3 normal = normalize(vec3(u_NormalMatrix * v_Normal));
        // vec3 pointLightDirect = normalize(u_PointLightPosition - v_Position.xyz);
        // float pointLightDot = max(dot(pointLightDirect,normal),0.0);
        // vec3 diffuse = pointLightDot * u_PointLightColor * v_Color.rgb;
        
        gl_FragColor = vec4(1.0,0,0,1.0);
      }
    `;
    }
    function initGL(gl) {
        globalSetting.gl = gl;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
    }
    function initArrayBuffer(gl, attribName, arrData, attribUseSize, type, strip, offset) {
        const elementSize = arrData.BYTES_PER_ELEMENT;
        const buffer = gl.createBuffer();
        const attribPoint = gl.getAttribLocation(gl.program, attribName);
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
    function initVetexBuffers(gl) {
        const vertices = new Float32Array([
            // 前
            0.5, 1.0, 0.5, -0.5, 1.0, 0.5, -0.5, 0.0, 0.5, 0.5, 0.0, 0.5,
            // 后
            0.5, 1.0, -0.5, -0.5, 1.0, -0.5, -0.5, 0.0, -0.5, 0.5, 0.0, -0.5,
            // 左
            -0.5, 1.0, 0.5, -0.5, 1.0, -0.5, -0.5, 0.0, -0.5, -0.5, 0.0, 0.5,
            // 右
            0.5, 1.0, -0.5, 0.5, 1.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, -0.5,
            // 上
            0.5, 1.0, -0.5, -0.5, 1.0, -0.5, -0.5, 1.0, 0.5, 0.5, 1.0, 0.5,
            // 下
            0.5, 0.0, 0.5, -0.5, 0.0, 0.5, -0.5, 0.0, -0.5, 0.5, 0.0, -0.5,
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
        const normals = new Float32Array([
            // Normal
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0
        ]);
        // Indices of the vertices
        const indices = new Uint8Array([
            0, 1, 2, 0, 2, 3,
            4, 5, 6, 4, 6, 7,
            8, 9, 10, 8, 10, 11,
            12, 13, 14, 12, 14, 15,
            16, 17, 18, 16, 18, 19,
            20, 21, 22, 20, 22, 23 // 下
        ]);
        const indexBuffer = gl.createBuffer();
        if (!indexBuffer) {
            throw new Error("create indices buffer err");
        }
        initArrayBuffer(gl, "a_Position", vertices, 3, gl.FLOAT, 3, 0);
        initArrayBuffer(gl, "a_Color", colors, 4, gl.FLOAT, 3, 0);
        // initArrayBuffer(gl, "a_Normal", normals, 3, gl.FLOAT, 3, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        return indices.length;
    }
    function setLight(gl) {
        const u_Ambient = gl.getUniformLocation(gl.program, "u_Ambient");
        const u_PointLightPosition = gl.getUniformLocation(gl.program, "u_PointLightPosition");
        const u_PointLightColor = gl.getUniformLocation(gl.program, "u_PointLightColor");
        gl.uniform3f(u_Ambient, 0.3, 0.3, 0.3);
        gl.uniform3f(u_PointLightPosition, 50, 50, 50);
        gl.uniform3f(u_PointLightColor, 1, 1, 1);
    }
    function setMatrix(gl) {
        const u_MVPMatrix = gl.getUniformLocation(gl.program, "u_MVPMatrix");
        const u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
        const normalMatrix = new Matrix();
        const m = new Matrix();
        const v = new Matrix();
        const p = new Matrix();
        m.setRotate(globalSetting.ang, 0, 0, 1);
        v.setLookAt(10, 1, 10, 0, 0, 0, 0, 1, 0);
        p.setPerspective(30, 1, 1, 1000);
        normalMatrix.setInverseOf(m).transpose();
        v.multiply(p);
        m.multiply(v);
        gl.uniformMatrix4fv(u_MVPMatrix, false, m.originData());
        // gl.uniformMatrix4fv(u_NormalMatrix,false,normalMatrix.originData());
    }
    function render() {
        const { gl } = globalSetting;
        const n = initVetexBuffers(gl);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // setLight(gl);
        setMatrix(gl);
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
    }
    let canvas = document.getElementById("webgl");
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
}
window.addEventListener("load", (e) => {
    main();
});
