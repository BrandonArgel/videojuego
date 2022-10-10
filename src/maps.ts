/* 
  Tutorial: https://www.youtube.com/watch?v=HyK_Q5rrcr4&ab_channel=TheCodingTrain
*/
interface IMAGES {
  [key: string]: HTMLImageElement;
}

export const images: IMAGES = {
  END: new Image(),
  PLAYING: new Image(),
  GAME_OVER: new Image(),
  GAME_WON: new Image(),
  COIN: new Image()
};
images.END.src = 'https://cdn-icons-png.flaticon.com/512/3223/3223283.png';
images.PLAYING.src = 'https://cdn-icons-png.flaticon.com/512/3404/3404173.png';
images.GAME_OVER.src = 'https://cdn-icons-png.flaticon.com/512/8538/8538367.png';
images.GAME_WON.src = 'https://cdn-icons-png.flaticon.com/512/1933/1933704.png';
images.COIN.src = 'https://cdn-icons-png.flaticon.com/512/2529/2529396.png';

export type CELLS = "START" | "WALL" | "EMPTY" | "END" | "COIN";

export const initialCoins = 1;
export const mapSize = 13;
const DIR_KEYS = { 'top': 0, 'right': 1, 'down': 2, 'left': 3 };

// Objeto que representa a un vector en dos dimensiones.
export class Vector2d {
  x: number;
  y: number;

  constructor(x: number | undefined = undefined, y: number | undefined = undefined) {
    this.x = x!;
    this.y = y!;
  }

  // Esta función recibe otro vector y retorna true si son iguales o false si no.
  equals(vector: Vector2d) {
    return this.x == vector.x && this.y == vector.y;
  }

  // Esta función recibe un número y retorna el vector escalado.
  scale(k: number) {
    return new Vector2d(this.x * k, this.y * k);
  }

  add(vector: Vector2d) {
    return new Vector2d(this.x + vector.x, this.y + vector.y);
  }

  substract(vector: Vector2d) {
    return this.add(vector.scale(-1));
  }

  // Esta función recibe una dirección y, opcionalmente, una longitud.
  // Retorna el vector trasladado.
  translate(direction: number, length: number = 1) {
    return this.add(directions[direction].scale(length));
  }

  // Esta función retorna true si el vector está en el mapa y false si no.
  inMap() {
    return this.x >= 0 && this.x < mapSize && this.y >= 0 && this.y < mapSize;
  }

  // Esta función retorna el índice del arreglo del mapa correspondiente al vector.
  getIndex() {
    return this.inMap() ? this.x + this.y * mapSize : -1;
  }

  // Esta función retorna el índice del arreglo del mapa correspondiente al vector trasladado. 
  getTranslatedIndex(indexDir: number, length: number = 1) {
    return this.translate(indexDir, length).getIndex();
  }

  // Esta función asigna undefined a las coordenadas del vector.
  clear() {
    this.x = 0;
    this.y = 0;
  }

  // Esta función retorna false si las coordenadas son undefined y true si no.
  isValid() {
    return this.x != undefined && this.y != undefined;
  }
}

// Arreglo que guarda los vectores que se le suman a una posición
// para que se traslade una unidad en una dirección.
// Guarda relación con el orden en que están las direcciones en el objeto DIR_KEYS.
const directions: Vector2d[] = [];
directions.push(new Vector2d(0, -1));
directions.push(new Vector2d(1, 0));
directions.push(new Vector2d(0, 1));
directions.push(new Vector2d(-1, 0));

// Devuelve un número aleatorio entre 0 y length-1
function randomIndex(length: number) {
  return Math.floor(Math.random() * length);
}

// Objeto que representa a una celda.
// Una celda tiene una posición, un arreglo de booleanos que indica si tiene una pared en alguna dirección y
// un booleano que indica si ha sido visitado.
class Cell {
  position: Vector2d;
  walls = [true, true, true, true];
  visited: boolean = false

  constructor(position: Vector2d) {
    this.position = position;
  }
}
// Objeto que guarda el arreglo del submapa.
class CellMap {
  array: Cell[] = [];
  subMapSize: number = (mapSize - 1) / 2;
  startIndex: number = randomIndex(this.subMapSize ** 2);

  set() {
    this.array = [];
    for (let y = 1; y < mapSize; y += 2) {
      for (let x = 1; x < mapSize; x += 2) {
        this.array.push(new Cell(new Vector2d(x, y)));
      }
    }

    this.removeWalls();
  }

  removeWalls() {
    // Declare stack who can be Cell o undefined
    let stack: Cell[] = [];
    let currentCell: Cell | undefined = this.array[this.startIndex];
    currentCell.visited = true;

    while (true) {
      let next: Cell | undefined = this.getNextCell(currentCell!.position);
      if (next) {
        next.visited = true;
        stack.push(currentCell!);
        this.removeWall(currentCell!, next);
        currentCell = next;
      } else if (stack.length > 0) {
        currentCell = stack.pop();
      } else {
        break;
      }
    }
  }

