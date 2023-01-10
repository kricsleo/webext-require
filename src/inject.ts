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

let injected = false
async function require(pkg: string): Promise<void> {
  craie.info(red('Fetching'), blue(pkg))
  try {
    const [code, pkgInfo] = await Promise.all([fetchPkg(pkg), fetchPkgInfo(pkg)]);
    const pkgName = pkgInfo.name + '@' + pkgInfo.version
    if(isCSS(pkgInfo)) {
      injectCSS(code)
      craie.info(red('Required'), blue(pkgName))
    } else {
      const injectedCode = `
        ${code}
        ;window.postMessage({ type: 'require_success', data: { pkg: '${pkgName}' } })
      `
      const prevVars = getWindowVars()
      injected = false
      setTimeout(() => {
        if(injected) {
          // const addedVars = detectRequiredVar(prevVars)
          craie.info(red('Required'), blue(pkgName))
          // if(addedVars.length) {
          //   craie.info(red('Required'), blue(pkgName), craie.green(` Found added global namespace: ${addedVars.join(',')}`))
          // } else {
          //   craie.info(red('Required'), blue(pkgName), craie.red(` But no global namespace for '${pkgName}' found.`))
          // }
        } else {
          craie.info(
            red('⚠️ Failed'),
            blue(pkgName),
            craie.red(` \`${pkgName}\` may not support browser.`)
          )
        }
      }, 300 )
      injectJS(injectedCode)
    }
  } catch(e: any) {
    craie.info(red('⚠️ Failed'), blue(pkg), craie.red(' ' + e.message))
  }
}

function isCSS(pkgInfo: Record<string, unknown>) {
  return pkgInfo.main && /.css$/.test(pkgInfo.main as string)
}

function injectJS(code: string) {
  const script = document.createElement('script')
  script.innerHTML = code
  document.body.appendChild(script)
  script.remove()
}

function injectCSS(code: string) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.innerHTML = code
  document.head.appendChild(link);
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
  window.addEventListener("message", event => {
    if(event.source == window && event.data?.type === 'require') {
      const pkg = event.data.data.pkg
      require(pkg)
    }
    if(event.source == window && event.data?.type === 'require_success') {
      injected = true
    }
    if(event.source == window && event.data?.type === 'conflict') {
      const namespace = event.data.data.namespace
      craie.info(red('⚠️ Failed'), craie.red(`\`${namespace}\` already existed, won't inject anything.`))
    }
  })
}

function detectRequiredVar(prevVars: string[]) {
  const vars = getWindowVars()
  const addedVars = vars.filter(v => !prevVars.includes(v))
  return addedVars
}

function getWindowVars() {
  return Object.keys(window)
}
