angular.module('app.services')

    .factory('gp', ['common', function (common) {
        var _items = [],
            _authors = { },
            _getLogFn = common.logger.getLogFn,
            log = _getLogFn('vk'),
            logError = _getLogFn('vk', 'logError');

        function getActivitiesByAuthorId(id, nextPageToken, count) {
            var def = common.$q.defer();
            _getActivitiesByPageUserId(id,count, nextPageToken)
                .then(function(w) {
                    var feedlePosts = _getFeedlePosts(w);
                    var author = _authors[id];
                    def.resolve({
                        posts: feedlePosts,
                        offset: author.nextPageToken
                    });
                });
            return def.promise;
        }

        function _getFeedlePosts(items) {
            var result = [];
            for (var i = 0; i < items.length; i++) {
                if (typeof items[i] === "object")
                    result.push(_parseGpPost(items[i]));
            }
            return result;
        }

        function _isRepost(post) {
            return post.verb == "share";
        }

        function _parseGpPost(post) {
            var imageUrl = null;
            var imageWidth = null;
            var imageHeight = null;
            var originalPost = null;
            var isRepost = _isRepost(post);
            var author = post.actor;
            if (!_authors[author.id]) {
                _authors[author.id] = { name: author.displayName, count: 1 };
            } else {
                _authors[author.id].name = author.displayName;
                _authors[author.id].count++;
            }
            if (isRepost) {
                var owner = post.object.actor;
                originalPost = {
                    name: owner.displayName,
                    screenName: owner.id,
                    authorId: owner.id,
                    avatar: owner.image.url,
                    text: post.object.content,
                };
            }
            if (post.object.attachments && post.object.attachments.length) {
                var attachment = post.object.attachments[0];
                if (attachment.objectType == 'photo' || attachment.objectType == 'video') {
                    var imageSize = _calcImageSize(attachment.fullImage, attachment.image, isRepost);
                    if (isRepost && originalPost) {
                        originalPost.imageUrl = attachment.image.url;
                        originalPost.imageWidth = imageSize.width;
                        originalPost.imageHeight = imageSize.height;
                    } else {
                        imageWidth = imageSize.width;
                        imageHeight = imageSize.height;
                        imageUrl = attachment.image.url;
                    }
                }
            }
            var date = moment.utc(post.published);
            return {
                text: isRepost ? null : post.object.content, //isRepost ? common.replaceUrlsWithTag(post.copy_text) : common.replaceUrlsWithTag(post.text),
                date: date.calendar(),
                dateUnix: date.format('X'),
                imageUrl: imageUrl,
                imageHeight: imageHeight,
                imageWidth: imageWidth,
                repostsCount: post.object.resharers.totalItems,
                likesCount: post.object.plusoners.totalItems,
                url: post.url,
                name: post.actor.displayName,
                avatar: post.actor.image.url,
                screenName: post.actor.id,
                originalPost: originalPost,
                authorId: post.actor.id,
                providerName: 'Google+',
                color:'#db4b39',
                id: post.id
            };
        }
        function _calcImageSize(fullImage, image, isRepost) {
            var maxwidth = isRepost ? 467 : 510;
            var size = { width: '100%', height: '100%' };
            var imageWidth = image.width || fullImage.width;
            var imageHeight = image.height || fullImage.height;
            if (imageWidth <= maxwidth) {
                size.width = imageWidth + 'px';
                size.height = imageHeight + 'px';
            } else {
                size.width = maxwidth + 'px';
                size.height = parseInt((maxwidth / imageWidth) * imageHeight) + 'px';
            }
            return size;
        }
        
        function _getUserId(url) {
            var parts = url.split('/');
            var gpIndex = parts.indexOf('plus.google.com');
            var code = parts[gpIndex + 1];
            return code;
        }

        function _resolveActivitiesGetResponse(def, resp) {
            if (resp && resp.items && resp.items.length) {
                var authorId = resp.items[0].actor.id;
                if (!_authors[authorId]) {
                    _authors[authorId] = { nextPageToken: resp.nextPageToken };
                } else {
                    _authors[authorId].nextPageToken = resp.nextPageToken;
                }
                _items = _items.concat(resp.items);
                def.resolve(resp.items);
            } else {
                if (resp.error) {
                    logError(resp.error.error_msg);
                    def.resolve();
                }
                def.reject(resp);
            }
        }

        function _getActivitiesByPageUserId(userId, count, nextPageToken) {
            var def = common.$q.defer();
            gapi.client.load('plus', 'v1', function () {
                var request = gapi.client.plus.activities.list({ userId: userId, collection: 'public', pageToken:nextPageToken, maxResults: count});
                request.execute(function (resp) {
                    console.log('activities ' + userId);
                    console.log(resp);
                    _resolveActivitiesGetResponse(def, resp, userId);
                });
            });
            return def.promise;
        }

        function isGpUrl(url) {
            return url.indexOf('plus.google.com/') > -1;
        }
        
        function getActivitiesByUrl(url, count) {
            var userId = _getUserId(url);
            return _getActivitiesByPageUserId(userId, count);
        }

        function getFeedlePostsFromPageUrls(pageUrls) {
            var def = common.$q.defer();
            var promises = [];
            _items = [];
            for (var i = 0; i < pageUrls.length; i++) {
                if (isGpUrl(pageUrls[i]) == false)
                    continue;
                var p = getActivitiesByUrl(pageUrls[i], 20);
                promises.push(p);
            }
            common.$q.all(promises).then(function() {
                var feedlePosts = _getFeedlePosts(_items);
                def.resolve(feedlePosts);
            });
            return def.promise;
        }

        function getAthors() {
            return _authors;
        }
        return {
            getAthors: getAthors,
            getActivitiesByAuthorId: getActivitiesByAuthorId,
            getFeedlePostsFromPageUrls: getFeedlePostsFromPageUrls
        };
    }]);