# Web Extension Require

🚀 An extension to require npm packages in browser dev-tools.

<p align="center">
  <img src="./screenshots/preview.gif" alt="preview" />
</p>

## Features

- Support javascript and CSS packages in npm, like `_require('lodash')` or `_require('animate.css')`
- Support npm package scope, like `_require('lodash@4.17.21')` or `_require('lodash@4')`
- Support subpath in npm packages, like `_require('lodash/lodash.min.js')`
- Support any CDN files, like `_require('https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js')`

Javascript package needs to provide **UMD** or other browser format bundles so that they can be directly used in the browser.

## Usage

1. [Download](https://github.com/kricsleo/webext-require/releases) this extension and install it in the browser extension page(like `chrome://extensions/`).
2. Use `_require` in dev-tools to install packages from npm or CDN.

## Thanks

[jsDelivr](https://www.jsdelivr.com/) - All npm assets are provided by it.

## License

[MIT](./LICENSE) License © 2022 [Kricsleo](https://github.com/kricsleo)
