import craie from 'craie'

const red = (message: string) => craie.roundSL.bgRed.white(message)
const blue = (message: string) => craie.roundSR.bgBlue.white(message)

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

let injectError = true
async function require(pkg: string): Promise<void> {
  craie.info(red('Fetching'), blue(pkg))
  try {
    const [code, pkgInfo] = await Promise.all([fetchPkg(pkg), fetchPkgInfo(pkg)]);
    const pkgName = pkgInfo.name + '@' + pkgInfo.version
    const injectedCode = `
      ${code}
      ;window.postMessage({ type: 'require_success', data: { pkg: '${pkgName}' } })
    `
    injectError = true
    setTimeout(() => injectError && craie.info(
        red('⚠️ Failed'),
        blue(pkgName),
        craie.red(` \`${pkgName}\` may not support browser.`)
      ), 
      300
    )
    injectCode(injectedCode)
  } catch(e: any) {
    craie.info(red('⚠️ Failed'), blue(pkg), craie.red(' ' + e.message))
  }
}

function injectCode(code: string) {
  const script = document.createElement('script')
  script.innerHTML = code
  document.body.appendChild(script)
  script.remove()
}

export function injectRequire(namespace: string = '_require') {
  injectCode(`
    if(window.${namespace}) {
      window.postMessage({ type: 'conflict', data: { namespace: ${namespace} } })
    } else {
      window.${namespace} = function(pkg) {
        window.postMessage({ type: 'require', data: { pkg } })
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
    if(event.source == window && event.data?.type === 'require_success') {
      injectError = false
      const pkg = event.data.data.pkg
      craie.info(red('Required'), blue(pkg))
    }
    if(event.source == window && event.data?.type === 'conflict') {
      const namespace = event.data.data.namespace
      craie.info(red('⚠️ Failed'), craie.red(`\`${namespace}\` already existed, won't inject anything.`))
    }
  })
}
