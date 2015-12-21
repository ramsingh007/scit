/**
 * --------------------------------------------------------------------------------------------
 * Factory
 */
 
 angular.module('ngApp.BeaconFactory', [])

/*
 * Beacons
 */

.factory('beacon', function(){
	return {
		scenarios: []
	};
});

/**
 * --------------------------------------------------------------------------------------------
 * Service
 */

angular.module('ngApp.BeaconServices', [])

/**
 * Monitor available beacons
 */

.service('BeaconService', function($rootScope, $cordovaBeacon, ScenarioService, DebugService){

	this.states = {
		'ProximityUnknown' : 0,
		'CLRegionStateInside' : 1,
		'CLRegionStateOutside' : 2,
		'ProximityFar' : 3,
		'ProximityNear' : 4,
		'ProximityImmediate' : 5
	};

	/**
	 * Extract beacons from favorite var
	 */

	this.extractFavBeacons = function($scope)
	{
		var self = this;
		document.addEventListener("deviceready", function() {

			// List boards
			var boards = $scope.api.favorite_notification_boards;

			if (boards.length > 0)
			{
				for (b = 0; b < boards.length; ++b)
				{
					if (typeof boards[b] !== 'undefined' && typeof boards[b].beacons !== 'undefined')
					{
						// Parse beacons
						self.parseBeacons($scope, boards[b]);
					}
				}
			}

		}, false);
	}

	/**
	 * Subscribe beacons and extract relevant scenarios
	 */

	this.parseBeacons = function($scope, board)
	{
		// Start watching beacons
		var beacons = board.beacons;

		for (i = 0; i < beacons.length; ++i)
		{
			var beacon = $cordovaBeacon.createBeaconRegion(String(beacons[i].id), beacons[i].uuid, beacons[i].major, beacons[i].minor);

			$cordovaBeacon.startMonitoringForRegion(beacon);
			$cordovaBeacon.startRangingBeaconsInRegion(beacon);

			DebugService.log($scope, 'Subscribe beacon: ' + beacons[i].identifier + ' [' + beacons[i].id + ', ' + beacons[i].uuid + ']');

			// Extract relevant scenarios
			var scenarios = board.scenarios;

			if (scenarios.length > 0)
			{
				for (s = 0; s < scenarios.length; ++s)
				{
					var scenario = scenarios[s];

					if (scenario.beacons.length > 0)
					{
						for (b = 0; b < scenario.beacons.length; ++b)
						{
							var identifier = parseInt(scenario.beacons[b]);

							if (identifier == parseInt(beacons[i].id) && parseInt(scenario.scenario_then_id) > 0)
							{
								$scope.beacon.scenarios.push({
									identifier: scenario.beacons[b],
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
	 * Subscribe & unsubscribe beacons and extract relevant scenarios from active view
	 * The active board is the last loaded site. This board is not (always) saved to the favorites.
	 */

	this.parseActiveBeacons = function($scope)
	{
		if (typeof $scope.api.active_notification_board !== 'undefined' && typeof $scope.api.active_notification_board.beacons !== 'undefined')
		{
			DebugService.log($scope, 'Active notification board update [Beacons]');

			// Unsubscribe previous beacons
			if (typeof $scope.api.previous_notification_board !== 'undefined' && typeof $scope.api.previous_notification_board.beacons !== 'undefined')
			{
				var beacons = $scope.api.previous_notification_board.beacons;

				if (beacons.length > 0)
				{
					for (i = 0; i < beacons.length; ++i)
					{
						var beacon = $cordovaBeacon.createBeaconRegion(String(beacons[i].id), beacons[i].uuid, beacons[i].major, beacons[i].minor);

						$cordovaBeacon.stopMonitoringForRegion(beacon);
						$cordovaBeacon.stopRangingBeaconsInRegion(beacon);

						DebugService.log($scope, 'Unsubscribe beacon from active board: ' + beacons[i].identifier + ' [' + beacons[i].id + ', ' + beacons[i].uuid + ']');
					}
				}
			}

			// Parse beacons
			this.parseBeacons($scope, $scope.api.active_notification_board);
		}
	}

	/**
	 * Monitor and range available beacons
	 * These are beacons from favorites + currently active site
	 */

	this.startTrackingBeacons = function($scope)
	{
		document.addEventListener("deviceready", function() {

			/**
			 * ---------------------------------------------------------------------
			 * Beacon events
			 */

			DebugService.log($scope, 'Start tracking beacons');

			/**
			 * This event is triggered when the script starts monitoring a beacon
			 */

			$rootScope.$on("$cordovaBeacon:didStartMonitoringForRegion", function (event, pluginResult) {
				// We've started monitoring this beacon: pluginResult.region.identifier
				// DebugService.log($scope, pluginResult);
			});

			/**
			 * Monitor region enter (state.CLRegionStateInside) or leave (state.CLRegionStateOutside)
			 */

			$rootScope.$on("$cordovaBeacon:didDetermineStateForRegion", function (event, pluginResult) {

				// DebugService.log($scope, pluginResult);

				if (typeof pluginResult.region.identifier !== 'undefined')
				{
					// Get beacon info
					var identifier = pluginResult.region.identifier; // This is the numeric id
					var uuid = pluginResult.region.uuid;
					var major = pluginResult.region.major;
					var minor = pluginResult.region.minor;
					var state = pluginResult.state;

					// Check if state has changed for queued scenarios
					ScenarioService.beaconEventUpdate($scope, identifier, state);

					//DebugService.log($scope, 'The state of beacon #' + identifier + ' is ' + state);

					// Check if there're scenarios associated with this state
					if ($scope.beacon.scenarios.length > 0)
					{
						for (i = 0; i < $scope.beacon.scenarios.length; ++i)
						{
							var scenario = $scope.beacon.scenarios[i].scenario;
							var scenario_beacon_id = $scope.beacon.scenarios[i].identifier;

							/**
							 * User enters beacon region
							 */

							if (
								parseInt(scenario_beacon_id) == parseInt(identifier) && 
								parseInt(scenario.scenario_if_id) == 1 && 
								state == 'CLRegionStateInside'
							)
							{
								// DebugService.log($scope, 'Region enter detected for this beacon');

								// Validate day + time conditions
								var valid = ScenarioService.validateDateTimeConditions($scope.beacon.scenarios[i]);

								if (valid)
								{
									ScenarioService.triggerBeaconScenario($scope, $scope.beacon.scenarios[i]);
								}
							}

							/**
							 * User leaves beacon region
							 */

							if (
								parseInt(scenario_beacon_id) == parseInt(identifier) && 
								parseInt(scenario.scenario_if_id) == 2 && 
								state == 'CLRegionStateOutside'
							)
							{
								// DebugService.log($scope, 'Region leave detected for this beacon');

								// Validate day + time conditions
								var valid = ScenarioService.validateDateTimeConditions($scope.beacon.scenarios[i]);

								if (valid)
								{
									ScenarioService.triggerBeaconScenario($scope, $scope.beacon.scenarios[i]);
								}
							}
						}
					}
				}
			});

			/**
			 * Proximity ranging of beacons
			 */

			$rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function (event, pluginResult) {

				// DebugService.log($scope, pluginResult);

				if (pluginResult.beacons.length > 0)
				{
					// Get beacon info
					var identifier = pluginResult.region.identifier; // This is the numeric id
					var uuid = pluginResult.beacons[0].uuid;
					var major = pluginResult.beacons[0].major;
					var minor = pluginResult.beacons[0].minor;
					var proximity = pluginResult.beacons[0].proximity;
					var accuracy = pluginResult.beacons[0].accuracy;
					var rssi = pluginResult.beacons[0].rssi;
					var tx = pluginResult.beacons[0].tx;

					// Check if state has changed for queued scenarios
					ScenarioService.beaconEventUpdate($scope, identifier, proximity);

					// Calculate distance - experimental, is beacon specific
					if (rssi == 0)
					{
						var distance = -1.0; // if we cannot determine distance, return -1.
					}
					
					var ratio = rssi*1.0/tx;
					if (ratio < 1.0)
					{
						var distance = Math.pow(ratio,10);
					}
					else
					{
						var accuracy =  (0.89976)*Math.pow(ratio,7.7095) + 0.111;    
						var distance = accuracy;
					}

					// DebugService.log($scope, 'The proximity of beacon #' + identifier + ' is ' + proximity + ', approximate distance is ' + distance);

					// Check if there're scenarios associated with this proximity
					if ($scope.beacon.scenarios.length > 0)
					{
						for (i = 0; i < $scope.beacon.scenarios.length; ++i)
						{
							var scenario = $scope.beacon.scenarios[i].scenario;
							var scenario_beacon_id = $scope.beacon.scenarios[i].identifier;

							/**
							 * is_far_from
							 */

							if (
								parseInt(scenario_beacon_id) == parseInt(identifier) && 
								parseInt(scenario.scenario_if_id) == 3 && 
								proximity == 'ProximityFar'
							)
							{
								// DebugService.log($scope, 'ProximityFar trigger for this beacon');

								// Validate day + time conditions
								var valid = ScenarioService.validateDateTimeConditions($scope.beacon.scenarios[i]);
	
								if (valid)
								{
									ScenarioService.triggerBeaconScenario($scope, $scope.beacon.scenarios[i]);
								}
							}

							/**
							 * is_near
							 */

							if (
								parseInt(scenario_beacon_id) == parseInt(identifier) && 
								parseInt(scenario.scenario_if_id) == 4 && 
								proximity == 'ProximityNear'
							)
							{
								// DebugService.log($scope, 'ProximityNear trigger for this beacon');

								// Validate day + time conditions
								var valid = ScenarioService.validateDateTimeConditions($scope.beacon.scenarios[i]);
	
								if (valid)
								{
									ScenarioService.triggerBeaconScenario($scope, $scope.beacon.scenarios[i]);
								}
							}

							/**
							 * is_very_near
							 */

							if (
								parseInt(scenario_beacon_id) == parseInt(identifier) && 
								parseInt(scenario.scenario_if_id) == 5 && 
								proximity == 'ProximityImmediate'
							)
							{
								// DebugService.log($scope, 'ProximityImmediate trigger for this beacon');

								// Validate day + time conditions
								var valid = ScenarioService.validateDateTimeConditions($scope.beacon.scenarios[i]);

								if (valid)
								{
									ScenarioService.triggerBeaconScenario($scope, $scope.beacon.scenarios[i]);
								}
							}
						}
					}
				}
			});

		}, false);
	}
});