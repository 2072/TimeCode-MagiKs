'use strict';


describe("TC_MagiK base API - FRAME_TO_DURATION", () => {

    require("../app/tc.js");


    function round2_(v) {
        return Math.round((v + 0.000001) * 100) / 100;
    }


    it("simple usage", () => {
        expect(FRAME_TO_DURATION(86400, 24)).toEqual("01h 00m 0s");
        expect(FRAME_TO_DURATION(0, 24)).toEqual("00h 00m 0s");

        expect(FRAME_TO_DURATION(86400 + 1, 24)).toEqual("01h 00m " + round2_(1/24) + "s");
        expect(FRAME_TO_DURATION(86400 + 23, 24)).toEqual("01h 00m " + round2_(23/24) + "s");

        expect(FRAME_TO_DURATION(86400 + 1  + 60 * 24, 24)).toEqual("01h 01m " + round2_(1/24) + "s");
        expect(FRAME_TO_DURATION(86400 + 23 + 60 * 24, 24)).toEqual("01h 01m " + round2_(23/24) + "s");
    });

    it("returns empty string if empty string given", () => {
        expect(FRAME_TO_DURATION("", 24)).toEqual("");
    });

    it("detects invalid framerate", () => {

        function _FRAME_TO_DURATION(a,b) {
            return () => FRAME_TO_DURATION(a,b)
        }

        expect(_FRAME_TO_DURATION(86400, -1*24)).toThrowError(E_InvalidFPS, /fps must be > 0/);
        expect(_FRAME_TO_DURATION(86400, 0)).toThrowError(E_InvalidFPS, /fps must be > 0/);
        expect(_FRAME_TO_DURATION(86400, 25.0)).not.toThrow();
        expect(_FRAME_TO_DURATION(86400, 25.1)).not.toThrow();
    });

    it("detects invalid frame numbers", () => {

        function _FRAME_TO_DURATION(a,b) {
            return () => FRAME_TO_DURATION(a,b)
        }

        expect(_FRAME_TO_DURATION(86400, 25.0)).not.toThrow();
        expect(_FRAME_TO_DURATION(86400.1, 25)).toThrowError(E_IntegerExpected, /Integer expected/);
        expect(_FRAME_TO_DURATION(.1, 25)).toThrowError(E_IntegerExpected, /Integer expected/);
        expect(_FRAME_TO_DURATION("86400", 25)).toThrowError(E_IntegerExpected, /Integer expected/);
        expect(_FRAME_TO_DURATION("86400 garbage", 25)).toThrowError(E_IntegerExpected, /Integer expected/);
        expect(_FRAME_TO_DURATION("HA!", 25)).toThrowError(E_IntegerExpected, /Integer expected/);
    });

    
    it("multiline usage", () => {
        expect(FRAME_TO_DURATION("86400\n86401", 24)).toEqual("01h 00m 0s\n"+"01h 00m " + round2_(1/24) + "s");
    });

    it("simple array usage", () => {
        expect(FRAME_TO_DURATION([86400,86401], 24)).toEqual(["01h 00m 0s","01h 00m " + round2_(1/24) + "s"]);
    });

    it("multi array usage", () => {
        expect(FRAME_TO_DURATION([[86400,86401],[86402,86403,86404]], 24)).toEqual([
            ["01h 00m 0s","01h 00m " + round2_(1/24) + "s"],
            ["01h 00m " + round2_(2/24) + "s","01h 00m " + round2_(3/24) + "s","01h 00m " + round2_(4/24) + "s"]
        ]);
    });

    it("multi array usage with multiline", () => {
        expect(FRAME_TO_DURATION([["86400\n86401"],["86402\n86403"]], 24)).toEqual([
            ["01h 00m 0s\n"+"01h 00m " + round2_(1/24) + "s"],
            ["01h 00m " + round2_(2/24) + "s\n"+"01h 00m " + round2_(3/24) + "s"]
        ]);

        expect(FRAME_TO_DURATION([["86400\n86401"],["86402  654 \n86403 ²garbage"]], 24))
        .toEqual([
            ["01h 00m 0s\n"+"01h 00m " + round2_(1/24) + "s"],
            ["E_IntegerExpected: Integer expected: '86402  654 ' given\nE_IntegerExpected: Integer expected: '86403 [...] rbage' given"]
        ]);
    });

    it("multi array usage with multiline and errors", () => {
        expect(FRAME_TO_DURATION( [
            ["86400\n8640a\na654"],
            [0.654654, 86400*2+3]
        ], 24))
        .toEqual([
            ["01h 00m 0s\nE_IntegerExpected: Integer expected: '8640a' given\nE_IntegerExpected: Integer expected: 'a654' given" ]
            , [ "E_IntegerExpected: Integer expected: '0.654654' of type 'number' given", "02h 00m " + round2_(3/24) + "s" ]
        ]);
    });

});
