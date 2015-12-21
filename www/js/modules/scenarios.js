/**
 * --------------------------------------------------------------------------------------------
 * Factory
 */
 
 angular.module('ngApp.ScenarioFactory', [])

/*
 * Beacons
 */

.factory('scenario', function(){
	return {
		content_title: 'Proximity Content',
		beacon_queue: [],
		geofence_queue: [],
		active: {
			'scenario_then_id': 0
		},
		show_loader: false
	};
});

/**
 * --------------------------------------------------------------------------------------------
 * Service
 */

angular.module('ngApp.ScenarioServices', [])

/**
 * Scenario 
 */

.service('ScenarioService', function(DebugService, $cordovaLocalNotification, $location){

	this.states = {
		'ProximityUnknown' : 0,
		'CLRegionStateInside' : 1,
		'CLRegionStateOutside' : 2,
		'ProximityFar' : 3,
		'ProximityNear' : 4,
		'ProximityImmediate' : 5
	};

	/**
	 * Scenario response based on board
	 */

	this.response = function($scope, board)
	{
		/**
		 * Set active scenario for content view
		 * and open content view
		 */

		$scope.scenario.active = board.scenario;
		$scope.scenario.content_title = '';

		$location.path('/nav/content');

		// Required to "refresh" the content view
		$scope.$apply();

		/**
		 * show_image
		 */

		if (board.scenario.scenario_then_id == 2)
		{
			$scope.scenario.content_title = 'Image';

			$scope.scenario.show_loader = true;
			DebugService.log($scope, 'show_image: ' + board.scenario.show_image);
		}

		/**
		 * show_template
		 */

		if (board.scenario.scenario_then_id == 3)
		{
			$scope.scenario.content_title = 'Content';

			$scope.scenario.show_loader = true;
			DebugService.log($scope, 'show_template: ' + board.scenario.template);
		}

		/**
		 * open_url
		 */

		if (board.scenario.scenario_then_id == 4)
		{
			$scope.scenario.content_title = 'Web Page';

			$scope.scenario.show_loader = true;
			DebugService.log($scope, 'open_url: ' + board.scenario.open_url);
		}
	}

	/**
	 * For every beacon event, the scenario queue is checked for changes from last proximity / region state
	 */

	this.beaconEventUpdate = function($scope, beacon_id, state)
	{
		var state = parseInt(this.states[state]);

		for (key in $scope.scenario.beacon_queue)
		{
			var board = $scope.scenario.beacon_queue[key];
			var scenario_if_id = parseInt(board.scenario.scenario_if_id);
			var scenario_beacon_id = parseInt(board.beacon_id);

			// Update last state for either region or proximity
			if (parseInt(this.states[state]) <= 2)
			{
				$scope.scenario.beacon_queue[key].last_region = state;
			}
			else
			{
				$scope.scenario.beacon_queue[key].last_proximity = state;
			}

			if ((scenario_if_id > 2 && state > 2) || (scenario_if_id <= 2 && state <= 2))
			{
				// Check if state has changed for either region or proxitmiy
				if (parseInt(beacon_id) == scenario_beacon_id && scenario_if_id != state)
				{
					$scope.scenario.beacon_queue[key].state_has_changed = true;
				}
			}
		}
	}

	/**
	 * Check whether to trigger scenario
	 */

	this.triggerBeaconScenario = function($scope, board)
	{
		var self = this;

		/**
		 * Update scenario queue, for each beacon
		 */

		var trigger_scenario = false;

		var scenario_id = board.scenario.id;
		var beacon_id = parseInt(board.identifier);
		var beacon_queue_key = scenario_id + '.' + beacon_id;

		/**
		 * Check if scenario is in queue and if it can be triggered (again)
		 */

		var trigger_scenario_beacon = false;

		if (typeof $scope.scenario.beacon_queue[beacon_queue_key] !== 'undefined')
		{
			// This scenario has been triggered before, check whether it can be triggered again
			if ($scope.scenario.beacon_queue[beacon_queue_key].state_has_changed)
			{
				DebugService.log($scope, 'Beacon state has changed, scenario can be triggered again');
				trigger_scenario_beacon = true;
			}
		}
		else
		{
			DebugService.log($scope, 'First time for this scenario');
			trigger_scenario_beacon = true;
		}

		if (trigger_scenario_beacon)
		{
			var trigger_scenario = true;

			if (board.scenario.scenario_if_id <= 2)
			{
				var last_region = board.scenario.scenario_if_id;
				var last_proximity = null;
			}
			else
			{
				var last_region = null;
				var last_proximity = board.scenario.scenario_if_id;
			}

			$scope.scenario.beacon_queue[beacon_queue_key] = {
				scenario_id: scenario_id,
				beacon_id: beacon_id,
				scenario: board.scenario,
				state_has_changed: false,
				last_region: last_region,
				last_proximity: last_proximity,
				date: Date.now()
			};
		}

		if (trigger_scenario)
		{
			var now = new Date().getTime();
			var delay = new Date(now + board.scenario.delay * 1000);

			if (board.scenario.scenario_if_id <= 2)
			{
				DebugService.log($scope, 'Region update');
				DebugService.log($scope, 'app_status: ' + app_status);

				// Check if notification is necessary
				if (app_status == 'ready')
				{
					self.response($scope, board);
				}
				else
				{
					// Send notification
					document.addEventListener("deviceready", function() {
	
						$cordovaLocalNotification.schedule({
							id: board.scenario.id,
							text: board.scenario.notification,
							at: delay
						}).then(function (result) {
						});
	
					}, false);

					self.response($scope, board);
				}
			}
			else
			{
				DebugService.log($scope, 'Proximity update');
				this.response($scope, board);
			}
		}
	}

	/**
	 * For every geofence event, the scenario queue is checked for changes in last region state
	 */

	this.geofenceEventUpdate = function($scope, geofence_id, state)
	{
		var state = parseInt(state);

		for (key in $scope.scenario.geofence_queue)
		{
			var board = $scope.scenario.geofence_queue[key];
			var scenario_if_id = parseInt(board.scenario.scenario_if_id);
			var scenario_geofence_id = parseInt(board.geofence_id);

			$scope.scenario.geofence_queue[key].last_state = state;

			if (scenario_if_id > 2)
			{
				// Check if state has changed for either region or proxitmiy
				if (parseInt(geofence_id) == scenario_geofence_id && scenario_if_id != state)
				{
					$scope.scenario.geofence_queue[key].state_has_changed = true;
				}
			}
		}
	}

	/**
	 * Check whether to trigger geofence
	 */

	this.triggerGeofenceScenario = function($scope, board)
	{
		var self = this;

		/**
		 * Update scenario queue, for each beacon
		 */

		var trigger_scenario = false;

		var scenario_id = board.scenario.id;
		var geofence_id = parseInt(board.identifier);
		var geofence_queue_key = scenario_id + '.' + geofence_id;

		/**
		 * Check if scenario is in queue and if it can be triggered (again)
		 */

		var trigger_scenario_geofence = false;

		if (typeof $scope.scenario.geofence_queue[geofence_queue_key] !== 'undefined')
		{
			// This scenario has been triggered before, check whether it can be triggered again
			if ($scope.scenario.geofence_queue[geofence_queue_key].state_has_changed)
			{
				DebugService.log($scope, 'Geofence state has changed, scenario can be triggered again');
				trigger_scenario_geofence = true;
			}
		}
		else
		{
			DebugService.log($scope, 'First time for this scenario');
			trigger_scenario_geofence = true;
		}

		if (trigger_scenario_geofence)
		{
			var trigger_scenario = true;

			$scope.scenario.geofence_queue[geofence_queue_key] = {
				scenario_id: scenario_id,
				geofence_id: geofence_id,
				scenario: board.scenario,
				state_has_changed: false,
				last_state: board.scenario.scenario_if_id,
				date: Date.now()
			};
		}

		if (trigger_scenario)
		{
			var now = new Date().getTime();
			var delay = new Date(now + board.scenario.delay * 1000);

			if (board.scenario.scenario_if_id <= 2)
			{
				DebugService.log($scope, 'Geofence update');
				DebugService.log($scope, 'app_status: ' + app_status);

				// Check if notification is necessary
				if (app_status == 'ready')
				{
					self.response($scope, board);
				}
				else
				{
					// Send notification
					document.addEventListener("deviceready", function() {
	
						$cordovaLocalNotification.schedule({
							id: board.scenario.id,
							text: board.scenario.notification,
							at: delay
						}).then(function (result) {
							self.response($scope, board);
						});
	
					}, false);
				}
			}
		}
	}

	/**
	 * Validate date & time conditions based on board and timezone
	 */

	this.validateDateTimeConditions = function(board)
	{
		var scenario = board.scenario;
		var timezone = board.timezone;

		// Check for day
		var valid_day = false;
		var current_day_of_week = moment().tz(timezone).day();

		if (scenario.scenario_day_id == 1) valid_day = true; // every_day
		if (scenario.scenario_day_id == 3 && (current_day_of_week == 6 || current_day_of_week == 7)) valid_day = true; // saturday_and_sunday
		if (scenario.scenario_day_id == 4 && (current_day_of_week == 5 || current_day_of_week == 6)) valid_day = true; // friday_and_saturday
		if (scenario.scenario_day_id == 5 && (current_day_of_week >= 1 && current_day_of_week <= 5)) valid_day = true; // monday_to_friday
		if (scenario.scenario_day_id == 6 && ((current_day_of_week >= 1 && current_day_of_week <= 4) || current_day_of_week == 7)) valid_day = true; // sunday_to_thursday
		if (scenario.scenario_day_id == 7 && current_day_of_week == 1) valid_day = true; // monday
		if (scenario.scenario_day_id == 8 && current_day_of_week == 2) valid_day = true; // tuesday
		if (scenario.scenario_day_id == 9 && current_day_of_week == 3) valid_day = true; // wednesday
		if (scenario.scenario_day_id == 10 && current_day_of_week == 4) valid_day = true; // thursday
		if (scenario.scenario_day_id == 11 && current_day_of_week == 5) valid_day = true; // friday
		if (scenario.scenario_day_id == 12 && current_day_of_week == 6) valid_day = true; // saturday
		if (scenario.scenario_day_id == 13 && current_day_of_week == 7) valid_day = true; // sunday

		// Between two dates
		if (scenario.scenario_day_id == 2) 
		{ 
			var current_date = moment(moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss'));
			var date_start = moment(scenario.date_start).startOf('day');
			var date_end = moment(scenario.date_end).endOf('day');

			if (current_date.isBefore(date_end) && date_start.isBefore(current_date)) valid_day = true; // between_two_dates 
		}

		// Check for time
		var valid_time = false;

		if (scenario.scenario_time_id == 1) valid_time = true; // all_the_time

		// Between two times
		if (scenario.scenario_time_id == 2) 
		{ 
			var current_date = moment(moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss'));
			var time_start = moment(scenario.time_start, 'HH:mm:ss');
			var time_end = moment(scenario.time_end, 'HH:mm:ss');

			if (current_date.isBefore(time_end) && time_start.isBefore(current_date)) valid_time = true; // between_two_times 
		}

		return (valid_day && valid_time) ? true : false;
	}
});