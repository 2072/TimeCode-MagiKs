'use strict';


describe("TC_MagiK base API - MFROMIRAW", function () {
    require("../app/tc.js");

    const testValues = [0, -654, 4654447984, 11654, 65, 4654, 1, 654654, 654, "", 22, 1654, 4,-32184975];
    const expected_result = testValues.map((v) =>  (v !== "") ?
                                           //       v    -  f              -           f              /    m
                                           ((v - (v % 24) - (((v - (v % 24)) / 24) % 60) * 24) / ( 60 * 24))
                                           : v);


    // note this function uses IFROMI internally so all error handling will not be tested again here
    it("simple usage",  () => {
        expect(MFROMIRAW(testValues[0], 24)).toEqual(expected_result[0]);
        expect(MFROMIRAW(testValues[1], 24)).toEqual(expected_result[1]);
        expect(MFROMIRAW(testValues[2], 24)).toEqual(expected_result[2]);
        expect(MFROMIRAW(testValues[3], 24)).toEqual(expected_result[3]);

        expect(MFROMIRAW(654654,24)).toEqual(7 * 60 + 34);
    });

    it("returns empty string if empty string given", () => {
        expect(MFROMIRAW("", 24)).toEqual("");
    });

    it("simple array usage", () => {
        expect(MFROMIRAW(testValues, 24)).toEqual(expected_result);
    });

    it("multiple array usage", () => {
        expect(MFROMIRAW([testValues, testValues], 24)).toEqual([expected_result, expected_result]);
    });

    it("simple multiline usage", () => {
        expect(MFROMIRAW(testValues.join("\n"), 24)).toEqual(expected_result.join("\n"));
    });

    it("multi array with multiline usage", () => {
        expect(MFROMIRAW([
            [testValues.join("\n")].concat(testValues),
            testValues
        ], 24))
        .toEqual([
            [expected_result.join("\n")].concat(expected_result),
            expected_result
        ]);
    });

});

