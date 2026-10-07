/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads the actual TypeScript routes and component. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const { NextRequest } = require('next/server')

function loadTs(file, mocks = {}, globals = {}) {
  const filename = path.resolve(__dirname, '..', file)
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const compiledModule = { exports: {} }
  const resolve = name => {
    if (Object.hasOwn(mocks, name)) return mocks[name]
    if (name.startsWith('@/')) return loadTs(name.slice(2) + '.ts', mocks, globals)
    if (name.startsWith('.')) return loadTs(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), name)) + '.ts', mocks, globals)
    return require(name)
  }
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {
    ...globalThis, process, performance, fetch, console, ...globals,
  }, { filename })(resolve, compiledModule, compiledModule.exports)
  return compiledModule.exports
}

const ids = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333']
const badge = {
  assignmentId: ids[0], badgeId: ids[1], name: 'Beginner badge', description: null, category: 'Test',
  isCompleted: false, completedAt: null, dateAwarded: null, datePaid: null, dateGiven: null,
  skills: [{ id: ids[2], name: 'First skill', description: null, sortOrder: 0, completedAt: null }],
}
const savedBadge = { ...badge, isCompleted: true, completedAt: '2026-10-07T12:00:00Z', skills: [{ ...badge.skills[0], completedAt: '2026-10-07T12:00:00Z' }] }
const mutation = { childId: ids[2], assignedBadge: savedBadge }
const origin = 'https://gym.test'

function fixture(options = {}) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-public-key'
  const calls = { auth: 0, rpc: [], legacy: 0 }
  const mocks = {
    '@supabase/ssr': { createServerClient: (_url, _key, config) => ({ auth: { getUser: async () => {
      calls.auth++
      config.cookies.setAll([{ name: 'sb-test', value: 'refreshed', options: { httpOnly: true } }])
      return { data: { user: options.signedOut ? null : { id: ids[0] } }, error: null }
    } } }) },
    '@/lib/admin': { supabaseAdmin: { rpc: async (name, args) => {
      calls.rpc.push({ name, args })
      return { data: options.error ? null : mutation, error: options.error ?? null }
    } } },
    '@/lib/server/badges': { getAdminBadgeDataForChild: async childId => {
      assert.equal(childId, ids[2]); calls.legacy++
      return { assignedBadges: [savedBadge], availableBadges: [] }
    } },
  }
  return { calls, route: loadTs('app/api/admin/child-badges/route.ts', mocks) }
}
function request(method, body, compact = true, requestOrigin = origin) {
  return new NextRequest(origin + '/api/admin/child-badges', {
    method, headers: { 'Content-Type': 'application/json', Origin: requestOrigin, ...(compact ? { 'X-Badge-Response': 'single' } : {}) },
    body: JSON.stringify(body),
  })
}
const skillRequest = { assignmentId: ids[0], badgeSkillId: ids[2], completed: true }

test('signed-out and cross-origin requests never reach the badge mutation', async () => {
  for (const signedOut of [true, false]) {
    const f = fixture({ signedOut })
    const response = await f.route.PATCH(request('PATCH', skillRequest, true, signedOut ? origin : 'https://other.test'))
    assert.equal(response.status, signedOut ? 401 : 403)
    assert.equal(f.calls.rpc.length, 0)
  }
})
test('skill save uses one Auth call and one atomic RPC, preserves cookies and avoids full reload', async () => {
  const f = fixture()
  const response = await f.route.PATCH(request('PATCH', skillRequest))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), mutation)
  assert.equal(f.calls.auth, 1)
  assert.equal(f.calls.rpc.length, 1)
  assert.equal(f.calls.rpc[0].name, 'admin_mutate_child_badge')
  assert.deepEqual(JSON.parse(JSON.stringify(f.calls.rpc[0].args)), { p_auth_user_id: ids[0], p_action: 'skill', p_payload: skillRequest })
  assert.equal(f.calls.legacy, 0)
  assert.match(response.headers.get('set-cookie'), /sb-test=refreshed/)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.match(response.headers.get('server-timing'), /auth;dur=.*badge;dur=/)
})
test('already-open legacy clients still receive the complete badge response', async () => {
  const f = fixture()
  const response = await f.route.PATCH(request('PATCH', skillRequest, false))
  assert.deepEqual(await response.json(), { assignedBadges: [savedBadge], availableBadges: [] })
  assert.equal(f.calls.legacy, 1)
})
test('invalid IDs, injected identity, mixed operations and invalid dates are rejected before RPC', async () => {
  for (const body of [
    { ...skillRequest, assignmentId: 'invalid' }, { ...skillRequest, authUserId: ids[1] },
    { ...skillRequest, markAllSkillsComplete: true }, { assignmentId: ids[0], datePaid: 'invalid' },
    { assignmentId: ids[0] }, { ...skillRequest, completed: 'true' },
  ]) {
    const f = fixture()
    assert.equal((await f.route.PATCH(request('PATCH', body))).status, 400)
    assert.equal(f.calls.rpc.length, 0)
  }
})
test('assign, delete, mark-all and tracking retain their semantics with compact saves', async () => {
  for (const [method, body, action] of [
    ['POST', { childId: ids[2], badgeId: ids[1] }, 'assign'],
    ['DELETE', { assignmentId: ids[0] }, 'delete'],
    ['PATCH', { assignmentId: ids[0], markAllSkillsComplete: true }, 'complete'],
    ['PATCH', { assignmentId: ids[0], datePaid: '', dateAwarded: '2026-10-07' }, 'tracking'],
  ]) {
    const f = fixture()
    assert.equal((await f.route[method](request(method, body))).status, 200)
    assert.equal(f.calls.rpc[0].args.p_action, action)
    if (action === 'tracking') {
      assert.equal(f.calls.rpc[0].args.p_payload.datePaid, null)
      assert.equal(f.calls.rpc[0].args.p_payload.dateAwarded, '2026-10-07T00:00:00.000Z')
    }
  }
})
test('database rejection never causes a reload or success, with appropriate HTTP status', async () => {
  for (const [code, status] of [['42501', 403], ['P0002', 404], ['22023', 400], ['23514', 500], ['PGRST202', 503]]) {
    const f = fixture({ error: { code, message: 'Rejected fixture save' } })
    const response = await f.route.PATCH(request('PATCH', skillRequest))
    assert.equal(response.status, status)
    assert.ok((await response.json()).error)
    assert.equal(f.calls.legacy, 0)
  }
})

