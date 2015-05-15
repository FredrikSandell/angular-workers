'use strict';

/**
 * @ngdoc overview
 * @name fullGridWebworkersApp
 * @description
 * # fullGridWebworkersApp
 *
 * Main module of the application.
 */
var app = angular
  .module('angular-workers-example', ['FredrikSandell.worker-pool']) 
  .run(function (WorkerService) {
      //WorkerService.setAngularUrl('../bower_components/angular/angular.js');
      WorkerService.setAngularUrl('https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular.min.js');
      //WorkerService.addDependency(serviceName, moduleName, url);
  });

app.controller("myChartCtrl", function($scope,WorkerService) {



  $scope.awesomeThings = ['HTML5 Boilerplate', 'AngularJS', 'Karma'];
  $scope.data = {};

  $scope.data.reply1 = 'a';
  $scope.data.reply2 = 'b';
  $scope.data.reply3 = 'c';

  $scope.test = function (arg) {
    
      /**
      // This contains the worker body.          
      // The function must be self contained. 
      // The function body will be converted to source and passed to the worker.           
      // The input parameter is what will be passed to the worker when it is executed. It must be a serializable object.
      // The output parameter is a promise and is what the worker will return to the main thread.
      // All communication from the worker to the main thread is performed by resolving, rejecting or notifying the output promise.
      // We may optionally depend on other angular services. These services can be used just as in the main thread.
      // But be aware that no state changes in the angular services in the worker are propagates to the main thread. Workers run in fully isolated contexts.
      // All communication must be performed through the output parameter. 
   */
  var workerPromise = WorkerService.createAngularWorker(['input', 'output', '$http', function (input, output, $http) {
    
    var i=0;
    
    var callback = function(i) {
      output.notify(i);
      i++;
    };
    

    //for (var i = 0; i < 10; i++) { callback(i); }
    //var intervalID = setInterval(callback(i), 3000);
    setInterval(function(){ callback(++i); }, Math.floor((Math.random() * 1000) + 100));
    
    //output.resolve(true);
    //output.reject(false);
    
  }]);

    workerPromise
      .then(function success(angularWorker) {  
      //The input must be serializable  
      return angularWorker.run($scope.awesomeThings);
    }, function error(reason) {
      
        console.log('callback error');
        console.log(reason);
      
        //for some reason the worker failed to initialize  
        //not all browsers support the HTML5 tech that is required, see below.  
      }).then(function success(result) {
        
        console.log('success');
        console.log(result);
        
      //handle result  
    }, function error(reason) {
        //handle error
        console.log('error');
        console.log(reason);
          
      }, function notify(update) {
        //handle update
        
        $scope.data['reply' + arg] += update + '\n';        
        //console.log(arg);
        //console.log(update);          
      });

  };


});


/*

var app = angular.module("myApp", ['nvd3ChartDirectives']);

app.controller("myChartCtrl", function($scope,$http) {

    $scope.data = {};
    $scope.data.bar = [];

/*
    $http.get('http://localhost:8080/data?type=cheese').
        success(function(data, status, headers, config) {
            $scope.data.bar = data;
        }).
        error(function(data, status, headers, config) {
            console.log('error');
            $scope.bar = [];
        });

});
*/