const sqr_size = 0.2;
const half_cols = 5;
const half_rows = 10;
var rightPressed = false;
var leftPressed = false;
var upPressed = false;
var downPressed = false;
var rPressed = false;
var qPressed = false;
var stack = zeros([20, 10]);

// Tiles
const tiles_type = { O: 4, I: 2, S: 2, Z: 2, L: 4, J: 4, T: 4 };

const x_y_range = {
  O: [-(half_cols + 1), half_rows, 2, half_rows],

  I: [-half_cols, half_rows, 1, half_rows],

  S: [-(half_cols + 1), half_rows, 1, half_rows],

  Z: [-(half_cols + 1), half_rows, 1, half_rows],

  L: [-(half_cols + 1), half_rows, 1, half_rows],

  J: [-half_cols + 1, half_rows, 1, half_rows],

  T: [-(half_cols + 1), half_rows, 1, half_rows],
};
// tile colors
const tile_color = {
  O: [0.937, 0.18, 0.705, 1.0],
  I: [0.156, 0.141, 0.941, 1.0],
  S: [0.376, 0.074, 0.847, 1.0],
  Z: [0.078, 0.96, 0.952, 1.0],
  L: [0.96, 0.619, 0.078, 1.0],
  J: [0.803, 0.054, 0.082, 1.0],
  T: [0.756, 0.917, 0.164, 1.0],
};
//tiles orientation encoding for checking collisions
const tile_ortn = {
  O: [
    [
      [0, 0, 0, 0],
      [0, 1, 2, 0],
      [0, 3, 4, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 2, 4, 0],
      [0, 1, 3, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 4, 3, 0],
      [0, 2, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 3, 1, 0],
      [0, 4, 2, 0],
      [0, 0, 0, 0],
    ],
  ],

  I: [
    [
      [0, 0, 0, 0],
      [1, 2, 3, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 4, 0],
      [0, 0, 3, 0],
      [0, 0, 2, 0],
      [0, 0, 1, 0],
    ],
  ],

  S: [
    [
      [0, 0, 0, 0],
      [0, 0, 1, 2],
      [0, 3, 4, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 2, 0],
      [0, 0, 1, 4],
      [0, 0, 0, 3],
      [0, 0, 0, 0],
    ],
  ],

  Z: [
    [
      [0, 0, 0, 0],
      [0, 1, 2, 0],
      [0, 0, 3, 4],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 4],
      [0, 0, 2, 3],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ],
  ],

  L: [
    [
      [0, 0, 0, 0],
      [0, 1, 2, 3],
      [0, 4, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 3, 0],
      [0, 0, 2, 0],
      [0, 0, 1, 4],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 4],
      [0, 3, 2, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 4, 1, 0],
      [0, 0, 2, 0],
      [0, 0, 3, 0],
      [0, 0, 0, 0],
    ],
  ],

  J: [
    [
      [0, 0, 0, 0],
      [0, 1, 2, 3],
      [0, 0, 0, 4],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 3, 4],
      [0, 0, 2, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 4, 0, 0],
      [0, 3, 2, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 2, 0],
      [0, 4, 3, 0],
      [0, 0, 0, 0],
    ],
  ],

  T: [
    [
      [0, 0, 0, 0],
      [0, 1, 2, 3],
      [0, 0, 4, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 3, 0],
      [0, 0, 2, 4],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 4, 0],
      [0, 3, 2, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 4, 2, 0],
      [0, 0, 3, 0],
      [0, 0, 0, 0],
    ],
  ],
};

