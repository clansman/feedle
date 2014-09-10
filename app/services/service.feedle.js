angular.module('app.services')
    .factory('feedle', ['common', 'vk', 'gp', function(common, vk, gp) {

        var sortedPosts = null,
            vkAuthors = null,
            gpAuthors = null,
            _allAuthors = null;

        function _comparePostDates(p1, p2) {
            if (p1.dateUnix < p2.dateUnix)
                return 1;
            if (p1.dateUnix > p2.dateUnix)
                return -1;
            return 0;
        }

        function load(vkUrls, gpUrls) {
            var vkdef = common.$q.defer();
            var gpdef = common.$q.defer();
            sortedPosts = [];
            vkAuthors = {};
            gpAuthors = {};
            _allAuthors = { 'all': { name: "Все", count: 0 } };
            
            vk.getFeedlePostsFromPageUrls(vkUrls).then(function(posts) {
                sortedPosts = sortedPosts.concat(posts).sort(_comparePostDates);
                var vkauthors = vk.getAthors();
                for (var authorId in vkauthors) {
                    vkAuthors[authorId] = vkauthors[authorId];
                    _allAuthors[authorId] = vkauthors[authorId];
                }
                vkdef.resolve();
            });
            
            gp.getFeedlePostsFromPageUrls(gpUrls).then(function(posts) {
                sortedPosts = sortedPosts.concat(posts).sort(_comparePostDates);
                var gpauthors = gp.getAthors();
                for (var authorId in gpauthors) {
                    gpAuthors[authorId] = gpauthors[authorId];
                    _allAuthors[authorId] = gpauthors[authorId];
                }
                gpdef.resolve();
            });
            return common.$q.all([vkdef.promise, gpdef.promise]);
        }

        function getPosts(offset, count) {
            return sortedPosts.slice(offset, count);
        }

        function getPostsByAuthorId(id, offset, count) {
            if (!vkAuthors || vkAuthors[id]) {
                return vk.getWallByAuthorId(id, offset || 0, count || 40);
            } else {
                return gp.getActivitiesByAuthorId(id, offset || null, count || 40);
            }
        }

        function getAuthors() {
            return _allAuthors;
        }

        return {
            load: load,
            getPosts: getPosts,
            getAuthors: getAuthors,
            getPostsByAuthorId: getPostsByAuthorId
        };
    }]);