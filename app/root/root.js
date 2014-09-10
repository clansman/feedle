(function () {
    'use strict';
    var controllerId = 'root';
    angular.module('app').controller(controllerId, ['common', 'loginService', '$location', root]);
    function root(common,loginService, $location) {
        loginService.init();
        var getLogFn = common.logger.getLogFn;
        var logError = getLogFn(controllerId, 'logError');
        loginService.getCurrentUser().then(function(user) {
            if (user) {
                console.log(user);
                loginService.getUser(user.uid, function (userData) {
                    if (userData && userData.DefaultSite) {
                        common.setLocation("/" + userData.DefaultSite.Code);
                    } else {
                        logError("user doesn't have default site");
                    }
                });
            } else {
                $location.path("/feed");
            }
        });
        activate();

        function activate() {
            var promises = [];
            common.activateController(promises, controllerId)
                .then(function () { });
        }
    }
})();