define(
  ['d3', 'lodash', 'html2canvas', 'file-saver', 'svgsaver'],
  function (d3, _, html2canvas) {
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

			// getSVGString from http://bl.ocks.org/Rokotyan/0556f8facbaf344507cdc45dc3622177
			static getSVGString( svgNode ) {
				svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
        var cssStyleText = getCSSStyles( svgNode );
				appendCSS( cssStyleText, svgNode );

				var serializer = new XMLSerializer();
				var svgString = serializer.serializeToString(svgNode);
				svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
				svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

        return svgString;
        
        function getCSSStyles( parentElement ) {

          const cssRules = new Set();
          const nodes = [...parentElement.getElementsByTagName("*")];
          nodes.forEach(node => {
            const nodeCssRules = [...document.styleSheets].reduce((a,c) => a.concat([...c.cssRules].filter(r => node.matches(r.selectorText))), []);
            nodeCssRules.forEach(r => { 
              cssRules.add(r);
            });
          });

          return [...cssRules.values()].reduce((a,c) => a + c.cssText, "");
        }

				function appendCSS( cssText, element ) {
					var styleElement = document.createElement("style");
					styleElement.setAttribute("type","text/css"); 
					styleElement.innerHTML = cssText;
					var refNode = element.hasChildNodes() ? element.children[0] : null;
					element.insertBefore( styleElement, refNode );
				}
			}

			// svgString2Image from http://bl.ocks.org/Rokotyan/0556f8facbaf344507cdc45dc3622177
			static svgString2Image( svgString, width, height, format, callback ) {
				var format = format ? format : 'png';

				var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL

				var canvas = document.createElement("canvas");
				var context = canvas.getContext("2d");

				canvas.width = width;
				canvas.height = height;

				var image = new Image();
				image.onload = function() {
					context.clearRect ( 0, 0, width, height );
					context.drawImage(image, 0, 0, width, height);

					canvas.toBlob( function(blob) {
						var filesize = Math.round( blob.length/1024 ) + ' KB';
						if ( callback ) callback( blob, filesize );
					});
				};

				image.src = imgsrc;
			}
			
      static downloadSvgAsPng(container, filename) {
				const svgString = ChartUtils.getSVGString(container);
				const containerBBox = container.getBBox();
                const containerWidth = containerBBox.width || container.getAttribute('width');
                const containerHeight = containerBBox.height || container.getAttribute('height');
				ChartUtils.svgString2Image( svgString, 2*containerWidth, 2*containerHeight, 'png', save ); // passes Blob and filesize String to the callback

				function save( dataBlob, filesize ){
					saveAs( dataBlob, filename );
				}				
      }
      
      static downloadElementAsPng(domElement, filename) {
        html2canvas(domElement).then( canvas => {
          canvas.toBlob(dataBlob => {
            saveAs(dataBlob, filename);
          });
        });
      }

      static downloadSvg(container,name) {
        var SvgSaver = require('svgsaver');
        var svgsaver = new SvgSaver();
        svgsaver.asSvg(container, name);
      }

      static combineSvgWithLegend(svgFiles) {
        let heightSvg = 0;
        svgFiles.forEach(file => heightSvg += file.clientHeight);
        const heightWithoutLegend = svgFiles[0].clientHeight;
        const widthSvg = svgFiles[0].clientWidth;
        const svgNS = "http://www.w3.org/2000/svg";
        const combineSvg = document.createElementNS(svgNS, 'svg');
        combineSvg.setAttribute('width', widthSvg);
        combineSvg.setAttribute('height', heightSvg);
        for (let i = 0; i < svgFiles.length; i++) {
          const childNodes = Array.from(svgFiles[i].childNodes);
          for (let j = 0; j < childNodes.length; j++) {
            const g = childNodes[j].cloneNode(true);
            if (g.classList.contains('treeLegend')) {
              const translateAttr = "translate(15," + heightWithoutLegend + ")";
              g.setAttribute('transform', translateAttr);
            }
            combineSvg.appendChild(g);
          }
        }
        return combineSvg;
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