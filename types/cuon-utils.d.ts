declare function initShaders(
  gl: WebGLRenderingContext,
  vshader: string,
  fshader: string,
): boolean;

declare function createProgram(
  gl: WebGLRenderingContext,
  vshader: string,
  fshader: string,
): WebGLProgram;
