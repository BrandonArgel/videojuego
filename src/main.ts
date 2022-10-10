import { CELLS, images, initialCoins, Map, mapSize, Vector2d } from './maps';
import './style.css'

type GAME_STATE = "PLAYING" | "PAUSED" | "GAME_OVER" | "GAME_WON";
type TIME_STAMPS = { start: number, pause: number }

const initial_health = 1;
const initial_time = 100;
const levels = 10;
const maps: Array<CELLS[]> = [];

let gameState: GAME_STATE = 'PLAYING';
let level: number = 0;
let coins: number = 0;
let health: number = initial_health;
let time: number = initial_time;
let interval: number;

class Game {
  canvas: Canvas = new Canvas()
  player: Player = new Player()
  info: Info = new Info()
  buttons: Buttons = new Buttons()
  timeStamps: TIME_STAMPS = {
    start: Date.now(),
    pause: Date.now()
  }
  startTouch = new Vector2d();

  constructor() {
    const canvas: Canvas = new Canvas();

    this.canvas = canvas;

  }

  // Función que se llama para iniciar el juego.
  start() {
    this.canvas.resize(this.player);
    this.info.show();
  }

  pause() {
    if (gameState == 'PLAYING' || gameState == 'PAUSED') {
      if (gameState == 'PLAYING') {
        this.timeStamps.pause = Date.now();
        gameState = 'PAUSED';
      }
      else {
        this.timeStamps.start += (Date.now() - this.timeStamps.pause);
        gameState = 'PLAYING';
      }
      this.buttons.updatePause();
      this.canvas.drawLevel(this.player);
    }
  }

  end(type: GAME_STATE) {
    gameState = type;
    clearInterval(interval);
    if (type == 'GAME_WON') this.info.updateRecordTime();
    this.buttons.updateRestartAndMenu();
  }

  automaticFunction() {
    if (gameState == 'PLAYING') {
      time = Number((initial_time - ((Date.now() - this.timeStamps.start) / 1000)).toFixed(1));
      if (time <= 0) {
        this.end('GAME_OVER');
        this.canvas.drawLevel(this.player);
      }
      this.info.updateTime();
    }
  }
  handleMovement(amount: Vector2d, unit: boolean) {
    if (gameState == 'PLAYING') {
      let key = unit ? this.player.moveUnit(amount) : this.player.move(amount);
      if (key == 'WALL') {
        health--;
        if (health == 0) this.end('GAME_OVER');
      }
      else if (key == 'COIN') {
        health++;
        coins++;
      }
      else if (key == 'END' && coins == initialCoins) {
        if (level == levels - 1) this.end('GAME_WON');
        else {
          coins = 0;
          level++;
        }
      }
      this.info.show();
      this.canvas.drawLevel(this.player);
    }
  }

  readKeyInput(event: KeyboardEvent) {
    if (event.key == 'w' || event.key == 'W')
      return this.handleMovement(new Vector2d(0, -1), event.key == 'w');
    if (event.key == 'd' || event.key == 'D')
      return this.handleMovement(new Vector2d(1, 0), event.key == 'd');
    if (event.key == 's' || event.key == 'S')
      return this.handleMovement(new Vector2d(0, 1), event.key == 's');
    if (event.key == 'a' || event.key == 'A')
      return this.handleMovement(new Vector2d(-1, 0), event.key == 'a');
    if (event.key == 'Escape')
      return this.pause();
  }

  getStartTouch(e: TouchEvent) {
    if (gameState == 'PLAYING') {
      this.startTouch.x = e.changedTouches[0].screenX;
      this.startTouch.y = e.changedTouches[0].screenY;
    }

  }

  handleTouchMovement(e: TouchEvent) {
    if (gameState == 'PLAYING') {
      let end_touch = new Vector2d();
      end_touch.x = e.changedTouches[0].screenX;
      end_touch.y = e.changedTouches[0].screenY;

      if (20 < Math.sqrt((end_touch.x - this.startTouch.x) ** 2 + (end_touch.y - this.startTouch.y) ** 2)) {
        let absX = Math.abs(end_touch.x - this.startTouch.x);
        let absY = Math.abs(end_touch.y - this.startTouch.y);
        let amount;
        if (absX < absY)
          amount = this.startTouch.y < end_touch.y ? new Vector2d(0, 1) : new Vector2d(0, -1);
        else
          amount = this.startTouch.x < end_touch.x ? new Vector2d(1, 0) : new Vector2d(-1, 0);
        this.handleMovement(amount, !this.buttons.power.classList.contains('active'));
      }
    }
  }
}

class Canvas {
  selector = document.getElementById('game') as HTMLCanvasElement;
  context = this.selector.getContext('2d') as CanvasRenderingContext2D;
  size: number = 0;
  elementSize: number = 0;

  resize(player: Player) {
    let scale = window.innerWidth < 768 ? 0.9 : 0.7;
    this.size = Math.min(window.innerWidth, window.innerHeight) * scale;
    this.selector.setAttribute('width', `${this.size}px`);
    this.selector.setAttribute('height', `${this.size}px`);
    this.elementSize = this.size / mapSize;
    // Se dibuja el mapa cada vez que se redimensiona la ventana.
    this.drawLevel(player);
  }

