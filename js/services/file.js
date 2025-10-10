define(
  [
    'services/AuthAPI',
    'file-saver',
  ],
  (
    authApi,
  ) => {
    class FileService {
      // Helper function to simplify setting up and making the XMLHttpRequest
      _makeRequest(url, method, params, callback) {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.setRequestHeader("Authorization", authApi.getAuthorizationHeader());
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.setRequestHeader("Action-Location", location);
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            callback(xhr);
          }
        };
        xhr.onerror = () => {
          callback(xhr); // Pass xhr to callback so we can handle it
        };
        xhr.responseType = "arraybuffer";
        xhr.send(JSON.stringify(params));
      }

      loadZip(url, filename, method = 'GET', params = {}) {
        return new Promise((resolve, reject) => {
          this._makeRequest(url, method, params, (xhr) => {
            if (xhr.status === 200) {
              resolve();
              const blob = new Blob([xhr.response], { type: "octet/stream" });
              saveAs(blob, filename);
            } else {
              reject({ 
                status: xhr.status, 
                statusText: xhr.statusText || this._getDefaultStatusText(xhr.status),
                url: url
              });
            }
          });
        });
      }

      loadZipNoRename(url, method = 'GET', params = {}) {
        return new Promise((resolve, reject) => {
          this._makeRequest(url, method, params, (xhr) => {
            if (xhr.status === 200) {
              const contentDisposition = xhr.getResponseHeader('Content-Disposition');
              
              if (!contentDisposition) {
                reject({
                  status: xhr.status,
                  statusText: 'Missing Content-Disposition header',
                  url: url
                });
                return;
              }
              
              const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
              const filename = filenameMatch && filenameMatch[1] 
                ? filenameMatch[1].replace(/['"]/g, '') 
                : 'download.zip';
              
              const blob = new Blob([xhr.response], { type: "octet/stream" });
              saveAs(blob, filename);
              resolve();
            } else {
              // Try to get error message from response
              let errorMessage = xhr.statusText || this._getDefaultStatusText(xhr.status);
              
              // If response is JSON, try to parse error message
              if (xhr.response && xhr.response.byteLength > 0) {
                try {
                  const text = new TextDecoder().decode(xhr.response);
                  const json = JSON.parse(text);
                  if (json.message) {
                    errorMessage = json.message;
                  }
                } catch (e) {
                  // Not JSON, ignore
                }
              }
              
              reject({
                status: xhr.status,
                statusText: errorMessage,
                url: url
              });
            }
          });
        });
      }

      saveAsJson(data) {
        const blob = new Blob([JSON.stringify(data)], { type: "text/json;charset=utf-8" });
        saveAs(blob, 'data.json');
      }

      _getDefaultStatusText(status) {
        const statusTexts = {
          204: 'No Content',
          400: 'Bad Request',
          401: 'Unauthorized',
          403: 'Forbidden',
          404: 'Not Found',
          500: 'Internal Server Error',
          502: 'Bad Gateway',
          503: 'Service Unavailable'
        };
        return statusTexts[status] || 'Unknown Error';
      }
    }

    return new FileService();
  }
);