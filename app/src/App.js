import { canvas, gl, MatrixMult, GetModelViewMatrix, ProjectionMatrix } from './utils';
import LightView from './lightView';

export default class App {
  perspectiveMatrix = null;
  rotX = 0;
  rotY = 0;
  transZ = 10;
  autorot = 0;
  drawers = [];
  lightDir = [0, 0, 0];
  drawing = false;
  constructor() {
    window.onresize = this.WindowResize();
    window.addEventListener('draw', (e) => this.DrawScene());
    document.getElementById('geometry-select').onchange = (e) => this.OnGeometryChange(e);
    document.getElementById('auto-rotate').onchange = (e) => this.AutoRotate(e.target);

    this.InitWebGL();

    this.lightView = new LightView((lightDir) => {
      this.lightDir = lightDir;
      this.drawers.forEach(drawer => drawer.setLightDir && drawer.setLightDir(...lightDir));
      this.DrawScene();
    });

    this.lightDir = this.lightView.lightDir;

    canvas.zoom = (s) => {
      this.transZ = Math.max(this.transZ * (s / canvas.height + 1), 0.01);
      this.UpdateProjectionMatrix();
      this.DrawScene();
    };

    canvas.onwheel = () => { canvas.zoom(6 * event.deltaY); };
    canvas.onmousedown = () => {
      var cx = event.clientX;
      var cy = event.clientY;
      if (event.ctrlKey) {
        canvas.onmousemove = () => {
          canvas.zoom(5 * (event.clientY - cy));
          cy = event.clientY;
        };
      } else {
        // Si se mueve el mouse, actualizo las matrices de rotación
        canvas.onmousemove = () => {
          this.rotY += (cx - event.clientX) / canvas.width * 5;
          this.rotX += (cy - event.clientY) / canvas.height * 5;
          cx = event.clientX;
          cy = event.clientY;
          this.UpdateProjectionMatrix();
          this.DrawScene();
        };
      }
    };

    // Evento soltar el mouse
    canvas.onmouseup = canvas.onmouseleave = () => {
      canvas.onmousemove = null;
    };

    // Dibujo la escena
    this.DrawScene();
  }

  InitWebGL() {
    // Inicializamos el canvas WebGL
    console.log('Inicializamos el canvas WebGL');
    canvas.oncontextmenu = function() {return false;};
    if (!gl) 
    {
      alert("Imposible inicializar WebGL. Tu navegador quizás no lo soporte.");
      return;
    }
    
    // Inicializar color clear
    gl.clearColor(0,0,0,0);
    gl.enable(gl.DEPTH_TEST); // habilitar test de profundidad 
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Setear el tamaño del viewport
    this.UpdateCanvasSize();
  }

  // Funcion para actualizar el tamaño de la ventana cada vez que se hace resize
  UpdateCanvasSize() {
    // 1. Calculamos el nuevo tamaño del viewport
    canvas.style.width  = "100%";
    canvas.style.height = "100%";

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width  = pixelRatio * canvas.clientWidth;
    canvas.height = pixelRatio * canvas.clientHeight;

    const width  = (canvas.width  / pixelRatio);
    const height = (canvas.height / pixelRatio);

    canvas.style.width  = width  + 'px';
    canvas.style.height = height + 'px';
    
    // 2. Lo seteamos en el contexto WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);

    // 3. Cambian las matrices de proyección, hay que actualizarlas
    this.UpdateProjectionMatrix();
  }

  // Devuelve la matriz de perspectiva (column-major)
  UpdateProjectionMatrix() {
    this.perspectiveMatrix = ProjectionMatrix(canvas, this.transZ);
  }

  // Funcion que reenderiza la escena. 
  DrawScene() {
    // 1. Obtenemos las matrices de transformación 
    const mv  = GetModelViewMatrix(0, 0, this.transZ, this.rotX, this.autorot + this.rotY);
    const mvp = MatrixMult(this.perspectiveMatrix, mv);

    // 2. Limpiamos la escena
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const nrmTrans = [ mv[0],mv[1],mv[2], mv[4],mv[5],mv[6], mv[8],mv[9],mv[10] ];
    this.drawers.forEach(drawer => drawer.draw(mvp, mv, nrmTrans));
  }

  // Evento resize
  WindowResize() {
    this.UpdateCanvasSize();
    this.DrawScene();
  }

  OnGeometryChange(e) {
    this.drawers.forEach((drawer) => drawer.updateGeometry && drawer.updateGeometry(e.target.value));
    this.DrawScene();
  }

  AddDrawer(drawer) {
    drawer.setLightDir && drawer.setLightDir(...this.lightDir);
    this.drawers.push(drawer);
  }

  // Control de la calesita de rotación
  AutoRotate(param) {
    // Si hay que girar...
    if (param.checked) {
      // Vamos rotando una cantiad constante cada 30 ms
      this.timer = setInterval(
        () => {
          var v = 50;
          this.autorot += 0.0005 * v;
          if ( this.autorot > 2*Math.PI ) this.autorot -= 2*Math.PI;

          // Reenderizamos
          this.DrawScene();
        },
        30
      );
    } else {
      clearInterval(this.timer);
    }
  }
}