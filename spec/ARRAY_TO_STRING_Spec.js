

describe("TC_MagiK extra API - ARRAY_TO_STRING", () => {
    'use strict';

    require("../app/tc.js");

    const testValue = [[1,2],[3,4]];

    it ("works", () => {
        expect(ARRAY_TO_STRING([1,2])).toEqual("1 :\t2");
        expect(ARRAY_TO_STRING([[1,2],[3,4]])).toEqual("1 :\t2\n3 :\t4");
        expect(ARRAY_TO_STRING([[1,2],[3,4, [5,6,7], 8, 9]])).toEqual("1 :\t2\n3\n4\n5 :\t6 :\t7\n8\n9");
    });
});
