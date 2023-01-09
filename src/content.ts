import type { PlasmoContentScript } from 'plasmo'
import { injectRequire, listenRequire } from './inject.ts'

export const config: PlasmoContentScript = {
  matches: ["<all_urls>"],
  match_about_blank: true
}

injectRequire()
listenRequire()
