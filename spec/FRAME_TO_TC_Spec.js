'use strict';


describe("TC_MagiK base API - FRAME_TO_TC", () => {

    require("../app/tc.js");

    it("simple usage", () => {
        expect(FRAME_TO_TC(86400, 24)).toEqual("01:00:00:00");
        expect(FRAME_TO_TC(0, 24)).toEqual("00:00:00:00");
    });

    it("returns empty string if empty string given", () => {
        expect(FRAME_TO_TC("", 24)).toEqual("");
    });

    it("detects invalid framerate", () => {

        function _FRAME_TO_TC(a,b) {
            return () => FRAME_TO_TC(a,b)
        }

        expect(_FRAME_TO_TC(86400, -1*24)).toThrowError(E_InvalidFPS, /fps must be > 0/);
        expect(_FRAME_TO_TC(86400, 0)).toThrowError(E_InvalidFPS, /fps must be > 0/);
        expect(_FRAME_TO_TC(86400, 25.0)).not.toThrow();
        expect(_FRAME_TO_TC(86400, 25.1)).toThrowError(E_InvalidFPS, /Unsupported fps: /);
    });

    it("detects invalid frame numbers", () => {

        function _FRAME_TO_TC(a,b) {
            return () => FRAME_TO_TC(a,b)
        }

        expect(_FRAME_TO_TC(86400, 25.0)).not.toThrow();
        expect(_FRAME_TO_TC(86400.1, 25)).toThrowError(E_IntegerExpected, /Integer expected/);
        expect(_FRAME_TO_TC(.1, 25)).toThrowError(E_IntegerExpected, /Integer expected/);
        expect(_FRAME_TO_TC("86400", 25)).toThrowError(E_IntegerExpected, /Integer expected/);
        expect(_FRAME_TO_TC("86400 garbage", 25)).toThrowError(E_IntegerExpected, /Integer expected/);
        expect(_FRAME_TO_TC("HA!", 25)).toThrowError(E_IntegerExpected, /Integer expected/);
    });

    it("loops around on negative frame numbers", () => {
        expect(FRAME_TO_TC(-86400, 24.0)).toEqual("23:00:00:00");
        expect(FRAME_TO_TC(-1, 24.0)).toEqual("23:59:59:23");
        expect(FRAME_TO_TC(86400 * 365 * 24 * -1 - 1, 24.0)).toEqual("23:59:59:23");
    });

    it("loops around on very high frame numbers", () => {
        expect(FRAME_TO_TC(86400 * 47, 24.0)).toEqual("23:00:00:00");
        expect(FRAME_TO_TC(86400 * 365 * 24 -1, 24.0)).toEqual("23:59:59:23");
    });


    it("multiline usage", () => {
        expect(FRAME_TO_TC("86400\n86401", 24)).toEqual("01:00:00:00\n01:00:00:01");
    });

    it("simple array usage", () => {
        expect(FRAME_TO_TC([86400,86401], 24)).toEqual(["01:00:00:00","01:00:00:01"]);
    });

    it("multi array usage", () => {
        expect(FRAME_TO_TC([[86400,86401],[86402,86403,86404]], 24)).toEqual([["01:00:00:00","01:00:00:01"],["01:00:00:02","01:00:00:03","01:00:00:04"]]);
    });

    it("multi array usage with multiline", () => {
        expect(FRAME_TO_TC([["86400\n86401"],["86402\n86403"]], 24)).toEqual([["01:00:00:00\n01:00:00:01"],["01:00:00:02\n01:00:00:03"]]);

        expect(FRAME_TO_TC([["86400\n86401"],["86402  654 \n86403 ²garbage"]], 24))
        .toEqual([["01:00:00:00\n01:00:00:01"],["E_IntegerExpected: Integer expected: '86402  654 ' given\nE_IntegerExpected: Integer expected: '86403 [...] rbage' given"]]);
    });

    it("multi array usage with multiline and errors", () => {
        expect(FRAME_TO_TC( [
            ["86400\n8640a\na654"],
            [0.654654, 86400*2+3]
        ], 24))
        .toEqual([
            ["01:00:00:00\nE_IntegerExpected: Integer expected: '8640a' given\nE_IntegerExpected: Integer expected: 'a654' given" ]
            , [ "E_IntegerExpected: Integer expected: '0.654654' of type 'number' given", '02:00:00:03' ]
        ]);
    });

});
