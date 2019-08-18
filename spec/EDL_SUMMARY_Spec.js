
describe("TC_MagiK advanced API - EDL_SUMMARY", () => {

    'use strict';

    require("../app/tc.js");

    var SimpleValidEDL = [
        [1,	"AX",	"V",	"C",	"00:00:00:00",	"00:00:20:08",	"00:00:00:00",	"00:00:20:08"],
        [2,	"1",	"V",	"C",	"01:00:00:00",	"01:00:01:23",	"00:00:20:08",	"00:00:22:07"]
    ];

    function _EDL_SUMMARY(a,b) {
        return () => EDL_SUMMARY(a,b);
    }

    it("detects invalid framerate", () => {
        expect(_EDL_SUMMARY(SimpleValidEDL, -1)).toThrowError(E_InvalidFPS, /fps must be > 0/);
        expect(_EDL_SUMMARY(SimpleValidEDL, 0.1)).toThrowError(E_InvalidFPS);
    });

    it("detects invalid EDLs", () => {
        expect(_EDL_SUMMARY([], 24)).toThrowError(E_InvalidEDL, "EDL is empty");
        expect(_EDL_SUMMARY(54, 24)).toThrowError(E_InvalidEDL, "EDL must be an array");

        var SimpleInvalidEDL = [
            [1,	"AX",	"V",	"C",	"00:00:00:00",	"00:00:20:08",	"00:00:00:00",	"00:00:20:08"],
            [2,	"1",	"V",	"C",	"01:00:00:00",	"01:00:01:23",	"00:00:20:08"]
        ];

        expect(_EDL_SUMMARY(SimpleInvalidEDL, 24)).toThrowError(E_InvalidEDL, /each EDL row must be/);

        SimpleInvalidEDL = [
            [1,	"AX",	"V",	"C",	"00:00:00:00",	"00:00:20:08",	"00:00:00:00",	"00:00:20:08", 54],
            [2,	"1",	"V",	"C",	"01:00:00:00",	"01:00:01:23",	"00:00:20:25",	"00:00:22:07", 65]
        ];

        expect(_EDL_SUMMARY(SimpleInvalidEDL, 24)).toThrowError(E_InvalidEDL, /each EDL row must be.*num entries: 9/);

        SimpleInvalidEDL = [[]];

        expect(_EDL_SUMMARY(SimpleInvalidEDL, 24)).toThrowError(E_InvalidEDL, /each EDL row must be/);


    });

    it("detects invalid TCs in EDL and returns the event number", () => {
        var SimpleInvalidEDL = [
            [1,	"AX",	"V",	"C",	"00:00:00:00",	"00:00:20:08",	"00:00:00:00",	"00:00:20:08"],
            [2,	"1",	"V",	"C",	"01:00:00:00",	"01:00:01:23",	"00:00:20:25",	"00:00:22:07"]
        ];

        expect(_EDL_SUMMARY(SimpleInvalidEDL, 24)).toThrowError(E_InvalidEDL, 'event # 2: E_InvalidTimeCode: Illegal "25" found in TC');
    });

    it("detects incoherent source/record durations", () => {
        var SimpleInvalidEDL = [
            [1,	"AX",	"V",	"C",	"00:00:00:01",	"00:00:20:08",	"00:00:00:00",	"00:00:20:08"],
            [2,	"1",	"V",	"C",	"01:00:00:00",	"01:00:01:23",	"00:00:20:23",	"00:00:22:07"]
        ];

        expect(_EDL_SUMMARY(SimpleInvalidEDL, 24)).toThrowError(E_InvalidEDL, 'source length (487) does not match record length (488) on event # 1 - check frame rate');
    });

    it("detects null events", () => {
        var SimpleInvalidEDL = [
            [1,	"AX",	"V",	"C",	"00:00:00:00",	"00:00:20:08",	"00:00:00:00",	"00:00:20:08"],
            [2,	"1",	"V",	"C",	"01:00:01:23",	"01:00:01:23",	"00:00:20:23",	"00:00:20:23"]
        ];

        expect(_EDL_SUMMARY(SimpleInvalidEDL, 24)).toThrowError(E_InvalidEDL, 'invalid length detected on event # 2');
    });

    it("handles source mapping", () => {
        var SimpleValidEDLWithSourceMapping = [
            [1,	    "2",	"V",	"C",	            "00:00:00:00",	"00:00:20:08",	"00:00:00:00",	"00:00:20:08"],
            // source is an int and should be converted internally to a string else the following tests will fail
            [2,	    1,	"V",	"C",     "01:00:00:00",	    "01:00:01:23",	"00:00:20:08",	"00:00:22:07"                ],
            // source mapping ID is an int
            [">>>", "SOURCE",	 1,	"bobine_01_929364", "",                 "",             "",             ""           ],
            // source mapping ID is a string
            [">>>", "SOURCE",	"2",	"bobine_02_929364", "",                 "",             "",             ""           ],
        ];

        var result = _EDL_SUMMARY(SimpleValidEDLWithSourceMapping, 24)();

        expect(typeof result).toEqual("object");

        expect(result).toContain([ 'bobine_01_929364',  47, '00:00:01:23' ]);

        expect(result).toContain([ 'bobine_02_929364', 488, '00:00:20:08' ]);
    });

    it("handles TIME_CODE_MODULUS", () => {
        var SimpleValidEDLWithSourceMapping = [
            ["TIME_CODE_MODULUS:", 24, "", "", "", "", "", ""],
            [1,	    "2",	"V",	"C",	            "00:00:00:00",	"00:00:20:08",	"00:00:00:00",	"00:00:20:08"],
            // source is an int and should be converted internally to a string else the following tests will fail
            [2,	    1,	"V",	"C",     "01:00:00:00",	    "01:00:01:23",	"00:00:20:08",	"00:00:22:07"                ],
            // source mapping ID is an int
            [">>>", "SOURCE",	 1,	"bobine_01_929364", "",                 "",             "",             ""           ],
            // source mapping ID is a string
            [">>>", "SOURCE",	"2",	"bobine_02_929364", "",                 "",             "",             ""           ],
        ];

        var result = _EDL_SUMMARY(SimpleValidEDLWithSourceMapping)();

        expect(result).toContain([ 'bobine_01_929364',  47, '00:00:01:23' ]);

        expect(result).toContain([ 'bobine_02_929364', 488, '00:00:20:08' ]);
    });

    it("ignores TIME_CODE_MODULUS if fps is given", () => {
        var SimpleValidEDLWithSourceMapping = [
            ["TIME_CODE_MODULUS:", "Birds fly without fear of falling - AJ", "", "", "", "", "", ""],
            [1,	    "2",	"V",	"C",	            "00:00:00:00",	"00:00:20:08",	"00:00:00:00",	"00:00:20:08"],
            // source is an int and should be converted internally to a string else the following tests will fail
            [2,	    1,	"V",	"C",     "01:00:00:00",	    "01:00:01:23",	"00:00:20:08",	"00:00:22:07"                ],
            // source mapping ID is an int
            [">>>", "SOURCE",	 1,	"bobine_01_929364", "",                 "",             "",             ""           ],
            // source mapping ID is a string
            [">>>", "SOURCE",	"2",	"bobine_02_929364", "",                 "",             "",             ""           ],
        ];

        var result = _EDL_SUMMARY(SimpleValidEDLWithSourceMapping, 24)();

        expect(result).toContain([ 'bobine_01_929364',  47, '00:00:01:23' ]);

        expect(result).toContain([ 'bobine_02_929364', 488, '00:00:20:08' ]);
    });

    it("handles missing fps", () => {
        var SimpleValidEDLWithSourceMapping = [
            [1,	    "2",	"V",	"C",	            "00:00:00:00",	"00:00:20:08",	"00:00:00:00",	"00:00:20:08"],
            // source is an int and should be converted internally to a string else the following tests will fail
            [2,	    1,	"V",	"C",     "01:00:00:00",	    "01:00:01:23",	"00:00:20:08",	"00:00:22:07"                ],
            // source mapping ID is an int
            [">>>", "SOURCE",	 1,	"bobine_01_929364", "",                 "",             "",             ""           ],
            // source mapping ID is a string
            [">>>", "SOURCE",	"2",	"bobine_02_929364", "",                 "",             "",             ""           ],
        ];

        expect(_EDL_SUMMARY(SimpleValidEDLWithSourceMapping)).toThrowError(E_InvalidFPS, "no fps given and no TIME_CODE_MODULUS header found.");


    });

    // TODO tests missing M2 references, bad dissolve length, test for missing dissolve event parts (not implemented)

});
