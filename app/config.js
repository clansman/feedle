(function () {
    'use strict';

    var app = angular.module('app');

    // Configure Toastr
    toastr.options.timeOut = 4000;
    toastr.options.positionClass = 'toast-bottom-right';

    // For use with the HotTowel-Angular-Breeze add-on that uses Breeze
    var remoteServiceName = 'breeze/Breeze';

    var events = {
        controllerActivateSuccess: 'controller.activateSuccess',
        spinnerToggle: 'spinner.toggle'
    };

    var config = {
        appErrorPrefix: '[HT Error] ', //Configure the exceptionHandler decorator
        docTitle: 'HotTowel: ',
        events: events,
        remoteServiceName: remoteServiceName,
        version: '2.1.0'
    };

    app.value('config', config);

    app.config(['$logProvider', '$locationProvider', '$sceDelegateProvider', function ($logProvider, $locationProvider, $sceDelegateProvider) {
        // turn debugging off/on (no info or warn)
        if ($logProvider.debugEnabled) {
            $logProvider.debugEnabled(true);
        }
        $locationProvider.html5Mode(true);
        $sceDelegateProvider.resourceUrlWhitelist([
            'http://zulfat.net/feedle/',
            'http://zulfat.net',
            'http://www.zulfat.net/feedle/',
            'http://zulfat.net/feedle/',
            'self']);
    }])
        .constant('version', '0.6')

        // where to redirect users if they need to authenticate (see module.routeSecurity)
        .constant('loginRedirectPath', '/login')

        // your Firebase URL goes here
        .constant('FBURL', 'https://zulfatfire.firebaseio.com:443');

    //#region Configure the common services via commonConfig
    app.config(['commonConfigProvider', function (cfg) {
        cfg.config.controllerActivateSuccessEvent = config.events.controllerActivateSuccess;
        cfg.config.spinnerToggleEvent = config.events.spinnerToggle;
    }]);
    //#endregion
})();