# openhabjson

A json format to generate fully preconfigured OpenHAB configuration files.

## Motivation

I found it uncomfortable to copy and paste all my code and configuration over and over again. So I
switched spending my time to my OpenHAB configuration to write this little parser that generates a fully
functional OpenHAB configuration based on a single json file with as less redundancy as possible.

## Features

* Generates `.items` files
* Generates `.rules` files
* Generates `.script` files
* Generates `.sitemap` files
* Variable support
* Generates a readme containing all possible alexa commands

## Usage

Just create a configuration `.json` and store it somewhere. You can find some examples in the `test-data` folder.
Actually my personal OpenHAB configuration is in there.

To generate the configuration, just call:

    node index.js path/to/your.json
    
You can find the generated configuration in the `export` folder. Also you can use `nodemon` to generate a new
configuration whenever your `json` file changes (requires that your configuration file is also in the `test-data` folder):

    nodemon index.js path/to/your.json