'use strict';


describe("TC_MagiK base API - TC_OFFSET", function () {
    require("../app/tc.js");

    it("simple usage", function () {
        expect(TC_OFFSET("01:00:00:00", 25, 25)).toEqual("01:00:01:00");
        expect(TC_OFFSET("01:00:00:00", 25*3600, 25)).toEqual("02:00:00:00");
        expect(TC_OFFSET("01:00:00:00", -25, 25)).toEqual("00:59:59:00");
        expect(TC_OFFSET("00:00:00:00", -25, 25)).toEqual("23:59:59:00");
        expect(TC_OFFSET("00:57:36:00", (60-36)*24+2*60*24, 24)).toEqual("01:00:00:00");
        // identity test
        expect(TC_OFFSET("00:57:36:00", 0, 25)).toEqual("00:57:36:00");
        expect(TC_OFFSET("00:00:00:00", 0, 25)).toEqual("00:00:00:00");
        expect(TC_OFFSET("00:00:00", 0, 25)).toEqual("00:00:00:00");
        expect(TC_OFFSET("00:00", 0, 25)).toEqual("00:00:00:00");
        expect(TC_OFFSET("00", 0, 25)).toEqual("00:00:00:00");
    });


    it("returns empty string if empty string given", function () {
        expect(TC_OFFSET("", 24,25)).toEqual("");
    });

    it("detects invalid framerate", function () {

        function _TC_OFFSET(a,b,c) {
            return function () {TC_OFFSET(a,b,c)}
        }

        expect(_TC_OFFSET("01:00:00:00", 24, -1*25)).toThrowError(E_InvalidFPS, /fps must be > 0/);
        expect(_TC_OFFSET([["01:00:00:00"],["01:00:01:00"]], 24, -1*25)).toThrowError(E_InvalidFPS, /fps must be > 0/);

        expect(_TC_OFFSET("01:00:00:00", 25, 0)).toThrowError(E_InvalidFPS, /fps must be > 0/);

        expect(_TC_OFFSET("01:00:00:00", 25.0, 24.0)).not.toThrow();

        expect(_TC_OFFSET("01:00:00:00", 25, 24.1)).toThrowError(E_InvalidFPS, /fractional fps are not supported yet!/);
    });

    it("detects invalid offset", function () {

        function _TC_OFFSET(a,b,c) {
            return function () {TC_OFFSET(a,b,c)}
        }

        expect(_TC_OFFSET("01:00:00:00", 24.1, 24)).toThrowError(E_IntegerExpected, /Integer expected/);
        expect(_TC_OFFSET([["01:00:00:00"],["01:00:01:00"]], 24.1, 24)).toThrowError(E_IntegerExpected, /Integer expected/);

        expect(_TC_OFFSET("01:00:00:00", null, 24)).toThrowError(E_IntegerExpected, /Integer expected/);

        expect(_TC_OFFSET("01:00:00:00", "25", 24)).toThrowError(E_IntegerExpected, /Integer expected/);

        expect(_TC_OFFSET("01:00:00:00", -25.0, 24)).not.toThrow();
    });


    it("Detects invalid TCs", function () {

        function _TC_OFFSET(a,b,c) {
            return function () {TC_OFFSET(a,b,c)}
        }

        // bad format
        expect(_TC_OFFSET("01,00:00:00",  24, 25)).toThrowError(E_InvalidTimeCode);
        expect(_TC_OFFSET(" 01:00:00:00", 24, 25)).toThrowError(E_InvalidTimeCode);
        expect(_TC_OFFSET("-1:00:00:00",  24, 25)).toThrowError(E_InvalidTimeCode);
        expect(_TC_OFFSET("01:00:-1:00",  24, 25)).toThrowError(E_InvalidTimeCode);
        expect(_TC_OFFSET(25, 24, 25)).toThrow();
        expect(_TC_OFFSET(null, 24, 25)).toThrow();
        expect(_TC_OFFSET(NaN, 24, 25)).toThrow();
        expect(_TC_OFFSET(undefined, 24, 25)).toThrowError(E_InvalidTimeCode);

        // it must not throw on good format
        expect(_TC_OFFSET("01:00:00:00", 24, 25)).not.toThrow();

        // illegal numbers
        expect(_TC_OFFSET("25:00:00:00", 24, 25)).toThrowError(E_InvalidTimeCode);
        expect(_TC_OFFSET("24:00:00:00", 24, 25)).toThrowError(E_InvalidTimeCode);
        expect(_TC_OFFSET("01:60:00:00", 24, 25)).toThrowError(E_InvalidTimeCode);
        expect(_TC_OFFSET("01:00:60:00", 24, 25)).toThrowError(E_InvalidTimeCode);
        expect(_TC_OFFSET("01:00:00:24", 24, 24)).toThrowError(E_InvalidTimeCode);

        expect(_TC_OFFSET("01:00:00:24", 25, 25)).not.toThrow();
    });

    it("simple array usage", function () {
        expect(TC_OFFSET(["1:00:00:00","1:00:00:01"], 25, 25)).toEqual(['01:00:01:00','01:00:01:01']);
    });

    it("multi array usage", function () {
        expect(TC_OFFSET([["1:00:00:00","1:00:00:01"],["1:00:00:02","1:00:00:03"]], 24, 24)).toEqual([['01:00:01:00','01:00:01:01'],['01:00:01:02','01:00:01:03']]);
    });

    it("multiline usage", function () {
        expect(TC_OFFSET("1:00:00:00\n1:00:00:01", 25, 25)).toEqual("01:00:01:00\n01:00:01:01");
    });

    it("multi array usage with multiline", function () {
        expect(TC_OFFSET([["1:00:00:00\n\n1:00:00:01"],["1:00:00:02","2:00:00:03"]], 24, 24)).toEqual([["01:00:01:00\n\n01:00:01:01"], ['01:00:01:02', '02:00:01:03']]);
    });

    it("multi array usage with multiline and errors", function () {
        expect(TC_OFFSET([
            ["1:00:00:00\n1:00:00,01"],
            [4221,"2:00:00:03"]
        ], 25, 25))
        .toEqual([
            ['01:00:01:00\nE_InvalidTimeCode: "1:00:00,01" does not seem to be a valid TC.']
            ,['E_InvalidTimeCode: timeCode must be a string. (' + 4221 + ') given', '02:00:01:03']
        ]);
    });
});
