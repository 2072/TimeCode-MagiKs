/**
 * @OnlyCurrentDoc
 */


/**
 * TimeCode-Magiks - functions to manipulate timecodes and EDLs
 * Copyright © 2015-2019 John Wellesz
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

/*
 * Coding conventions:
 * - Constants:
 *  - They shall begin by:
 *      - 'C_' if global to file
 *      - 'c_' if local to a closure
 *  - The second character followed by another '_' should represent their type:
 *      - 'i_' for "integer"
 *      - 's_' for string
 *      - 'r_' for regex
 *      - 'f_' for float
 *  - Are written in uppercase with words separated by '_'
 */


/*jshint esversion: 6 */
/* jshint -W097 */
"use strict";

var TCM_VERSION = "v1.1.12dev"; // can't be a const because of GAS strange limitation...

// compat layer with NodeJS
var Utilities = typeof Utilities === "undefined" ? {} : Utilities;

/**
 * Create Custom errors
 */
function E_InvalidFPS(message) {
  this.name = 'E_InvalidFPS';
  this.message = message || 'Invalid FPS';
  //this.stack = (new Error()).stack;
}
E_InvalidFPS.prototype = Object.create(Error.prototype);
E_InvalidFPS.prototype.constructor = E_InvalidFPS;

function E_InvalidTimeCode(message) {
  this.name = 'E_InvalidTimeCode';
  this.message = message || 'Invalid Timecode';
}
E_InvalidTimeCode.prototype = Object.create(Error.prototype);
E_InvalidTimeCode.prototype.constructor = E_InvalidTimeCode;

function E_InvalidEDL(message) {
  this.name = 'E_InvalidEDL';
  this.message = message || 'Invalid EDL';
}
E_InvalidEDL.prototype = Object.create(Error.prototype);
E_InvalidEDL.prototype.constructor = E_InvalidEDL;

function E_NotFoundInEDL(message) {
  this.name = 'E_NotFoundInEDL';
  this.message = message || 'element not found in EDL';
}
E_NotFoundInEDL.prototype = Object.create(Error.prototype);
E_NotFoundInEDL.prototype.constructor = E_NotFoundInEDL;

function E_IntegerExpected(message) {
  this.name = 'E_IntegerExpected';
  this.message = message || 'Integer expected';
}
E_IntegerExpected.prototype = Object.create(Error.prototype);
E_IntegerExpected.prototype.constructor = E_IntegerExpected;

function E_NotImplemented(message) {
  this.name = 'E_NotImplemented';
  this.message = message || 'requested feature not implemented';
}
E_IntegerExpected.prototype = Object.create(Error.prototype);
E_IntegerExpected.prototype.constructor = E_NotImplemented;


function shortenWrongString(v) {
    if (typeof v !== 'string')
        return v;
    else if (v.length > 12)
        return v.substring(0,5) + ' [...] ' + v.substring(v.length - 5,v.length);
    else
        return v;
}

/**
 * (private)check if value is an integer
 */
function isInt_(v) {
    return typeof v === 'number' && (v % 1) === 0;
}

/**
 * (private)check if input is a multiline string
 */
function isInputMultiline_(input) {
    return typeof input === 'string' && input.indexOf('\n') !== -1;
}

/**
 * (private) Throws an error if FPS is invalid
 *
 */
function checkFPS_(fps, allowFrac) {
    if (typeof fps !== 'number')
        throw new E_InvalidFPS('fps must be an integer (' + shortenWrongString(fps) + ') given; ' + typeof fps );

    if (!isInt_(fps) && allowFrac !== true)
        throw new E_InvalidFPS('fractional fps are not supported yet! (' + fps + ') given');

    if (fps <= 0)
        throw new E_InvalidFPS('fps must be > 0 (' + fps + ') given');
}

/**
 * (private) Throws an E_IntegerExpected if v is not an integer
 *
 */
function checkInteger_(v) {
    if (!isInt_(v))
        throw new E_IntegerExpected("Integer expected: '" + shortenWrongString(v) + "' of type '" + typeof v + "' given");

}

/**
 * (private) Throws an error if TC is invalid
 *
 */
var checkTC_ = (function () {
    var validTC = /^((?:[0-9]{1,2}:){0,3}[0-9]{1,2})(?:\s.*)?$/m;

    return function (timeCode, clean) {
        if (typeof timeCode !== 'string')
            throw new E_InvalidTimeCode('timeCode must be a string. (' + timeCode + ') given');
        else if (!validTC.test(timeCode))
            throw new E_InvalidTimeCode('"'+shortenWrongString(timeCode)+'" does not seem to be a valid TC.');

        if (clean === true)
            return timeCode.match(validTC)[1];
    };
})();

/**
 * (private) Parse an integer from a string and return it if nothing was lost
 * in translation else, fail
 *
 */
function parseIntOrFail_(v) {
    const parsed = parseInt(v, 10);

    if (parsed.toString() !== v)
        throw new E_IntegerExpected("Integer expected: '" + shortenWrongString(v) + "' given");

    return parsed;
}

function round2_(v) {
    return Math.round((v + 0.000001) * 100) / 100;
}

// The two following functions could be used everywhere if this version of
// javascript supported the rest/spread operators but for now their use is
// limited because I don't want to lose the functional style by using the
// argument object...

/**
 * (private) assume stringArg1 is a multiline and map f on it while optionaly
 * converting each line to an integer and keeping exceptions as strings and
 * finally join everything back to a multiline string.
 *
 */
function recurseOnMultiline_(f, stringArg1, fps, doParseInt) {
    return stringArg1.split('\n').map(keepError_(function (arg1) {
        // Do not try to work on kept errors
        // no FPS and no TC can begin by E so that's OK for now
        if (arg1[0] !== 'E') {
            if (!doParseInt || arg1 === "")
                return f(arg1, fps);
            else
                return f(parseIntOrFail_(arg1), fps);
        } else
            return arg1;
    })).join('\n');
}
function recurseOnMultiline3_(f, stringArg1, intArg2, arg3, doParseInt) {
    return stringArg1.split('\n').map(keepError_(function (arg1) {
        if (arg1[0] !== 'E') {
            if (!doParseInt || arg1 === "")
                return f(arg1, intArg2, arg3);
            else
                return f(parseIntOrFail_(arg1), intArg2, arg3);
        } else
            return arg1;
    })).join('\n');
}

/**
 * (private) assume arrayArg1 is an array ans map f on it while keeping
 * exceptions as strings
 *
 */
function recurseOnArray_(f, arrayArg1, fps) {
    return arrayArg1.map(keepError_(function (arg1) {
        return f(arg1, fps);
    }));
}


/**
 * EDL utilities
 *
 */
