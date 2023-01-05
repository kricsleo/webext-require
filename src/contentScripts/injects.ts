import craie from 'craie'

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

async function require(pkg: string): Promise<void> {
  craie.info(craie.roundSL.bgRose.white('Fetching'), craie.roundSR.bgWhite.rose(pkg))
  const [code, pkgInfo] = await Promise.all([fetchPkg(pkg), fetchPkgInfo(pkg)]);
  craie.info(craie.roundSL.bgRose.white('Injected'), craie.roundSR.bgWhite.rose(`${pkgInfo.name}@${pkgInfo.version}`))
  injectCode(code)
}

function injectCode(code: string) {
  const script = document.createElement('script')
  script.type = 'module'
  script.innerHTML = code
  // script.innerHTML = `
  //   try {
  //     ${code}
  //   } catch(e) {
  //     console.error('[Require]O_o, this package may not support browser.')
  //   }
  // `
  document.body.appendChild(script)
  // script.remove()
}

export function injectRequire(namespace: string = '_require') {
  injectCode(`
    if(window.${namespace}) {
      console.log("⚙️ \`${namespace}\` already existed, won't inject.")
    } else {
      window.${namespace} = function(pkg) {
        window.postMessage({
          type: 'require',
          data: { pkg }
        })
      }
    }
  `)
}

export function listenRequire() {
  window.addEventListener("message", event => {
    if(event.source == window && event.data?.type === 'require') {
      const pkg = event.data.data.pkg
      require(pkg)
    }
  })
}

