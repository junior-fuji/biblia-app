'use strict';
// Executar: node tests/security/supabase-public-client.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const publicKey = 'sb_publishable_synthetic-test';
const projectUrl = 'https://project.invalid';
let scenarios = 0;
function evaluate(file, { env = {}, constants = {}, platform = 'ios' } = {}) {
  const calls = [];
  const listeners = [];
  const storage = {};
  const lock = () => {};
  const session = { access_token: 'synthetic-session' };
  const authCalls = [];
  const client = {
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      signOut: async options => { authCalls.push(options); },
      startAutoRefresh: () => authCalls.push('start'),
      stopAutoRefresh: () => authCalls.push('stop'),
    },
    from: table => { calls.push(table); return client; },
  };
  const deny = () => { throw new Error('Acesso externo proibido no teste'); };
  const modules = {
    '@react-native-async-storage/async-storage': storage,
    '@supabase/supabase-js': { createClient: (...args) => { calls.push(args); return client; }, processLock: lock },
    'expo-constants': constants,
    'react-native': { Platform: { OS: platform }, AppState: { addEventListener: (...args) => listeners.push(args) } },
    'react-native-url-polyfill/auto': {},
    'dotenv/config': {}, // Nenhum carregamento real de .env.
  };
  const cache = new Map();
  function load(relativeFile) {
    if (cache.has(relativeFile)) return cache.get(relativeFile);
    assert.ok(['lib/supabaseClient.ts', 'src/services/supabase/Client.ts', 'app.config.js'].includes(relativeFile));
    const source = fs.readFileSync(path.join(root, relativeFile), 'utf8');
    const output = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText;
    const exports = {};
    cache.set(relativeFile, exports);
    vm.runInNewContext(output, { exports, process: { env: { ...env } },
      require: name => name === '../../../lib/supabaseClient'
        ? load('lib/supabaseClient.ts')
        : Object.hasOwn(modules, name) ? modules[name] : deny(),
      console: { log: deny, error: deny }, fetch: deny, WebSocket: deny,
    }, { timeout: 1000, contextCodeGeneration: { strings: false, wasm: false } });
    return exports;
  }
  const exports = load(file);
  scenarios++;
  return { exports, load, calls, listeners, storage, lock, client, session, authCalls };
}
(async () => {
  for (const file of ['lib/supabaseClient.ts', 'src/services/supabase/Client.ts']) {
    for (const platform of ['ios', 'web']) {
      const r = evaluate(file, { platform, env: { EXPO_PUBLIC_SUPABASE_URL: projectUrl, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publicKey } });
      assert.equal(r.calls.length, 1);
      const [url, key, options] = r.calls[0];
      assert.equal(url, projectUrl); assert.equal(key, publicKey);
      assert.equal(options.auth.storage, platform === 'web' ? undefined : r.storage);
      assert.equal(options.auth.lock, r.lock);
      assert.equal(options.auth.autoRefreshToken, true);
      assert.equal(options.auth.persistSession, true);
      assert.equal(options.auth.detectSessionInUrl, false);
      assert.equal(r.exports.getSupabaseOrThrow(), r.client);
      assert.equal(r.exports.getSupabaseOrNull(), r.client);
      assert.equal(r.exports.isSupabaseConfigured(), true);
      assert.equal(await r.exports.getSessionOrNull(), r.session);
      await r.exports.clearBrokenSupabaseSession();
      assert.equal(r.authCalls[0].scope, 'local');
      if (platform !== 'web') {
        assert.equal(r.listeners.length, 1);
        r.listeners[0][1]('active'); r.listeners[0][1]('background');
        assert.deepEqual(r.authCalls.slice(1), ['start', 'stop']);
      } else assert.equal(r.listeners.length, 0);
      r.exports.getSupabaseOrThrow().from('bible_verses');
      assert.equal(r.calls[1], 'bible_verses');
    }
    for (const container of ['expoConfig', 'manifest2']) {
      const r = evaluate(file, { constants: { [container]: { extra: {
        EXPO_PUBLIC_SUPABASE_URL: projectUrl, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publicKey,
      } } } });
      assert.equal(r.calls[0][0], projectUrl); assert.equal(r.calls[0][1], publicKey);
    }
    const legacyUrl = evaluate(file, { constants: { expoConfig: { extra: { supabaseUrl: projectUrl, supabasePublishableKey: publicKey } } } });
    assert.equal(legacyUrl.calls[0][0], projectUrl);
    const priority = evaluate(file, { env: { EXPO_PUBLIC_SUPABASE_URL: projectUrl, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publicKey }, constants: { expoConfig: { extra: { EXPO_PUBLIC_SUPABASE_URL: 'https://other.invalid', EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_other' } } } });
    assert.equal(priority.calls[0][0], projectUrl); assert.equal(priority.calls[0][1], publicKey);
    const absent = evaluate(file);
    assert.equal(absent.calls.length, 0); assert.equal(absent.exports.isSupabaseConfigured(), false);
    assert.equal(await absent.exports.getSessionOrNull(), null);
    assert.throws(() => absent.exports.getSupabaseOrThrow(), /não configurado/);
    const old = evaluate(file, { env: { EXPO_PUBLIC_SUPABASE_URL: projectUrl, EXPO_PUBLIC_SUPABASE_ANON_KEY: 'synthetic-old' } });
    assert.equal(old.calls.length, 0);
    for (const bad of ['sb_secret_synthetic-admin', 'synthetic.jwt.value', 'sb_publishable_', 'sb_publishable_bad value']) {
      assert.throws(() => evaluate(file, { env: { EXPO_PUBLIC_SUPABASE_URL: projectUrl, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: bad } }), error => {
        assert.equal(error.message, 'Configuração Supabase inválida: use uma chave pública sb_publishable_.');
        return true;
      }); scenarios++;
    }
  }
  const config = evaluate('app.config.js', { env: { EXPO_PUBLIC_SUPABASE_URL: projectUrl, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publicKey, EXPO_PUBLIC_API_BASE_URL: 'https://api.invalid' } });
  const result = config.exports.default({ config: { name: 'Synthetic', extra: { existing: true } } });
  assert.equal(result.extra.EXPO_PUBLIC_SUPABASE_URL, projectUrl);
  assert.equal(result.extra.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, publicKey);
  assert.equal(result.extra.EXPO_PUBLIC_API_BASE_URL, 'https://api.invalid');
  assert.equal(result.extra.existing, true); assert.equal(result.name, 'Synthetic');
  assert.ok(!Object.hasOwn(result.extra, 'EXPO_PUBLIC_SUPABASE_ANON_KEY'));
  for (const bad of ['sb_secret_synthetic-admin', 'synthetic.jwt.value']) {
    const cfg = evaluate('app.config.js', { env: { EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: bad } });
    assert.throws(() => cfg.exports.default({ config: { extra: {} } }), /use uma chave pública/);
  }
  // Ambos os caminhos públicos precisam apontar para as mesmas funções/instância.
  for (const first of ['lib/supabaseClient.ts', 'src/services/supabase/Client.ts']) {
    const shared = evaluate(first, { env: { EXPO_PUBLIC_SUPABASE_URL: projectUrl, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publicKey } });
    const canonical = shared.load('lib/supabaseClient.ts');
    const compatibility = shared.load('src/services/supabase/Client.ts');
    assert.deepEqual(Object.keys(compatibility).sort(), Object.keys(canonical).sort());
    for (const name of Object.keys(canonical)) assert.equal(compatibility[name], canonical[name]);
    assert.equal(compatibility.getSupabaseOrThrow(), canonical.getSupabaseOrThrow());
    assert.equal(shared.calls.length, 1);
    assert.equal(shared.listeners.length, 1);
  }
  const inherited = config.exports.default({ config: { extra: { eas: { projectId: 'synthetic-project' }, router: { origin: false } } } });
  assert.equal(inherited.extra.eas.projectId, 'synthetic-project');
  assert.equal(inherited.extra.router.origin, false);
  const production = JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8')).build.production;
  assert.equal(production.environment, 'production');
  assert.ok(!Object.hasOwn(production.env, 'EXPO_PUBLIC_SUPABASE_ANON_KEY'));
  assert.ok(!Object.hasOwn(production.env, 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'));
  // A chave pública é fornecida pelo ambiente EAS production, nunca por placeholder local.
  assert.ok(!Object.values(production.env).some(value => /SUA_|SEU_|YOUR_/.test(value)));
  scenarios += 2;
  for (const name of ['seed_books.ts', 'seed_genesis.ts', 'seed_text_pt.ts']) {
    // Apenas análise estática: não transpilar/carregar/executar seeds.
    const source = fs.readFileSync(path.join(root, 'scripts', name), 'utf8');
    assert.ok(source.includes('process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'));
    assert.ok(!source.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY'));
    assert.ok(!/SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/.test(source));
    assert.ok(source.indexOf('if (!/^sb_publishable_') < source.indexOf('const supabase = createClient'));
    scenarios++;
  }
  console.log(`PASS: ${scenarios} cenários isolados; configuração pública, autenticação, sessões, refresh, singleton e acesso bíblico simulado.`);
  console.log('Sem SDK real, rede, banco ou leitura de .env.');
})().catch(error => { console.error(error); process.exitCode = 1; });
