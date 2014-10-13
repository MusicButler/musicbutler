var Butler = require('./butler');
var AssistantLoader = require('./assistants');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');

var ass = new AssistantLoader();

var HOME = process.env["HOME"];
var MB_HOME = process.env["MB_HOME"] || path.join(HOME, ".musicbutler");
var PID_FILE = path.join(MB_HOME, "mb.pid");
var LOG_FILE = path.join(MB_HOME, "mb.log");

function parseArgs() {
    var args = process.argv,
        options = [],
        originals = [];
    for (var i in args) {
        if (args[i].substring(0,2) === "--") {
            options.push(args[i]);
        } else {
            originals.push(args[i]);
        }
    }
    if (originals.length > 2) {
        switch(originals[2]) {
            case "start": {
                start(options.indexOf('--force') !== -1);
                break;
            }
            case "stop": {
                stop();
                break;
            }
            case "restart": {
                restart(options.indexOf('--force') !== -1);
                break;
            }
            case "assistant": {
                originals.splice(0, 3);
                manageAssistants(originals);
                break;
            }
            default: {
                break;
            }
        }
    }
}

function manageAssistants (args) {
    if (args.length) {
        switch (args[0]) {
            case "list": {
                ass.list();
                break;
            }
            case "enable": {
                goDeeper(args);
                ass.enable(args[0]);
                break;
            }
            case "disable": {
                goDeeper(args);
                ass.disable(args[0]);
                break;
            }
            case "install": {
                goDeeper(args);
                ass.add(args[0], function (name) {
                    console.log(name + " installed");
                    console.log("You can now enable it with: musicbutler assistant enable "+name);
                });
                break;
            }
            case "remove": {
                goDeeper(args);
                ass.remove(args[0], function (name) {
                    console.log(name + " removed");
                });
                break;
            }
            default: {
                break;
            }
        }
    } else {
        ass.list();
    }
}

function goDeeper (args) {
    var cmd = args[0];
    args.splice(0,1);
    if (args.length) {
        return args;
    } else {
        console.log("Missing argument after "+cmd);
        process.exit();
    }
}

function deletePidFile () {
    fs.unlinkSync(PID_FILE);
}

function start(force) {
    if (fs.existsSync(PID_FILE)) {
        console.log("Could not start: pid file exists");
        if (!force) {
            return;
        } else {
            console.log("Force start: deleting pid file...");
            deletePidFile();
        }
    }
    var out = fs.openSync(path.join(MB_HOME, "mb.log"), 'a');
    var app = spawn("node", [path.join(__dirname, "../app.js")], {detached: true, stdio: ['ignore', out]});
    fs.writeFileSync(path.join(MB_HOME, "mb.pid"), app.pid);
    app.unref();
    console.log("Music Butler started");
    process.exit();
}

function stop(callback) {
    callback = callback || function (){};
    fs.readFile(path.join(MB_HOME, "mb.pid"), "utf8", function (err, pid) {
        if (fs.existsSync(PID_FILE)) {
            exec("kill -2 "+pid, function (err, stdout, stdin) {
                deletePidFile();
                callback();
            });
        } else {
            console.log("Could not stop Music Butler, pid file missing");
            callback();
        }
    });
}

function restart(force) {
    stop(start.bind(null, force));
}

module.exports = {
    client: parseArgs
};
