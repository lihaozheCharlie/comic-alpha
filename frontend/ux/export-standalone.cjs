const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'console.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'console.js'), 'utf8');
const image = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'covers.png')).toString('base64');
const font = 'data:font/woff2;base64,' + fs.readFileSync(path.join(root, 'chinese.woff2')).toString('base64');
const fontLicense = '/*\n' + fs.readFileSync(path.join(root, 'FONT-LICENSE.txt'), 'utf8').replaceAll('*/', '* /') + '\n*/\n';
const output = html
  .replace('<link rel="stylesheet" href="console.css">', '<style>' + fontLicense + css.replaceAll("url('covers.png')", "url('" + image + "')").replaceAll("url('chinese.woff2')", "url('" + font + "')") + '</style>')
  .replace('<script src="console.js" defer></script>', '')
  .replace('</body>', '<script>' + js.replace(/<\/script/gi, '<\\/script') + '</script></body>')
  .replace(/<button class="quiet-button" id="download-design">[\s\S]*?<\/button>/, '');
fs.writeFileSync(path.join(root, 'comicperfect-ux.html'), output);
console.log('Standalone HTML exported with embedded art, styles and interactions.');
