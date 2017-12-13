
/**
 * Prevent console errors with recursive calls while using JSON.stringify()
 * @param obj
 * @param replacer
 * @param spaces
 * @param replicator
 */
const stringify = function(obj, replacer, spaces, replicator) {
    return JSON.stringify(obj, serializer(replacer, replicator), 2);
}

function serializer (replacer, replicator) {
    let stack = [];
    let keys = [];
    if (!replicator) replicator = function (key, value) {
        if (stack[0] === value) return "[Circular_Reference]";
        return "[Circular_Reference." + keys.slice(0, stack.indexOf(value)).join(".") + "]";
    };

    return function (key, value) {
        if (stack.length > 0) {
            let index = stack.indexOf(this);
            ~index ? stack.splice(index + 1) : stack.push(this);
            ~index ? keys.splice(index, Infinity, key) : keys.push(key);
            if (~stack.indexOf(value)) value = replicator.call(this, key, value);
        }
        else stack.push(value);
        return replacer == null ? value : replacer.call(this, key, value);
    };
}

let utility = {
    copy : function(object){
        return JSON.parse(stringify(object));
    },
    wait : function(count, func){
        let dtn = (new Date()).getTime() + count;

        console.log(`Waiting ${count} milliseconds.`);
        console.log(` > Start:  `,(new Date()).getTime());
        while((new Date()).getTime() < dtn){}
        console.log(` > Finish: `,(new Date()).getTime());
        if(func) func();
        return;
    },
    /**
     * When "Expression function" returns true, execute callback.
     * ```js
     * utility.until( function(){ return true }, then);
     * ```
     * @param expression
     * @param onReady
     * @param checkInterval
     */
    when : function(expression, onConditionMet, checkInterval= 100) {
        let timeoutId = "";
        var checkFunc = function() {
            if(expression()) {
                clearTimeout(timeoutId);
                onConditionMet();
            } else {
                timeoutId = setTimeout(checkFunc, checkInterval);
            }
        };
        checkFunc();
    }
};

/**
 * CacheItem EventEmitter
 * This is a data value first and foremost.
 * It exists an event manager as its intended purpose.
 */
class CacheEventEmitter {
    /**
     * Pass the onError function on creation of the EventEmitter
     * Set a default onError function of not provided.
     *
     * @param name
     * @param onError
     */
    constructor(name, data = {}, onError){
        //// console.log(`EventEmitter: ${name}.constructor()`);
        this.name = name;
        this.listeners = [];
        this._data = data;
        this.__map = {};
        this._onErrorEvent = onError || function (error){
            // console.error(error);
        };
    }

    /**
     * subscribe to onChange event
     * set a function to a list of functions..
     * The "listenerFunction" is a function that is called when the onChange function is called.
     * There can be many of these, so this will be an item in an array of listeners/functions.
     * @param listenerFunction
     */
    subscribe(listenerFunction){
        // console.log(`EventEmitter: ${this.name}.subscribe(listenerFunction)`);
        if(listenerFunction && typeof listenerFunction === 'function'){
            //if(!this.__map[listenerFunction]){
            //  this.__map[listenerFunction] =
            this.listeners.push(listenerFunction);
            listenerFunction(this._data);
            //}
        }
        // Always return the data in case change events have already occured.
        //return this._data;
    }
    publish(){
        // console.log(`EventEmitter: $${this.name}.publish()`);
        let len = this.listeners.length;
        for(let i=0; i<len; i++){
            let subscriberFunction = this.listeners[i];
            try{
                // console.log(`EventEmitter: ${this.name}.call( { data } )`);
                subscriberFunction(this._data);
            } catch (subscriberFunctionError){
                this._onErrorEvent(subscriberFunctionError);
            }
        }
    }
    onChange(data){
        //// console.log(`EventEmitter: $${name}.publish()`);
        this.publish();
    }

    /**
     * There may be a case - maybe?
     * @param data
     */
    updateWithoutPublish(data){
        //// console.log(`EventEmitter: $${this.name}.updateWithoutPublish()`);
        this._data = data;
    }
    /**
     * Set data
     * @param data
     */
    set data(data){
        //// console.log(`EventEmitter: set $${this.name}.data`);
        this._data = data;
        this.onChange(data)
    }
    get data(){
        //// console.log(`EventEmitter: get $${this.name}.data`);
        return this._data;
    }
}

