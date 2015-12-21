angular.module('ngApp.controllers', ['ngApp.config'])

/*
 * ---------------------------------------------------
 * Nav controller
 * ---------------------------------------------------
 */

.controller('NavCtrl', function($scope, $ionicSideMenuDelegate) {
	$scope.showLeftMenu = function() {
		$ionicSideMenuDelegate.toggleLeft();
	};
	$scope.showRightMenu = function() {
		$ionicSideMenuDelegate.toggleRight();
	};
})

/*
 * ---------------------------------------------------
 * Main App controller
 * ---------------------------------------------------
 */

.controller('AppCtrl', function(
	$scope,
	$rootScope,
	$window,
	$ionicLoading,
	$http,
	$cordovaSplashscreen,
	$cordovaBarcodeScanner,
	DeviceService,
	DataService,
	ViewService,
	BeaconService,
	GeofenceService,
	api,
	view,
	favs,
	device,
	geo,
	beacon,
	geofence,
	scenario,
	debug,
	PROXIMITY_PLATFORM
) {

	/*
	 * Globals
	 */

	$scope.favs = favs;
	$scope.view = view;
	$scope.device = device;
	$scope.geo = geo;
	$scope.api = api;
	$scope.beacon = beacon;
	$scope.geofence = geofence;
	$scope.scenario = scenario;
	$scope.debug = debug;

	/*
	 * ------------------------------------------------------------------------
	 * Load device information (uuid, geo)
	 */

	DeviceService.loadDevice($scope);

	/*
	 * ------------------------------------------------------------------------
	 * Start tracking (monitoring region + proximity ranging) beacons
	 */

	BeaconService.startTrackingBeacons($scope);

	/*
	 * ------------------------------------------------------------------------
	 * Start monitoring geofences
	 */

	GeofenceService.startTrackingGeofences($scope);

	/*
	 * ------------------------------------------------------------------------
	 * Wait for device geo location to be loaded (or failing)
	 */

	$scope.geoLoaded = function() 
	{
		/*
		 * ------------------------------------------------------------------------
		 * Load favorites
		 */

		DataService.loadFavs($scope);
	}

	/*
	 * ------------------------------------------------------------------------
	 * Set default view url
	 */

	$scope.view.iframe = PROXIMITY_PLATFORM.default_url;

	/*
	 * Open app view with url in address bar
	 */

	$scope.openView = function() {
		ViewService.openView($scope, $scope.view.input, true);
	};

	document.addEventListener("deviceready", function() {

		/*
	 	 * --------------------------------------------------------------------
		 * QR scanner
		 */

		$scope.scanQr = function() {

			$ionicLoading.show();

			$cordovaBarcodeScanner
				.scan()
				.then(function(barcodeData) {
					// Success! Barcode data is here
					if (typeof barcodeData.text === 'undefined' || barcodeData.text == '') {

						// Nothing found, do nothing, only hide loader
						$ionicLoading.hide();

					} else {
						// Update address bar input
						$scope.view.input = barcodeData.text;

						// Open app view and load iframe
						ViewService.openView($scope, barcodeData.text, true);

						$ionicLoading.hide();
					}
				}, function(error) {
					// An error occurred
					alert(error.text);
				});
		};

		/*
	 	 * --------------------------------------------------------------------
		 * Hide splashscreen
		 */

		$cordovaSplashscreen.hide()

	}, false);
})

/*
 * ---------------------------------------------------
 * Favorites
 * ---------------------------------------------------
 */