function componentFixture() {
  const hooks = []; let cursor = 0; let settle; let calls = 0
  const react = { ...require('react'),
    useState: initial => {
      const index = cursor++
      if (!(index in hooks)) hooks[index] = initial
      return [hooks[index], value => { hooks[index] = typeof value === 'function' ? value(hooks[index]) : value }]
    },
    useRef: initial => { const index = cursor++; if (!(index in hooks)) hooks[index] = { current: initial }; return hooks[index] },
    useMemo: callback => callback(),
  }
  const mocks = { react, 'next/link': { __esModule: true, default: 'a' },
    '@radix-ui/react-dialog': new Proxy({}, { get: (_target, key) => 'dialog-' + key }),
  }
  const component = loadTs('app/(admin)/admin/students/[childId]/StudentProfileTabs.tsx', mocks, {
    fetch: (_url, options) => { calls++; assert.equal(options.headers['X-Badge-Response'], 'single'); return new Promise(resolve => { settle = resolve }) },
  }).default
  const otherBadge = { ...badge, assignmentId: ids[1], name: 'Other badge' }
  const render = () => { cursor = 0; return component({ children: null, childId: ids[2], studentName: 'Test', dateOfBirthLabel: '', ageLabel: '', backHref: '/admin', initialAssignedBadges: [badge, otherBadge], initialAvailableBadges: [] }) }
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
  const tab = nodes(render(), node => node.type === 'button' && textOf(node) === 'Badges')[0]
  tab.props.onClick()
  const expand = nodes(render(), node => node.type === 'button' && node.props['aria-expanded'] === false && textOf(node).includes('Beginner badge'))[0]
  expand.props.onClick()
  const checkbox = () => nodes(render(), node => node.type === 'input' && node.props.type === 'checkbox')[0]
  return { render, checkbox, nodes, textOf, get calls() { return calls }, respond: response => settle(response) }
}
test('checkbox updates immediately, blocks duplicate saves and restores state after a failed save', async () => {
  const f = componentFixture()
  const pending = f.checkbox().props.onChange({ target: { checked: true } })
  assert.equal(f.checkbox().props.checked, true)
  assert.equal(f.checkbox().props.disabled, true)
  f.checkbox().props.onChange({ target: { checked: false } })
  assert.equal(f.calls, 1)
  f.respond({ ok: false, json: async () => ({ error: 'Save rejected' }) })
  await pending
  assert.equal(f.checkbox().props.checked, false)
  assert.equal(f.checkbox().props.disabled, false)
  assert.match(f.textOf(f.render()), /Save rejected/)
})
test('successful narrow response preserves other assigned badges and unlocks skill controls', async () => {
  const f = componentFixture()
  const pending = f.checkbox().props.onChange({ target: { checked: true } })
  f.respond({ ok: true, json: async () => mutation })
  await pending
  assert.equal(f.checkbox().props.checked, true)
  assert.equal(f.checkbox().props.disabled, false)
  assert.match(f.textOf(f.render()), /Other badge/)
})
