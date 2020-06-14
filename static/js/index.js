'use strict';

function getExponentialRandomVariable(lambda) {
  let res = lambda * Math.pow(Math.E, -lambda * Math.random());
  if (DEBUG) console.log("ERV = " + res * ERV_COEF);
  return res * ERV_COEF;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class Agent {
  constructor(id) {
    this.id = id;
    this.workTime = 0;
    this.hasWork = true;
  }

  getNextEvent() {
    throw "Must be implemented";
  }

  processEvent() {
    throw "Must be implemented";
  }

  getStatus() {
    return "Not implemented";
  }

  _getID() {
    return "(" + this.id + ") ";
  }
}

class ProducerAgent extends Agent {
  constructor(id) {
    super(id);
  }

  getNextEvent() {
    return this.workTime;
  }

  // пришёл клиент
  processEvent() {
    // генерируем время до прихода следующего
    this.workTime = Math.ceil(getExponentialRandomVariable(PRODUCTION_DELAY));

    for (let a of agents) {
      // ищем свободного оператора
      if (a instanceof ConsumerAgent && !a.hasWork) {
        // если нашли, то даём ему работу
        a.hasWork = true;
        a.workTime = Math.ceil(getExponentialRandomVariable(WORK_DELAY));
        if (DEBUG) console.log(this._getID() + "Оператор найден");
        return;
      }
    }
    // если не нашли, то кидаем в очередь
    if (DEBUG) console.log(this._getID() + "Пошёл в очередь");
    queue++;
  }

  getStatus() {
    if (this.workTime === 0) return this._getID() + "Пришёл клиент";
    return this._getID() + "Следующий клиент придет через " + this.workTime + " минут";
  }
}

class ConsumerAgent extends Agent {
  constructor(id) {
    super(id);
    this.hasWork = false;
  }

  getNextEvent() {
    if (this.hasWork) return this.workTime;
  }

  // клиент обработан
  processEvent() {
    if (DEBUG) console.log(this._getID() + "Я свободен");
    this.hasWork = false;
    // если есть очередь
    if (queue > 0) {
      // забираем клиента
      this.workTime = Math.ceil(getExponentialRandomVariable(WORK_DELAY));
      this.hasWork = true;
      queue--;

      console.log(this._getID() + "Беру работу на время " + this.workTime + " минут");
    }
    // иначе чиллим
  }

  getStatus() {
    if (this.hasWork) return this._getID() + "Я работаю (ещё " + this.workTime + " минут)";
    else return this._getID() + "Я чиллю";
  }
}

// управление
const DEBUG = false;
const SLEEP_TIME = 2500;
const ERV_COEF = 30;
const CONSUMERS_NUM = Math.ceil(Math.random() * 8);
const WORK_DELAY = 1;
const PRODUCTION_DELAY = 1 / (CONSUMERS_NUM * 2);

// окружение
let queue = 0;
let agents = [];

async function main() {
  let p = new ProducerAgent(0);
  agents.push(p);
  p.workTime = Math.ceil(getExponentialRandomVariable(PRODUCTION_DELAY));

  for (let i = 1; i <= CONSUMERS_NUM; i++) {
    let c = new ConsumerAgent(i);
    agents.push(c);
  }

  if (DEBUG) console.log("Consumers today: " + CONSUMERS_NUM);
  if (DEBUG) console.log("Work delay: " + WORK_DELAY);
  if (DEBUG) console.log("Production delay: " + PRODUCTION_DELAY);

  document.getElementById("consumers").innerHTML = CONSUMERS_NUM;

  let T = 0;
  while (true) {
    if (DEBUG) console.log("ВРЕМЯ " + T);
    if (DEBUG) console.log("В очереди: " + queue);

    document.getElementById("time").innerHTML = T;
    document.getElementById("queue").innerHTML = queue;

    let minT = Infinity;
    let log = '';

    // идём опрашивать агентов
    for (let a of agents) {
      if (DEBUG) console.log(a.getStatus());
      log += a.getStatus() + "<br>";
      if (a.hasWork) {
        // кто-то хочет обработать событие
        if (a.workTime === 0) {
          a.processEvent();
        }
        // ищем минимальное врея до следующего события
        if (a.getNextEvent() < minT) {
          minT = a.workTime;
        }
      }
    }

    if (DEBUG) console.log("Следующее событие через " + minT + " минут");

    document.getElementById("log").innerHTML = log;
    document.getElementById("next-event").innerHTML = minT;

    for (let a of agents) {
      // уменьшаем всем время работы на найденый минимум
      if (a.hasWork) {
        a.workTime -= minT;
      }
    }

    T += minT;
    await sleep(SLEEP_TIME);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  main();
});
