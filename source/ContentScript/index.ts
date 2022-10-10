// import chalk from 'chalk';

async function fetchPkg(pkg: string): Promise<string> {
  const res = await fetch(`https://cdn.jsdelivr.net/npm/${pkg}`);
  const code = await res.text();
  return code;
}

async function fetchPkgInfo(pkg: string): Promise<Record<string, unknown>> {
  const res = await fetch(`https://cdn.jsdelivr.net/npm/${pkg}/package.json`);
  const pkgInfo = await res.json();
  return pkgInfo;
}

export async function require(pkg: string): Promise<void> {
  console.log(`Fetching ${pkg}`);
  const [code, pkgInfo] = await Promise.all([fetchPkg(pkg), fetchPkgInfo(pkg)]);
  // eslint-disable-next-line
  eval(code);
  console.log(`Done with ${pkgInfo.version}`);
}

console.log('Started');
// eslint-disable-next-line
// @ts-ignore
// TODO: doesn't work, fix it
window.requir = require;