var EDLUtils_ = (function () {
    var my = {};
    my.regex = [];
    const c_i_EVENTN = 0, c_i_SOURCE = 1, c_i_TRACK = 2, c_i_EVENTT = 3, c_i_SRCIN = 4, c_i_SRCOUT = 5, c_i_RECIN = 6, c_i_RECOUT = 7, c_i_M2SPEED = 8;

    const c_r_HEADER      = /(^\w+:)\s*(.*$)/;
    const c_r_STANDARD    = /\s+/;
    const c_r_RESOLVE_MARKER_ENTRY =
       /(\d+\s+?\d+\s+?V\s+?C\s+?\d\d:\d\d:\d\d:\d\d \d\d:\d\d:\d\d:\d\d \d\d:\d\d:\d\d:\d\d \d\d:\d\d:\d\d:\d\d\s+?)([\s\S]+?\|C:\S+? \|M:.*? \|D:\d+?\s+?)/g;
    const c_r_RESOLVE_MARKERS = /^([\s\S]*?)\|C:(\S+?) \|M:(.*?) \|D:(\d+)/g;
    const c_r_COMMENTS1   = /^(\*)\s*(.*:)\s+(.*)/;
    const c_r_COMMENTS2   = /^(\*)\s*(.*)\s*/;
    const c_r_LINES       = /\r\n|\n\r|[\n\r]/;
    // pff string.repeat is not availabe in GAS - that's 128 spaces
    const c_s_MAX_SPACE_PAD = "                "+"                "+"                "+"                "+
                              "                "+"                "+"                "+"                "+
                              "                "+"                "+"                "+"                "+
                              "                "+"                "+"                "+"                ";

    function getEDLbuilder (title, fps) {

        if (typeof title !== 'string')
            throw new E_InvalidEDL("Title must be a string. " + typeof title + " given");

        checkFPS_(fps);

        const c_r_SOURCEMATCH = /\(s: ([^)]+)\)/;

        return (function () {

            var my = {};
            var events = [];
            my.EDLSummary = [];
            my.warnings = false;

            function addEvent (eventN, source, track, type, srcIn, srcOut, recIn, recOut) {
                var edlEvent = [eventN, source, track, type, srcIn, srcOut, recIn, recOut];

                // make sure that known numbers are strings, let other things be for now
                 events[events.length] = edlEvent;
            }

            function importEvents(eventArray) {

                if (!(eventArray instanceof Array) || !(eventArray[0] instanceof Array))
                    throw new E_InvalidEDL("eventArray must be an Array of Arrays. " + typeof eventArray + " given");


                function extractData(givenData, eventN) {

                    if (!(givenData instanceof Array))
                        throw new E_InvalidEDL("givenData must be an Array. " + typeof givenData + " given");
                    // extrapolate data depending on row length

                    // 3 is when we have in, out and comment
                    // the source can be extracted if there is a source included in the TC
                    // such as TC created by our matchback API
                    if (givenData.length === 3) {

                        var srcIn, srcOut, source = "";

                        srcIn = checkTC_(givenData[0], true);

                        if ((source = givenData[0].match(c_r_SOURCEMATCH)) === null)
                            source = "MARK";
                        else
                            source = source[1];

                        // if an Out is provided use it else just add 1 to the In
                        if (givenData[1])
                            srcOut = checkTC_(givenData[1], true);
                        else
                            srcOut = TC_OFFSET(checkTC_(givenData[0], true), 1, fps);

                        // if there is a comment, make sure it's a string
                        if (givenData[2] && typeof givenData[2] !== "string")
                            givenData[2].toString();

                        // create the event
                        addEvent(eventN + "", source, "V", "C", srcIn, srcOut, srcIn, srcOut);
                        if (givenData[2])
                            events[events.length] = ['*', givenData[2]];

                    } else if (givenData.length === 8) {
                        events[events.length] = givenData
                    } else
                        throw new E_InvalidEDL("Please provide either a 3 by Y arrays with <srcIn, [srcOut], [Comment]> (ie: an EDL to use as markers) or a standard EDL range (8 by Y) ; "
                        + givenData.length + " columns array given on row " + eventN);

                }

                // filter and transform input
                eventArray.filter(function (row) {
                    return !!row[0]; // filter out empty lines
                }).forEach(function (row, i) {
                    // convert everything to strings and trim
                    extractData(row.map(function(column) {
                        if (typeof column === "string")
                            return column.trim();
                        else if (column || column === 0)
                            return column.toString().trim()
                        else if (column === undefined || column === false || column === null)
                            return "";
                    }), i);
                });

                if (!events.length)
                    throw new E_InvalidEDL("No event found!?!");

                return my;
            }

            my.importEvents = importEvents;


            function build(strictValidate) {

                /**
                 * pad a string on the right or on the left
                 * @param {String} padchars The characters to use to pad
                 * @param {String} str The string to be padded
                 * @param {Integer} length The length of the padding
                 * @param {Boolean} left True if padding on the left side
                 */
                function pad (padchars, str, length, left) {
                    if (left)
                        return (padchars + str).slice(-length);
                    else
                        return (str+padchars).slice(0, length);
                }

                var headers = events[0][0] !== "TITLE:" ? [
                    "TITLE:" + title,
                    "TIME_CODE_MODULUS:" + fps,
                    ""
                ] : [];

                // the required padding on the events of an EDL
                // only the event number needs padding with leading zeros
                var paddings    = [3, 0, 0, 0, 11, 11, 11, 11];
                // In EDLS data columns are pepended by a certain amount of spaces
                var prePaddings = [0, 2, 2, 2, 8,   1,  1,  1].map(function (padLength, i) {

                    if (padLength === 0)
                        return "";
                    else
                        return "           ".slice(-padLength);

                });

                // compute necessary paddings (find the maximum for each column)
                events.forEach(function (event) {
                    // only sweep through normal event whose first colum is a number
                    if (!isNaN(event[0]))
                        event.forEach(function (column, i) {
                            if (typeof column !== 'string')
                                throw new Error("Internal: column "+i+" is not a string: " + typeof column);
                            if (column !== false && column.length > paddings[i])
                                paddings[i] = column.length;
                        });
                });

                // adjust paddings in events and build lines
                var built_EDL = headers.join("\n") + events.map(function (event) {
                    var isComment = event[0].charAt(0) === '*';
                    var isM2 = event[0] === 'M2';
                    var isNumEvent = !isNaN(event[0]);

                    // alter all events by prepending and padding them as defined above
                    return event.map(function (column, i) {

                        // if the event is a standard one
                        if (i === 0 && !(isComment || isM2)) {
                            if (isNumEvent)
                                return pad("00000000000000000", column, paddings[i], true);
                            else
                                return column;
                        } else if (i === 0 && (isComment))
                            // '*' and 'M2' are returned as is
                            return column;
                        else if (!(isComment || isM2 || !isNumEvent) || isM2 && i === 1)
                            // other columns from standard events are padded
                            return prePaddings[i] + pad(c_s_MAX_SPACE_PAD, column, paddings[i]);
                        else if (isM2 && i !== 1) {
                            if (i >= 4)
                                return "";

                            if (i === 0)
                                return column +" ";

                            // in M2 events, after the second column, each subsequent column skips the previous column
                            // so we must add an empty column before.
                            // (this comes from the way we import them where we don't leave any gap)
                            var targetColumn;

                            if (i == 2)
                                targetColumn = 3;
                            else if (i == 3)
                                targetColumn = 5;
                            else
                                targetColumn = i;

                            var    toPreAdd  = prePaddings[targetColumn - 1] + pad(c_s_MAX_SPACE_PAD, ""    , paddings[targetColumn - 1]);
                            return toPreAdd  + prePaddings[targetColumn] +     pad(c_s_MAX_SPACE_PAD, column, paddings[targetColumn]);
                        } else if (isComment || !isNumEvent)
                            // columns from comments and headers are separated by a single space
                            return " " + column;
                        else
                            throw new Error("Unhandled case");
                    }).reduce(function(a, b) {return a + (b !== false ? b : "");}, "").trim();

                }).join("\n");

                try {
                    my.EDLSummary = EDL_SUMMARY(rawEDLToArrays(built_EDL, fps, true));
                } catch(e) {
                    my.warnings = "Generated EDL does not seem valid: " + e.toString();
                    if (strictValidate)
                        throw e;
                }

                return built_EDL;

            }

            my.build = build;

            return my;
        }());
    }
    my.getEDLbuilder = getEDLbuilder;

    function rawEDLToArrays (rawEDL, fps, keepComments) {
        checkFPS_(fps);

        var TIME_CODE_MODULUS_found = false;

        var edlArray = rawEDL.trim().split(c_r_LINES).map(function(row) {
            row = row.trim();

            var splitRow;
            if (row.match(c_r_HEADER) !== null) {
                splitRow = row.split(c_r_HEADER);
            } else if (row.charAt(0) === "*") {
                splitRow = row.split(c_r_COMMENTS1);

                if (splitRow.length === 1)
                    splitRow = row.split(c_r_COMMENTS2);

            } else {
                splitRow = row.split(c_r_STANDARD);
            }

            // when using group matching, split likes to add empty strings at end and start...
            if (splitRow[0] === "")
                splitRow.splice(0, 1);

            // deal with dissolves
            if (splitRow[c_i_EVENTT] === "D") {
                splitRow[c_i_EVENTT] = "D " + splitRow[c_i_EVENTT + 1];
                splitRow.splice(c_i_EVENTT + 1, 1);
            }

            if (!TIME_CODE_MODULUS_found && splitRow[c_i_EVENTN] === "TIME_CODE_MODULUS:") {
                TIME_CODE_MODULUS_found = true;

                if (fps != splitRow[c_i_EVENTN + 1])
                    throw new E_InvalidFPS("given FPS is not equal to TIME_CODE_MODULUS header");
            }

            while (splitRow.length < 8)
                splitRow.push("");

            if (splitRow.length > 8)
                throw new E_InvalidEDL("more than 8 columns: (" + splitRow + ")");

            return splitRow;
        }).filter(function(a_row) {
            // keep comments and non empty lines
            return (a_row[c_i_EVENTN].charAt(0) !== "*" || keepComments) && a_row.join("") !== "";
        });

        if (!TIME_CODE_MODULUS_found)
            edlArray.splice(1, 0, ["TIME_CODE_MODULUS:", fps, "", "", "", "", "", ""]);

        return edlArray;
    }
    my.rawEDLToArrays = rawEDLToArrays;


    function rawResolveEDLMarkerToArrays (rawEDLMarker, fps) {

        if (typeof rawEDLMarker !== "string")
            throw new E_InvalidEDL("EDL must be a string '" + typeof rawEDLMarker + "' received");

        checkFPS_(fps);

        var MarkersFound = false;

        var edlMarkerArray = rawEDLMarker.split(c_r_RESOLVE_MARKER_ENTRY).map(function(row) {
            row = row.trim();

            var splitRow;

            if (row.match(c_r_HEADER) !== null) {
                splitRow = row.split(c_r_HEADER).slice(1,2);
            } else if (row.match(c_r_RESOLVE_MARKERS) !== null) {
                // split loves to add empty elements at end and start...
                if (row.match(/^\|C:/) === null)
                    splitRow = row.split(c_r_RESOLVE_MARKERS).slice(1,-1);
                else {
                    splitRow = row.split(c_r_RESOLVE_MARKERS).slice(1,-1);
                }
                MarkersFound = true;
            } else {
                splitRow = row.split(c_r_STANDARD);

                // [4,5] === [6,7]
                if (!(splitRow[4] === splitRow[6] && splitRow[5] === splitRow[7]))
                    throw new E_InvalidEDL("Unexpected mismatch between source and record: " + splitRow.toString());
            }

            if (splitRow.length > 8)
                throw new E_InvalidEDL("more than 8 columns: (" + splitRow + ")");

            return splitRow;
        }).filter(function(a_row) {
            // keep non empty lines
            return a_row.join("") !== "";
        }).reduce(function (acc, curr, si, source) {
            // transform the array into a useful report
            // ---
            // [
            //   [start, end, name, note, color]
            // ]

            if (curr.length < 4 && si === 0) { // ignore the title
                return acc;
            } else if (curr.length == 8 && (acc.length === 0 || source[si - 1].length == 4)) {
                acc[acc.length] = [curr[4], "", "", "", "", 1];
            } else if (curr.length == 4 && si > 0 && source[si - 1].length == 8) {

                if (typeof acc[acc.length - 1] === "undefined")
                    throw new E_InvalidEDL("Unexpected entry format around: '" + curr.toString() + "'");

                if (curr[3] > 1) { // marker duration
                    if (curr[3] < 20000) {
                        acc[acc.length - 1][1] = FRAME_TO_TC(tcToFrame_(acc[acc.length - 1][0], fps) + (+curr[3]), fps);
                        // duration
                        acc[acc.length - 1][5] = +curr[3];
                    } else {
                        // it seems that some versions of resolve used a tc's frame representation as marker duration...
                        acc[acc.length - 1][1] = FRAME_TO_TC(+curr[3], fps);
                        // duration
                        acc[acc.length - 1][5] = +curr[3] - tcToFrame_(acc[acc.length - 1][0], fps);

                    }
                }

                // name
                acc[acc.length - 1][2] = curr[2].trim();
                // note
                acc[acc.length - 1][3] = curr[0].trim();
                // color
                acc[acc.length - 1][4] = curr[1].trim();
            } else {
                throw new E_InvalidEDL("Unexpected entry length ("+curr.length+") in marker edl: '" + curr.toString() + "' ---- " + "'" + (si > 0 ? source[si - 1].toString() : "XXXX") +"'");
            }

            return acc;

        }, []);

        if (!MarkersFound)
            throw new E_InvalidEDL("No Resolve marker could be found");




        return edlMarkerArray;
    }

    my.rawResolveEDLMarkerToArrays = rawResolveEDLMarkerToArrays;
    my.regex.c_r_RESOLVE_MARKER_ENTRY = c_r_RESOLVE_MARKER_ENTRY;

    // a recursive function to find an M2 associated event (usualy the previous
    // one but in case of dissolves it might not be so)
    function findM2Associate (A_edl, lastEventIndex, M2TCRef) {
        if (lastEventIndex < 0)
            throw new E_InvalidEDL("M2 reference ("+M2TCRef+") not found.");

        if (A_edl[lastEventIndex][c_i_SRCIN] === M2TCRef)
            return lastEventIndex;
        else
            return findM2Associate(A_edl, lastEventIndex - 1, M2TCRef);
    }

    function setSRCIN_if_NegM2 (modeA, i, fps) {
        // Fix reverse motion effects source in point but ignore non-events (dissolves in points)
        if (modeA[i][c_i_M2SPEED] !== null && modeA[i][c_i_M2SPEED] < 0 && modeA[i][c_i_SRCOUT] - modeA[i][c_i_SRCIN] > 0) {
            // c_i_SRCIN is wrong on these events (c_i_SRCOUT - 1)
            modeA[i][c_i_SRCIN] = (modeA[i][c_i_SRCOUT] - ((modeA[i][c_i_RECOUT] - modeA[i][c_i_RECIN]) * -1 * (modeA[i][c_i_M2SPEED] / fps))) | 0;
        }
    }

    function parseEDL (A_edl_, fps) {

        if (!(A_edl_ instanceof Array))
            throw new E_InvalidEDL("EDL must be an array");

        if(typeof A_edl_[0] === 'undefined')
            throw new E_InvalidEDL("EDL is empty");

        if (fps)
            checkFPS_(fps);

        // work on a copy of the given data
        var A_edl = A_edl_.slice(0).map(function(row) {return row.slice(0);});

        var sources = [];
        var sourceMapping = [];
        var sourceOverlapCount = 0;
        var recordOverlapCount = 0;
        var dissolveCount = 0;
        var dissolveLength = 0;
        var usingClipNames = false;
        var lastEventIndex = 0;
        var hasM2 = false;

        var a_fpe = A_edl.filter(function(a_row, i) {

            if(!(a_row instanceof Array) || a_row.length !== 8)
                throw new E_InvalidEDL("each EDL row must be [Event#, Source, Track, EventType, TCSourceIn, TCSourceOut, TCRecordIn, TCRecordOut]. type Received: "+ typeof a_row + " num entries: " + (a_row instanceof Array ? a_row.length : "N/A"));

            // add a place holder for M2
            a_row[c_i_M2SPEED] = null;

            if (!fps) {
                if (a_row[c_i_EVENTN] === "TIME_CODE_MODULUS:") {
                    fps = a_row[c_i_EVENTN + 1] | 0;
                    checkFPS_(fps);
                } else if (a_row[c_i_RECOUT] !== "")
                    throw new E_InvalidFPS("no fps given and no TIME_CODE_MODULUS header found.");
            }

            // make sure all sources are strings even if numerical
            if (typeof a_row[c_i_SOURCE] !== "string")
                a_row[c_i_SOURCE] = a_row[c_i_SOURCE].toString();

            // make a list of all sources
            if (sources.indexOf(a_row[c_i_SOURCE]) === -1)
                sources.push(a_row[c_i_SOURCE]);

            // grab the source mapping if present
            if (!usingClipNames && a_row[c_i_EVENTN] === ">>>" && a_row[c_i_SOURCE] === "SOURCE")
                sourceMapping[sources.indexOf(a_row[2].toString())] = a_row[3];

            if (a_row[c_i_EVENTN] === "*" && (a_row[c_i_EVENTN + 1] === "FROM CLIP NAME:" || a_row[c_i_EVENTN + 1] === "SOURCE FILE:")) {
                usingClipNames = true;

                // we can do this because filter constructs a new array using references to inner arrays of A_edl
                A_edl[lastEventIndex][c_i_SOURCE] = a_row[c_i_EVENTN + 2];

                // The following would have been nicer but EDL is such messy a
                // format that we can't rely on unique source IDs...

                //  sourceMapping[sources.indexOf(A_edl[i - 1][c_i_SOURCE])] = a_row[c_i_EVENTN + 2];
            }

            // only keep events
            if (a_row[c_i_RECOUT] !== "" && !isNaN(parseInt(a_row[c_i_EVENTN], 10))) {
                lastEventIndex = i;
                return true;
            } else if (a_row[c_i_EVENTN].trim() === "M2") {
                hasM2 = true;
                // we can do this because filter constructs a new array using references to inner arrays of A_edl
                A_edl[findM2Associate(A_edl, lastEventIndex, a_row[c_i_EVENTN + 3])][c_i_M2SPEED] = parseFloat(a_row[c_i_EVENTN + 2]);
                return false;
            } else {
                return false;
            }

        }).map(function (a_row) {

            return a_row.map(function (cell, col) {
                if (col === c_i_SOURCE && typeof sourceMapping[sources.indexOf(cell)] !== 'undefined')
                    return sourceMapping[sources.indexOf(cell)];
                else if (col >= c_i_SRCIN && col < c_i_M2SPEED) {
                    try {
                        return tcToFrame_(cell, fps);
                    } catch (e) {
                        if (e instanceof E_InvalidTimeCode)
                            throw new E_InvalidEDL("event # " + a_row[c_i_EVENTN] + ": " + e.toString());
                        else
                            throw e;
                    }
                } else
                    return cell;
            });

        }).sort(function (a, b) {
            return a[c_i_RECIN] - b[c_i_RECIN];
        });


        a_fpe.forEach(function (_, i, modeA) {

            if (i !== 0 && modeA[i][c_i_RECIN] < modeA[i - 1][c_i_RECOUT] && modeA[i][c_i_EVENTT].charAt(0) !== "D")
                ++recordOverlapCount;

            if (modeA[i][c_i_SRCOUT] - modeA[i][c_i_SRCIN] !== modeA[i][c_i_RECOUT] - modeA[i][c_i_RECIN] && modeA[i][c_i_M2SPEED] === null)
                throw  new E_InvalidEDL("".concat("source length (", modeA[i][c_i_SRCOUT] - modeA[i][c_i_SRCIN], ") does not match record length (", modeA[i][c_i_RECOUT] - modeA[i][c_i_RECIN], ")", " on event # ", a_fpe[i][c_i_EVENTN], " - check frame rate"));


            // check source duration
            if (modeA[i][c_i_SRCOUT] - modeA[i][c_i_SRCIN] < 1) {
                // normal if this is a dissolve
                if (typeof modeA[i + 1] === "undefined" || modeA[i + 1][c_i_EVENTT].charAt(0) !== "D" || modeA[i][c_i_SRCOUT] - modeA[i][c_i_SRCIN] < 0) {
                    throw new E_InvalidEDL("invalid length detected on event # " +  modeA[i][c_i_EVENTN]);
                } else {
                    // get dissolve duration
                    var dd = parseInt(modeA[i + 1][c_i_EVENTT].substring(2), 10);

                    if (! isInt_(dd))
                        throw new E_InvalidEDL("invalid dissolve duration (no integer:"+modeA[i + 1][c_i_EVENTT]+") on event " +  modeA[i][c_i_EVENTN]);

                    // add the dissolve duration to the previous event out points (source and record)
                    modeA[i - 1][c_i_RECOUT] += dd; // always OK

                    if (modeA[i - 1][c_i_M2SPEED] === null) {
                        modeA[i - 1][c_i_SRCOUT] += dd;
                    } else if (modeA[i - 1][c_i_M2SPEED] > 0) {
                        // adjust the tc out taking the M2's fps into account starting from the in point to avoid imprecision errors
                        modeA[i - 1][c_i_SRCOUT] = modeA[i - 1][c_i_SRCIN] + 1 +
                            ((modeA[i - 1][c_i_RECOUT] - modeA[i - 1][c_i_RECIN]) * (modeA[i][c_i_M2SPEED] / fps)) | 0;

                        if (modeA[i - 1][c_i_SRCOUT] < modeA[i][c_i_SRCOUT])
                            throw new Error("Dissolve on M2 adjustment sanity check failure");
                    } else {
                        // we changed rec out so we need to reset srcin when M2 <0
                        setSRCIN_if_NegM2(modeA, i - 1, fps);
                    }

                    /*
                    // replace the next event (i + 2) in-points by the ones of
                    // the dissolve event (i + 1) and cancel out the later.

                    // XXX not that simple if dissolve is a <0 M2...
                    modeA[i + 2][c_i_SRCIN] =  modeA[i + 1][c_i_SRCIN];
                    modeA[i + 2][c_i_RECIN] =  modeA[i + 1][c_i_RECIN];
                    // cancel the dissolve sub-event now that its data has been moved
                    // keeping srcIN so M2 references still match (not used for now)
                    modeA[i + 1][c_i_SRCIN]  =  modeA[i + 1][c_i_SRCOUT];
                    modeA[i + 1][c_i_RECOUT] =  modeA[i + 1][c_i_RECIN];
                    modeA[i + 1][c_i_EVENTN] = false;
                    */


                    dissolveLength += dd;
                    ++dissolveCount;
                }
            }

            // check and fix <0 M2 in points
            setSRCIN_if_NegM2(modeA, i, fps);

            // TODO: display a warning if the duration is not coherent with >0 M2 (involuntary freeze frames effects)
        });

        a_fpe.slice().sort(function (a, b) { // We do not keep this sorting
            return a[c_i_SRCIN] - b[c_i_SRCIN];
        }).forEach(function (_, i, modeC) {
            if (modeC[i][c_i_RECIN] === modeC[i][c_i_RECOUT]) // ignore null events
                return;

            if (i !== 0 && modeC[i][c_i_SRCIN] < modeC[i - 1][c_i_SRCOUT] && modeC[i][c_i_SOURCE] !== "BL" && modeC[i - 1][c_i_SOURCE] !== "BL") {
                ++sourceOverlapCount;
            }
        });

        a_fpe.sourceOverlapCount = sourceOverlapCount;
        a_fpe.recordOverlapCount = recordOverlapCount;
        a_fpe.dissolveLength = dissolveLength;
        a_fpe.dissolveCount = dissolveCount;
        a_fpe.hasM2 = hasM2;
        a_fpe.ignoreBL = false;
        a_fpe.fps = fps;


        return a_fpe;
    }

    my.parseEDL = parseEDL;

    // matchBacking is finding the source relating to a record, ie finding the source timecode edited at rec_frame
    function matchBackFrame (rec_frame, a_fpe) {

        if (rec_frame < a_fpe[0][c_i_RECIN])
            throw new E_NotFoundInEDL("record TC is located before EDL's first event, TC: " + FRAME_TO_TC(rec_frame, a_fpe.fps));

        if (a_fpe.length !== 0 && rec_frame >= a_fpe[a_fpe.length - 1][c_i_RECOUT])
            throw new E_NotFoundInEDL("record TC out-ran EDL record length, TC: " + FRAME_TO_TC(rec_frame, a_fpe.fps));


        var i;
        var matches = [];
        var events = [];
        var sources = [];
        matches.sources = sources;
        matches.events = events;
        for (i = 0 ; i < a_fpe.length ; i++) {
            if ((rec_frame >= a_fpe[i][c_i_RECIN] && rec_frame < a_fpe[i][c_i_RECOUT]) && (!a_fpe.ignoreBL || a_fpe[i][c_i_SOURCE] !== "BL")) {

                sources[matches.length] = a_fpe[i][c_i_SOURCE];
                events [matches.length] = a_fpe[i][c_i_EVENTN];

                if (a_fpe[i][c_i_M2SPEED] === null) { // no vary speed
                    matches[matches.length] = a_fpe[i][c_i_SRCIN] + (rec_frame - a_fpe[i][c_i_RECIN]);
                } else {
                    events [matches.length] = events [matches.length] + " - M2";

                    var match = 0;
                    if (a_fpe[i][c_i_M2SPEED] >= 0)
                        // apply speed corrections and truncate to integer (it's what Avid does apparently)
                        match = a_fpe[i][c_i_SRCIN] + (((rec_frame - a_fpe[i][c_i_RECIN]) * (a_fpe[i][c_i_M2SPEED] / a_fpe.fps)) | 0);
                    else
                        match = (a_fpe[i][c_i_SRCOUT] - 1 + ((rec_frame - a_fpe[i][c_i_RECIN]) * (a_fpe[i][c_i_M2SPEED] / a_fpe.fps))) | 0;

                    // constrive the matched source TC to this event range
                    if (match >= a_fpe[i][c_i_SRCOUT])
                        match = a_fpe[i][c_i_SRCOUT] - 1;
                    else if (match < a_fpe[i][c_i_SRCIN])
                        match = a_fpe[i][c_i_SRCIN];

                    matches[matches.length] = match;

                }
            }

            if (rec_frame < a_fpe[i][c_i_RECIN]) {
                if (!matches.length) // since the EDL is sorted by a_fpe[i][c_i_RECIN]... (Mode A)
                    throw new E_NotFoundInEDL("record TC not found in EDL (gap ?), TC: " + FRAME_TO_TC(rec_frame, a_fpe.fps));
                else
                    break;
            }
        }

        return matches;

    }

    my.matchBackFrame = matchBackFrame;

    function reverseMatchBackFrame (source_frame, a_fpe) {
        var i;
        var matches = [];
        var events = [];
        var sources = [];
        var shotInfos = [];
        matches.sources = sources;
        matches.events = events;
        matches.shotInfos = shotInfos;
        for (i = 0 ; i < a_fpe.length ; i++) {
            if (source_frame >= a_fpe[i][c_i_SRCIN] && source_frame < a_fpe[i][c_i_SRCOUT] && (!a_fpe.ignoreBL || a_fpe[i][c_i_SOURCE] !== "BL")) {

                // record sources and events
                sources[matches.length] = a_fpe[i][c_i_SOURCE];
                events [matches.length] = a_fpe[i][c_i_EVENTN];
                shotInfos[matches.length] = [a_fpe[i][c_i_RECIN], a_fpe[i][c_i_RECOUT] - a_fpe[i][c_i_RECIN]];

                if (a_fpe[i][c_i_M2SPEED] === null) { // no vary speed
                    matches[matches.length] = a_fpe[i][c_i_RECIN] + (source_frame - a_fpe[i][c_i_SRCIN]);
                } else {

                    events [matches.length] += " - M2";

                    var match = 0;
                    if (a_fpe[i][c_i_M2SPEED] >= 0)
                        // here we need to round up instead of truncating to be consistent with what Avid does (I'm not sure why...)
                        match = a_fpe[i][c_i_RECIN] + (a_fpe[i][c_i_M2SPEED] !== 0 ?
                                Math.round((source_frame - a_fpe[i][c_i_SRCIN]) * (a_fpe.fps / a_fpe[i][c_i_M2SPEED]))|0
                                : 0);
                    else
                        // we must approach the rec tc from the left to get the first image and not the last (if it's a slow motion)
                        match = a_fpe[i][c_i_RECOUT] - 1 -
                                (Math.round(  (source_frame - a_fpe[i][c_i_SRCIN]) * -1 * (a_fpe.fps / a_fpe[i][c_i_M2SPEED]) +0.5 ));
                                //(Math.round((a_fpe[i][c_i_SRCOUT] - 1 - source_frame) * -1 * (a_fpe.fps / a_fpe[i][c_i_M2SPEED])));

                    // constrive the matched record TC to this event range
                    if (match >= a_fpe[i][c_i_RECOUT])
                        match = a_fpe[i][c_i_RECOUT] - 1;
                    else if (match < a_fpe[i][c_i_RECIN])
                        match = a_fpe[i][c_i_RECIN];

                    matches[matches.length] = match;

                }

                if (matches.length > a_fpe.sourceOverlapCount)
                    break;
            }
        }

        if (matches.length)
            return matches;
        else
            throw new E_NotFoundInEDL("source TC not found in EDL (not edited?), TC: " + FRAME_TO_TC(source_frame, a_fpe.fps));
    }
    my.reverseMatchBackFrame = reverseMatchBackFrame;

    function getTCMatcher (raw_edl, fps, offset, reverse, ignoreBL, asShots) {
        if (fps)
            checkFPS_(fps);

        if (offset === undefined)
            offset = 0;

        if (reverse === undefined)
            reverse = false;

        if (ignoreBL === undefined)
            ignoreBL = false;

        if (asShots === undefined)
            asShots = false;

        checkInteger_(offset);

        var parsed_edl = parseEDL(raw_edl, fps);
        parsed_edl.ignoreBL = ignoreBL;

        var offsetAndTranslate = function (match, i, matches) {
            /* jshint ignore:start */
            if (!asShots) {
                return FRAME_TO_TC(match + offset, parsed_edl.fps)
                    + ((parsed_edl.sourceOverlapCount /*|| parsed_edl.recordOverlapCount*/)
                            ? " (s: "+matches.sources[i]+")" + " (e: "+matches.events[i]+")"
                            : "");
            } else {
                return FRAME_TO_TC(matches.shotInfos[i][0] + offset, parsed_edl.fps)
                    + " (s: "+matches.sources[i]+")" + " (e: "+matches.events[i]+")" + " (f#: "+matches.shotInfos[i][1]+")"
                            ;
            }
            /* jshint ignore:end */
        };

        // TODO:implement source hinting to prevent returning useless matches... (parse "(s: XXXX)"
        if (!reverse) {
            if (asShots)
                throw new E_NotImplemented("asShot feature not implemented on matchBackFrame");

            return function (tc) {
                return matchBackFrame(tcToFrame_(tc, parsed_edl.fps), parsed_edl).map(offsetAndTranslate);
            };
        } else {
            return function (tc) {
                return reverseMatchBackFrame(tcToFrame_(tc, parsed_edl.fps), parsed_edl).map(offsetAndTranslate);
            };
        }

    }
    my.getTCMatcher = getTCMatcher;


    return my;
})();


