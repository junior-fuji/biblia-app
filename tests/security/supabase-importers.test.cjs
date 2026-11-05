'use strict';
// Reproduzir na raiz do repositório: node tests/security/supabase-importers.test.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
// Baseline imutável de origin/main na preparação; consulta apenas os cinco scripts.
const baselineCommit = 'e8984ed18923616df270c00b898eea57ea2855e6';
const files = ['importAllBibles.js', 'scripts/ import-bibles.js', 'scripts/import-missing-bibles.js', 'scripts/importBibleJson.js', 'scripts/reimport-bibles.js'];
let cases = 0;
function run(file, { args = [], env = {}, main = true } = {}) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const mod = {};
  const state = { modules: [], clients: 0, dotenv: 0, forbidden: 0, logs: [] };
  const processStub = { argv: ['node', file, ...args], env: { ...env }, exitCode: 0,
    exit() { state.forbidden++; throw Error('exit inesperado'); } };
  const deny = () => { state.forbidden++; throw Error('Operação proibida no teste'); };
  const requireStub = name => {
    state.modules.push(name);
    if (name === 'dotenv') return { config() { state.dotenv++; return {}; } };
    if (name === 'fs') return Object.freeze({ readFileSync: deny, existsSync: deny });
    if (name === 'path') return Object.freeze({ resolve: (...parts) => parts.join('/') });
    if (name === '@supabase/supabase-js') return { createClient(url, key) {
      state.clients++;
      assert.equal(url, env.SUPABASE_URL);
      assert.equal(key, env.SUPABASE_SECRET_KEY);
      // Interrompe antes de entrar na lógica de banco, mesmo com configuração válida.
      throw Error('CLIENTE SIMULADO: sem transporte ou acesso ao banco');
    } };
    return deny();
  };
  requireStub.main = main ? mod : {};
  const context = vm.createContext({ module: mod, exports: {}, require: requireStub,
    process: processStub, URL, __dirname: '/synthetic',
    console: { log: (...v) => state.logs.push(v.join(' ')), error: (...v) => state.logs.push(v.join(' ')) },
    fetch: deny, WebSocket: deny }, { codeGeneration: { strings: false, wasm: false } });
  // O código completo recebe somente dependências simuladas e nenhum transporte real.
  new vm.Script(source, { filename: file }).runInContext(context, { timeout: 1000 });
  assert.equal(state.forbidden, 0);
  assert.ok(!state.logs.join('\n').includes('sb_secret_synthetic-test-value'));
  cases++;
  return { ...state, exitCode: processStub.exitCode };
}
const valid = { SUPABASE_URL: 'https://example.invalid', SUPABASE_SECRET_KEY: 'sb_secret_synthetic-test-value' };
for (const file of files) {
  execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
  for (const args of [[], ['--execute-import=false'], ['--other']]) {
    const r = run(file, { args, env: valid });
    assert.equal(r.exitCode, 1); assert.deepEqual(r.modules, []); assert.equal(r.clients, 0);
    assert.match(r.logs.join(), /informe --execute-import/);
  }
  for (const env of [{ NODE_ENV: 'test' }, { NODE_TEST_CONTEXT: 'child-v8' }, { JEST_WORKER_ID: '1' }, { VITEST: 'true' }]) {
    const r = run(file, { args: ['--execute-import'], env: { ...valid, ...env } });
    assert.equal(r.exitCode, 1); assert.deepEqual(r.modules, []); assert.match(r.logs.join(), /contexto de teste/);
  }
  const loaded = run(file, { main: false, args: ['--execute-import'], env: valid });
  assert.equal(loaded.exitCode, 0); assert.deepEqual(loaded.modules, []);
  for (const patch of [{ SUPABASE_URL: undefined }, { SUPABASE_URL: 'invalid' },
    { SUPABASE_URL: 'https://user:synthetic-password@example.invalid' },
    { SUPABASE_URL: 'http://example.invalid' }, { SUPABASE_URL: 'https://example.invalid/path' },
    { SUPABASE_SECRET_KEY: undefined }, { SUPABASE_SECRET_KEY: 'sb_publishable_synthetic' },
    { SUPABASE_SECRET_KEY: 'sb_secret_' }, { SUPABASE_SECRET_KEY: 'sb_secret_synthetic value' }]) {
    const r = run(file, { args: ['--execute-import'], env: { ...valid, ...patch } });
    assert.equal(r.exitCode, 1); assert.equal(r.clients, 0); assert.match(r.logs.join(), /Importação não iniciada/);
    assert.ok(!r.logs.join().includes('synthetic-password'));
  }
  for (const url of ['https://example.invalid', 'http://localhost:54321']) {
    const r = run(file, { args: ['--execute-import'], env: { ...valid, SUPABASE_URL: url } });
    assert.equal(r.clients, 1); assert.equal(r.exitCode, 1); assert.match(r.logs.join(), /Importação não iniciada/);
    assert.equal(r.dotenv, ['importAllBibles.js', 'scripts/importBibleJson.js'].includes(file) ? 1 : 0);
  }
  // Compara com o commit original, permitindo somente migração e remoção de validação redundante.
  let original = execFileSync('git', ['show', `${baselineCommit}:${file}`], { cwd: root, encoding: 'utf8' }).replaceAll('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY');
  original = original.replace(/\nif \(!(?:supabaseUrl \|\| !supabaseKey|SUPABASE_URL \|\| !SUPABASE_SECRET_KEY)\) \{\n.*?\n\}\n/s, '\n');
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  let body = source.split('function executeImport() {\n')[1];
  body = body.slice(0, body.lastIndexOf('\n}')).replace('validateSupabaseConfig(process.env);\n', '');
  assert.equal(body.trimEnd(), original.trimEnd());
}
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.equal(pkg.scripts['reimport:bibles'], 'node scripts/reimport-bibles.js --execute-import');
assert.equal(pkg.scripts['import:missing-bibles'], 'node scripts/import-missing-bibles.js --execute-import');
console.log(`PASS: ${cases} cenários com módulos completos; sintaxe de 5 arquivos; 2 comandos npm; lógica original preservada.`);
console.log('Rede e banco indisponíveis no contexto; dotenv simulado; nenhum arquivo de dados ou .env lido pelos importadores.');