  removeWall(current: Cell, next: Cell) {
    if ((current.position.x - next.position.x) == 2)
      current.walls[DIR_KEYS['left']] = next.walls[DIR_KEYS['right']] = false;
    else if ((current.position.x - next.position.x) == -2)
      current.walls[DIR_KEYS['right']] = next.walls[DIR_KEYS['left']] = false;
    else if ((current.position.y - next.position.y) == 2)
      current.walls[DIR_KEYS['top']] = next.walls[DIR_KEYS['down']] = false;
    else
      current.walls[DIR_KEYS['down']] = next.walls[DIR_KEYS['top']] = false;
  }

  // Esta función recibe un punto del mapa y devuelve el índice del arreglo del submapa correspondiente.
  // Si el punto no está en el mapa retorna -1.
  getIndexTransformed(position: Vector2d) {
    return position.inMap() ? (position.x - 1) / 2 + (position.y - 1) / 2 * this.subMapSize : -1;
  }

  // Esta función recibe un índice del arreglo del submapa y devuelve el punto del mapa correspondiente.
  getPositionTransformed(index: number) {
    return new Vector2d((index % this.subMapSize) * 2 + 1, Math.floor(index / this.subMapSize) * 2 + 1);
  }

  // Esta función recibe un punto del mapa, calcula el índice del arreglo del submapa correspondiente
  // y asigna este valor al índice inicial.
  setStartIndex(position: Vector2d) {
    this.startIndex = this.getIndexTransformed(position);
  }

  // Esta función retorna el punto del mapa correspondiente con el índice inicial del arreglo del submapa.
  getStartPosition() {
    return this.getPositionTransformed(this.startIndex);
  }

  // Esta función recibe un punto del mapa y crea un arreglo de las celdas adjacentes que aún no han sido visitadas.
  // Si el arreglo no está vacío retorna una de estas celdas de forma aleatoria.
  // Si el arreglo está vacío retorna undefined.
  getNextCell(position: Vector2d) {
    let neighbors: Cell[] = [];
    for (let i = 0; i < 4; i++) {
      let positionTranslated = position.translate(i, 2);
      let cell = this.array[this.getIndexTransformed(positionTranslated)];
      if (cell && !cell.visited) {
        neighbors.push(cell);
      }
    }
    return neighbors.length > 0 ? neighbors[randomIndex(neighbors.length)] : undefined;
  }

  // Esta función recibe el arreglo del mapa para agregarle la posición inicial y paredes adicionales.
  modifyMap(mapArray: Array<CELLS>) {
    mapArray[this.getStartPosition().getIndex()] = "START";
    for (let cell of this.array) {
      for (let j = 0; j < 4; j++) {
        if (cell.walls[j]) {
          mapArray[cell.position.translate(j, 1).getIndex()] = "WALL";
        }
      }
    }
  }
}

// Objeto que guarda el arreglo del mapa.
export class Map {
  array: CELLS[] = [];
  cellMap = new CellMap();

  // Esta función llena el arreglo del mapa con diferentes elementos.
  set() {
    // Se establece el estado inicial del mapa.
    this.setInitialState();
    // Se crea el laberinto.
    this.cellMap.set();
    this.cellMap.modifyMap(this.array);
    // Se calcula la posición final del mapa.
    let startPosition = this.cellMap.getStartPosition();
    let endPosition = this.findLongestPath(undefined, startPosition, 0).pos;
    this.array[endPosition.getIndex()] = "END";
    this.cellMap.setStartIndex(endPosition);
    // Se colocan las monedas.
    this.setCoins();
  }

  // Esta función establece el estado inicial del arreglo del mapa.
  setInitialState() {
    this.array = Array(mapSize ** 2).fill("EMPTY");
    for (let x = 0; x < mapSize; x++) {
      let posUp = new Vector2d(x, 0);
      let posDown = new Vector2d(x, mapSize - 1);
      this.array[posUp.getIndex()] = this.array[posDown.getIndex()] = 'WALL';
    }
    for (let y = 0; y < mapSize; y++) {
      let posLeft = new Vector2d(0, y);
      let posRight = new Vector2d(mapSize - 1, y);
      this.array[posLeft.getIndex()] = this.array[posRight.getIndex()] = 'WALL';
    }
    for (let y = 2; y < mapSize; y += 2) {
      for (let x = 2; x < mapSize; x += 2) {
        this.array[new Vector2d(x, y).getIndex()] = 'WALL';
      }
    }
  }

  // Esta función recursiva calcula la posición más alejada de la posición que se pase como argumento.
  findLongestPath(prevPosition: Vector2d | undefined, position_: Vector2d, length_: number) {
    let obj = { pos: position_, length: length_ };
    for (let i = 0; i < 4; i++) {
      let pos_translated = position_.translate(i);
      if (this.array[pos_translated.getIndex()] == 'EMPTY' &&
        (prevPosition == undefined || !pos_translated.equals(prevPosition))) {
        let other = this.findLongestPath(position_, pos_translated, length_ + 1);
        if (obj.length < other.length)
          obj = other;
      }
    }
    return obj;
  }

  // Esta función coloca las monedas de forma aleatoria.
  setCoins() {
    for (let i = 0; i < initialCoins; i++) {
      let j;
      do {
        j = randomIndex(mapSize ** 2);
      } while (this.array[j] != 'EMPTY');
      this.array[j] = 'COIN';
    }
  }
}