/**
 * Returns various useful details avout an EDL
 * (Effects are not supported yet.)
 *
 * @param {sheet3!A3:H} a_edl The EDL represented by a range containing rows of 8 cells each [Event#, Source, Track, EventType, TCSourceIn, TCSourceOut, TCRecordIn, TCRecordOut]
 * @param {24} fps (optional) The frame rate of the provided record timeCode and EDL
 *
 * @customfunction
 */
function EDL_SUMMARY(a_edl, fps) {
    const c_i_EVENTN = 0, c_i_SOURCE = 1, c_i_TRACK = 2, c_i_EVENTT = 3, c_i_SRCIN = 4, c_i_SRCOUT = 5, c_i_RECIN = 6, c_i_RECOUT = 7;

    var parsed_edl = EDLUtils_.parseEDL(a_edl, fps);

    var sourceEditLength = parsed_edl.reduce(function (currentL, a_row) {return currentL + (a_row[c_i_SOURCE] !== "BL" ? (a_row[c_i_SRCOUT] - a_row[c_i_SRCIN]) : 0);}, 0);
    var editLength = parsed_edl.length ? parsed_edl[parsed_edl.length - 1][c_i_RECOUT] - parsed_edl[0][c_i_RECIN] : 0;

    var sourcesLength = [];
    var sourcesName = [];
    var dupes = [];
    var maxEventNum = 0;
    const endRow = [["=== End of summary ===","",""]];

    parsed_edl.forEach(function (a_row) {

        if (a_row[c_i_EVENTN] > maxEventNum)
            maxEventNum = a_row[c_i_EVENTN];

        var srcName = a_row[c_i_SOURCE].toString();

        if (sourcesName.indexOf(srcName) === -1) {
            sourcesName.push(srcName);
            sourcesLength[sourcesName.indexOf(srcName)] = 0;
        }

        sourcesLength[sourcesName.indexOf(srcName)] += a_row[c_i_SRCOUT] - a_row[c_i_SRCIN];

    });

    sourcesLength = sourcesLength.map(function(sourceLength, sourceNameIndex) {
        return [sourcesName[sourceNameIndex], sourceLength, keepError_(FRAME_TO_TC)(sourceLength, parsed_edl.fps)];
    });



    var duppedFrameNumber = 0;
    parsed_edl.slice()
        .sort(
                function (a, b) {
                    if (a[c_i_SOURCE] === b[c_i_SOURCE])
                        return a[c_i_SRCIN] - b[c_i_SRCIN];
                    else
                        return a[c_i_SOURCE] < b[c_i_SOURCE] ? -1 : +(a[c_i_SOURCE] > b[c_i_SOURCE]);
                }
             )
        .forEach(function (_, i, modeC) {
            if (modeC[i][c_i_RECIN] === modeC[i][c_i_RECOUT]) // ignore null events
                return;

            if (i !== 0 && modeC[i][c_i_SRCIN] < modeC[i - 1][c_i_SRCOUT] && modeC[i][c_i_SOURCE] !== "BL" && modeC[i - 1][c_i_SOURCE] !== "BL" && modeC[i][c_i_SOURCE] === modeC[i - 1][c_i_SOURCE]) {

                for (var j = i -1 ; j <= i ; j++)
                    dupes.push([
                        modeC[j][c_i_EVENTN], modeC[j][c_i_SOURCE], keepError_(FRAME_TO_TC)(modeC[j][c_i_SRCIN], parsed_edl.fps), keepError_(FRAME_TO_TC)(modeC[j][c_i_SRCOUT], parsed_edl.fps), keepError_(FRAME_TO_TC)(modeC[j][c_i_RECIN], parsed_edl.fps)
                    ]);

                duppedFrameNumber += modeC[i - 1][c_i_SRCOUT] - modeC[i][c_i_SRCIN];
            }
        });



    return [
        ["=== EDL Summary ("+TCM_VERSION+") ==="],
        ["Events:", maxEventNum == parsed_edl.length - parsed_edl.dissolveCount ? maxEventNum : parsed_edl.length - parsed_edl.dissolveCount + "(*)", parsed_edl.dissolveCount ? "of which " + parsed_edl.dissolveCount + " dissolves, frames in dissolves:" : "", parsed_edl.dissolveCount ? parsed_edl.dissolveLength : ""],
        ["Edited source length:", sourceEditLength, keepError_(FRAME_TO_TC)(sourceEditLength, parsed_edl.fps)],
        ["Edit length:", editLength, keepError_(FRAME_TO_TC)(editLength, parsed_edl.fps), editLength !== sourceEditLength ? "Warning: source length != edit length" : "" ],
        ["Edit real duration:",  keepError_(FRAME_TO_DURATION)(editLength, parsed_edl.fps)],
        // ["Gaps in sources:", "TODO"]
        ["Number of sources:", sourcesName.length, parsed_edl.sourceOverlapCount ? "(source timecodes are NOT unique: "+parsed_edl.sourceOverlapCount+" overlaps detected)" : "(source timecodes are unique)"],
        ["---- Edited length per source ----" + (parsed_edl.hasM2 ? " Warning: M2 detected - MATCHBACK() functions may not be frame accurate on these events!" : "" )],
        ['Source name', 'Frame #', 'Duration', parsed_edl.recordOverlapCount ? 'WARNING: record TC overlap (on purpose?)' : ''],
    ] . concat(sourcesLength, dupes.length ? [["--- Duplicates:", dupes.length / 2 + " events", duppedFrameNumber + " affected frames"], ["Event #", "Source name", "[Src in", "Src out[", "[Rec in"]] : [], dupes, endRow);

}


