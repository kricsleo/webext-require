import craie from 'craie'

const red = (message: string) => craie.roundSL.bgRed.white(message)
const blue = (message: string) => craie.roundSR.bgBlue.white(message)

enum PKG_TYPE {
  CSS,
  JS,
  OTHER
}

async function fetchPkg(pkg: string) {
  const res = await fetch(`https://cdn.jsdelivr.net/npm/${pkg}`);
  const pkgType = detectPkgType(res)
  const code = await res.text();
  return { code, pkgType };
}

async function fetchPkgInfo(pkg: string): Promise<Record<string, unknown>> {
  const res = await fetch(`https://cdn.jsdelivr.net/npm/${pkg}/package.json`);
  const pkgInfo = await res.json();
  return pkgInfo;
}

let injected = false
async function require(pkg: string): Promise<void> {
  craie.info(red('Fetching'), blue(pkg))
  try {
    const [{ code, pkgType }, pkgInfo] = await Promise.all([
      fetchPkg(pkg), 
      fetchPkgInfo(pkg).catch(() => null)
    ]);
    const pkgName = pkgInfo ? pkgInfo.name + '@' + pkgInfo.version : pkg
    switch (pkgType) {
      case PKG_TYPE.JS: {
        const detectVarsCode = `window.postMessage({ type: 'vars', data: { vars: Object.keys(window) } })`
        injectJS(detectVarsCode)
        const injectedCode = `
          ${code}
          ;window.postMessage({ type: 'require_success', data: { pkg: '${pkgName}', vars: Object.keys(window) } })
        `
        injected = false
        injectJS(injectedCode)
        setTimeout(() => {
          if(!injected) {
            craie.info(
              red('⚠️ Failed'),
              blue(pkgName),
              craie.red(` \`${pkgName}\` may not support browser.`)
            )
          }
        }, 300)
      };break;
      case PKG_TYPE.CSS: {
        injectCSS(code)
        craie.info(red('Required'), blue(pkgName), craie.blue(' CSS has been injected into current page'))
      };break;
      default: craie.info(red('⚠️ Failed'), blue(pkgName), craie.red(` \`${pkgName}\` may not support browser.`))
    }
  } catch(e: any) {
    craie.info(red('⚠️ Failed'), blue(pkg), craie.red(' ' + e.message))
  }
}

function detectPkgType(reponse: Response) {
  const contentType = reponse.headers.get('content-type')
  if(contentType.includes('text/css')) {
    return PKG_TYPE.CSS
  } else if(contentType.includes('application/javascript')) {
    return PKG_TYPE.JS
  } else {
    return PKG_TYPE.OTHER
  }
}

function injectJS(code: string) {
  const script = document.createElement('script')
  script.innerHTML = code
  document.body.appendChild(script)
  script.remove()
}

function injectCSS(code: string) {
  const style = document.createElement("style");
  style.innerHTML = code
  document.head.appendChild(style);
}

export function injectRequire(namespace: string = '_require') {
  injectJS(`
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
  let prevVars = []
  window.addEventListener("message", event => {
    if(event.source == window && event.data?.type === 'require') {
      const pkg = event.data.data.pkg
      require(pkg)
    }
    if(event.source == window && event.data?.type === 'require_success') {
      injected = true
      const { vars, pkg } = event.data.data
      const addedVars = vars.filter(v => !prevVars.includes(v))
      if(addedVars.length) {
        craie.info(red('Required'), blue(pkg), craie.blue(` Found added global namespace: ${addedVars.join(',')}`))
      } else {
        craie.info(red('Required'), blue(pkg), craie.red(` But no added global namespace found`))
      }
    }
    if(event.source == window && event.data?.type === 'vars') {
      prevVars = event.data.data.vars
    }
    if(event.source == window && event.data?.type === 'conflict') {
      const namespace = event.data.data.namespace
      craie.info(red('⚠️ Failed'), craie.red(`\`${namespace}\` already existed, won't inject anything.`))
    }
  })
}
