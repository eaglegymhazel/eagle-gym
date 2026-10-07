/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads transpiled server modules. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const { NextRequest } = require('next/server')

const root = path.resolve(__dirname, '..')
function loadTs(file, mocks = {}) {
  const filename = path.join(root, file)
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const compiledModule = { exports: {} }
  const resolve = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name]
    if (name.startsWith('@/')) return loadTs(name.slice(2) + '.ts', mocks)
    return require(name)
  }
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename })(resolve, compiledModule, compiledModule.exports)
  return compiledModule.exports
}

const emailHelpers = loadTs('lib/accountEmail.ts')
const origin = 'https://gym.test'
const oldUser = { id: 'same-stable-user-id', email: 'old@example.com' }
const newUser = { ...oldUser, email: 'new@example.com' }
const initial = { email: oldUser.email, pendingEmail: null, canChange: true, synchronised: true }

function fixture(options = {}) {
  let status = { ...initial, ...options.status }
  const calls = { update: [], verify: [], exchange: [], rpc: [], rpcArgs: [], getUser: 0 }
  const cookieOptions = []
  const user = options.user === undefined ? oldUser : options.user
  const client = {
    auth: {
      getUser: async () => {
        calls.getUser++
        return { data: { user }, error: user ? null : { message: 'signed out' } }
      },
      updateUser: async (...args) => {
        calls.update.push(args)
        if (options.updateError) return { error: options.updateError }
        status = { ...status, pendingEmail: args[0].email }
        return { data: { user: { ...oldUser, new_email: args[0].email } }, error: null }
      },
      verifyOtp: async (args) => {
        calls.verify.push(args)
        const result = options.verification ?? { data: { user: null, session: null }, error: null }
        if (result.data?.session && !result.error) {
          cookieOptions.at(-1).cookies.setAll([{ name: 'sb-session', value: 'confirmed', options: { httpOnly: true } }])
        }
        return result
      },
      exchangeCodeForSession: async (code) => {
        calls.exchange.push(code)
        if (options.exchangeError) return { data: {}, error: options.exchangeError }
        cookieOptions.at(-1).cookies.setAll([{ name: 'sb-session', value: 'refreshed', options: { httpOnly: true } }])
        return options.verification ?? { data: { user: oldUser, session: { user: oldUser } }, error: null }
      },
    },
    rpc: async (name, args) => {
      calls.rpc.push(name)
      calls.rpcArgs.push(args)
      return { data: options.rpcError ? null : status, error: options.rpcError ?? null }
    },
  }
  const mocks = {
    '@supabase/ssr': { createServerClient: (_url, _key, opts) => { cookieOptions.push(opts); return client } },
  }
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'public-test-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-test-key'
  delete process.env.NEXT_PUBLIC_SITE_URL
  delete process.env.VERCEL_ENV
  return { calls, client, requestRoute: loadTs('app/api/account/email/route.ts', mocks),
    profileRoute: loadTs('app/api/account/update/route.ts', mocks), callback: loadTs('app/auth/callback/route.ts', mocks) }
}
function request(pathname, body, headers = {}) {
  return new NextRequest(origin + pathname, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { origin, 'Content-Type': 'application/json', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

test('email format, matching values and difference from confirmed address', () => {
  assert.ok(emailHelpers.validateEmailChange('bad', 'bad', oldUser.email))
  assert.ok(emailHelpers.validateEmailChange('new@example.com', 'other@example.com', oldUser.email))
  assert.ok(emailHelpers.validateEmailChange(' OLD@example.com ', 'old@example.com', oldUser.email))
  assert.equal(emailHelpers.validateEmailChange(' NEW@example.com ', 'new@example.com', oldUser.email), null)
})

test('signed-out users cannot request a change', async () => {
  const f = fixture({ user: null })
  const result = await f.requestRoute.POST(request('/api/account/email', { email: newUser.email, confirmation: newUser.email }))
  assert.equal(result.status, 401)
  assert.equal(f.calls.update.length, 0)
})

test('status uses the database even when session user email is stale after cross-device confirmation', async () => {
  const f = fixture({ user: oldUser, status: { email: newUser.email } })
  const result = await f.requestRoute.GET(request('/api/account/email'))
  assert.equal((await result.json()).email, newUser.email)
  assert.deepEqual(f.calls.rpc, ['get_account_email_change_status'])
})

test('profile edits use only the verified Auth ID and allowed fields in the atomic profile RPC', async () => {
  const f = fixture()
  const profile = { accFirstName: 'Test', accLastName: 'Parent', accTelNo: '123', accEmergencyTelNo: '456', accAddress: 'Example' }
  const result = await f.profileRoute.POST(request('/api/account/update', { ...profile, email: 'injected@example.com', userId: 'injected', account_id: 'injected' }))
  assert.equal(result.status, 200)
  assert.deepEqual(f.calls.rpc, ['save_linked_account_profile'])
  assert.deepEqual(f.calls.rpcArgs, [{ p_auth_user_id: oldUser.id, p_profile: profile }])
})

test('missing migration or invalid account link fails closed', async () => {
  for (const options of [{ rpcError: { code: 'PGRST202' } }, { status: { canChange: false } }]) {
    const f = fixture(options)
    const result = await f.requestRoute.POST(request('/api/account/email', { email: newUser.email, confirmation: newUser.email }))
    assert.ok([409, 503].includes(result.status))
    assert.equal(f.calls.update.length, 0)
  }
})

test('server validation rejects invalid, mismatched and unchanged addresses', async () => {
  for (const body of [{ email: 'bad', confirmation: 'bad' }, { email: newUser.email, confirmation: oldUser.email }, { email: oldUser.email, confirmation: oldUser.email }]) {
    const f = fixture()
    const result = await f.requestRoute.POST(request('/api/account/email', body))
    assert.equal(result.status, 400)
    assert.equal(f.calls.update.length, 0)
  }
})

test('request uses authenticated updateUser with fixed redirect, retains confirmed email', async () => {
  const f = fixture()
  const result = await f.requestRoute.POST(request('/api/account/email', { email: ' NEW@example.com ', confirmation: newUser.email }))
  const data = await result.json()
  assert.equal(data.email, oldUser.email)
  assert.equal(data.pendingEmail, newUser.email)
  assert.deepEqual(f.calls.update, [[{ email: newUser.email }, { emailRedirectTo: origin + '/auth/callback?flow=email-change' }]])
  assert.equal(result.headers.get('Cache-Control'), 'no-store')
  assert.equal(result.headers.get('set-cookie'), null)
})

test('configured site origin is used for the allowed callback', async () => {
  const f = fixture()
  process.env.VERCEL_ENV = 'production'
  process.env.NEXT_PUBLIC_SITE_URL = 'https://production.gym.test'
  await f.requestRoute.POST(request('/api/account/email', { email: newUser.email, confirmation: newUser.email }))
  assert.equal(f.calls.update[0][1].emailRedirectTo, 'https://production.gym.test/auth/callback?flow=email-change')
  delete process.env.NEXT_PUBLIC_SITE_URL
  delete process.env.VERCEL_ENV
})

test('Vercel preview confirmations stay on the preview despite a production site URL', async () => {
  const f = fixture()
  process.env.VERCEL_ENV = 'preview'
  process.env.NEXT_PUBLIC_SITE_URL = 'https://www.eaglegymnastics.co.uk'
  const previewOrigin = 'https://eagle-gym-git-email-test.vercel.app'
  try {
    await f.requestRoute.POST(new NextRequest(previewOrigin + '/api/account/email', {
      method: 'POST', headers: { origin: previewOrigin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newUser.email, confirmation: newUser.email, redirectTo: 'https://other.test' }),
    }))
    assert.equal(f.calls.update[0][1].emailRedirectTo, previewOrigin + '/auth/callback?flow=email-change')
    const response = await f.callback.GET(new NextRequest(previewOrigin + '/auth/callback?flow=email-change&token_hash=hash&type=email_change'))
    assert.equal(response.headers.get('location'), previewOrigin + '/auth/email-change?token_hash=hash')
  } finally {
    delete process.env.VERCEL_ENV
    delete process.env.NEXT_PUBLIC_SITE_URL
  }
})

test('localhost confirmations stay local despite a production site URL', async () => {
  const f = fixture()
  const previousNodeEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'development'
  process.env.NEXT_PUBLIC_SITE_URL = 'https://www.eaglegymnastics.co.uk'
  const localOrigin = 'http://localhost:3000'
  try {
    await f.requestRoute.POST(new NextRequest(localOrigin + '/api/account/email', {
      method: 'POST', headers: { origin: localOrigin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newUser.email, confirmation: newUser.email }),
    }))
    assert.equal(f.calls.update[0][1].emailRedirectTo, localOrigin + '/auth/callback?flow=email-change')
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previousNodeEnv
    delete process.env.NEXT_PUBLIC_SITE_URL
  }
})

test('cross-origin requests are rejected before mutation', async () => {
  const f = fixture()
  const result = await f.requestRoute.POST(request('/api/account/email', { email: newUser.email, confirmation: newUser.email }, { origin: 'https://other.test' }))
  assert.equal(result.status, 403)
  assert.equal(f.calls.update.length, 0)
  assert.equal((await f.callback.POST(request('/auth/callback', { tokenHash: 'hash' }, { origin: 'https://other.test' }))).status, 403)
})

test('rate limits and duplicate request errors produce no success', async () => {
  for (const updateError of [{ status: 429 }, { status: 422 }]) {
    const f = fixture({ updateError })
    const response = await f.requestRoute.POST(request('/api/account/email', { email: newUser.email, confirmation: newUser.email }))
    assert.equal(response.status, updateError.status === 429 ? 429 : 400)
    assert.ok((await response.json()).error)
  }
})

test('email GET callback forwards only confirmation inputs and never consumes the link', async () => {
  const f = fixture()
  const response = await f.callback.GET(request('/auth/callback?flow=email-change&token_hash=hash&type=email_change&next=https://evil.test&status=confirmed'))
  assert.equal(response.headers.get('location'), origin + '/auth/email-change?token_hash=hash')
  assert.equal(f.calls.verify.length, 0)
  assert.equal(f.calls.exchange.length, 0)
})

test('first secure confirmation is partial even with another signed-in account', async () => {
  const f = fixture({ user: newUser, status: { email: newUser.email } })
  const result = await f.callback.POST(request('/auth/callback', { tokenHash: 'current-address-hash' }))
  assert.deepEqual(await result.json(), { status: 'partial' })
  assert.equal(f.calls.getUser, 0)
  assert.deepEqual(f.calls.verify, [{ token_hash: 'current-address-hash', type: 'email_change' }])
  assert.equal(result.headers.get('set-cookie'), null)
})

test('full token-hash confirmation on another device requires database and verified user agreement', async () => {
  const f = fixture({ user: newUser, status: { email: newUser.email }, verification: { data: { user: newUser, session: { user: newUser } }, error: null } })
  const result = await f.callback.POST(request('/auth/callback', { tokenHash: 'new-address-hash' }))
  assert.deepEqual(await result.json(), { status: 'confirmed', email: newUser.email })
  assert.equal(f.calls.exchange.length, 0)
  assert.equal(f.calls.rpc.length, 1)
  assert.match(result.headers.get('set-cookie'), /sb-session=confirmed/)
})

test('pending, unsynchronised and mismatched sessions cannot report confirmed success', async () => {
  for (const options of [{ status: { pendingEmail: newUser.email } }, { status: { synchronised: false } }, { user: { ...newUser, id: 'different-user' } }, { status: { email: oldUser.email } }]) {
    const f = fixture({ ...options, user: options.user ?? newUser, status: { email: newUser.email, ...options.status },
      verification: { data: { user: newUser, session: { user: newUser } }, error: null } })
    const result = await f.callback.POST(request('/auth/callback', { tokenHash: 'hash' }))
    assert.deepEqual(await result.json(), { status: 'check' })
  }
})

test('invalid, expired and reused verification links produce an error', async () => {
  for (const code of ['otp_expired', 'validation_failed', 'token_already_used']) {
    const f = fixture({ verification: { data: {}, error: { code } } })
    const result = await f.callback.POST(request('/auth/callback', { tokenHash: 'hash' }))
    assert.equal(result.status, 400)
    assert.deepEqual(await result.json(), { status: 'error' })
  }
})

test('missing or ambiguous confirmation inputs fail without consuming anything', async () => {
  for (const body of [{}, { tokenHash: 'hash', code: 'code' }]) {
    const f = fixture()
    const result = await f.callback.POST(request('/auth/callback', body))
    assert.equal(result.status, 400)
    assert.equal(f.calls.verify.length + f.calls.exchange.length, 0)
  }
})

test('legacy PKCE email links exchange sessions without claiming success from an untyped code', async () => {
  const f = fixture({ user: newUser, status: { email: newUser.email }, verification: { data: { user: newUser, session: { user: newUser } }, error: null } })
  const result = await f.callback.POST(request('/auth/callback', { code: 'legacy-code' }))
  assert.deepEqual(await result.json(), { status: 'check' })
  assert.deepEqual(f.calls.exchange, ['legacy-code'])
  assert.match(result.headers.get('set-cookie'), /sb-session=refreshed/)
})

test('signup and recovery callbacks still exchange codes, persist cookies and honour local redirects', async () => {
  for (const next of ['/reset-password', '/login?verified=signup&redirect=%2Faccount']) {
    const f = fixture()
    const response = await f.callback.GET(request('/auth/callback?code=existing-flow&next=' + encodeURIComponent(next)))
    assert.equal(response.headers.get('location'), origin + next)
    assert.deepEqual(f.calls.exchange, ['existing-flow'])
    assert.match(response.headers.get('set-cookie'), /sb-session=refreshed/)
  }
})

test('existing callback errors and unsafe redirect targets are handled', async () => {
  const f = fixture({ exchangeError: { code: 'invalid_code' } })
  const failed = await f.callback.GET(request('/auth/callback?code=expired'))
  assert.equal(failed.headers.get('location'), origin + '/login?error=auth_callback')
  const missing = await f.callback.GET(request('/auth/callback'))
  assert.equal(missing.headers.get('location'), origin + '/login?error=missing_code')
  for (const unsafe of ['https://evil.test', '//evil.test', '/\\evil.test', '/\nevil.test']) {
    assert.equal(emailHelpers.safeAuthNext(unsafe), '/reset-password')
  }
})
