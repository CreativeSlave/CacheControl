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
`);
    console.log(data)
    // let data = object.data;
    console.log(`
    
    The author, namely ${data.author}, wanted to create a tool for himself named: ${data.name}. 
    There are many other tools, but he wanted to keep it simple. 
    
    So many others grow in complexity so fast they quickly become undesirable. 
    It's purpose is as stated: "${data.description}". It is currently at version: ${data.version} 
    and can be found at ${data.repository}.`)
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
let data = {
    author: "Drew Ambrose",
    name: "CacheControl",
    startUp: new Date(),
    description: "A simple Cache control to share data between controllers and views with an internal EventEmitter.",
    version: "0.0.1",
    repository: "git+https://github.com/CreativeSlave/CacheControl.git",
    children: []
};



// Let's test this out
setTimeout(()=>{
    cacheControl.set("root", data);
},3000);