.controller('FavsCtrl', function($scope, view, favs, device, geo, api, beacon, geofence, debug, $ionicTabsDelegate, $ionicActionSheet, DebugService, DataService, ViewService) {

	$scope.selectTabWithIndex = function(index) {
		$ionicTabsDelegate.deselect();
	}

	/*
	 * Globals
	 */

	$scope.favs = favs;
	$scope.view = view;
	$scope.device = device;
	$scope.geo = geo;
	$scope.api = api;
	$scope.beacon = beacon;
	$scope.geofence = geofence;
	$scope.debug = debug;

	$scope.showActionSheet = function(name, id, url) {
		$ionicActionSheet.show({
			buttons: [
				{ text: '<i class="icon ion-android-open dark hide-ios"></i> Open app' }
			],
			destructiveText: '<i class="icon ion-android-delete royal hide-ios"></i> Delete bookmark',
			titleText: name,
			cancelText: 'Cancel',
			buttonClicked: function(index) {

				// Open app
				if (index == 0)
				{
					DebugService.log($scope, 'App opened: ' + url);
					$scope.view.bookmarked = false;
					ViewService.openView($scope, url);
				}

				return true;
			},
			destructiveButtonClicked: function() {

				if (confirm('Are you sure?'))
				{
					DebugService.log($scope, 'App deleted: ' + url);	
					DataService.deleteBookmark($scope, id);

					return true;
				}
			}
		});
	};
})

/*
 * ---------------------------------------------------
 * Web view
 * ---------------------------------------------------
 */

.controller('ViewCtrl', function($scope, api, view, favs, device, geo, api, beacon, geofence, debug, DataService) {

	/*
	 * Globals
	 */

	$scope.favs = favs;
	$scope.view = view;
	$scope.device = device;
	$scope.geo = geo;
	$scope.api = api;
	$scope.beacon = beacon;
	$scope.geofence = geofence;
	$scope.debug = debug;

	$scope.addBookmark = function() {
		DataService.addBookmark($scope);
	};
})

/*
 * ---------------------------------------------------
 * Content view
 * ---------------------------------------------------
 */

.controller('ContentCtrl', function($scope, debug, scenario, DebugService) {

	/*
	 * Globals
	 */

	$scope.scenario = scenario;
	$scope.debug = debug;

	/*
	 * Callback after iframe is loaded
	 */

	$scope.iframeLoadedCallBack = function()
	{
		$scope.scenario.show_loader = false;
		DebugService.log($scope, 'content iframe loaded');
	};
})

/*
 * ---------------------------------------------------
 * More (history)
 * ---------------------------------------------------
 */

.controller('MoreCtrl', function($scope, view, favs, device, geo, api, beacon, geofence, debug) {

	/*
	 * Globals
	 */

	$scope.favs = favs;
	$scope.view = view;
	$scope.device = device;
	$scope.geo = geo;
	$scope.api = api;
	$scope.beacon = beacon;
	$scope.geofence = geofence;
	$scope.debug = debug;
})

/*
 * ---------------------------------------------------
 * Help controller
 * ---------------------------------------------------
 */

.controller('HelpCtrl', function($scope, view, favs, device, geo, api, beacon, geofence, debug) {

	/*
	 * Globals
	 */

	$scope.favs = favs;
	$scope.view = view;
	$scope.device = device;
	$scope.geo = geo;
	$scope.api = api;
	$scope.beacon = beacon;
	$scope.geofence = geofence;
	$scope.debug = debug;
})

/*
 * ---------------------------------------------------
 * Debug view
 * ---------------------------------------------------
 */

.controller('DebugCtrl', function($scope, api, view, favs, device, geo, api, beacon, geofence, debug, DataService) {

	/*
	 * Globals
	 */

	$scope.favs = favs;
	$scope.view = view;
	$scope.device = device;
	$scope.geo = geo;
	$scope.api = api;
	$scope.beacon = beacon;
	$scope.geofence = geofence;
	$scope.debug = debug;

	$scope.resetDatabase = function() {
		if (confirm('Are you sure?'))
		{
			DataService.loadFavs($scope, true);
		}
	};

	$scope.clearLog = function() {
		if (confirm('Are you sure?'))
		{
			$scope.debug.length = 0;
			$scope.debug = [];
		}
	};
});