class CacheItem {
    constructor(parent, name, data = {}){
        /**
         * Parent Object is also a CacheItem
         */
        this._parent = parent;
        this.created = new Date();
        this.updated = new Date();
        this.name = name;
        this._data = data;
        this.emitter = new CacheEventEmitter(name, data);
    }
    get data(){
        //// console.log(`CacheItem get $${this.name}.data`)
        this.requested = new Date();
        return this.emitter.data;
    }
    set data(data){
        //// console.log(`CacheItem set $${this.name}.data`, "this.emitter", this.emitter);
        this.updated = new Date();
        // this._parent.persist();
        this.emitter.data = utility.copy(data);
        return this; // Chain back to CacheItem
    }
    subscribe(listenerFunction){
        this.emitter.subscribe(listenerFunction);
        return this; // Chain back to CacheItem
    }
}

module.exports = CacheFactory = (function CacheFactory () {
    let instance;
    const CACHE_CONTAINER = "NPS_CACHE_CONTAINER";
    function CacheFactory () {
        let cache = this;
        cache.components = {
            root: new CacheItem("root", {})
        };
        cache.startUp = new Date();
        /**
         * Normalize the Component Name
         * Set to Lowercase, and Replace spaces really...
         * @param componentName
         * @param data
         */
        cache.name = function Normalize_Component_Name (componentName) {
            return componentName.toString().toLowerCase().trim().replace(/ /g, '_');
        };
        /**
         * Set and Save data to cache.data
         * Only saves a copy
         * @param componentName
         * @param data
         * @returns {CacheFactory}
         */
        cache.set = function Save_Item_Cache_$VOID (componentName, data) {
            let component = cache.name(componentName);
            if (cache.exists(componentName)) {
                cache.components[component].data = data;
            } else {
                let componentData = new CacheItem(cache, component, data)
                cache.components[component] = componentData;
            }
            return this;  // Chain back to CacheFactory
        };
        /**
         * @deprecated
         */
        cache.persist = function Persist_All_Data_In_Session_$VOID (){
            // TODO: Remove cache.persist
            return this;  // Chain back to CacheFactory
        }
        /**
         * # exists
         * @return {boolean}
         */
        cache.exists = function exists_Cache_$BOOLEAN (componentName) {
            // console.log(`Cache: exists  "${cache.name(componentName)}"`);
            return (cache.components[cache.name(componentName)]) ? true : false;
        };
        /**
         * ## Get
         * This will return a copy of the data.
         * You cannot change the data here. It is immutable.
         * @param componentName
         * @returns {*}
         */
        cache.get = function Get_Cache_Data_$OBJECT (componentName) {
            //// console.log(`Cache: Get  "${cache.name(componentName)}"`);
            let response = cache.components[cache.name(componentName)];
            // console.log(` > Cache Data: ${cache.name(componentName)}`, response.data);
            if(!response){
                let warning = "cache.get failed because cache.get( '"+componentName+"' ) was not found.";
                console.warn(warning)
                response = {
                    name: componentName,
                    data: {},
                    error: warning
                }
            }
            // Return ONLY a copy!
            return utility.copy(response.data);
        };
        // cache.getItem = function Get_Cache_$OBJECT (componentName) {
        //     //// console.log(`Cache: Get  "${cache.name(componentName)}"`);
        //     let response = cache.components[cache.name(componentName)];
        //     // console.log(` > Cache Data: ${cache.name(componentName)}`, response);
        //     if(!response){
        //         console.warn("cache.getItem failed because cache.get( '"+componentName+"' ) was not found.")
        //     }
        //     return response;
        // };
        cache.subscribe = function Subscribe_Function_To_EventEmitter(componentName, subscriberFunction){
            // console.log("cache.subscribe of CacheFactory")
            let cacheItem = cache.components[cache.name(componentName)];
            if(cacheItem){
                cacheItem.subscribe(subscriberFunction);
            } else {
                console.warn("!! ATTENTION: cache.subscribe( ... ) failed because cache.get( '"+componentName+"' ) was not found!!")
            }

        }
        return {
            since		: cache.startUp,
            subscribe	: cache.subscribe,
            unsubscribe	: cache.unsubscribe,
            set			: cache.set,
            exists		: cache.exists,
            get			: cache.get
        };
    }
    let init = function Initialize_CacheFactory(){

        if(console.groupCollapsed) console.groupCollapsed(`CacheFactory: init`);
        if(console.time) console.time(`CacheFactory: init`);
        instance = new CacheFactory();
        console.log(instance);
        if(console.timeEnd) console.timeEnd(`CacheFactory: init`);
        if(console.groupEnd) console.groupEnd();
    };

    return {
        getInstance: function Get_Instance_Of_CacheFactory() {
            if (!instance) {
                init();
            }
            return instance;
        }
    };
})();
