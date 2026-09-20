// 執行所有測試：把 app.js 內嵌進 index.html 後交給各測試（jsdom 不載入外部 script），任一項 FAIL 即回傳非 0。
const fs = require('fs'), os = require('os'), path = require('path');
const { spawnSync } = require('child_process');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const combined = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'turtle-')), 'combined.html');
fs.writeFileSync(combined, html.replace('<script src="app.js"></script>', () => `<script>\n${js}</script>`));

const chk = spawnSync(process.execPath, ['--check', path.join(root, 'app.js')], { stdio: 'inherit' });
let failed = chk.status !== 0;
if (!failed) console.log('PASS 語法檢查 app.js');

const suites = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.js')).sort();
for (const f of suites) {
  const target = f === 'xss.test.js' ? path.join(root, 'app.js') : combined;
  console.log(`\n== ${f}`);
  const r = spawnSync(process.execPath, [path.join(__dirname, f), target], { encoding: 'utf8' });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  if (r.status !== 0 || /^FAIL/m.test(r.stdout || '')) failed = true;
}
console.log(failed ? '\n有測試失敗' : '\n全部通過');
process.exit(failed ? 1 : 0);
