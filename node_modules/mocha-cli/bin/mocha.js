#!/usr/bin/env node

/**
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var path = require("path");
var debug = require("debug")("mocha-cli");
var resolve = require("resolve").sync;

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Finds and tries executing a local mocha module.
 *
 * @param {string} basedir - A path of the directory that it starts searching.
 * @returns {string|null} The path of a local mocha module.
 */
function getLocalMocha(basedir) {
    var indexPath = null;
    try {
        indexPath = resolve("mocha", {basedir: basedir});
    }
    catch (err) {
        debug("NOT FOUND", "\"mocha\"");
        return null;
    }

    var binPath = path.resolve(path.dirname(indexPath), "bin", "mocha");
    debug("FOUND", binPath);
    return binPath;
}

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------
/* mocha-disable no-process, no-console */

var cwd = process.cwd();

debug("START", process.argv);
debug("ROOT", cwd);

var binPath = getLocalMocha(cwd) || require("../lib/get-bin-mocha-js")(cwd);
if (binPath != null) {
    require(binPath);
}
else {
    console.error(require("chalk").red.bold(
        "Cannot find local Mocha!\n" +
        "Please install Mocha by `npm install mocha --save-dev`.\n"
    ));
    process.exit(1);
}
