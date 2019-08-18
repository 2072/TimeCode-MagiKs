describe("TC_MagiK advanced sub-API - PARSE_RESOLVE_MARKER_EDL", () => {

    "use strict";

    require("../app/tc.js");


    var rawExample = `
TITLE: ( no title )

001  001      V     C        01:00:18:06 01:00:18:07 01:00:18:06 01:00:18:07  
Poil noire gauche cadre sur visage acteur |C:ResolveColorYellow |M:Marker 1 |D:1

002  001      V     C        01:00:20:20 01:00:20:21 01:00:20:20 01:00:20:21  
Son en avance de 2i sur les dialogues du 1er plan = Pour ex = synchro à valider en l'état |C:ResolveColorGreen |M:Marker 2 |D:1

003  001      V     C        01:00:42:21 01:00:42:22 01:00:42:21 01:00:42:22  
Tache d'eau en haut à gauche |C:ResolveColorBlue |M:Marker 3 |D:1

004  001      V     C        01:00:52:23 01:00:53:00 01:00:52:23 01:00:53:00  
Tache en eau du cadre vers le centre blanche |C:ResolveColorBlue |M:Marker 4 |D:1

005  001      V     C        01:01:44:10 01:01:44:11 01:01:44:10 01:01:44:11  
Insatbilité du cadre = Origine tournage = Pour ex |C:ResolveColorBlue |M:Marker 5 |D:1

006  001      V     C        01:27:06:16 01:27:06:17 01:27:06:16 01:27:06:17  
Trace de colle en haut + peétouille en haut = A  reprendre |C:ResolveColorYellow |M:Marker 88 |D:125512

007  001      V     C        01:04:55:22 01:04:55:23 01:04:55:22 01:04:55:23
test 25:01 |C:ResolveColorYellow |M:Yellow Marker |D:601

008  001      V     C        01:44:35:12 01:44:35:13 01:44:35:12 01:44:35:13  
 |C:ResolveColorBlue |M:Marker 130 |D:1

009  001      V     C        01:21:45:04 01:21:45:05 01:21:45:04 01:21:45:05  
Tache claire en haut a gauche et en bas
 |C:ResolveColorBlue |M:Marker 72 |D:1


`;

    var rawExampleBad1 = `
TITLE: ( no title )

001  001      V     C        01:00:18:06 01:00:18:07 01:00:18:09 01:00:18:10  
Poil noire gauche cadre sur visage acteur |C:ResolveColorYellow |M:Marker 1 |D:1

002  001      V     C        01:00:20:20 01:00:20:21 01:00:20:20 01:00:20:21  
Son en avance de 2i sur les dialogues du 1er plan = Pour ex = synchro à valider en l'état |C:ResolveColorGreen |M:Marker 2 |D:1
`;



     it("'s internal regex works", () => {

         var splitResult = rawExample.split(EDLUtils_.regex.c_r_RESOLVE_MARKER_ENTRY);

        expect(splitResult[1]).toMatch(/001  001      V     C        01:00:18:06 01:00:18:07 01:00:18:06 01:00:18:07\s+/);
        expect(splitResult[2]).toMatch(/Poil noire gauche cadre sur visage acteur \|C:ResolveColorYellow \|M:Marker 1 \|D:1\s+/);
        expect(splitResult[splitResult.length-2]).toMatch(/^\s+Tache claire en haut a gauche et en bas/);
        expect(splitResult[splitResult.length-3]).toMatch(/^009  001      V     C        01:21:45:04 01:21:45:05 01:21:45:04 01:21:45:05/);
//        expect(rawExample.split(c_r_RESOLVE_MARKER_ENTRY)).toEqual([]);
    });

    function _rawResolveEDLMarkerToArrays(a,b){
        return () => EDLUtils_.rawResolveEDLMarkerToArrays(a,b);
    }

    function _PARSE_RESOLVE_MARKER_EDL(a,b) {
        return () => PARSE_RESOLVE_MARKER_EDL(a,b);
    }

    it("detects invalid framerate", () => {
        expect(_rawResolveEDLMarkerToArrays(rawExample, -1)).toThrowError(E_InvalidFPS, /fps must be > 0/);
    });

    it("detects invalid EDLs", () => {
        expect(_rawResolveEDLMarkerToArrays("", 24)).toThrowError(E_InvalidEDL, /No Resolve marker/);
        expect(_rawResolveEDLMarkerToArrays(54, 24)).toThrowError(E_InvalidEDL, /EDL must be a string/);
    });


    var result = _rawResolveEDLMarkerToArrays(rawExample, 24)();

    it("returns an Array", () => {
        expect(result instanceof Array).toEqual(true);
    });

    it("returns the expected number of rows", () => {
        expect(result.length).toEqual(9);
    });

    it("returns the expected number of columns", () => {
        expect(result[0].length).toEqual(6, result[1].toString());
        expect(result[0].length).toEqual(6, result[2].toString());
    });

    it("computes the proper durations", () => {
        expect(result[0][1]).toEqual("", "single framed marker should have an empty end tc.");

        expect(result[5][1]).toEqual("01:27:09:16", "unexpected duration tc conversion on > 20000 marker duration");
        expect(result[5][5]).toEqual(72, "unexpected duration frame conversion on > 20000 marker duration");

        expect(result[6][1]).toEqual("01:05:20:23", "unexpected tc conversion on < 20000 marker duration");
        expect(result[6][5]).toEqual(601, "unexpected duration frame conversion on > 20000 marker duration");
    });

    it("accepts empty markers", () => {
        expect(result[6]).toEqual([ '01:04:55:22', '01:05:20:23', 'Yellow Marker', 'test 25:01', 'ResolveColorYellow', 601 ], "normal detection");
        expect(result[7]).toEqual([ '01:44:35:12', '',            'Marker 130',    ''          , 'ResolveColorBlue',     1 ], "empty comment should work");
    });

    it("detects source/record mismatch", () => {
        expect(_rawResolveEDLMarkerToArrays(rawExampleBad1, 24)).toThrowError(E_InvalidEDL, /Unexpected mismatch between source and record:/);
    });

    var rawExampleBad2 = `
TITLE: ( no title )

001  001      V     C        01:00:18:06 01:00:18:07 01:00:18:06 01:00:18:07  
001  001      V     C        01:00:18:06 01:00:18:07 01:00:18:06 01:00:18:07  
Poil noire gauche cadre sur visage acteur |C:ResolveColorYellow |M:Marker 1 |D:1

002  001      V     C        01:00:20:20 01:00:20:21 01:00:20:20 01:00:20:21  
Son en avance de 2i sur les dialogues du 1er plan = Pour ex = synchro à valider en l'état |C:ResolveColorGreen |M:Marker 2 |D:1
`;

    var rawExampleBad3 = `
TITLE: ( no title )

001  001      V     C        01:00:18:06 01:00:18:07 01:00:18:06 01:00:18:07  
Poil noire gauche cadre sur visage acteur |C:ResolveColorYellow |M:Marker 1 |D:1

002  001      V     C        01:00:20:20 01:00:20:21 01:00:20:20 01:00:20:21  
Son en avance de 2i sur les dialogues du 1er plan = Pour ex = synchro à valider en l'état |C:ResolveColorGreen |M:Marker 2 |D:1
Son en avance de 2i sur les dialogues du 1er plan = Pour ex = synchro à valider en l'état |C:ResolveColorGreen |M:Marker 2 |D:1
`;

    it("detects some bad formats", () => {
        //expect(_rawResolveEDLMarkerToArrays(rawExampleBad2, 24)).toThrowError(E_InvalidEDL, /Unexpected entry length \(4\) in marker edl:/);
        expect(_rawResolveEDLMarkerToArrays(rawExampleBad3, 24)).toThrowError(E_InvalidEDL, /Unexpected entry length \(4\) in marker edl:/);
    });

});
