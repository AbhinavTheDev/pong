// --- DOM ELEMENTS ---
const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");
const leftScoreElement = document.getElementById("left-score");
const rightScoreElement = document.getElementById("right-score");
const upButton = document.querySelector(".up");
const downButton = document.querySelector(".down");
const startButton = document.querySelector(".start-btn");

// --- GAME CONSTANTS ---
const PADDLE_WIDTH = 5;
const PADDLE_HEIGHT = 50;
const BALL_RADIUS = 5;
const PADDLE_SPEED = 4;
const WINNING_SCORE = 5;

// --- GAME CLASSES ---

class Paddle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = PADDLE_WIDTH;
    this.height = PADDLE_HEIGHT;
    this.dy = 0;
    this.score = 0;
  }

  draw() {
    ctx.fillStyle = "#e85d04";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  update() {
    this.y += this.dy;
    // Keep paddle within canvas bounds
    this.y = Math.max(Math.min(this.y, canvas.height - this.height), 0);
  }
}

class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = BALL_RADIUS;
    this.dx = 0;
    this.dy = 0;
    this.reset();
  }

  draw() {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();
  }

  update(leftPaddle, rightPaddle) {
    this.x += this.dx;
    this.y += this.dy;

    // Top and bottom collision
    if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
      this.dy *= -1;
    }

    // Left paddle collision
    if (
      this.dx < 0 &&
      this.x - this.radius < leftPaddle.x + leftPaddle.width &&
      this.y > leftPaddle.y &&
      this.y < leftPaddle.y + leftPaddle.height
    ) {
      this.dx *= -1.1; // Increase speed on hit
      let collidePoint = this.y - (leftPaddle.y + leftPaddle.height / 2);
      this.dy = collidePoint * 0.1; // Add angle based on hit point
      this.x = leftPaddle.x + leftPaddle.width + this.radius;
    }

    // Right paddle collision
    if (
      this.dx > 0 &&
      this.x + this.radius > rightPaddle.x &&
      this.y > rightPaddle.y &&
      this.y < rightPaddle.y + rightPaddle.height
    ) {
      this.dx *= -1.1; // Increase speed on hit
      let collidePoint = this.y - (rightPaddle.y + rightPaddle.height / 2);
      this.dy = collidePoint * 0.1; // Add angle based on hit point
      this.x = rightPaddle.x - this.radius;
    }

    // Score update
    if (this.x - this.radius < 0) {
      rightPaddle.score++;
      rightScoreElement.textContent = rightPaddle.score.toString();
      this.reset();
    }
    if (this.x + this.radius > canvas.width) {
      leftPaddle.score++;
      leftScoreElement.textContent = leftPaddle.score.toString();
      this.reset();
    }
  }

  reset() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    // Add a slight delay before serving
    this.dx = 0;
    this.dy = 0;
    setTimeout(() => {
      this.dx = Math.random() > 0.5 ? 3 : -3;
      this.dy = Math.random() * 4 - 2;
    }, 500);
  }
}

class Game {
  constructor() {
    this.resizeCanvas();
    this.leftPaddle = new Paddle(10, canvas.height / 2 - PADDLE_HEIGHT / 2);
    this.rightPaddle = new Paddle(
      canvas.width - PADDLE_WIDTH - 10,
      canvas.height / 2 - PADDLE_HEIGHT / 2
    );
    this.ball = new Ball(canvas.width / 2, canvas.height / 2);
    this.gameOver = false;
    this.winner = null;

    leftScoreElement.textContent = this.leftPaddle.score.toString();
    rightScoreElement.textContent = this.rightPaddle.score.toString();

    // Event listeners
    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
    document.addEventListener("keyup", (e) => this.handleKeyUp(e));
    window.addEventListener("resize", () => this.resizeCanvas());

    this.initButtonControls();
  }

  resizeCanvas() {
    const screen = document.querySelector(".screen");
    if (screen && ctx) {
      canvas.width = screen.clientWidth;
      canvas.height = screen.clientHeight;
      if (this.rightPaddle) {
        this.rightPaddle.x = canvas.width - PADDLE_WIDTH - 10;
      }
      if (this.gameOver) this.drawGameOver();
    }
  }

