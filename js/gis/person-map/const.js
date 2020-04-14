define([
  '../config.js',
], (
  config,
) => {

  const Api = {
    loadLocationHistory: ({ personId, sourceKey, startDate, endDate }) => {
      const params = [{ name: 'startDate', value: startDate}, { name: 'endDate', value: endDate}]
        .filter(v => v.value)
        .map(v => `${v.name}=${v.value}`)
        .join("&");
      return config.gisServiceUrl + `/person/${personId}/bounds/${sourceKey}` + (params.length > 0 ? `?${params}` : '');
    }
  };

  return {
    Api,
  }
});