/**
 * Use an EDL to get a record timeCode's related source timeCode.
 * (Effects are not supported yet.)
 *
 * @param {"10:01:02:03"} timeCode The record timeCode for wich you want the related source timeCode (Can be a range)
 * @param {24} fps The frame rate of the provided record timeCode and EDL
 * @param {sheet3!A3:H} a_edl The EDL represented by a range containing rows of 8 cells each [Event#, Source, Track, EventType, TCSourceIn, TCSourceOut, TCRecordIn, TCRecordOut]
 * @param {0} offset An optional offset to apply to the returned TC
 * @param {true} ignoreBL An optional flag to ignore BLack edits (false by default)
 *
 * @returns The source timecode of the given record timecode
 *
 *
 * @customfunction
 */
function TC_MATCHBACK(timeCode, fps, a_edl, offset, ignoreBL) {

    if (timeCode === "")
        return "";

    var TCMatcher = EDLUtils_.getTCMatcher(a_edl, fps, offset, false, ignoreBL);

    // handle recursion on array
    function getMatchedSourceTC(timeCode) {
        // recurse if array given
        if (timeCode instanceof Array) {
            return timeCode.map(keepError_(getMatchedSourceTC));
        }

        if (timeCode === "")
            return "";

        // recurse if multiline TC
        if (isInputMultiline_(timeCode))
            return timeCode.split('\n').map(keepError_(getMatchedSourceTC)).join('\n');

        checkTC_(timeCode);

        return TCMatcher(timeCode).join("\n");
    }

    return getMatchedSourceTC(timeCode);
}

