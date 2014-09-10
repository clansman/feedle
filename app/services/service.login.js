angular.module('app.service.login', ['firebase', 'app.service.firebase'])

   .factory('loginService', ['$rootScope', '$firebaseSimpleLogin', 'firebaseRef', 'profileCreator', '$timeout','common',
      function ($rootScope, $firebaseSimpleLogin, firebaseRef, profileCreator, $timeout, common) {
          var auth = null;
          return {
              init: function () {
                  return auth = $firebaseSimpleLogin(firebaseRef());
              },

              /**
               * @param {string} email
               * @param {string} pass
               * @param {Function} [callback]
               * @returns {*}
               */
              getUser:function(uid, cb) {
                  var userRef = firebaseRef('users/' + uid);
                  userRef.once('value', function (userData) {
                      cb(userData.val());
                  });
              },
              getCurrentUser:function() {
                  return auth.$getCurrentUser();
              },
              login: function (email, pass, callback) {
                  assertAuth();
                  auth.$login('password', {
                      email: email,
                      password: pass,
                      rememberMe: true
                  }).then(function (user) {
                      if (callback) {
                          //todo-bug https://github.com/firebase/angularFire/issues/199
                          $timeout(function () {
                              callback(null, user);
                          });
                      }
                  }, callback);
              },

              logout: function () {
                  assertAuth();
                  auth.$logout();
              },
              resetPass: function (email) {
                  assertAuth();
                  return auth.$sendPasswordResetEmail(email);
              },
              changePassword: function (opts) {
                  assertAuth();
                  var cb = opts.callback || function () { };
                  if (!opts.oldpass || !opts.newpass) {
                      $timeout(function () { cb('Please enter a password'); });
                  }
                  else if (opts.newpass !== opts.confirm) {
                      $timeout(function () { cb('Passwords do not match'); });
                  }
                  else {
                      auth.$changePassword(opts.email, opts.oldpass, opts.newpass).then(function () { cb && cb(null) }, cb);
                  }
              },

              createAccount: function (email, pass, callback) {
                  assertAuth();
                  auth.$createUser(email, pass).then(function (user) { callback && callback(null, user); }, callback);
              },

              createProfile: profileCreator
          };

          function assertAuth() {
              if (auth === null) { throw new Error('Must call loginService.init() before using its methods'); }
          }
      }])

   .factory('profileCreator', ['firebaseRef', '$timeout', function (firebaseRef, $timeout) {
       return function (id, email, firstName, lastName, callback) {
           firebaseRef('users/' + id).set({ email: email, name: firstPartOfEmail(email), firstName: firstName, lastName: lastName }, function (err) {
               //err && console.error(err);
               if (callback) {
                   $timeout(function () {
                       callback(err);
                   });
               }
           });

           function firstPartOfEmail(email) {
               return ucfirst(email.substr(0, email.indexOf('@')) || '');
           }

           function ucfirst(str) {
               // credits: http://kevin.vanzonneveld.net
               str += '';
               var f = str.charAt(0).toUpperCase();
               return f + str.substr(1);
           }
       }
   }]);
