//
const fs = require('fs');

// Variables
var outputBuilder = {
    items: ''
};

function addItem (line) {
    addOutput(line);
}

function addOutput (target, line) {
    outputBuilder[target].push(line);
}

function checkForDataFilePath () {
    if (process.argv && process.argv[2]) {
        console.error('Checking configuration: ' + process.argv[2]);

        if (fs.existsSync(process.argv[2])) {
            return true;
        } else {
            console.error('Configuration not found: ' + process.argv[2]);
        }
    } else {
        console.error('Configuration file path not set');
    }

    return false;
}

function readDataToObject (filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    try {
        return JSON.parse(content);
    }
    catch (exception) {
        console.error('JSON parsing failed.');
    }
}

if (checkForDataFilePath()) {
    const configuration = readDataToObject(process.argv[2]);

    Object.keys(configuration.items).forEach(function (itemType) {
        const items = configuration.items[itemType];

        items.forEach(function (item) {
            console.log(item);
        });
    });
}