/**
 * Use an EDL to get a source timeCode's related record timeCode.
 * (Effects are not supported yet.)
 *
 * @param {"10:01:02:03"} timeCode The source timeCode for wich you want the related record timeCode (Can be a range)
 * @param {24} fps The frame rate of the provided source timeCode and EDL
 * @param {sheet3!A3:H} a_edl The EDL represented by a range containing rows of 8 cells each [Event#, Source, Track, EventType, TCSourceIn, TCSourceOut, TCRecordIn, TCRecordOut]
 * @param {0} offset An optional offset to apply to the returned TC
 * @param {true} ignoreBL An optional flag to ignore BLack edits (false by default)
 *
 * @returns     The corresponding record timecode of the given source timecode
 *
 *
 * @customfunction
 */
function TC_REVERSE_MATCHBACK(timeCode, fps, a_edl, offset, ignoreBL) {

    if (timeCode === "")
        return "";

    var reversedTCMatcher = EDLUtils_.getTCMatcher(a_edl, fps, offset, true, ignoreBL);

    // handle recursion on array
    function getMatchedRecordTC(timeCode) {
        // recurse if array given
        if (timeCode instanceof Array) {
            return timeCode.map(keepError_(getMatchedRecordTC));
        }

        if (timeCode === "")
            return "";

        // recurse if multiline TC
        if (isInputMultiline_(timeCode))
            return timeCode.split('\n').map(keepError_(getMatchedRecordTC)).join('\n');

        checkTC_(timeCode);

        return reversedTCMatcher(timeCode).join("\n");
    }

    return getMatchedRecordTC(timeCode);
}

