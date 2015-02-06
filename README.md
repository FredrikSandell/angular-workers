# angular-workers

> A wrapper for web workers in angular

##Why?
Using web workers is somewhat awkward in raw Javascript. Doing it in angular applications even more so. 
Each web worker runs in it's own context, and this context is isolated from the angular application.

##What does angular-workers do
angular-workers provides an angular service which upon request creates a web worker.
The returned web worker runs it's own angular context which allows it to resolve angular dependencies.

##How to use
1. Depend on the WorkerService.
2. Specify the URL to the file containing the angular script by invoking: 
<pre><code>
// The URL must be absolute because of the URL blob specification  
WorkerService.setAngularUrl(url)
</pre></code>
3. OPTIONALLY: Specify how the web worker is to find any dependencies by invoking: 
<pre><code>
// The URL must be absolute because of the URL blob specification  
WorkerService.addDependency(serviceName, moduleName, url) 
</pre></code>
4. Create create a promise of an angularWorker by invoking: 
<pre><code>
    var workerPromise = WorkerService.createAngularWorker(['input', 'output' /*additional optional deps*/,   
    &nbsp;&nbsp;function(input, output /*additional optional deps*/) {  
    &nbsp;&nbsp;&nbsp;&nbsp;// This contains the worker body  
    &nbsp;&nbsp;&nbsp;&nbsp;// The function must be self contained (the function body will be converted to source)  
    &nbsp;&nbsp;&nbsp;&nbsp;// The input paramter is what will be passed to the worker when it is to be executed, it must be a serializable object  
    &nbsp;&nbsp;&nbsp;&nbsp;// The output parameter is a promise and is logically what the worker will return to the main thread.  
    &nbsp;&nbsp;&nbsp;&nbsp;// All communication from the worker to the main thread is performed by resolving, rejecting or notifying the output promise  
    &nbsp;&nbsp;&nbsp;&nbsp;// We may optionally depend on other angular services. These services can be used just as in the main thread.  
    &nbsp;&nbsp;}]);
</code></pre>
5. When the workerPromise resolves the worker is initialized with it's own angular context and is ready to use. Like so:
<pre><code>
    workerPromise.then(function success(angularWorker) {  
    &nbsp;&nbsp;&nbsp;&nbsp;//The input must be serializable  
    &nbsp;&nbsp;&nbsp;&nbsp;return angularWorker.run(inputObject);    
    &nbsp;&nbsp;}, function error(reason) {  
    &nbsp;&nbsp;&nbsp;&nbsp;//for some reason the worker failed to initialize  
    &nbsp;&nbsp;&nbsp;&nbsp;//not all browsers support the HTML5 tech that is required, see below.  
    &nbsp;&nbsp;}).then(function success(result) {  
    &nbsp;&nbsp;&nbsp;&nbsp;//handle result  
    &nbsp;&nbsp;}, function error(reason) {  
    &nbsp;&nbsp;&nbsp;&nbsp;//handle error  
    &nbsp;&nbsp;}, function notify(update) {  
    &nbsp;&nbsp;&nbsp;&nbsp;//handle update  
    &nbsp;&nbsp;});  
</pre></code>

The same initialized worker can be used many times with different input.

##Requirements
The browser running the angular service needs to support the following:  
* [Web Workers](http://caniuse.com/#feat=webworkers) (angular-workers does not use shared workers)  
* [Blob URLs](http://caniuse.com/#feat=bloburls), specifically [creating blobs from strings](https://developer.mozilla.org/en-US/docs/Web/API/URL.createObjectURL#Browser_compatibility)
    
##Limitations
The angular-workers is a wrapper around standard web workers. So all limitations with web workers apply.  
  * Data sent between the worker and main thread is deep cloned. (angular-workers does not use transferable objects, yet)
This means transferring large object (about >20Mb, [Communicating Large Objects with Web Workers in javascript, Samuel Mendenhall](http://developerblog.redhat.com/2014/05/20/communicating-large-objects-with-web-workers-in-javascript/))
will cause noticeable delays. Samuel Mendenhall recommends sending the data in chunks. This can be achieved using the notify
in the angular promise.  
  * There is no DOM in the worker. Other things are missing as well. No global "document" object. The bare minimum of these
  have been mocked to allow angular to start in the worker.
  * The web worker share no runtime data with the main thread. This is great since it prevents deadlock, starvation and many
  other concurrency issues. But it also means that any angular service instance upon which your worker depends is created
  in that worker, and not shared with the main thread. <b> One can not communicate data between worker and main thread 
  by using service states. All communication must be done through the input object and output promise.</b>
  * Running in a separate context means the web worker does not share the cookies set in the main thread! If you depend on
  cookies for authentication pass these manually to the worker.


