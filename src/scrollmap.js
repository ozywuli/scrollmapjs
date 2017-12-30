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
        mapboxConfig: {
            container: 'scrollmap',
            style: 'mapbox://styles/aosika/cj8tmsx9cdk3m2rqmxbq8gr1b',
            center: [0, 0],
            zoom: 1
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

        /**
         * Init
         */
        init() {
            this.instantiateMap();
            this.addScrollListener();
            console.log(this.options.geojson.features);
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
        },

        /**
         * Handles the scroll event
         */
        scrollHandler() {
            for (let i = 0; i < this.options.geojson.features.length; i++) {
                let paneEl = document.querySelectorAll('.scrollmap-pane')[i];
                if (this.isElementOnScreen(paneEl)) {
                    this.activeId = paneEl.dataset.id;
                    break;
                }
            }

            _find(this.options.geojson.features, (item) => {
                if (item.properties.id === this.activeId) {
                    this.panHandler(item.geometry.coordinates);
                }
            });

        },

        /**
         * Add scroll event listener
         */
        addScrollListener() {
            window.addEventListener('scroll', _debounce(this.scrollHandler.bind(this), 150), true);
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
            return bounds.top < window.innerHeight && bounds.bottom > 0;
        },

        /**
         * Generate a map marker
         */
        generateMarker(marker, index) {
            // Make marker element
            let markerEl = document.createElement('div');
            markerEl.className = 'marker';
            markerEl.style.width = '45px';
            markerEl.style.height = '60px';
            markerEl.style.zIndex = 10 - index;
            markerEl.dataset.id = marker.properties.id;

            // Make marker image
            let markerBgEl = markerEl.appendChild(document.createElement('div'));
            markerBgEl.className = 'marker-img';
            markerBgEl.style.position = 'absolute';
            markerBgEl.style.width = '100%';
            markerBgEl.style.height = '100%';
            
            // Make marker number
            let markerElNumberEl = markerEl.appendChild(document.createElement('div'));
            markerElNumberEl.style.position = 'relative';
            markerElNumberEl.style.top = '-0.4rem';
            markerElNumberEl.style.color = '#FFF';
            markerElNumberEl.style.display = 'flex';
            markerElNumberEl.style.alignItems = 'center';
            markerElNumberEl.style.justifyContent = 'center';
            markerElNumberEl.style.width = '100%';
            markerElNumberEl.style.height = '100%';
            markerElNumberEl.style.zIndex = '1';
            markerElNumberEl.style.fontSize = '1.6rem';
            let markerElNumberText = document.createTextNode(index + 1);

            markerElNumberEl.appendChild(markerElNumberText);

            // Marker config
            let markerInstance = new mapboxgl.Marker(markerEl, {
                offset: [-22.5 / 2, -30 / 2]
            })
                .setLngLat(marker.geometry.coordinates)
                .addTo(this.map);

            // Add marker click event listener
            markerEl.addEventListener('click', (event) => {
                console.log(event.currentTarget.dataset.id);
            });
        }

    } // Scrollmap.prototype




    /*------------------------------------*\
      Export 
    \*------------------------------------*/
    module.exports = Scrollmap;




})( jQuery, window , document );


