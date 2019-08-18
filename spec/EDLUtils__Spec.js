
/*jshint esversion: 6 */
/* jshint -W097 */

'use strict';

/*globals describe, it, require, expect, EDLUtils_ */

describe("TC_MagiK advanced API - EDLUtils_", () => {

    require("../app/tc.js");

    var SimpleThrice = [
        ["00:00:00:00",	"00:00:20:08",	"a first comment"],
        ["01:00:00:00",	"01:00:01:23",	"a second comment"]
    ];

    var SimpleBadThrice = [
        ["00:00:00:00",	"00:00:20:08",	"a first comment"],
        ["01:00:00:00",	"01:00:01:27",	"a second comment"]
    ];


    var SimpleThriceWithSources = [
        ["02:03:30:02 (s: BOBINE_02_948490) (e: 14)",	"02:03:47:18 (s: BOBINE_02_948490) (e: 15)",	"a first comment"],
        ["02:03:47:18 (s: BOBINE_01) (e: 15)",	"02:03:53:18 (s: BOBINE_01_948491) (e: 16)",	"a second comment"]
    ];

    var standardSimpleEDL =[
        [1,	"START",	    "V",	               "C",	"01:00:00:00",	"01:00:15:00",	"01:00:00:00",	"01:00:15:00"],
        ["*",	"FROM CLIP NAME:", "START.mov",	         undefined,	    undefined,	 undefined   ,      undefined,      undefined],
        ["2",	"StartCredits",	    "V",                       "C",	"01:00:00:00",	"01:00:45:00",	"01:00:15:00",	"01:01:00:00"],
        ["*",	"FROM CLIP NAME:", "StartCredits.mov",       false,                "",             "",             "",             ""],
        ["3",	"roll_01",	    "V",	               "C",	"01:00:45:00",	"01:00:58:05",	"01:01:00:00",	"01:01:13:05"],
        ["*",	"FROM CLIP NAME:",  "roll_01.mov",                ,	             ,	             ,               ,             ""]
    ];

    var StandardEDLWithM2 = [
        ["117",	"Bobine_03_B",	"V",	"C",	"06:26:49:06",	"06:26:57:02",	"05:13:22:13",	"05:13:30:09"],
        ["*",	"FROM CLIP NAME:",	"Bobine_03_B.mov",	"",	"",	"",	"",	""],
        ["118",	"BL",	"V",	"C",	"05:13:30:09",	"05:14:28:00",	"05:13:30:09",	"05:14:28:00"],
        ["*",	"FROM CLIP NAME:",	"Solid Color",	"",	"",	"",	"",	""],
        ["119",	"Bobine_05_B",	"V",	"C",	"01:00:00:00",	"01:00:00:01",	"05:14:28:00",	"05:14:28:01"],
        ["M2",	"Bobine_05_B",	"0",	"01:00:00:00",	"",	"",	"",	""],
        ["*",	"FROM CLIP NAME:",	"Bobine_05_B.mov",	"",	"",	"",	"",	""],
        ["120",	"BL",	"V",	"C",	"05:14:28:01",	"05:14:30:00",	"05:14:28:01",	"05:14:30:00"],
        ["*",	"FROM CLIP NAME:",	"Solid Color",	"",	"",	"",	"",	""]
    ]

    it("I know how to count until 8", () => {

        expect(standardSimpleEDL.map((row) => {return row.length})).toEqual([8,8,8,8,8,8]);
        expect(StandardEDLWithM2.map((row) => {return row.length})).toEqual([8,8,8,8,8,8,8,8,8]);
    });

    function _getEDLbuilder() {
        return (a, b) => EDLUtils_.getEDLbuilder(a,b);
    }

    function _importEvents(a, b, c) {
        return () => EDLUtils_.getEDLbuilder(a,b).importEvents(c);
    }


    it("getEDLbuilder returns an object", () => {
        expect(typeof(_getEDLbuilder()("title", 24))).toEqual("object");
    });

    it("getEDLbuilder.importEvents() errors out on bad input", () => {
        expect(_importEvents("title", 24, [])).toThrowError(E_InvalidEDL, /eventArray must be an Array of Arrays/);
        expect(_importEvents("title", 24, [[0,0]])).toThrowError(E_InvalidEDL, /No event found/);
        expect(_importEvents("title", 24, [[0, 0, 0]])).toThrowError(E_InvalidEDL, /No event found/);
        expect(_importEvents("title", 24, [[0, 0, 0, 0]])).toThrowError(E_InvalidEDL, /No event found/);
        expect(_importEvents("title", 24, [[1, 0, 0, 0]])).toThrowError(E_InvalidEDL, /Please provide either/);
    });


    it("getEDLbuilder.importEvents().build() returns an EDL from a simple thrice", () => {
        expect(_getEDLbuilder()("title", 24).importEvents(SimpleThrice).build(true).replace(/ /g, "-")).toEqual((
            "TITLE:title"          + "\n" +
            "TIME_CODE_MODULUS:24" + "\n" +
            "000  MARK  V  C        00:00:00:00 00:00:20:08 00:00:00:00 00:00:20:08" + "\n" +
            "* a first comment"    + "\n" +
            "001  MARK  V  C        01:00:00:00 01:00:01:23 01:00:00:00 01:00:01:23" + "\n" +
            "* a second comment").replace(/ /g, "-")
        );

    });

    it("getEDLbuilder.importEvents().build() returns an EDL from a standard EDL", () => {
        expect(_getEDLbuilder()("title", 24).importEvents(standardSimpleEDL).build(true).replace(/ /g, "-").split("\n")).toEqual((
            "TITLE:title"          + "\n"
            +"TIME_CODE_MODULUS:24" + "\n"
            +"001  START         V  C        01:00:00:00 01:00:15:00 01:00:00:00 01:00:15:00" + "\n"
            +"* FROM CLIP NAME: START.mov" + "\n"
            +"002  StartCredits  V  C        01:00:00:00 01:00:45:00 01:00:15:00 01:01:00:00" + "\n"
            +"* FROM CLIP NAME: StartCredits.mov" + "\n"
            +"003  roll_01       V  C        01:00:45:00 01:00:58:05 01:01:00:00 01:01:13:05" + "\n"
            +"* FROM CLIP NAME: roll_01.mov"
        ).replace(/ /g, "-").split("\n")
        );

    });

    it("getEDLbuilder.importEvents().build() returns an EDL from a standard EDL with M2", () => {
        expect(_getEDLbuilder()("title", 24).importEvents(StandardEDLWithM2).build(true).replace(/ /g, "-").split("\n")).toEqual((
            "TITLE:title"          + "\n"
            +"TIME_CODE_MODULUS:24" + "\n"
            +"117  Bobine_03_B  V  C        06:26:49:06 06:26:57:02 05:13:22:13 05:13:30:09"+ "\n"
            +"* FROM CLIP NAME: Bobine_03_B.mov"+ "\n"
            +"118  BL           V  C        05:13:30:09 05:14:28:00 05:13:30:09 05:14:28:00"+ "\n"
            +"* FROM CLIP NAME: Solid Color"+ "\n"
            +"119  Bobine_05_B  V  C        01:00:00:00 01:00:00:01 05:14:28:00 05:14:28:01"+ "\n"
            +"M2   Bobine_05_B     0                    01:00:00:00"+ "\n"
            +"* FROM CLIP NAME: Bobine_05_B.mov"+ "\n"
            +"120  BL           V  C        05:14:28:01 05:14:30:00 05:14:28:01 05:14:30:00"+ "\n"
            +"* FROM CLIP NAME: Solid Color"
        ).replace(/ /g, "-").split("\n")
        );

    });

    it("getEDLbuilder.importEvents().build() creates an EDLSummary", () => {

        var builder = _getEDLbuilder()("title", 24).importEvents(SimpleThrice);
        builder.build();

        expect(builder.warnings).toEqual(false);
        expect(typeof builder.EDLSummary).toBe("object");
        expect(builder.EDLSummary[2]).toContain(535);

    });

    it("getEDLbuilder.importEvents().build(true) to test the created EDL", () => {
        function buildEdl(events, strict) {
            return () => _getEDLbuilder()("title", 24).importEvents(events).build(strict);
        }

        expect(buildEdl(SimpleBadThrice, true)).toThrowError(E_InvalidEDL, /Illegal "27"/);
    });

    it("getEDLbuilder.importEvents().build(false) to fill warnings property", () => {
        var builder = _getEDLbuilder()("title", 24).importEvents(SimpleBadThrice);
        builder.build(false);

        expect(builder.warnings).toContain("Illegal \"27\"");
    });

    it("getEDLbuilder.importEvents().build() returns an EDL with sources", () => {
        expect(_getEDLbuilder()("title", 24).importEvents(SimpleThriceWithSources).build(true).replace(/ /g, "-")).toEqual((
            "TITLE:title"          + "\n" +
            "TIME_CODE_MODULUS:24" + "\n" +
            "000  BOBINE_02_948490  V  C        02:03:30:02 02:03:47:18 02:03:30:02 02:03:47:18" + "\n" +
            "* a first comment"    + "\n" +
            "001  BOBINE_01         V  C        02:03:47:18 02:03:53:18 02:03:47:18 02:03:53:18" + "\n" +
            "* a second comment").replace(/ /g, "-")
        );

    });


    it("getEDLbuilder.importEvents().build() returns an EDL with sources and ignores empty lines", () => {

        var SimpleThriceWithSourcesWithEmtyLines = [
            [undefined,undefined,undefined],
            SimpleThriceWithSources[0],
            ["", "", ""],
            SimpleThriceWithSources[1],
            [null, null, null],
        ];

        expect(_getEDLbuilder()("title", 24).importEvents(SimpleThriceWithSourcesWithEmtyLines).build(true).replace(/ /g, "-")).toEqual((
            "TITLE:title"          + "\n" +
            "TIME_CODE_MODULUS:24" + "\n" +
            "000  BOBINE_02_948490  V  C        02:03:30:02 02:03:47:18 02:03:30:02 02:03:47:18" + "\n" +
            "* a first comment"    + "\n" +
            "001  BOBINE_01         V  C        02:03:47:18 02:03:53:18 02:03:47:18 02:03:53:18" + "\n" +
            "* a second comment").replace(/ /g, "-")
        );

    });

    it("getEDLbuilder.importEvents().build() returns an EDL with only 1 column provided", () => {

        var SimpleThriceWithSourcesWithEmtyLines = [
            [undefined,undefined,undefined],
            [SimpleThriceWithSources[0][0], null, ""],
            ["", "", ""],
            [SimpleThriceWithSources[1][0], "", undefined],
            [null, null, null],
        ];

        expect(_getEDLbuilder()("title", 24).importEvents(SimpleThriceWithSourcesWithEmtyLines).build(true).replace(/ /g, "-")).toEqual((
            "TITLE:title"          + "\n" +
            "TIME_CODE_MODULUS:24" + "\n" +
            "000  BOBINE_02_948490  V  C        02:03:30:02 02:03:30:03 02:03:30:02 02:03:30:03" + "\n" +
            "001  BOBINE_01         V  C        02:03:47:18 02:03:47:19 02:03:47:18 02:03:47:19").replace(/ /g, "-")
        );

    });

    // TODO:
    // add identity test
    // add test to leave headers alone if TITLE header is present in array for exporting.


});
