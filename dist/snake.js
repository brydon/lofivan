'use strict';

// The board uses fixed cells, independent of the CRT's responsive transforms.
class SnakeGame {
  constructor(random = Math.random) {
    this.random = random;
    this.columns = 16;
    this.rows = 10;
    this.body = [{x:5,y:5}, {x:4,y:5}, {x:3,y:5}];
    this.direction = {x:1,y:0};
    this.turns = [];
    this.food = {x:10,y:5};
    this.score = 0;
    this.state = 'ready';
  }

  turn(direction) {
    const previous = this.turns.at(-1) || this.direction;
    if (this.turns.length >= 2 || (direction.x === previous.x && direction.y === previous.y)
      || (direction.x === -previous.x && direction.y === -previous.y)) return;
    this.turns.push(direction);
  }

  placeFood() {
    const free = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        if (!this.body.some(cell => cell.x === x && cell.y === y)) free.push({x,y});
      }
    }
    this.food = free[Math.floor(this.random() * free.length)] || null;
    if (!this.food) this.state = 'won';
  }

  step() {
    if (this.state !== 'running') return;
    this.direction = this.turns.shift() || this.direction;
    const head = {x:this.body[0].x + this.direction.x, y:this.body[0].y + this.direction.y};
    const eating = head.x === this.food.x && head.y === this.food.y;
    // Moving into the departing tail is safe, unless this move grows the snake.
    const occupied = eating ? this.body : this.body.slice(0, -1);
    if (head.x < 0 || head.y < 0 || head.x >= this.columns || head.y >= this.rows
      || occupied.some(cell => cell.x === head.x && cell.y === head.y)) {
      this.state = 'over';
      return;
    }
    this.body.unshift(head);
    if (eating) { this.score++; this.placeFood(); }
    else this.body.pop();
  }
}

