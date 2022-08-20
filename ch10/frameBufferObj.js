import { Matrix } from "../lib/Matrix.js";
;
const globalSetting = {
    gl: null,
    ang: 0,
    time: 0,
    fps: 0,
};
console.log(globalSetting);
function main() {
    let canvas = document.getElementById("webgl");
    let gl = getWebGLContext(canvas);
    if (!initShaders(gl, getVShaderSource(), getFShaderSource())) {
        return console.error("initShaders");
    }
    const cube = initCubeVertexBuffers(gl);
    const plane = initPlaneVetexBuffers(gl);
    let eyePosition = [0.0, 0.0, 7.0];
    let frameBufferObj;
    let texture;
    const offsetWidth = 256;
    const offsetHeight = 256;
    function getVShaderSource() {
        return `
    attribute vec4 a_Position;
    attribute vec2 a_TexCoord;
    attribute vec4 a_Color;

    uniform mat4 u_MVPMatrix;
    varying vec2 v_TexCoord;
    varying vec4 v_Color;

    void main(){
      v_TexCoord = a_TexCoord;
      v_Color = a_Color;
      gl_Position =   u_MVPMatrix * a_Position;
    }
    `;
    }
    function getFShaderSource() {
        return `
      #ifdef GL_ES
      precision mediump float;
      #endif
      
      uniform float u_UseColor;
      uniform sampler2D u_Sampler;

      varying vec4 v_Color;
      varying vec2 v_TexCoord;
      void main(){
        gl_FragColor = u_UseColor == 0.0 
          ? texture2D(u_Sampler,v_TexCoord) 
          : v_Color;
      }
    `;
    }
    function initGL(gl) {
        globalSetting.gl = gl;
        gl.clearColor(0.3, 0.3, 0.3, 1.0);
        gl.enable(gl.DEPTH_TEST);
    }
    function initArrayBuffer(gl, attribName, arrData, attribUseSize, type, strip, offset) {
        const elementSize = arrData.BYTES_PER_ELEMENT;
        const buffer = gl.createBuffer();
        const location = gl.getAttribLocation(gl.program, attribName);
        if (!buffer) {
            throw new Error(`${attribName} createBuffer  err`);
        }
        if (location < 0) {
            throw new Error(`getAttribLocation ${attribName} error`);
        }
        // 将缓冲区对象绑定到目标
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        // 向缓冲区写入数据
        gl.bufferData(gl.ARRAY_BUFFER, arrData, gl.STATIC_DRAW);
        return {
            buffer,
            location,
            type,
            attribUseSize,
            strip: strip * elementSize,
            offset: offset * elementSize,
        };
    }
    function initPlaneVetexBuffers(gl) {
        var vertices = new Float32Array([
            1.0, 1.0, 0.0, -1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0, // v0-v1-v2-v3 front
        ]);
        var colors = new Float32Array([
            0.32, 0.18, 0.56, 1.0, 0.32, 0.18, 0.56, 1.0, 0.32, 0.18, 0.56, 1.0, 0.32, 0.18, 0.56, 1.0, // v0-v1-v2-v3 front
        ]);
        var texture = new Float32Array([
            1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0
        ]);
        // Indices of the vertices
        const indices = new Uint8Array([
            0, 1, 2, 0, 2, 3, // front
        ]);
        const buffer = gl.createBuffer();
        if (!buffer) {
            throw new Error("create indices buffer err");
        }
        const a_Position = initArrayBuffer(gl, "a_Position", vertices, 3, gl.FLOAT, 3, 0);
        const a_TexCoord = initArrayBuffer(gl, "a_TexCoord", texture, 2, gl.FLOAT, 0, 0);
        const a_Color = initArrayBuffer(gl, "a_Color", colors, 4, gl.FLOAT, 4, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        // Unbind the buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return {
            attribute: {
                a_Position,
                a_TexCoord,
                a_Color,
            },
            index: {
                buffer,
                count: indices.length
            }
        };
    }
    function initCubeVertexBuffers(gl) {
        var vertices = new Float32Array([
            1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
            1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0,
            1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,
            -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
            1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0 // v4-v7-v6-v5 back
        ]);
        var colors = new Float32Array([
            1.0, 0.18, 0.56, 1.0, 0.32, 0.18, 0.56, 1.0, 0.32, 0.18, 0.56, 1.0, 0.32, 0.18, 0.56, 1.0,
            1.0, 0.41, 0.69, 1.0, 0.5, 0.41, 0.69, 1.0, 0.5, 0.41, 0.69, 1.0, 0.5, 0.41, 0.69, 1.0,
            1.0, 0.69, 0.84, 1.0, 0.78, 0.69, 0.84, 1.0, 0.78, 0.69, 0.84, 1.0, 0.78, 0.69, 0.84, 1.0,
            1.0, 0.32, 0.61, 1.0, 0.0, 0.32, 0.61, 1.0, 0.0, 0.32, 0.61, 1.0, 0.0, 0.32, 0.61, 1.0,
            1.0, 0.58, 0.82, 1.0, 0.27, 0.58, 0.82, 1.0, 0.27, 0.58, 0.82, 1.0, 0.27, 0.58, 0.82, 1.0,
            1.0, 0.82, 0.93, 1.0, 0.73, 0.82, 0.93, 1.0, 0.73, 0.82, 0.93, 1.0, 0.73, 0.82, 0.93, 1.0, // v4-v7-v6-v5 back
        ]);
        var texture = new Float32Array([
            0, 0, 0, 1, 1, 1, 1, 0,
            0, 0, 0, 1, 1, 1, 1, 0,
            0, 0, 0, 1, 1, 1, 1, 0,
            0, 0, 0, 1, 1, 1, 1, 0,
            0, 0, 0, 1, 1, 1, 1, 0,
            0, 0, 0, 1, 1, 1, 1, 0,
            0, 0, 0, 1, 1, 1, 1, 0,
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
        const buffer = gl.createBuffer();
        if (!buffer) {
            throw new Error("create indices buffer err");
        }
        const a_Position = initArrayBuffer(gl, "a_Position", vertices, 3, gl.FLOAT, 3, 0);
        const a_TexCoord = initArrayBuffer(gl, "a_TexCoord", texture, 2, gl.FLOAT, 0, 0);
        const a_Color = initArrayBuffer(gl, "a_Color", colors, 4, gl.FLOAT, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        // Unbind the buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return {
            attribute: {
                a_Position,
                a_TexCoord,
                a_Color,
            },
            index: {
                buffer,
                count: indices.length
            }
        };
    }
    function initFrameBufferObj(gl) {
        const depth = gl.createRenderbuffer();
        texture = gl.createTexture();
        frameBufferObj = gl.createFramebuffer();
        function err() {
            console.error("initFrameBufferObj", texture, depth, frameBufferObj);
            texture && gl.deleteTexture(texture);
            depth && gl.deleteRenderbuffer(depth);
            frameBufferObj && gl.deleteFramebuffer(frameBufferObj);
            throw new Error("initFrameBufferObj");
        }
        if (!texture || !depth || !frameBufferObj) {
            err();
        }
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, offsetWidth, offsetHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, offsetWidth, offsetHeight);
        // Attach the texture and the renderbuffer object to the FBO
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBufferObj);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error("Frame buffer object is incomplete");
            err();
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }
    function initAttributeVariable(gl, vertexObj) {
        const { attribute } = vertexObj;
        Object.keys(attribute).forEach(key => {
            if (key.startsWith("a_")) {
                const a = attribute[key];
                gl.bindBuffer(gl.ARRAY_BUFFER, a.buffer);
                gl.vertexAttribPointer(a.location, a.attribUseSize, a.type, false, a.strip, a.offset);
                gl.enableVertexAttribArray(a.location);
            }
        });
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexObj.index.buffer);
        gl.drawElements(gl.TRIANGLES, vertexObj.index.count, gl.UNSIGNED_BYTE, 0);
    }
    function setMatrix(gl) {
        const u_MVPMatrix = gl.getUniformLocation(gl.program, "u_MVPMatrix");
        const m = new Matrix().setRotate(globalSetting.ang, 0, 1, 0);
        const v = new Matrix().setLookAt(eyePosition[0], eyePosition[1], eyePosition[2], 0, 0, 0, 0, 1, 0);
        const p = new Matrix().setPerspective(30, 1, 1.0, 1000);
        v.multiply(p);
        m.multiply(v);
        gl.uniformMatrix4fv(u_MVPMatrix, false, m.originData());
    }
    function drawCube(gl) {
        const u_UseColor = gl.getUniformLocation(gl.program, "u_UseColor");
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBufferObj);
        gl.viewport(0, 0, offsetWidth, offsetHeight);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.clearColor(0.2, 0.2, 0.4, 1.0); // Set clear color (the color is slightly changed)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear FBO
        gl.uniform1f(u_UseColor, 1);
        setMatrix(gl);
        initAttributeVariable(gl, cube);
    }
    function drawPlane(gl) {
        const u_UseColor = gl.getUniformLocation(gl.program, "u_UseColor");
        const u_Sampler = gl.getUniformLocation(gl.program, "u_Sampler");
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        setMatrix(gl);
        // gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(u_Sampler, 0);
        gl.uniform1f(u_UseColor, 0);
        initAttributeVariable(gl, plane);
    }
    function render() {
        const { gl } = globalSetting;
        drawCube(gl);
        drawPlane(gl);
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
    initFrameBufferObj(gl);
    tic();
}
window.addEventListener("load", (e) => {
    main();
});
