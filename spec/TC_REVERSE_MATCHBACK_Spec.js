describe("TC_MagiK advanced API - TC_REVERSE_MATCHBACK", () => {
     'use strict';

    require("../app/tc.js");

    var SimpleValidEDL = [
        [	"TITLE:", "(Confo_Resolve_P1)", "", "", "", "", "", ""	],
        [	"TIME_CODE_MODULUS:", "24", "", "", "", "", "", ""	],
        [	"FCM:", "NON-DROP FRAME", "", "", "", "", "", ""	],
        [	1, "CartonsDebut", "V", "C", "00:00:00:00", "00:00:17:00", "15:00:00:00", "15:00:17:00"	],
        [	2, "Bobine_01_254845", "V", "C", "01:00:00:00", "01:00:03:23", "15:00:17:00", "15:00:20:23"	],
        [	3, "Bobine_01_254845", "V", "C", "01:00:03:23", "01:00:05:12", "15:00:20:23", "15:00:22:12"	],
        [	4, "Bobine_01_254845", "V", "C", "01:00:05:12", "01:00:05:22", "15:00:22:12", "15:00:22:22"	],
        [	5, "Bobine_01_254845", "V", "C", "01:00:05:22", "01:00:07:19", "15:00:22:22", "15:00:24:19"	],
        [	6, "Bobine_01_254845", "V", "C", "01:00:07:19", "01:00:08:02", "15:00:24:19", "15:00:25:02"	],
        [	7, "Bobine_01_254845", "V", "C", "01:00:08:02", "01:00:09:19", "15:00:25:02", "15:00:26:19"	],
        [	8, "Bobine_01_254845", "V", "C", "01:00:09:19", "01:00:10:10", "15:00:26:19", "15:00:27:10"	],
        [	9, "Bobine_01_254845", "V", "C", "01:00:10:10", "01:00:25:08", "15:00:27:10", "15:00:42:08"	],
        [	10, "Bobine_01_254845", "V", "C", "01:00:25:09", "01:00:29:17", "15:00:42:09", "15:00:46:17"	],
        [	691, "FIN_DE_LA_PREMIERE_PARTIE_[158400-158519]", "V", "C", "00:00:00:00", "00:00:05:00", "17:05:06:19", "17:05:11:19"	],
        [       1,   "DEUXIEME_PARTIE_[244800-244919]",	          "V", "C", "00:00:00:00", "00:00:05:00", "20:00:00:00", "20:00:05:00"  ],
        [       845,   "CartonFin_[748800-749039]",	          "V", "C", "00:00:00:00", "00:00:10:00", "22:09:35:23", "22:09:45:23"  ],
    ];


    function _TC_REVERSE_MATCHBACK(timeCode, fps, a_edl, offset, ignoreBL) {
        return () => TC_REVERSE_MATCHBACK(timeCode, fps, a_edl, offset, ignoreBL);
    }

    // detect some standard errors but the whole EDL management is inherited
    // from the same part as EDL_SUMMARY so those tests are redundant
    it("detects invalid framerate", () => {
        expect(_TC_REVERSE_MATCHBACK("01:02:03:04", -1, SimpleValidEDL)).toThrowError(E_InvalidFPS, /fps must be > 0/);
        expect(_TC_REVERSE_MATCHBACK("01:02:03:04", 0.1, SimpleValidEDL)).toThrowError(E_InvalidFPS);
    });

    it("detects invalid EDLs", () => {
        expect(_TC_REVERSE_MATCHBACK("01:02:03:04",24,[])).toThrowError(E_InvalidEDL, "EDL is empty");
        expect(_TC_REVERSE_MATCHBACK("01:02:03:04",24, 44)).toThrowError(E_InvalidEDL, "EDL must be an array");
    });

     it("throws exception when requested TC is not found in the EDL", () => {
        expect(_TC_REVERSE_MATCHBACK("01:00:35:22",24, SimpleValidEDL)).toThrowError(E_NotFoundInEDL, "source TC not found in EDL (not edited?), TC: 01:00:35:22");
    });

    it("returns the correct result on simple queries and should not change the given EDL...", () => {
        expect(_TC_REVERSE_MATCHBACK("00:00:00:00",24, SimpleValidEDL)()).toContain("15:00:00:00");
        expect(_TC_REVERSE_MATCHBACK("00:00:00:01",24, SimpleValidEDL)()).toContain("15:00:00:01");
        expect(_TC_REVERSE_MATCHBACK("01:00:05:22",24, SimpleValidEDL)()).toContain("15:00:22:22");


        expect(_TC_REVERSE_MATCHBACK(["00:00:05:00 (s: CartonsDebut) (e: 1)", "00:00:12:00 (s: CartonsDebut) (e: 1)"],24, SimpleValidEDL)())
            .toEqual(["15:00:05:00 (s: CartonsDebut) (e: 1)\n22:09:40:23 (s: CartonFin_[748800-749039]) (e: 845)", "15:00:12:00 (s: CartonsDebut) (e: 1)"]);
    });

    it("return the correct result on array querries", () => {
        var querry = [
            ["00:00:00:00 (s: CartonsDebut) (e: 1)",	"00:00:05:00 (s: CartonsDebut) (e: 1)"],
            ["00:00:05:00 (s: CartonsDebut) (e: 1)",	"00:00:12:00 (s: CartonsDebut) (e: 1)"],
            ["00:00:12:00 (s: CartonsDebut) (e: 1)",	"00:00:16:23 (s: CartonsDebut) (e: 1)"],
            ["00:00:16:23 (s: CartonsDebut) (e: 1)",	"01:00:03:23 (s: Bobine_01_254845) (e: 3)"],
            ["01:00:03:23 (s: Bobine_01_254845) (e: 3)",	"01:00:10:10 (s: Bobine_01_254845) (e: 9)"]
        ];

        var expectedResult = [

            ["15:00:00:00 (s: CartonsDebut) (e: 1)\n17:05:06:19 (s: FIN_DE_LA_PREMIERE_PARTIE_[158400-158519]) (e: 691)\n20:00:00:00 (s: DEUXIEME_PARTIE_[244800-244919]) (e: 1)\n22:09:35:23 (s: CartonFin_[748800-749039]) (e: 845)",
                "15:00:05:00 (s: CartonsDebut) (e: 1)\n22:09:40:23 (s: CartonFin_[748800-749039]) (e: 845)"],
            ["15:00:05:00 (s: CartonsDebut) (e: 1)\n22:09:40:23 (s: CartonFin_[748800-749039]) (e: 845)",
                "15:00:12:00 (s: CartonsDebut) (e: 1)"],
            ["15:00:12:00 (s: CartonsDebut) (e: 1)", "15:00:16:23 (s: CartonsDebut) (e: 1)"],
            ["15:00:16:23 (s: CartonsDebut) (e: 1)", "15:00:20:23 (s: Bobine_01_254845) (e: 3)"],
            ["15:00:20:23 (s: Bobine_01_254845) (e: 3)", "15:00:27:10 (s: Bobine_01_254845) (e: 9)"],
        ];

        expect(_TC_REVERSE_MATCHBACK(querry,24, SimpleValidEDL)()).toEqual(expectedResult);
    });

});
