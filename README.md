# CacheControl

CacheControl and EventEmiter for any JS Project
It's a simple Cache control to share data between controllers and views with an internal EventEmitter.

*@see* [/src/cache-control.js](/src/cache-control.js) 

Also, a custom logger 
    *@see* [/src/logger.js](/src/logger.js) 



## Basic Usage Examples
Import/require and Get the Instance
```js
// Node Example using require.
let CacheFactory = require("./src/cache-control");

// It is a Singleton, so getting an instance.
// Creating a variable for simplicity here.
let cacheControl = CacheFactory.getInstance();
```

## Get/Set Examples
```js
let CacheFactory = require("./src/cache-control");
let cacheControl = CacheFactory.getInstance();

// Any test data
let data = {
    date: new Date(),
    data: {},
    trends: {}
};

// Set data. If it does not exist it will create it. If it does exist it will change it. 
// So, as long as you set before you get you are fine ;)
// This is immutable, so it sets a copy of the data you pass in.
cacheControl.set("root", data);

// Get a COPY of the data for root. This is immutable data returned from 'cacheControl.get'!
cacheControl.get("root");


```

## Subscribe Examples
```js
let CacheFactory = require("./src/cache-control");
let cacheControl = CacheFactory.getInstance();

cacheControl.set("root", {
    date: new Date(),
    data: {},
    trends: {}
});

// Subscribe to updates of the data usnig a Simple EventEmitter
cacheControl.subscribe("root", (data)=>console.log(data) );
// Currently, this will unsubscribe ALL subscribers from the CacheItem returned by passing root.
cacheControl.unsubscribe("root");

// Another Example: Subscribe to updates of the data usnig a Simple EventEmitter
cacheControl.subscribe("root", function(data) { 
   console.log(data); 
});

// Another Example: Subscribe to updates of the data usnig a Simple EventEmitter
function updateEvent(data){
   console.log(data); 
}
cacheControl.subscribe("root", updateEvent);
```