/**
 * Use an EDL to get a source timeCode's related shot start timecode.
 * (Effects are not supported yet.)
 *
 * @param {"10:01:02:03"} timeCode The source timeCode for wich you want the related record short start frame (Can be a range)
 * @param {24} fps The frame rate of the provided source timeCode and EDL
 * @param {sheet3!A3:H} a_edl The EDL represented by a range containing rows of 8 cells each [Event#, Source, Track, EventType, TCSourceIn, TCSourceOut, TCRecordIn, TCRecordOut]
 * @param {0} offset An optional offset to apply to the returned TC
 * @param {true} ignoreBL An optional flag to ignore BLack edits (false by default)
 *
 * @returns     The corresponding shot record start timecode of the given source timecode
 *
 *
 * @customfunction
 */
function TC_SHOT_REVERSE_MATCHBACK(timeCode, fps, a_edl, offset, ignoreBL) {

    if (timeCode === "")
        return "";

    var reversedTCMatcherAsShots = EDLUtils_.getTCMatcher(a_edl, fps, offset, true, ignoreBL, true);

    // handle recursion on array
    function getMatchedRecordTCShot(timeCode) {
        // recurse if array given
        if (timeCode instanceof Array) {
            return timeCode.map(keepError_(getMatchedRecordTCShot));
        }

        if (timeCode === "")
            return "";

        // recurse if multiline TC
        if (isInputMultiline_(timeCode))
            return timeCode.split('\n').map(keepError_(getMatchedRecordTCShot)).join('\n');

        checkTC_(timeCode);

        return reversedTCMatcherAsShots(timeCode).join("\n");
    }

    return getMatchedRecordTCShot(timeCode);
}

