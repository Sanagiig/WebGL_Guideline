"use strict";
function main() {
    const globalSetting = {
        a_Position: [],
        a_PointSize: [3.0],
        u_FragColor: [],
        gl: null,
    };
    function getVShaderSource() {
        return `
      attribute vec4 a_Position;
      uniform vec4 u_Transform;
      uniform float u_SinVal;
      uniform float u_CosVal;
      void main(){
        vec4 tmp_Position =  a_Position + u_Transform;
        gl_Position.x = tmp_Position.x * u_CosVal - tmp_Position.y * u_SinVal;
        gl_Position.y = tmp_Position.y * u_CosVal + tmp_Position.x * u_SinVal;
        gl_Position.z = tmp_Position.z;
        gl_Position.w = tmp_Position.w;

        gl_PointSize = 10.0;
      }
    `;
    }
    function getFShaderSource() {
        return `
      void main(){
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `;
    }
    function initGL(gl) {
        globalSetting.gl = gl;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
    }
    function initVetexBuffers(gl) {
        let vertices = new Float32Array([
            -0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
        ]);
        let n = vertices.length / 2;
        let vertexBuffer = gl.createBuffer();
        let a_Position = gl.getAttribLocation(gl.program, "a_Position");
        if (!vertexBuffer) {
            console.error("createBuffer err");
            return -1;
        }
        gl.INVALID_VALUE;
        // 将缓冲区对象绑定到目标
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        // 向缓冲区写入数据
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        // 将缓冲区对象分配给 a_Position 变量
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        // 连接 a_Position 变量 & 分配给它的缓冲区对象
        gl.enableVertexAttribArray(a_Position);
        return n;
    }
    function setTransform(gl, x, y, z = 0, w = 0) {
        let u_Transform = gl.getUniformLocation(gl.program, "u_Transform");
        gl.uniform4f(u_Transform, x, y, z, 1 * w);
    }
    function setRotation(gl, ang) {
        let u_SinVal = gl.getUniformLocation(gl.program, "u_SinVal");
        let u_CosVal = gl.getUniformLocation(gl.program, "u_CosVal");
        const rad = (ang / 180) * Math.PI;
        gl.uniform1f(u_CosVal, Math.cos(rad));
        gl.uniform1f(u_SinVal, Math.sin(rad));
    }
    function render() {
        const { gl } = globalSetting;
        const n = initVetexBuffers(gl);
        gl.clear(gl.COLOR_BUFFER_BIT);
        // setTransform(gl, 0.5, 0.5, 0);
        setRotation(gl, 90);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
    }
    let canvas = document.getElementById("webgl");
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
