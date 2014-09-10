angular.module('app.service.firebase', ['firebase'])

// a simple utility to create references to Firebase paths
   .factory('firebaseRef', ['Firebase', 'FBURL', function (Firebase, FBURL) {
       /**
        * @function
        * @name firebaseRef
        * @param {String|Array...} path
        * @return a Firebase instance
        */
       return function(path) {
           return new Firebase(pathRef([FBURL].concat(Array.prototype.slice.call(arguments))));
       };
   }])

   // a simple utility to create $firebase objects from angularFire
   .service('syncData', ['$firebase', 'firebaseRef', function ($firebase, firebaseRef) {
       /**
        * @function
        * @name syncData
        * @param {String|Array...} path
        * @param {int} [limit]
        * @return a Firebase instance
        */
       return function(path, limit) {
           var ref = firebaseRef(path);
           limit && (ref = ref.limit(limit));
           return $firebase(ref);
       };
   }])
   .service('SitesService', ['syncData', 'common', '$location', 'firebaseRef', function (syncData, common, $location, firebaseRef) {
        var siteSettings = null;
        var siteCode = getSiteCodeFromPath($location.$$path);
        var siteColorPromise = getSettingsForSite(siteCode);
        return {
            promise: siteColorPromise,
            color: siteSettings,
            getSiteSettings: function () {
                var currentSiteCode = getSiteCodeFromPath();
                if (siteCode == currentSiteCode && siteSettings) {
                    return common.$q.when(siteSettings);
                } else {
                    return getSettingsForSite(currentSiteCode);
                }
            }
        };

        function getSettingsForSite(currentSiteCode) {
            var deferred = common.$q.defer();
            if (!currentSiteCode || currentSiteCode == 'login') {
                deferred.resolve(null);
                return deferred.promise;
            }
            var ref = firebaseRef('Sites/' + currentSiteCode);
            ref.on("value", function (value) {
                common.$timeout(function () {
                    siteSettings = value.val();
                    siteCode = currentSiteCode;
                    console.log(siteSettings);
                    deferred.resolve(siteSettings);
                });
            });
            
            return deferred.promise;
        }
        function getSiteCodeFromPath() {
            var pathParts = $location.$$path.split('/');
            var code = pathParts[0] || pathParts[1];
            return code.toLowerCase();
        }
    }]);

function pathRef(args) {
    for (var i = 0; i < args.length; i++) {
        if (typeof (args[i]) === 'object') {
            args[i] = pathRef(args[i]);
        }
    }
    return args.join('/');
}