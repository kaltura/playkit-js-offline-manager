# Offline Manager APIs

Here you'll find a list of API calls and handling the progress of a download.

 - [API list](#API-list)
 - [Progress](#progress)
 - [Download options object](#download-options)

## API List

| Name | Params | Returns | Description |
|--|--|--|--|
|`getMediaConfig`|`MediaInfo object`|Provider info object|Getting information per entry - DRM info, manifest url etc. The information will be used by the Download Manager in the download process|
|`download` | `entryId: string`, `options` - optional| `promise<*>` | Start downloading an entry |
|`pause`|`entryId: string`|`promise<*>`| Pausing an ongoing download
|`resume`|`entryId: string`|`promise<*>`| Resuming the download of an entry
|`remove`|`entryId: string`|`promise<*>`| Removing a stored / partially-stored entry. This also can be used when you want to cancel a download that's still in progress.
|`pauseAll`|-|`promise<*>`| Pausing all downloads|
|`getDownloadedMediaConfig`|`entryId: string`|`promise<*>`|Getting stored metadata per entry. The object contains the license expiration timestamp, name, description, download status, size and other useful data about the entry.|
|`getAllDownloads`|-|`promise<*>`| Getting a list of all downloaded entries.|
|`removeAll`|-|`promise<*>`| Removing all entries from the database.|
|`renewLicense`|`entryId: string`|`promise<*>`| Renew an offline license.|
|`getExpiration`|`entryId: string`|`promise<*>`| A unix timestamp with the license expiration date.|

## Download Options

If no options object is provided, the download process will choose one audio track and one video track.
The options object consists of two values:
```javascript
const options = {
	language: 'es',
  bitrate: 7900446
}
offlineManager.download('entryId', options);
```
The Download Manager will try to find a stream that matches the value of the language. Then, it will find a video track with the closest bitrate to the one sent.
If no language or bitrate is specified, it will select the lowest bitrate and a random audio track.

## Progress

The Download Manager fires progress events (for each download). The progress event has the entry ID string, and the progress (in percentage).

Here's an example of how to listen to the progress event:
```javascript
let offlineManager = new KalturaPlayer.offlineManager(playerConfig);
offlineManager.addEventListener("progress", event => {
  let progressData = event.payload.detail;
	console.info("entryId", progressData.entryId);
	console.info("progress", progressData.progress);
});
```
