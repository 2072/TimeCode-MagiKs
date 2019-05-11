'use strict';


describe("TC_MagiK base API - MFROMI", () => {
    require("../app/tc.js");

    const testValues = [0, -654, 4654447984, 11654, 65, 4654, 1, 654654, 654, "", 22, 1654, 4,-32184975];
    const expected_result = testValues.map((v) => (v !== "") ?
                                           //       v    -  f              -           f              /    m
                                           ((v - (v % 24) - (((v - (v % 24)) / 24) % 60) * 24) / ( 60 * 24)) % 60
                                           : v
    );


    // note this function uses IFROMI internally so all error handling will not be tested again here
    it("simple usage", () => {
        expect(MFROMI(testValues[0], 24)).toEqual(expected_result[0]);
        expect(MFROMI(testValues[1], 24)).toEqual(expected_result[1]);
        expect(MFROMI(testValues[2], 24)).toEqual(expected_result[2]);
        expect(MFROMI(testValues[3], 24)).toEqual(expected_result[3]);

        expect(MFROMI(654654,24)).toEqual(34);
    });

    it("returns empty string if empty string given", () => {
        expect(MFROMI("", 24)).toEqual("");
    });

    it("simple array usage", () => {
        expect(MFROMI(testValues, 24)).toEqual(expected_result);
    });

    it("multiple array usage", () => {
        expect(MFROMI([testValues, testValues], 24)).toEqual([expected_result, expected_result]);
    });

    it("simple multiline usage", () => {
        expect(MFROMI(testValues.join("\n"), 24)).toEqual(expected_result.join("\n"));
    });

    it("multi array with multiline usage", () => {
        expect(MFROMI([
            [testValues.join("\n")].concat(testValues),
            testValues
        ], 24))
        .toEqual([
            [expected_result.join("\n")].concat(expected_result),
            expected_result
        ]);
    });

});
