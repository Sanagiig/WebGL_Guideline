import { Matrix } from "../lib/Matrix.js";
const globalSetting = {
    gl: null,
    ang: 0,
    time: 0,
    fps: 0,
};
console.log(globalSetting);
function main() {
    let eyePosition = [0.2, 0.2, 1];
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
    uniform mat4 u_MVPMatrix;

    varying vec4 v_Position;
    varying vec4 v_Normal;
    varying vec4 v_Color;
    varying float v_Dist;

    void main(){
      v_Color = a_Color;
      gl_Position =   u_MVPMatrix * a_Position;
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
      uniform vec3 u_Ambient;
      uniform vec3 u_PointLightColor;
      uniform mat4 u_NormalMatrix;

      varying float v_Dist;
      varying vec4 v_Position;
      varying vec4 v_Normal;
      varying vec4 v_Color;
      void main(){
        float frogVal = clamp((u_FrogDist.y - v_Dist) / (u_FrogDist.y - u_FrogDist.x),0.0,1.0);
        vec3 color = mix(u_FrogColor.rgb, vec3(v_Color), clamp(frogVal, 0.0, 1.0));
        gl_FragColor = vec4(color, v_Color.a);
      }
    `;
    }
    function initGL(gl) {
        globalSetting.gl = gl;
        gl.clearColor(0.3, 0.3, 0.3, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
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
    function initVetexBuffers(gl, outerColor) {
        var verticesColors = new Float32Array([
            // Vertex coordinates and color(RGBA)
            0.0, 0.5, -0.4, 0.4, 1.0, 0.4, 0.4,
            -0.5, -0.5, -0.4, 0.4, 1.0, 0.4, 0.4,
            0.5, -0.5, -0.4, 1.0, 0.4, 0.4, 0.4,
            0.5, 0.4, -0.2, 1.0, 0.4, 0.4, 0.4,
            -0.5, 0.4, -0.2, 1.0, 1.0, 0.4, 0.4,
            0.0, -0.6, -0.2, 1.0, 1.0, 0.4, 0.4,
            0.0, 0.5, 0.0, 0.4, 0.4, 1.0, 0.4,
            -0.5, -0.5, 0.0, 0.4, 0.4, 1.0, 0.4,
            0.5, -0.5, 0.0, 1.0, 0.4, 0.4, 0.4,
        ]);
        const indexBuffer = gl.createBuffer();
        if (!indexBuffer) {
            throw new Error("create indices buffer err");
        }
        initArrayBuffer(gl, "a_Position", verticesColors, 3, gl.FLOAT, 7, 0);
        initArrayBuffer(gl, "a_Color", verticesColors, 4, gl.FLOAT, 7, 3);
        // initArrayBuffer(gl, "a_Normal", normals, 3, gl.FLOAT, 3, 0);
        return 9;
    }
    function setLight(gl) {
        // const u_Ambient = gl.getUniformLocation((gl as any).program, "u_Ambient");
        // const u_PointLightPosition = gl.getUniformLocation((gl as any).program, "u_PointLightPosition");
        // const u_PointLightColor = gl.getUniformLocation((gl as any).program, "u_PointLightColor");
        const u_eyePosition = gl.getUniformLocation(gl.program, "u_eyePosition");
        const u_FrogDist = gl.getUniformLocation(gl.program, "u_FrogDist");
        const u_FrogColor = gl.getUniformLocation(gl.program, "u_FrogColor");
        gl.uniform3f(u_eyePosition, eyePosition[0], eyePosition[1], eyePosition[2]);
        gl.uniform2f(u_FrogDist, frogDist[0], frogDist[1]);
        gl.uniform4f(u_FrogColor, 0.3, 0.3, 0.3, 1.0);
        // gl.uniform3f(u_Ambient, 0.3, 0.3, 0.3);
        // gl.uniform3f(u_PointLightPosition, 50, 50, 50);
        // gl.uniform3f(u_PointLightColor, 1, 1, 1);
    }
    function setMatrix(gl) {
        const u_MVPMatrix = gl.getUniformLocation(gl.program, "u_MVPMatrix");
        const u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
        const normalMatrix = new Matrix();
        const m = new Matrix();
        const v = new Matrix();
        const p = new Matrix();
        // m.setRotate(globalSetting.ang, 1, 1, 1);
        v.setLookAt(eyePosition[0], eyePosition[1], eyePosition[2], 0, 0, 0, 0, 1, 0);
        p.setPerspective(30, 1, 1.0, 1000);
        normalMatrix.setInverseOf(m).transpose();
        v.multiply(p);
        m.multiply(v);
        gl.uniformMatrix4fv(u_MVPMatrix, false, m.originData());
        // gl.uniformMatrix4fv(u_NormalMatrix,false,normalMatrix.originData());
    }
    function render(outerColor) {
        const { gl } = globalSetting;
        const u_Check = gl.getUniformLocation(gl.program, "u_Check");
        const n = initVetexBuffers(gl, outerColor);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        setLight(gl);
        setMatrix(gl);
        gl.uniform1f(u_Check, check);
        gl.drawArrays(gl.TRIANGLES, 0, n);
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
}
window.addEventListener("load", (e) => {
    main();
});
