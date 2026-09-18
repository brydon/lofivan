const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');

const source = readFileSync(require.resolve('../dist/snake.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context);
const SnakeGame = vm.runInContext('SnakeGame', context);
const right = {x:1,y:0}, left = {x:-1,y:0}, up = {x:0,y:-1}, down = {x:0,y:1};
const position = game => [game.body[0].x, game.body[0].y];

test('waits for the player and stays still while paused or finished', () => {
  const game = new SnakeGame();
  for (const state of ['ready','paused','over','won']) {
    game.state = state;
    game.step();
    assert.deepEqual(position(game), [5,5]);
  }
});

test('eats, grows, scores, and spawns food outside the snake', () => {
  const game = new SnakeGame(() => 0);
  game.state = 'running';
  for (let step = 0; step < 5; step++) game.step();
  assert.deepEqual(position(game), [10,5]);
  assert.equal(game.score, 1);
  assert.equal(game.body.length, 4);
  assert.equal(game.body.some(part => part.x === game.food.x && part.y === game.food.y), false);
});

test('rejects reversals and buffers at most two distinct legal turns', () => {
  const game = new SnakeGame();
  game.state = 'running';
  game.turn(left);
  assert.equal(game.turns.length, 0);
  game.turn(up);
  game.turn(down);
  game.turn(up);
  game.turn(left);
  game.turn(down);
  assert.equal(game.turns.length, 2);
  game.step();
  assert.deepEqual(position(game), [5,4]);
  game.step();
  assert.deepEqual(position(game), [4,4]);
  assert.equal(game.state, 'running');
});

test('collides with all four walls without moving outside the board', () => {
  for (const [head, direction] of [[{x:15,y:5},right],[{x:0,y:5},left],[{x:5,y:0},up],[{x:5,y:9},down]]) {
    const game = new SnakeGame();
    game.body = [head];
    game.direction = direction;
    game.state = 'running';
    game.step();
    assert.equal(game.state, 'over');
    assert.deepEqual(position(game), [head.x,head.y]);
  }
});

test('collides with its body, but can enter the tail cell as it leaves', () => {
  const game = new SnakeGame();
  game.body = [{x:2,y:2},{x:2,y:3},{x:1,y:3},{x:1,y:2}];
  game.direction = left;
  game.state = 'running';
  game.step();
  assert.equal(game.state, 'running');
  assert.deepEqual(position(game), [1,2]);

  game.body = [{x:2,y:2},{x:2,y:3},{x:1,y:3},{x:1,y:2},{x:1,y:1}];
  game.step();
  assert.equal(game.state, 'over');
});

test('finishing the board wins instead of hanging while placing food', () => {
  const game = new SnakeGame();
  game.body = [{x:1,y:0}];
  for (let y = 0; y < game.rows; y++) {
    for (let x = 0; x < game.columns; x++) {
      if (y !== 0 || x > 1) game.body.push({x,y});
    }
  }
  game.food = {x:0,y:0};
  game.direction = left;
  game.state = 'running';
  game.step();
  assert.equal(game.state, 'won');
  assert.equal(game.body.length, 160);
  assert.equal(game.food, null);
});

// A controllable clock verifies gesture/timer cleanup without real delays.
function controllerHarness() {
  const timers = new Map(), exits = [], events = new Map();
  let nextTimer = 0;
  const element = name => ({
    hidden:true, textContent:'', focus() {},
    addEventListener(type, callback) { events.set(`${name}:${type}`, callback); },
    setAttribute() {}
  });
  const canvas = {...element('canvas'), width:192, height:120,
    getContext:() => ({fillRect() {}})};
  const nodes = {
    canvas, '.snake-message':element('message'), '#snake-score':element('score'),
    '.snake-board':element('board')
  };
  const root = {...element('root'), querySelector:selector => nodes[selector]};
  const document = {...element('document'), hidden:false, body:{classList:{contains:() => false}}};
  const scope = vm.createContext({document, window:element('window'), matchMedia:() => ({matches:false}),
    setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, {callback,delay}); return id; },
    clearTimeout(id) { timers.delete(id); }
  });
  vm.runInContext(source, scope);
  const Controller = vm.runInContext('TerminalSnake', scope);
  const controller = new Controller(root, (score, focus) => exits.push({score,focus}));
  controller.start();
  const pointer = (x = 20, y = 20) => ({isPrimary:true,button:0,pointerId:1,clientX:x,clientY:y,
    preventDefault() {}, currentTarget:{setPointerCapture() {}}});
  const fire = id => { const timer = timers.get(id); assert.ok(timer); timers.delete(id); timer.callback(); };
  return {controller,timers,exits,events,document,root,pointer,fire};
}

