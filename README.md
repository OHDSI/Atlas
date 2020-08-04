# ATLAS

<a href="http://www.ohdsi.org/web/atlas"><img src="http://www.ohdsi.org/web/wiki/lib/exe/fetch.php?cache=&media=documentation:software:logo_without_text.png" align="left" hspace="10" vspace="6" width="164" height="200"></a>

**ATLAS** is an open source software tool for researchers to conduct scientific analyses on standardized observational data converted to the [OMOP Common Data Model V5](https://github.com/OHDSI/CommonDataModel/wiki "OMOP Common Data Model V5"). Researchers can create cohorts by defining groups of people based on an exposure to a drug or diagnosis of a particular condition using healthcare claims data. ATLAS has vocabulary searching of medical concepts to identify people with specific conditions, drug exposures etc. Patient profiles can be viewed within a specific cohort allowing visualization of a particular subject's health care records. Population effect level estimation analyses allows for comparison of two different cohorts and leverages R packages.

## Resources

* [Atlas (ohdsi.org)](http://atlas-demo.ohdsi.org/) **Please note: Google Chrome is the recommended browser for ATLAS.**
* [Documentation](https://github.com/OHDSI/Atlas/wiki)
* [Releases](https://github.com/OHDSI/Atlas/releases "Atlas releases")

## Technology

ATLAS is built using HTML, CSS and [Knockout JavaScript](http://knockoutjs.com/ "Knockout JavaScript"). For more information on using Atlas, please refer to the [setup guide](https://github.com/OHDSI/Atlas/wiki/Atlas-Setup-Guide "setup guide").

## Geo spatial support

Geo spatial is an optional component that provides to build analyses utilizing locations and areas.
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
* Now Geo spatial features should be available on the Cohort's Report page and the Person Profile page


## Dependencies
- [WebAPI](https://github.com/OHDSI/WebAPI "WebAPI")

## Getting Involved
* Developer questions/comments/feedback: <a href="http://forums.ohdsi.org/c/developers">OHDSI Forum</a>
* We use the <a href="../../issues">GitHub issue tracker</a> for all bugs/issues/enhancements

## License
ATLAS is licensed under Apache License 2.
