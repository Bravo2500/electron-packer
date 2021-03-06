const fetch = require('node-fetch');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const mkdir = promisify(require('fs').mkdir);
const electronPackager = promisify(require('electron-packager'));
const { package } = require('package.root');
const appName = package.name;
const electronVersion = package.devDependencies.electron.slice(1);

mkdir('tmp').catch(errorHandler)
  .then(() => mkdir('tmp/dest').catch(errorHandler))
  .then(() => exec('cp -r lib/ tmp/dest/lib').then(printStdout))
  .then(() => exec('cp LICENSE tmp/dest/').then(printStdout))
  .then(() => exec('cp package.json tmp/dest/').then(printStdout))
  .then(() => exec('cp README*.md tmp/dest/').then(printStdout))
  .then(() => exec('npm install --production', { cwd: 'tmp/dest' }).then(printStdout))
  .then(() => execPackageAndZip(electronVersion, 'tmp', 'dest', 'darwin', 'x64', 'src/res/icon.icns'))
  .then(() => execPackageAndZip(electronVersion, 'tmp', 'dest', 'win32', 'ia32', 'src/res/icon_256.ico'))
  .then(() => execPackageAndZip(electronVersion, 'tmp', 'dest', 'linux', 'x64', null));

function execPackageAndZip(version, cwd, path, platform, arch, icon) {
  const os = (() => {
    switch (platform) {
      case 'darwin': return 'mac';
      case 'win32': return 'win';
      case 'linux': return 'linux';
      default: throw new Error();
    }
  })();
  const zipPath = `tmp/${appName}-${platform}-${arch}`;
  return electronPackager(
    {
      dir: `${cwd}/${path}`,
      name: appName,
      platform,
      arch,
      version,
      icon,
      asar: true,
      out: cwd
    })
    .then(printStdout)
    .then(() => exec(`zip -qry ../${appName}-${os}.zip .`, { cwd: zipPath }))
    .then(printStdout);
}

function errorHandler(e) {
  if (e.code !== 'EEXIST') {
    throw e;
  }
}

function printStdout(stdout) {
  if (stdout.length > 0) {
    console.log(stdout);
  }
}
