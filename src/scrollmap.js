/**
 * Scrollmap.js
 * @author Ozy Wu-Li - @ousikaa
 * @description Scrolling map
 */

// https://github.com/jquery-boilerplate/jquery-patterns/blob/master/patterns/jquery.basic.plugin-boilerplate.js

import config from '../config';
import _debounce from 'lodash/debounce';
import _find from 'lodash/find';


// the semi-colon before the function invocation is a safety
// net against concatenated scripts and/or other plugins
// that are not closed properly.
// the anonymous function protects the `$` alias from name collisions
;(function( $, window, document, undefined ) {
    /**
     * Plugin name
     */
    let pluginName = 'Scrollmap';


    /**
     * Default Options
     */
    let defaultOptions = {
        data: null,
        debounceSpeed: 150,
        mapboxConfig: {
            container: 'scrollmap',
            style: 'mapbox://styles/aosika/cj8tmsx9cdk3m2rqmxbq8gr1b',
            // starting position (lng, lat),
            center: [0, 0],
            zoom: 1
        },
        markerConfig: {
            color: '#FFF',
            fontSize: '1.6rem',
            dimensions: {
                width: '45px',
                height: '60px'
            }
        }
    }


    /**
     * Scrollmap constructor
     */
    let Scrollmap = function( userOptions ) {
        // Combine/merge default and user options
        this.options = $.extend( true, defaultOptions, userOptions );
        // Init
        this.init();
        /**
         * Controller
         */
        this.controller = {
            afterMapInstantiation(map) {
                this.loaded(map);
            },
        }
    }


    /**
     * 
     */
    Scrollmap.prototype = {
        map: null,
        activeId: null,
        currentActiveId: null,
        allowPan: true,
        isSrolling: false,
        isMobile: true,
        mapOffset: null,
        isToggled: false,

        /**
         * Init
         */
        init() {
            this.checkScreenSize();
            this.initWindowResizeEvent();
            this.getMapHeight();
            this.instantiateMap();
            this.initToggleEvent();
            // console.log(this.options.geojson.features);

        },

        /**
         * Instantiate the map
         */
        instantiateMap() {
            // Map instance
            let map;
            // Mapbox access token
            mapboxgl.accessToken = config.mapboxAccessToken;
            // Instantiate mapbox
            map = new mapboxgl.Map(this.options.mapboxConfig);
                map.scrollZoom.disable();
                map.addControl(new mapboxgl.NavigationControl(), 'top-left');

            this.map = map;

            // Map load promise
            new Promise((resolve, reject) => {
                this.map.on('load', this.mapLoad.bind(this, resolve));
            }).then(this.afterMapLoad.bind(this, this.map));

        },

        /**
         * When map is loaded
         */
        mapLoad(resolve) {
            // Resolve map load promise
            resolve();

            this.options.geojson.features.forEach((marker, index) => {
                this.generateMarker(marker, index);
            })
        },

        /**
         * After map is loaded
         */
        afterMapLoad(map) {
            this.controller.afterMapInstantiation(map);
            // trigger scroll after map finishes loading
            this.scrollHandler();
            this.addScrollListener();
            this.initMarkerClickEvent();
        },

        /**
         * Handles the scroll event
         */
        scrollHandler() {
            for (let i = 0; i < this.options.geojson.features.length; i++) {
                let paneEl = document.querySelectorAll('.scrollmap-pane')[i];
                if (this.isElementOnScreen(paneEl)) {
                    console.log('el on screen');
                    this.activeId = paneEl.dataset.id;
                    break;
                } else if (window.scrollY === 0) {
                    this.resetScrollmap();
                    break;
                }
            }

            this.highlightActiveMarker(this.activeId);    
        },

        /**
         * 
         */
        resetScrollmap() {
            console.log('reset map');
            let markerImgEl = document.querySelectorAll('.marker-img');
            let markerEl = document.querySelectorAll('.marker');

            for (let i = 0; i < markerImgEl.length; i++) {
                markerImgEl[i].style.opacity = 0.5;
                markerImgEl[i].style.backgroundImage = 'url("/images/map-marker.png")';
                markerEl[i].style.zIndex = 10 - i;
            }

            this.map.panTo([100, 30]);
            this.currentActiveId = this.activeId = null;
        },

        /**
         * Check device screen size
         */
        checkScreenSize() {
            if (window.innerWidth > 760) {
                this.isMobile = false;
            } else {
                this.isMobile = true;
            }
        },


        /**
         * 
         */
        initWindowResizeEvent() {
            $(window).on('resize', () => {
                this.checkScreenSize();
                if (this.isToggled) {
                    this.toggleMap()
                }
            });
        },

        /**
         * 
         */
        getMapHeight() {
            let scrollmapEl = document.querySelector('.scrollmap-map');
            let scrollmapElStyle = window.getComputedStyle(scrollmapEl);
            let height = scrollmapElStyle.getPropertyValue('height');
            
            this.mapOffset = parseInt(height);
        },

        /**
         * Highlight active marker
         */
        highlightActiveMarker(activeId) {
            // if marker is already highlighted, don't highlight it again
            if (this.currentActiveId !== activeId) {
                // console.log('highlight');
                let markerImgEl = document.querySelectorAll('.marker-img');
                let markerEl = document.querySelectorAll('.marker');

                for (let i = 0; i < markerImgEl.length; i++) {
                    markerImgEl[i].style.opacity = 0.5;
                    markerImgEl[i].style.backgroundImage = 'url("/images/map-marker.png")';
                    markerEl[i].style.zIndex = 10 - i;
                }

                $(`.marker[data-id=${activeId}]`).css({
                    'z-index': 1000
                });
                $(`.marker[data-id=${activeId}]`).find('.marker-img').css({
                    'opacity': 1,
                    'background-image': 'url("/images/map-marker-active.png")',
                });

                _find(this.options.geojson.features, (item) => {
                    if (item.properties.id === activeId) {
                        this.panHandler(item.geometry.coordinates);
                    }
                });
            }

            // keep track of the activeId so that users don't fire `highlightActiveMarker` if a marker is already highlighted
            this.currentActiveId = activeId;
        },

        /**
         * Add scroll event listener
         */
        addScrollListener() {
            // console.log('add scroll listener');
            window.addEventListener('scroll', _debounce(this.scrollHandler.bind(this), this.options.debounceSpeed), true);
        },


        /**
         * 
         */
        panHandler(coords) {
            this.map.panTo(coords);
        },

        /**
         * Checks if element is on screen
         */
        isElementOnScreen(paneEl) {
            let bounds = paneEl.getBoundingClientRect();
            let elPos;

            if (this.isMobile) {
                elPos = bounds.top < (window.innerHeight - this.mapOffset) && (bounds.bottom - this.mapOffset) > 0;
            } else {
                elPos = (window.scrollY > bounds.top - 24) && (bounds.top < window.innerHeight) && (bounds.bottom > 0);
            }

            // console.log(elPos);

            return elPos;
        },

        /**
         * Generate a map marker
         */
        generateMarker(marker, index) {
            // console.log('generate marker');
            // Make marker element
            let markerEl = document.createElement('div');
            markerEl.className = 'marker';
            markerEl.style.width = this.options.markerConfig.dimensions.width;
            markerEl.style.height = this.options.markerConfig.dimensions.height;
            markerEl.style.zIndex = 10 - index;
            markerEl.dataset.id = marker.properties.id;

            // Make marker image
            let markerBgEl = markerEl.appendChild(document.createElement('div'));
            markerBgEl.className = 'marker-img';
            markerBgEl.style.position = 'absolute';
            markerBgEl.style.width = '100%';
            markerBgEl.style.height = '100%';
            markerBgEl.dataset.id = marker.properties.id;

            
            // Make marker number
            let markerElNumberEl = markerEl.appendChild(document.createElement('div'));
            markerElNumberEl.style.position = 'relative';
            markerElNumberEl.style.top = `-${parseFloat(this.options.markerConfig.fontSize) / 4}rem`;
            markerElNumberEl.style.color = this.options.markerConfig.color;
            markerElNumberEl.style.display = 'flex';
            markerElNumberEl.style.alignItems = 'center';
            markerElNumberEl.style.justifyContent = 'center';
            markerElNumberEl.style.width = '100%';
            markerElNumberEl.style.height = '100%';
            markerElNumberEl.style.zIndex = '1';
            markerElNumberEl.style.fontSize = this.options.markerConfig.fontSize;
            markerElNumberEl.dataset.id = marker.properties.id;
            let markerElNumberText = document.createTextNode(index + 1);

            markerElNumberEl.appendChild(markerElNumberText);

            // Marker config
            let markerInstance = new mapboxgl.Marker(markerEl, {
                offset: [-parseInt(this.options.markerConfig.dimensions.width) / 10, -parseInt(this.options.markerConfig.dimensions.height) / 2]
            })
                .setLngLat(marker.geometry.coordinates)
                .addTo(this.map);
        },

        /**
         * 
         */
        initMarkerClickEvent() {
            $(document).on('click', '.marker', (event) => {
                if (this.isToggled) {
                    this.toggleMap()
                    window.setTimeout(() => {
                        this.scrollMap(event);
                    }, 200)
                } else {
                    this.scrollMap(event);
                }
            })
        },

        /**
         * 
         */
        scrollMap(event) {
            console.log(event.currentTarget);
            let thisMarkerId = event.currentTarget.dataset.id;

            this.activeId = thisMarkerId;
            this.highlightActiveMarker(this.activeId);    

            let offset = $(`.scrollmap-pane[data-id=${thisMarkerId}]`)[0].offsetTop - 24;
            $('html, body').animate({
                scrollTop: offset
            });
        },

        /**
         * 
         */
        initToggleEvent() {
            $('.scrollmap__toggle-map').on('click', this.toggleMap.bind(this));
        },

        /**
         * 
         */
        toggleMap() {
            if (!this.isToggled) {
                $('.scrollmap-map').css('height', '100%');
                $('.scrollmap-content').css('display', 'none');
                $('.scrollmap-controls').css({
                    'position': 'fixed',
                    'top': 'auto',
                    'bottom': 0
                });
                this.isToggled = true;
            } else {
                $('.scrollmap-map, .scrollmap-content, .scrollmap-controls').removeAttr('style');
                this.isToggled = false;
            }

            this.map.resize();
   
        }

    } // Scrollmap.prototype




    /*------------------------------------*\
      Export 
    \*------------------------------------*/
    module.exports = Scrollmap;




})( jQuery, window , document );


