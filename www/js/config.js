angular.module('ngApp.config', [])

/*
 * ---------------------------------------------------
 * Made with Pepper Proximity Marketing Platform
 *
 * For information visit 
 * madewithpepper.com
 * ---------------------------------------------------
 */

.constant('PROXIMITY_PLATFORM', {

	/*
	 * ---------------------------------------------------
	 * If enabled is set to true, the extra features
	 * will be used. If set to false, there will be
	 * no connection with an external server.
	 * ---------------------------------------------------
	 */

	enabled: true,

	/*
	 * ---------------------------------------------------
	 * This is the Proximity Platform API endpoint
	 * ---------------------------------------------------
	 */

	api_endpoint: 'http://apps.madewithpepper.com',

	/*
	 * ---------------------------------------------------
	 * Default title for web view top bar
	 * ---------------------------------------------------
	 */

	default_title: 'Browser',

	/*
	 * ---------------------------------------------------
	 * Url that's loaded in the web view by default
	 * ---------------------------------------------------
	 */

	default_url: 'http://apps.madewithpepper.com/mobile/made-with-pepper'
});