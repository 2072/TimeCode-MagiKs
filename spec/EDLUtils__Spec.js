
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


    var SimpleThriceWithSources = [
        ["02:03:30:02 (s: BOBINE_02_948490) (e: 14)",	"02:03:47:18 (s: BOBINE_02_948490) (e: 15)",	"a first comment"],
        ["02:03:47:18 (s: BOBINE_01) (e: 15)",	"02:03:53:18 (s: BOBINE_01_948491) (e: 16)",	"a second comment"]
    ];

    function _getEDLbuilder() {
        return (a, b) => EDLUtils_.getEDLbuilder(a,b);
    }


    it("returns an object", () => {
        expect(typeof(_getEDLbuilder()("title", 24))).toEqual("object");
    });


    it("returns an EDL", () => {
        expect(_getEDLbuilder()("title", 24).importEvents(SimpleThrice).build().replace(/ /g, "-")).toEqual((
            "TITLE:title"          + "\n" +
            "TIME_CODE_MODULUS:24" + "\n" +
            "000  MARK  V  C        00:00:00:00 00:00:20:08 00:00:00:00 00:00:20:08" + "\n" +
            "* a first comment"    + "\n" +
            "001  MARK  V  C        01:00:00:00 01:00:01:23 01:00:00:00 01:00:01:23" + "\n" +
            "* a second comment").replace(/ /g, "-")
        );

    });

    it("returns an EDL with sources", () => {
        expect(_getEDLbuilder()("title", 24).importEvents(SimpleThriceWithSources).build().replace(/ /g, "-")).toEqual((
            "TITLE:title"          + "\n" +
            "TIME_CODE_MODULUS:24" + "\n" +
            "000  BOBINE_02_948490  V  C        02:03:30:02 02:03:47:18 02:03:30:02 02:03:47:18" + "\n" +
            "* a first comment"    + "\n" +
            "001  BOBINE_01         V  C        02:03:47:18 02:03:53:18 02:03:47:18 02:03:53:18" + "\n" +
            "* a second comment").replace(/ /g, "-")
        );

    });


    it("returns an EDL with sources and ignores empty lines", () => {

        var SimpleThriceWithSourcesWithEmtyLines = [
            [undefined,undefined,undefined],
            SimpleThriceWithSources[0],
            ["", "", ""],
            SimpleThriceWithSources[1],
            [null, null, null],
        ];

        expect(_getEDLbuilder()("title", 24).importEvents(SimpleThriceWithSourcesWithEmtyLines).build().replace(/ /g, "-")).toEqual((
            "TITLE:title"          + "\n" +
            "TIME_CODE_MODULUS:24" + "\n" +
            "000  BOBINE_02_948490  V  C        02:03:30:02 02:03:47:18 02:03:30:02 02:03:47:18" + "\n" +
            "* a first comment"    + "\n" +
            "001  BOBINE_01         V  C        02:03:47:18 02:03:53:18 02:03:47:18 02:03:53:18" + "\n" +
            "* a second comment").replace(/ /g, "-")
        );

    });

    it("returns an EDL with only 1 column provided", () => {

        var SimpleThriceWithSourcesWithEmtyLines = [
            [undefined,undefined,undefined],
            [SimpleThriceWithSources[0][0], null, ""],
            ["", "", ""],
            [SimpleThriceWithSources[1][0], "", undefined],
            [null, null, null],
        ];

        expect(_getEDLbuilder()("title", 24).importEvents(SimpleThriceWithSourcesWithEmtyLines).build().replace(/ /g, "-")).toEqual((
            "TITLE:title"          + "\n" +
            "TIME_CODE_MODULUS:24" + "\n" +
            "000  BOBINE_02_948490  V  C        02:03:30:02 02:03:30:03 02:03:30:02 02:03:30:03" + "\n" +
            "001  BOBINE_01         V  C        02:03:47:18 02:03:47:19 02:03:47:18 02:03:47:19").replace(/ /g, "-")
        );

    });
   

   

});