/**
 * (private) Returns a function that returns the error of the supplied function
 * as a string istead of throwing it
 *
 * @param {function} originalFunction - the function to wrap
 * @return {function} a "modified" function that will return an error message instead of throwing it
 *
 */
function keepError_(originalFunction) {
    return function () {
        try {
            return originalFunction.apply(this, arguments);
        } catch (err){
            return err.toString();
        }
    };
}

/**
 * (private) parse a timecode, functional style
 *
 * @param {string} timeCode - The time code to convert (string expected).
 * @param {number} fps - The frame rate of the timecode to convert (integer expected).
 * @returns {number} - The converted timecode in number of frames
 *
 */
var tcToFrame_ = (function() {
    const max = [0, 59, 59, 23];

    return function (timeCode, fps) {
        return checkTC_(timeCode, true).split(':').reverse().reduce(
                function (previousValue, currentValue, i, a) {
                    if (i === 0 && +currentValue > fps - 1 || i > 0 && +currentValue > max[i])
                        throw new E_InvalidTimeCode('Illegal "' + a[i] + '" found in TC');

                    if (i === 0)
                        return previousValue + (+currentValue);
                    else
                        return previousValue + (+currentValue) * fps * Math.pow(60,(i - 1));
                },
                0);
    };
})();

/**
 * Convert a time code to frame number
 *
 * @param {"10:01:02:03"} timeCode - The time code to convert. (Can be a range)
 * @param {24} fps - The frame rate of the timecode to convert.
 * @returns {number} - The converted timecode in number of frames
 *
 * @customfunction
 */
function TC_TO_FRAME(timeCode, fps) {
    checkFPS_(fps);

    // recurse if array given
    if (timeCode instanceof Array)
        return recurseOnArray_(TC_TO_FRAME, timeCode, fps);


    if (timeCode === "")
        return "";

    if (isInputMultiline_(timeCode))
        return recurseOnMultiline_(TC_TO_FRAME, timeCode, fps, false);


    return tcToFrame_(timeCode, fps);
}




/**
 * Convert a frame number to a time code
 *
 * @param {86400} frameNum - The frame number(s) to convert
 * @param {24} fps - The frame rate of the frame number(s) to convert
 * @return {string} The time code represantation
 *
 * @customfunction
 */
function FRAME_TO_TC(frameNum, fps) {
    checkFPS_(fps);

    if (frameNum instanceof Array)
        return recurseOnArray_(FRAME_TO_TC, frameNum, fps);

    if (frameNum === "")
        return "";

    if (isInputMultiline_(frameNum))
        return recurseOnMultiline_(FRAME_TO_TC, frameNum, fps, true);

    checkInteger_(frameNum);

    var MAX_FRAME_NUM = 86400 * fps;

    // wrap around if frameNum > MAX_FRAME_NUM
    frameNum = frameNum % MAX_FRAME_NUM;

    // also wrap around if frame number is negative
    if (frameNum < 0)
        frameNum = frameNum + MAX_FRAME_NUM;


    var images  = frameNum % fps;
    frameNum   -= images;

    var seconds = (frameNum / fps)  % 60;
    frameNum   -=  seconds  * fps;

    var minutes = (frameNum / ( fps * 60)) % 60;
    frameNum   -=  minutes  *   fps * 60;

    var hours   = (frameNum / ( fps * 60   * 60));

    return (hours > 9 ? hours   : "0" + hours  ) + ":" +
        ( minutes > 9 ? minutes : "0" + minutes) + ":" +
        ( seconds > 9 ? seconds : "0" + seconds) + ":" +
        (  images > 9 ? images  : "0" + images );
}

/**
 * Convert a frame number to real duration in standard time units
 *
 * @param {86400} frameNum - The frame number(s) to convert
 * @param {24} fps - The frame rate of the frame number(s) to convert
 * @return {string} The duration representation
 *
 * @customfunction
 */
function FRAME_TO_DURATION(frameNum, fps) {
    checkFPS_(fps, true);

    if (frameNum instanceof Array)
        return recurseOnArray_(FRAME_TO_DURATION, frameNum, fps);

    if (frameNum === "")
        return "";

    if (isInputMultiline_(frameNum))
        return recurseOnMultiline_(FRAME_TO_DURATION, frameNum, fps, true);

    checkInteger_(frameNum);

    var second_int  = (frameNum / fps) | 0;
    var second_frac = (frameNum / fps) - second_int;


    var seconds = second_int % 60;
    second_int -= seconds;

    // second_int is now whole minutes only

    var minutes = (second_int % (60 * 60)) / 60;
    second_int -=  minutes * 60;

    // second_int is now whole hours only

    var hours   = second_int / (60 * 60);

    return (Math.abs(hours)   > 9 ? hours   : "0" + hours  ) + "h " +
           (Math.abs(minutes) > 9 ? minutes : "0" + minutes) + "m " +
           round2_(seconds + second_frac) + "s";
}


