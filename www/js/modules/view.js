/**
 * --------------------------------------------------------------------------------------------
 * Factory
 */
 
 angular.module('ngApp.ViewFactory', [])

/*
 * Persist view url / code throughout app's life
 */

.factory('view', function(PROXIMITY_PLATFORM){
	return {
		title: PROXIMITY_PLATFORM.default_title,
		input: '',
		code: '',
		icon: null,
		type: null,
		querystring: '',
		iframe: '',
		show_loader: true,
		bookmarked: false
	};
});

/**
 * --------------------------------------------------------------------------------------------
 * Service
 */

angular.module('ngApp.ViewServices', [])

/**
 * App view iframe services
 */

.service('ViewService', function($location, $http, PROXIMITY_PLATFORM, ApiService, DebugService, BeaconService, GeofenceService) {

	/*
	 * Set url in view and open view
	 * ViewService.openView = function($scope, url);
	 */

	this.openView = function($scope, url, parseBoard)
	{
		// Show debug
		if (url == 'debug on')
		{
			$scope.debug.nav = true;
			return;
		}

		$scope.view.show_loader = true;

		if (typeof url === 'undefined') 
		{
			url = $scope.view.input;
		}
		else
		{
			$scope.view.input = url;
		}

		if (typeof parseBoard === 'undefined') parseBoard = false; // If set to true, this will refresh beacons / geofences to new view + unsubscribe previous view

		if (url == 'about:blank' || url == '')
		{
			$scope.view.show_loader = false;
			return;
		}

		// Check for querystring to add additional information
		var hasQsChars = new RegExp("[?&]");

		if (hasQsChars.test(url))
		{
			querystring = '&src=app&lat=' + $scope.geo.lat + '&lng=' + $scope.geo.lng;
		} 
		else 
		{
			querystring = '?src=app&lat=' + $scope.geo.lat + '&lng=' + $scope.geo.lng;
		}

		$scope.view.querystring = querystring;

		// Parse input, starts with http ?
		if (url.slice(0, 7) != "http://" && url.slice(0, 8) != "https://")
		{
			// Check for dot (.) to see if it's a code or url
			var isUrl = true;
			var hasDot = new RegExp("[.]");

			if (hasDot.test(url))
			{
				url = 'http://' + url;
				$scope.view.iframe = url + $scope.view.querystring;
				$scope.view.input = url;
				$scope.view.show_loader = false;
			}
			else
			{
				// It's a code, not a url
				isUrl = false;
			}
		}

		$location.path('/nav/view');

		// Get response from API call
		var promise = ApiService.handshake($scope, url);

		promise.then(function(data) {
			$scope.view.title = '';

			// Data is found and the active notification board is updated
			if (data !== false)
			{
				// The input was a code, not a url. Now we can set the corresponding url in the iframe and address bar input
				if (! isUrl)
				{
					$scope.view.iframe =  data.content.url + $scope.view.querystring;
					$scope.view.input = data.content.url;
				}

				// Check if url is bookmarked
				var favs = $scope.favs.items;
	
				for (i = 0; i < favs.length; ++i)
				{
					if (favs[i].url == $scope.view.input)
					{
						$scope.view.bookmarked = true;
						break;
					}
				}

				// Set globals
				$scope.view.title = data.content.name;
				$scope.view.icon = data.content.icon;
				$scope.view.type = data.content.type;

				$scope.api.previous_notification_board = $scope.api.active_notification_board;
				$scope.api.active_notification_board = data;
				$scope.view.show_loader = false;

				if (parseBoard)
				{
					BeaconService.parseActiveBeacons($scope);
					GeofenceService.parseActiveGeofences($scope);
				}
			}
		});

		/*
		 * Callback after iframe is loaded
		 */

		$scope.iframeLoadedCallBack = function()
		{
			$scope.view.show_loader = false;
		};
	}
});