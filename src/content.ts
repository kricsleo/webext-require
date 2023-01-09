import type { PlasmoContentScript } from 'plasmo'
import { injectRequire, listenRequire } from './inject.ts'

export const config: PlasmoContentScript = {
  matches: ['http://*/*', 'https://*/*'],
}

injectRequire()
listenRequire()
