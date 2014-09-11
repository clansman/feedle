(function () {
    'use strict';

    var app = angular.module('app');

    // Collect the routes
    app.constant('routes', getRoutes());
    
    // Configure the routes and route resolvers
    app.config(['$routeProvider', 'routes', routeConfigurator]);
    function routeConfigurator($routeProvider, routes) {
        routes.forEach(function (r) {
            $routeProvider.when(r.url, r.config);
        });
        $routeProvider.otherwise({ redirectTo: '/' });
    }

    // Define the routes 
    function getRoutes() {
        return [
             /*{a
                 url: '/',
                 config: {
                     templateUrl: function (params) {
                         return 'app/root/root.html';
                     }
                 }
             },*/{
                url: '/',
                config: {
                    templateUrl: function (params) {
                        return '/app/feed/feed.html';
                    },
                    title: 'feed',
                    reloadOnSearch: false
                }
            },{
                url: '/:code',
                config: {
                    templateUrl: function (params) {
                        return '/app/feed/feed.html';
                    },
                    title: 'feed',
                    reloadOnSearch: false
                }
            },{
                url: '/login',
                config: {
                    title: 'login',
                    templateUrl: function (params) {
                        return '/app/login/login.html';
                    }
                }
            }
            /*,{
                url: '/:code',
                config: {
                    templateUrl:function(params) {
                        return 'app/home/home.html';
                    },
                    title: 'home',
                    resolve: {
                        'SitesServiceData': function (SitesService) {
                            return SitesService.promise;
                        }
                    }
                }
            },{
                url: '/:code/admin',
                config: {
                    title: 'admin',
                    templateUrl:function(params) {
                        return 'app/admin/admin.html';
                    },
                    settings: {
                        nav: 2,
                        content: '<i class="fa fa-lock"></i> Admin'
                    },
                    resolve: {
                        'SitesServiceData':function(SitesService) {
                            return SitesService.promise;
                        }
                    }
                }
            }*/
        ];
    }
})();