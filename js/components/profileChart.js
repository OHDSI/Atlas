"use strict";
define(['knockout','d3'], function (ko, d3) {
  window.d3 = d3;
  var width = 400;
  var height = 450;
  var lineHeight = 20;

  ko.bindingHandlers.profileChart = {
    init: function (element, valueAccessor, allBindingsAccessor) {
      //var profile = valueAccessor().profile;
      //var filteredData = valueAccessor().filteredData;
      d3.select(element)
          .append('h3').text('hello');
    },
    update: function (element, valueAccessor, allBindingsAccessor) {
      var va = valueAccessor();
      console.log(va.filteredData());
      console.log(va.profile());
      //debugger;
    }
  };
});
