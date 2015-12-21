/**
 * --------------------------------------------------------------------------------------------
 * Factory
 */
 
 angular.module('ngApp.DataFactory', [])

/*
 * Favorites
 */

.factory('favs', function() {
	return {
		items: [],
		loading: true
	};
});

/**
 * --------------------------------------------------------------------------------------------
 * Service
 */

angular.module('ngApp.DataServices', [])

/**
 * Data services
 */

.service('DataService', function($cordovaSQLite, $ionicPopup, ApiService, BeaconService, GeofenceService, DebugService) {

	/*
	 * SQLite db config
	 * 
	 * location
	 * 0 (default): Documents - visible to iTunes and backed up by iCloud
	 * 1: Library - backed up by iCloud, NOT visible to iTunes
	 * 2: Library/LocalDatabase - NOT visible to iTunes and NOT backed up by iCloud
	 */

	this.config = {
		db_name: 'mwp_data.db',
		location: 1,
		androidDatabaseImplementation: 2,
		androidLockWorkaround: 1
	};

	/**
	 * Load favorites
	 */

	this.loadFavs = function($scope, resetDatabase)
	{
		if (typeof resetDatabase === 'undefined') resetDatabase = false;

		var self = this;

		document.addEventListener("deviceready", function() {

			var db = $cordovaSQLite.openDB({
				name: self.config.db_name, 
				location: self.config.location, 
				androidDatabaseImplementation: self.config.androidDatabaseImplementation, 
				androidLockWorkaround: self.config.androidLockWorkaround
			});

			db.transaction(function(tx) {

				/**
				 * Create table if not exists
				 */

				if (resetDatabase) tx.executeSql('DROP TABLE IF EXISTS favs');
				tx.executeSql('CREATE TABLE IF NOT EXISTS favs (id integer primary key, name text, icon text, url text, api text, created integer)');

				db.transaction(function(tx) {
					tx.executeSql("SELECT id, name, icon, url, api FROM favs ORDER BY created ASC;", [], function(tx, result) {

						$scope.favs.items.length = 0;

						if (result.rows.length > 0)
						{
							for (var i=0; i < result.rows.length; i++)
							{
								var id = result.rows.item(i).id;
								var api = result.rows.item(i).api;
								var icon = result.rows.item(i).icon;
								if (icon == null) icon = 'img/icons/globe/120.png';

								var fav = {
									'id': id,
									'icon': icon,
									'name': result.rows.item(i).name,
									'url': result.rows.item(i).url,
									'api': api
								};

								$scope.favs.items.push(fav);

								// Set bookmarked
								if (result.rows.item(i).url == $scope.view.input)
								{
									$scope.view.bookmarked = true;
								}

								DebugService.log($scope, 'SQlite favs loaded ↓');
								DebugService.log($scope, fav);

								/**
								 * Post to Proximity Platform API to get latest notification board changes
								 */
	
								var promise = ApiService.handshake($scope, result.rows.item(i).url);

								promise.then(
									function(data) { // Request succeeded
										if (data !== false)
										{
											$scope.api.favorite_notification_boards.push(data);
	
											BeaconService.extractFavBeacons($scope);
											GeofenceService.extractFavGeofences($scope);
	
											DebugService.log($scope, 'Fav notification board loaded from remote ↓');
											DebugService.log($scope, data);
	
											db.transaction(function(tx) {
												tx.executeSql("UPDATE favs SET api = ? WHERE id = ?;", [JSON.stringify(data), id], function(tx, result) {
													DebugService.log($scope, 'Api response updated');
												});
											});
										}
									},
									function(response) { // Request failed, use offline api data
										$scope.api.favorite_notification_boards.push(JSON.parse(api));
	
										BeaconService.extractFavBeacons($scope);
										GeofenceService.extractFavGeofences($scope);
	
										DebugService.log($scope, 'Fav notification board loaded from local ↓');
										DebugService.log($scope, JSON.parse(api));
									}
								);
							};
						}
						$scope.favs.loading = false;
					});
				});
			});

		}, false);
	}

	/**
	 * Add bookmark
	 */

	this.addBookmark = function($scope)
	{
		var self = this;

		var icon = $scope.view.icon;
		if (icon == null) icon = 'img/icons/globe/120.png';
		var now = Date.now();
		var url = (typeof $scope.view.input === 'undefined' || $scope.view.input == '') ? $scope.view.iframe : $scope.view.input;

		document.addEventListener("deviceready", function() {
			var db = $cordovaSQLite.openDB({
				name: self.config.db_name, 
				location: self.config.location, 
				androidDatabaseImplementation: self.config.androidDatabaseImplementation, 
				androidLockWorkaround: self.config.androidLockWorkaround
			});

			db.transaction(function(tx) {
				tx.executeSql("SELECT id FROM favs WHERE url = ?;", [url], function(tx, result) {
					if (result.rows.length == 0)
					{
						db.transaction(function(tx) {
							tx.executeSql("INSERT INTO favs (name, icon, url, api, created) VALUES (?, ?, ?, ?, ?);", [$scope.view.title, icon, url, JSON.stringify($scope.api.active_notification_board), now], function(tx, result) {
								// Reload favorites
								self.loadFavs($scope);

								// Set current view to bookmarked
								$scope.view.bookmarked = true;

								$ionicPopup.alert({
									title: 'Bookmark added'
								}).then(function(res) {
									DebugService.log($scope, 'Bookmark added: ' + url);
								});
							});
						});
					}
					else
					{
						$ionicPopup.alert({
							title: 'Bookmark already exists'
						}).then(function(res) {
							DebugService.log($scope, 'Bookmark already exists: ' + url);
						});
					}
				});
			});
		}, false);
	}

	/**
	 * Delete bookmark
	 */

	this.deleteBookmark = function($scope, id)
	{
		var self = this;

		document.addEventListener("deviceready", function() {
			var db = $cordovaSQLite.openDB({
				name: self.config.db_name, 
				location: self.config.location, 
				androidDatabaseImplementation: self.config.androidDatabaseImplementation, 
				androidLockWorkaround: self.config.androidLockWorkaround
			});

			db.transaction(function(tx) {
				tx.executeSql("DELETE FROM favs WHERE id = ?;", [id], function(tx, result) {

					// To do: unsubscribe beacons + geofences

					// Set bookmarked to false
					$scope.view.bookmarked = false;

					// Reload favorites
					self.loadFavs($scope);

					$ionicPopup.alert({
						title: 'Bookmark deleted'
					}).then(function(res) {
						DebugService.log($scope, 'Bookmark deleted: #' + id);
					});

				});
			});
		}, false);
	}
});