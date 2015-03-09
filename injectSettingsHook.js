/**
 * Created by Mnill on 07.03.15.
 */

module.exports = function(ctx) {
    var server;
    var fs = require('fs');
    var path = require('path');

    //This is realy poor
    process.argv.forEach(function(arg){
        if (arg.split('SERVER_ADDRESS=').length == 2)
            server = arg.split('SERVER_ADDRESS=')[1];
    });
    if (!server)
        throw new Error('Wrong server_adress');

    function replace_string_in_file(filename, to_replace, replace_with) {
        var data = fs.readFileSync(filename, 'utf8');

        var result = data.replace(to_replace, replace_with);
        fs.writeFileSync(filename, result, 'utf8');
    }

    var updaterhtml = path.join(__dirname, "www/updater.html");
    if (!fs.existsSync(updaterhtml))
        throw new Error(updaterhtml + ' do not exist!');

    replace_string_in_file(updaterhtml, '$SERVER_URL', server)
};
