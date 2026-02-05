define(function (require, exports) {

  const httpService = require('services/http');
  const config = require('appConfig');
  const constants = require('const');
  const FileService = require('services/file');

  return class JobsService {
    static getList() {
      return httpService.doGet(constants.apiPaths.jobs())
        .then(({ data: jobs } = { data: { content: [] } }) => jobs.content);
    }

    static get(id) {
      return httpService.doGet(constants.apiPaths.job(id));
    }

    static getByName(name, type) {
      return httpService.doGet(constants.apiPaths.jobByName(name, type));
    }

    /**
   * Download artifact for a job execution
   * @param {number} executionId - The job execution ID
   * @returns {Promise} Promise that resolves when download starts
   */
    static downloadArtifact(executionId) {
      const url = constants.apiPaths.jobArtifact(executionId);

      return FileService.loadZipNoRename(url)
        .catch((error) => {
          console.error("Error when downloading artifact:", error);
          throw error;
        });
    }
  }
});