define(
  (require, exports) => {
    const pageTitle = 'Concept Sets';

    const arraysDiff = function (base, another) {
      return base.filter(function (i) {
        return another.indexOf(i) < 0;
      });
     }

    return {
      pageTitle,
      arraysDiff,
    };
  }
);