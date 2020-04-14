// TODO: need to do smth with "appConfig". Shouldn't be sticked to Atlas directory
define(['optional!appConfig'], (appConfig) => {

	// require.toUrl('appConfig')

	return {
		gisServiceUrl: appConfig.gisServiceUrl || appConfig.api.url + 'gis',
		tilesServerUrl: appConfig.tilesServerUrl || 'https://{s}.tile.openstreetmap.org',
	}
});