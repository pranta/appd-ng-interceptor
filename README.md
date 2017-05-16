# appd-ng-interceptor
Angular request interceptor for Cordova/Phonegap Apps with the [AppDynamics plugin](https://github.com/asmod3us/appd-request-).

This interceptor will automatically add AppDynamics request headers obtained from the Cordova plugin to http requests made via angular APIs.
In order to use it, configure the httpProvider to use it as an interceptor. Set up a dependency to the provided `app.interceptors` module and refer to this snippet for the config phase:

```
.config(function($httpProvider) {
...
  $httpProvider.interceptors.push('appdRequestInterceptor');
...
})
```
