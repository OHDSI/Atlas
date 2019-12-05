define(
    (require, exports) => {
      const MESSAGE_TEMPLATES = {
        UNSAVED: 'You must save the %s before you can export',
        UNPERMITTED: 'You do not have permissions to export the %s',
      };

      return {
          MESSAGE_TEMPLATES,
      };
    }
  );