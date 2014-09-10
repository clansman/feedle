(function () {
    'use strict';

    angular.module('app.service.google', [])
        .service('googleService', ['$http', '$rootScope', '$q', function ($http, $rootScope, $q) {
            var clientId = '912175431547',
                apiKey = 'AIzaSyA2zrUN9vl2kVhsh92hE5FSeCVc8OEY3bo',
                scopes = 'https://www.googleapis.com/auth/calendar',
               // domain = '{OPTIONAL DOMAIN}',
                deferred = $q.defer();

            this.login = function () {
                gapi.auth.authorize({
                    client_id: clientId,
                    scope: scopes,
                    immediate: false,
                    hd: domain
                }, this.handleAuthResult);

                return deferred.promise;
            }

            this.handleClientLoad = function () {
                gapi.client.setApiKey(apiKey);
                gapi.auth.init(function () { });
                window.setTimeout(checkAuth, 1);
            };

            this.checkAuth = function () {
                gapi.auth.authorize({
                    client_id: clientId,
                    scope: scopes,
                    immediate: true,
                    hd: domain
                }, this.handleAuthResult);
            };

            this.handleAuthResult = function (authResult) {
                if (authResult && !authResult.error) {
                    var data = {};
                    gapi.client.load('oauth2', 'v2', function () {
                        var request = gapi.client.oauth2.userinfo.get();
                        request.execute(function (resp) {
                            data.email = resp.email;
                        });
                    });
                    deferred.resolve(data);
                } else {
                    deferred.reject('error');
                }
            };

            this.handleAuthClick = function (event) {
                gapi.auth.authorize({
                    client_id: clientId,
                    scope: scopes,
                    immediate: false,
                    hd: domain
                }, this.handleAuthResult);
                return false;
            };

        }]);
})();
