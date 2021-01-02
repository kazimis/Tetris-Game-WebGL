// Acknowledgment:
// This code is based on the demos provided by TA.
var readyToDraw = false;
var accumulateKey = 0;
var accumulateAutoFall = 0;
var keyDelay = 150;
var autoFallDelay = 1200;
var stackUpate = false;
var reset = false;
var active = true;
var gameOver = false;
var id;

main();

function main() {
  var tile_info = get_tile();
  console.log("ort in main", tile_info.ort_idx);
  var begin = Date.now();
  var end = 0;
  var elapsedTime;

  const canvas = document.getElementById("glcanvas");
  console.log(canvas);
  var gl = canvas.getContext("webgl");

  // If we don't have a GL context, alert message
  if (!gl) {
    alert("Your browser does not support any WebGL");
    return;
  }

  // Vertex shader program

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform vec4 uPvt;
    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * ((uModelViewMatrix * (aVertexPosition-uPvt)+ uPvt))  ;
      vColor = aVertexColor;
    }
  `;

  // Fragment shader program
  const fsSource = `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVevrtexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      pvt: gl.getUniformLocation(shaderProgram, "uPvt"),
    },
  };

  var stack_info = { tiles: [] };

  //Grids pos_color info
  // vertical lines
  var positions = [];
  var colors = [];
  for (var i = 0; i <= 20; i++) {
    positions.push(1.0, 2.0 - 0.2 * i, -1.0, 2.0 - 0.2 * i);
    colors.push(1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0);
  }

  // Horizontal lines
  for (var i = 0; i <= 10; i++) {
    positions.push(1.0 - 0.2 * i, 2.0, 1.0 - 0.2 * i, -2.0);
    colors.push(1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0);
  }

  const grid_info = {
    pos_color: { positions: positions, colors: colors },
    v_count: 64,
    type: "grid",
  };

  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things
  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // first drawing of tiles and grids
  var buffers = initBuffers(gl, tile_info.pos_color);
  drawScene(gl, programInfo, buffers, tile_info);
  buffers = initBuffers(gl, grid_info.pos_color);
  drawScene(gl, programInfo, buffers, grid_info);

  //game loop till game is over or user quits
  function gameLoop() {
    console.log("running");
    end = Date.now();
    elapsedTime = end - begin;
    begin = end;
    tile_info = game_logic(elapsedTime, tile_info, stack_info);
    if (readyToDraw) {
      if (active) {
        buffers = initBuffers(gl, tile_info.pos_color);
        drawScene(gl, programInfo, buffers, tile_info);
      }
      if (stackUpate) {
        for (var i = 0; i < stack_info.tiles.length; i++) {
          buffers = initBuffers(gl, stack_info.tiles[i].pos_color);
          drawScene(gl, programInfo, buffers, stack_info.tiles[i]);
        }
        stackUpate != stackUpate;
      }
      buffers = initBuffers(gl, grid_info.pos_color);
      drawScene(gl, programInfo, buffers, grid_info);
      readyToDraw = !readyToDraw;
    }
    if (gameOver) {
      gameOver = false;
      return;
    } else if (qPressed) {
    }
    id = requestAnimationFrame(gameLoop);
  }
  gameLoop();
}
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple two-dimensional square.
//
function initBuffers(gl, pos_color) {
  // Pass the list of positions into WebGL
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(pos_color.positions),
    gl.STATIC_DRAW
  );

  // Now set up the colors for the vertices

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(pos_color.colors),
    gl.STATIC_DRAW
  );

  return {
    position: positionBuffer,
    color: colorBuffer,
  };
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, buffers, info) {
  var p_x = 0.0;
  var p_y = 0.0;
  var draw_type = info.type;
  v_count = info.v_count;

  const fieldOfView = (45 * Math.PI) / 180; // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.
  if (draw_type == "grid") {
    mat4.translate(
      modelViewMatrix, // destination matrix
      modelViewMatrix, // matrix to translate
      [-0.0, 0.0, -6.0]
    ); // amount to translate
  } else if (draw_type == "stack") {
    const dx = info.transMat[0];
    const dy = info.transMat[1];
    mat4.translate(
      modelViewMatrix, // destination matrix
      modelViewMatrix, // matrix to translate
      [0.2 * dx, 0.2 * dy, -6.0]
    ); // amount to translate
  } else {
    const dx = info.transMat[0];
    const dy = info.transMat[1];
    mat4.translate(modelViewMatrix, modelViewMatrix, [
      0.2 * dx,
      0.2 * dy,
      -6.0,
    ]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, info.angle, [0, 0, 1]);

    p_x = info.pivot[0];
    p_y = info.pivot[1];
  }

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the colors from the color buffer
  // into the vertexColor attribute.
  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexColor,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
  }

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );

  gl.uniform4f(programInfo.uniformLocations.pvt, p_x, p_y, 0, 0);

  if (draw_type == "grid") {
    gl.drawArrays(gl.LINES, 0, v_count);
  } else {
    {
      const offset = 0;
      const vertexCount = 4;
      for (var i = 0; i < v_count; i++) {
        gl.drawArrays(gl.TRIANGLE_STRIP, 4 * i, vertexCount);
      }
    }
  }
}

//
// Initialize a shader program, so WebGL knows how to draw our data
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      "Unable to initialize the shader program: " +
        gl.getProgramInfoLog(shaderProgram)
    );
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      "An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function game_logic(elapsedTime, tile_info, stack_info) {
  accumulateKey += elapsedTime;
  accumulateAutoFall += elapsedTime;
  if (accumulateKey > keyDelay) {
    if (rightPressed) {
      moveRight(tile_info);
      readyToDraw = true;
      accumulateKey = 0;
    } else if (leftPressed) {
      moveLeft(tile_info);
      readyToDraw = true;
      accumulateKey = 0;
    } else if (downPressed) {
      accumulateAutoFall = autoFallDelay + 1;
    } else if (upPressed) {
      if (isRotate(tile_info)) {
        rotate(tile_info);
        accumulateKey = 0;
        readyToDraw = true;
      }
    } else if (qPressed) {
      gameOver = true;
      var p = document.getElementById("p");
      p.innerHTML = "You quit the game. Thanks for playing!";
      document.getElementById("modal").style.display = "block";
      document.getElementById("glcanvas").style.display = "none";
    }
  }
  if (accumulateAutoFall > autoFallDelay) {
    if (remove(stack_info)) {
      readyToDraw = true;
      accumulateAutoFall = 0;
    } else {
      if (isDown(tile_info)) {
        tile_info.transMat[1]--;
        readyToDraw = true;
        accumulateAutoFall = 0;
      } else {
        addToStack(tile_info, stack_info);
        tile_info = get_tile();
        if (!isDown(tile_info)) {
          gameOver = true;
          document.getElementById("modal").style.display = "block";
          document.getElementById("glcanvas").style.display = "none";
        }
        readyToDraw = true;
        stackUpate = true;
        accumulateAutoFall = 0;
        sleep(100);
      }
    }
  }
  return tile_info;
}

// event listener
keyDown();
keyUp();
