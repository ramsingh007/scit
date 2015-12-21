var app_status = 'loading';

var ngApp = angular.module('ngApp', [
	'ionic', 
	'ngCordova', 
	'ngResource',
	'ngCordovaBeacon', 
	'angularMoment', 
	'ngApp.controllers', 
	'ngApp.directives', 
	'ngApp.filters',
	'ngApp.AppFactory',
	'ngApp.AppServices',
	'ngApp.ApiFactory',
	'ngApp.ApiServices',
	'ngApp.DataFactory',
	'ngApp.DataServices',
	'ngApp.ViewFactory',
	'ngApp.ViewServices',
	'ngApp.DeviceFactory',
	'ngApp.DeviceServices',
	'ngApp.BeaconFactory',
	'ngApp.GeofenceServices',
	'ngApp.GeofenceFactory',
	'ngApp.BeaconServices',
	'ngApp.ScenarioFactory',
	'ngApp.ScenarioServices'
])

.run(function($ionicPlatform, $cordovaStatusbar) {

	$ionicPlatform.ready(function() {
		// If we have the keyboard plugin, let use it
		if (window.cordova && window.cordova.plugins.Keyboard) {
			// Lets hide the accessory bar fo the keyboard (ios)
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
			// Also, lets disable the native overflow scroll
			cordova.plugins.Keyboard.disableScroll(true);
		}

		document.addEventListener("pause", function() { app_status = 'pause'; }, false);
		document.addEventListener("resume", function() { app_status = 'resume'; }, false);
		document.addEventListener("deviceready", function() { app_status = 'ready'; }, false);

		/*
		 * Statusbar
		 */

		if (window.StatusBar) {
			$cordovaStatusbar.overlaysWebView(true);
			$cordovaStatusbar.style(1);
		}
	});
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $sceDelegateProvider) {

	$ionicConfigProvider.backButton.previousTitleText(false).text('');
	/*$ionicConfigProvider.tabs.position("bottom");*/
	$ionicConfigProvider.views.transition('none');

	$sceDelegateProvider.resourceUrlWhitelist(['self', '**']);

	$stateProvider.state('nav', {
			url: '/nav',
			abstract: true,
			templateUrl: 'nav.html',
			controller: 'NavCtrl'
		})
		.state('nav.favs', {
			url: '/favs',
			cache: false,
			views: {
				'mainView': {
					templateUrl: 'templates/favs.html',
					controller: 'FavsCtrl'
				}
			}
		})
		.state('nav.view', {
			url: '/view',
			cache: true,
			views: {
				'mainView': {
					templateUrl: 'templates/view.html',
					controller: 'ViewCtrl'
				}
			}
		})
		.state('nav.content', {
			url: '/content',
			cache: true,
			views: {
				'mainView': {
					templateUrl: 'templates/content.html',
					controller: 'ContentCtrl'
				}
			}
		})
		.state('nav.debug', {
			url: '/debug',
			cache: false,
			views: {
				'mainView': {
					templateUrl: 'templates/debug.html',
					controller: 'DebugCtrl'
				}
			}
		})
		.state('nav.more', {
			url: '/more',
			cache: true,
			views: {
				'mainView': {
					templateUrl: 'templates/more.html',
					controller: 'MoreCtrl'
				}
			}
		})
		.state('nav.help', {
			url: '/help',
			cache: true,
			views: {
				'mainView': {
					templateUrl: 'templates/help.html',
					controller: 'HelpCtrl'
				}
			}
		});

	$urlRouterProvider.otherwise('/nav/favs');

});