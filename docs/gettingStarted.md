# Offline Manager
Offline Manager is a utility to store content for future offline usages.
You can download videos into the browser and play them (using the player) in the future, when online support is not available.
The media is currently saved in the indexedDB.

## Creating an offline manager
In order to use the offline manager features, you will have to create an offline manager:

```javascript
let offlineManager = new KalturaPlayer.OfflineManager(configuration)
```

The configuration is the same as the \[configuration\](https://github.com/kaltura/kaltura-player-js/blob/master/docs/configuration.md) you pass when creating the Kaltura player.



> API documentation can be found [here](./API.md).


## Writing a player plugin?

Sometimes, you will want to know if you are playing a media from storage (and not streaming it). This can come handy in terms of:

 - Error handling
 - Sending requests (e.g. analytics)

Currently, media that is local has only one dash source.
We added `isLocal: true` property to the source, so you can verify it is a local source.
