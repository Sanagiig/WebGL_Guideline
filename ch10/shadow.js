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

    uniform mat4 u_MvpMatrix;
    uniform mat4 u_MvpMatrixFromLight;

    varying vec4 v_PositionFromLight;
    varying vec4 v_Color;

    void main(){
      gl_Position =   u_MvpMatrix * a_Position;
      v_PositionFromLight = u_MvpMatrixFromLight * a_Position;
      v_Color = a_Color;
    }
    `;
    }
    function getFShaderSource() {
        return `
      #ifdef GL_ES
      precision mediump float;
      #endif
      
      uniform sampler2D u_ShadowMap;

      varying vec4 v_PositionFromLight;
      varying vec4 v_Color;

      float unpackDepth(const in vec4 rgbaDepth) {
        const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));
        float depth = dot(rgbaDepth, bitShift); 
        return depth;
      }

      void main(){
        vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;
        vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);
        float depth = unpackDepth(rgbaDepth);
        float visibility = (shadowCoord.z > depth + 0.05) ? 0.7 : 1.0;
        gl_FragColor = vec4(v_PositionFromLight.xyz, v_Color.a);
      }
    `;
    }
    function getVShaderShadowSource() {
        return `
      attribute vec4 a_Position;
      uniform mat4 u_MvpMatrix;
      void main(){
        gl_Position = u_MvpMatrix * a_Position;
      }
    `;
    }
    function getFShaderShadowSource() {
        return `
      #ifdef GL_ES
      precision mediump float;
      #endif
      void main(){
        vec4 bitShift = vec4(1.0,256.0,256.0*256.0, 256.0*256.0 * 256.0);
        const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);
        vec4 rgbaDepth = fract(gl_FragCoord.z * bitShift);
        rgbaDepth -= rgbaDepth.gbaa * bitMask;
        gl_FragColor = rgbaDepth;
      }
    `;
    }
    function initGL(gl) {
        globalSetting.gl = gl;
        gl.clearColor(0.3, 0.3, 0.3, 1.0);
        gl.enable(gl.DEPTH_TEST);
    }
    function initArrayBuffer(gl, program, attribName, arrData, attribUseSize, type, strip, offset) {
        const elementSize = arrData.BYTES_PER_ELEMENT;
        const buffer = gl.createBuffer();
        const location = gl.getAttribLocation(program, attribName);
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
    function initTriangleVetexBuffers(gl, program, isShadow = false) {
        // Vertex coordinates
        var vertices = new Float32Array([
            1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
            1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0,
            1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,
            -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
            1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0 // v4-v7-v6-v5 back
        ]);
        // Colors
        var colors = new Float32Array([
            1.0, 0.18, 0.56, 1.0, 0.32, 0.18, 0.56, 1.0, 0.32, 0.18, 0.56, 1.0, 0.32, 0.18, 0.56, 1.0,
            1.0, 0.41, 0.69, 1.0, 0.5, 0.41, 0.69, 1.0, 0.5, 0.41, 0.69, 1.0, 0.5, 0.41, 0.69, 1.0,
            1.0, 0.69, 0.84, 1.0, 0.78, 0.69, 0.84, 1.0, 0.78, 0.69, 0.84, 1.0, 0.78, 0.69, 0.84, 1.0,
            1.0, 0.32, 0.61, 1.0, 0.0, 0.32, 0.61, 1.0, 0.0, 0.32, 0.61, 1.0, 0.0, 0.32, 0.61, 1.0,
            1.0, 0.58, 0.82, 1.0, 0.27, 0.58, 0.82, 1.0, 0.27, 0.58, 0.82, 1.0, 0.27, 0.58, 0.82, 1.0,
            1.0, 0.82, 0.93, 1.0, 0.73, 0.82, 0.93, 1.0, 0.73, 0.82, 0.93, 1.0, 0.73, 0.82, 0.93, 1.0, // v4-v7-v6-v5 back
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
        const a_Position = initArrayBuffer(gl, program, "a_Position", vertices, 3, gl.FLOAT, 0, 0);
        const a_Color = isShadow
            ? null
            : initArrayBuffer(gl, program, "a_Color", colors, 3, gl.FLOAT, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        // Unbind the buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return {
            attribute: {
                a_Position,
                a_Color,
            },
            index: {
                buffer,
                count: indices.length,
            },
        };
    }
    function initPlaneVertexBuffers(gl, program, isShadow = false) {
        // Vertex coordinates
        var vertices = new Float32Array([
            3.0,
            -1.7,
            2.5,
            -3.0,
            -1.7,
            2.5,
            -3.0,
            -1.7,
            -2.5,
            3.0,
            -1.7,
            -2.5, // v0-v1-v2-v3
        ]);
        // Colors
        var colors = new Float32Array([
            1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
        ]);
        // Indices of the vertices
        var indices = new Uint8Array([0, 1, 2, 0, 2, 3]);
        const buffer = gl.createBuffer();
        if (!buffer) {
            throw new Error("create indices buffer err");
        }
        const a_Position = initArrayBuffer(gl, program, "a_Position", vertices, 3, gl.FLOAT, 3, 0);
        const a_Color = isShadow
            ? null
            : initArrayBuffer(gl, program, "a_Color", colors, 3, gl.FLOAT, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        // Unbind the buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return {
            attribute: {
                a_Position,
                a_Color,
            },
            index: {
                buffer,
                count: indices.length,
            },
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
        Object.keys(attribute).forEach((key) => {
            if (key.startsWith("a_")) {
                const a = attribute[key];
                if (a) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, a.buffer);
                    gl.vertexAttribPointer(a.location, a.attribUseSize, a.type, false, a.strip, a.offset);
                    gl.enableVertexAttribArray(a.location);
                }
            }
        });
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexObj.index.buffer);
        gl.drawElements(gl.TRIANGLES, vertexObj.index.count, gl.UNSIGNED_BYTE, 0);
    }
    function drawTriangle(gl, triangle, uniformLocation, vpMatrix, hasShadow = false) {
        globalModelMatrix.setRotate(globalSetting.ang, 0, 1, 0).translate(2, 5, 0).scale(0.5, 0.5, 0.5);
        if (hasShadow) {
            gl.uniformMatrix4fv(u_MvpMatrixFromLight, false, globalModelMatrix
                .clone()
                .multiply(viewProjFromLightMatrix)
                .originData());
        }
        gl.uniformMatrix4fv(uniformLocation, false, globalModelMatrix.multiply(vpMatrix).originData());
        initAttributeVariable(gl, triangle);
    }
    function drawPlane(gl, plane, uniformLocation, vpMatrix, hasShadow = false) {
        globalModelMatrix.setIdentity().setRotate(-45, 0, 1, 1).rotate(globalSetting.ang, 0, 1, 0).translate(2, 0, 0);
        if (hasShadow) {
            gl.uniformMatrix4fv(u_MvpMatrixFromLight, false, globalModelMatrix
                .clone()
                .multiply(viewProjFromLightMatrix)
                .originData());
        }
        gl.uniformMatrix4fv(uniformLocation, false, globalModelMatrix.multiply(vpMatrix).originData());
        initAttributeVariable(gl, plane);
    }
    function drawShadow(gl) {
        gl.useProgram(shadowProgram);
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBufferObj);
        gl.viewport(0, 0, offsetWidth, offsetHeight);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.clearColor(0, 0, 0, 1.0); // Set clear color (the color is slightly changed)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear FBO
        drawTriangle(gl, shadowTriangle, shadow_u_MvpMatrix, viewProjFromLightMatrix);
        drawPlane(gl, shadowPlane, shadow_u_MvpMatrix, viewProjFromLightMatrix);
    }
    function draw(gl) {
        gl.useProgram(normalProgram);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(u_ShadowMap, 0);
        drawTriangle(gl, triangle, u_MvpMatrix, viewProjMatrix, true);
        drawPlane(gl, plane, u_MvpMatrix, viewProjMatrix, true);
    }
    function render() {
        const { gl } = globalSetting;
        drawShadow(gl);
        draw(gl);
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
    let canvas = document.getElementById("webgl");
    let gl = getWebGLContext(canvas);
    const shadowProgram = createProgram(gl, getVShaderShadowSource(), getFShaderShadowSource());
    const normalProgram = createProgram(gl, getVShaderSource(), getFShaderSource());
    const shadowTriangle = initTriangleVetexBuffers(gl, shadowProgram, true);
    const shadowPlane = initPlaneVertexBuffers(gl, shadowProgram, true);
    const triangle = initTriangleVetexBuffers(gl, normalProgram);
    const plane = initPlaneVertexBuffers(gl, normalProgram);
    let lightPosition = [0, 10, 2];
    let eyePosition = [0.0, 14.0, 9.0];
    let frameBufferObj;
    let texture;
    const offsetWidth = 2048;
    const offsetHeight = 2048;
    const viewProjFromLightMatrix = new Matrix()
        .setPerspective(70, offsetWidth / offsetHeight, 1.0, 1000)
        .lookAt(lightPosition[0], lightPosition[1], lightPosition[2], 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
    const viewProjMatrix = new Matrix()
        .setPerspective(45, canvas.width / canvas.height, 1.0, 1000.0)
        .lookAt(eyePosition[0], eyePosition[1], eyePosition[2], 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
    const globalModelMatrix = new Matrix();
    const shadow_u_MvpMatrix = gl.getUniformLocation(shadowProgram, "u_MvpMatrix");
    const u_MvpMatrix = gl.getUniformLocation(normalProgram, "u_MvpMatrix");
    const u_MvpMatrixFromLight = gl.getUniformLocation(normalProgram, "u_MvpMatrixFromLight");
    const u_ShadowMap = gl.getUniformLocation(normalProgram, "u_ShadowMap");
    initGL(gl);
    initFrameBufferObj(gl);
    tic();
}
window.addEventListener("load", (e) => {
    main();
});
