sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"scrum7/vanstockprofiledisplay/test/integration/pages/ProfilesList.gen",
	"scrum7/vanstockprofiledisplay/test/integration/pages/ProfilesObjectPage.gen"
], function (JourneyRunner, ProfilesListGenerated, ProfilesObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('scrum7/vanstockprofiledisplay') + '/test/flp.html#app-preview',
        pages: {
			onTheProfilesListGenerated: ProfilesListGenerated,
			onTheProfilesObjectPageGenerated: ProfilesObjectPageGenerated
        },
        async: true
    });

    return runner;
});

