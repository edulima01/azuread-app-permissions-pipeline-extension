const semver = require('semver');
const fs = require('fs');

const commands = require('yargs')
                    .option('set-version', {
                        alias: 'v',
                        description: 'The version to be bumped',
                        type: "string",
                        requiresArg: true,
                        demandOption: true
                    })
                    .option('release-type', {
                        alias: 'r',
                        description: 'The release type of the version: \'major\', \'minor\' or \'patch\' (default is \'patch\')',
                        requiresArg: true,
                        demandOption: false,
                        type: "string",
                        default: 'patch',
                        choices: ['major', 'minor', 'patch']
                    })
                    .option('destination', {
                        alias: 'd',
                        description: 'The destination file path (JSON) to be written to.',
                        requiresArg: true,
                        demandOption: false,
                        default: 'package.json',
                        type: "string"
                    })
                    .option('increment', {
                        alias: 'i',
                        description: 'Wether to increment the given version.',
                        requiresArg: false,
                        demandOption: false,
                        default: true,
                        type: "boolean"
                    })
                    .option('json-path', {
                        alias: 'p',
                        description: 'The json property path to be written to (does not support array properties, only direct dot navigation). If --set-separated is specified, then this property accepts an array of properties to update Major, Minor and Patch properties, in order.',
                        requiresArg: true,
                        demandOption: false,
                        default: 'version',
                        type: "array"
                    })
                    .option('set-separated', {
                        alias: 's',
                        description: 'Wether to set version to three different properties.',
                        requiresArg: false,
                        demandOption: false,
                        default: false,
                        type: "boolean"
                    }).argv;


let currentVersion = commands["set-version"];

const destinationPath = commands.destination;
if (!fs.existsSync(destinationPath)) {
    throw new Error("Destination doesn't exist!");
}
const importedFile = JSON.parse(fs.readFileSync(destinationPath));

if (commands.increment) {
    currentVersion = semver.inc(currentVersion, commands["release-type"]);
}

if (commands["set-separated"]) {
    const major = semver.major(currentVersion);
    const minor = semver.minor(currentVersion);
    const patch = semver.patch(currentVersion);

    if (!commands["json-path"].length || commands["json-path"].length != 3) {
        throw new Error("Was told to set separate values to version (-s), but we couldn't file three json paths to set.");
    }
    for(let index = 0; index < commands["json-path"].length; index++) {
        const valueToSet = index == 0 ? major : index == 1 ? minor : patch;
        setPath(commands["json-path"][index], valueToSet, importedFile);
    }
}
else {
    const safePath = commands["json-path"];
    setPath(safePath, currentVersion, importedFile);
}

fs.writeFileSync(destinationPath, JSON.stringify(importedFile, null, 2));

function setPath(path, valueToSet, lastPath) {
    let indexOfDot = path.indexOf('.');
    if (indexOfDot == 0) {
        if (path.length == 1) {
            throw new Error("json-path ended with a dot!");
        }
        path = path.substring(1);
    }
    if (indexOfDot == path.length - 1) {
        if (path.length == 1) {
            throw new Error("json-path ended with a dot!");
        }
        path = path.substring(0, path.length - 1);
    }
    indexOfDot = path.indexOf('.');
    if (indexOfDot > -1) {
        const nextPath = path.substring(0, indexOfDot);
        setPath(path.substring(indexOfDot + 1), valueToSet, lastPath[nextPath]);
        return;
    }
    lastPath[path] = valueToSet;
    return;
}