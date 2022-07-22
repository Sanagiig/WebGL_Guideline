import { Matrix } from "../lib/Matrix.js";
function main() {
    const globalSetting = {
        gl: null,
        ang: 0,
        time: 0,
        fps: 0,
    };
    function getVShaderSource() {
        return `
      attribute vec4 a_Position;
      attribute vec4 a_Color;

      uniform mat4 u_Matrix;
      uniform mat4 u_ViewMatrix;

      varying vec4 v_Color;
      void main(){
        gl_Position =  u_ViewMatrix * u_Matrix * a_Position;
        gl_PointSize = 10.0;
        v_Color = a_Color;
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
    function initGL(gl) {
        globalSetting.gl = gl;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
    }
    function initVetexBuffers(gl) {
        const vertices = new Float32Array([
            // Vertex coordinates and color(RGBA)
            0.0, 0.5, -0.4, 0.4, 1.0, 0.4,
            -0.5, -0.5, -0.4, 0.4, 1.0, 0.4,
            0.5, -0.5, -0.4, 1.0, 0.4, 0.4,
            0.5, 0.4, -0.2, 1.0, 0.4, 0.4,
            -0.5, 0.4, -0.2, 1.0, 1.0, 0.4,
            0.0, -0.6, -0.2, 1.0, 1.0, 0.4,
            0.0, 0.5, 0.0, 0.4, 0.4, 1.0,
            -0.5, -0.5, 0.0, 0.4, 0.4, 1.0,
            0.5, -0.5, 0.0, 1.0, 0.4, 0.4,
        ]);
        const n = 9;
        const eleSize = vertices.BYTES_PER_ELEMENT;
        let vertexBuffer = gl.createBuffer();
        let a_Position = gl.getAttribLocation(gl.program, "a_Position");
        let a_Color = gl.getAttribLocation(gl.program, "a_Color");
        if (!vertexBuffer) {
            console.error("createBuffer  err");
            return -1;
        }
        // 将缓冲区对象绑定到目标
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        // 向缓冲区写入数据
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        // 将缓冲区对象分配给 a_Position 变量
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, eleSize * 6, 0);
        // 连接 a_Position 变量 & 分配给它的缓冲区对象
        gl.enableVertexAttribArray(a_Position);
        // 将缓冲区对象分配给 a_Position 变量
        gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, eleSize * 6, eleSize * 3);
        // 连接 a_Position 变量 & 分配给它的缓冲区对象
        gl.enableVertexAttribArray(a_Color);
        return n;
    }
    function setMatrix(gl) {
        let m2 = new Matrix();
        let m3 = new Matrix();
        const u_Matrix = gl.getUniformLocation(gl.program, "u_Matrix");
        const u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
        const viewMatrix = new Matrix();
        viewMatrix.setLookAt(0.2, 0.25, 0.25, 0, 0, 0, 0, 1, 0);
        m2.translate(0.5, 0, 0);
        m3.setRotate(globalSetting.ang, 0, 0, 1);
        m3.multiply(m2);
        gl.uniformMatrix4fv(u_Matrix, false, m3.originData());
        gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.originData());
    }
    function render() {
        const { gl } = globalSetting;
        const n = initVetexBuffers(gl);
        gl.clear(gl.COLOR_BUFFER_BIT);
        setMatrix(gl);
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
