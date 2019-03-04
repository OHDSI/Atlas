define(
    (require, exports) => {

      const commaDelimitedListToArray = function (newValue) {
        if (newValue === '') {
            return [];
        } else {
            try {
                const list = newValue.split(',');
                return list;
            } catch (e) {
                console.log('Invalid format for comma delimited list');
                return [];
            }
        }
      }

      const commaDelimitedListToNumericArray = function(newValue) {
          const list = this.commaDelimitedListToArray(newValue);
          return list.map((element) => { return +element });
      }

      const commaDelimitedListToPercentArray = function(newValue) {
        const list = this.commaDelimitedListToNumericArray(newValue);
        return list.map((element) => { return (element >= 1) ? (element / 100) : element });
      }

      const percentArrayToCommaDelimitedList = function(list) {
        return list.map((element) => { return (element <= 1) ? (element * 100) : element }).join();
      }

      const convertFromPercent = function(value) {
        return (+value <= 1 && +value >= 0) ? (+value * 100) : +value;
      }

      const convertToPercent = function(value) {
          return (+value >= 1) ? (+value / 100) : +value;
      }

      const convertToDateForR = function(dateTime) {
        var mm = dateTime.getMonth() + 1; // getMonth() is zero-based
        var dd = dateTime.getDate();
      
        return [dateTime.getFullYear(),
                (mm>9 ? '' : '0') + mm,
                (dd>9 ? '' : '0') + dd
               ].join('');
      }

      const convertFromRDateToDate = function(dateTime) {
          dateTime = dateTime.toString();
          if (dateTime.length !== 8) {
              console.error("Expected format: YYYYMMDD");
          } else {
              return new Date(dateTime.slice(0, 4), +(dateTime.slice(4,6)) - 1, dateTime.slice(6,8));
          }
      }
   
      return {
        commaDelimitedListToArray: commaDelimitedListToArray,
        commaDelimitedListToNumericArray: commaDelimitedListToNumericArray,
        commaDelimitedListToPercentArray: commaDelimitedListToPercentArray,
        convertFromRDateToDate: convertFromRDateToDate,
        convertToDateForR: convertToDateForR,
        convertFromPercent: convertFromPercent,
        convertToPercent: convertToPercent,
        percentArrayToCommaDelimitedList: percentArrayToCommaDelimitedList,
      };
    }
  );