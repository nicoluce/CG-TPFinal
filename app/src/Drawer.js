import { InitShaderProgram, gl } from './utils';

export default class Drawer {
  constructor(geometry, vertexShader, fragmentShader) {
    this.prog = InitShaderProgram(vertexShader, fragmentShader);

    this.geom = geometry;

    this.mvp = gl.getUniformLocation(this.prog, 'u_mvp');
    this.mv = gl.getUniformLocation(this.prog, 'u_mv');
    this.norm = gl.getUniformLocation(this.prog, 'u_norm');

    this.verticesAttrib = gl.getAttribLocation(this.prog, 'a_pos');
    this.verticesBuffer = gl.createBuffer();
    this.indicesBuffer = gl.createBuffer();

    this.normalsAttrib = gl.getAttribLocation(this.prog, 'a_norm');
    this.normalsBuffer = gl.createBuffer();

    this.colorsAttrib = gl.getAttribLocation(this.prog, 'a_color');
    this.colorsBuffer = gl.createBuffer();
  }

  draw(matrixMVP, matrixMV, matrixNormal) {
    gl.useProgram(this.prog);
    
    gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
    gl.uniformMatrix4fv(this.mv, false, matrixMV);
    gl.uniformMatrix3fv(this.norm, false, matrixNormal);

    this.customDraw();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.geom.vertices), gl.DYNAMIC_DRAW);
    
    gl.vertexAttribPointer(this.verticesAttrib, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.verticesAttrib);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.geom.indices), gl.DYNAMIC_DRAW);

    if (this.geom.normals) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.geom.normals), gl.DYNAMIC_DRAW);

      gl.vertexAttribPointer(this.normalsAttrib, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(this.normalsAttrib);
    }

    if (this.colors) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorsBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.DYNAMIC_DRAW);

      gl.vertexAttribPointer(this.colorsAttrib, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(this.colorsAttrib);
    }
    
    gl.drawElements(gl.TRIANGLES, this.geom.indices.length, gl.UNSIGNED_SHORT, 0);
    
    document.getElementById('tricount').innerHTML = `#Tricount: ${this.geom.indices.length / 3} (${this.geom.indices.length})`
    document.getElementById('tricount').innerText = `#Tricount: ${this.geom.indices.length / 3} (${this.geom.indices.length})`
  }

  customDraw() {}
}