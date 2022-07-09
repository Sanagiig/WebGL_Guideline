import { Matrix } from "../lib/Matrix.js";
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
      uniform mat4 u_Matrix;
      void main(){
        gl_Position = a_Position * u_Matrix;
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
    function setMatrix(gl) {
        let u_Matrix = gl.getUniformLocation(gl.program, "u_Matrix");
        let matrix = new Matrix();
        let m2 = new Matrix();
        let m3 = new Matrix();
        matrix.transform(0.5, 0, 0);
        m2.transform(0.5, 0, 0);
        matrix.rotate(90);
        m3.rotate(90);
        console.log("before m3", m2.dump(), m3.dump());
        m3.multiply(m2);
        console.log("dump", matrix.dump(), m2.dump(), m3.dump());
        gl.uniformMatrix4fv(u_Matrix, false, m3.originData());
    }
    function render() {
        const { gl } = globalSetting;
        const n = initVetexBuffers(gl);
        gl.clear(gl.COLOR_BUFFER_BIT);
        setMatrix(gl);
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
