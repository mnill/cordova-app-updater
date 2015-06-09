# cordova-app-updater
=============================
> Simple plugin for hot update cordova app.  
> Forked from https://github.com/shawn0326/cordova-files-update

Tested on android and ios.


Concept:

1. on startup copy all files from www to PERSISTENT storage. (if not copied before);
2. download config.json from server.
3. compare the version constants in downloaded config.json and local config.json.
4. if different - download new files from server to PERSISTENT, then override local config.json.
(download not all files, only new\different which are written in config.json as new. I have a Grunt script that calculates a list of new files.)
5. redirect window.location.href to persistent storage + /$start_page.html;

**Attention:**
Current version requires internet connection on app startup;  

  
 --------------------------------------------------------------------------------  
## Installation:
### Setup Cordova:

```bash
  cordova plugin add https://github.com/mnill/cordova-plugin-file.git
  cordova plugin add org.apache.cordova.file-transfer
  cordova plugin add org.apache.cordova.dialogs
  cordova plugin add https://github.com/mnill/cordova-app-updater.git --variable SERVER_ADDRESS="$SERVER_URL"
```
Replace $SERVER_URL with your server url, where your config.json and files for update. (example http://mnillstone.com/) --- **Make sure to include the trailing slash in your url**

**Attention**
You must use my fork of cordova-plugin-file (https://github.com/mnill/cordova-plugin-file.git). Make sure you delete the official plugin file before installing (if it's been installed before).
It's because the official plugin does not support readonly access to file:///android_asset/ on android. See open pull-request: https://github.com/apache/cordova-plugin-file/pull/84

**Set start page**
Add ```<content src="updater.html"/>``` to your main config.xml, or design your own start updater page, like www/updater.html. I just use a splashscreen plugin.

### Setup config.json
Write a config.json to describe files to download and version. Put it in $SERVER_URL/config.json; (example http://mnillstone.com/config.json);

**Structure**

*don't forget to delete comment lines, must be valid JSON*
```javascript
{
  "version": 1, //version, to see if an update is required. default - 0
  "start": "index.html", //start page of your app
  "files": [  // an array of new or different files to download
    "index.html", //example. all files will be downloaded from $SERVER_URL/$this_path
    "image/fon.png" //example
  ]
}
```

--------------------------------------------------------------------------------  
## Demo:
Just use http://mnillstone.com/ for $SERVER_URL; On first launch the app will download all files from my site, and only config.json at all other launches.

 --------------------------------------------------------------------------------  
## Tips  
1) If server config.json verison != local config.json version, the updater wipes the cache, copies all files from www folder to cache, downloads new files, and overrides config.json.

--------------------------------------------------------------------------------  

