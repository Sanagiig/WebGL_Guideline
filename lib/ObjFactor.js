import { Vector3 } from "../lib/Matrix.js";
function calcNormal(p0, p1, p2) {
    // v0: a vector from p1 to p0, v1; a vector from p1 to p2
    var v0 = new Float32Array(3);
    var v1 = new Float32Array(3);
    for (var i = 0; i < 3; i++) {
        v0[i] = p0[i] - p1[i];
        v1[i] = p2[i] - p1[i];
    }
    // The cross product of v0 and v1
    var c = new Float32Array(3);
    c[0] = v0[1] * v1[2] - v0[2] * v1[1];
    c[1] = v0[2] * v1[0] - v0[0] * v1[2];
    c[2] = v0[0] * v1[1] - v0[1] * v1[0];
    // Normalize the result
    var v = new Vector3(c);
    v.normalize();
    return new Normal(v.val[0], v.val[1], v.val[2]);
}
class Loader {
    constructor() {
        this.request = new XMLHttpRequest();
    }
    start(url) {
        const { request } = this;
        if (this.async) {
            throw new Error("重复启动");
        }
        this.request.open("get", url);
        this.request.send();
        return (this.async = new Promise((resolve, reject) => {
            this.request.onreadystatechange = () => {
                if (request.readyState !== 4)
                    return;
                if (request.status >= 200 || request.status <= 400) {
                    resolve(request.responseText);
                }
                else {
                    reject(`${request.status} : ${request.responseText || "error"}`);
                }
            };
        }));
    }
    onloadend(text) {
        console.log("loaded");
    }
}
class ObjLineParser {
    constructor(str, index = 0) {
        this.str = str;
        this.index = index;
    }
    getStr() {
        return this.str;
    }
    getIndex() {
        return this.index;
    }
    init(str, index = 0) {
        this.str = str;
        this.index = index;
    }
    getDelimitersOffset() {
        const { str, index } = this;
        let i = 0, len = str.length;
        for (i = index, len = str.length; i < len; i++) {
            var c = str.charAt(i);
            if (c == "\t" || c == " " || c == "(" || c == ")" || c == '"')
                continue;
            break;
        }
        return i - index;
    }
    skipDelimiters() {
        this.index += this.getDelimitersOffset();
        return this;
    }
    getWordLen() {
        const { str, index } = this;
        let i = 0, len = str.length;
        for (i = index; i < len; i++) {
            var c = str.charAt(i);
            if (c == "\t" || c == " " || c == "(" || c == ")" || c == '"')
                break;
        }
        return i - index;
    }
    getWord() {
        const n = this.skipDelimiters().getWordLen();
        const word = this.str.substring(this.index, this.index + n);
        this.index += n;
        return word;
    }
    getInt() {
        return parseInt(this.getWord());
    }
    getFloat() {
        return parseFloat(this.getWord());
    }
}
// Material Object
class Material {
    constructor(name, r, g, b, a) {
        this.name = name;
        this.color = new Color(r, g, b, a);
    }
}
// Vertex Object
class Vertex {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
// Normal Object
class Normal {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
// Color Object
class Color {
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}
// face
class ObjFace {
    constructor(materialName = "", vIndices = new Array(0), nIndices = new Array(0), numIndices = 0) {
        this.materialName = materialName;
        this.vIndices = vIndices;
        this.nIndices = nIndices;
        this.numIndices = numIndices;
    }
}
// model
class ObjModel {
    constructor(name, faces = new Array(0), numIndices = 0) {
        this.name = name;
        this.faces = faces;
        this.numIndices = numIndices;
    }
    addFace(face) {
        this.faces.push(face);
        this.numIndices += face.numIndices;
    }
}
export class ObjModelFactor extends Loader {
    constructor(url, models = new Array(0), vertices = new Array(0), normals = new Array(0), mtls = new Array(0)) {
        super();
        this.url = url;
        this.models = models;
        this.vertices = vertices;
        this.normals = normals;
        this.mtls = mtls;
        this.tasks = [];
        this.currentMaterialName = "";
    }
    empty() {
        Object.getOwnPropertyNames(this).forEach((k) => {
            if (typeof this[k] === "string") {
                this[k] = "";
            }
            else if (typeof this[k] === "object") {
                this[k] = this[k].length
                    ? new Array(0)
                    : Object.create(null);
            }
        });
    }
    loadAndParse() {
        return this.start(this.url)
            .then((text) => {
            this.parse(text);
        })
            .then(() => this.finish());
    }
    parseModel(olp) {
        this.currentModel = new ObjModel(olp.getWord() || "");
        this.models.push(this.currentModel);
        return this;
    }
    parseMtllib(olp) {
        const task = new Loader().start(olp.getWord()).then((file) => {
            const lines = file.split("\n");
            let index = 0;
            let line;
            let materialName;
            lines.push(null);
            while ((line = lines[index++]) !== null) {
                const molp = new ObjLineParser(line);
                const command = molp.getWord();
                switch (command) {
                    case "#":
                        continue; // Skip comments
                    case "newmtl": // Read Material chunk
                        materialName = molp.getWord(); // Get name
                        continue; // Go to the next line
                    case "Kd": // Read normal
                        if (materialName) {
                            this.mtls.push(new Material(materialName, molp.getFloat(), molp.getFloat(), molp.getFloat(), molp.getFloat() || 1.0));
                        }
                        continue; // Go to the next line
                }
            }
        });
        this.tasks.push(task);
        return this;
    }
    parseVertex(olp) {
        const vertex = new Vertex(olp.getFloat(), olp.getFloat(), olp.getFloat());
        this.vertices.push(vertex);
        return this;
    }
    parseNormal(olp) {
        const normal = new Normal(olp.getFloat(), olp.getFloat(), olp.getFloat());
        this.normals.push(normal);
        return this;
    }
    parseMaterial(olp) {
        this.currentMaterialName = olp.getWord();
        return this;
    }
    parseFace(olp) {
        var _a;
        const { vertices, currentMaterialName } = this;
        const face = new ObjFace(currentMaterialName);
        let word;
        while ((word = olp.getWord())) {
            const subWords = word.split("/");
            // v index
            subWords.length >= 1 && face.vIndices.push(parseInt(subWords[0]) - 1);
            // n index
            (subWords.length >= 3 && face.nIndices.push(parseInt(subWords[2]) - 1)) ||
                face.nIndices.push(-1);
        }
        // calc normal
        const v0 = [
            vertices[face.vIndices[0]].x,
            vertices[face.vIndices[0]].y,
            vertices[face.vIndices[0]].z,
        ];
        const v1 = [
            vertices[face.vIndices[1]].x,
            vertices[face.vIndices[1]].y,
            vertices[face.vIndices[1]].z,
        ];
        const v2 = [
            vertices[face.vIndices[2]].x,
            vertices[face.vIndices[2]].y,
            vertices[face.vIndices[2]].z,
        ];
        face.normal = calcNormal(v0, v1, v2);
        // Devide to triangles if face contains over 3 points.
        if (face.vIndices.length > 3) {
            var n = face.vIndices.length - 2;
            var newVIndices = new Array(n * 3);
            var newNIndices = new Array(n * 3);
            for (var i = 0; i < n; i++) {
                newVIndices[i * 3 + 0] = face.vIndices[0];
                newVIndices[i * 3 + 1] = face.vIndices[i + 1];
                newVIndices[i * 3 + 2] = face.vIndices[i + 2];
                newNIndices[i * 3 + 0] = face.nIndices[0];
                newNIndices[i * 3 + 1] = face.nIndices[i + 1];
                newNIndices[i * 3 + 2] = face.nIndices[i + 2];
            }
            face.vIndices = newVIndices;
            face.nIndices = newNIndices;
        }
        face.numIndices = face.vIndices.length;
        (_a = this.currentModel) === null || _a === void 0 ? void 0 : _a.addFace(face);
        return this;
    }
    parse(text) {
        const lines = text.split("\n");
        let olp = null;
        let command;
        let index = 0;
        let line;
        this.currentMaterialName = "";
        this.currentModel = undefined;
        try {
            while ((line = lines[index++])) {
                olp = new ObjLineParser(line);
                command = olp.getWord();
                if (command == null)
                    continue;
                switch (command) {
                    // Skip comments
                    case "#":
                        continue;
                    case "mtllib":
                        this.parseMtllib(olp);
                        continue;
                    case "o":
                    case "g": // Read Object name
                        this.parseModel(olp);
                        continue;
                    case "v": // Read vertex
                        this.parseVertex(olp);
                        continue;
                    case "vn": // Read vertex
                        this.parseNormal(olp);
                        continue;
                    case "usemtl": // Read material
                        this.parseMaterial(olp);
                        continue;
                    case "f": // face
                        this.parseFace(olp);
                        continue;
                }
            }
        }
        catch (e) {
            console.error(`parse err in :\n row: ${index} , col: ${olp === null || olp === void 0 ? void 0 : olp.getIndex()} \n`, line);
            throw e;
        }
        return this;
    }
    getMaterialColor(name) {
        var _a;
        return (((_a = this.mtls.find((item) => item.name === name)) === null || _a === void 0 ? void 0 : _a.color) ||
            new Color(0.8, 0.8, 0.8, 1));
    }
    dumpModelBufferData() {
        const numIndices = this.models.reduce((acc, cur) => {
            return acc + cur.numIndices;
        }, 0);
        const positions = new Float32Array(numIndices * 3);
        const normals = new Float32Array(numIndices * 3);
        const colors = new Float32Array(numIndices * 4);
        const indices = new Uint32Array(numIndices);
        let idx = 0;
        for (let i = 0; i < this.models.length; ++i) {
            const curModel = this.models[i];
            for (let j = 0; j < curModel.faces.length; ++j) {
                const curFace = curModel.faces[j];
                const faceNormal = curFace.normal;
                const color = this.getMaterialColor(curFace.materialName);
                for (let k = 0; k < curFace.vIndices.length; ++k) {
                    const vIndex = curFace.vIndices[k];
                    const nIndex = curFace.nIndices[k];
                    const vertex = this.vertices[vIndex];
                    const normal = this.normals[nIndex];
                    indices[idx] = idx;
                    positions[idx * 3] = vertex.x;
                    positions[idx * 3 + 1] = vertex.y;
                    positions[idx * 3 + 2] = vertex.z;
                    colors[idx * 4] = color.r;
                    colors[idx * 4 + 1] = color.g;
                    colors[idx * 4 + 2] = color.b;
                    colors[idx * 4 + 3] = color.a;
                    if (!normal) {
                        normals[idx * 3] = faceNormal.x;
                        normals[idx * 3 + 1] = faceNormal.y;
                        normals[idx * 3 + 2] = faceNormal.z;
                    }
                    else {
                        normals[idx * 3] = normal.x;
                        normals[idx * 3 + 1] = normal.y;
                        normals[idx * 3 + 2] = normal.z;
                    }
                    ++idx;
                }
            }
        }
        return {
            positions,
            normals,
            colors,
            indices,
        };
    }
    finish() {
        return Promise.all(this.tasks).then(() => this.dumpModelBufferData());
    }
}
