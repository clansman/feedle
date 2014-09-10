(function () {
    'use strict';

    angular.module('app.service', ['firebase'])
   // a simple utility to create $firebase objects from angularFire
   .service('SitesService', ['syncData', '$routeParams', function (syncData, $routeParams) {
       var color = null;
       var deferred = $q.defer();
       var $data = syncData('Sites/' + $routeParams.code);
       $data.$on('loaded', function (value) {
           color = value;
           deferred.resolve(value);
       });
       return {
           promise: deferred.promise,
           color: color,
           doStuff: function () {
               return color;//.getSomeData();
           }
       };
   }]);
})();