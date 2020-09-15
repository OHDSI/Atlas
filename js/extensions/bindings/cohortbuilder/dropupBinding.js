define(['jquery', 'knockout'], function ($, ko) {
	ko.bindingHandlers.dropup = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			$(element).on("shown.bs.dropdown", function () {
					// calculate the required sizes, spaces
					var $ul = $(this).children(".dropdown-menu");
					var $button = $(this).children(".dropdown-toggle");
					var ulOffset = $ul.offset();
					// example: http://jsfiddle.net/3s2efe9u/#
					// how much space would be left on the top if the dropdown opened that direction
					var spaceUp = (ulOffset.top - $button.outerHeight() - $ul.outerHeight()) - $(window).scrollTop();
					// how much space is left at the bottom
					var spaceDown = $(window).scrollTop() + $(window).height() - (ulOffset.top + $ul.height());
					// switch to dropup only if there is no space at the bottom AND there is space at the top, or there isn't either but it would be still better fit
					if (spaceDown < 0 && (spaceUp >= 0 || spaceUp > spaceDown))
						$(this).addClass("dropup");
			}).on("hidden.bs.dropdown", function() {
					// always reset after close
					$(this).removeClass("dropup");
			});		
		}
	};
});