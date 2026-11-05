sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"scrum7/vanstockprofile/test/integration/pages/UploadsList.gen",
	"scrum7/vanstockprofile/test/integration/pages/UploadsObjectPage.gen"
], function (JourneyRunner, UploadsListGenerated, UploadsObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('scrum7/vanstockprofile') + '/test/flp.html#app-preview',
        pages: {
			onTheUploadsListGenerated: UploadsListGenerated,
			onTheUploadsObjectPageGenerated: UploadsObjectPageGenerated
        },
        async: true
    });

    return runner;
});

