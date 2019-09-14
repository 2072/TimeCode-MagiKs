describe("TC_MagiK advanced API - TC_MATCHBACK", () => {
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
    ];

    function _TC_MATCHBACK(timeCode, fps, a_edl, offset, ignoreBL) {
        return () => TC_MATCHBACK(timeCode, fps, a_edl, offset, ignoreBL);
    }

    // detect some standard errors but the whole EDL management is inherited
    // from the same part as EDL_SUMMARY so those tests are redundant
    it("detects invalid framerate", () => {
        expect(_TC_MATCHBACK("01:02:03:04", -1, SimpleValidEDL)).toThrowError(E_InvalidFPS, /fps must be > 0/);
        expect(_TC_MATCHBACK("01:02:03:04", 0.1, SimpleValidEDL)).toThrowError(E_InvalidFPS);
    });

    it("detects invalid EDLs", () => {
        expect(_TC_MATCHBACK("01:02:03:04",24,[])).toThrowError(E_InvalidEDL, "EDL is empty");
        expect(_TC_MATCHBACK("01:02:03:04",24, 44)).toThrowError(E_InvalidEDL, "EDL must be an array");
    });

    it("returns the correct result on simple queries and should not change the given EDL...", () => {
        expect(_TC_MATCHBACK("15:00:00:00",24, SimpleValidEDL)()).toContain("00:00:00:00");
        expect(_TC_MATCHBACK("15:00:00:01",24, SimpleValidEDL)()).toContain("00:00:00:01");
        expect(_TC_MATCHBACK("15:00:22:22",24, SimpleValidEDL)()).toContain("01:00:05:22");


        expect(_TC_MATCHBACK(["15:00:05:00", "15:00:12:00"],24, SimpleValidEDL)()).toEqual(["00:00:05:00 (s: CartonsDebut) (e: 1)", "00:00:12:00 (s: CartonsDebut) (e: 1)"]);
    });

    it("returns the correct result on array querries", () => {
        var querry = [
            ["15:00:00:00",	"15:00:05:00"],
            ["15:00:05:00",	"15:00:12:00"],
            ["15:00:12:00",	"15:00:16:23"],
            ["15:00:16:23",	"15:00:20:23"],
            ["15:00:20:23",	"15:00:27:10"]
        ];

        var expectedResult = [
            ["00:00:00:00 (s: CartonsDebut) (e: 1)",	"00:00:05:00 (s: CartonsDebut) (e: 1)"],
            ["00:00:05:00 (s: CartonsDebut) (e: 1)",	"00:00:12:00 (s: CartonsDebut) (e: 1)"],
            ["00:00:12:00 (s: CartonsDebut) (e: 1)",	"00:00:16:23 (s: CartonsDebut) (e: 1)"],
            ["00:00:16:23 (s: CartonsDebut) (e: 1)",	"01:00:03:23 (s: Bobine_01_254845) (e: 3)"],
            ["01:00:03:23 (s: Bobine_01_254845) (e: 3)",	"01:00:10:10 (s: Bobine_01_254845) (e: 9)"]
        ];

        expect(_TC_MATCHBACK(querry,24, SimpleValidEDL)()).toEqual(expectedResult);
    });

    it("throws exception when requested TC is not found in the EDL", () => {
        expect(_TC_MATCHBACK("01:00:05:22",24, SimpleValidEDL)).toThrowError(E_NotFoundInEDL, "record TC is located before EDL's first event, TC: 01:00:05:22");
        expect(_TC_MATCHBACK("15:00:42:08",24, SimpleValidEDL)).toThrowError(E_NotFoundInEDL, "record TC not found in EDL (gap ?), TC: 15:00:42:08");
        expect(_TC_MATCHBACK("19:00:05:22",24, SimpleValidEDL)).toThrowError(E_NotFoundInEDL, "record TC out-ran EDL record length, TC: 19:00:05:22");
    });


    var RawEDLWithM2_1 = "TITLE: t.Copy.01\n"+
        "FCM: NON-DROP FRAME\n"+
        "001  T1                V  C            01:00:05:18 01:00:05:19 07:07:23:04 07:07:28:03\n"+
        "M2   T1                   -24                      01:00:05:18\n"+
        "002  T1                V  C            01:00:00:19 01:00:00:19 07:07:28:03 07:07:28:03\n"+
        "002  T2                V  D 024        02:00:07:10 02:00:07:11 07:07:28:03 07:07:29:03\n"+
        "M2   T1                   -24                      01:00:00:19\n"+
        "M2   T2                   -12                      02:00:07:10\n"+
        "* BLEND, DISSOLVE\n"+
        "003  T2                V  C            02:00:06:22 02:00:06:23 07:07:29:03 07:07:40:08\n"+
        "M2   T2                   -12                      02:00:06:22\n"+
        "004  GENE_FIN_FR_6545  V  C            01:00:02:21 01:02:17:19 07:08:24:03 07:10:39:01\n";

    var RawEDLWithM2_2 = "TITLE:No title given\n"+
        "TIME_CODE_MODULUS:24\n"+
        "003  BOB07  V  C        07:07:37:02 07:07:40:06 07:07:29:03 07:07:40:08\n"+
        "M2   BOB07     6.7                    07:07:37:02\n";

    it("supports basic M2 motion effects", () => {
        var EDLWithM2_1 = EDLUtils_.rawEDLToArrays(RawEDLWithM2_1, 24, true);
        var EDLWithM2_2 = EDLUtils_.rawEDLToArrays(RawEDLWithM2_2, 24, true);

        expect(_TC_MATCHBACK("7:7:33:01",24, EDLWithM2_1)()).toEqual("02:00:04:23");
        expect(_TC_MATCHBACK("7:7:27:01",24, EDLWithM2_1)()).toEqual("01:00:01:21");
        expect(_TC_MATCHBACK("7:7:33:01",24, EDLWithM2_2)()).toEqual("07:07:38:04");

    });

});

