# Offline Manager
Offline Manager is a utility to store content for future offline usages.
You can download videos into the browser and play them (using the player) in the future, when online support is not available.
The media is currently saved in the indexedDB.

## Creating an offline manager
In order to use the offline manager features, you will have to create an offline manager:

```javascript
let offlineManager = new KalturaPlayer.OfflineManager(configuration)
```

The configuration is the same as the [configuration](https://github.com/kaltura/kaltura-player-js/blob/master/docs/configuration.md) you pass when creating the Kaltura player.

## API

| Name | Params | Returns | Description |
|--|--|--|--|
|`getMediaInfo`|`MediaInfo object`|Provider info object|Getting info per an entry - DRM info, manifest url etc. The information will be used by the download manager in the download process|
| `download` | `entryId : string`, `options` - optional| `promise<*>` | Start downloading an entry |
|`pause`|`entryId : string`|`promise<*>`| Pausing an ongoing download
|`resume`|`entryId : string`|`promise<*>`| Resuming the download of an entry
|`remove`|`entryId : string`|`promise<*>`| Removing a stored / partially stored entry. This also can be used when wanting to cancel a download which is still in progress.
|`resumeAll`|-|`promise<*>`|Resuming all downloads|
|`pauseAll`|-|`promise<*>`| Pausing all downloads|
|`getDownloadedMediaInfo`|`entryId : string`|`promise<*>`|Getting stored metadata per an entry. The object contains license expiration timestamp, name, description, download status, size and other useful data about the entry.|
|`getAllDownloads`|-|`promise<*>`| getting a list of all the downloaded entries|
|`removeAll`|-|`promise<*>`| removing all the entries from the database|
|`renewLicense`|`entryId : string`|`promise<*>`| renew an offline license|

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
```javascript
// already implemented, write a guide
```

## writing a plugin? how to know you are playing an offline source?
```javascript
// already implemented, write a guide
```

## Error handling

```javascript
// already implemented, write a guide
```