  // Función que dibuja un emoji en el canvas.
  // Recibe la posición y la llave del elemento.
  drawEmoji(position: Vector2d, key: string) {
    position = position.scale(this.elementSize);
    if (key == 'EMPTY' || key == 'START' || key == 'WALL' || key == 'BLOCK') {
      this.context.fillStyle = key == 'EMPTY' || key == 'START' ? 'whitesmoke' :
        key == 'WALL' ? '#005683' : 'black';
      this.context.fillRect(position.x, position.y, this.elementSize, this.elementSize);
    } else {
      this.context.drawImage(images[key], position.x, position.y, this.elementSize, this.elementSize);
    }
  }
  // Función que dibuja un mapa.
  // Recibe al objeto que representa al jugador.
  drawLevel(player: Player) {
    this.context.clearRect(0, 0, this.size, this.size);
    for (let y = 0; y < mapSize; y++)
      for (let x = 0; x < mapSize; x++) {
        let pos = new Vector2d(x, y);
        // Si no está en pausa, se dibuja el mapa.
        if (gameState != 'PAUSED') {
          const key = maps[level][pos.getIndex()];
          this.drawEmoji(pos, key);
          // Si la posición del jugador no es válida, se asigna la posición de inicio.
          if (!player.position.isValid() && key == 'START')
            player.position = pos;
        }
        else this.drawEmoji(pos, 'BLOCK');
      }
    // Si no está en pausa, se dibuja al jugador.
    if (gameState != 'PAUSED') {
      this.drawEmoji(player.position, gameState === 'GAME_OVER' || gameState === 'GAME_WON' ? gameState : 'PLAYING');
    }
  }
}

class Player {
  position: Vector2d = new Vector2d();

  move(amount: Vector2d) {
    let key;
    let new_pos = this.containPositionInMap(this.position.add(amount));
    key = maps[level][new_pos.getIndex()];
    if (key == 'WALL') {
      maps[level][new_pos.getIndex()] = 'EMPTY';
      this.position = new_pos;
    }
    else {
      while (true) {
        new_pos = this.containPositionInMap(this.position.add(amount));
        key = maps[level][new_pos.getIndex()];
        if (key == 'WALL') break;
        if (key == 'COIN') {
          health++;
          coins++;
          maps[level][new_pos.getIndex()] = 'EMPTY';
        }
        this.position = new_pos;
        if (key == 'END' && coins == initialCoins) break;
      }
      key = maps[level][this.position.getIndex()];
      if (key == 'END' && level == levels - 1 && coins == initialCoins)
        maps[level][this.position.getIndex()] = 'EMPTY';
    }
    return key;
  }

  moveUnit(amount: Vector2d) {
    let key;
    this.position = this.containPositionInMap(this.position.add(amount));
    key = maps[level][this.position.getIndex()];
    if (key == 'WALL' || key == 'COIN' || (key == 'END' && level == levels - 1 && coins == initialCoins))
      maps[level][this.position.getIndex()] = 'EMPTY';
    return key;
  }

  containPositionInMap(position: Vector2d) {
    return new Vector2d(this.contain_index_in_map(position.x), this.contain_index_in_map(position.y));
  }

  contain_index_in_map(index: number) {
    if (index < 0) return mapSize - 1;
    if (index == mapSize) return 0;
    return index;
  }
}

class Info {
  health = document.getElementById('health') as HTMLParagraphElement;
  level = document.getElementById('level') as HTMLParagraphElement;
  time = document.getElementById('time') as HTMLParagraphElement;
  recordTime = document.getElementById('record-time') as HTMLParagraphElement;

  updateHealth() {
    this.health.innerText = health.toString();
  }

  updateLevel() {
    this.level.innerText = level.toString();
  }

  updateTime() {
    this.time.innerText = time.toString();
  }

  updateRecordTime() {
    if (localStorage.getItem('recordTime') === null) {
      localStorage.setItem('recordTime', "0");
    } else if (Number(localStorage.getItem('recordTime')) < time && gameState === 'GAME_OVER') {
      localStorage.setItem('recordTime', `${time}`);
    }
    this.recordTime.innerHTML = localStorage.getItem('recordTime') as string;
  }

  show() {
    this.updateHealth();
    this.updateLevel();
    this.updateTime();
    this.updateRecordTime();
  }
}

class Buttons {
  pause = document.getElementById('pause') as HTMLButtonElement;
  power = document.getElementById('power') as HTMLButtonElement;
  restart = document.getElementById('restart') as HTMLButtonElement;
  menu = document.getElementById('menu') as HTMLButtonElement;

  updatePause() {
    if (gameState == 'PLAYING' || gameState == 'PAUSED') {
      this.pause.classList.toggle('paused');
      this.updateRestartAndMenu();
    }
  }

  updatePower() {
    if (gameState == 'PLAYING') {
      this.power.classList.toggle('active');
    }
  }

  updateRestartAndMenu() {
    this.restart.classList.toggle('inactive');
    this.menu.classList.toggle('inactive');
  }
}

// Función que crea los mapas del juego.
const createMaps = () => {
  let map = new Map();

  for (let i = 0; i < levels; i++) {
    map.set();
    maps.push(map.array);
  }
}

// Función que se llama cuando se carga la página.
const startGame = () => {
  createMaps();
  const game = new Game();
  game.start();
  window.addEventListener('resize', () => game.canvas.resize(game.player));
  window.addEventListener('keydown', (event) => game.readKeyInput(event));
  game.buttons.pause.addEventListener('click', () => game.pause());
  game.buttons.power.addEventListener('click', () => game.buttons.updatePower());
  const body = document.querySelector('body');
  body!.addEventListener('touchstart', (e) => game.getStartTouch(e));
  body!.addEventListener('touchend', (e) => game.handleTouchMovement(e));

  interval = setInterval(() => game.automaticFunction(), 100);
}

window.addEventListener('load', startGame);
