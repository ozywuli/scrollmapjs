(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Scrollmap = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var config = {
    mapboxAccessToken: 'pk.eyJ1IjoiYW9zaWthIiwiYSI6IjQzRGIxeEkifQ.7OvmyBbXwwt9Qxjlh9Qd3w'
};

exports.default = config;

},{}],2:[function(require,module,exports){
'use strict';

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// the semi-colon before the function invocation is a safety
// net against concatenated scripts and/or other plugins
// that are not closed properly.
// the anonymous function protects the `$` alias from name collisions
; /**
   * Scrollmap.js
   * @author Ozy Wu-Li - @ousikaa
   * @description Scrolling map
   */

// https://github.com/jquery-boilerplate/jquery-patterns/blob/master/patterns/jquery.basic.plugin-boilerplate.js

(function ($, window, document, undefined) {
    /**
     * 
     */
    var pluginName = 'Scrollmap';

    /**
     * Default Options
     */
    var defaultOptions = {
        mapboxConfig: {
            container: 'scrollmap',
            style: 'mapbox://styles/aosika/cj8tmsx9cdk3m2rqmxbq8gr1b',
            center: [0, 0],
            zoom: 1
        }

        /**
         * 
         */
    };var Scrollmap = function Scrollmap(userOptions) {
        this.options = $.extend(true, defaultOptions, userOptions);
        this.init();
        this.controller = {
            afterMapInstantiation: function afterMapInstantiation(map) {
                this.loaded(map);
            }
        };
    };

    /**
     * 
     */
    Scrollmap.prototype = {
        /**
         * 
         */
        init: function init() {
            this.instantiateMap();
        },

        /**
         * 
         */
        instantiateMap: function instantiateMap() {
            var _this = this;

            var map = void 0;

            mapboxgl.accessToken = _config2.default.mapboxAccessToken;
            map = new mapboxgl.Map(this.options.mapboxConfig);

            new Promise(function (resolve, reject) {
                map.on('load', function () {
                    resolve();
                });
            }).then(function () {
                _this.controller.afterMapInstantiation(map);
            });
        }
    };

    /*------------------------------------*\
      Export 
    \*------------------------------------*/
    module.exports = Scrollmap;
})(jQuery, window, document);

},{"../config":1}]},{},[2])(2)
});