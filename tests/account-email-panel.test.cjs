/* eslint-disable @typescript-eslint/no-require-imports -- Execute the actual component with isolated hooks/network fixtures. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const pending = { email: 'old@example.com', pendingEmail: 'new@example.com',
  pendingRequestedAt: '2026-10-07T12:00:00Z', pendingExpiresAt: '2026-10-09T12:00:00Z',
  canChange: true, synchronised: true }
const cancelled = { ...pending, pendingEmail: null, pendingRequestedAt: null, pendingExpiresAt: null }
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve() }
function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return []
  if (Array.isArray(tree)) return tree.flatMap(item => nodes(item, predicate))
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)]
}
function textOf(tree) {
  if (tree == null || typeof tree === 'boolean') return ''
  if (Array.isArray(tree)) return tree.map(textOf).join(' ')
  if (typeof tree === 'object') return textOf(tree.props?.children)
  return String(tree)
}
async function fixture() {
  const hooks = []; const effects = []; const calls = []; let cursor = 0; let mounted = false; let resolveMutation
  let currentStatus = pending; let refreshed = 0
  const react = { ...require('react'),
    useState: initial => { const index = cursor++; if (!(index in hooks)) hooks[index] = initial
      return [hooks[index], value => { hooks[index] = typeof value === 'function' ? value(hooks[index]) : value }] },
    useRef: initial => { const index = cursor++; if (!(index in hooks)) hooks[index] = { current: initial }; return hooks[index] },
    useCallback: callback => callback,
    useEffect: effect => { if (!mounted) effects.push(effect) },
  }
  const mocks = { react, 'next/link': { __esModule: true, default: 'a' },
    '../account.module.css': { __esModule: true, default: {} },
    '@/lib/supabaseClient': { supabase: { auth: { refreshSession: async () => { refreshed++ } } } },
    '@/lib/accountEmail': { validateEmailChange: () => null },
  }
  const file = path.resolve(__dirname, '../app/(portal)/(protected)/account/_components/AccountEmailPanel.tsx')
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText
  const compiled = { exports: {} }
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {
    window: { addEventListener() {}, removeEventListener() {}, setInterval() {}, clearInterval() {} },
    document: { addEventListener() {}, removeEventListener() {}, visibilityState: 'visible' },
    fetch: (_url, options) => {
      if (!options.method) return Promise.resolve({ ok: true, status: 200, json: async () => currentStatus })
      calls.push(options)
      return new Promise(resolve => { resolveMutation = resolve })
    },
  }, { filename: file })(name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), compiled, compiled.exports)
  const render = () => { cursor = 0; const tree = compiled.exports.default({ initialEmail: pending.email, disabled: false, onConfirmed: async () => {} }); mounted = true; return tree }
  render(); effects.forEach(effect => effect()); await flush()
  const button = label => nodes(render(), node => node.type === 'button' && textOf(node) === label)[0]
  return { render, button, calls, get refreshed() { return refreshed },
    respond: async body => { resolveMutation({ ok: true, status: 200, json: async () => body }); await flush() },
    reject: async () => { resolveMutation({ ok: false, status: 409, json: async () => ({ error: 'The pending request changed. Refresh before cancelling.' }) }); await flush() },
    status: value => { currentStatus = value },
  }
}

test('cancel is locked against duplicate submissions and keeps confirmed email unchanged', async () => {
  const f = await fixture()
  assert.match(textOf(f.render()), /48 hours/)
  const cancelButton = f.button('Cancel email change')
  cancelButton.props.onClick(); cancelButton.props.onClick()
  assert.equal(f.calls.length, 1)
  assert.equal(f.calls[0].method, 'DELETE')
  assert.deepEqual(JSON.parse(f.calls[0].body), { pendingEmail: pending.pendingEmail, pendingRequestedAt: pending.pendingRequestedAt })
  assert.equal(f.button('Cancelling…').props.disabled, true)
  await f.respond(cancelled)
  assert.equal(f.button('Cancel email change'), undefined)
  assert.match(textOf(f.render()), /Email change cancelled/)
  assert.match(textOf(f.render()), /old@example.com/)
  assert.doesNotMatch(textOf(f.render()), /Your account email has changed/)
  assert.equal(f.refreshed, 0)
})

test('stale cancellation preserves pending state; expiry refresh reports no confirmed change', async () => {
  const f = await fixture()
  f.button('Cancel email change').props.onClick()
  await f.reject()
  assert.ok(f.button('Cancel email change'))
  assert.match(textOf(f.render()), /pending request changed/)
  f.status(cancelled)
  f.button('Check confirmation status').props.onClick()
  await flush()
  assert.equal(f.button('Cancel email change'), undefined)
  assert.match(textOf(f.render()), /expired or been cancelled/)
  assert.doesNotMatch(textOf(f.render()), /Your account email has changed/)
})

test('confirmation winning before cancellation reports the completed change instead of cancellation', async () => {
  const f = await fixture()
  f.button('Cancel email change').props.onClick()
  await f.respond({ ...cancelled, email: pending.pendingEmail })
  assert.match(textOf(f.render()), /Your account email has changed to new@example.com/)
  assert.doesNotMatch(textOf(f.render()), /Email change cancelled/)
  assert.equal(f.refreshed, 1)
})