function get_tile() {
  // choose random tile and orientation
  const pi = Math.PI;
  var idx = getRndInteger(0, 6);
  var key = Object.keys(tiles_type)[idx];
  var ort_idx = getRndInteger(0, tiles_type[key] - 1);
  var angle = ort_idx * (pi / 2);
  var org_ort = tile_ortn[key][0];
  var ort = tile_ortn[key][ort_idx];
  var range = x_y_range[key];
  var x = getRndInteger(range[0], range[2]);
  var y = range[1];
  var pivot = [(x + 2.5) * sqr_size, (y - 1.5) * sqr_size];
  if (key == "O") {
    pivot = [(x + 2) * sqr_size, (y - 2) * sqr_size];
  }
  var positions = [];
  var colors = [];
  var v_count = 0;
  clr = [
    [1.0, 0.0, 0.0, 1.0],
    [0.0, 1.0, 0.0, 1.0],
    [0.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 1.0, 1.0],
  ];
  for (var i = 0; i < 4; i++) {
    for (var j = 0; j < 4; j++) {
      if (org_ort[i][j] != 0) {
        positions.push(
          (x + j) * sqr_size,
          (y - i) * sqr_size,
          (x + j + 1) * sqr_size,
          (y - i) * sqr_size,
          (x + j) * sqr_size,
          (y - i - 1) * sqr_size,
          (x + j + 1) * sqr_size,
          (y - i - 1) * sqr_size
        );
        colors = colors.concat(
          tile_color[key],
          tile_color[key],
          tile_color[key],
          tile_color[key]
        );
        v_count += 1;
      }
    }
  }

  var tile_info = {
    pos_color: { positions: positions, colors: colors },
    v_count: v_count,
    key: key,
    orientation: ort,
    x_y: [x, y],
    transMat: [0, 0],
    ort_idx: ort_idx,
    type: "tile",
    angle: angle,
    pivot: pivot,
  };
  return tile_info;
}

// function that moves tile down. returns true if collision with stacks or
// bottom boundary happens. return false otherwise.

function moveRight(tile_info) {
  if (isRight(tile_info)) {
    tile_info.transMat[0]++;
  }
}

function moveLeft(tile_info) {
  if (isLeft(tile_info)) {
    tile_info.transMat[0]--;
  }
}

function rotate(tile_info) {
  const pi = Math.PI;
  var key = tile_info.key;
  if (key == "I" || key == "S" || key == "Z") {
    if (tile_info.ort_idx == 1) {
      tile_info.angle += pi / 2;
    } else {
      tile_info.angle -= pi / 2;
    }
  } else {
    tile_info.angle += pi / 2;
  }
}

function isDown(tile_info) {
  tile_info.x_y[1]--;

  if (stackCollision(tile_info.orientation, tile_info.x_y)) {
    tile_info.x_y[1]++;
    return false;
  }
  return true;
}

function isRight(tile_info) {
  tile_info.x_y[0]++;

  if (rightCollision(tile_info.orientation, tile_info.x_y)) {
    tile_info.x_y[0]--;
    return false;
  }

  if (stackCollision(tile_info.orientation, tile_info.x_y)) {
    tile_info.x_y[0]--;
    return false;
  }
  return true;
}

// if left move is possible
function isLeft(tile_info) {
  tile_info.x_y[0]--;

  if (leftCollision(tile_info.orientation, tile_info.x_y)) {
    tile_info.x_y[0]++;
    return false;
  }

  if (stackCollision(tile_info.orientation, tile_info.x_y)) {
    tile_info.x_y[0]++;
    return false;
  }
  return true;
}

//check left collision
function leftCollision(ort, x_y) {
  for (var i = 0; i < 4; i++) {
    for (var j = 0; j < 4; j++) {
      if (ort[i][j] != 0) {
        var x_idx = x_y[0] + j;
        var y_idx = x_y[1] - i;
        // check for right boundary
        if (x_idx < -half_cols) {
          return true;
        }
      }
    }
  }
  return false;
}

//check right collision
function rightCollision(ort, x_y) {
  for (var i = 0; i < 4; i++) {
    for (var j = 0; j < 4; j++) {
      if (ort[i][j] != 0) {
        var x_idx = x_y[0] + j;
        var y_idx = x_y[1] - i;
        // check for right boundary
        if (x_idx >= half_cols) {
          return true;
        }
      }
    }
  }
  return false;
}

// check if rotation is possible
function isRotate(tile_info) {
  var curr_idx = tile_info.ort_idx;
  var curr_ort = tile_info.orientation;
  var tmp = 0;
  if (curr_idx + 1 < tile_ortn[tile_info.key].length) {
    tmp = curr_idx + 1;
  }

  tile_info.ort_idx = tmp;
  tile_info.orientation = tile_ortn[tile_info.key][tmp];

  if (
    leftCollision(tile_info.orientation, tile_info.x_y) ||
    rightCollision(tile_info.orientation, tile_info.x_y) ||
    stackCollision(tile_info.orientation, tile_info.x_y)
  ) {
    tile_info.ort_idx = curr_idx;
    tile_info.orientation = curr_ort;
    return false;
  }
  return true;
}

