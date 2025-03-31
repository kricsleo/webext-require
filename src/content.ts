import type { PlasmoContentScript } from 'plasmo'
import { injectRequire, listenRequire } from './inject'

export const config: PlasmoContentScript = {
  matches: ["<all_urls>"],
  match_about_blank: true
}

injectRequire()
listenRequire()
