

/**
 * Prevent console errors with recursive calls while using JSON.stringify()
 * @param obj
 * @param replacer
 * @param spaces
 * @param replicator
 */
const stringify = function(obj, replacer, spaces, replicator) {
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
    return JSON.stringify(obj, serializer(replacer, replicator), 2);
}



/**
 * Synchronize code with pause, resume, until, and when
 * @returns {{Synchronize: sync.pause, until: sync.until, resume: sync.resume}}
 */
module.exports = function Synchronize(){
    let sync = {
        _count:500,
        _continue: true,
        resume(when){
            if(when){
                when(sync._continue);
            } else {
                sync._continue = true
            }
        },
        /**
         * Pause indenfinitely until resume() is called.
         * @param func
         */
        pause(func){
            setInterval
            while(!sync._continue){};
            if(func) func();
            return;
        },
        /**
         * Pause until count is complete.
         * @param count
         * @param func
         */
        until(count, func){
            sync._count = count || 500;
            let dtn = (new Date()).getTime();
            function getFutureTime(){
                return dtn + sync._count;
            }
            while((new Date()).getTime() < getFutureTime()){};
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
        when(expression, onConditionMet, checkInterval= 100) {
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
    }
    return {
        // Use also to lock
        pause: sync.pause,
        // Use also to unlock
        resume: sync.resume,
        until: sync.until,
        when: sync.when,
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

