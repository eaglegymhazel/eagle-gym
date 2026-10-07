/* eslint-disable @typescript-eslint/no-require-imports -- Test the real reset form with isolated hooks and network requests. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
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
async function fixture(search = '') {
  const hooks = []; const effects = []; const requests = []; const updates = []; const redirects = []; const history = []
  let cursor = 0; let mounted = false; let resolveRequest; let resolveUpdate; let rejectUpdate
  const react = { ...require('react'),
    useState: initial => { const index = cursor++; if (!(index in hooks)) hooks[index] = initial
      return [hooks[index], value => { hooks[index] = typeof value === 'function' ? value(hooks[index]) : value }] },
    useRef: initial => { const index = cursor++; if (!(index in hooks)) hooks[index] = { current: initial }; return hooks[index] },
    useEffect: effect => { if (!mounted) effects.push(effect) },
  }
  const mocks = { react,
    'next/link': { __esModule: true, default: 'a' },
    'next/navigation': { useRouter: () => ({ replace: target => redirects.push(target) }) },
    '@/app/components/auth/AuthProvider': { useAuth: () => ({ user: null, loading: false }) },
    '@/app/components/auth/PasswordField': { __esModule: true, default: 'password-field' },
    '@/lib/passwordPolicy': { validatePassword: password => ({ isValid: password === 'Password!123' }) },
    '@/lib/supabaseClient': { supabase: { auth: {
      resetPasswordForEmail: (email, options) => { requests.push({ email, options }); return new Promise(resolve => { resolveRequest = resolve }) },
    } } },
  }
  const file = path.resolve(__dirname, '../app/(portal)/reset-password/page.tsx')
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText
  const compiled = { exports: {} }
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {
    URLSearchParams,
    window: { location: { origin: 'https://www.eaglegymnastics.co.uk', pathname: '/reset-password', search, hash: '' },
      history: { replaceState: (_state, _title, url) => history.push(url) } },
    fetch: (url, options) => { updates.push({ url, ...options }); return new Promise((resolve, reject) => { resolveUpdate = resolve; rejectUpdate = reject }) },
  }, { filename: file })(name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), compiled, compiled.exports)
  const render = () => { cursor = 0; const tree = compiled.exports.default(); mounted = true; return tree }
  render(); effects.forEach(effect => effect()); await flush()
  const form = () => nodes(render(), node => node.type === 'form')[0]
  const fillPassword = () => {
    const fields = nodes(render(), node => node.type === 'password-field')
    fields[0].props.onChange('Password!123'); fields[0].props.onValidityChange(true)
    fields[1].props.onChange('Password!123')
  }
  return { render, form, fillPassword, requests, updates, redirects, history,
    submit: () => form().props.onSubmit({ preventDefault() {} }),
    respond: async (ok, body) => { resolveUpdate({ ok, json: async () => body }); await flush() },
    reject: async () => { rejectUpdate(new Error('Network unavailable')); await flush() },
    sent: async () => { resolveRequest({ error: null }); await flush() },
  }
}

test('a signed-out recovery link opens new-password fields and prevents duplicate updates', async () => {
  const f = await fixture('?mode=recovery&token_hash=test-token')
  assert.match(textOf(f.render()), /Create a new password/)
  assert.equal(nodes(f.render(), node => node.type === 'input' && node.props.type === 'email').length, 0)
  assert.equal(f.updates.length, 0) // Merely opening the link does not consume it.
  f.fillPassword(); f.submit(); f.submit()
  assert.equal(f.updates.length, 1)
  assert.deepEqual(JSON.parse(f.updates[0].body), { password: 'Password!123', tokenHash: 'test-token' })
  assert.equal(nodes(f.render(), node => node.type === 'button')[0].props.disabled, true)
  await f.respond(true, { ok: true })
  assert.deepEqual(f.redirects, ['/login?password=updated'])
  assert.equal(f.history.at(-1), '/reset-password')
})

test('invalid or consumed tokens return to the request form without claiming success', async () => {
  const f = await fixture('?mode=recovery&token_hash=used-token')
  f.fillPassword(); f.submit()
  await f.respond(false, { code: 'recovery_link', error: 'This reset link is invalid, expired or already used.' })
  assert.match(textOf(f.render()), /invalid, expired or already used/)
  assert.equal(nodes(f.render(), node => node.type === 'password-field').length, 0)
  assert.equal(nodes(f.render(), node => node.type === 'input' && node.props.type === 'email').length, 1)
  assert.deepEqual(f.redirects, [])
  const errorPage = await fixture('?error=recovery_link')
  assert.match(textOf(errorPage.render()), /Request a new password reset email/)
})

test('a verified session survives password rejection and retries without a consumed token', async () => {
  const f = await fixture('?mode=recovery&token_hash=test-token')
  f.fillPassword(); f.submit()
  await f.respond(false, { error: 'Choose a different password.', recoveryVerified: true })
  assert.match(textOf(f.render()), /Choose a different password/)
  f.submit()
  assert.equal(f.updates.length, 2)
  assert.deepEqual(JSON.parse(f.updates[1].body), { password: 'Password!123' })
  await f.respond(true, { ok: true })
  assert.deepEqual(f.redirects, ['/login?password=updated'])
})

test('network failure releases the submit lock and leaves a visible error', async () => {
  const f = await fixture('?mode=recovery&token_hash=test-token')
  f.fillPassword(); f.submit(); await f.reject()
  assert.match(textOf(f.render()), /Please try again/)
  assert.equal(nodes(f.render(), node => node.type === 'button')[0].props.disabled, false)
  f.submit(); assert.equal(f.updates.length, 2)
  await f.respond(true, { ok: true })
})

test('reset requests use the recovery callback and synchronously prevent double sending', async () => {
  const f = await fixture()
  nodes(f.render(), node => node.type === 'input')[0].props.onChange({ target: { value: ' Parent@Example.com ' } })
  f.submit(); f.submit()
  assert.deepEqual(JSON.parse(JSON.stringify(f.requests)), [{ email: 'parent@example.com', options: {
    redirectTo: 'https://www.eaglegymnastics.co.uk/auth/callback?flow=password-recovery',
  } }])
  assert.equal(nodes(f.render(), node => node.type === 'button')[0].props.disabled, true)
  await f.sent()
  assert.match(textOf(f.render()), /If an account exists/)
  assert.equal(nodes(f.render(), node => node.type === 'button')[0].props.disabled, false)
})
