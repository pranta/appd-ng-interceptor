(function() {
  'use strict';

angular
  .module('app.interceptors', [ ])
  .constant('URL_INTERCEPT_RE', /^https?:\/\//)
  .factory('appdRequestInterceptor', appdRequestInterceptor);

function appdRequestInterceptor($log, $q, $cacheFactory, URL_INTERCEPT_RE) {
  // simple mock for browser environment
  var cordova = window.cordova || {
    exec: function(success, error, plugin, method, args) {
      success();
    }
  };


  var correlationHeaders,
    requestKeyCache = $cacheFactory('requestKeyCache');

  // API
  var interceptor = {
    request: request,
    response: response,
    requestError: requestError,
    responseError: responseError
  };

  return interceptor;

  // IMPLEMENTATION

  function _getCorrelationHeaders() {
    var dfd = $q.defer();

    console.debug('_getCorrelationHeaders: ');
    if (angular.isDefined(correlationHeaders)) {
      dfd.resolve(correlationHeaders);
    } else {
      cordova.exec(
        function(d) {
          dfd.resolve(d);
        }, function(err) {
          dfd.reject(err);
        },
        'AppDynamics',
        'getCorrelationHeaders',
        []);
    }

    return dfd.promise;
  }

  function _beginRequest(config) {
    var dfd = $q.defer();

    console.log('_beginRequest: ', JSON.stringify(config));
    cordova.exec(
      function(d) {
        dfd.resolve(d);
      },
      function(err) {
        dfd.reject(err);
      },
      'AppDynamics',
      'beginHttpRequest',
      [ config.url ]);

    return dfd.promise;
  }

  function _endRequest(resp) {
    var appdRequestKey = requestKeyCache.get(resp.config);

    if (!angular.isDefined(appdRequestKey)) {
      return $q.when(resp);
    } else {
      var dfd = $q.defer();
      requestKeyCache.remove(resp.config);

      console.log('_endRequest: ', appdRequestKey, resp.status, resp.headers());
      cordova.exec(
        function(d) {
          dfd.resolve(resp);
        },
        function(err) {
          dfd.reject(err);
        },
        'AppDynamics',
        'reportDone',
        [ appdRequestKey, resp.status, resp.headers() ]);
      return dfd.promise;
    }
  }

  function request(config) {
    if (null === config.url.match(URL_INTERCEPT_RE)) {
      return $q.when(config);
    } else {
      console.debug('request: ', config.url);

      // retrieve correlation headers
      return $q
        .when(_getCorrelationHeaders())
        .then(function(d) {
          // set headers on request
          console.debug('correlation headers: ', JSON.stringify(d));
          for (var key in d) {
            config.headers[key] = d[key];
          }

          // mark beginning of request
          return _beginRequest(config);
        })
        .then(function(appdRequestKey) {
          console.debug('request key: ', appdRequestKey);
          // keep track of request key
          requestKeyCache.put(config, appdRequestKey);

          return config;
        });
    }
  }

  function requestError(resp) {
    return _endRequest(resp);
  }

  function response(resp) {
    return _endRequest(resp);
  }

  function responseError(resp) {
    return _endRequest(resp);
  }
}

})();
