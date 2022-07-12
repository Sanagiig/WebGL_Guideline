export class Matrix {
  private val: Float32Array;
  constructor(val?: Float32Array) {
    if (val) {
      if (val.length !== 12) {
        throw new Error("不符合Matrix数据格式");
      }
      this.val = val;
    } else {
      this.val = new Float32Array([
        1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0,
        0.0, 1.0,
      ]);
    }
  }

  dump() {
    return this.val.slice();
  }

  originData() {
    return this.val;
  }

  copy(matrix: Matrix | Float32Array) {
    let data;
    if (matrix instanceof Matrix) {
      data = matrix.originData();
    } else {
      if (matrix.length !== this.val.length) {
        throw new Error(
          `float32Array 长度不匹配 (${matrix.length} !== ${this.val.length})`,
        );
      }

      data = matrix;
    }

    data.forEach((item, idx) => {
      this.val[idx] = item;
    });
    return this;
  }

  setIdentity() {
    for (let i = 0; i < 4; ++i) {
      for (let j = 0; j < 4; ++j) {
        const idx = i * 4 + j;
        this.val[idx] = i === j ? 1 : 0;
      }
    }
    return this;
  }

  setTranslate(x: number, y: number, z: number) {
    this.val[3] = x;
    this.val[7] = y;
    this.val[11] = z;

    return this;
  }

  translate(x: number, y: number, z: number) {
    this.val[3] += x;
    this.val[7] += y;
    this.val[11] += z;

    return this;
  }

  rotate(ang: number) {
    const rad = (ang / 180) * Math.PI;
    const sinA = Math.sin(rad);
    const cosA = Math.cos(rad);
    this.val[0] = cosA;
    this.val[1] = -sinA;
    this.val[4] = sinA;
    this.val[5] = cosA;

    return this;
  }

  setRotateX(rad: number) {
    const e = this.val;
    const s = Math.sin(rad);
    const c = Math.cos(rad);

    e[0] = 1;
    e[1] = 0;
    e[2] = 0;
    e[3] = 0;

    e[4] = 0;
    e[5] = c;
    e[6] = -s;
    e[7] = 0;

    e[8] = 0;
    e[9] = s;
    e[10] = c;
    e[11] = 0;

    e[12] = 0;
    e[13] = 0;
    e[14] = 0;
    e[15] = 1;

    return this;
  }

  setRotateY(rad: number) {
    const e = this.val;
    const s = Math.sin(rad);
    const c = Math.cos(rad);

    e[0] = c;
    e[1] = 0;
    e[2] = s;
    e[3] = 0;

    e[4] = 0;
    e[5] = 1;
    e[6] = 0;
    e[7] = 0;

    e[8] = -s;
    e[9] = 0;
    e[10] = c;
    e[11] = 0;

    e[12] = 0;
    e[13] = 0;
    e[14] = 0;
    e[15] = 1;

    return this;
  }

  setRotateZ(rad: number) {
    const e = this.val;
    const s = Math.sin(rad);
    const c = Math.cos(rad);

    e[0] = c;
    e[1] = -s;
    e[2] = 0;
    e[3] = 0;

    e[4] = s;
    e[5] = c;
    e[6] = 0;
    e[7] = 0;

    e[8] = 0;
    e[9] = 0;
    e[10] = 1;
    e[11] = 0;

    e[12] = 0;
    e[13] = 0;
    e[14] = 0;
    e[15] = 1;
  }

  setRotate(ang: number, x: number = 0, y: number = 0, z: number = 0) {
    const rad = (ang / 180) * Math.PI;
    const onlyOneDirec =
      (x && !(y || z)) || (y && !(z || z)) || (z && !(x || y));

    if (onlyOneDirec) {
      if (x) return this.setRotateX(rad);
      if (y) return this.setRotateY(rad);
      if (z) return this.setRotateZ(rad);
    } else {
      const s = Math.sin(rad);
      const c = Math.cos(rad);

      // Rotation around another axis
      const len = Math.sqrt(x * x + y * y + z * z);
      const e = this.val;

      let rlen, nc, xy, yz, zx, xs, ys, zs;
      if (len !== 1) {
        rlen = 1 / len;
        x *= rlen;
        y *= rlen;
        z *= rlen;
      }
      nc = 1 - c;
      xy = x * y;
      yz = y * z;
      zx = z * x;
      xs = x * s;
      ys = y * s;
      zs = z * s;

      e[0] = x * x * nc + c;
      e[1] = xy * nc + zs;
      e[2] = zx * nc - ys;
      e[3] = 0;

      e[4] = xy * nc - zs;
      e[5] = y * y * nc + c;
      e[6] = yz * nc + xs;
      e[7] = 0;

      e[8] = zx * nc + ys;
      e[9] = yz * nc - xs;
      e[10] = z * z * nc + c;
      e[11] = 0;

      e[12] = 0;
      e[13] = 0;
      e[14] = 0;
      e[15] = 1;
    }
  }

  scale(x: number, y: number, z: number) {
    this.val[0] *= x;
    this.val[5] *= y;
    this.val[10] *= z;

    return this;
  }

  setScale(x: number, y: number, z: number) {
    this.val[0] = x;
    this.val[5] = y;
    this.val[10] = z;
  }

  multiply(refMatrix: Matrix) {
    const curData = this.originData();
    const refData = refMatrix.originData();

    for (let i = 0; i < 4; ++i) {
      // 当前矩阵 idx
      const ci = i * 4;

      // 当前矩阵缓存值
      const c0 = curData[ci];
      const c1 = curData[ci + 1];
      const c2 = curData[ci + 2];
      const c3 = curData[ci + 3];

      for (let j = 0; j < 4; ++j) {
        // 参考矩阵  = j
        curData[ci + j] =
          c0 * refData[j] +
          c1 * refData[j + 4] +
          c2 * refData[j + 8] +
          c3 * refData[j + 12];
      }
    }

    return this;
  }
}
