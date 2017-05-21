//
const fs = require('fs');

// Variables
var outputBuilder = {
    actions: {},
    items:   []
};

function addAction (name, body) {
    outputBuilder.actions[name] = body;
}

function addItem (line) {
    outputBuilder['items'].push(line);
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

function cleanObject (item) {
    item.group = item.group.toLowerCase();
    item.nameInternal = item.name.toLowerCase().replace(/ /g, '_');
}

function finishObject (itemType, item) {
    cleanObject(item);

    item.id = 'item_' + item.group + '_' + item.nameInternal;
    item.tags = [];

    if (item.alexa) {
        item.tags.push(getAlexaTypeForItemType(itemType));
    }
}

function generateItemFile (configuration) {
    Object.keys(configuration.items).forEach(function (itemType) {
        const items = configuration.items[itemType];

        items.forEach(function (item) {
            finishObject(itemType, item);
            addItem(getItemString(itemType, item));

        });
    });
}

function generateRulesFile (configuration) {

    Object.keys(configuration.actions).forEach(function (actionType) {
        const actions = configuration.actions[actionType];

        actions.forEach(function (action) {
            addAction(action.id, getActionBody(actionType, action));

        });
    });
}

function getActionBody (actionType, action) {
    if (actionType === 'simple') {
        var bodyBuilder = [];

        bodyBuilder.push('logWarn("script", "' + action.id + '");');
        bodyBuilder.push('');

        action.routine.forEach(function (routine) {
            if (routine.type === 'callScript') {
                bodyBuilder.push('callScript("' + routine.id + '");')
            } else if (routine.type === 'sendHttpGetRequest') {
                bodyBuilder.push('sendHttpGetRequest("' + routine.url + '");')
            }
        });

        return bodyBuilder.join('\n');
    }

    return '';
}

function getAlexaTypeForItemType (itemType) {
    if (itemType === 'buttons') {
        return 'Switchable';
    } else if (itemType === 'switches') {
        return 'Switchable';
    }

    return 'Error';
}

function getItemString (itemType, item) {
    var stringBuilder = [];

    // Type
    stringBuilder.push(getItemTypeString(itemType));

    // ID
    stringBuilder.push(item.id);

    // Name
    stringBuilder.push('"' + item.name + '"');

    // TODO: groups

    // Tags
    if (item.tags.length > 0) {
        stringBuilder.push('["' + item.tags.join('", "') + '"]');
    }

    return stringBuilder.join(' ');
}

function getItemTypeString (itemType) {
    if (itemType === 'buttons') {
        return 'Switch';
    } else if (itemType === 'switches') {
        return 'Switch';
    }

    return 'Error';
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

    generateRulesFile(configuration);
    generateItemFile(configuration);

    // TODO: write scripts (with button toggle and log warn)
    // TOOD: parameter
    // TODO: untergruppen bei actions

    console.log(outputBuilder);
}