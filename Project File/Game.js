const canvas = document.getElementById('game');
const context = canvas.getContext('2d');

// Define a variable to keep track of the score
let score = 0;

const scoreVal = document.querySelector('.score_val');

// Function to increment the score and update the display
function increaseScore() {
  score++;
  scoreVal.innerHTML = 'Score : '+score;
}

const minTunnelWidth = 400;
const maxTunnelWidth = canvas.width;
const minHeight = 10;
const maxHeight = 100;

const obstacleWidth = 65;
const obstacleHeight = 135;

// how fast the background moves
const moveSpeed = 7;

// downward acceleration
const gravity = 0.35;

// keep track of the spacebar being pressed so we can move the
// block up when pressed and down when not pressed
let spacePressed = false;
let gameStarted = false; // Variable to track if the game has started

// clamp a number between min and max values
function clamp(num, min, max) {
  return Math.min( Math.max(min, num), max);
}

// return a random integer between min (inclusive) and max (inclusive)

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const helicopter = {
  x: 200,
  y: 100,
  width: 100,
  height: 60,
  dy: 0,  // velocity
  ddy: 0  // acceleration
};

// just keep track of a tunnel wall current x position, width, start
// and end height. the top and bottom wall are mirrored, so we only
// need to keep track of one of them
let tunnels = [{
  x: 0,
  width: canvas.width,
  start: 50,
  end: 50
},
{
  x: canvas.width,
  width: randInt(minTunnelWidth, maxTunnelWidth),
  start: 50,
  end: randInt(minHeight, maxHeight)
}];

// for the obstacles in the path just need to keep track of the
// position as they are always the same size
let obstacles = [{
  x: canvas.width,
  y: canvas.height / 2
},
{
  x: canvas.width * 2,
  y: canvas.height / 2
}];

// tunnel wall color and rgb value
const wallColor = 'brown';
context.fillStyle = wallColor;
context.fillRect(0, 0, 1, 1);

// getImageData returns a data object which is a flat array of every
// pixel of the canvas in the specified rect (x, y, width, height).
// every 4 indices of the array is a single pixel's r,g,b,a values
const wallData = context.getImageData(0, 0, 1, 1);

// destructure the image data array to get the rgb values of the wall

const [ wallRed, wallGreen, wallBlue ] = wallData.data;



// game loop
let rAF;
function loop() {
  rAF = requestAnimationFrame(loop);
  context.clearRect(0,0,canvas.width,canvas.height);

  if (gameStarted) { // Check if the game has started
    if (spacePressed) {
      helicopter.ddy = -0.7;
      // Hide message box if space bar is pressed
      document.getElementById('messageBox').style.display = 'none';
    }
    else {
      helicopter.ddy = 0;
    }

    // update position based on acceleration and velocity
    helicopter.dy += helicopter.ddy + gravity;
    // clamp velocity
    helicopter.dy = clamp(helicopter.dy, -8, 8);
    helicopter.y += helicopter.dy;

    // draw the helicopter
    context.fillStyle = 'white';
    context.fillRect(helicopter.x, helicopter.y, helicopter.width, helicopter.height);

    // draw the tunnel walls over the helicopter
    context.fillStyle = 'brown';
    tunnels.forEach((tunnel, index) => {
      tunnel.x -= moveSpeed;

      // if the last tunnel is fully on screen, we need to spawn a new
      // tunnel segment off screen
      if (
        index === tunnels.length - 1 &&
        tunnel.x + tunnel.width <= canvas.width
      ) {
        tunnels.push({
          x: tunnel.x + tunnel.width,
          width: randInt(minTunnelWidth, maxTunnelWidth),
          start: tunnel.end,
          end: randInt(minHeight, maxHeight)
        });
      }

      // top tunnel wall
      context.beginPath();
      context.moveTo(tunnel.x, 0);
      context.lineTo(tunnel.x, tunnel.start);
      context.lineTo(tunnel.x + tunnel.width, tunnel.end);
      context.lineTo(tunnel.x + tunnel.width, 0);
      context.closePath();
      context.fill();

      // bottom tunnel wall
      context.beginPath();
      context.moveTo(tunnel.x, canvas.height);
      context.lineTo(tunnel.x, tunnel.start + 450);
      context.lineTo(tunnel.x + tunnel.width, tunnel.end + 450);
      context.lineTo(tunnel.x + tunnel.width, canvas.height);
      context.closePath();
      context.fill();
    });

    // draw obstacles
    obstacles.forEach((obstacle, index) => {
      obstacle.x -= moveSpeed;
      context.fillRect(obstacle.x, obstacle.y, obstacleWidth, obstacleHeight);

      // if the last obstacle is fully on screen, we need to spawn a new one off screen
      if (
        index === obstacles.length - 1 &&
        obstacle.x + obstacleWidth <= canvas.width
      ) {
        obstacles.push({
          x: canvas.width * 2,
          y: randInt(maxHeight + 50, canvas.height - obstacleHeight - maxHeight - 50)
        });

        // Increment the score when a new obstacle is spawned
        increaseScore();
      }
    });

    // remove any tunnel segments or obstacles that are off screen
    tunnels = tunnels.filter(tunnel => tunnel.x + tunnel.width > 0);
    obstacles = obstacles.filter(obstacle => obstacle.x + obstacleWidth > 0);

    // pixel perfect collision detection
    // get the pixels of the canvas at the helicopter rect and look for
    // any pixels that match the wall color. the wall has to be drawn
    // above the helicopter in order for this to work
    const { data } = context.getImageData(helicopter.x, helicopter.y, helicopter.width, helicopter.height);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // if we match the tunnel wall color we have a collision
      if (r === wallRed && g === wallGreen && b === wallBlue) {
        // draw a dotted white circle around the white block when it crashes
        context.strokeStyle = 'white';
        context.setLineDash([5, 15])
        context.lineWidth = 4;

        context.beginPath();
        context.arc(helicopter.x + helicopter.width / 2, helicopter.y + helicopter.height / 2, helicopter.width, 0, 2 * Math.PI);
        context.stroke();

        // Show restart button when game ends
        document.getElementById('restartButton').style.display = 'block';
        cancelAnimationFrame(rAF);
      }
    }
  }
}

// listen to keyboard events to move the helicopter
document.addEventListener('keydown', function(e) {
  // spacebar
  if (e.code === 'Space') {
    if (!gameStarted) { // Check if the game has not started
      gameStarted = true; // Start the game when space bar is pressed
    }
    spacePressed = true;
  }
});
document.addEventListener('keyup', function(e) {
  // spacebar
  if (e.code === 'Space') {
    spacePressed = false;
  }
});

// Restart button click event listener
document.getElementById('restartButton').addEventListener('click', function() {
  // Reset variables
  gameStarted = false;
  score = 0;
  scoreVal.innerHTML = 'Score : '+score;
  obstacles = [{
    x: canvas.width,
    y: canvas.height / 2
  },
  {
    x: canvas.width * 2,
    y: canvas.height / 2
  }];
  tunnels = [{
    x: 0,
    width: canvas.width,
    start: 50,
    end: 50
  },
  {
    x: canvas.width,
    width: randInt(minTunnelWidth, maxTunnelWidth),
    start: 50,
    end: randInt(minHeight, maxHeight)
  }];
  // Hide restart button
  this.style.display = 'none';
  // Restart game
  rAF = requestAnimationFrame(loop);
});

// start the game
rAF = requestAnimationFrame(loop);
