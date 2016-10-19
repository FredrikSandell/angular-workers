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
        // set the URL to obtain angular
        WorkerService.setAngularUrl('https://code.angularjs.org/1.5.7/angular.js');
        // set the URL of other mandatory libraries
        WorkerService.addLibrary('https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js');
    });

    it('should be an object', function () {
        expect(typeof WorkerService).toBe('object');
    });

    it('should have a method addLibrary()', function () {
        expect(WorkerService.addLibrary).toBeDefined();
        expect(typeof WorkerService.addLibrary).toBe('function');
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

        WorkerService.addDependency(
            '_',
            'underscore',
            'http://localhost:9876/base/src/test/ng-underscore.js'
        );
        var worker = WorkerService.createAngularWorker(['input', 'output', '_', function (input, output) {
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

    it('should be possible inject custom dependencies in worker', function (done) {
        var completed = false;

        WorkerService.addDependency(
            '_',
            'underscore',
            'http://localhost:9876/base/src/test/ng-underscore.js'
        );
        var workerPromise = WorkerService.createAngularWorker(['input', 'output', '_', function (input, output, PiCalculatorService) {
            output.resolve(_.size(input));

        }]);

        workerPromise.then(function(worker) {
            return worker.run([1,2,3]); //execute the run method on the fully initialized worker
        }, function error(reason) {
            expect(false).toBe(true);

        }).then(function success(data) {
            expect(data).toEqual(3); //worker should not succeed in this test
        })['finally'](function() {
            done();
            completed = true;
        });

        waitUntilCompletedToTriggerPromiseResolve(completed, rootScope);
    });


});
