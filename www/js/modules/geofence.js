/**
 * --------------------------------------------------------------------------------------------
 * Factory
 */
 
 angular.module('ngApp.GeofenceFactory', [])

/*
 * Geofences
 */

.factory('geofence', function(){
	return {
		scenarios: []
	};
});

/**
 * --------------------------------------------------------------------------------------------
 * Service
 */

angular.module('ngApp.GeofenceServices', [])

/**
 * Monitor available geofences
 */

.service('GeofenceService', function($rootScope, ScenarioService, DebugService){

	/**
	 * Extract geofences from favorite var
	 */

	this.extractFavGeofences = function($scope)
	{
		var self = this;
		document.addEventListener("deviceready", function() {

			// List boards
			var boards = $scope.api.favorite_notification_boards;

			if (boards.length > 0)
			{
				for (b = 0; b < boards.length; ++b)
				{
					if (typeof boards[b] !== 'undefined' && typeof boards[b].geofences !== 'undefined')
					{
						// Parse geofences
						self.parseGeofences($scope, boards[b]);
					}
				}
			}

		}, false);
	}

	/**
	 * Subscribe geofences and extract relevant scenarios
	 */

	this.parseGeofences = function($scope, board)
	{
		// Start watching geofences
		var geofences = board.geofences;

		for (i = 0; i < geofences.length; ++i)
		{
			window.geofence.addOrUpdate({
				id:             String(geofences[i].id), //A unique identifier of geofence
				latitude:       parseFloat(geofences[i].lat), //Geo latitude of geofence
				longitude:      parseFloat(geofences[i].lng), //Geo longitude of geofence
				radius:         parseInt(geofences[i].radius), //Radius of geofence in meters
				transitionType: 3, //Type of transition 1 - Enter, 2 - Exit, 3 - Both
				notification: {         //Notification object
					id:             parseInt(geofences[i].id), //optional should be integer, id of notification
					title:          'test', //Title of notification
					text:           'text of the noti', //Text of notification
					smallIcon:      'res://my_location_icon',
					icon:           'file://img/icons/play/120.png',
					openAppOnClick: true,//is main app activity should be opened after clicking on notification
				}
			}).then(function (result) {

				console.log('Geofence added');

			}, function (reason) {

				console.log('Failed to add region', reason);

			});

			DebugService.log($scope, 'Subscribe geofence: ' + geofences[i].identifier + ' [' + geofences[i].id + ', ' + geofences[i].lat + ', ' + geofences[i].lng + ', ' + geofences[i].radius + ']');

			// Extract relevant scenarios
			var scenarios = board.scenarios;

			if (scenarios.length > 0)
			{
				for (s = 0; s < scenarios.length; ++s)
				{
					var scenario = scenarios[s];

					if (scenario.geofences.length > 0)
					{
						for (b = 0; b < scenario.geofences.length; ++b)
						{
							var identifier = parseInt(scenario.geofences[b]);
			
							if (identifier == parseInt(geofences[i].id) && parseInt(scenario.scenario_then_id) > 0)
							{
								$scope.geofence.scenarios.push({
									identifier: scenario.geofences[b],
									timezone: board.board.timezone,
									scenario: scenario
								});
							}
						}
					}
				}
			}
		}
	}

	/**
	 * Subscribe & unsubscribe geofences and extract relevant scenarios from active view
	 * The active board is the last loaded site. This board is not (always) saved to the favorites.
	 */

	this.parseActiveGeofences = function($scope)
	{
		if (typeof $scope.api.active_notification_board !== 'undefined' && typeof $scope.api.active_notification_board.geofences !== 'undefined')
		{
			DebugService.log($scope, 'Active notification board update [Geofences]');

			// Unsubscribe previous geofences
			if (typeof $scope.api.previous_notification_board !== 'undefined' && typeof $scope.api.previous_notification_board.geofences !== 'undefined')
			{
				var geofences = $scope.api.previous_notification_board.geofences;

				if (geofences.length > 0)
				{
					for (i = 0; i < geofences.length; ++i)
					{
						window.geofence.remove(String(geofences[i].id))
						.then(function () {
							DebugService.log($scope, 'Unsubscribe geofence from active board: ' + geofences[i].identifier + ' [' + geofences[i].id + ', ' + geofences[i].lat + ', ' + geofences[i].lng + ', ' + geofences[i].radius + ']');
						},
						function (reason){
							DebugService.log($scope, 'Failed to stop monitoring region');
							DebugService.log($scope, reason);
						});
					}
				}
			}

			// Parse geofences
			this.parseGeofences($scope, $scope.api.active_notification_board);
		}
	}

	/**
	 * Monitor and range available geofences
	 * These are geofences from favorites + currently active site
	 */

	this.startTrackingGeofences = function($scope)
	{
		document.addEventListener("deviceready", function() {

			/**
			 * ---------------------------------------------------------------------
			 * Geofence events
			 */

			DebugService.log($scope, 'Start tracking geofences');

			//window.geofence.initialize(); // <---- fails on iOS: Could not cast value of type 'CLBeaconRegion' to 'CLCircularRegion'

			/**
			 * ---------------------------------------------------------------------
			 * Listen for geofence transitions
			 * 
			 * geo.transitionType:
			 * 1 = enter region
			 * 2 = exit region
			 *
			 */

			window.geofence.onTransitionReceived = function (geofences) {

				geofences.forEach(function (geo) {
					DebugService.log($scope, 'Geofence transition detected');
					DebugService.log($scope, geo);

					var identifier = parseInt(geo.id);
					var state = parseInt(geo.transitionType);

					// Check if state has changed for queued scenarios
					ScenarioService.geofenceEventUpdate($scope, identifier, state);

					// Check if there're scenarios associated with this state
					if ($scope.geofence.scenarios.length > 0)
					{
						for (i = 0; i < $scope.geofence.scenarios.length; ++i)
						{
							var scenario = $scope.geofence.scenarios[i].scenario;
							var scenario_geofence_id = $scope.geofence.scenarios[i].identifier;

							/**
							 * User enters geofence region
							 */

							if (
								parseInt(scenario_geofence_id) == identifier && 
								parseInt(scenario.scenario_if_id) == 1 && 
								state == 1
							)
							{
								// DebugService.log($scope, 'Region enter detected for this geofence');

								// Validate day + time conditions
								var valid = ScenarioService.validateDateTimeConditions($scope.geofence.scenarios[i]);

								if (valid)
								{
									ScenarioService.triggerGeofenceScenario($scope, $scope.geofence.scenarios[i]);
								}
							}

							/**
							 * User leaves geofence region
							 */

							if (
								parseInt(scenario_geofence_id) == identifier && 
								parseInt(scenario.scenario_if_id) == 2 && 
								state == 2
							)
							{
								// DebugService.log($scope, 'Region leave detected for this geofence');

								// Validate day + time conditions
								var valid = ScenarioService.validateDateTimeConditions($scope.geofence.scenarios[i]);

								if (valid)
								{
									ScenarioService.triggerGeofenceScenario($scope, $scope.geofence.scenarios[i]);
								}
							}
						}
					}
				});

			};

		}, false);
	}
});