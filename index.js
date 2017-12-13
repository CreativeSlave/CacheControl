let CacheFactory = require("./src/cache-control");

cacheControl = CacheFactory.getInstance();
/**
 * Testing
 */
cacheControl.set("root", {
    date: new Date(),
    data: {},
    trends: {}
})
console.log(`

***************************************
Now Subscribing to root
***************************************
Notice that subscribing will instantly 
return the data as well.
`);
cacheControl.subscribe("root", function(data){
    console.log(`

***************************************
EventEmitter: Invoked on 'root'
***************************************
`, data);
});


console.log(`

***************************************
Now updating data in root
***************************************
`);
/**
 * Test: 'root' is a default. You do not need to use it at all.
 * This is just an example of adding any kind of object.
 * @type {{author: string, startUp: Date, description: string, version: string, repository: string, children: Array}}
 */
cacheControl.getCache("root").data = {
    author: "Drew Ambrose",
    startUp: new Date(),
    description: "A simple Cache control to share data between controllers and views with an internal EventEmitter.",
    version: "0.0.1",
    repository: "git+https://github.com/CreativeSlave/CacheControl.git",
    children: []
};