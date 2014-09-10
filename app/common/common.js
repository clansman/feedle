(function() {
    'use strict';

    // Define the common module 
    // Contains services:
    //  - common
    //  - logger
    //  - spinner
    var commonModule = angular.module('common', []);

    // Must configure the common service and set its 
    // events via the commonConfigProvider
    commonModule.provider('commonConfig', function() {
        this.config = {
            // These are the properties we need to set
            //controllerActivateSuccessEvent: '',
            //spinnerToggleEvent: ''
        };

        this.$get = function() {
            return {
                config: this.config
            };
        };
    });
    commonModule.factory('common', ['$q', '$rootScope', '$routeParams', '$location', '$timeout', 'commonConfig', 'logger', common]);

    function common($q, $rootScope, $routeParams, $location, $timeout, commonConfig, logger) {
        var throttles = {};

        var service = {
            // common angular dependencies
            $broadcast: $broadcast,
            $q: $q,
            $timeout: $timeout,
            $routeParams: $routeParams,
            // generic
            activateController: activateController,
            createSearchThrottle: createSearchThrottle,
            debouncedThrottle: debouncedThrottle,
            isNumber: isNumber,
            logger: logger, // for accessibility
            textContains: textContains,
            setLocation: setLocation,
            shortenUrl: shortenUrl,
            replaceUrlsWithTag: replaceUrlsWithTag
        };

        return service;

        function activateController(promises, controllerId) {
            return $q.all(promises).then(function(eventArgs) {
                var data = {
                    controllerId: controllerId
                };
                $broadcast(commonConfig.config.controllerActivateSuccessEvent, data);
            });
        }

        function $broadcast() {
            return $rootScope.$broadcast.apply($rootScope, arguments);
        }

        function setLocation(path) {
            $location.path(path);
            $location.replace();
            $rootScope.$apply();
        }

        function replaceUrlsWithTag(text) {
            if (!text)
                return '';
            var result = text.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, function($0) {
                var shortUrl = shortenUrl($0);
                return "<a href='" + $0 + "' target='_blank'>" + shortUrl + "...</a>";
            });
            //var regexp = new RegExp('#([^\\s]*)', 'g');
            var regexp = new RegExp('\B#\w\w+', 'g');
            return result.replace(regexp, function($0) {
                return '<a class="hashtag" href="javascript:void(0)">' + $0 + '</a>';
            });
        }

        function shortenUrl(url, l) {
            var l = typeof(l) != "undefined" ? l : 50;
            var chunk_l = (l / 2);
            var url = url.replace("http://", "").replace("https://", "");

            if (url.length <= l) {
                return url;
            }

            var start_chunk = shortString(url, chunk_l, false);
            var end_chunk = shortString(url, chunk_l, true);
            return start_chunk + ".." + end_chunk;
        }

        function shortString(s, l, reverse) {
            var stop_chars = [' ', '/', '&'];
            var acceptable_shortness = l * 0.80; // When to start looking for stop characters
            var reverse = typeof(reverse) != "undefined" ? reverse : false;
            var s = reverse ? s.split("").reverse().join("") : s;
            var short_s = "";

            for (var i = 0; i < l - 1; i++) {
                short_s += s[i];
                if (i >= acceptable_shortness && stop_chars.indexOf(s[i]) >= 0) {
                    break;
                }
            }
            if (reverse) {
                return short_s.split("").reverse().join("");
            }
            return short_s;
        }

        function createSearchThrottle(viewmodel, list, filteredList, filter, delay) {
            // After a delay, search a viewmodel's list using 
            // a filter function, and return a filteredList.

            // custom delay or use default
            delay = +delay || 300;
            // if only vm and list parameters were passed, set others by naming convention 
            if (!filteredList) {
                // assuming list is named sessions, filteredList is filteredSessions
                filteredList = 'filtered' + list[0].toUpperCase() + list.substr(1).toLowerCase(); // string
                // filter function is named sessionFilter
                filter = list + 'Filter'; // function in string form
            }

            // create the filtering function we will call from here
            var filterFn = function() {
                // translates to ...
                // vm.filteredSessions 
                //      = vm.sessions.filter(function(item( { returns vm.sessionFilter (item) } );
                viewmodel[filteredList] = viewmodel[list].filter(function(item) {
                    return viewmodel[filter](item);
                });
            };

            return (function() {
                // Wrapped in outer IFFE so we can use closure 
                // over filterInputTimeout which references the timeout
                var filterInputTimeout;

                // return what becomes the 'applyFilter' function in the controller
                return function(searchNow) {
                    if (filterInputTimeout) {
                        $timeout.cancel(filterInputTimeout);
                        filterInputTimeout = null;
                    }
                    if (searchNow || !delay) {
                        filterFn();
                    } else {
                        filterInputTimeout = $timeout(filterFn, delay);
                    }
                };
            })();
        }

        function debouncedThrottle(key, callback, delay, immediate) {
            // Perform some action (callback) after a delay. 
            // Track the callback by key, so if the same callback 
            // is issued again, restart the delay.

            var defaultDelay = 1000;
            delay = delay || defaultDelay;
            if (throttles[key]) {
                $timeout.cancel(throttles[key]);
                throttles[key] = undefined;
            }
            if (immediate) {
                callback();
            } else {
                throttles[key] = $timeout(callback, delay);
            }
        }

        function isNumber(val) {
            // negative or positive
            return /^[-]?\d+$/.test(val);
        }

        function textContains(text, searchText) {
            return text && -1 !== text.toLowerCase().indexOf(searchText.toLowerCase());
        }
    }
})();