class TerminalSnake {
  constructor(element, onExit) {
    this.element = element;
    this.onExit = onExit;
    this.canvas = element.querySelector('canvas');
    this.context = this.canvas.getContext('2d');
    this.message = element.querySelector('.snake-message');
    this.score = element.querySelector('#snake-score');
    this.active = false;
    this.timer = null;
    this.gesture = null;
    this.holdTimer = null;

    element.addEventListener('keydown', event => this.keydown(event));
    element.addEventListener('blur', () => { this.cancelGesture(); this.pause(); });
    element.addEventListener('click', event => event.stopPropagation());
    element.addEventListener('contextmenu', event => event.preventDefault());
    const board = element.querySelector('.snake-board');
    board.addEventListener('pointerdown', event => this.pointerdown(event));
    board.addEventListener('pointermove', event => this.pointermove(event));
    board.addEventListener('pointerup', event => this.pointerup(event));
    for (const type of ['pointercancel','lostpointercapture']) board.addEventListener(type, () => this.cancelGesture());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { this.cancelGesture(); this.pause(); }
    });
    window.addEventListener('blur', () => { this.cancelGesture(); this.pause(); });
    window.addEventListener('pagehide', () => { this.cancelGesture(); this.pause(); });
  }

  start() {
    clearTimeout(this.timer);
    this.cancelGesture();
    this.game = new SnakeGame();
    this.active = true;
    this.element.hidden = false;
    this.element.focus({preventScroll:true});
    this.render();
  }

  quit(focusShell = true) {
    if (!this.active) return;
    clearTimeout(this.timer);
    this.cancelGesture();
    this.active = false;
    this.element.hidden = true;
    this.onExit(this.game.score, focusShell);
  }

  pause() {
    if (!this.active || this.game.state !== 'running') return;
    clearTimeout(this.timer);
    this.game.state = 'paused';
    this.render();
  }

  play() {
    if (!this.active || document.hidden) return;
    if (['over','won'].includes(this.game.state)) this.game = new SnakeGame();
    if (this.game.state === 'running') return;
    this.game.state = 'running';
    this.render();
    this.schedule();
  }

  schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (!this.active || this.game.state !== 'running') return;
      this.game.step();
      this.render();
      if (this.game.state === 'running') this.schedule();
    }, Math.max(110, 220 - this.game.score * 6));
  }

  steer(direction) {
    if (['over','won'].includes(this.game.state)) return;
    this.game.turn(direction);
    this.play();
  }

  keydown(event) {
    if (!this.active || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === 'escape' || key === 'q' || (event.ctrlKey && key === 'c')) {
      event.preventDefault(); event.stopPropagation();
      this.quit(key !== 'escape');
      return;
    }
    if (event.ctrlKey) return;
    const directions = {
      arrowup:{x:0,y:-1}, w:{x:0,y:-1}, arrowdown:{x:0,y:1}, s:{x:0,y:1},
      arrowleft:{x:-1,y:0}, a:{x:-1,y:0}, arrowright:{x:1,y:0}, d:{x:1,y:0}
    };
    if (!directions[key] && ![' ', 'enter', 'p'].includes(key)) return;
    event.preventDefault(); event.stopPropagation();
    if (event.repeat) return;
    if (directions[key]) this.steer(directions[key]);
    else if (this.game.state === 'running') this.pause();
    else this.play();
  }

  pointerdown(event) {
    if (!this.active || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    this.element.focus({preventScroll:true});
    this.cancelGesture();
    this.gesture = {id:event.pointerId, x:event.clientX, y:event.clientY, swiped:false};
    event.currentTarget.setPointerCapture(event.pointerId);
    this.holdTimer = setTimeout(() => this.quit(false), 650);
  }

  pointermove(event) {
    const gesture = this.gesture;
    if (!gesture || gesture.id !== event.pointerId || gesture.swiped) return;
    const x = event.clientX - gesture.x, y = event.clientY - gesture.y;
    if (Math.max(Math.abs(x), Math.abs(y)) < 10) return;
    clearTimeout(this.holdTimer);
    gesture.swiped = true;
    this.steer(Math.abs(x) > Math.abs(y) ? {x:Math.sign(x),y:0} : {x:0,y:Math.sign(y)});
  }

  pointerup(event) {
    if (!this.gesture || this.gesture.id !== event.pointerId) return;
    const swiped = this.gesture.swiped;
    this.cancelGesture();
    if (!swiped) {
      if (this.game.state === 'running') this.pause();
      else this.play();
    }
  }

  cancelGesture() {
    clearTimeout(this.holdTimer);
    this.gesture = null;
  }

  render() {
    const {game, context:ctx, canvas} = this;
    const cell = 12;
    ctx.fillStyle = '#0c271c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#c5e1b30b';
    for (let y = 0; y < game.rows; y++) {
      for (let x = 0; x < game.columns; x++) ctx.fillRect(x * cell + 5, y * cell + 5, 1, 1);
    }
    if (game.food) {
      const x = game.food.x * cell, y = game.food.y * cell;
      ctx.fillStyle = '#ecd99c';
      ctx.fillRect(x + 4, y + 2, 4, 8);
      ctx.fillRect(x + 2, y + 4, 8, 4);
    }
    game.body.forEach((part, index) => {
      ctx.fillStyle = index ? '#91b578' : '#d6eab9';
      ctx.fillRect(part.x * cell + 1, part.y * cell + 1, 10, 10);
    });
    const head = game.body[0], {x:dx,y:dy} = game.direction;
    ctx.fillStyle = '#163727';
    for (const side of [-1,1]) {
      ctx.fillRect(head.x * cell + 5 + dx * 3 + dy * side * 2,
        head.y * cell + 5 + dy * 3 + dx * side * 2, 2, 2);
    }
    this.score.textContent = String(game.score).padStart(2, '0');
    this.score.setAttribute('aria-label', `Score: ${game.score}`);
    const touch = matchMedia('(pointer: coarse)').matches || document.body.classList.contains('compact-room');
    const instruction = touch ? 'tap or swipe to start' : 'enter or arrows to start';
    const messages = {
      ready:instruction, paused:touch ? 'paused · tap to resume' : 'paused · space to resume',
      over:touch ? 'game over · tap to retry' : 'game over · enter to retry',
      won:touch ? 'you win! · tap to replay' : 'you win! · enter to replay', running:''
    };
    const message = messages[game.state];
    if (this.message.textContent !== message) this.message.textContent = message;
    this.message.hidden = !message;
    this.canvas.setAttribute('aria-label', `Snake playing field. Score: ${game.score}. ${game.state}.`);
  }
}
