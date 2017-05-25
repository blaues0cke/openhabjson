//
const fs = require('fs');

const internalTypes = {
    buttons:  'buttons',
    switches: 'switches'
};

const openHabTypes = {
    switch: 'Switch'
};

const routineTypes = {
    callScript:         'callScript',
    sendCommand:        'sendCommand',
    sendHttpGetRequest: 'sendHttpGetRequest',
    wait:               'wait',
};

// Constants
const tags = {
    switchable: 'Switchable'
};

// Variables
var outputBuilder = {
    actions:  {},
    items:    [],
    readme:   [],
    rules:    [],
    sitemaps: {
        debug: []
    }
};

function addAction (name, body) {
    outputBuilder.actions[name] = body;
}

function addDebugSitemap (line) {
    outputBuilder['sitemaps'].debug.push(line);
}

function addItem (line) {
    outputBuilder['items'].push(line);
}

function addReadme (line) {
    outputBuilder['readme'].push(line);
}

function addRule (line) {
    outputBuilder['rules'].push(line);
}

function addRuleForItem (itemType, item) {
    var bodyBuilder = [];

    bodyBuilder.push('rule "' + item.id + '"');
    bodyBuilder.push('when');
    bodyBuilder.push('    Item ' + item.id + ' changed to ON');
    bodyBuilder.push('then');

    if (itemType === internalTypes.buttons) {
        bodyBuilder.push('    postUpdate(' + item.id + ', OFF);');
    }

    item.actions.forEach(function (action) {
        bodyBuilder.push('    callScript("' + action + '")');
    });

    bodyBuilder.push('end');

    var body = bodyBuilder.join('\n');

    addRule(body);
}

function applyParameters (string, configuration) {
    Object.keys(configuration.parameters).forEach(function (parameterName) {
        const value = configuration.parameters[parameterName];
        const regex = new RegExp('\\$' + parameterName + '\\$', 'g');

        string = string.replace(regex, value);
    });

    return string;
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

function generateDebugSitemap (configuration) {
    outputBuilder.sitemaps.debug = [].concat(
        'sitemap debug label="Debug" {',
        '    Frame label="Debug" {',
        outputBuilder.sitemaps.debug,
        '    }',
        '}'
    ).join('\n');
}

function generateItemFile (configuration) {
    Object.keys(configuration.items).forEach(function (itemType) {
        const items = configuration.items[itemType];

        items.forEach(function (item) {
            finishObject(itemType, item);
            addItem(getItemString(itemType, item));
            addRuleForItem(itemType, item);
            addDebugSitemap(getItemSitemapString(itemType, item));
        });
    });
}

function generateReadme (configuration) {
    addReadme('# Smarthome commands');
    addReadme('---');

    Object.keys(configuration.items).forEach(function (itemType) {
        const items = configuration.items[itemType];

        items.forEach(function (item) {

            if (item.alexa) {

                if (itemType === internalTypes.buttons) {
                    addReadme('* Alexa, "' + item.name + '" an');
                } else if (itemType === internalTypes.switches) {
                    addReadme('* Alexa, "' + item.name + '" an');
                    addReadme('* Alexa, "' + item.name + '" aus');
                }
            }
        });
    });
}

function generateScriptFiles (configuration) {
    Object.keys(configuration.actions).forEach(function (actionType) {
        const actions = configuration.actions[actionType];

        actions.forEach(function (action) {
            addAction(action.id, getActionBody(actionType, action));

        });
    });
}

function getActionBody (actionType, action) {
    if (actionType === 'simple') {
        const sleep = 'Thread::sleep(50);';
        var bodyBuilder = [];

        bodyBuilder.push('logWarn("script", "' + action.id + '");');
        bodyBuilder.push('');

        action.routine.forEach(function (routine) {
            if (routine.type === routineTypes.callScript) {
                bodyBuilder.push('callScript("' + routine.id + '");');
                bodyBuilder.push(sleep);
                bodyBuilder.push('');
            } else if (routine.type === routineTypes.sendHttpGetRequest) {
                bodyBuilder.push('sendHttpGetRequest("' + routine.url + '");');
                bodyBuilder.push(sleep);
                bodyBuilder.push('');
            } else if (routine.type === routineTypes.sendCommand) {
                if (routine.items) {
                    for (var key in routine.items) {
                        var item = routine.items[key];

                        bodyBuilder.push('sendCommand(' + item + ', ' + routine.value + ');');
                        bodyBuilder.push(sleep);
                        bodyBuilder.push('');
                    }
                } else {
                    bodyBuilder.push('sendCommand(' + routine.item + ', ' + routine.value + ');');
                    bodyBuilder.push(sleep);
                    bodyBuilder.push('');
                }
            } else if (routine.type === routineTypes.wait) {
                bodyBuilder.push('Thread::sleep(' + routine.ms + ');');
                bodyBuilder.push('');
            }
        });

        return bodyBuilder.join('\n');
    }

    return '';
}

function getAlexaTypeForItemType (itemType) {
    if (itemType === internalTypes.buttons) {
        return tags.switchable;
    } else if (itemType === internalTypes.switches) {
        return tags.switchable;
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

function getItemSitemapString (itemType, item) {
    var stringBuilder = [];

    // Type
    stringBuilder.push(getItemTypeString(itemType));

    // ID
    stringBuilder.push('item=' + item.id);

    // Label
    stringBuilder.push('label="' + item.name + '"');

    return '        ' + stringBuilder.join(' ');
}

function getItemTypeString (itemType) {
    if (itemType === internalTypes.buttons) {
        return openHabTypes.switch;
    } else if (itemType === internalTypes.switches) {
        return openHabTypes.switch;
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

function writeFile (filePath, content, configuration) {
    fs.writeFile(filePath, applyParameters(content, configuration), function (error) {
        if (error) {
            console.error('Oh no, something went wrong.');
        }
    });
}

function writeFiles (configuration) {

    const itemContent = outputBuilder.items.join('\n');
    writeFile('export/items/openhabjson.items', itemContent, configuration);

    const rulesContent = outputBuilder.rules.join('\n\n');
    writeFile('export/rules/openhabjson.rules', rulesContent, configuration);

    Object.keys(outputBuilder.actions).forEach(function (actionName) {
        const body = outputBuilder.actions[actionName];

        writeFile('export/scripts/' + actionName + '.script', body, configuration);
    });

    Object.keys(outputBuilder.sitemaps).forEach(function (sitemapName) {
        const body = outputBuilder.sitemaps[sitemapName];

        writeFile('export/sitemaps/' + sitemapName + '.sitemap', body, configuration);
    });

    const readmeContent = outputBuilder.readme.join('\n');
    writeFile('export/README.md', readmeContent, configuration);

}

if (checkForDataFilePath()) {
    const configuration = readDataToObject(process.argv[2]);

    if (configuration) {
        generateScriptFiles(configuration);
        generateItemFile(configuration);
        generateDebugSitemap(configuration);
        generateReadme(configuration);

        writeFiles(configuration);

        console.log(outputBuilder);
    }
}