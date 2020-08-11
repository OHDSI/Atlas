# Geospatial support

Geospatial is an optional component that provides to build analyses utilizing locations and areas.
To enable this component do the following:
* first build [WebAPI](https://github.com/OHDSI/WebAPI) with geospatial enabled, following instructions 
from the README
* clone or download sources from the [Atlas Component Geospatial](https://github.com/OHDSI/atlas-component-geospatial)
* and place them to the directory served by any HTTP server

  For example if you're using Apache and the /var/www/atlas is a Atlas root directory
accessible by the http://yourserver.com/atlas, 
then place geospatial component into the /var/www/atlas/js/gis directory.
Following configuration component would rely on these deployment environment.
 
* Add the following to the `config-local.js` file:
```
  config.gisServiceUrl = 'http://yourserver.com/WebAPI/gis';

  config.externalLibraries = [
    'http://yourserver.com/js/gis/cohort-report-geospatial/index.js',
    'http://yourserver.com/js/gis/person-map/index.js'
  ];

```
* Now Geospatial features should be available on the Cohort's Report page and the Person Profile page
