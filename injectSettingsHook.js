/**
 * Created by Mnill on 07.03.15.
 */

// This plugin replaces server address in a updater.html with the variable from package.json.

var wwwFileToReplace = "updater.html";

var fs = require('fs');
var path = require('path');


function replace_string_in_file(filename, to_replace, replace_with) {
    var data = fs.readFileSync(filename, 'utf8');
    var result = data.replace(to_replace, replace_with);
    fs.writeFileSync(filename, result, 'utf8');
}

module.exports = function(ctx) {
    var packageJSON = require(path.join(ctx.cordova.findProjectRoot(), '/package.json'));
    var server_adress;

    for (var i=0; i<packageJSON.cordovaPlugins.length; i++){
        if (packageJSON.cordovaPlugins[i].id == 'com.likesmagia.cordova.updater' && packageJSON.cordovaPlugins[i].variables && packageJSON.cordovaPlugins[i].variables.SERVER_ADDRESS){
            server_adress = packageJSON.cordovaPlugins[i].variables.SERVER_ADDRESS;
            break;
        }
    }
    if (!server_adress)
        throw new Error('App update could not find server_adress');

    ctx.opts.platforms.forEach(function(platform){
        var wwwPath = "";
        switch(platform) {
            case "ios":
                wwwPath = "platforms/ios/www/";
                break;
            case "android":
                wwwPath = "platforms/android/assets/www/";
                break;
            default:
                console.log("App updater", "Unknown build platform: " + platform);
        }
        var fullfilename = path.join(ctx.cordova.findProjectRoot(), wwwPath + wwwFileToReplace);
        if (fs.existsSync(fullfilename)) {
            replace_string_in_file(fullfilename, "$SERVER_ADDRESS", server_adress);
            console.log("Replaced server_adress in file: " + fullfilename);
        } else {
            throw new Error('Updater.html not exist for platform ' + platform);
        }
    })
};