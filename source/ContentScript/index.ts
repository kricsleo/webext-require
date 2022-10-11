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
  console.log(`⚙️ Fetching ${pkg}`);
  try {
    const [code, pkgInfo] = await Promise.all([fetchPkg(pkg), fetchPkgInfo(pkg)]);
    console.log(`⚙️ Is using ${pkgInfo.name}@${pkgInfo.version}`);
    injectCode(code)
  } catch(e) {
    console.error('O_o Fetch error.')
    throw e
  }
}

function injectCode(code: string) {
  const script = document.createElement('script')
  script.innerHTML = `
    try {
      ${code}
    } catch(e) {
      console.error('O_o Excute error, this package may not support browser.')
    }
  `
  document.body.appendChild(script)
  script.remove()
}

function injectRequire() {
  injectCode(`
    if(window.require) {
      console.log("⚙️ Already got an require, won't inject.")
    } else {
      window.require = function(pkg) {
        window.postMessage({
          type: 'require',
          data: { pkg }
        })
      }
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

function run() {
  injectRequire()
  contentListen()
}

run()
