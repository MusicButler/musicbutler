var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    cp = require('child_process'),
    spawn = cp.spawn,
    exec = cp.exec;

/**
 * Utils function
 */
function isDir (path_string) {
    return fs.lstatSync(path_string).isDirectory();
}

function existsOrCreate(toCheck, dir) {
    dir = dir || false;
    if (!fs.existsSync(toCheck)) {
        if (!dir) {
            fs.writeFileSync(path.join(toCheck, ""));
        } else {
            fs.mkdirSync(toCheck);
        }
        return false;
    }
    return true;
}


function AssistantLoader (butler) {
    this.butler = butler;
    this.HOME = process.env["HOME"],
    this.MB_HOME = process.env["MB_HOME"] || path.join(this.HOME, ".musicbutler");
    this.ASS_LOC =  path.join(this.MB_HOME, "assistants"),
    this.ASS_FILE = path.join(this.ASS_LOC, "assistants.json"),
    this.LOCAL_ASS = path.join(process.cwd(), "assistants");

    this.defaultJSON = {
        default: ['fileparser', 'urlparser'],
        user: []
    };
}

AssistantLoader.prototype.init  = function () {
    existsOrCreate(this.MB_HOME, true);
    existsOrCreate(this.ASS_LOC, true);
    if (!fs.existsSync(this.ASS_FILE)) {
        fs.writeFileSync(this.ASS_FILE, JSON.stringify(this.defaultJSON));
    }
}

AssistantLoader.prototype.hireAssistants = function(callback) {
    // Get the assistants list from the conf file
    var conf = require(this.ASS_FILE),
        defaults = conf.default,
        user = conf.user;

    // Hire in serie all the default assistants
    var defaultFunc = async.eachSeries.bind(null, defaults, this.hireAssistant.bind(this, this.LOCAL_ASS));
    // Hire in serie all the user assistants
    var userFunc = async.eachSeries.bind(null, user, this.hireAssistant.bind(this, this.ASS_LOC));

    // Hire the default, then the user assistants
    async.series([defaultFunc, userFunc], callback);
};

AssistantLoader.prototype.hireAssistant = function (location, assistant, callback) {
    // Check if the folder exists
    if (fs.existsSync(path.join(location, assistant))) {
        try {
            // Load the package.json
            var pkg = require(path.join(location, assistant, 'package.json'));
        }catch (err) {
            console.log("Assistant " + assistant + " is not ready to work, he is missing his package.");
            return callback("Counld not load " + assistant, null);
        }
        // Load the module
        require(path.join(location, assistant, pkg.main))(this.butler, (function (info) {
            if(pkg.message) console.log(pkg.message);
            console.log(pkg.name + " ready to work");
            callback(null, pkg.name + " loaded");
        }).bind(this));
    } else {
        return callback("Counld not load " + assistant, null);
    }
}

AssistantLoader.prototype.updateConf = function (updater) {
    var conf = require(this.ASS_FILE);
    updater(conf);
    fs.writeFileSync(this.ASS_FILE, JSON.stringify(conf));
}

AssistantLoader.prototype.enable = function (assistant) {
    this.updateConf(function (conf) {
        conf.user.push(assistant);
    });
}

AssistantLoader.prototype.disable = function (assistant) {
    this.updateConf(function (conf) {
        var id = conf.user.indexOf(assistant);
        if (id !== -1) {
            conf.user.splice(id, 1);
        }
    });
}

AssistantLoader.prototype.add = function (assistant, callback) {
    callback = callback || function () {};
    var npm = spawn("npm", ['install', assistant, "--prefix", this.ASS_LOC]);
    npm.stdout.pipe(process.stdout);
    npm.on('exit', (function () {
        this.enable(assistant);
        callback(assistant);
    }).bind(this));
}

AssistantLoader.prototype.remove = function (assistant, callback) {
    callback = callback || function () {};
    var npm = spawn("npm", ['uninstall', assistant, "--prefix", this.ASS_LOC]);
    npm.stdout.pipe(process.stdout);
    npm.on('exit', (function () {
        this.disable(assistant);
        callback(assistant);
    }).bind(this));
}

AssistantLoader.prototype.list = function () {
    var conf = require(this.ASS_FILE);
    console.log("Default:");
    console.log(conf.default.join("\n"));
    console.log("User:");
    console.log(conf.user.join("\n"));
}

module.exports = AssistantLoader;
