define(
  [
    'services/AuthService',
    'file-saver',
  ],
  (
    AuthService,
    FileSaver
  ) => {
    class FileService {
      // jQuery won't allow to set responseType other than 'text'
      loadZip(url, filename) {
        const promise = new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("GET", url, true);
          xhr.setRequestHeader("Authorization", AuthService.getAuthorizationHeader());
          xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
              resolve();
              const blob = new Blob([xhr.response], { type: "octet/stream" });
              FileSaver(blob, filename);
            }
          }
          xhr.onerror = reject;
          xhr.responseType = "arraybuffer";
          xhr.send();
        });

        return promise;
      }
    }

    return new FileService();
  }
);