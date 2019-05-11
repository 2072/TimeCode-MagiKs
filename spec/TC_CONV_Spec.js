'use strict';


describe("TC_MagiK base API - TC_CONV", function () {
    require("../app/tc.js");

    it("simple usage", function () {
        expect(TC_CONV("01:00:00:00", 24, 25)).toEqual("00:57:36:00");
        expect(TC_CONV("00:57:36:00", 25, 24)).toEqual("01:00:00:00");
        // identity test
        expect(TC_CONV("00:57:36:00", 25, 25)).toEqual("00:57:36:00");
        expect(TC_CONV("00:00:00:00", 24, 25)).toEqual("00:00:00:00");
    });

    it("returns empty string if empty string given", function () {
        expect(TC_CONV("", 24,25)).toEqual("");
    });

    it("detects invalid framerate", function () {

        function _TC_CONV(a,b,c) {
            return function () {TC_CONV(a,b,c)}
        }

        expect(_TC_CONV("01:00:00:00", -1*24, 25)).toThrowError(E_InvalidFPS, /fps must be > 0/);
        expect(_TC_CONV("01:00:00:00", 24, -1*25)).toThrowError(E_InvalidFPS, /fps must be > 0/);

        expect(_TC_CONV("01:00:00:00", 0, 25)).toThrowError(E_InvalidFPS, /fps must be > 0/);
        expect(_TC_CONV("01:00:00:00", 25, 0)).toThrowError(E_InvalidFPS, /fps must be > 0/);

        expect(_TC_CONV("01:00:00:00", 25.0, 24.0)).not.toThrow();

        expect(_TC_CONV("01:00:00:00", 25.1, 24)).toThrowError(E_InvalidFPS, /fractional fps are not supported yet!/);
        expect(_TC_CONV("01:00:00:00", 25, 24.1)).toThrowError(E_InvalidFPS, /fractional fps are not supported yet!/);
    });

    it("Detects invalid TCs", function () {

        function _TC_CONV(a,b,c) {
            return function () {TC_CONV(a,b,c)}
        }

        // bad format
        expect(_TC_CONV("01,00:00:00", 24, 25)).toThrowError(E_InvalidTimeCode);
        expect(_TC_CONV(" 01:00:00:00", 24, 25)).toThrowError(E_InvalidTimeCode);
        expect(_TC_CONV("-1:00:00:00", 24, 25)).toThrowError(E_InvalidTimeCode);
        expect(_TC_CONV("01:00:-1:00", 24, 25)).toThrowError(E_InvalidTimeCode);
        expect(_TC_CONV(25, 24, 25)).toThrow();
        expect(_TC_CONV(null, 24, 25)).toThrow();
        expect(_TC_CONV(NaN, 24, 25)).toThrow();
        expect(_TC_CONV(undefined, 24, 25)).toThrowError(E_InvalidTimeCode);

        // it must not throw on good format
        expect(_TC_CONV("01:00:00:00", 24, 25)).not.toThrow();

        // illegal numbers
        expect(_TC_CONV("25:00:00:00", 24, 25)).toThrowError(E_InvalidTimeCode);
        expect(_TC_CONV("24:00:00:00", 24, 25)).toThrowError(E_InvalidTimeCode);
        expect(_TC_CONV("01:60:00:00", 24, 25)).toThrowError(E_InvalidTimeCode);
        expect(_TC_CONV("01:00:60:00", 24, 25)).toThrowError(E_InvalidTimeCode);
        expect(_TC_CONV("01:00:00:24", 24, 25)).toThrowError(E_InvalidTimeCode);

        expect(_TC_CONV("01:00:00:24", 25, 25)).not.toThrow();
    });


    it("ignores garbage after TC", function () {
        expect(TC_CONV("01:00:00:00 garbage", 24, 25)).toEqual('00:57:36:00');
        expect(TC_CONV("01:00:00:00 -1:00:00:00", 24, 25)).toEqual('00:57:36:00');
    });

    it("simple usage short tc 1s", function () {
        expect(TC_CONV("1:00", 24, 25)).toEqual('00:00:00:24');
    });

    it("simple usage short tc 1m", function () {
        expect(TC_CONV("1:00:00", 24, 25)).toEqual('00:00:57:15');
    });

    it("simple usage short tc 1m single digits", function () {
        expect(TC_CONV("1:0:0", 24, 25)).toEqual('00:00:57:15');
    });

    it("simple array usage", function () {
        expect(TC_CONV(["1:00:00:00","1:00:00:01"], 24, 25)).toEqual(['00:57:36:00','00:57:36:01']);
    });

    it("multi array usage", function () {
        expect(TC_CONV([["1:00:00:00","1:00:00:01"],["1:00:00:02","1:00:00:03"]], 24, 25)).toEqual([['00:57:36:00','00:57:36:01'],['00:57:36:02','00:57:36:03']]);
    });

    it("multiline usage", function () {
        expect(TC_CONV("1:00:00:00\n1:00:00:01", 24, 25)).toEqual("00:57:36:00\n00:57:36:01");
    });

    it("multi array usage with multiline", function () {
        expect(TC_CONV([["1:00:00:00\n1:00:00:01"],["1:00:00:02","2:00:00:03"]], 24, 25)).toEqual([["00:57:36:00\n00:57:36:01"], ['00:57:36:02', '01:55:12:03']]);
    });

    it("multi array usage with multiline and errors", function () {
        expect(TC_CONV([
            ["1:00:00:a0\n1:00:00:00\n1:00:00,01"],
            [4221,"2:00:00:03"]
        ], 24, 25))
        .toEqual([
            ["E_InvalidTimeCode: \"1:00:00:a0\" does not seem to be a valid TC.\n00:57:36:00\nE_InvalidTimeCode: \"1:00:00,01\" does not seem to be a valid TC."]
            ,['E_InvalidTimeCode: timeCode must be a string. (' + 4221 + ') given', '01:55:12:03']
        ]);
    });

});

