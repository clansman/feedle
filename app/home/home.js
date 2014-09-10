(function () {
    'use strict';
    var controllerId = 'home';
    angular.module('app').controller(controllerId, ['common', 'datacontext', 'SitesService', home]);

    function home(common, datacontext, sitesService) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);

        var vm = this;
        vm.SiteCoverUrl = 'http://superb.lodossteam.com/assets/img/superb_cover.jpg';
        vm.SiteName = 'Зульфат Ильясов';
        vm.SiteDesciption = 'Приключения веб разработчика';
        vm.disqusId = 2733662;
        sitesService.getSiteSettings().then(function(siteSettings) {
            vm.SiteCoverUrl = siteSettings.CoverUrl;
            vm.SiteName = siteSettings.Name;
            vm.SiteDesciption = siteSettings.Description;
            vm.disqusId = siteSettings.MainDisqusId;
            vm.contentLoaded = true;
            //window.disqus_identifier = siteSettings.MainDisqusId;
            activate();
        });

        function activate() {
            var promises = [];
            common.activateController(promises, controllerId)
                .then(function () { });
        }

        function getMessageCount() {
            return datacontext.getMessageCount().then(function (data) {
                return vm.messageCount = data;
            });
        }

        function getPeople() {
            return datacontext.getPeople().then(function (data) {
                return vm.people = data;
            });
        }
    }
})();