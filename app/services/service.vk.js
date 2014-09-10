angular.module('app.services')

    .factory('vk', ['common', function (common) {
        var _groups = [],
            _profiles = [],
            _wall = [],
            _authors = {},
            _getLogFn = common.logger.getLogFn,
            logError = _getLogFn('vk', 'logError');

        function _isGroupDomain(pageCode) {
            //todo public вконтакте может быть и в имени домена
            return pageCode.indexOf('public') != 0 && pageCode.indexOf('club') != 0;
        }
        
        function _getWallByDomain(domain, count) {
            var def = common.$q.defer();
            
            var apiOptions = {
                domain: domain,
                extended: 1,
                count: count
            };
            var apiCallback = function(resp) {
                _resolveApiResponse(def, resp, domain);
            };
            VK.Api.call('wall.get', apiOptions, apiCallback);
            
            return def.promise;
        }

        function _getWallById(wallId, count, offset) {
            var def = common.$q.defer();
            
            var apiCallback = function(resp) {
                _resolveApiResponse(def, resp, wallId);
            };
            var apiOptions = {
                owner_id: wallId,
                extended: 1,
                count: count || 20,
                offset: offset || 0
            };
            VK.Api.call('wall.get', apiOptions, apiCallback);
            
            return def.promise;
        }

        function _resolveApiResponse(def, resp, wallId) {
            if (wallId == 'apiclub')
                return;
            if (resp && resp.response && resp.response.wall) {
                if (resp.response.groups)
                    _groups = _groups.concat(resp.response.groups);
                if (resp.response.profiles)
                    _profiles = _profiles.concat(resp.response.profiles);
                _wall = _wall.concat(resp.response.wall);
                def.resolve(resp.response.wall);
            } else {
                if (resp.error) {
                    logError(resp.error.error_msg);
                    def.resolve();
                }
                def.reject(resp);
            }
            console.log('wall ' + wallId);
            console.log(resp);
        }
        
        function getWallByAuthorId(id, offset, count) {
            var def = common.$q.defer();
            _getWallById(id, count, offset).then(function (w) {
                var feedlePosts = _getFeedlePosts(w);
                var author = _authors[id];
                def.resolve({
                    posts: feedlePosts,
                    offset: author.count
                });
            });
            return def.promise;
        }
        
        function _findProfile(ownerId) {
            var profile = { Id: ownerId },
                owner;
            if (ownerId < 0 && _groups && _groups.length) {
                var gid = ownerId * -1;
                owner = _groups.filter(function(g) { return g.gid == gid; })[0];
            } else if (_profiles && _profiles.length) {
                owner = _profiles.filter(function(p) { return p.uid == ownerId; })[0];
            }
            profile.avatar = owner.photo;
            profile.screenName = owner.screen_name;
            if (ownerId < 0) {
                profile.name = owner.name;
            } else {
                profile.name = owner.first_name + ' ' + owner.last_name;
            }
            return profile;
        }

        function _getFeedlePosts(wall) {
            var result = [];
            for (var i = 1; i < wall.length; i++) {
                if (typeof wall[i] === "object")
                    result.push(_parseVkPost(wall[i]));
            }
            return result;
        }
        
        function _isRepost(post) {
            return post.post_type == "copy";
        }

        function _getPostUrl(post) {
            return 'https://vk.com/feed?w=wall' + post.from_id + '_' + post.id;
        }
        
        function _parseVkPost(post) {
            var imageUrl = null;
            var imageWidth = null;
            var imageHeight = null;
            var originalPost = null;
            var isRepost = _isRepost(post);
            var author = _findProfile(post.from_id);
            var link = null;
            if (!_authors[author.Id]) {
                _authors[author.Id] = { name: author.name, count: 1 };
            } else {
                _authors[author.Id].count++;
            }
            var ownerId = post.copy_commenter_id || post.copy_owner_id;
            if (isRepost && ownerId) {
                var owner = _findProfile(ownerId);
                originalPost = {
                    name: owner.name,
                    authorId:owner.id,
                    screenName: owner.screenName,
                    avatar: owner.avatar,
                    text: common.replaceUrlsWithTag(post.text),
                };
            }
            if (post.attachment && post.attachment.type) {
                var attachment = post.attachment[post.attachment.type];
                var imgUrl = null;
                if (post.attachment.type == 'photo') {
                    var imageSize = _calcImageSize(attachment, isRepost);
                    imageWidth = imageSize.width;
                    imageHeight = imageSize.height;
                    imgUrl = attachment.src_big;
                }
                if (post.attachment.type == 'video') {
                    imgUrl = attachment.image_xbig || attachment.image_big;
                    imageHeight = '240px';
                    /*var videoId = getVKVideoId(attachment.owner_id, attachment.vid, attachment.access_key);
                    getVkVideo(attachment.owner_id, videoId);*/
                }
                if (post.attachment.type == 'link') {
                    link = {
                        description: post.attachment.link.description,
                        previewUrl: post.attachment.link.preview_url,
                        awayUrl: post.attachment.link.url
                    };
                }
                if (isRepost && originalPost) {
                    originalPost.imageUrl = imgUrl;
                    originalPost.imageWidth = imageWidth;
                    originalPost.imageHeight = imageHeight;
                } else {
                    imageUrl = imgUrl;
                }
            }
            var postText = common.replaceUrlsWithTag(isRepost ? post.copy_text : post.text);
            
            return {
                text: postText,
                date: moment.unix(post.date).calendar(),
                dateUnix: post.date,
                imageUrl: imageUrl,
                imageHeight: imageHeight,
                imageWidth: imageWidth,
                repostsCount: post.reposts.count,
                likesCount: post.likes.count,
                url: _getPostUrl(post),
                name: author.name,
                avatar: author.avatar,
                screenName: author.screenName,
                originalPost: originalPost,
                authorId: author.Id,
                providerName: 'Вконтакте',
                color: '#a086d3',
                id: post.id,
                link: link
            };
        }

        function _calcImageSize(image, isRepost) {
            var maxwidth = isRepost ? 467 : 510;
            var size = { width: '100%', height: '100%' };
            if (image.width <= maxwidth) {
                size.width = image.width + 'px';
                size.height = image.height + 'px';
            } else {
                size.width = maxwidth + 'px';
                size.height = parseInt((maxwidth / image.width) * image.height) + 'px';
            }
            return size;
        }
        
        function _getPageCode(url) {
            var parts = url.split('/');
            var vkIndex = parts.indexOf('vk.com');
            var code = parts[vkIndex + 1];
            return code;
        }

        function _getWallByPageCode(code, count) {
            if (_isGroupDomain(code))
                return _getWallByDomain(code, count);
            else {
                code = '-' + code.replace('public', '').replace('club','');
                return _getWallById(code, count);
            }
        }
        
        function isVkUrl(url) {
            return url.indexOf('vk.com/') > -1;
        }
        
        function getWallByUrl(url, count) {
            var code = _getPageCode(url);
            return _getWallByPageCode(code, count);
        }

        function getFeedlePostsFromPageUrls(pageUrls) {
            console.log("get VK feed");
            console.log(pageUrls);
            var def = common.$q.defer();
            var promises = [];
            _wall = [];
            for (var i = 0; i < pageUrls.length; i++) {
                if (isVkUrl(pageUrls[i]) == false)
                    continue;
                (function(index) {
                    common.$timeout(function() {
                        var p = getWallByUrl(pageUrls[index], 20);
                        if (pageUrls[index] != 'http://vk.com/apiclub')
                            promises.push(p);
                    }, index * 500);
                })(i);
            }
            common.$timeout(function() {
                common.$q.all(promises).then(function() {
                    var feedlePosts = _getFeedlePosts(_wall);
                    def.resolve(feedlePosts);
                });
            }, 370 * pageUrls.length);
            return def.promise;
        }

        function getAthors() {
            return _authors;
        }
        
        return {
            wall: _wall,
            groups: _groups,
            profiles: _profiles,
            getAthors: getAthors,
            getWallByUrl: getWallByUrl,
            getWallByAuthorId: getWallByAuthorId,
            getFeedlePostsFromPageUrls:getFeedlePostsFromPageUrls,
            isVkUrl: isVkUrl
        };
    }]);