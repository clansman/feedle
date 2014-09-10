(function () {
    'use strict';
    var controllerId = 'login';
    angular.module('app').controller(controllerId, ['common','$scope', '$location','$rootScope','loginService', login]);

    function login(common,$scope,$location, $rootScope, loginService) {
        loginService.init();
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logError = getLogFn(controllerId, 'logError');
        var vm = this;
        vm.email = null;
        vm.pass = null;
        vm.confirm = null;
        vm.firstName = null;
        vm.lastName = null;
        vm.createMode = false;
        vm.isLoading = false;
        vm.login = function (cb) {
            vm.isLoading = true;
            vm.err = null;
            if (!vm.email) {    
                vm.err = 'Введите email';
            }
            else if (!vm.pass) {
                vm.err = 'Введите пароль';
            }
            else {
                loginService.login(vm.email, vm.pass, function (err, user) {
                    if (err) {
                        vm.isLoading = false;
                        vm.err = err + '';
                    }
                    else {
                        vm.err = null;
                        if (cb) {
                            cb();
                        } else {
                            loginService.getUser(user.uid, function(userData) {
                                if (userData && userData.DefaultSite) {
                                    common.setLocation("/" + userData.DefaultSite.Code);
                                } else {
                                    logError("user doesn't have default site");
                                }
                            });
                        }
                    }
                });
            }
        };
        vm.logout = function() {
            loginService.logout();
            window.location.href = '/login';
        };
        vm.resetPass = function() {
            loginService.resetPass(vm.email).then(function() { log("email sent"); });
        };
        vm.createAccount = function () {
            vm.err = null;
            if (assertValidLoginAttempt()) {
                loginService.createAccount(vm.email, vm.pass, function (err, user) {
                    if (err) {
                        vm.err = err ? err + '' : null;
                    }
                    else {
                        // must be logged in before I can write to my profile
                        vm.login(function () {
                            loginService.createProfile(user.uid, user.email, vm.firstName, vm.lastName);
                            //$location.path('/account');
                        });
                    }
                });
            }
        };

        function assertValidLoginAttempt() {
            if (!vm.email) {
                vm.err = 'Please enter an email address';
            }
            else if (!vm.pass) {
                vm.err = 'Please enter a password';
            }
            else if (vm.pass !== vm.confirm) {
                vm.err = 'Passwords do not match';
            }
            return !vm.err;
        }
        loginService.getCurrentUser().then(function (curUser) {
            vm.alreadyLoggedIn = !!curUser;
            activate();
        });
        

        function activate() {
            var promises = [];
            common.activateController(promises, controllerId)
                .then(function () {});
        }
    }
})();