/**
 * Convert a time code's frame rate
 *
 * @param {"10:01:02:03"} timeCode - The time code to convert (Can be a range)
 * @param {24} sFps - The current frame rate
 * @param {25} dFps - The destination frame rate
 * @return  the converted time code
 *
 * @customfunction
 */
function TC_CONV(timeCode, sFps, dFps) {
    // recurse if array given
    // we could not do this and let the underlying API handle the recursion but
    // we would get difficult to read error messages if bad TC are given
    if (timeCode instanceof Array) {
        return timeCode.map(keepError_(function (timeCode) {
            return TC_CONV(timeCode, sFps, dFps);
        }));
    }

    if (timeCode === "")
        return "";

    // TC_TO_FRAME and FRAME_TO_TC will handle directly if a multiline call.
    // checkTC_() will be happy as long as one valid TC exists.

    checkTC_(timeCode);

    return FRAME_TO_TC(TC_TO_FRAME(timeCode, sFps), dFps);
}


/**
 * Offset a time code by a given number of frame
 *
 * @param {"10:01:02:03"} timeCode - The time code to offset (Can be a range)
 * @param {-5} offset - The offset to apply (can be < 0)
 * @param {24} fps - The timecode's framerate
 * @return {string} the offseted time code
 *
 * @customfunction
 */
function TC_OFFSET(timeCode, offset, fps) {

    checkInteger_(offset);

    checkFPS_(fps);

    // recurse if array given
    if (timeCode instanceof Array) {
        return timeCode.map(keepError_(function (timeCode) {
            return TC_OFFSET(timeCode, offset, fps);
        }));
    }


    if (timeCode === "")
        return "";

    if (isInputMultiline_(timeCode))
        return recurseOnMultiline3_(TC_OFFSET, timeCode, offset, fps, false);

    checkTC_(timeCode);

    return FRAME_TO_TC(TC_TO_FRAME(timeCode, fps) + offset, fps);
}

/**
 * Returns the number of image left after conversion of a frame number to HH:MM:SS
 *
 * @param {86400} value - Number of total frames
 * @param {0} fps - Frame per second
 * @return {number} remaining images
 *
 * @customfunction
 */
function IFROMI(value, fps) {
    checkFPS_(fps);

    if (value instanceof Array)
        return recurseOnArray_(IFROMI, value, fps);

    if (value === "")
        return "";

    if (isInputMultiline_(value))
        return recurseOnMultiline_(IFROMI, value, fps, true);

    checkInteger_(value);

    return value % fps;
}

/**
 * Returns the number of seeconds left after conversion of a frame number to HH:MM
 *
 * @param {86400} value - Number of total frames
 * @param {24} fps - Frame per second
 * @return {number} remaining seconds
 *
 * @customfunction
 */
function SFROMI(value, fps) {

    if (value instanceof Array)
        return recurseOnArray_(SFROMI, value, fps);

    if (value === "")
        return "";

    if (isInputMultiline_(value))
        return recurseOnMultiline_(SFROMI, value, fps, true);

    return ((value - IFROMI(value, fps)) / fps) % 60;
}

/**
 * Returns the number of minutes left after conversion of a frame number to HH
 *
 * @param {86400} value - Number of total frames
 * @param {24} fps - Frame per second
 * @return {number} remaining minutes
 *
 * @customfunction
 */
function MFROMI(value, fps) {

    if (value instanceof Array)
        return recurseOnArray_(MFROMI, value, fps);

    if (value === "")
        return "";

    if (isInputMultiline_(value))
        return recurseOnMultiline_(MFROMI, value, fps, true);

    return ((value- IFROMI(value, fps) - SFROMI(value, fps) * fps) / ( 60 * fps)) % 60;
}

/**
 * Returns the number of whole minutes in a raw frame count
 *
 * @param {86400} value - Number of total frames
 * @param {24} fps - Frame per second
 * @return {number} remaining images
 *
 * @customfunction
 */
function MFROMIRAW(value, fps) {

    if (value instanceof Array)
        return recurseOnArray_(MFROMIRAW, value, fps);

    if (value === "")
        return "";

    if (isInputMultiline_(value))
        return recurseOnMultiline_(MFROMIRAW, value, fps, true);

    return ((value - IFROMI(value, fps) - SFROMI(value, fps) * fps) / ( 60 * fps));
}

/**
 * Returns the number of whole hours in a raw frame count
 *
 * @param {86400} value - Number of total frames
 * @param {24} fps - Frame per second
 * @return {number} remaining images
 *
 * @customfunction
 */
function HFROMI(value, fps) {

    if (value instanceof Array)
        return recurseOnArray_(HFROMI, value, fps);

    if (value === "")
        return "";

    if (isInputMultiline_(value))
        return recurseOnMultiline_(HFROMI, value, fps, true);

    return (value - IFROMI(value, fps) - SFROMI(value, fps) * fps - MFROMI(value, fps) * 60 * fps) / ( 60 * 60 * fps);
}

/**
 * Returns the current version of TimeCode-Magiks
 *
 * @return {string} The version
 *
 * @customfunction
 */
function GETTCMVERSION() {
    return TCM_VERSION;
}

var LEVEL_DELIM = [" - ", String.fromCharCode(10)];


/**
 * Convert a multidimensional array to string
 *
 * @param {array} input The value to multiply.
 * @return the array flatten into a string
 * @customfunction
 */
function ARRAY_TO_STRING(a, delim) {

  if (!(a instanceof Array))
    return a;


 if (! delim)
     delim = " :\t";

  return a.reduce(function (acc, curr) {
    if (curr instanceof Array) {
      acc[acc.length] = ARRAY_TO_STRING(curr);
      delim = "\n";
    } else {
      acc[acc.length] = curr.toString();
    }

    return acc;

  }, []).join(delim);

}



/* jshint ignore:start */
// export things to work in nodeJS
// http://stackoverflow.com/questions/4224606/how-to-check-whether-a-script-is-running-under-node-js
if (typeof module !== 'undefined' && this.module !== module && typeof module.exports !== "undefined") {
    global.GETTCMVERSION        = GETTCMVERSION;
    global.EDL_SUMMARY          = EDL_SUMMARY;
    global.TC_MATCHBACK         = TC_MATCHBACK;
    global.TC_REVERSE_MATCHBACK = TC_REVERSE_MATCHBACK;
    global.TC_SHOT_REVERSE_MATCHBACK = TC_SHOT_REVERSE_MATCHBACK;
    global.TC_TO_FRAME          = TC_TO_FRAME;
    global.FRAME_TO_TC          = FRAME_TO_TC;
    global.FRAME_TO_DURATION    = FRAME_TO_DURATION;
    global.TC_CONV              = TC_CONV;
    global.TC_OFFSET            = TC_OFFSET;
    global.IFROMI               = IFROMI;
    global.SFROMI               = SFROMI;
    global.MFROMI               = MFROMI;
    global.MFROMIRAW            = MFROMIRAW;
    global.HFROMI               = HFROMI;
    global.ARRAY_TO_STRING      = ARRAY_TO_STRING;

    global.EDLUtils_            = EDLUtils_


    global.E_InvalidFPS        = E_InvalidFPS;
    global.E_InvalidTimeCode   = E_InvalidTimeCode;
    global.E_InvalidEDL        = E_InvalidEDL;
    global.E_NotFoundInEDL     = E_NotFoundInEDL;
    global.E_IntegerExpected   = E_IntegerExpected;

    module.exports.checkFPS_   = checkFPS_;
}
/* jshint ignore:end */
