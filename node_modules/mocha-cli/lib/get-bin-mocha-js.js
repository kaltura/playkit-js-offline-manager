/**
 * @author Gavin Mogan
 * @copyright 2016 Gavin Mogan. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var fs = require("fs");
var path = require("path");
var debug = require("debug")("mocha-cli");

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Checks whether or not the file which is at given path exists.
 *
 * @param {string} filePath - A file path to check.
 * @returns {boolean} `true` if the file which is at given path exists.
 */
function exists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    }
    catch (err) {
        return false;
    }
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

/**
 * Finds and tries executing "./bin/mocha.js".
 *
 * This is useful to Mocha contributors.
 * Mocha's repository has "./bin/mocha.js".
 *
 * @param {string} basedir - A path of the directory that it starts searching.
 * @returns {string|null} The path of "./bin/mocha.js"
 */
module.exports = function getBinMochaJs(basedir) {
    var dir = basedir;
    var prevDir = dir;
    do {
        var binPath = path.join(dir, "mocha");
        if (exists(binPath)) {
            debug("FOUND", binPath);
            return binPath;
        }
        debug("NOT FOUND", binPath);

        // Finish if package.json is found.
        if (exists(path.join(dir, "package.json"))) {
            break;
        }

        // Go to next.
        prevDir = dir;
        dir = path.resolve(dir, "..");
    }
    while (dir !== prevDir);

    debug("NOT FOUND", "\"./bin/mocha.js\"");
    return null;
};
