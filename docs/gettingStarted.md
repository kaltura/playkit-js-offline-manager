# Offline Manager
Offline Manager is a utility to store content for future offline usages.
You can download videos into the browser and play them (using the player) in the future, when online support is not available.
The media is currently saved in the indexedDB.


## Creating an offline manager
In order to use the offline manager features, you will have to create an offline manager. The offline manager currently depends on the Kaltura player provider, so you will have to include the Kaltura player library as well.

Here is a code snippet creating an instance of the offline manager:

```javascript
<script src="path/to/player/file/kaltura-tv-player.js"></script>
<script src="path/to/offline-manager/file/playkit-offline-manager.js"></script>
<script>
const configuration = {
  provider: {
    partnerId: YOUR_PARTNER_ID,
    uiConfId: YOUR_UI_CONF_ID,
    env: {
      serviceUrl: ENVIRONMENT_URL
	}
  },
  player: {
    playback: {
      ...
  }
};
let offlineManager = new KalturaPlayer.OfflineManager(configuration)
</script>
```

You can read more about the [configuration](https://github.com/kaltura/kaltura-player-js/blob/master/docs/configuration.md) in the Kaltura player configuration [document](ttps://github.com/kaltura/kaltura-player-js/blob/master/docs/configuration.md).

Now, you can use the offline manager [API](./API.md) to download, resume and perform other actions.

> API documentation can be found [here](./API.md).

Here is an example to download media and pause it.

```javascript
const ottMediaObj = {
	entryId: SOME_GREAT_ENTRY_ID
	}
// first you will get the media info.
downloadManager.getMediaInfo(ottMediaObj).then( res => {
  console.info("media info response:", res);
  // after the download manager has the info, you can download it.
  downloadManager.download(SOME_GREAT_ENTRY_ID);
})

// pause a download
downloadManager.pause(SOME_GREAT_ENTRY_ID);
```

## Playing stored content
In order to play offline content, you will have to provide the player with some configuration that was stored during the download process, and call the `setMedia` with it (instead of `loadMedia` when streaming content online).

Here is an example:
```javascript

downloadManager.getDownloadedMediaInfo(GREAT_STORED_ENTRY_ID).then(data=>{
  kalturaPlayer.setMedia(data);
});
```
The initialization of the Kaltura player can be found [here](https://github.com/kaltura/kaltura-player-js/blob/master/docs/configuration.md), but the creation of the Kaltura player is the same for offline and online purposes.

## Writing a player plugin?

Sometimes, you will want to know if you are playing a media from storage (and not streaming it). This can come handy in terms of:

 - Error handling
 - Sending requests (e.g. analytics)

Currently, media that is local has only one dash source.
We added `isLocal: true` property to the source, so you can verify it is a local source.

