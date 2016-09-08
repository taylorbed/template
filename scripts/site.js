Y.use([
  'node',
  'squarespace-dynamic-data',
  'squarespace-gallery-ng',
  'history-hash',
  'squarespace-util'
], function(Y) {
  Y.on('domready', function() {

    // fix subnav margin, if title size makes it > 0
    if (Y.one('#topNav .subnav')) {
      subnavMarginTop = parseInt(Y.one('#topNav .subnav').getStyle('marginTop'),10);
      if (subnavMarginTop > 0) {
        Y.all('#topNav .subnav').setStyle('marginTop', 0);
      }
    }

    // Edge detect for dropdown folders.
    var edgeDetect = (function () {
      var folders = Y.all('#topNav .folder-collection .subnav');

      folders.each(function (folder) {
        if (folder.getDOMNode().getBoundingClientRect().right > Y.config.win.innerWidth) {
          folder.setStyles({
            left: 'auto',
            right: '-15px'
          });
        } else {
          folder.setStyles({
            left: '',
            right: ''
          });
        }
      });
    }());
    Y.one(window).on('resize', edgeDetect);

    // Mobile Nav
    var navLinks = Y.all('#mobileMenuLink a');
    if (navLinks) {
      navLinks.on('click', function(e){
         var mobileMenuHeight = parseInt(Y.one('#mobileNavWrapper').get('offsetHeight'),10);
         if (Y.one('#mobileNav').hasClass('menu-open')) {
           new Y.Anim({ node: Y.one('#mobileNav'), to: { height: 0 }, duration: 0.2, easing: 'easeBoth' }).run();
           new Y.Anim({ node: Y.one('#header'), to: { top: 0 }, duration: 0.2, easing: 'easeBoth' }).run();
         } else {
           new Y.Anim({ node: Y.one('#mobileNav'), to: { height: mobileMenuHeight }, duration: 0.2, easing: 'easeBoth' }).run();
           new Y.Anim({ node: Y.one('#header'), to: { top: mobileMenuHeight }, duration: 0.2, easing: 'easeBoth' }).run();
         }

         Y.one('#mobileNav').toggleClass('menu-open');
      });
    }

    // Mobile Nav Folders
    Y.all('.folder-toggle-label').each(function (label) {
      label.on('click', function () {
        Y.later(200, this, function() {

          if (Y.one('#mobileNavWrapper')) {
            var mobileNavWrapper = Y.one('#mobileNavWrapper');

            // force repaint for proper height
            mobileNavWrapper.setStyle('display', 'none');
            mobileNavWrapper.get('offsetHeight');
            mobileNavWrapper.setStyle('display', null);
          }

          var mobileMenuHeight = parseInt(mobileNavWrapper.get('offsetHeight'),10);
          if (Y.one('#mobileNav').hasClass('menu-open')) {
            new Y.Anim({ node: Y.one('#mobileNav'), to: { height: mobileMenuHeight }, duration: 0.2, easing: 'easeBoth' }).run();
            new Y.Anim({ node: Y.one('#header'), to: { top: mobileMenuHeight }, duration: 0.2, easing: 'easeBoth' }).run();
          }
        });
      });
    });

    // Set body width
    body = Y.one('body');
    bodyWidth = parseInt(body.getComputedStyle('width'),10);

    // Center align dropdown menus (when design is centered).
    if(Y.one('body').hasClass('layout-style-center')) {
      Y.all('#topNav .subnav').each( function(n){
        n.setStyle('marginLeft', -(parseInt(n.getComputedStyle('width'),10)/2) + 'px' );
      });
    }

    // Logo image logic
    var logoImageContainer = Y.one('.logo');

    function syncLogoImageContainer() {
      if(
        body.hasClass('logo-image') &&
        bodyWidth < 750 && logoImageContainer.one('img').get('offsetWidth') > logoImageContainer.one('img').get('offsetHeight')
      ) {
        logoImageContainer.addClass('landscape');
      } else {
        logoImageContainer.removeClass('landscape');
      }
    }

    syncLogoImageContainer();
    Y.one('window').on('resize', syncLogoImageContainer);


    // Project pages
    if (Y.one('#projectPages')) {
      thumbLoader();

      // thumbnail click events
      thumbClickHandler();

      // hash based page loading
      pageLoader();
      Y.on('hashchange', pageLoader);

      // project pagination
      Y.one('#projectNav').delegate('click', function(e) {
        var project = Y.one('#projectPages .active-project').previous('.project');
        if (project) {
          scrollToTop();
          window.location.hash = project.getAttribute('data-url');
        } else {
          e.currentTarget.addClass('disabled');
        }
      }, '.prev-project');

      Y.one('#projectNav').delegate('click', function(e) {
        var project = Y.one('#projectPages .active-project').next('.project');
        if (project) {
          scrollToTop();
          window.location.hash = project.getAttribute('data-url');
        } else {
          e.currentTarget.addClass('disabled');
        }
      }, '.next-project');

      // IE8 fix to get around unsupported nth-child selector
      if (0 < Y.UA.ie && Y.UA.ie < 9) {
        var columnSize = Y.Squarespace.Template.getTweakValue('TPerRow');
        if (columnSize) {
          columnSize = parseInt(columnSize);
          Y.all('#projectThumbs .project').each(function(project, index) {
            if (index % columnSize === 0) {
              project.setStyle('clear', 'left');
            }
          });
        }
      }

    }


    // GALLERY PAGES

    if (Y.one('body').hasClass('collection-type-gallery')) {

      if (bodyWidth < 750) {

        Y.all('img[data-src]').each(function(img, i) {
          Y.later(i * 100, this, function() { // lazy for mobile
            ImageLoader.load(img, { load: true });
          });
        });

        Y.all('.sqs-video-wrapper').each(function(video) {
          video.plug(Y.Squarespace.VideoLoader);
        });

      } else {

        var galleryAutoPlay = Y.Squarespace.Template.getTweakValue('gallery-auto-play') + "" === "true";
        var galleryPlaySpeed = 3000;
        if (Y.Squarespace.Template.getTweakValue('galleryPlaySpeed')) {
          galleryPlaySpeed = Y.Squarespace.Template.getTweakValue('galleryPlaySpeed') * 1000;
        }

        var windowHeight = Y.one('body').get('winHeight');
        var pagePadding = parseInt(Y.Squarespace.Template.getTweakValue('pagePadding'),10) * 2;
        var canvasPadding = (parseInt(Y.Squarespace.Template.getTweakValue('outerPadding'),10)*2) + (parseInt(Y.Squarespace.Template.getTweakValue('topPadding'),10) *2);
        var footerHeight = parseInt(Y.one('#footer').get('offsetHeight'),10);
        var topHeight = Y.one('#slideshowWrapper').getY();
        var toSubtract = topHeight + pagePadding + footerHeight + canvasPadding;

        if ((windowHeight - toSubtract) > 500) {
          Y.one('#slideshowWrapper').setStyle('height', windowHeight - toSubtract);
        } else {
          Y.one('#slideshowWrapper').setStyle('height', '500px');
        }


        Y.one('window').on('resize', function(e) {
          windowHeight = Y.one('body').get('winHeight');
          if ((windowHeight - toSubtract) > 500) {
            Y.one('#slideshowWrapper').setStyle('height', windowHeight - toSubtract);
          } else {
            Y.one('#slideshowWrapper').setStyle('height', '500px');
          }
          slideshow.refresh();
        });


        // full slideshow
        var slideshow = new Y.Squarespace.Gallery2({
          container: Y.one('#slideshow'),
          elements: {
            next: '.next-slide',
            previous: '.prev-slide',
            controls: '#dotControls, #numberControls, #tinyThumbControls'
          },
          loop: true,
          autoplay: galleryAutoPlay,
          autoplayOptions: {
            randomize: false,
            timeout: galleryPlaySpeed,
            pauseOnMouseover: []
          },
          design: 'stacked',
          designOptions: {
            autoHeight: false,
            preloadCount: Modernizr.touch ? 0 : 1
          },
          lazyLoad: true,
          loaderOptions: { mode: 'fit', load: false },
          historyHash: true
        });

        /* iPad fixes - reduce images preloaded, hide thumbs, load:false explicit */
        if (!Modernizr.touch) {
          Y.all('#tinyThumbControls img').each(function(img) {
            img.removeAttribute('data-load');
            ImageLoader.load(img);
          });
        }
      }
    }

    var body, bodyWidth;

    // SIDEBAR min-height set

    function setPageHeight() {
      var sidebarHeight;
      if (Y.one('#sidebar')) {
        sidebarHeight = Y.one('#sidebar').getComputedStyle('height');
      }
      if (sidebarHeight) {
        Y.one('#page').setStyle('minHeight', sidebarHeight);
      }
    }

    // run on page load
    setPageHeight();

    // run when sidebar width is tweaked
    if (Y.Squarespace.Management) {
      Y.Squarespace.Management.on('tweak', function(f){
        if (f.getName() == 'blogSidebarWidth' ) {
          setPageHeight();
        }
      });
    }

    // Squarespace referral tracking
    var footerReferralLink = Y.one('#footer a[href=http://www.squarespace.com]');
    if (footerReferralLink) {
      footerReferralLink.set('href', 'http://www.squarespace.com?channel=word_of_mouth&subchannel=customer&source=footer&campaign=' + Static.SQUARESPACE_CONTEXT.website.id);
    }

  });


  // GLOBAL FUNCTIONS
  var dynamicLoaders = {};

  function pageLoader() {

    if (window.location.hash && window.location.hash != '#') {
      var urlId = window.location.hash.split('#')[1];

      urlId = urlId.charAt(0) == '/' ? urlId : '/' + urlId;
      urlId = urlId.charAt(urlId.length-1) == '/' ? urlId : urlId + '/';

      var activePage = Y.one('#projectPages .project[data-url="'+urlId+'"]');

      if (!activePage) return;

      if (activePage.hasAttribute('data-type-protected') || !activePage.hasClass('page-project') && !activePage.hasClass('gallery-project')) { // navigate away for anything other than pages/galleries
        window.location.replace(urlId);
        return;
      }

      if (activePage.hasClass('page-project') && !activePage.hasClass('sqs-dynamic-data-ready')) {
        dynamicLoaders['#'+urlId].simulateHash(urlId);
      } else {
        Y.one('body').removeClass('index-loading');
      }

      // set active on projectPages
      Y.one('#page').addClass('page-open');
      Y.one('body').addClass('index-page-open'); // to help style components outside #page

      resetAudioVideoBlocks();

      // remove active class from all project pages/thumbs
      Y.all('.project.active-project').removeClass('active-project');

      activePage.addClass('active-project');

      // set active thumb
      Y.one('#projectThumbs a.project[href="'+urlId+'"]').addClass('active-project');

      // set active navigation
      if (activePage.next('.project')) {
        Y.one('#projectNav .next-project').removeClass('disabled');
      } else {
        Y.one('#projectNav .next-project').addClass('disabled');
      }
      if (activePage.previous('.project')) {
        Y.one('#projectNav .prev-project').removeClass('disabled');
      } else {
        Y.one('#projectNav .prev-project').addClass('disabled');
      }

      activePage.all('img.loading').each(function(img) {
        ImageLoader.load(img, { load: true });
      });

      activePage.all('.sqs-video-wrapper').each(function(video) {
        video.videoloader.load();
      });

      scrollToTop();

    } else { // no url hash

      // clear active on projectPages
      Y.one('#page').removeClass('page-open');
      Y.one('body').removeClass('index-page-open');

      resetAudioVideoBlocks();

      // remove active class from all project pages/thumbs
      Y.all('div.active-project').removeClass('active-project');
    }
  }

  function resetAudioVideoBlocks() {
    // Audio/video blocks need to be forced reset
    var preActive = Y.one('#projectPages .active-project');
    if (preActive && preActive.one('.video-block, .code-block, .embed-block, .audio-block')){
      Y.fire('audioPlayer:stopAll', {container: preActive });
      preActive.empty(true).removeClass('sqs-dynamic-data-ready').removeAttribute('data-dynamic-data-link');
    }

    if (preActive && preActive.one('.sqs-video-wrapper')) {
      preActive.all('.sqs-video-wrapper').each(function(elem) {
        !elem.ancestor('.sqs-gallery') && elem.videoloader.unload();
      });
    }
  }

  function thumbLoader() {
    var projectThumbs = Y.all('#projectThumbs img[data-src]');

    // lazy load on scroll
    var loadThumbsOnScreen = function() {
      projectThumbs.each(function(img) {
        if (img.inRegion(Y.one(Y.config.win).get('region'))) {
          ImageLoader.load(img, {
            load: true
          });
        }
      });
    };
    // loadThumbsOnScreen();
    // Y.on('scroll', loadThumbsOnScreen, Y.config.win);

    // Proactively lazy load
    var lazyImageLoader = Y.later(100, this, function() {
      var bInProcess = projectThumbs.some(function(img) {
        if (img.hasClass('loading')) { // something is loading... wait
          return true;
        } else if(!img.getAttribute('src')) { // start the loading
          ImageLoader.load(img, { load: true });
          return true;
        }
      });
      if (!bInProcess) {
        lazyImageLoader.cancel();
      }
    }, null, true);

    // also load/refresh on resize
    Y.one('window').on('resize', loadThumbsOnScreen);

    // Autocolumns
    var autocolumns;
    var autocolumnsGrid = function (tweakEvent) {
      if (autocolumns) {
        autocolumns.destroy();
      }

      if (Y.Squarespace.Template.getTweakValue('thumbnail-layout') != 'Autocolumns') {
        if (tweakEvent) {
          Y.all('.project').each(function (project) {
            project.removeAttribute('style');
          });
        }
      } else {
        var galleryValues = function () {
          var projectWidth = Y.one('#projectThumbs').get('clientWidth');
          var percentage = (parseInt(Y.Squarespace.Template.getTweakValue('TGutter'), 10) / 100);

          return {
            gutter: projectWidth * percentage,
            width: Y.Squarespace.Template.getTweakValue('TMaxWidth')
          };
        };

        autocolumns = new Y.Squarespace.Gallery2({
          container: '#projectThumbs .wrapper',
          design: 'autocolumns',
          designOptions: {
            mixedContent: true,
            aspectRatio: false,
            gutter: galleryValues().gutter,
            columnWidthBehavior: 'min',
            columnWidth: galleryValues().width
          },
          element: '.project',
          loaderOptions: {
            mode: 'fill',
            load: false
          },
          refreshOnResize: true
        });
      }

      if (tweakEvent) {
        Y.later(500, this, function () {
          Y.one(window).simulate('resize');
        });
      }
    };

    autocolumnsGrid();

    Y.Global.on(['tweak:change', 'tweak:aftershow', 'tweak:afterclose'], autocolumnsGrid);
  }


  function thumbClickHandler() {
    // only fetch pages via dynamic-loader
    Y.all('#projectThumbs a.project').each(Y.bind(function(elem) {
      var href = elem.getAttribute('href'),
          projPage = Y.one('#projectPages [data-url="'+href+'"]');
      // set dynamic loader for pages
      if (projPage && projPage.hasClass('page-project')) {
        dynamicLoaders['#'+href] = new Y.Squarespace.DynamicData({
            wrapper: '#projectPages [data-url="'+href+'"]',
            target: 'a.project[href="'+href+'"]',
            injectEl: Y.UA.ie ? '#page > *' : 'section > *',
            autoOpenHash: true,
            useHashes: true
        });
      } else {
        elem.on('click', function(e) {
          e.halt();
          window.location.hash = '#' + elem.getAttribute('href');
        });
      }
    }, this));
  }


  function scrollToTop(callback) {
    var scrollNodes = Y.UA.gecko || Y.UA.ie ? 'html' : 'body';
    new Y.Anim({
      node: scrollNodes,
      to: { scroll: [0, 0] },
      duration: 0.2,
      easing: Y.Easing.easeBoth
    }).run().on('end', function() {
      // Bug - yui anim seems to stop if target style couldnt be reached in time
      if (Y.one(scrollNodes).get('scrollTop') != 0) {
        Y.one(scrollNodes).set('scrollTop', 0);
      }
      if (callback) callback();
    });
  }


  function lazyOnResize(f,t) {
    var timer;
    Y.one('window').on('resize', function(e){
      if (timer) { timer.cancel(); }
      timer = Y.later(t, this, f);
    });
  }

  lazyOnResize(function(){
    Y.all('#projectThumbs img[data-src]').each(function(img){
      ImageLoader.load(img, {
        load: true
      });
    });
  }, 250)

});
