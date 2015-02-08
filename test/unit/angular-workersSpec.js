describe('FredrikSandell.worker-pool', function () {

    var WorkerService = null;
    var rootScope = null;

    beforeEach(function() {
        module('FredrikSandell.worker-pool');
        inject(function (_WorkerService_, $rootScope) {
            WorkerService = _WorkerService_;
            rootScope = $rootScope;
        });
    });
    beforeEach(function() {
       WorkerService.setAngularUrl('http://localhost:9876/base/bower_components/angular/angular.js');
        
    });

    it('should be an object', function () {
        expect(typeof WorkerService).toBe('object');
    });

    it('should have a method addDependency()', function () {
        expect(WorkerService.addDependency).toBeDefined();
        expect(typeof WorkerService.addDependency).toBe('function');
    });

    it('should have a method createAngularWorker()', function () {
        expect(WorkerService.createAngularWorker).toBeDefined();
        expect(typeof WorkerService.createAngularWorker).toBe('function');
    });

    it('should have a method setAngularUrl()', function () {
        expect(WorkerService.setAngularUrl).toBeDefined();
        expect(typeof WorkerService.setAngularUrl).toBe('function');
    });
    
    function waitUntilCompletedToTriggerPromiseResolve(completed, rootScope) {
        //must wait before triggering digest loop which resolves of the promises
        //worker must be given time to initialize
        var checker = setInterval(function(){
            if(completed) {
                clearInterval(checker);
            } else {
                rootScope.$apply();
            }
        }, 100);
    }

    it('createAngularWorker() should return a valid AngularWorker object', function (done) {
        var completed = false;
        var worker = WorkerService.createAngularWorker(['input', 'output', function (input, output) {
            //the worker method does not matter
            //should always return a promise resolving to an initialized worker
        }]);
        worker.then(function(worker) {
            expect(typeof worker).toBe('object');
            expect(typeof worker.run).toBe('function');
            expect(typeof worker.terminate).toBe('function');
        }, function(data) {
            expect(true).toBe(false); //initialization should be ok
        })['finally'](function() {
            done();
            completed = true;
        });
        waitUntilCompletedToTriggerPromiseResolve(completed, rootScope);
    });
    
    

    it('should be possible to pass arguments to worker, send updates from workers, and successfully terminate workers', function (done) {
        var completed = false;
        var workerPromise = WorkerService.createAngularWorker(['input', 'output', function (input, output) {
            /*
            This is the body of the worker. This must be self contained. I.e. contain no references to variables
            outside of this function body. References to services listed in the dependency list above is of course ok!
            The next test provides more details regarding dependencies.

            input, is a required dependency for the worker. It should be an object which is serializable through
            invocation of JSON.stringify()

            output is a required dependency for the worker. It is always a promise which is to be used when communicating
            results from the worker. Please not that all objects passed to output should be serializable through
            JSON.stringify()
             */
            output.notify({status: (input.aNumber+2)});

            output.resolve({result: input.aNumber*3});
        }]);
        //for clarity the promises are not chained
        var workerExecutionPromise = workerPromise.then(function(worker) {
            //once we reach this point, the worker has its own initialized angular context.
           return worker.run({aNumber: 3}); //execute the run method on the fully initialized worker
        }, function(data) {
            expect(true).toBe(false); //initialization should be ok
        });

        workerExecutionPromise.then(function success(data) {
            expect(data.result).toBe(9);
        },function error(reason) {
            expect(true).toBe(false); //worker should not fail in this test
        }, function update(data) {
            expect(data.status).toBe(5);
        })['finally'](function() {
            done();
            completed = true;
        });
        waitUntilCompletedToTriggerPromiseResolve(completed, rootScope);
    });

    it('should be possible reject promise from worker', function (done) {
        var completed = false;
        var workerPromise = WorkerService.createAngularWorker(['input', 'output', function (input, output) {
            output.reject("very bad");
        }]).then(function(worker) {
            return worker.run({aNumber: 3}); //execute the run method on the fully initialized worker
        }).then(function success(data) {
            expect(true).toBe(false); //worker should not succeed in this test
        },function error(reason) {
            expect(reason).toBe("very bad");
        })['finally'](function() {
            done();
            completed = true;
        });
        waitUntilCompletedToTriggerPromiseResolve(completed, rootScope);
    });

    it('should be possible inject angular dependencies in worker', function (done) {
        var completed = false;
        var workerPromise = WorkerService.createAngularWorker(['input', 'output', '$http', function (input, output, $http) {
            //the URL has to be absolute because this is executed based on a blob
            output.notify('Getting data from backend');
            $http.get('http://localhost:9876/some/url').then(function success() {
                //usually we would parse data here. But we don't have a backend:)
            }, function error(reason) {
                output.notify('Starting to preccess retreived information in a CPU intensive way');
                output.resolve(100);
            });
        }]).then(function(worker) {
            return worker.run(); //execute the run method on the fully initialized worker
        }).then(function success(data) {
            expect(data).toBe(100); //worker should not succeed in this test
        })['finally'](function() {
            done();
            completed = true;
        });
        waitUntilCompletedToTriggerPromiseResolve(completed, rootScope);
    });

    it('should be possible inject custom dependencies in worker', function (done) {
        var completed = false;
        //the worker runs in its own angular context. It needs to load all dependencies indenpendently of the main
        //application. To do this it needs information about how to load the scripts.
        //It is important that the URL is absolute!
        WorkerService.addDependency(
            'PiCalculatorService',
            'FredrikSandell.worker-pool-pi-calculator',
            'http://localhost:9876/base/src/PiCalculator.js'
        );
        var workerPromise = WorkerService.createAngularWorker(['input', 'output', 'PiCalculatorService', function (input, output, PiCalculatorService) {
            output.notify("starting with accuracy: "+input.accuracy);
            output.resolve(PiCalculatorService.calculatePi(input.accuracy));
        }]).then(function(worker) {
            return worker.run({accuracy: 100000}); //execute the run method on the fully initialized worker
        }, function error(reason) {
            expect(false).toBe(true);
        }).then(function success(data) {
            expect(data.pi).toBe(3.1416026534897203); //worker should not succeed in this test
        })['finally'](function() {
            done();
            completed = true;
        });
        waitUntilCompletedToTriggerPromiseResolve(completed, rootScope);
    });

});
