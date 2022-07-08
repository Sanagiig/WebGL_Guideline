"use strict";
function main() {
    let canvas = document.getElementById("webgl");
    let gl = getWebGLContext(canvas);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    console.log("load");
}
window.addEventListener("load", (e) => {
    main();
});
