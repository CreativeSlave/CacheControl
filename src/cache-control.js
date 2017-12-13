
import {Session} from 'meteor/session';

//// console.clear();

/**
 * CacheItem EventEmitter
 * This is a data value first and foremost.
 * It has an event manager as its intended purpose.
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
     * Add a function to a list of functions..
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
    created = null;
    updated = null;
    requested = null;
    _data = {};
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
        // Session.set(this.name, this);
        // this._parent.persist();
        this.emitter.data = data;
    }
    subscribe(listenerFunction){
        this.emitter.subscribe(listenerFunction);
    }
}

let CacheFactory = (function CacheFactory () {
    let instance;
    const CACHE_CONTAINER = "NPS_CACHE_CONTAINER";
    function CacheFactory () {
        let cache = this;
        cache.components = {
            root: new CacheItem("root", {})
        };
        cache.startUp = new Date();
        /**
         * Add or Update Cache
         * @param componentName
         * @param data
         */
        cache.name = function Normalize_Component_Name (componentName) {
            return componentName.toString().toLowerCase().trim().replace(/ /g, '_');
        };
        /**
         * Save cache
         * @param componentName
         * @param data
         * @returns {CacheFactory}
         */
        cache.add = function Save_Item_Cache (componentName, data) {
            let component = cache.name(componentName);
            // console.info(`Cache: Add  "${component}"`);
            let timestamp = new Date();
            let componentData = new CacheItem(cache, component, data);
            //// console.log(`${componentData}`)
            if (cache.has(componentName)) {
                componentData.created = cache.components[component];
                cache.components[component].data = componentData;
            } else {
                cache.components[component] = componentData;
            }
            return cache.persist;
        };
        cache.persist = function Persist_All_Data_In_Session_VOID (){
            Session.set(CACHE_CONTAINER, cache.components);
            return cache;
        }
        /**
         * @return {boolean}
         */
        cache.has = function Has_Cache_BOOLEAN (componentName) {
            // console.log(`Cache: Has  "${cache.name(componentName)}"`);
            return (cache.components[cache.name(componentName)]) ? true : false;
        };
        cache.get = function Get_Cache_Data_OBJECT (componentName) {
            //// console.log(`Cache: Get  "${cache.name(componentName)}"`);
            let response = cache.components[cache.name(componentName)];
            // console.log(` > Cache Data: ${cache.name(componentName)}`, response.data);
            if(!response){
                // console.warn("cache.get failed because cache.get( '"+componentName+"' ) was not found.")
            }
            return response.data;
        };
        cache.getItem = function Get_Cache_OBJECT (componentName) {
            //// console.log(`Cache: Get  "${cache.name(componentName)}"`);
            let response = cache.components[cache.name(componentName)];
            // console.log(` > Cache Data: ${cache.name(componentName)}`, response);
            if(!response){
                // console.warn("cache.getItem failed because cache.get( '"+componentName+"' ) was not found.")
            }
            return response;
        };
        cache.subscribe = function subscribe(componentName, subscriberFunction){
            // console.log("cache.subscribe of CacheFactory")
            let cacheItem = cache.components[cache.name(componentName)];
            if(cacheItem){
                cacheItem.subscribe(subscriberFunction);
            } else {
                // console.warn("cache.subscribe failed because cache.get( '"+componentName+"' ) was not found.")
            }

        }
        return {
            since		: cache.startUp,
            subscribe	: cache.subscribe,
            add			: cache.add,
            has			: cache.has,
            getCache	: cache.getItem,
            save		: cache.add,
            get			: cache.get
        };
    }
    let init = function Initialize_CacheFactory(){

        // console.groupCollapsed(`CacheFactory: init`);
        // console.time(`CacheFactory: init`);
        instance = new CacheFactory();
        let cacheContainer = Session.get(CACHE_CONTAINER) || {};
        instance.components = cacheContainer;
        // console.log(instance);
        // console.timeEnd(`CacheFactory: init`);
        // console.groupEnd();
    };

    return {
        getInstance: function () {
            if (!instance) {
                init();
            }
            return instance;
        }
    };
})();
