"use strict";
const globalSetting = {
    a_Position: [],
    a_PointSize: [],
    gl: null,
};
function getVShaderSource() {
    return `
    attribute vec4 a_Position;
    attribute float a_PointSize;
    void main(){
      gl_Position = a_Position;
      gl_PointSize = a_PointSize;
    }
  `;
}
function getFShaderSource() {
    return `
    void main(){
      gl_FragColor = vec4(1.0,0.0,0.0,1.0);
    }
  `;
}
function initGL(gl) {
    globalSetting.gl = gl;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
}
function setPosition(gl, x, y, z = 0, w = 1) {
    let a_Position = gl.getAttribLocation(gl.program, "a_Position");
    gl.vertexAttrib4f(a_Position, x, y, z, w);
}
function setPointSize(gl, val) {
    let a_PointSize = gl.getAttribLocation(gl.program, "a_PointSize");
    gl.vertexAttrib1f(a_PointSize, val);
}
function render() {
    const { gl, a_PointSize, a_Position } = globalSetting;
    gl.clear(gl.COLOR_BUFFER_BIT);
    setPointSize(gl, a_PointSize[0]);
    for (let i = 0; i < a_Position.length; i += 2) {
        setPosition(gl, a_PointSize[i], a_PointSize[i + 1]);
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}
function main() {
    let canvas = document.getElementById("webgl");
    let gl = getWebGLContext(canvas);
    if (!initShaders(gl, getVShaderSource(), getFShaderSource())) {
        console.error("initShaders");
    }
    initGL(gl);
    render();
    console.log("load");
}

window.addEventListener("load", (e) => {
    main();
});

document.getElementById("webgl").addEventListener("click", (e) => {
    const { a_Position } = globalSetting;
    const target = e.target;
    const { height, width } = target.getBoundingClientRect();
    const midH = height / 2;
    const midW = width / 2;
    const x = e.clientX - midW;
    const y = midH - e.clientY;
    console.log("xx", x / midW, y / midH, globalSetting);
    a_Position.push(x / midW, y / midH);
    render();
});

document.getElementById("sizeAddBtn").addEventListener("click", (e) => {
    const { gl, a_PointSize } = globalSetting;
    a_PointSize[0] += 0.5;
    render();
});

document.getElementById("sizeSubBtn").addEventListener("click", (e) => {
    const { gl, a_PointSize } = globalSetting;
    a_PointSize[0] -= 0.5;
    render();
});
