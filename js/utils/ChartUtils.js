define(
  ['d3'],
  function (d3) {

    // TODO: move into Visualizations repo
    class ChartUtils {
      static get chartAsPngStyles() {
        return `
          <![CDATA[
            svg {
              background: #fff;
            }
            .donut text {
              font-size: 1.2rem;
            }            
            .lineplot .line {
              fill: transparent;
              stroke: #50A5BA;
            }      
            .lineplot  circle.focus {
              opacity: 0;
            }      
            .bar {
              fill: #50A5BA;
            }      
            .boxplot .bar, .boxplot .whisker, .boxplot .box, .boxplot .median {
              stroke: #50A5BA;
            }      
            .boxplot .box {
              fill: #50A5BA;
            }
            .g-trellis .y-guide .tick line,
            .g-trellis .x-guide .tick line {
              stroke: #ccc;
              stroke-width: .6;
            }
            .g-trellis .y-guide .domain,
            .g-trellis .x-guide .domain {
              stroke: none;
            }
            .g-trellis .g-overlay {
              fill: none;
              pointer-events: all;
            }
            .grouper {
              fill: none;
              stroke: white;
              stroke-width: 2px;
            }
            .treemap_zoomtarget {
              padding: 0.5rem 20px;
            }
            .overlay {
              opacity: 0;
            }
          ]]>`;
      }

      static downloadAsPng(container) {
        const docType = `<?xml version="1.0" standalone="no"?>      
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`;
        const svg = d3.select(container).select('svg');
        svg.append('style').html(ChartUtils.chartAsPngStyles);
        const source = (new XMLSerializer()).serializeToString(svg.node());
        const blob = new Blob([`${docType}${source}`], { type: 'image/svg+xml;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const img = d3.select(container).append('img').node();
        img.onload = () => {
          // Now that the image has loaded, put the image into a canvas element.
          const canvas = d3.select(container).append('canvas').node();
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          let canvasUrl;
          const filename = 'chart.png';// TODO: `${this.props.title.replace(/\W*/g, '')}.png`;
          try {
            // ie 11 will throw an exception here
            canvasUrl = canvas.toDataURL('image/png');
            const a = d3.select(container).append('a').node();
            a.download = filename;
            a.href = canvasUrl;
            a.target = '_blank';
            a.click();
            a.remove();
            canvas.remove();
            img.remove();
          } catch (er) {
            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
              window.navigator.msSaveOrOpenBlob(blob, filename);
            } else {
              window.open(url, '_blank');
            }
            canvas.remove();
            img.remove();
          }
        };
        img.src = url;
      };

        static normalizeArray(ary, numerify) {
            var obj = {};
            var keys;

            if (ary && ary.length > 0 && ary instanceof Array) {
                keys = d3.keys(ary[0]);

                keys.forEach(function (key) {
                    obj[key] = [];
                });

                ary.forEach(function (item) {
                    var thisAryObj = item;
                    keys.forEach(function (key) {
                        var val = thisAryObj[key];
                        if (numerify) {
                            if (_.isFinite(+val)) {
                                val = (+val);
                            }
                        }
                        obj[key].push(val);
                    });
                });
            } else {
                obj.empty = true;
            }

            return obj;
        };
    }

    return ChartUtils;
  }
);