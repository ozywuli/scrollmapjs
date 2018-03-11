/**
 * Scrollmap.js
 * @author Ozy Wu-Li - @ousikaa
 * @description Scrolling map
 */

// https://github.com/jquery-boilerplate/jquery-patterns/blob/master/patterns/jquery.basic.plugin-boilerplate.js

import config from '../config';
import getCentroid from './utils/getCentroid';
import _debounce from 'lodash/debounce';
import _throttle from 'lodash/throttle';
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
        throttleSpeed: 500,

        /**
         * Mapbox configuration
         */
        mapboxConfig: {
            container: 'scrollmap',
            style: 'mapbox://styles/aosika/cj8tmsx9cdk3m2rqmxbq8gr1b'
        }, // mapboxConfig

        /**
         * Map configuration
         */
        mapConfig: {
            offset: 0,
            center: {
                mobile: [0, 0],
                desktop: [0, 0]
            },
            zoom: {
                mobile: 1,
                desktop: 1
            }
        }, // mapConfig
        /**
         * Marker configuration
         */
        markerConfig: {
            color: '#FFF',
            fontSize: '1.6rem',
            dimensions: {
                width: '45px',
                height: '60px'
            },
            images: {
                default: '/images/map-marker.png',
                active: '/images/map-marker-active.png'
            }
        } // markerConfig
    } // defaultOptions{}


    /**
     * Scrollmap constructor
     */
    let Scrollmap = function( userOptions ) {
        // Combine/merge default and user options
        this.options = $.extend( true, defaultOptions, userOptions );

        /**
         * Init
         */
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
     * Protoype for ScrollMap
     */
    Scrollmap.prototype = {
        /*------------------------------------*\
          State
        \*------------------------------------*/
        map: null,
        activeId: null,
        currentActiveId: null,
        allowPan: true,
        isScrolling: false,
        isMobile: true,
        mapOffset: null,
        isToggled: false,

        geometryType: null,

        /**
         * Find geometry type
         */
        findGeometryType() {
            this.geometryType = this.options.geojson.features[0].geometry.type.toLowerCase();
        },

        /**
         * Init
         */
        init() {
            this.findGeometryType();
            this.checkScreenSize();
            this.initWindowResizeEvent();
            this.assignDynaMap();
            this.getMapHeight();
            this.instantiateMap();
            this.initToggleEvent();
        }, // init()


        /**
         * Assign initial center position
         */
        assignDynaMap() {
            if (this.isMobile) {
                this.options.mapboxConfig.center = this.options.mapConfig.center.mobile;
                this.options.mapboxConfig.zoom = this.options.mapConfig.zoom.mobile;
            } else {
                this.options.mapboxConfig.center = this.options.mapConfig.center.desktop;
                this.options.mapboxConfig.zoom = this.options.mapConfig.zoom.desktop;
            }
        }, // assignDynaMap()


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
                map.doubleClickZoom.disable();
                map.addControl(new mapboxgl.NavigationControl(), 'top-right');

            this.map = map;

            // Map load promise
            new Promise((resolve, reject) => {
                this.map.on('load', this.mapLoad.bind(this, resolve));
            }).then(this.afterMapLoad.bind(this, this.map));

        }, // instantiateMap()


        /**
         * When map is loaded
         */
        mapLoad(resolve) {
            // Resolve map load promise
            resolve();

            // Check if geojson containers either points or polygons
            if (this.geometryType === "point") {
                console.log('point');
                this.options.geojson.features.forEach((marker, index) => {
                    this.generateMarker(marker, index);
                })
            } else if (this.geometryType === "polygon") {
                console.log('polygon');
                this.options.geojson.features.forEach((polygon, index) => {
                    // Find and set the center for each polygon
                    polygon.geometry.center = getCentroid(polygon.geometry.coordinates[0]);
                    this.generatePolygon(polygon, index);
                    this.initPolygonClickEvent(polygon, index);
                })
            }
        }, // mapLoad()


        /**
         * After map is loaded
         */
        afterMapLoad(map) {
            this.controller.afterMapInstantiation(map);
            // trigger scroll after map finishes loading
            this.scrollHandler();
            this.addScrollListener();

            if (this.geometryType === "point") {
                this.initMarkerClickEvent();
            }
        }, // afterMapLoad()


        /**
         * Handles the scroll event
         */
        scrollHandler() {
            // console.log('throttling');
            if (!this.isScrolling) {
                if (!this.isToggled) {
                    for (let i = 0; i < this.options.geojson.features.length; i++) {
                        let paneEl = document.querySelectorAll('.scrollmap-pane')[i];
                        if (this.isElementOnScreen(paneEl)) {
                            this.activeId = paneEl.dataset.id;
                            break;
                        } else if (window.scrollY === 0) {
                            this.resetScrollmap();
                            break;
                        }
                    }

                    if (this.geometryType === 'point') {
                        this.highlightActiveMarker(this.activeId);    
                    } else if (this.geometryType === 'polygon') {
                        this.highlightActivePolygon(this.activeId);
                    }
                }
            }
        }, // scrollHandler()


        /**
         * Reset scrollmap
         */
        resetScrollmap() {
            if (this.geometryType === 'point') {
                let markerImgEl = document.querySelectorAll('.marker-img');
                let markerEl = document.querySelectorAll('.marker');

                for (let i = 0; i < markerImgEl.length; i++) {
                    markerImgEl[i].style.opacity = 0.5;
                    markerImgEl[i].style.backgroundImage = `url(${this.options.markerConfig.images.default})`;
                    markerEl[i].style.zIndex = 10 - i;
                }
            } else if (this.geometryType === 'polygon') {
                this.options.geojson.features.forEach((polygon, index) => {
                    this.map.setPaintProperty(polygon.properties.name.toLowerCase(), 'fill-opacity', 0.1);
                })
            }

            this.map.setZoom(defaultOptions.mapboxConfig.zoom);
            this.map.panTo(defaultOptions.mapboxConfig.center);
            this.currentActiveId = this.activeId = null;
        }, // resetScrollmap()


        /**
         * Check device screen size
         */
        checkScreenSize() {
            if (window.innerWidth > 760) {
                this.isMobile = false;
            } else {
                this.isMobile = true;
            }
        }, // checkScreenSize()


        /**
         * Initialize window resize event
         */
        initWindowResizeEvent() {
            $(window).on('resize.scrollmap', () => {
                this.checkScreenSize();
                if (this.isToggled) {
                    this.toggleMap()
                }
            });
        }, // initWindowResizeEvent()


        /**
         * Get the height of the map
         */
        getMapHeight() {
            let scrollmapEl = document.querySelector('.scrollmap-map');
            let scrollmapElStyle = window.getComputedStyle(scrollmapEl);
            let height = scrollmapElStyle.getPropertyValue('height');
            
            this.mapOffset = parseInt(height);
        }, // getMapHeight()


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
                    markerImgEl[i].style.backgroundImage = `url(${this.options.markerConfig.images.default})`;
                    markerEl[i].style.zIndex = 10 - i;
                }

                $(`.marker[data-id=${activeId}]`).css({
                    'z-index': 1000
                });
                
                $(`.marker[data-id=${activeId}]`).find('.marker-img').css({
                    'opacity': 1,
                    'background-image': `url(${this.options.markerConfig.images.active})`,
                });

                _find(this.options.geojson.features, (item) => {
                    if (item.properties.id === activeId) {
                        this.panHandler(item.geometry.coordinates);
                    }
                });
            }

            // keep track of the activeId so that users won't fire `highlightActiveMarker` if a marker is already highlighted
            this.currentActiveId = activeId;
        }, // highlightActiveMarker


        /**
         * Highlight active polygon
         */
        highlightActivePolygon(activeId) {
            // if marker is already highlighted, don't highlight it again
            if (this.currentActiveId !== activeId) {
                // console.log(this.currentActiveId);
                // Find the geoinfo item based on the corresponding polygon id
                _find(this.options.geojson.features, (item) => {
                    this.map.setPaintProperty(item.properties.name.toLowerCase(), 'fill-opacity', 0.1);
                    if (this.activeId === item.properties.name.toLowerCase()) {
                        this.map.setPaintProperty(this.activeId, 'fill-opacity', 1);
                        this.panHandler(item.geometry.center);
                    }
                });
            }

            // keep track of the activeId so that users won't fire `highlightActivePolygon` if a polygon is already highlighted
            this.currentActiveId = activeId;
        }, // highlightActivePolygon


        /**
         * Add scroll event listener
         */
        addScrollListener() {
            // console.log('add scroll listener');
            // window.addEventListener('scroll', _debounce(this.scrollHandler.bind(this), this.options.debounceSpeed), true);
            window.addEventListener('scroll', _throttle(this.scrollHandler.bind(this), this.options.throttleSpeed), true);
        }, // addScrollListener


        /**
         * Handle the pan event
         */
        panHandler(coords) {
            this.map.panTo(coords);
        }, // panHandler()

        /**
         * Checks if element is on screen
         */
        isElementOnScreen(paneEl) {
            let bounds = paneEl.getBoundingClientRect();
            let elPos;

            if (this.isMobile) {
                elPos = (window.scrollY > bounds.top) && 
                    (bounds.top < window.innerHeight) && 
                    (bounds.bottom - this.options.mapConfig.offset - parseInt($('.scrollmap-content').css('margin-top')) > 0);
            } else {
                elPos = (window.scrollY > bounds.top) && 
                    (bounds.top < window.innerHeight) && 
                    (bounds.bottom - this.options.mapConfig.offset > 0);
            }

            // console.log(elPos);

            return elPos;
        }, // isElementOnScreen

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
        }, // generateMarker()

        /**
         * Initialize marker click event
         */
        initMarkerClickEvent() {
            $('#scrollmap').on('click', '.marker', (event) => {
                if (this.isToggled) {
                    this.toggleMap()
                    window.setTimeout(() => {
                        this.scrollMap(event);
                    }, 200)
                } else {
                    this.scrollMap(event);
                }
            })
        }, // initMarkerClickEvent()


        /**
         * Generate Polygons
         */
        generatePolygon(polygon, index) {
            // console.log(polygon);

            // Holds the polygon fill
            let fill;

            // Find the geoinfo item based on the corresponding polygon id
            _find(this.options.geoinfo.features, (item) => {
                if (item.id === polygon.properties.name.toLowerCase()) {
                    fill = item.fill;
                }
            });

            // add each polygon to the map
            this.map.addLayer({
                'id': polygon.properties.name.toLowerCase(),
                'type': 'fill',
                'source': {
                    'type': 'geojson',
                    'data': polygon
                },
                'paint': {
                    'fill-color': fill,
                    'fill-opacity': 0.1
                },
            }, 'water');

        }, // generatePolygon()

        /**
         * Initialize polygon click event
         */
        initPolygonClickEvent(polygon, index) {
            this.map.on('click', polygon.properties.name.toLowerCase(), (event) => {
                if (this.isToggled) {
                    this.toggleMap()
                    window.setTimeout(() => {
                        this.scrollMap(event);
                    }, 200)
                } else {
                    this.scrollMap(event);
                }
            })
        }, // initPolygonClickEvent()


        /**
         * Scroll the map
         */
        scrollMap(event) {
            if (this.geometryType === 'point') {
                // get target ID
                let thisMarkerId = event.currentTarget.dataset.id;
                // Set the active marker ID
                this.activeId = thisMarkerId;
                // highlight marker based on active marker ID
                this.highlightActiveMarker(this.activeId);    
            } else if (this.geometryType === 'polygon') {
                let thisPolygonId = event.features[0].layer.id;
                this.activeId = thisPolygonId;
                this.highlightActivePolygon(this.activeId);
            }

            // set the offset for the scroll to pane
            let offset = $(`.scrollmap-pane[data-id=${this.activeId}]`)[0].offsetTop - 24;

            // Notify that scrolling has been initiated
            this.isScrolling = true;

            // animate scroll to the pane
            $('html').animate({
                scrollTop: offset
            }, 150, () => {
                // Notify that scrolling has been completed
                this.isScrolling = false;
            });
        }, // scrollmap()


        /**
         * Initialize map toggle event
         */
        initToggleEvent() {
            $('.scrollmap__toggle-map').on('click', this.toggleMap.bind(this));
        }, // initToggleEvent()


        /**
         * Toggles the map
         */
        toggleMap() {
            if (!this.isToggled) {
                $('.scrollmap-controls').addClass('is-toggled');
                $('.scrollmap-map').css('height', '100%');
                $('.scrollmap-content').css('display', 'none');
                $('.scrollmap-controls').css({
                    'position': 'fixed',
                    'top': 'auto',
                    'bottom': 0
                });
                this.isToggled = true;
            } else {
                $('.scrollmap-controls').removeClass('is-toggled');
                $('.scrollmap-map, .scrollmap-content, .scrollmap-controls').removeAttr('style');
                this.isToggled = false;
            }

            // Resize the map
            this.map.resize();
        } // toggleMap()

    } // Scrollmap.prototype




    /*------------------------------------*\
      Export 
    \*------------------------------------*/
    module.exports = Scrollmap;

})( jQuery, window , document );