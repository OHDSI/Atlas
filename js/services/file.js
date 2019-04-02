define(
  [
    'services/AuthAPI',
    'file-saver',
  ],
  (
    authApi,
  ) => {
    class FileService {
      // jQuery won't allow to set responseType other than 'text'
      loadZip(url, filename) {
        const promise = new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("GET", url, true);
          xhr.setRequestHeader("Authorization", authApi.getAuthorizationHeader());
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
              resolve();
              const blob = new Blob([xhr.response], { type: "octet/stream" });
              saveAs(blob, filename);
            } else if (xhr.readyState === 4) {
              reject({status: xhr.status, statusText: xhr.statusText});
            }
          }
          xhr.onerror = reject;
          xhr.responseType = "arraybuffer";
          xhr.send();
        });

        return promise;
      }

      saveAsJson(data) {
        const blob = new Blob([JSON.stringify(data)], {type: "text/json;charset=utf-8"});
        saveAs(blob, 'data.json');
      }
    }

    return new FileService();
  }
);