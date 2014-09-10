(function () { 
    'use strict';
    
    var controllerId = 'shell';
    angular.module('app').controller(controllerId, ['$rootScope','$location', 'common', 'config', shell]);

    function shell($rootScope, $location, common, config) {
        var vm = this;
        var logSuccess = common.logger.getLogFn(controllerId, 'success');
        var events = config.events;
        //vm.busyMessage = 'загрузка..';
        $rootScope.isBusy = true;
        vm.spinnerOptions = {
            radius: 40,
            lines: 7,
            length: 0,
            width: 30,
            speed: 1.7,
            corners: 1.0,
            trail: 100,
            color: '#F58A00'
        };
        /*SitesService.getSiteSettings().then(function (settings) {
            vm.theme = "blue";
            $rootScope.themeShellUrl = "content/" + vm.theme + "/shell.html";
            activate();
            hideSplashPage();
        });*/
        vm.theme = "blue";
        $rootScope.themeShellUrl = "content/" + vm.theme + "/shell.html";
        $rootScope.showTopMenu = true;
        activate();
        //hideSplashPage();
        function activate() {
            console.log('angular loaded!', null, true);
            common.activateController([], controllerId);
        }

        function toggleSpinner(on) {
            vm.isBusy = on;
        }

        function toggleTopMenu(on) {
            $rootScope.showTopMenu = on;
        }
        function hideSplashPage() {
            var element = document.getElementById('splash');
            element.style.zIndex = 0;
            element.className = element.className + " hiddenSplash";
            element.style.display = 'none';
        }

        $rootScope.$on('$routeChangeStart',
            function (event, next, current) {
                 toggleSpinner(true);
            }
        );
        
        $rootScope.$on('$routeChangeSuccess',
            function (event, next, current) {
                toggleSpinner(true);
                if (next.$$route.title == 'login' || next.$$route.title == 'feed') {
                    toggleTopMenu(false);
                } else {
                    toggleTopMenu(true);
                }
            }
        );
        
        $rootScope.$on(events.controllerActivateSuccess,
            function(data) {
                 toggleSpinner(false);
            }
        );

        $rootScope.$on(events.spinnerToggle,
            function(scopeData, data) {
                 toggleSpinner(data.show);
            }
        );
    };
})();