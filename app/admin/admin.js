(function () {
    'use strict';
    var controllerId = 'admin';
    angular.module('app').controller(controllerId, ['common','$routeParams','SitesService', admin]);

    function admin(common, $routeParams, SitesService) {
      //  var color = SitesService.doStuff();
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);

        var vm = this;
        vm.title = 'Admin';
        SitesService.getColor().then(function(color) {
            vm.background = color;
            activate();
        });
        

        function activate() {
            common.activateController([], controllerId)
                .then(function () {  });
        }
    }
})();