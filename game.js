"use strict";

    /* Shared canvas, interface, and color constants. */
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const canvasWrap = document.getElementById("canvasWrap");
    const homeView = document.getElementById("homeView");
    const gameView = document.getElementById("gameView");
    const brandHomeButton = document.getElementById("brandHomeButton");
    const backButton = document.getElementById("backButton");
    const roomTitle = document.getElementById("roomTitle");
    const scoreValue = document.getElementById("scoreValue");
    const bestScore = document.getElementById("bestScore");
    const middleLabel = document.getElementById("middleLabel");
    const middleValue = document.getElementById("middleValue");
    const rightLabel = document.getElementById("rightLabel");
    const rightValue = document.getElementById("rightValue");
    const gameHelp = document.getElementById("gameHelp");
    const gameOverlay = document.getElementById("gameOverlay");
    const overlayKicker = document.getElementById("overlayKicker");
    const overlayTitle = document.getElementById("overlayTitle");
    const overlayCopy = document.getElementById("overlayCopy");
    const overlayButton = document.getElementById("overlayButton");
    const pauseButton = document.getElementById("pauseButton");
    const restartButton = document.getElementById("restartButton");

    const SIZE = 720;
    const COLORS = {
      green: "#0b3325",
      greenDeep: "#061f17",
      greenSoft: "#174d39",
      gold: "#c9a45c",
      goldLight: "#e6ca88",
      cream: "#f5f0e4",
      ink: "#111111",
      danger: "#9f4a3f"
    };

    const gameInfo = {
      snake: {
        title: "Aura Snake",
        intro: "Collect coffee beans, grow longer, and keep your cool.",
        help: "Arrow keys or WASD to steer. Swipe on the board on mobile.",
        middle: "Speed",
        right: "Beans"
      },
      catch: {
        title: "Bean Catch",
        intro: "Catch the golden beans. Let the burnt ones pass.",
        help: "Move with A/D or arrow keys. Drag anywhere on the board on mobile.",
        middle: "Time",
        right: "Lives"
      },
      memory: {
        title: "Oak Memory",
        intro: "Turn over the café tiles and find all eight matching pairs.",
        help: "Click or tap two tiles at a time. Match every pair with fewer moves.",
        middle: "Moves",
        right: "Pairs"
      },
      break: {
        title: "Espresso Break",
        intro: "Bounce the coffee bean and clear every café brick.",
        help: "Move with A/D or arrow keys. Drag on the board to guide the tray.",
        middle: "Lives",
        right: "Bricks"
      }
    };

    let activeId = null;
    let activeGame = null;
    let gameState = "menu";
    let animationId = null;
    let lastFrame = 0;
    let pointerDown = false;
    let pointerStart = { x: 0, y: 0 };

    function formatScore(value) {
      return String(Math.max(0, Math.round(value))).padStart(3, "0");
    }

    function loadBest(gameId) {
      try {
        const value = Number.parseInt(localStorage.getItem("auraArcade_" + gameId), 10);
        return Number.isFinite(value) ? value : 0;
      } catch (error) {
        return 0;
      }
    }

    function saveBest(gameId, value) {
      const current = loadBest(gameId);
      if (value <= current) {
        return current;
      }
      try {
        localStorage.setItem("auraArcade_" + gameId, String(Math.round(value)));
      } catch (error) {
        /* Storage can be unavailable in private browsing; gameplay still works. */
      }
      return Math.round(value);
    }

    function showHome() {
      cancelAnimationFrame(animationId);
      gameState = "menu";
      activeGame = null;
      activeId = null;
      homeView.classList.add("active");
      gameView.classList.remove("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function openGame(gameId) {
      activeId = gameId;
      const info = gameInfo[gameId];
      homeView.classList.remove("active");
      gameView.classList.add("active");
      roomTitle.textContent = info.title;
      middleLabel.textContent = info.middle;
      rightLabel.textContent = info.right;
      gameHelp.textContent = info.help;
      bestScore.textContent = formatScore(loadBest(gameId));
      scoreValue.textContent = "000";
      middleValue.textContent = "-";
      rightValue.textContent = "-";
      pauseButton.disabled = true;
      restartButton.disabled = true;
      pauseButton.textContent = "Pause";
      overlayKicker.textContent = "Aura & Oak presents";
      overlayTitle.textContent = info.title;
      overlayCopy.textContent = info.intro;
      overlayButton.textContent = "Start Game";
      gameOverlay.classList.remove("hidden");
      gameState = "ready";
      createActiveGame();
      activeGame.init();
      activeGame.draw();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function createActiveGame() {
      if (activeId === "snake") activeGame = createSnakeGame();
      if (activeId === "catch") activeGame = createCatchGame();
      if (activeId === "memory") activeGame = createMemoryGame();
      if (activeId === "break") activeGame = createBreakGame();
    }

    function startActiveGame() {
      cancelAnimationFrame(animationId);
      activeGame.init();
      gameState = "playing";
      gameOverlay.classList.add("hidden");
      pauseButton.disabled = activeId === "memory";
      restartButton.disabled = false;
      pauseButton.textContent = "Pause";
      lastFrame = performance.now();
      animationId = requestAnimationFrame(gameLoop);
    }

    function restartActiveGame() {
      startActiveGame();
    }

    function gameLoop(time) {
      if (gameState !== "playing" || !activeGame) {
        return;
      }
      const delta = Math.min((time - lastFrame) / 1000, 0.08);
      lastFrame = time;
      activeGame.update(delta);
      activeGame.draw();
      if (gameState === "playing") {
        animationId = requestAnimationFrame(gameLoop);
      }
    }

    function togglePause() {
      if (!activeGame || activeId === "memory") {
        return;
      }
      if (gameState === "playing") {
        gameState = "paused";
        cancelAnimationFrame(animationId);
        pauseButton.textContent = "Resume";
        activeGame.draw();
        drawPausePanel();
      } else if (gameState === "paused") {
        gameState = "playing";
        pauseButton.textContent = "Pause";
        lastFrame = performance.now();
        animationId = requestAnimationFrame(gameLoop);
      }
    }

    function finishGame(score, message) {
      cancelAnimationFrame(animationId);
      gameState = "over";
      const newBest = saveBest(activeId, score);
      bestScore.textContent = formatScore(newBest);
      scoreValue.textContent = formatScore(score);
      pauseButton.disabled = true;
      pauseButton.textContent = "Pause";
      overlayKicker.textContent = "Round complete";
      overlayTitle.textContent = message;
      overlayCopy.textContent = "Score " + Math.round(score) + ". Show your score at Aura & Oak for a surprise café reward.";
      overlayButton.textContent = "Play Again";
      gameOverlay.classList.remove("hidden");
    }

    function updateHud(score, middle, right) {
      scoreValue.textContent = formatScore(score);
      middleValue.textContent = String(middle);
      rightValue.textContent = String(right);
    }

    /* Shared premium board texture and canvas drawing helpers. */
    function drawBoard() {
      ctx.fillStyle = COLORS.green;
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.strokeStyle = "rgba(245, 240, 228, 0.035)";
      ctx.lineWidth = 1;
      for (let p = 30; p < SIZE; p += 30) {
        ctx.beginPath();
        ctx.moveTo(p + 0.5, 0);
        ctx.lineTo(p + 0.5, SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, p + 0.5);
        ctx.lineTo(SIZE, p + 0.5);
        ctx.stroke();
      }
      const vignette = ctx.createRadialGradient(360, 330, 100, 360, 360, 530);
      vignette.addColorStop(0, "rgba(23, 77, 57, 0.13)");
      vignette.addColorStop(1, "rgba(6, 31, 23, 0.45)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, SIZE, SIZE);
      drawSprig(42, 55, 1, 1);
      drawSprig(678, 665, -1, -1);
    }

    function drawSprig(x, y, sx, sy) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sx, sy);
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = COLORS.gold;
      ctx.fillStyle = COLORS.gold;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(30, 34, 82, 83);
      ctx.stroke();
      [[18, 17, -0.6], [37, 37, 0.75], [57, 56, -0.5], [73, 73, 0.75]].forEach((leaf) => {
        ctx.save();
        ctx.translate(leaf[0], leaf[1]);
        ctx.rotate(leaf[2]);
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      ctx.restore();
    }

    function roundedRect(x, y, width, height, radius) {
      const r = Math.min(radius, width / 2, height / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + width, y, x + width, y + height, r);
      ctx.arcTo(x + width, y + height, x, y + height, r);
      ctx.arcTo(x, y + height, x, y, r);
      ctx.arcTo(x, y, x + width, y, r);
      ctx.closePath();
    }

    function drawBean(x, y, scale, burnt) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.46);
      ctx.fillStyle = burnt ? COLORS.danger : COLORS.gold;
      ctx.shadowColor = burnt ? "rgba(159, 74, 63, 0.4)" : "rgba(201, 164, 92, 0.45)";
      ctx.shadowBlur = 10 * scale;
      ctx.beginPath();
      ctx.ellipse(0, 0, 12 * scale, 17 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = burnt ? COLORS.ink : COLORS.greenDeep;
      ctx.lineWidth = Math.max(1.6, 2.1 * scale);
      ctx.beginPath();
      ctx.moveTo(0, -13 * scale);
      ctx.bezierCurveTo(-7 * scale, -5 * scale, 7 * scale, 5 * scale, 0, 13 * scale);
      ctx.stroke();
      ctx.restore();
    }

    function drawCup(x, y, scale) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = COLORS.cream;
      roundedRect(-42, -24, 84, 45, 10);
      ctx.fill();
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(42, -4, 18, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.fillStyle = COLORS.greenDeep;
      ctx.beginPath();
      ctx.ellipse(0, -23, 35, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath();
      ctx.ellipse(0, -23, 28, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawPausePanel() {
      ctx.fillStyle = "rgba(6, 31, 23, 0.72)";
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = COLORS.cream;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "500 66px Georgia";
      ctx.fillText("Paused", SIZE / 2, SIZE / 2 - 14);
      ctx.fillStyle = COLORS.goldLight;
      ctx.font = "700 15px Arial";
      ctx.fillText("YOUR COFFEE IS STILL WARM", SIZE / 2, SIZE / 2 + 45);
    }

    /* Game 1: the original grid-based Aura Snake. */
    function createSnakeGame() {
      const grid = 24;
      const cell = SIZE / grid;
      let snake;
      let bean;
      let direction;
      let queued;
      let score;
      let beans;
      let moveTime;
      let accumulator;

      function spawnBean() {
        const free = [];
        for (let y = 0; y < grid; y += 1) {
          for (let x = 0; x < grid; x += 1) {
            if (!snake.some((part) => part.x === x && part.y === y)) free.push({ x, y });
          }
        }
        bean = free[Math.floor(Math.random() * free.length)];
      }

      function init() {
        snake = [{ x: 12, y: 12 }, { x: 11, y: 12 }, { x: 10, y: 12 }, { x: 9, y: 12 }];
        direction = { x: 1, y: 0 };
        queued = { x: 1, y: 0 };
        score = 0;
        beans = 0;
        moveTime = 0.14;
        accumulator = 0;
        spawnBean();
        updateHud(score, "1x", beans);
      }

      function step() {
        direction = queued;
        const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
        const eating = head.x === bean.x && head.y === bean.y;
        const checkLength = eating ? snake.length : snake.length - 1;
        const hitBody = snake.slice(0, checkLength).some((part) => part.x === head.x && part.y === head.y);
        if (head.x < 0 || head.x >= grid || head.y < 0 || head.y >= grid || hitBody) {
          finishGame(score, "Game Over");
          return;
        }
        snake.unshift(head);
        if (eating) {
          beans += 1;
          score += 10;
          if (beans % 5 === 0) moveTime = Math.max(0.062, moveTime - 0.012);
          spawnBean();
        } else {
          snake.pop();
        }
        const speed = (0.14 / moveTime).toFixed(1).replace(".0", "") + "x";
        updateHud(score, speed, beans);
      }

      function update(delta) {
        accumulator += delta;
        while (accumulator >= moveTime && gameState === "playing") {
          accumulator -= moveTime;
          step();
        }
      }

      function draw() {
        drawBoard();
        drawBean(bean.x * cell + cell / 2, bean.y * cell + cell / 2, 0.9, false);
        snake.forEach((part, index) => {
          const x = part.x * cell;
          const y = part.y * cell;
          const inset = index === 0 ? 2 : 3.2;
          const gradient = ctx.createLinearGradient(x, y, x + cell, y + cell);
          gradient.addColorStop(0, index === 0 ? COLORS.cream : COLORS.goldLight);
          gradient.addColorStop(1, COLORS.gold);
          ctx.fillStyle = gradient;
          roundedRect(x + inset, y + inset, cell - inset * 2, cell - inset * 2, index === 0 ? 8 : 6);
          ctx.fill();
          if (index === 0) {
            ctx.fillStyle = COLORS.greenDeep;
            const cx = x + cell / 2;
            const cy = y + cell / 2;
            [-1, 1].forEach((side) => {
              ctx.beginPath();
              ctx.arc(
                cx + direction.x * 6 + (direction.y ? side * 6 : 0),
                cy + direction.y * 6 + (direction.x ? side * 6 : 0),
                2,
                0,
                Math.PI * 2
              );
              ctx.fill();
            });
          }
        });
      }

      function setDirection(x, y) {
        if (x === -direction.x && y === -direction.y) return;
        queued = { x, y };
      }

      return {
        init,
        update,
        draw,
        key(key) {
          const controls = {
            arrowup: [0, -1], w: [0, -1],
            arrowdown: [0, 1], s: [0, 1],
            arrowleft: [-1, 0], a: [-1, 0],
            arrowright: [1, 0], d: [1, 0]
          };
          if (controls[key]) setDirection(controls[key][0], controls[key][1]);
        },
        swipe(dx, dy) {
          if (Math.abs(dx) > Math.abs(dy)) setDirection(dx > 0 ? 1 : -1, 0);
          else setDirection(0, dy > 0 ? 1 : -1);
        },
        pointer() {}
      };
    }

    /* Game 2: timed falling-bean catcher with good and burnt beans. */
    function createCatchGame() {
      let playerX;
      let items;
      let score;
      let lives;
      let timeLeft;
      let spawnTimer;
      let left;
      let right;

      function init() {
        playerX = SIZE / 2;
        items = [];
        score = 0;
        lives = 3;
        timeLeft = 45;
        spawnTimer = 0.3;
        left = false;
        right = false;
        updateHud(score, Math.ceil(timeLeft) + "s", "♥".repeat(lives));
      }

      function update(delta) {
        if (left) playerX -= 390 * delta;
        if (right) playerX += 390 * delta;
        playerX = Math.max(65, Math.min(SIZE - 76, playerX));
        timeLeft -= delta;
        spawnTimer -= delta;
        if (spawnTimer <= 0) {
          const burnt = Math.random() < 0.23;
          items.push({
            x: 42 + Math.random() * (SIZE - 84),
            y: -25,
            speed: 180 + Math.random() * 95 + score * 0.45,
            burnt,
            spin: Math.random() * Math.PI * 2
          });
          spawnTimer = Math.max(0.28, 0.72 - score * 0.002);
        }

        items.forEach((item) => {
          item.y += item.speed * delta;
          item.spin += delta * 2;
        });

        items = items.filter((item) => {
          const caught = item.y > 615 && item.y < 690 && Math.abs(item.x - playerX) < 63;
          if (caught) {
            if (item.burnt) lives -= 1;
            else score += 10;
            return false;
          }
          return item.y < SIZE + 40;
        });

        updateHud(score, Math.max(0, Math.ceil(timeLeft)) + "s", "♥".repeat(Math.max(0, lives)));
        if (lives <= 0 || timeLeft <= 0) finishGame(score, lives <= 0 ? "Cup Spilled" : "Time's Up");
      }

      function draw() {
        drawBoard();
        ctx.fillStyle = "rgba(201, 164, 92, 0.08)";
        ctx.fillRect(0, 590, SIZE, 130);
        ctx.strokeStyle = "rgba(201, 164, 92, 0.28)";
        ctx.setLineDash([8, 9]);
        ctx.beginPath();
        ctx.moveTo(0, 590);
        ctx.lineTo(SIZE, 590);
        ctx.stroke();
        ctx.setLineDash([]);
        items.forEach((item) => drawBean(item.x, item.y, 1.15, item.burnt));
        drawCup(playerX, 655, 1.05);
      }

      return {
        init,
        update,
        draw,
        key(key, pressed) {
          if (key === "arrowleft" || key === "a") left = pressed;
          if (key === "arrowright" || key === "d") right = pressed;
        },
        pointer(x) {
          playerX = Math.max(65, Math.min(SIZE - 76, x));
        },
        swipe() {}
      };
    }

    /* Game 3: a complete 4x4 matching game drawn entirely on canvas. */
    function createMemoryGame() {
      const icons = [0, 1, 2, 3, 4, 5, 6, 7];
      const cardSize = 126;
      const gap = 18;
      const offset = 81;
      let cards;
      let selected;
      let matched;
      let moves;
      let score;
      let locked;
      let mismatchTimer;

      function shuffle(values) {
        for (let i = values.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [values[i], values[j]] = [values[j], values[i]];
        }
        return values;
      }

      function init() {
        cards = shuffle([...icons, ...icons]).map((icon) => ({ icon, open: false, matched: false }));
        selected = [];
        matched = 0;
        moves = 0;
        score = 1000;
        locked = false;
        mismatchTimer = 0;
        updateHud(score, moves, matched + "/8");
      }

      function update(delta) {
        score = Math.max(100, score - delta * 3);
        if (locked) {
          mismatchTimer -= delta;
          if (mismatchTimer <= 0) {
            selected.forEach((index) => { cards[index].open = false; });
            selected = [];
            locked = false;
          }
        }
        updateHud(score, moves, matched + "/8");
      }

      function pick(x, y) {
        if (locked || gameState !== "playing") return;
        const col = Math.floor((x - offset) / (cardSize + gap));
        const row = Math.floor((y - offset) / (cardSize + gap));
        if (col < 0 || col > 3 || row < 0 || row > 3) return;
        const localX = (x - offset) % (cardSize + gap);
        const localY = (y - offset) % (cardSize + gap);
        if (localX > cardSize || localY > cardSize) return;
        const index = row * 4 + col;
        const card = cards[index];
        if (card.open || card.matched) return;
        card.open = true;
        selected.push(index);
        if (selected.length === 2) {
          moves += 1;
          if (cards[selected[0]].icon === cards[selected[1]].icon) {
            cards[selected[0]].matched = true;
            cards[selected[1]].matched = true;
            selected = [];
            matched += 1;
            score += 80;
            if (matched === 8) {
              updateHud(score, moves, "8/8");
              setTimeout(() => finishGame(score, "Perfect Pair"), 220);
            }
          } else {
            score = Math.max(100, score - 25);
            locked = true;
            mismatchTimer = 0.65;
          }
        }
      }

      function drawIcon(icon, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = COLORS.greenDeep;
        ctx.fillStyle = COLORS.greenDeep;
        ctx.lineWidth = 5;
        if (icon === 0) {
          drawBean(0, 0, 1.45, false);
        } else if (icon === 1) {
          ctx.fillStyle = COLORS.greenDeep;
          roundedRect(-28, -19, 52, 38, 8);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(26, 0, 13, -Math.PI / 2, Math.PI / 2);
          ctx.stroke();
        } else if (icon === 2) {
          ctx.beginPath();
          ctx.ellipse(0, 0, 13, 30, -0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = COLORS.gold;
          ctx.beginPath();
          ctx.moveTo(-17, 18);
          ctx.lineTo(18, -20);
          ctx.stroke();
        } else if (icon === 3) {
          ctx.beginPath();
          ctx.arc(0, 0, 24, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.stroke();
        } else if (icon === 4) {
          ctx.beginPath();
          ctx.moveTo(-28, 17);
          ctx.quadraticCurveTo(0, -38, 28, 17);
          ctx.closePath();
          ctx.fill();
        } else if (icon === 5) {
          ctx.beginPath();
          ctx.moveTo(-27, 20);
          ctx.lineTo(-17, -22);
          ctx.lineTo(18, -22);
          ctx.lineTo(28, 20);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-12, -32);
          ctx.lineTo(12, -32);
          ctx.stroke();
        } else if (icon === 6) {
          ctx.beginPath();
          ctx.arc(0, 4, 23, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-16, -13);
          ctx.quadraticCurveTo(0, -31, 16, -13);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -30);
          ctx.lineTo(9, -9);
          ctx.lineTo(31, -7);
          ctx.lineTo(14, 7);
          ctx.lineTo(19, 29);
          ctx.lineTo(0, 17);
          ctx.lineTo(-19, 29);
          ctx.lineTo(-14, 7);
          ctx.lineTo(-31, -7);
          ctx.lineTo(-9, -9);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      function draw() {
        drawBoard();
        cards.forEach((card, index) => {
          const col = index % 4;
          const row = Math.floor(index / 4);
          const x = offset + col * (cardSize + gap);
          const y = offset + row * (cardSize + gap);
          const showing = card.open || card.matched;
          ctx.fillStyle = showing ? (card.matched ? COLORS.goldLight : COLORS.cream) : "rgba(201, 164, 92, 0.11)";
          ctx.strokeStyle = card.matched ? COLORS.cream : COLORS.gold;
          ctx.lineWidth = card.matched ? 3 : 2;
          roundedRect(x, y, cardSize, cardSize, 14);
          ctx.fill();
          ctx.stroke();
          if (showing) {
            drawIcon(card.icon, x + cardSize / 2, y + cardSize / 2);
          } else {
            ctx.fillStyle = COLORS.gold;
            ctx.globalAlpha = 0.34;
            ctx.beginPath();
            ctx.arc(x + cardSize / 2, y + cardSize / 2, 19, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        });
      }

      return {
        init,
        update,
        draw,
        pointer(x, y, isTap) {
          if (isTap) pick(x, y);
        },
        key() {},
        swipe() {}
      };
    }

    /* Game 4: brick-breaker using a coffee bean and serving tray. */
    function createBreakGame() {
      let paddle;
      let ball;
      let bricks;
      let score;
      let lives;
      let left;
      let right;
      let launchDelay;

      function resetBall() {
        ball = { x: paddle.x, y: 610, vx: 245 * (Math.random() < 0.5 ? -1 : 1), vy: -285, r: 12 };
        launchDelay = 0.65;
      }

      function init() {
        paddle = { x: SIZE / 2, y: 655, w: 122, h: 14 };
        bricks = [];
        for (let row = 0; row < 5; row += 1) {
          for (let col = 0; col < 8; col += 1) {
            bricks.push({
              x: 47 + col * 80,
              y: 80 + row * 45,
              w: 67,
              h: 27,
              alive: true,
              row
            });
          }
        }
        score = 0;
        lives = 3;
        left = false;
        right = false;
        resetBall();
        updateHud(score, "♥".repeat(lives), bricks.length);
      }

      function update(delta) {
        if (left) paddle.x -= 430 * delta;
        if (right) paddle.x += 430 * delta;
        paddle.x = Math.max(paddle.w / 2 + 12, Math.min(SIZE - paddle.w / 2 - 12, paddle.x));
        if (launchDelay > 0) {
          launchDelay -= delta;
          ball.x = paddle.x;
          return;
        }
        ball.x += ball.vx * delta;
        ball.y += ball.vy * delta;
        if (ball.x - ball.r <= 0 && ball.vx < 0) ball.vx *= -1;
        if (ball.x + ball.r >= SIZE && ball.vx > 0) ball.vx *= -1;
        if (ball.y - ball.r <= 0 && ball.vy < 0) ball.vy *= -1;

        const paddleTop = paddle.y - paddle.h / 2;
        if (
          ball.vy > 0 &&
          ball.y + ball.r >= paddleTop &&
          ball.y - ball.r <= paddle.y + paddle.h / 2 &&
          ball.x >= paddle.x - paddle.w / 2 &&
          ball.x <= paddle.x + paddle.w / 2
        ) {
          const hit = (ball.x - paddle.x) / (paddle.w / 2);
          const speed = Math.min(510, Math.hypot(ball.vx, ball.vy) + 8);
          ball.vx = speed * hit * 0.85;
          ball.vy = -Math.sqrt(Math.max(240 * 240, speed * speed - ball.vx * ball.vx));
          ball.y = paddleTop - ball.r;
        }

        for (const brick of bricks) {
          if (
            brick.alive &&
            ball.x + ball.r > brick.x &&
            ball.x - ball.r < brick.x + brick.w &&
            ball.y + ball.r > brick.y &&
            ball.y - ball.r < brick.y + brick.h
          ) {
            brick.alive = false;
            score += 10 + (4 - brick.row) * 2;
            const overlapLeft = ball.x + ball.r - brick.x;
            const overlapRight = brick.x + brick.w - (ball.x - ball.r);
            const overlapTop = ball.y + ball.r - brick.y;
            const overlapBottom = brick.y + brick.h - (ball.y - ball.r);
            if (Math.min(overlapLeft, overlapRight) < Math.min(overlapTop, overlapBottom)) ball.vx *= -1;
            else ball.vy *= -1;
            break;
          }
        }

        if (ball.y - ball.r > SIZE) {
          lives -= 1;
          if (lives <= 0) {
            finishGame(score, "Last Call");
            return;
          }
          resetBall();
        }

        const remaining = bricks.filter((brick) => brick.alive).length;
        updateHud(score, "♥".repeat(lives), remaining);
        if (remaining === 0) finishGame(score + lives * 100, "Café Cleared");
      }

      function draw() {
        drawBoard();
        bricks.forEach((brick) => {
          if (!brick.alive) return;
          const colors = [COLORS.cream, COLORS.goldLight, COLORS.gold, "#aa884d", "#806536"];
          ctx.fillStyle = colors[brick.row];
          ctx.globalAlpha = 0.92;
          roundedRect(brick.x, brick.y, brick.w, brick.h, 6);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = "rgba(6,31,23,0.18)";
          ctx.fillRect(brick.x + 8, brick.y + 7, brick.w - 16, 2);
        });
        ctx.fillStyle = COLORS.cream;
        ctx.shadowColor = "rgba(245,240,228,0.3)";
        ctx.shadowBlur = 10;
        roundedRect(paddle.x - paddle.w / 2, paddle.y - paddle.h / 2, paddle.w, paddle.h, 8);
        ctx.fill();
        ctx.shadowBlur = 0;
        drawBean(ball.x, ball.y, 0.88, false);
      }

      return {
        init,
        update,
        draw,
        key(key, pressed) {
          if (key === "arrowleft" || key === "a") left = pressed;
          if (key === "arrowright" || key === "d") right = pressed;
        },
        pointer(x) {
          paddle.x = Math.max(paddle.w / 2 + 12, Math.min(SIZE - paddle.w / 2 - 12, x));
        },
        swipe() {}
      };
    }

    function canvasPoint(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * (SIZE / rect.width),
        y: (event.clientY - rect.top) * (SIZE / rect.height)
      };
    }

    document.querySelectorAll(".game-card").forEach((button) => {
      button.addEventListener("click", () => openGame(button.dataset.game));
    });

    brandHomeButton.addEventListener("click", showHome);
    backButton.addEventListener("click", showHome);
    overlayButton.addEventListener("click", startActiveGame);
    pauseButton.addEventListener("click", togglePause);
    restartButton.addEventListener("click", restartActiveGame);

    document.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "].includes(key)) {
        event.preventDefault();
      }
      if (key === " " || key === "p") {
        togglePause();
      } else if (activeGame && gameState === "playing") {
        activeGame.key(key, true);
      } else if (key === "enter" && (gameState === "ready" || gameState === "over")) {
        startActiveGame();
      }
    });

    document.addEventListener("keyup", (event) => {
      if (activeGame && gameState === "playing") activeGame.key(event.key.toLowerCase(), false);
    });

    canvasWrap.addEventListener("pointerdown", (event) => {
      if (gameState !== "playing" || !activeGame) return;
      pointerDown = true;
      canvasWrap.setPointerCapture(event.pointerId);
      pointerStart = canvasPoint(event);
      activeGame.pointer(pointerStart.x, pointerStart.y, false);
    });

    canvasWrap.addEventListener("pointermove", (event) => {
      if (!pointerDown || gameState !== "playing" || !activeGame) return;
      const point = canvasPoint(event);
      activeGame.pointer(point.x, point.y, false);
    });

    canvasWrap.addEventListener("pointerup", (event) => {
      if (!pointerDown || !activeGame) return;
      pointerDown = false;
      const point = canvasPoint(event);
      const dx = point.x - pointerStart.x;
      const dy = point.y - pointerStart.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 28) activeGame.swipe(dx, dy);
      else activeGame.pointer(point.x, point.y, true);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && gameState === "playing" && activeId !== "memory") togglePause();
    });
