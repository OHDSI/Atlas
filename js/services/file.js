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
        xhr.onerror = () => reject({
          status: xhr.status,
          statusText: xhr.statusText
        });
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
              reject({ status: xhr.status, statusText: xhr.statusText });
            }
          });
        });
      }

      loadZipNoRename(url, method = 'GET', params = {}) {
        return new Promise((resolve, reject) => {
          this._makeRequest(url, method, params, (xhr) => {
            if (xhr.status === 200) {
              const filename = xhr.getResponseHeader('Content-Disposition')
                .split('filename=')[1]
                .split(';')[0]
                .replace(/\"/g, ''); // Clean up filename string
              const blob = new Blob([xhr.response], { type: "octet/stream" });
              saveAs(blob, filename);
              resolve();
            } else {
              reject({
                status: xhr.status,
                statusText: xhr.statusText
              });
            }
          });
        });
      }

      saveAsJson(data) {
        const blob = new Blob([JSON.stringify(data)], { type: "text/json;charset=utf-8" });
        saveAs(blob, 'data.json');
      }
    }

    return new FileService();
  }
);