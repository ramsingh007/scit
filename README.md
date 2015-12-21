# Proximity Marketing Made with Pepper

This app communicates with the MwP Proximity Marketing Platform API, http://madewithpepper.com/proximity-marketing.

Create a mobile site with the platform, link it to a notification board and scan the QR with this app. Or enter the url manually. The mobile site will open in the app, and extra information like bluetooth and geofence data is loaded from the API.

## Pre Beta

The code is not optimized, doesn't follow best practices and needs to be refactured. Don't use this app in production environments yet. There will be unexpected behaviour.

## Roadmap

 - Replace % sign on iOS with %% for notifications (escape)
 - Add bookmark on content view
 - History of scenario notifications
 - Hide bookmark button if site already has been bookmarked
 - Bookmark scenario content
 - "Reload beacons" button / live refresh of scenarios
 - Unsubscribe beacons + geofences if app is deleted
 - Update app title in favorites
 - Retry in case POST goes wrong (possibly n times, then check for SQLite fallback)
 - Bluetooth / internet connection check
 - Default fav app
 - Interval delay for scenarios
 - Loading image for fav icons, when a new app is saved, there may be no or a slow internet connection
 - Add privacy policy on collected geo location data, storage and third parties
 - Push notifications
