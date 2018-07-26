define(['appConfig'], function factory() {
  return {
    load: function load(name, req, onload, _config) {

      req(['less-js'], function () {
        const url = req.toUrl(name);

        const head = document.getElementsByTagName('head')[0];

        const link = document.createElement('link');
        link.rel = 'stylesheet/less';
        link.type = 'text/css';
        link.href = url;
        head.appendChild(link);

        window.less.sheets.push(link);
        window.less.refresh();
        window.less.options.logLevel = 0;

        onload();
      });
    }
  };
});