test('starts once, pauses on focus loss, and cancels timers on exit', () => {
  const {controller:c,timers,events,exits,fire,root} = controllerHarness();
  assert.equal(timers.size, 0);
  c.play(); c.play();
  assert.equal(timers.size, 1);
  fire(c.timer);
  assert.deepEqual(position(c.game), [6,5]);
  assert.equal(timers.size, 1);
  events.get('root:blur')();
  assert.equal(c.game.state, 'paused');
  assert.equal(timers.size, 0);
  c.play(); c.quit();
  assert.equal(c.active, false);
  assert.equal(root.hidden, true);
  assert.equal(timers.size, 0);
  assert.deepEqual(exits, [{score:0,focus:true}]);
});

test('tap starts/pauses/replays; swipes steer and cancel the hold-to-quit timer', () => {
  const {controller:c,timers,pointer,fire} = controllerHarness();
  c.pointerdown(pointer()); c.pointerup(pointer());
  assert.equal(c.game.state, 'running');
  c.pointerdown(pointer()); c.pointerup(pointer());
  assert.equal(c.game.state, 'paused');
  assert.equal(timers.size, 0);
  c.pointerdown(pointer()); c.pointermove(pointer(20,0)); c.pointerup(pointer(20,0));
  assert.equal(timers.size, 1);
  assert.equal(c.game.state, 'running');
  fire(c.timer);
  assert.deepEqual(position(c.game), [5,4]);
  while (c.game.state === 'running') fire(c.timer);
  assert.equal(c.game.state, 'over');
  assert.equal(timers.size, 0);
  c.pointerdown(pointer()); c.pointerup(pointer());
  assert.equal(c.game.state, 'running');
  assert.deepEqual(position(c.game), [5,5]);
  assert.equal(timers.size, 1);
});

test('hold quits without summoning the phone keyboard; cancelled gestures cannot quit', () => {
  const {controller:c,timers,exits,pointer,fire,events} = controllerHarness();
  c.pointerdown(pointer());
  events.get('board:pointercancel')();
  assert.equal(timers.size, 0);
  c.pointerdown(pointer());
  assert.equal(timers.get(c.holdTimer).delay, 650);
  fire(c.holdTimer);
  c.pointerup(pointer());
  assert.equal(c.active, false);
  assert.equal(timers.size, 0);
  assert.deepEqual(exits, [{score:0,focus:false}]);
});

test('hiding the page cancels a pending hold and pauses without automatically resuming', () => {
  const {controller:c,timers,events,document,pointer} = controllerHarness();
  c.play(); c.pointerdown(pointer());
  assert.equal(timers.size, 2);
  document.hidden = true;
  events.get('document:visibilitychange')();
  assert.equal(c.game.state, 'paused');
  assert.equal(timers.size, 0);
  c.play();
  assert.equal(c.game.state, 'paused');
  document.hidden = false;
  events.get('document:visibilitychange')();
  assert.equal(c.game.state, 'paused');
});

test('Escape blurs, while Q and Ctrl-C return keyboard focus to the shell', () => {
  for (const [key,ctrlKey,focus] of [['Escape',false,false],['q',false,true],['c',true,true]]) {
    const {controller:c,exits,timers} = controllerHarness();
    c.play();
    let prevented = false, stopped = false;
    c.keydown({key,ctrlKey,preventDefault() { prevented = true; },stopPropagation() { stopped = true; }});
    assert.equal(prevented && stopped, true);
    assert.equal(timers.size, 0);
    assert.deepEqual(exits, [{score:0,focus}]);
  }
});
