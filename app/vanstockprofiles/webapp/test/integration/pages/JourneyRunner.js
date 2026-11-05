sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"scrum8/vanstockprofiles/test/integration/pages/ProfilesList.gen",
	"scrum8/vanstockprofiles/test/integration/pages/ProfilesObjectPage.gen"
], function (JourneyRunner, ProfilesListGenerated, ProfilesObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('scrum8/vanstockprofiles') + '/test/flp.html#app-preview',
        pages: {
			onTheProfilesListGenerated: ProfilesListGenerated,
			onTheProfilesObjectPageGenerated: ProfilesObjectPageGenerated
        },
        async: true
    });

    return runner;
});

