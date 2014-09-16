(function() {
    'use strict';
    var controllerId = 'feed';
    angular.module('app').controller(controllerId, ['common', '$routeParams', 'feedle', '$location', '$rootScope', 'loginService', 'commonConfig',
        feed
    ]);

    function feed(common, $routeParams, feedle, $location, $rootScope, loginService, commonConfig) {
        loginService.init();
        moment.lang('ru');
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var logError = getLogFn(controllerId, 'logError');
        var offsetId = 0;
        var vm = this;
        var isotopeActive = false;
        var $container = $('#postsContainer');
        var sortedPosts = [];
        vm.url = null;
        vm.viewClick = function() {
            vm.selectAuthor = null;
        };
        vm.err = null;
        vm.loaded = null;
        vm.avatar = null;
        vm.posts = [];
        vm.authors = {};
        vm.selectedAuthorId = null;
        vm.selectedAuthorName = 'Все';
        vm.loadingPosts = true;
        var pageUrls = [
            'http://vk.com/apiclub',
            'http://vk.com/rt_russian',
            'http://vk.com/shevchenko.maksim',
            'http://vk.com/agdugin',
            'http://vk.com/vestihitech',
            'http://vk.com/kzngo',
            'https://vk.com/dzhemal',
            'https://vk.com/soraxcss',
            'https://vk.com/habr',
            'https://vk.com/public486026'
        ];
        var gpPageUrls = [
            'https://plus.google.com/+Jqueryrain/posts',
            'https://plus.google.com/+NatGeo/posts',
            'https://plus.google.com/+AngularJS/posts',
            'https://plus.google.com/114636678211810483111/posts',
            'https://plus.google.com/+RT/posts'
        ];

        vm.setTicketPosition = function(index) {
            return {
                top: (index * 36 + 130) + 'px'
            };
        };
        vm.showFullText = function(pid) {
            $('#text' + pid).removeClass('ellipsis');
            $('#post' + pid).removeClass('hiding');
            $container.isotope('layout');
        };

        function isHiding(s) {
            s.wrapInner('<div />'); // wrap inner contents
            var hidden = s.height() < s.children('div').height();
            s.children('div').replaceWith(s.children('div').html()); //unwrap
            return hidden;
        }

        function checkTextHiding(element) {
            var quote = element.find('.quote').first();
            var hiding = isHiding(quote);
            if (hiding) {
                element.addClass('hiding');
            }
        }

        function showAuthorPostsOnPage(posts) {
            vm.posts = posts;
            common.$timeout(function() {
                $('.newItem').each(function() {
                    checkTextHiding($(this));
                    $(this).removeClass('newItem');
                });
                attachHoverEvent();
                activateIsotope();
                vm.loadingPosts = false;
                vm.loaded = true;
                scrollTo(0, 0);
                return;
            });
        }

        function attachHoverEvent() {
            $('.speech-bubble').hover(function() {
                $(this).find('.month').first().css('opacity', '0');
                $(this).find('.month').first().css('right', '15px');
                $(this).find('.read').first().css('opacity', '1');
                $(this).find('.read').first().css('right', '20px');
            }, function() {
                $(this).find('.month').first().css('opacity', '1');
                $(this).find('.month').first().css('right', '20px');
                $(this).find('.read').first().css('opacity', '0');
                $(this).find('.read').first().css('right', '50px');
            });
        }

        function activateIsotope() {
            if (isotopeActive) {
                $container.isotope('destroy');
                isotopeActive = false;
            }
            $container.isotope({
                resizable: true,
                itemSelector: '.speech-bubble',
                masonry: {
                    gutter: 40,
                    columnWidth: 530,
                    isFitWidth: true
                }
            });
            console.log('isotop initialized');
            isotopeActive = true;
        }

        function displayPostsByAuthorId(id) {
            vm.selectedAuthorId = id;
            if (vm.authors && vm.authors[id])
                vm.selectedAuthorName = vm.authors[id].name;
            if (!id || id == "all") {
                vm.posts = feedle.getPosts(0, 29);
                vm.authors = feedle.getAuthors();
                offsetId = 30;
                renderPostsUi();
                return null;
            } else {
                common.$broadcast(commonConfig.config.spinnerToggleEvent, {
                    show: true
                });
                return feedle.getPostsByAuthorId(id, 0, 40).then(function(obj) {
                    common.$broadcast(commonConfig.config.spinnerToggleEvent, {
                        show: false
                    });
                    showAuthorPostsOnPage(obj.posts);
                });
            }
        }

        $rootScope.$on('$routeUpdate', function(event, next, current) {
            if (next.params.authorId) {
                displayPostsByAuthorId(next.params.authorId);
            }
        });
        vm.filterByAuthor = function(id) {
            $location.search('authorId', id);
        };
        vm.loadMorePosts = function() {
            vm.loadingPosts = true;
            log('load more posts');
            if (vm.selectedAuthorId && vm.selectedAuthorId != "all") {
                var author = feed.getPostsByAuthorId(vm.selectedAuthorId);
                vk.getWallByAuthorId(vm.selectedAuthorId, vm.authors[vm.selectedAuthorId].count)
                    .then(function(w) {
                        vm.posts = vm.posts.concat(w);
                        common.$timeout(function() {
                            _appendNewItemsToIsotop(function() {
                                vm.authors = vk.getAthors();
                                vm.loadingPosts = false;
                                return;
                            });
                        });
                    });
            } else {
                var nextOffsetId = offsetId + 30;
                var nextPosts = feedle.getPosts(offsetId, nextOffsetId);
                vm.posts = vm.posts.concat(nextPosts);
                common.$timeout(_appendNewItemsToIsotop);
                offsetId = nextOffsetId;
                vm.loadingPosts = false;
            }
        };

        function renderPostsUi() {
            common.$timeout(function() {
                $('.newItem').each(function() {
                    checkTextHiding($(this));
                    $(this).removeClass('newItem');
                });
                attachHoverEvent();
                activateIsotope();
                vm.loadingPosts = false;
                vm.loaded = true;
                scrollTo(0, 0);
            });
        }
        vm.search = function(url) {
            common.$broadcast(commonConfig.config.spinnerToggleEvent, {
                show: true
            });
            feedle.load(pageUrls, gpPageUrls).then(function() {
                common.$broadcast(commonConfig.config.spinnerToggleEvent, {
                    show: false
                });
                vm.posts = feedle.getPosts(0, 29);
                vm.authors = feedle.getAuthors();
                offsetId = 30;
                renderPostsUi();
            });
        };

        function _appendNewItemsToIsotop(cb) {
            $('.newItem').each(function() {
                checkTextHiding($(this));
                attachHoverEvent();
                $container.isotope('appended', $(this));
                $(this).removeClass('newItem');
                if (cb)
                    cb();
            });
        }
        activate($routeParams.authorId);

        function activate(authorId) {
            console.log("activating");
            var p;
            if (authorId) {
                p = displayPostsByAuthorId(authorId);
            } else {
                p = feedle.load(pageUrls, gpPageUrls);
            }
            var promises = [p];
            common.activateController(promises, controllerId)
                .then(function() {
                    if (!authorId) {
                        vm.posts = feedle.getPosts(0, 29);
                        vm.authors = feedle.getAuthors();
                        offsetId = 30;
                        renderPostsUi();
                    }
                });
        }
    }
})();

function showFull(element) {
    $(element).parents('.quote').first().trunk8('revert');
    $('#postsContainer').isotope('layout');
    return false;
}