  initButtonControls() {
    const handlePress = (direction) => {
      this.leftPaddle.dy = direction === "up" ? -PADDLE_SPEED : PADDLE_SPEED;
    };
    const handleRelease = () => {
      this.leftPaddle.dy = 0;
    };

    upButton.addEventListener("mousedown", () => handlePress("up"));
    upButton.addEventListener("touchstart", (e) => {
      e.preventDefault();
      handlePress("up");
    });

    downButton.addEventListener("mousedown", () => handlePress("down"));
    downButton.addEventListener("touchstart", (e) => {
      e.preventDefault();
      handlePress("down");
    });

    document.body.addEventListener("mouseup", handleRelease);
    document.body.addEventListener("touchend", handleRelease);
  }

  draw() {
    // Clear canvas with a trail effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw net
    for (let i = 0; i < canvas.height; i += 15) {
      ctx.fillStyle = "rgba(108, 117, 125, 0.5)";
      ctx.fillRect(canvas.width / 2 - 1, i, 2, 10);
    }

    this.leftPaddle.draw();
    this.rightPaddle.draw();
    this.ball.draw();

    if (this.gameOver) {
      this.drawGameOver();
    }
  }

  update() {
    if (this.gameOver) return;

    this.leftPaddle.update();

    // AI for the right paddle
    this.rightPaddle.y +=
      (this.ball.y - (this.rightPaddle.y + this.rightPaddle.height / 2)) * 0.08;
    this.rightPaddle.update();

    this.ball.update(this.leftPaddle, this.rightPaddle);

    if (
      this.leftPaddle.score >= WINNING_SCORE ||
      this.rightPaddle.score >= WINNING_SCORE
    ) {
      this.gameOver = true;
      this.winner = this.leftPaddle.score >= WINNING_SCORE ? "Player 1" : "CPU";
    }
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }

  handleKeyDown(e) {
    if (this.gameOver && e.key === "r") {
      this.resetGame();
      return;
    }
    switch (e.key) {
      case "w":
        this.leftPaddle.dy = -PADDLE_SPEED;
        break;
      case "s":
        this.leftPaddle.dy = PADDLE_SPEED;
        break;
    }
  }

  handleKeyUp(e) {
    switch (e.key) {
      case "w":
      case "s":
        this.leftPaddle.dy = 0;
        break;
    }
  }

  drawGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "24px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = "20px 'Press Start 2P'";
    ctx.fillText(`${this.winner} wins!`, canvas.width / 2, canvas.height / 2);

    ctx.font = "12px 'Press Start 2P'";
    ctx.fillText(
      "Press 'r' to play again",
      canvas.width / 2,
      canvas.height / 2 + 40
    );
  }

  resetGame() {
    this.leftPaddle.score = 0;
    this.rightPaddle.score = 0;
    leftScoreElement.textContent = this.leftPaddle.score.toString();
    rightScoreElement.textContent = this.rightPaddle.score.toString();
    this.gameOver = false;
    this.winner = null;
    this.leftPaddle.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
    this.ball.reset();
  }
}

// --- INITIALIZATION ---
if (
  canvas &&
  ctx &&
  leftScoreElement &&
  rightScoreElement &&
  upButton &&
  downButton &&
  startButton
) {
  // Add interactive button press effects
  const buttons = document.querySelectorAll(".button");
  const handlePress = (e) => {
    if (e.type === "touchstart") e.preventDefault();
    e.currentTarget.classList.add("pressed");
  };
  const handleRelease = (e) => {
    e.currentTarget.classList.remove("pressed");
  };
  buttons.forEach((button) => {
    button.addEventListener("mousedown", handlePress);
    button.addEventListener("mouseup", handleRelease);
    button.addEventListener("mouseleave", handleRelease);
    button.addEventListener("touchstart", handlePress, { passive: false });
    button.addEventListener("touchend", handleRelease);
    button.addEventListener("touchcancel", handleRelease);
  });

  let game = null;
  let gameRunning = false;

  function startOrRestartGame() {
    if (!gameRunning) {
      game = new Game();
      gameRunning = true;
      game.loop();
    } else if (game && game.gameOver) {
      game.resetGame();
    }
  }

  startButton.addEventListener("click", startOrRestartGame);
  startButton.addEventListener("touchstart", (e) => {
    e.preventDefault();
    startOrRestartGame();
  });
}
