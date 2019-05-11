

// http://jasmine.github.io/2.0/introduction.html


//http://jasmine.github.io/2.1/node.html

'use strict';

describe("TC_MagiK base API - TC_TO_FRAME", function () {

    require("../app/tc.js");

    it("returns a number", function () {
        expect(typeof TC_TO_FRAME("01:00:00:00", 24)).toEqual("number");
    });

    it("simple usage", function () {
        expect(TC_TO_FRAME("01:00:00:00", 24)).toEqual(86400);
        expect(TC_TO_FRAME("00:00:00:00", 24)).toEqual(0);
        expect(TC_TO_FRAME("00:00:00", 24)).toEqual(0);
        expect(TC_TO_FRAME("00:00", 24)).toEqual(0);
        expect(TC_TO_FRAME("00", 24)).toEqual(0);
        expect(TC_TO_FRAME("01", 24)).toEqual(1);
        expect(TC_TO_FRAME("1", 24)).toEqual(1);
    });

    it("returns empty string if empty string given", function () {
        expect(TC_TO_FRAME("", 24)).toEqual("");
    });


    it("detects invalid framerate", function () {

        function _TC_TO_FRAME(a,b) {
            return function () {TC_TO_FRAME(a,b)}
        }

        expect(_TC_TO_FRAME("01:00:00:00", -1*24)).toThrowError(E_InvalidFPS, /fps must be > 0/);
        expect(_TC_TO_FRAME("01:00:00:00", 0)).toThrowError(E_InvalidFPS, /fps must be > 0/);
        expect(_TC_TO_FRAME("01:00:00:00", 25.0)).not.toThrow();
        expect(_TC_TO_FRAME("01:00:00:00", 25.1)).toThrowError(E_InvalidFPS, /fractional fps are not supported yet!/);
    });

    it("detects invalid TCs", function () {

        function _TC_TO_FRAME(a,b) {
            return function () {TC_TO_FRAME(a,b)}
        }

        // bad format
        expect(_TC_TO_FRAME("01,00:00:00", 24)).toThrowError(E_InvalidTimeCode);
        expect(_TC_TO_FRAME(" 01:00:00:00", 24)).toThrowError(E_InvalidTimeCode);
        expect(_TC_TO_FRAME("-1:00:00:00", 24)).toThrowError(E_InvalidTimeCode);
        expect(_TC_TO_FRAME("01:00:-1:00", 24)).toThrowError(E_InvalidTimeCode);
        expect(_TC_TO_FRAME(25, 24)).toThrow();
        expect(_TC_TO_FRAME(null, 24)).toThrow();
        expect(_TC_TO_FRAME(NaN, 24)).toThrow();
        expect(_TC_TO_FRAME(undefined, 24)).toThrowError(E_InvalidTimeCode);

        // it must not throw on good format
        expect(_TC_TO_FRAME("01:00:00:00", 24)).not.toThrow();

        // illegal numbers
        expect(_TC_TO_FRAME("25:00:00:00", 24)).toThrowError(E_InvalidTimeCode);
        expect(_TC_TO_FRAME("24:00:00:00", 24)).toThrowError(E_InvalidTimeCode);
        expect(_TC_TO_FRAME("01:60:00:00", 24)).toThrowError(E_InvalidTimeCode);
        expect(_TC_TO_FRAME("01:00:60:00", 24)).toThrowError(E_InvalidTimeCode);
        expect(_TC_TO_FRAME("01:00:00:24", 24)).toThrowError(E_InvalidTimeCode);

        expect(_TC_TO_FRAME("01:00:00:24", 25)).not.toThrow();
    });

    it("ignores garbage after TC", function () {
        expect(TC_TO_FRAME("01:00:00:00 garbage", 24)).toEqual(86400);
        expect(TC_TO_FRAME("01:00:00:00 -1:00:00:00", 24)).toEqual(86400);
    });

    it("simple usage short tc 1s", function () {
        expect(TC_TO_FRAME("1:00", 24)).toEqual(24);
    });

    it("simple usage short tc 1m", function () {
        expect(TC_TO_FRAME("1:00:00", 24)).toEqual(24*60);
    });

    it("simple usage short tc 1m single digits", function () {
        expect(TC_TO_FRAME("1:0:0", 24)).toEqual(24*60);
    });

    it("multiline usage", function () {
        expect(TC_TO_FRAME("1:00:00:00\n1:00:00:01", 24)).toEqual("86400\n86401");
    });

    it("simple array usage", function () {
        expect(TC_TO_FRAME(["1:00:00:00","1:00:00:01"], 24)).toEqual([86400,86401]);
    });

    it("multi array usage", function () {
        expect(TC_TO_FRAME([["1:00:00:00","1:00:00:01"],["1:00:00:02","1:00:00:03"]], 24)).toEqual([[86400,86401],[86402,86403]]);
    });

    it("multi array usage with multiline", function () {
        expect(TC_TO_FRAME([["1:00:00:00\n1:00:00:01"],["1:00:00:02","2:00:00:03"]], 24)).toEqual([["86400\n86401"],[86402,2 * 86400 + 3]]);
    });

    it("multi array usage with multiline and errors", function () {
        expect(TC_TO_FRAME([
            ["1:00:00:00\n\n1:00:00,01"],
            [4221,"2:00:00:03"]
        ], 24))
        .toEqual([
            ["86400\n\nE_InvalidTimeCode: \"1:00:00,01\" does not seem to be a valid TC."],
            ['E_InvalidTimeCode: timeCode must be a string. (' + 4221 + ') given',2 * 86400 + 3]
        ]);
    });
});

