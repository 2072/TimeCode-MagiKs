'use strict';


describe("TC_MagiK base API - IFROMI", () => {
    require("../app/tc.js");

    const testValues = [0, -654, 4654447984, 11654, 65, 4654, 1, 654654, 654, "", 22, 1654, 4,-32184975];
    const expected_result = testValues.map((v) => (v !== "") ? v % 24 : v);


    it("simple usage", () => {
        expect(IFROMI(testValues[0], 24)).toEqual(expected_result[0]);
        expect(IFROMI(testValues[1], 24)).toEqual(expected_result[1]);
        expect(IFROMI(testValues[2], 24)).toEqual(expected_result[2]);
        expect(IFROMI(testValues[3], 24)).toEqual(expected_result[3]);

        expect(IFROMI(654654,24)).toEqual(6);
    });

    it("returns empty string if empty string given", () => {
        expect(IFROMI("", 24)).toEqual("");
    });

    it("detects invalid framerate", () => {

        function _IFROMI(a,b) {
            return () => IFROMI(a,b)
        }

        expect(_IFROMI(testValues[3], -1*24)).toThrowError(E_InvalidFPS, /fps must be > 0/);
        expect(_IFROMI(testValues[3], 0)).toThrowError(E_InvalidFPS, /fps must be > 0/);
        expect(_IFROMI(testValues[3], 25.0)).not.toThrow();
        expect(_IFROMI(testValues[3], 25.1)).toThrowError(E_InvalidFPS, /Unsupported fps: /);
    });


    it("detects invalid value", () => {

        function _IFROMI(a,b) {
            return () => IFROMI(a,b)
        }

        expect(_IFROMI( 24.1, 24)).toThrowError(E_IntegerExpected, /Integer expected/);

        expect(_IFROMI(null, 24)).toThrowError(E_IntegerExpected, /Integer expected/);

        expect(_IFROMI("25", 24)).toThrowError(E_IntegerExpected, /Integer expected/);

        expect(_IFROMI(-25.0, 24)).not.toThrow();
    });

    it("simple array usage", () => {
        expect(IFROMI(testValues, 24)).toEqual(expected_result);
    });

    it("multiple array usage", () => {
        expect(IFROMI([testValues, testValues], 24)).toEqual([expected_result, expected_result]);
    });

    it("simple multiline usage", () => {
        expect(IFROMI(testValues.join("\n"), 24)).toEqual(expected_result.join("\n"));
    });

    it("multi array with multiline usage", () => {
        expect(IFROMI([
            [testValues.join("\n")].concat(testValues),
            testValues
        ], 24))
        .toEqual([
            [expected_result.join("\n")].concat(expected_result),
            expected_result
        ]);
    });

    it("multi array with multiline usage and errors", () => {
        expect(IFROMI([
            [['bad'].concat(testValues, [26.6]).join("\n")].concat(["2"], testValues, [null]),
            testValues
        ], 24))
        .toEqual([
            [["E_IntegerExpected: Integer expected: 'bad' given"].concat(expected_result, ["E_IntegerExpected: Integer expected: '26.6' given"]).join("\n")].concat("E_IntegerExpected: Integer expected: '2' of type 'string' given", expected_result, "E_IntegerExpected: Integer expected: 'null' of type 'object' given"),
            expected_result
        ]);
    });

});
