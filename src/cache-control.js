let { utility, Synchronize, stringify } = require("./utilities");
let { logger, LEVEL } = require("./logger");

/**
 * CacheItem EventEmitter
 * This is a data value first and foremost.
 * It exists an event manager as its intendsed purpose.
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
        //// logger.log(`EventEmitter: ${name}.constructor()`);
        this.name = name;
        this.listeners = [];
        this._data = data;
        this.__map = {};
        this.__pause = false;
        this._onErrorEvent = onError || function (error){
            // logger.error(error);
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
        // logger.log(`EventEmitter: ${this.name}.subscribe(listenerFunction)`);
        if(listenerFunction && typeof listenerFunction === 'function'){
            //if(!this.__map[listenerFunction]){
            //  this.__map[listenerFunction] =
            this.listeners.push(listenerFunction);
            listenerFunction(utility.copy(this._data));
            //}
        }
        // Always return the data in case change events have already occured.
        return utility.copy(this._data);
    }
    unsubscribeAll(){
        this.listeners = [];
    }
    _push(subscriberFunction){
        // logger.log(`EventEmitter: $${this.name}.push( subscriberFunction )`);
        if(!this.__pause){
            try{
                // logger.log(`EventEmitter: ${this.name}.call( { data } )`);
                subscriberFunction(this._data);
            } catch (subscriberFunctionError){
                this._onErrorEvent(subscriberFunctionError);
            }
        }
    }
    onChange(data){
        // logger.log(`EventEmitter: $${name}.publish()`);
        if(!this.__pause){
            let len = this.listeners.length;
            for(let i=0; i<len; i++){
                this._push(this.listeners[i]);
            }
        }
    }

    /**
     * There may be a case - maybe?
     * @param data
     */
    updateWithoutPublish(data){
        //// logger.log(`EventEmitter: $${this.name}.updateWithoutPublish()`);
        this._data = data;
    }
    /**
     * Set data
     * @param data
     */
    set data(data){
        //// logger.log(`EventEmitter: set $${this.name}.data`);
        this._data = data;
        this.onChange(data)
    }
    get data(){
        //// logger.log(`EventEmitter: get $${this.name}.data`);
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
        //// logger.log(`CacheItem get $${this.name}.data`)
        this.requested = new Date();
        return this.emitter.data;
    }
    set data(data){
        //// logger.log(`CacheItem set $${this.name}.data`, "this.emitter", this.emitter);
        this.updated = new Date();
        // this._parent.persist();
        this.emitter.data = utility.copy(data);
        return this; // Chain back to CacheItem
    }
    subscribe(listenerFunction){
        this.emitter.subscribe(listenerFunction);
        return this; // Chain back to CacheItem
    }
    unsubscribe(listenerFunction){
        this.emitter.unsubscribeAll();
        return this; // Chain back to CacheItem
    }
}

const CacheFactory = (function CacheFactory () {
    let instance;
    const CACHE_CONTAINER = "CACHE_CONTAINER";
    function CacheFactory () {
        let cache = this;
        // logger.log("initialize CacheFactory")
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
            // logger.log(`Cache: exists  "${cache.name(componentName)}"`);
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
            //// logger.log(`Cache: Get  "${cache.name(componentName)}"`);
            let response = cache.components[cache.name(componentName)];
            // logger.log(` > Cache Data: ${cache.name(componentName)}`, response.data);
            if(!response){
                let warning = "cache.get failed because cache.get( '"+componentName+"' ) was not found.";
                logger.warn(warning)
                response = {
                    name: componentName,
                    data: {},
                    error: warning
                }
            }
            // Return ONLY a copy!
            return utility.copy(response.data);
        };
        cache.getItem = function Get_Cache_$OBJECT (componentName) {
            //// logger.log(`Cache: Get  "${cache.name(componentName)}"`);
            let cacheItem = cache.components[cache.name(componentName)];
            // logger.log(` > Cache Data: ${cache.name(componentName)}`, response);
            if(!cacheItem){
                let warning = "cache.getItem failed because cache.get( '"+componentName+"' ) was not found.";
                logger.warn(warning);
                return {
                    name: componentName,
                    data: {},
                    error: warning
                }
            } else {
                let setData = function(data){
                    cacheItem.data = data;
                }
                /**
                 * Return CacheItem API
                 */
                return {
                    data         : utility.copy(cacheItem.data),
                    setData,
                    subscribe    : cacheItem.subscribe,
                    unsubscribe  : cacheItem.unsubscribe,
                };
            }

        };
        cache.subscribe = function Subscribe_Function_To_EventEmitter(componentName, subscriberFunction){
            // logger.log("cache.subscribe of CacheFactory")
            let cacheItem = cache.components[cache.name(componentName)];
            if(cacheItem){
                cacheItem.subscribe(subscriberFunction);
            } else {
                logger.warn("!! ATTENTION: cache.subscribe( ... ) failed because cache.get( '"+componentName+"' ) was not found!!")
            }

        }
        cache.unsubscribe = function Unsubscribe_From_ALL_EventEmitters (componentName){
            // logger.log("cache.subscribe of CacheFactory")
            let cacheItem = cache.components[cache.name(componentName)];
            if(cacheItem){
                cacheItem.unsubscribe();
            } else {
                logger.warn("!! ATTENTION: cache.subscribe( ... ) failed because cache.get( '"+componentName+"' ) was not found!!")
            }

        }
        cache.list = function(){
            logger.log(cache.components);
        }
        /**
         * Return CacheControl API
         */
        return {
            since		: cache.startUp,
            subscribe	: cache.subscribe,
            unsubscribe	: cache.unsubscribe,
            set			: cache.set,
            exists		: cache.exists,
            get			: cache.get,
            getItem		: cache.getItem,
            list		: cache.list,
        };
    }
    let init = function Initialize_CacheFactory(){
        // logger.start(`CacheFactory`);
        instance = new CacheFactory();
        // logger.log(instance).end(`CacheFactory`);
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

module.exports = CacheFactory;