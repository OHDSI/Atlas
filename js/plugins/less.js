define("less", function factory() {
  return {
    load: function load(name, req, onload, _config) {

      req(['https://cdnjs.cloudflare.com/ajax/libs/less.js/3.0.1/less.min.js'], function () {
        const url = req.toUrl(name);

        const head = document.getElementsByTagName('head')[0];

        const link = document.createElement('link');
        link.rel = 'stylesheet/less';
        link.type = 'text/css';
        link.href = url;
        head.appendChild(link);

        window.less.sheets.push(link);
        window.less.refresh();

        onload();
      });
    }
  };
});
