sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"scrum8/vanstockupload/test/integration/pages/UploadsList.gen",
	"scrum8/vanstockupload/test/integration/pages/UploadsObjectPage.gen"
], function (JourneyRunner, UploadsListGenerated, UploadsObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('scrum8/vanstockupload') + '/test/flp.html#app-preview',
        pages: {
			onTheUploadsListGenerated: UploadsListGenerated,
			onTheUploadsObjectPageGenerated: UploadsObjectPageGenerated
        },
        async: true
    });

    return runner;
});

