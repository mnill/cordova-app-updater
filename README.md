# cordova-app-updater
=============================
With new version (0.9.0) there are many breaking changes.
=============================

> Simple plugin for hot update cordova app.  
> Forked from https://github.com/shawn0326/cordova-files-update

Tested on android and ios.


Concept:

If updater policy 'must be updated'(recommended):

1. on startup copy all files from www to PERSISTENT storage. (if not copied before);

2. download config.json from server.

3. compare the version constants in downloaded config.json and local config.json.

4. if different - download new files from server to PERSISTENT, then override local config.json.
(download not all files, only new\different which are written in config.json as new. I have a Grunt script that calculates a list of new files.)

5. redirect window.location.href to persistent storage + /$start_page.html;

Else if policy 'try update' - plugin will try to update and if there 'network error' just redirect to old version.

Or will not try to update, if policy 'cached', just redirect to cached (last updated in foreground). With this policy you need to call AppUpdater.update() manually while app is running.

dependency :
```bash
<dependency id="cordova-plugin-file" version=">=2.0.0" />
<dependency id="cordova-plugin-file-transfer" version=">=1.0.0" />
<dependency id="cordova-plugin-dialogs" version=">=1.0.0" />
<dependency id="cordova-plugin-appsettings" version=">=1.0.0" />
```

 --------------------------------------------------------------------------------  
## Installation:
### Setup Cordova:

```bash
  cordova plugin add https://github.com/mnill/cordova-app-updater.git
```

### Setup config.xml

* Set started page to updater.html. ```<content src="updater.html"/>```

* Set your server url. ```<preference name="UpdaterUrl" value="$SERVER_URL" />```
--- **Make sure to include the trailing slash in your url**

* Set updater policy ```<preference name="UpdaterPolicy" value="mustupdate" />``` enum = ['mustupdate', 'tryupdate', 'cached']. Default 'mustupdate'.

* Set splashscreen policy ```<preference name="UpdaterHideSplashScreen" value="false" />``` Hide splashscreen to display updating progress(only if you use splashscreen plugin). Default false.

* Set name of your app index page. ```<preference name="UpdaterRedirect" value="index.html" />``` Main page where updater will redirect the app after update. Default index.html.


### Setup config.json
Write a config.json to describe files to download and version. Put it in $SERVER_URL/config.json; (example http://mnillstone.com/config.json);

**Structure**

*don't forget to delete comment lines, must be valid JSON*
```javascript
{
  "version": 1, //version, to see if an update is required. default - 0
  "files": [  // an array of new or different files to download
    "index.html", //example. all files will be downloaded from $SERVER_URL/$this_path
    "image/fon.png" //example
  ]
}
```

### Updater policies


--------------------------------------------------------------------------------  
## Demo:
Just use http://mnillstone.com/ for $SERVER_URL; On first launch the app will download all files from my site, and only config.json at all other launches.

 --------------------------------------------------------------------------------  
## Tips  
1) If server config.json verison != local config.json version, the updater wipes the cache, copies all files from www folder to cache, downloads new files, and overrides config.json.

--------------------------------------------------------------------------------  
