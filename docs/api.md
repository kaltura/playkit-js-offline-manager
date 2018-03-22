# Offline manager API
Here you will find a list of API calls and handling progress and error events.

 - [API list](#API-list)
 - [Progress](#progress)
 - [Download options object](#download-options)
 - [Error](#error-handling)

## API list

| Name | Params | Returns | Description |
|--|--|--|--|
|`getMediaInfo`|`MediaInfo object`|Provider info object|Getting info per an entry - DRM info, manifest url etc. The information will be used by the download manager in the download process|
| `download` | `entryId: string`, `options` - optional| `promise<*>` | Start downloading an entry |
|`pause`|`entryId: string`|`promise<*>`| Pausing an ongoing download
|`resume`|`entryId: string`|`promise<*>`| Resuming the download of an entry
|`remove`|`entryId: string`|`promise<*>`| Removing a stored / partially stored entry. This also can be used when wanting to cancel a download which is still in progress.
|`resumeAll`|-|`promise<*>`|Resuming all downloads|
|`pauseAll`|-|`promise<*>`| Pausing all downloads|
|`getDownloadedMediaInfo`|`entryId: string`|`promise<*>`|Getting stored metadata per an entry. The object contains license expiration timestamp, name, description, download status, size and other useful data about the entry.|
|`getAllDownloads`|-|`promise<*>`| getting a list of all the downloaded entries|
|`removeAll`|-|`promise<*>`| removing all the entries from the database|
|`renewLicense`|`entryId: string`|`promise<*>`| renew an offline license|
|`getExpiration`|`entryId: string`|`promise<*>`| a unix timestamp with the license expiration date|

## Download Options
If no options object is provided, the download process will choose one audio track and one video track.
The options object is consisted of two values:
```javascript
const options = {
	language: 'es',
  bitrate: 7900446
}
```
The download manager will try to find a stream that matches the value of language. Then, it will find a video track with the closest bitrate to the one sent.
If no language or bitrate is specified, it will select the lowest bitrate and a random audio track.

## Progress
The download manager fires progress events (for each download).
The progress event has the entry id string, and the progress (in percentage).
Here is an example of how to listen to the progress event.
```javascript
let downloadManager = new KalturaPlayer.downloadManager(playerConfig);
downloadManager.addEventListener("progress", event => {
  let progressData = event.payload.detail;
	console.info("entryId", progressData.entryId);
	console.info("progress", progressData.progress);
});
```

## Error handling

The download manager fires error events.
The errors are in the same structure of the Kaltura player errors.

> Read more about the Kaltura player errors [here](https://github.com/kaltura/kaltura-player-js/blob/master/docs/errors.md).

Here is an example of how to listen to an error event:
```javascript
KalturaPlayer.downloadManager(playerConfig);
downloadManager.addEventListener("error", event => {
	const error = e.payload;
	console.log('The error severity is: ' + error.severity);
	console.log('The error category is: ' + error.category);
	console.log('The error code is: ' + error.code);
	console.log('The error data is', error.data);
});
```
