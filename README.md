# cordova-app-updater
=============================
> Simple plugin for hot update cordova app.

Tested on android and ios.


Concept:  
1) on startup copy all files from www to PERSISTENT storage. (if not be copy before);  
2) download config.json from server.  
3) check the version constants in downloaded config.json and local config.json.  
4) if different - download new files from server to PERSISTENT, then override config.json.  
(download not all files, only new\different which are written in config.json as new. I have Grunt script for calculate a list of new files.)  
5) redirect window.location.href to persistent storage + /$start_page.html;

**Attention:**
Current version required establish internet connection on app startup;  
  
  
 --------------------------------------------------------------------------------  
## Installation:
  ### Setup Cordova:

```bash
  cordova plugin add https://github.com/mnill/cordova-plugin-file.git
  cordova plugin add org.apache.cordova.file-transfer
  cordova plugin add org.apache.cordova.dialogs
  cordova plugin add https://github.com/mnill/cordova-app-updater.git --variable SERVER_ADDRESS="$SERVER_URL"
```
Replace $SERVER_URL with your server url, where your config.json and files for update. (example http://mnillstone.com/)

**Attention:**  
You must use my fork of cordova-plugin-file (https://github.com/mnill/cordova-plugin-file.git). Make sure your delete official plugin file before installation(if it's been installed before).   
It's because official plugin does not support readonly access to file:///android_asset/ on android. Open pull-request: https://github.com/apache/cordova-plugin-file/pull/84

** Set start page **  
Add <content src="updater.html"/> to your main config.xml, or design your own start updater page, like www/updater.html. I'm just use splashscreen plugin.
  
### Setup config.json
Write a config.json to describe files to download and version. Put it in $SERVER_URL/config.json; (example http://mnillstone.com/config.json);

**Structure**

*don't forget to delete comment lines, must be valide json*
```javascript
{
  "version": 1, //version, for check is update are required. default - 0
  "start": "index.html", //start page of you app
  "files": [  // these list of new or differents files to download
    "index.html", //example. all files will be download from $SERVER_URL + this path.
    "image/fon.png" //example
  ],
}
```
 
--------------------------------------------------------------------------------  
## Demo:
Just user http://mnillstone.com/ for $SERVER_URL; On first launch app will download all files from my site, and only config.json at all other launches.  

 --------------------------------------------------------------------------------  
## Tips  
1) If downloaded config.json verison is not equal to local config.json, updater just clean all cache, copy all files from www folder to cache, then download new files, then override config.json  

--------------------------------------------------------------------------------  
  
  
*Yes my english is fully ugly*  