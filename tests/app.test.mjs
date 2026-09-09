import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { test } from 'node:test';
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

// Exercise the shipped application handlers without browser dependencies.
async function app() {
  const nodes = new Map();
  const saved = new Map();
  let document;
  class Element {
    constructor() { this.value = ''; this.style = {}; this.dataset = {}; this.handlers = {}; this.hidden = false; const classes = new Set(); this.classList = { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x), toggle: (x, on) => on ? classes.add(x) : classes.delete(x) }; }
    addEventListener(name, fn) { this.handlers[name] = fn; }
    setAttribute() {}
    focus() { document.activeElement = this; }
    select() {}
    setCustomValidity(value) { this.validationMessage = value; }
    reportValidity() {}
  }
  for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) {
    assert.ok(!nodes.has(id), `Duplicate element ID ${id}`);
    nodes.set(id, new Element());
  }
  const main = new Element(), topbar = new Element();
  const cats = ['online', 'office', 'card', 'emi'].map(cat => Object.assign(new Element(), { dataset: { cat } }));
  document = { activeElement: nodes.get('totalEdit'), getElementById: id => { assert.ok(nodes.has(id), `Missing element ${id}`); return nodes.get(id); }, querySelectorAll: () => cats, querySelector: s => s === 'main' ? main : topbar, addEventListener(name, fn) { this[name] = fn; } };
  const context = vm.createContext({ document, window: { addEventListener() {} }, navigator: {}, localStorage: { getItem: k => saved.get(k) ?? null, setItem: (k, v) => saved.set(k, v) }, console: { warn() {} }, setTimeout: () => 1, clearTimeout() {}, Intl, Date });
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
  await new Promise(resolve => setImmediate(resolve));
  return { nodes, document, main, cats, run: code => vm.runInContext(`(async () => (${code}))()`, context) };
}

test('expense validation, category selection, balances and duplicate-submit protection', async () => {
  const a = await app();
  const input = a.nodes.get('amountInput');
  input.value = '-10'; input.handlers.input(); assert.equal(a.nodes.get('deductBtn').disabled, true);
  input.value = '250.50'; input.handlers.input();
  await a.cats[2].handlers.click();
  await Promise.all([a.run('deduct()'), a.run('deduct()')]);
  assert.equal(await a.run('(await store.allExpenses()).length'), 1);
  assert.equal(await a.run('(await store.allExpenses())[0].category'), 'card');
  assert.equal(a.nodes.get('remaining').textContent, '₹9,749.5');
  assert.equal(input.value, '');
  assert.equal(a.nodes.get('deductBtn').disabled, true);
});

test('budget editing, adjustment limits, zero budget and month isolation', async () => {
  const a = await app();
  await a.nodes.get('totalEdit').handlers.click();
  a.nodes.get('modalInput').value = '5000'; await a.run('onConfirm()');
  assert.equal(await a.run('store.getBudget(selectedMonth)'), 5000);
  await a.run('openBudgetAdjustment("decrease")');
  a.nodes.get('modalInput').value = '6000'; await a.run('onConfirm()');
  assert.match(a.nodes.get('modalInput').validationMessage, /cannot exceed/);
  a.nodes.get('modalInput').value = '5000'; await a.run('onConfirm()');
  assert.equal(await a.run('store.getBudget(selectedMonth)'), 0);
  await a.run('shiftMonth(1)'); await new Promise(resolve => setImmediate(resolve));
  assert.equal(await a.run('store.getBudget(selectedMonth)'), 10000);
});

test('deletion requires confirmation and modal supports Escape and focus trapping', async () => {
  const a = await app();
  a.nodes.get('amountInput').value = '125'; await a.run('deduct()');
  const id = await a.run('(await store.allExpenses())[0].id');
  await a.nodes.get('txList').handlers.click({ target: { closest: () => ({ dataset: { id: String(id) } }) } });
  assert.equal(await a.run('(await store.allExpenses()).length'), 1);
  assert.equal(a.main.inert, true);
  let prevented = false;
  a.nodes.get('modalConfirm').focus();
  a.document.keydown({ key: 'Tab', preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.equal(a.document.activeElement, a.nodes.get('modalCancel'));
  a.document.keydown({ key: 'Escape' }); assert.equal(a.main.inert, false);
  assert.equal(await a.run('(await store.allExpenses()).length'), 1);
  await a.nodes.get('txList').handlers.click({ target: { closest: () => ({ dataset: { id: String(id) } }) } });
  await a.run('onConfirm()');
  assert.equal(await a.run('(await store.allExpenses()).length'), 0);
  assert.equal(a.nodes.get('remaining').textContent, '₹10,000');
});

test('daily pace handles leap years, overspending and future months', async () => {
  const a = await app();
  assert.equal(await a.run('daysInMonth("2024-02")'), 29);
  assert.equal(await a.run('getPaceData(3000, [{ amount: 1200, date: "2026-09-02T12:00:00" }], "2026-09", new Date("2026-09-09T12:00:00")).balance'), -300);
  assert.equal(await a.run('getPaceData(3000, [], "2026-10", new Date("2026-09-09T12:00:00")).actual.length'), 0);
});

test('reset keeps budget and transactions in other months', async () => {
  const a = await app();
  await a.run('store.setBudget(selectedMonth, 3000)');
  a.nodes.get('amountInput').value = '200'; await a.run('deduct()');
  await a.run('store.addExpense({ amount: 400, category: "online", month: "2020-01", date: "2020-01-10T12:00:00" })');
  a.nodes.get('resetBtn').handlers.click(); await a.run('onConfirm()');
  assert.equal(await a.run('(await store.allExpenses()).length'), 1);
  assert.equal(await a.run('store.getBudget(selectedMonth)'), 3000);
});
