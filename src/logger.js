const LEVEL = {
	development: 8,
	verbose    : 7,
	trace      : 6,
	debug      : 5,
	log        : 4,
	info       : 3,
	warn       : 2,
	error      : 1,
	none       : 0
};

logger = {};

/**
 * Prevent console errors with recursive calls while using JSON.stringify()
 * @param obj
 * @param replacer
 * @param spaces
 * @param replicator
 */
stringify = function(obj, replacer, spaces, replicator) {
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

/**
 * TestFactory is a chainable class alowing simple tests
 * @param description
 * @param expression
 * @returns {{description: *, expression: *, testExpression: string, result: boolean, toBe: toBe, toContain: toContain,
 *   toString: toString, getResult: getResult}}
 * @constructor
 * @author VX Team
 */
function TestFactory (description, expression, logger) {
	if (!description && !expression) {
		console.warn("You have attempted to call console.toBe without setting " +
								 "console.expect. \nYour expression should look like this:\n" +
								 "console.expect('My bike tires colors',{ bike.tires.color }).toBe('black');");
	}
	;
	
	let expressionTest = {
		description   : description,
		expression    : expression,
		testExpression: "",
		result        : false,
		toBe          : function (testExpression) {
			
			try {
				expressionTest.testExpression = testExpression;
				expressionTest.result = (expressionTest.expression === expressionTest.testExpression);
				logger.tests.push(expressionTest);
			}
			catch (e) {
				console.error(e);
			}
			let res = expressionTest.getResult();
			
			let title = "Test Case: " + res.success;
			if(expressionTest.result){
				logger.successStart(title);
			} else {
				logger.failedStart(title);
			}
			logger.log(expressionTest).info(res.message).end(title);
			
			return (expressionTest.result);
		},
		toContain     : function (property) {
			try {
				logger.info(expressionTest.toString());
				let ex = expressionTest.expression;
				if (ex != null) {
					if (typeof ex === 'string') {
						return (ex.indexOf(property + '') == -1);
					} else if (typeof ex === 'boolean') {
						return (property === ex);
					} else if (typeof ex === 'number') {
						return (ex.toString().indexOf(property + '') == -1);
					} else if (typeof ex === 'function') {
						return (ex.toString().indexOf(property + '') == -1);
					} else if (typeof ex === 'object') {
						return ex.hasOwnProperty(property);
					} else {
						return false;
					}
				}
			}
			catch (e) {
			}
			return false;
		},
		toString      : function () {
			return expressionTest.getResult().message;
		},
		/**
		 * For use with DOM objects
		 * @returns {{success: boolean, message: string}}
		 */
		getResult     : function () {
			let message = "";
			let success = expressionTest.result;
			if (!success) {
				message = `Failed. Sorry, the '${expressionTest.description}' was '${expressionTest.expression}' and expected to be equal to be '${expressionTest.testExpression}' but was not. Type checking however was not strict. \n`;
			} else {
				message = `Success! The '${expressionTest.description}' is '${expressionTest.expression}' and was expected to be equal to be '${expressionTest.testExpression}'! \n`;
			}
			return {
				success: success,
				message: message
			};
		}
	};
	return expressionTest;
};

utility = {
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
utility.time = {
	initial: new Date(),
	/**
	 * This requires greater work.
	 * @returns {number}
	 */
	since  : function () {
		let now = new Date();
		return now - utility.time.initial;
	},
	/**
	 * The time format will need to be changed later...
	 * @param tm
	 * @returns {string}
	 */
	format : function (tm) {
		return tm.getMinutes() + ":" + tm.getSeconds() + "s  " + tm.getMilliseconds().toString().substring(0, 10) + "ms";
	},
	/**
	 * Gets a string formatted timestamp
	 * @returns {*|string}
	 */
	clock  : function () {
		let tm = new Date(utility.time.since());
		return utility.time.format(tm);
	},
	padMonth(month){
		if(month.toString().length === 1){
			return `0${month}`
		}
		return month;
	}
};
//utility.time.clock()
/**
 * Prints extra details for each log.
 * @param arg
 * @returns {string}
 */
utility.getStackTrace = function stackTrace (arg) {
	let err = new Error(arg);
	let trace = err.stack.toString();
	let traceArray = trace.split("\n").map(function (line) {
		let ln = line.trim();
		ln = ln.replace("?hash=", "\n  >  >  Hash: ");
		ln = ln.replace("stackTrace@", "");
		ln = ln.replace("http://localhost:3000", " [localhost] ");
		ln = ln.replace("@", " [@] ");
		ln = ln.replace(":", " : ");
		// return `<div class="trace-item">${line.trim()}</div>`;
		return `${ln}\n`;
	});
	// The first six lines in the trace refer to this console object and therefore do not need to be traced.
	if (traceArray.length >= 6) {
		traceArray[6] = utility.extractTraceInfo(traceArray[6]);
		traceArray.splice(1, 5);
	}
	traceArray.map(function (item) {
		try {
			return utility.extractFileTraceInfo(item);
		}
		catch (e) {
			console.error(e);
		}
		return item;
	});
	
	trace = traceArray.join();
	trace = trace.replace(/Error: /g, "Trace: ");
	trace = trace.replace(/>,/g, ">");
	trace = trace.replace(/undefined/g, " [0] ");
	return trace;
};
utility.extractTraceInfo = function (str) {
	let start = str.indexOf("at ") || 0;
	let end = str.indexOf("\n") || start;
	let path = str.substring(start + 3, end);
	let finalPath = path.toString().substring(0, path.toString().lastIndexOf("/") + 1);
	let remainingString = path.substring(finalPath.length);
	let file = remainingString.split(":")[0];
	let line = remainingString.split(":")[1];
	let char = remainingString.split(":")[2];
	let query = file.split("?")[1];
	file = file.split("?")[0];
	let info = {
		renderedHTMLTrace: str,
		serverPath       : finalPath,
		fileName         : file,
		searchQuery      : query || "none",
		lineNumber       : line,
		characterPosition: char
	};
	return str.substring(0, start) + `File: ${info.fileName}, Line: ${info.lineNumber} @ Char: ${info.characterPosition}` + str.substring(end);
};
utility.extractFileTraceInfo = function (str) {
	let start = str.indexOf("http:");
	if (start) {
		let end = str.indexOf(" ") || str.indexOf(",");
		let path = str.substring(start + 3, end);
		let finalPath = path.toString().substring(0, path.toString().lastIndexOf("/") + 1);
		let remainingString = path.substring(finalPath.length);
		let file = remainingString.split(":")[0];
		let line = remainingString.split(":")[1];
		let char = remainingString.split(":")[2];
		let query = file.split("?")[1];
		file = file.split("?")[0];
		let info = {
			renderedHTMLTrace: str,
			serverPath       : finalPath,
			fileName         : file,
			searchQuery      : query || "none",
			lineNumber       : line,
			characterPosition: char
		};
		return str.substring(0, start) + `File: ${info.fileName}, Line: ${info.lineNumber} @ Char: ${info.characterPosition}` + str.substring(end);
	}
	return str;
};

/**
 * Global Logger for performance testing.
 * Needed to resolve redundant calls and make the app performant.
 * Currently this is just basic, but it provides us the ability to extend when needed.
 */
(function ConsoleExtender (logLevel = 3) {
	console.log("Extending the console.");
	
	function LogObjectFactory (log, type, id = "", open = true) {
		let logObject = {
			raw      : log,
			timestamp: now,
			time     : {
				_start   : createdAt, // private
				_finished: null,// private
				end      : function () {
					let now = new Date(0);
					return now - logObject.time._start;
				},
				span     : function () {
					let tm = new Date(logObject.time.end());
					logObject.time._finished = new Date(tm);
					return utility.time.format(tm);
				}
			},
			id       : id,
			type     : type,
			stack    : self.getStackTrace(log),
			value    : "",
			parent   : lastId || "",
			isGroup  : type === "group",
			open     : open
		};
	};
	
	function appendLog (log, type) {
		//let loggerObject = LogObjectFactory(log, type)
		logger.logs.push(log);
	}
	
	logger = {
		level          : logLevel,
		logs           : [],
		tests          : [],
		collapsed      : true,
		enableTraceMode: true,
		enable         : function (level) {
			logger.level = level;
			return logger;
		},
		enabled        : function isLoggerLevelEnabled (level) {
			// console.info("Is Logger Enabled? Level"+ level+": "+level <= logger.level);
			return true; //level <= logger.level;
		},
		start          : function startGroup (label) {
			if (logger.enabled(LEVEL.info)) {
				if (logger.collapsed) {
					console.groupCollapsed(label);
				} else {
					console.group(label);
				}
				console.time(label);
			}
			return logger;
		},
		failedStart          : function startGroup (label) {
			if (logger.enabled(LEVEL.info)) {
				if (logger.collapsed) {
					console.groupCollapsed("%c"+label+"                                                                                                    ",`
								background: #f5f5f5;
								border-radius:3px;
								color: darkred;
								border-top:1px solid red;
								font-size:12px;
								display: block !important;
								font-weight:bold;
								padding:10px 3px;
								line-height:28px;
								min-width:400px;`);
				} else {
					console.group("%c"+label+         "                                                                                                    ",`
								background: #f5f5f5;
								border-radius:3px;
								color: darkred;
								border-top:1px solid red;
								font-size:12px;
								display: block !important;
								font-weight:bold;
								padding:10px 3px;
								line-height:28px;
								min-width:400px;`);
				}
				console.time(label);
			}
			return logger;
		},
		successStart          : function startGroup (label) {
			if (logger.enabled(LEVEL.info)) {
				if (logger.collapsed) {
					console.groupCollapsed("%c"+label+"                                                  ",`
								background: #f5f5f5;
								border-radius:3px;
								color: green;
								font-size:12px;
								display: block !important;
								font-weight:bold;
								padding:10px 3px;
								line-height:28px;
								min-width:400px;`);
				} else {
					console.group("%c"+label+         "                                                  ",`
								background: #f5f5f5;
								border-radius:3px;
								color: lightgreen;
								font-size:12px;
								display: block !important;
								font-weight:bold;
								padding:10px 3px;
								line-height:28px;
								min-width:400px;`);
				}
				console.time(label);
			}
			return logger;
		},
		end            : function GroupEnd (label) {
			if (logger.enabled(LEVEL.info)) {
				console.timeEnd(label);
				console.groupEnd();
			}
			return logger;
		},
		log            : function LOG (...args) {
			if (logger.enabled(LEVEL.log)) {
				args.forEach((arg) => {
					console.info(arg);
					appendLog(arg, "log");
				});
			}
			return logger;
		},
		
		stack      : function LOG (title, obj) {
			if (logger.enabled(LEVEL.trace && title && obj)) {
					if (logger.enableTraceMode) {
						try {
							let stackTrace = utility.getStackTrace(obj);
							logger.start("Stack Trace: "+title);
							console.log('%c' + stackTrace, `
								background: #fff;
								color: #333;
								font-family:'Courier New';
								display: block !important;
								font-weight:normal;
								padding:10px 5px;
								line-height:24px;
								min-width:400px;`
							);
							logger.end("Stack Trace: "+title);
							appendLog(stackTrace, "trace");
						} catch (er1) {
						}
					}
			}
			return logger;
		},
		alert      : function LOG (...args) {
			if (logger.enabled(LEVEL.log)) {
				args.forEach((arg) => {
					//console.info(arg);
					console.log('%c' + arg, `
						background: red;
						color: white;
						display: block !important;
						font-weight:bold;padding:10px 5px;
						line-height:35px;
						width:400px;`
					);
					appendLog(arg, "log");
				});
			}
			return logger;
		},
		logToServer: function LOG (...args) {
			if (logger.enabled(LEVEL.log)) {
				args.forEach((arg) => {
					console.log(arg);
					appendLog(arg, "log");
				});
			}
			return logger;
		},
		info       : function INFO (...args) {
			if (logger.enabled(LEVEL.info)) {
				args.forEach((arg) => {
					console.info(arg);
					
					
					appendLog(arg, "info");
				});
			}
			return logger;
		},
		debug      : function DEBUG (...args) {
			if (logger.enabled(LEVEL.debug)) {
				args.forEach((arg) => {
					console.debug(arg);
					appendLog(arg, "debug");
				});
			}
			return logger;
		},
		warn       : function WARN (...args) {
			if (logger.enabled(LEVEL.warn)) {
				args.forEach((arg) => {
					console.warn(arg);
					appendLog(arg, "warn");
				});
			}
			return logger;
		},
		trace      : function Trace (...args) {
			if (logger.enabled(LEVEL.trace)) {
				args.forEach((arg) => {
					console.trace(arg);
					appendLog(arg, "trace");
				});
			}
			return logger;
		},
		error      : function WARN (...args) {
			if (logger.enabled(LEVEL.warn)) {
				args.forEach((arg) => {
					console.error(arg);
					appendLog(arg, "error");
					logger.start("Error Details").trace(arg).end("Error Details");
				});
				
			}
			return logger;
		},
		/**
		 * Tester tool
		 * console.expect()
		 * @param description
		 * @param expression
		 */
		expect     : function Expect (description, expression) {
			let test = TestFactory(description, expression, logger);
			logger.tests.push(test);
			return test;
		},
		void       : () => {
			/** Required  - will explain later, but this is because of the
			 * console printing undefined for a return object when nothing
			 * is returned. */
		}
	};
	let loadingLabel = "Init Logger";
	logger.start(loadingLabel);
	if (Meteor.isProduction) {
		/**
		 * Reducing logs to just warnings and errors.
		 * @type {number}
		 * @see ./logger.js
		 */
		logger.level = 3;
		console.info("Running in Production Mode!");
	} else {
		logger.level = 4;
		console.info("Running in Development Mode!");
	}
	logger.log("ConsoleExtend instantiated at level: " + logger.level);
	logger.end(loadingLabel);
})();

