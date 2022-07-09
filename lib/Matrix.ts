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

  setTransform(x: number, y: number, z: number) {
    this.val[3] = x;
    this.val[7] = y;
    this.val[11] = z;

    return this;
  }

  transform(x: number, y: number, z: number) {
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

  scale(num: number) {
    this.val[0] *= num;
    this.val[5] *= num;
    this.val[10] *= num;

    return this;
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

      for(let j=0;j<4;++j){
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
