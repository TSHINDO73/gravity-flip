const tests = [];

export function test(name, fn) {
  tests.push({ name, fn });
}

export function assertEqual(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error((msg ? msg + ': ' : '') + 'expected ' + e + ' but got ' + a);
  }
}

export function assertTrue(value, msg) {
  if (!value) {
    throw new Error(msg || 'expected truthy value');
  }
}

export function assertThrows(fn, messagePart) {
  let error = null;
  try {
    fn();
  } catch (e) {
    error = e;
  }
  if (!error) {
    throw new Error('expected function to throw');
  }
  if (!String(error.message).includes(messagePart)) {
    throw new Error('expected error containing "' + messagePart + '" but got "' + error.message + '"');
  }
}

export function run() {
  let passed = 0;
  const failures = [];
  for (const t of tests) {
    try {
      t.fn();
      passed++;
    } catch (e) {
      failures.push(t.name + ': ' + e.message);
    }
  }
  document.getElementById('summary').textContent =
    'SUMMARY passed=' + passed + ' failed=' + failures.length;
  document.getElementById('details').textContent = failures.join('\n');
}
