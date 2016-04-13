# ATLAS

ATLAS is a unified web interface that attempts to integrate features from various OHDSI applications into a single cohesive experience.

ATLAS is currently in alpha release.
Feedback is welcome.

ATLAS is HTML, CSS and Javascript and can be deployed through the following two steps.

1.  Host all files on a web server of your choice.
2.  Update the following section of the config.js file to point to your active OHDSI WebAPI deployment.

	config.services = [
			{
				name: 'My OHDSI API',
				url: 'http://api.myserver.net/WebAPI/'
			}
		];