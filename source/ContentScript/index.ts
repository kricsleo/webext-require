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
  injectCode(code)
  console.log(`Done with ${pkgInfo.version}`);
}

function injectCode(code: string) {
  const script = document.createElement('script')
  script.innerHTML = code
  document.body.appendChild(script)
  script.remove()
}

function injectRequire() {
  injectCode(`
    window.require = function(pkg) {
      window.postMessage({
        type: 'require',
        data: { pkg }
      })
    }
  `)
}

function contentListen() {
  window.addEventListener("message", event => {
    if(event.source == window && event.data?.type === 'require') {
      const pkg = event.data.data.pkg
      require(pkg)
    }
  })
}

contentListen()
injectRequire()
