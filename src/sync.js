/**
 * SynchronizedChain
 */
function SynchronizedChain(context={}){
	let sync = this;
	let ifExpression;
	sync.next = {
		context: context || {},
		if: function(expression, callback){
			ifExpression = expression;
			if(ifExpression && callback) {
				sync.next.context["IF"] = true;
				Object.freeze(sync.next.context["IF"]);
				callback(sync.next.context);
			}
			return sync.next;
		},
		else: function(callback){
			if(!ifExpression && callback) {
				sync.next.context["IF"] = false;
				Object.freeze(sync.next.context["IF"]);
				callback(sync.next.context);
			}
			return sync.next;
		},
		then: function(callback){
			if(callback) callback(sync.next.context);
			return sync.next;
		}
	}
	return sync.next;
};

const sync = new SynchronizedChain();
