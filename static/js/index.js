'use strict';

function getExponentialRandomVariable(lambda) {
  let res = lambda * Math.pow(Math.E, -lambda * Math.random());
  if (DEBUG) console.log("ERV = " + res * ERV_COEF);
  return res * ERV_COEF;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function factorial(num) {
    let rval = 1;
    for (let i = 2; i <= num; i++)
        rval = rval * i;
    return rval;
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

      if (DEBUG) console.log(this._getID() + "Беру работу на время " + this.workTime + " минут");
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
const CONSUMERS_NUM = Math.ceil(Math.random() * 5) + 1;
const WORK_DELAY = 1;
const PRODUCTION_DELAY = WORK_DELAY * (CONSUMERS_NUM - 1.9);

// окружение
let queue = 0;
let agents = [];

function matStat() {
  let p = PRODUCTION_DELAY / WORK_DELAY;

  let p0 = 0;
  for (let k = 0; k <= CONSUMERS_NUM; k++) {
    p0 += (Math.pow(p, k) / factorial(k)) + (Math.pow(p, CONSUMERS_NUM + 1) / (factorial(CONSUMERS_NUM) * (CONSUMERS_NUM - p)));
  }

  p0 = Math.pow(p0, -1);
  if (DEBUG) console.log(p0);

  let log = '';
  for (let k = 0; k < CONSUMERS_NUM; k++) {
    let pk = (Math.pow(p, k) / factorial(k)) * p0;
    if (DEBUG) console.log(k, pk);
    log += k + ": " + pk.toFixed(4) + "<br>";
  }

  document.getElementById("distribution").innerHTML = log;
}

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

  // считаем теоретическое распределение
  matStat();

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
