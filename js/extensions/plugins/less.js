define(['appConfig'], function factory() {
  return {
    appendLink(url) {
      if (typeof document !== 'undefined') { // for requirejs optimizer
        const head = document.getElementsByTagName('head')[0];

        const link = document.createElement('link');
        link.rel = 'stylesheet/less';
        link.type = 'text/css';
        link.href = url;
        head.appendChild(link);

        return link;
      }
    },
    appendText(compiledCss) {
      const head = document.querySelector('head');
      const style = document.createElement('style');
      style.type = 'text/css';
      style.textContent = compiledCss;
      head.appendChild(style);      
    },
    load: function load(name, req, onload, _config) {
      req(['less-js'], () => {                
        const link = this.appendLink(req.toUrl(name));        
        window.less.sheets.push(link);
        window.less.refresh();
        window.less.options.logLevel = 0;
        onload();
      });
    },
    write(pluginName, moduleName, writer) {
      const fs = require.nodeRequire('fs');      
      const lessJs = require.nodeRequire('less');
      const rawLess = fs.readFileSync(require.toUrl(moduleName)).toString();
      lessJs.render(rawLess, null, (a, { css }) => {
        writer(`
          define('${pluginName}!${moduleName}', () => {
            (${this.appendText.toString()})(\`
              ${css}
            \`)
          })
        `);
      });

    }
  };
});
