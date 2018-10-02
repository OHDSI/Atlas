define(
  ['d3', 'lodash'],
  function (d3, _) {
    // TODO: move into Visualizations repo
    class ChartUtils {      
      static get formatPercent() {
        return d3.format('.2%');
      }
      static get formatFixed() {
        return d3.format('.2f');
      }
      static get formatComma() {
        return d3.format(',');
      }

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
      }

      static mapConceptData(data) {
        var result;
  
        if (data instanceof Array) {
          result = [];
          data.forEach((item) => {
            var datum = {}
            datum.id = (+item.conceptId || item.conceptName);
            datum.label = item.conceptName || 'NULL (empty)';
            datum.value = +item.countValue;
            result.push(datum);
          });
        } else if (data.countValue instanceof Array) // multiple rows, each value of each column is in the indexed properties.
        {
          result = data.countValue.map(function (d, i) {
            var datum = {}
            datum.id = (d.conceptId || d.conceptName)[i];
            datum.label = d.conceptName[i];
            datum.value = d.countValue[i];
            return datum;
          });
  
  
        } else // the dataset is a single value result, so the properties are not arrays.
        {
          result = [{
            id: data.conceptId,
            label: data.conceptName,
            value: data.countValue
          }];
        }
  
        result = result.sort(function (a, b) {
          return b.label < a.label ? 1 : -1;
        });
  
        return result;
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

      static mapMonthYearDataToSeries(data, options) {
        var defaults = {
          dateField: "x",
          yValue: "y",
          yPercent: "p"
        };
  
        var options = { ...defaults, ...options };
  
        var series = {};
        series.name = "All Time";
        series.values = [];
        if (data && !data.empty) {
          for (var i = 0; i < data[options.dateField].length; i++) {
            var dateInt = data[options.dateField][i];
            series.values.push({
              xValue: new Date(Math.floor(data[options.dateField][i] / 100), (data[options.dateField][i] % 100) - 1, 1),
              yValue: data[options.yValue][i],
              yPercent: data[options.yPercent][i]
            });
          }
          series.values.sort(function (a, b) {
            return a.xValue - b.xValue;
          });
        }
        return [series]; // return series wrapped in an array
      };
    
      static buildHierarchyFromJSON(data, threshold, aggProperty = { name: '', description: '' }) {
        let total = 0;
  
        const root = {
          "name": "root",
          "children": []
        };
  
        for (var i = 0; i < data.percentPersons.length; i++) {
          total += data.percentPersons[i];
        }
  
        for (var i = 0; i < data.conceptPath.length; i++) {
          const parts = data.conceptPath[i].split("||");
          let currentNode = root;
          for (let j = 0; j < parts.length; j++) {
            const children = currentNode.children;
            const nodeName = parts[j];
            let childNode;
            if (j + 1 < parts.length) {
              // Not yet at the end of the path; move down the tree.
              let foundChild = false;
              for (let k = 0; k < children.length; k++) {
                if (children[k].name === nodeName) {
                  childNode = children[k];
                  foundChild = true;
                  break;
                }
              }
              // If we don't already have a child node for this branch, create it.
              if (!foundChild) {
                childNode = {
                  "name": nodeName,
                  "children": []
                };
                children.push(childNode);
              }
              currentNode = childNode;
            } else {
              // Reached the end of the path; create a leaf node.
              childNode = {
                "name": nodeName,
                "num_persons": data.numPersons[i],
                "concept_id": data.conceptId[i],
                "path": data.conceptPath[i],
                "percent_persons": data.percentPersons[i],
                "agg_value": data[aggProperty.name][i]
              };
  
              if ((data.percentPersons[i] / total) > threshold) {
                children.push(childNode);
              }
            }
          }
        }
        return root;
      }
  
      static filterByConcept(conceptId) {
        return function (d) {
          return d.conceptId === conceptId;
        };
      }
    }

    return ChartUtils;
  }
);