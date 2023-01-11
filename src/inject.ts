import craie from 'craie'

const green = (message: string) => craie.bgEmerald.roundL.white(message)
const red = (message: string) => craie.roundL.bgRed.white(message)
const blue = (message: string) => craie.roundR.bgBlue.white(message)

enum PKG_TYPE {
  CSS,
  JS,
  OTHER
}

async function fetchCDN(url: string) {
  const res = await fetch(url);
  const type = detectPkgType(res)
  const code = await res.text();
  return { code, type, version: '', url };
}

async function fetchNPM(pkg: string) {
  const url = `https://cdn.jsdelivr.net/npm/${pkg}`
  const res = await fetch(url);
  const type = detectPkgType(res)
  const version = detectPkgVersion(res)
  const code = await res.text();
  return { code, type, version, url };
}

function isCDN(pkg: string) {
  return /^https?:/.test(pkg)
}

function getPkgName(pkg: string) {
  // match pkgName@version
  const matches = pkg.match(/(^.+)(@[0-9]+($|\..*))/)
  return matches ? matches[1] : pkg
}

let injected = false
async function require(pkg: string): Promise<void> {
  craie.info(green('Fetching'), blue(pkg))
  const isCDNPkg = isCDN(pkg)
  try {
    const { code, type, version, url } = isCDNPkg ? await fetchCDN(pkg) : await fetchNPM(pkg)
    const fullPkgName = isCDNPkg ? pkg : getPkgName(pkg) + (version ? `@${version}` : '')
    switch (type) {
      case PKG_TYPE.JS: {
        const detectVarsCode = `window.postMessage({ type: 'vars', data: { vars: Object.keys(window) } })`
        injectJS(detectVarsCode)
        const injectedCode = `
          ${code}
          ;window.postMessage({ type: 'require_success', data: { pkg: '${fullPkgName}', vars: Object.keys(window) } })
        `
        injected = false
        injectJS(injectedCode)
        setTimeout(() => {
          if(!injected) {
            craie.info( red('⚠️ Failed'), blue(fullPkgName), craie.red(` \`${fullPkgName}\` may not support browser`) )
          }
        }, 300)
      };break;
      case PKG_TYPE.CSS: {
        injectCSS(code)
        craie.info(green('Required'), blue(fullPkgName), craie.blue(' CSS has been injected into current page'))
      };break;
      default: craie.info(red('⚠️ Failed'), blue(fullPkgName), craie.red(` No supported content type auto-detected: ${url}`))
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

function detectPkgVersion(reponse: Response) {
  // header specified by https://cdn.jsdelivr.net
  const version = reponse.headers.get('x-jsd-version')
  return version
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
      const pkgArg = Array.isArray(event.data.data.pkg) ? event.data.data.pkg[0] : event.data.data.pkg
      const pkg = pkgArg ? pkgArg.trim() : ''
      if(!pkg) {
        craie.info(red('⚠️ Failed'), craie.red(` Missing package name`))
        return
      }
      require(pkg)
    }
    if(event.source == window && event.data?.type === 'require_success') {
      injected = true
      const { vars, pkg } = event.data.data
      const addedVars = vars.filter(v => !prevVars.includes(v))
      if(addedVars.length) {
        craie.info(green('Required'), blue(pkg), craie.blue(` Found added global namespace: ${addedVars.join(', ')}`))
      } else {
        craie.info(green('Required'), blue(pkg), craie.red(` No added global namespace found`))
      }
    }
    if(event.source == window && event.data?.type === 'vars') {
      prevVars = event.data.data.vars
    }
    if(event.source == window && event.data?.type === 'conflict') {
      const namespace = event.data.data.namespace
      craie.info(red('⚠️ Failed'), craie.red(`\`${namespace}\` already existed, won't inject anything`))
    }
  })
}
