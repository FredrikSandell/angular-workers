angular.module('FredrikSandell.worker-pool-pi-calculator', []).service('PiCalculatorService', ['$q', function ($q) {
    var that = {};
    /**
     * If this is done correctly really doesn't matter. What we need is a long running task which hogs CPU-time.
     * Number of decimals to calculate for PI
     * @param num
     */
    that.calculatePi = function(num) {
        var deferred = $q.defer();
        var pi = 4, top = 4, bot = 3, minus = true;
        var startTime = Date.now();
        var somewhatExactPi = next(pi, top, bot, minus, num, deferred);
        deferred.resolve({
            pi: somewhatExactPi,
            runtime:calculateRuntime(startTime, Date.now())
        });
        return deferred.promise;
    };

    function next(pi, top, bot, minus, num, deferred) {
        for (var i = 0; i < num; i++) {
            pi += minus ? -(top / bot) : (top / bot);
            minus = !minus;
            bot += 2;
            if(i%1000 === 0) {
                deferred.notify(pi);
            }
        }
        return pi;
    }

    function calculateRuntime(start,end) {
        var total = end - start;
        if(total >= 1000){
            total = (total/1000)+'seconds';
        }else{
            total += 'ms';
        }
        return total;
    }

    return that;
}]);