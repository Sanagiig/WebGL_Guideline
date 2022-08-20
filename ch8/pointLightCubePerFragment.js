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
      attribute vec4 a_Normal;
      
      uniform mat4 u_ModelMatrix;
      uniform mat4 u_MVPMatrix;

      varying vec4 v_Position;
      varying vec4 v_Color;
      varying vec4 v_Normal;
      void main(){
        gl_Position =  u_MVPMatrix * a_Position;
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

      uniform vec3 u_LightColor;
      uniform vec3 u_LightDirection;
      uniform vec3 u_PointLightColor;
      uniform vec3 u_PointLightPosition;
      uniform vec3 u_Ambient;

      
      uniform mat4 u_ViewMatrix;
      uniform mat4 u_ProjectionMatrix;
      uniform mat4 u_NormalMatrix;

      varying vec4 v_Position;
      varying vec4 v_Color;
      varying vec4 v_Normal;
      void main(){
        vec3 ambient = u_Ambient * v_Color.rgb;
        vec3 normal = normalize(vec3(u_NormalMatrix * v_Normal));

        vec3 lightDirection = normalize(u_LightDirection);
        vec3 pointLightDirection = normalize(u_PointLightPosition - v_Position.xyz);

        // 平行光线和法向量的点积
        float directDot = max(dot(lightDirection ,normal),0.0);
        // 点光源和法向量的点积
        float pointDot = max(dot(pointLightDirection ,normal),0.0);
        // 计算漫反射光的颜色
        vec3 diffuse = ( u_PointLightColor * pointDot) * v_Color.rgb;
        
        gl_FragColor = vec4(diffuse + ambient,v_Color.a);
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
            1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
            1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0,
            1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,
            -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
            1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0 // v4-v7-v6-v5 back
        ]);
        const colors = new Float32Array([
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0 // v4-v7-v6-v5 back
        ]);
        const normals = new Float32Array([
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0 // v4-v7-v6-v5 back
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
        initArrayBuffer(gl, "a_Position", vertices, 3, gl.FLOAT, 3, 0);
        initArrayBuffer(gl, "a_Color", colors, 3, gl.FLOAT, 3, 0);
        initArrayBuffer(gl, "a_Normal", normals, 3, gl.FLOAT, 3, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        return indices.length;
    }
    function setLight(gl) {
        const u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
        const u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
        const u_PointLightColor = gl.getUniformLocation(gl.program, 'u_PointLightColor');
        const u_PointLightPosition = gl.getUniformLocation(gl.program, 'u_PointLightPosition');
        const u_Ambient = gl.getUniformLocation(gl.program, 'u_Ambient');
        gl.uniform3f(u_LightColor, 0.3, 0.3, 1.0);
        gl.uniform3f(u_LightDirection, 15.0, 18.0, 4.0);
        gl.uniform3f(u_PointLightColor, 1, 1, 1);
        gl.uniform3f(u_PointLightPosition, 0, 1.2, 1.2);
        gl.uniform3f(u_Ambient, 0.2, 0.2, 0.2);
    }
    function setMatrix(gl) {
        const u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
        const u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
        const u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
        const u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
        const u_MVPMatrix = gl.getUniformLocation(gl.program, 'u_MVPMatrix');
        const m = new Matrix();
        const v = new Matrix();
        const p = new Matrix();
        const n = new Matrix();
        const mvp = new Matrix();
        m.setRotate(globalSetting.ang, 0, 1, 0);
        v.setLookAt(0, 5, 7, 0, 0, 0, 0, 1, 0);
        p.setPerspective(30, 1, 1, 100);
        n.setInverseOf(m).transpose();
        mvp.multiply(m).multiply(v).multiply(p);
        gl.uniformMatrix4fv(u_ModelMatrix, false, m.originData());
        gl.uniformMatrix4fv(u_ViewMatrix, false, v.originData());
        gl.uniformMatrix4fv(u_ProjectionMatrix, false, p.originData());
        gl.uniformMatrix4fv(u_NormalMatrix, false, n.originData());
        gl.uniformMatrix4fv(u_MVPMatrix, false, mvp.originData());
    }
    function render() {
        const { gl } = globalSetting;
        const n = initVetexBuffers(gl);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        setLight(gl);
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