//return true if colliding with bottom boundary or stack
function stackCollision(ort, x_y) {
  // console.log("ort in stack collsion", ort);
  for (var i = 0; i < 4; i++) {
    for (var j = 0; j < 4; j++) {
      if (ort[i][j] != 0) {
        var x_idx = x_y[0] + j;
        var y_idx = x_y[1] - i;

        // check for bottom boundary
        if (y_idx <= -half_rows) {
          return true;
        }
        // check for stack stack collision
        var y = parseInt(-y_idx + half_rows);
        if (y < 0) {
          y = 0;
        }
        if (stack[y][parseInt(x_idx + half_cols)] != 0) {
          return true;
        }
      }
    }
  }
  return false;
}

//add pice to stack
function addToStack(tile_info, stack_info) {
  x_y = tile_info.x_y;

  for (var i = 0; i < 4; i++) {
    for (var j = 0; j < 4; j++) {
      if (tile_info.orientation[i][j] != 0) {
        var x_idx = x_y[0] + j;
        var y_idx = x_y[1] - i;
        var cell = {
          pos_color: { positions: [], colors: [] },
          transMat: [0, 0],
          type: "tile",
          v_count: 1,
          pivot: [0, 0],
          angle: 0,
        };

        cell.pos_color.positions.push(
          x_idx * sqr_size,
          y_idx * sqr_size,
          (x_idx + 1) * sqr_size,
          y_idx * sqr_size,
          x_idx * sqr_size,
          (y_idx - 1) * sqr_size,
          (x_idx + 1) * sqr_size,
          (y_idx - 1) * sqr_size
        );
        var tmp = tile_info.pos_color.colors.splice(0, 16);
        cell.pos_color.colors = tmp;
        stack[parseInt(-y_idx + half_rows)][parseInt(x_idx + half_cols)] = cell;
        stack_info.tiles.push(cell);
      }
    }
  }
}

//remove if line is formed
function remove(stack_info) {
  var linesRemoved = false;
  for (var i = 19; i >= 0; i--) {
    var lineFormed = true;
    for (var j = 0; j < 10; j++) {
      if (stack[i][j] == 0) {
        lineFormed = false;
      }
    }
    if (lineFormed) {
      linesRemoved = true;
      for (var k = 0; k < 10; k++) {
        var tmp = stack[i][k];
        var index = stack_info.tiles.indexOf(tmp);
        stack_info.tiles.splice(index, 1);
      }
      for (var l = i - 1; l >= 0; l--) {
        for (var m = 0; m < 10; m++) {
          if (stack[l][m] != 0) {
            stack[l][m].transMat[1]--;
          }
        }
      }
      for (var r = i; r > 0; r--) {
        stack[r] = stack[r - 1];
      }
      stack[0] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
  }
  return linesRemoved;
}

function keyDown() {
  document.addEventListener("keydown", (event) => {
    const keyname = event.key;
    if (keyname == "ArrowRight") {
      rightPressed = true;
    } else if (keyname == "ArrowLeft") {
      leftPressed = true;
    } else if (keyname == "ArrowUp") {
      upPressed = true;
    } else if (keyname == "ArrowDown") {
      downPressed = true;
    } else if (keyname == "r") {
      cancelAnimationFrame(id);
      main();
      rPressed = true;
    } else if (keyname == "q") {
      qPressed = true;
    }
  });
}

function keyUp() {
  document.addEventListener("keyup", (event) => {
    const keyname = event.key;
    if (keyname == "ArrowRight") {
      rightPressed = false;
    } else if (keyname == "ArrowLeft") {
      leftPressed = false;
    } else if (keyname == "ArrowUp") {
      upPressed = false;
    } else if (keyname == "ArrowDown") {
      downPressed = false;
    } else if (keyname == "r") {
      rPressed = false;
    } else if (keyname == "q") {
      qPressed = false;
    }
  });
}

//**********Some helper functions***********

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max + 1 - min)) + min;
}

function zeros(dimensions) {
  var array = [];

  for (var i = 0; i < dimensions[0]; ++i) {
    array.push(dimensions.length == 1 ? 0 : zeros(dimensions.slice(1)));
  }
  return array;
}

function sleep(miliseconds) {
  var currentTime = new Date().getTime();

  while (currentTime + miliseconds >= new Date().getTime()) {}
}

function removeElement(array, elem) {
  var index = array.indexOf(elem);
  if (index > -1) {
    array.splice(index, 1);
  }
}
