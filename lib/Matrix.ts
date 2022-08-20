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

  clone(){
    return new Matrix().copy(this);
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


  translate(x: number, y: number, z: number) {
    const e = this.val;
    e[12] += e[0] * x + e[4] * y + e[8] * z;
    e[13] += e[1] * x + e[5] * y + e[9] * z;
    e[14] += e[2] * x + e[6] * y + e[10] * z;
    e[15] += e[3] * x + e[7] * y + e[11] * z;

    return this;
  }

  // translate(x: number, y: number, z: number) {
  //   this.multiply(new Matrix().setTranslate(x,y,z));
  //   return this;
  // }

  setTranslate(x: number, y: number, z: number) {
    var e = this.val;
    e[0] = 1;  e[4] = 0;  e[8]  = 0;  e[12] = x;
    e[1] = 0;  e[5] = 1;  e[9]  = 0;  e[13] = y;
    e[2] = 0;  e[6] = 0;  e[10] = 1;  e[14] = z;
    e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
    return this;
  }

  rotate(ang:number,x:number,y:number,z:number){
    this.concat(new Matrix().setRotate(ang,x,y,z));
    return this;
  }

  setRotateX(rad: number) {
    const e = this.val;
    let s = Math.sin(rad);
    let c = Math.cos(rad);

    if(rad < 0){
      s = -s;
    }

    e[0] = 1;  e[4] = 0;  e[ 8] = 0;  e[12] = 0;
    e[1] = 0;  e[5] = c;  e[ 9] =-s;  e[13] = 0;
    e[2] = 0;  e[6] = s;  e[10] = c;  e[14] = 0;
    e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;

    return this;
  }

  setRotateY(rad: number) {
    const e = this.val;
    let s = Math.sin(rad);
    let c = Math.cos(rad);

    if(rad < 0){
      s = -s;
    }

    e[0] = c;  e[4] = 0;  e[ 8] = s;  e[12] = 0;
    e[1] = 0;  e[5] = 1;  e[ 9] = 0;  e[13] = 0;
    e[2] =-s;  e[6] = 0;  e[10] = c;  e[14] = 0;
    e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;

    return this;
  }

  setRotateZ(rad: number) {
    const e = this.val;
    let s = Math.sin(rad);
    let c = Math.cos(rad);

    if(rad < 0){
      s = -s;
    }

    e[0] = c;  e[4] =-s;  e[ 8] = 0;  e[12] = 0;
    e[1] = s;  e[5] = c;  e[ 9] = 0;  e[13] = 0;
    e[2] = 0;  e[6] = 0;  e[10] = 1;  e[14] = 0;
    e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;

    return this;
  }

  // setRotate(ang: number, x: number = 0, y: number = 0, z: number = 0) {
  //   const rad = (ang / 180) * Math.PI;
  //   const onlyOneDirec =
  //     (x && !(y || z)) || (y && !(x || z)) || (z && !(x || y));

  //   if (onlyOneDirec) {
  //     if (x) return this.setRotateX(rad);
  //     if (y) return this.setRotateY(rad);
  //     if (z) return this.setRotateZ(rad);
  //   } else {
  //     const s = Math.sin(rad);
  //     const c = Math.cos(rad);

  //     // Rotation around another axis
  //     const len = Math.sqrt(x * x + y * y + z * z);
  //     const e = this.val;

  //     let rlen, nc, xy, yz, zx, xs, ys, zs;
  //     if (len !== 1) {
  //       rlen = 1 / len;
  //       x *= rlen;
  //       y *= rlen;
  //       z *= rlen;
  //     }
  //     nc = 1 - c;
  //     xy = x * y;
  //     yz = y * z;
  //     zx = z * x;
  //     xs = x * s;
  //     ys = y * s;
  //     zs = z * s;

  //     e[0] = x * x * nc + c;
  //     e[1] = xy * nc + zs;
  //     e[2] = zx * nc - ys;
  //     e[3] = 0;

  //     e[4] = xy * nc - zs;
  //     e[5] = y * y * nc + c;
  //     e[6] = yz * nc + xs;
  //     e[7] = 0;

  //     e[8] = zx * nc + ys;
  //     e[9] = yz * nc - xs;
  //     e[10] = z * z * nc + c;
  //     e[11] = 0;

  //     e[12] = 0;
  //     e[13] = 0;
  //     e[14] = 0;
  //     e[15] = 1;
  //   }

  //   return this;
  // }

  setRotate(angle: number, x: number = 0, y: number = 0, z: number = 0){
    var e, s, c, len, rlen, nc, xy, yz, zx, xs, ys, zs;

    angle = Math.PI * angle / 180;
    e = this.val;
  
    s = Math.sin(angle);
    c = Math.cos(angle);
  
    if (0 !== x && 0 === y && 0 === z) {
      // Rotation around X axis
      if (x < 0) {
        s = -s;
      }
      e[0] = 1;  e[4] = 0;  e[ 8] = 0;  e[12] = 0;
      e[1] = 0;  e[5] = c;  e[ 9] =-s;  e[13] = 0;
      e[2] = 0;  e[6] = s;  e[10] = c;  e[14] = 0;
      e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
    } else if (0 === x && 0 !== y && 0 === z) {
      // Rotation around Y axis
      if (y < 0) {
        s = -s;
      }
      e[0] = c;  e[4] = 0;  e[ 8] = s;  e[12] = 0;
      e[1] = 0;  e[5] = 1;  e[ 9] = 0;  e[13] = 0;
      e[2] =-s;  e[6] = 0;  e[10] = c;  e[14] = 0;
      e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
    } else if (0 === x && 0 === y && 0 !== z) {
      // Rotation around Z axis
      if (z < 0) {
        s = -s;
      }
      e[0] = c;  e[4] =-s;  e[ 8] = 0;  e[12] = 0;
      e[1] = s;  e[5] = c;  e[ 9] = 0;  e[13] = 0;
      e[2] = 0;  e[6] = 0;  e[10] = 1;  e[14] = 0;
      e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
    } else {
      // Rotation around another axis
      len = Math.sqrt(x*x + y*y + z*z);
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
  
      e[ 0] = x*x*nc +  c;
      e[ 1] = xy *nc + zs;
      e[ 2] = zx *nc - ys;
      e[ 3] = 0;
  
      e[ 4] = xy *nc - zs;
      e[ 5] = y*y*nc +  c;
      e[ 6] = yz *nc + xs;
      e[ 7] = 0;
  
      e[ 8] = zx *nc + ys;
      e[ 9] = yz *nc - xs;
      e[10] = z*z*nc +  c;
      e[11] = 0;
  
      e[12] = 0;
      e[13] = 0;
      e[14] = 0;
      e[15] = 1;
    }
  
    return this;
  }

  scale(x: number, y: number, z: number) {
    var e = this.val;
    e[0] *= x;  e[4] *= y;  e[8]  *= z;
    e[1] *= x;  e[5] *= y;  e[9]  *= z;
    e[2] *= x;  e[6] *= y;  e[10] *= z;
    e[3] *= x;  e[7] *= y;  e[11] *= z;
    return this;
  }

  setScale(x: number, y: number, z: number) {
    this.val[0] = x;
    this.val[5] = y;
    this.val[10] = z;
  }

  lookAt(eyeX: number,
    eyeY: number,
    eyeZ: number,
    centerX: number,
    centerY: number,
    centerZ: number,
    upX: number,
    upY: number,
    upZ: number,){
    return this.concat(new Matrix().setLookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ));
  }

  setLookAt(
    eyeX: number,
    eyeY: number,
    eyeZ: number,
    centerX: number,
    centerY: number,
    centerZ: number,
    upX: number,
    upY: number,
    upZ: number,
  ) {
    var e, fx, fy, fz, rlf, sx, sy, sz, rls, ux, uy, uz;

    fx = centerX - eyeX;
    fy = centerY - eyeY;
    fz = centerZ - eyeZ;
  
    // Normalize f.
    rlf = 1 / Math.sqrt(fx*fx + fy*fy + fz*fz);
    fx *= rlf;
    fy *= rlf;
    fz *= rlf;
  
    // Calculate cross product of f and up.
    sx = fy * upZ - fz * upY;
    sy = fz * upX - fx * upZ;
    sz = fx * upY - fy * upX;
  
    // Normalize s.
    rls = 1 / Math.sqrt(sx*sx + sy*sy + sz*sz);
    sx *= rls;
    sy *= rls;
    sz *= rls;
  
    // Calculate cross product of s and f.
    ux = sy * fz - sz * fy;
    uy = sz * fx - sx * fz;
    uz = sx * fy - sy * fx;
  
    // Set to this.
    e = this.val;
    e[0] = sx;
    e[1] = ux;
    e[2] = -fx;
    e[3] = 0;
  
    e[4] = sy;
    e[5] = uy;
    e[6] = -fy;
    e[7] = 0;
  
    e[8] = sz;
    e[9] = uz;
    e[10] = -fz;
    e[11] = 0;
  
    e[12] = 0;
    e[13] = 0;
    e[14] = 0;
    e[15] = 1;
  
    // Translate.
    return this.translate(-eyeX, -eyeY, -eyeZ);
  }

  setPerspective(fovy: number, aspect: number, near: number, far: number) {
    var e, rd, s, ct;

    if (near === far || aspect === 0) {
      throw 'null frustum';
    }
    if (near <= 0) {
      throw 'near <= 0';
    }
    if (far <= 0) {
      throw 'far <= 0';
    }
  
    fovy = Math.PI * fovy / 180 / 2;
    s = Math.sin(fovy);
    if (s === 0) {
      throw 'null frustum';
    }
  
    rd = 1 / (far - near);
    ct = Math.cos(fovy) / s;
  
    e = this.val;
  
    e[0]  = ct / aspect;
    e[1]  = 0;
    e[2]  = 0;
    e[3]  = 0;
  
    e[4]  = 0;
    e[5]  = ct;
    e[6]  = 0;
    e[7]  = 0;
  
    e[8]  = 0;
    e[9]  = 0;
    e[10] = -(far + near) * rd;
    e[11] = -1;
  
    e[12] = 0;
    e[13] = 0;
    e[14] = -2 * near * far * rd;
    e[15] = 0;
  
    return this;
  }

  invert() {
    return this.setInverseOf(this);
  };

  /**
   * Calculate the inverse matrix of specified matrix, and set to this.
   * @param other The source matrix
   * @return this
   */
  setInverseOf(other:Matrix) {
    var i, s, d, inv, det;

    s = other.val;
    d = this.val;
    inv = new Float32Array(16);

    inv[0]  =   s[5]*s[10]*s[15] - s[5] *s[11]*s[14] - s[9] *s[6]*s[15]
              + s[9]*s[7] *s[14] + s[13]*s[6] *s[11] - s[13]*s[7]*s[10];
    inv[4]  = - s[4]*s[10]*s[15] + s[4] *s[11]*s[14] + s[8] *s[6]*s[15]
              - s[8]*s[7] *s[14] - s[12]*s[6] *s[11] + s[12]*s[7]*s[10];
    inv[8]  =   s[4]*s[9] *s[15] - s[4] *s[11]*s[13] - s[8] *s[5]*s[15]
              + s[8]*s[7] *s[13] + s[12]*s[5] *s[11] - s[12]*s[7]*s[9];
    inv[12] = - s[4]*s[9] *s[14] + s[4] *s[10]*s[13] + s[8] *s[5]*s[14]
              - s[8]*s[6] *s[13] - s[12]*s[5] *s[10] + s[12]*s[6]*s[9];

    inv[1]  = - s[1]*s[10]*s[15] + s[1] *s[11]*s[14] + s[9] *s[2]*s[15]
              - s[9]*s[3] *s[14] - s[13]*s[2] *s[11] + s[13]*s[3]*s[10];
    inv[5]  =   s[0]*s[10]*s[15] - s[0] *s[11]*s[14] - s[8] *s[2]*s[15]
              + s[8]*s[3] *s[14] + s[12]*s[2] *s[11] - s[12]*s[3]*s[10];
    inv[9]  = - s[0]*s[9] *s[15] + s[0] *s[11]*s[13] + s[8] *s[1]*s[15]
              - s[8]*s[3] *s[13] - s[12]*s[1] *s[11] + s[12]*s[3]*s[9];
    inv[13] =   s[0]*s[9] *s[14] - s[0] *s[10]*s[13] - s[8] *s[1]*s[14]
              + s[8]*s[2] *s[13] + s[12]*s[1] *s[10] - s[12]*s[2]*s[9];

    inv[2]  =   s[1]*s[6]*s[15] - s[1] *s[7]*s[14] - s[5] *s[2]*s[15]
              + s[5]*s[3]*s[14] + s[13]*s[2]*s[7]  - s[13]*s[3]*s[6];
    inv[6]  = - s[0]*s[6]*s[15] + s[0] *s[7]*s[14] + s[4] *s[2]*s[15]
              - s[4]*s[3]*s[14] - s[12]*s[2]*s[7]  + s[12]*s[3]*s[6];
    inv[10] =   s[0]*s[5]*s[15] - s[0] *s[7]*s[13] - s[4] *s[1]*s[15]
              + s[4]*s[3]*s[13] + s[12]*s[1]*s[7]  - s[12]*s[3]*s[5];
    inv[14] = - s[0]*s[5]*s[14] + s[0] *s[6]*s[13] + s[4] *s[1]*s[14]
              - s[4]*s[2]*s[13] - s[12]*s[1]*s[6]  + s[12]*s[2]*s[5];

    inv[3]  = - s[1]*s[6]*s[11] + s[1]*s[7]*s[10] + s[5]*s[2]*s[11]
              - s[5]*s[3]*s[10] - s[9]*s[2]*s[7]  + s[9]*s[3]*s[6];
    inv[7]  =   s[0]*s[6]*s[11] - s[0]*s[7]*s[10] - s[4]*s[2]*s[11]
              + s[4]*s[3]*s[10] + s[8]*s[2]*s[7]  - s[8]*s[3]*s[6];
    inv[11] = - s[0]*s[5]*s[11] + s[0]*s[7]*s[9]  + s[4]*s[1]*s[11]
              - s[4]*s[3]*s[9]  - s[8]*s[1]*s[7]  + s[8]*s[3]*s[5];
    inv[15] =   s[0]*s[5]*s[10] - s[0]*s[6]*s[9]  - s[4]*s[1]*s[10]
              + s[4]*s[2]*s[9]  + s[8]*s[1]*s[6]  - s[8]*s[2]*s[5];

    det = s[0]*inv[0] + s[1]*inv[4] + s[2]*inv[8] + s[3]*inv[12];
    if (det === 0) {
      return this;
    }

    det = 1 / det;
    for (i = 0; i < 16; i++) {
      d[i] = inv[i] * det;
    }

    return this;
  };

  transpose() {
    var e, t;

    e = this.val;

    t = e[ 1];  e[ 1] = e[ 4];  e[ 4] = t;
    t = e[ 2];  e[ 2] = e[ 8];  e[ 8] = t;
    t = e[ 3];  e[ 3] = e[12];  e[12] = t;
    t = e[ 6];  e[ 6] = e[ 9];  e[ 9] = t;
    t = e[ 7];  e[ 7] = e[13];  e[13] = t;
    t = e[11];  e[11] = e[14];  e[14] = t;

    return this;
  };

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

  multiplyVector3(vec:Vector3){
    var e = this.val;
    var p = vec.val;
    var v = new Vector3();
    var result = v.val;

    result[0] = p[0] * e[0] + p[1] * e[4] + p[2] * e[ 8] + e[11];
    result[1] = p[0] * e[1] + p[1] * e[5] + p[2] * e[ 9] + e[12];
    result[2] = p[0] * e[2] + p[1] * e[6] + p[2] * e[10] + e[13];

    return v;
  }

  concat(other:Matrix) {
    var i, e, a, b, ai0, ai1, ai2, ai3;
    
    // Calculate e = a * b
    e = this.val;
    a = this.val;
    b = other.originData();
    
    // If e equals b, copy b to temporary matrix.
    if (e === b) {
      b = new Float32Array(16);
      for (i = 0; i < 16; ++i) {
        b[i] = e[i];
      }
    }
    
    for (i = 0; i < 4; i++) {
      ai0=a[i];  ai1=a[i+4];  ai2=a[i+8];  ai3=a[i+12];
      e[i]    = ai0 * b[0]  + ai1 * b[1]  + ai2 * b[2]  + ai3 * b[3];
      e[i+4]  = ai0 * b[4]  + ai1 * b[5]  + ai2 * b[6]  + ai3 * b[7];
      e[i+8]  = ai0 * b[8]  + ai1 * b[9]  + ai2 * b[10] + ai3 * b[11];
      e[i+12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
    }
    
    return this;
  };
}

export class Vector3{
  val:Float32Array;
  constructor([x = 1,y = 1,z = 1]:number[] | Float32Array = []){
    this.val = new Float32Array([x,y,z]);
  }

  multiply(n:number){
    this.val[0] *= n;
    this.val[1] *= n;
    this.val[2] *= n;
    return this;
  }

  multiplyMatrix(m:Matrix){
    const {val} = this;
    const mv = m.originData();
    let x = val[0],y = val[1] , z = val[2],w = 1;
    for(let i=0;i<val.length;++i){
      const mi = i * 4;
      val[i] = x * mv[mi] + y * mv[mi + 1] + z * mv[mi + 2];
    }
    return this;
  }

  normalize() {
    var v = this.val;
    var c = v[0], d = v[1], e = v[2], g = Math.sqrt(c*c+d*d+e*e);
    if(g){
      if(g == 1)
          return this;
     } else {
       v[0] = 0; v[1] = 0; v[2] = 0;
       return this;
     }
     g = 1/g;
     v[0] = c*g; v[1] = d*g; v[2] = e*g;
     return this;
  };
}