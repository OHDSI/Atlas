define([
    'services/http',
    'appConfig',
], function (
    httpService,
    config,
) {
    function loadSourceList() {
        return httpService
            .doGet(config.webAPIRoot + 'source/sources')
            .then(res => res.data);
    }

    return {
        loadSourceList,
    };
});
