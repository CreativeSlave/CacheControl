let polyfills = {};
/**
 * Array.indexOf
 */
polyfills.indexOf = "native";
if (!Array.prototype.indexOf) {
    polyfills.indexOf = "polyfill";
    Array.prototype.indexOf = function (vMember, nStartFrom) {
        /*
        In non-strict mode, if the `this` variable is null or undefined, then it is
        set the the window object. Otherwise, `this` is automaticly converted to an
        object. In strict mode if the `this` variable is null or undefined a
        `TypeError` is thrown.
        */
        if (this == null) {
            throw new TypeError("Array.prototype.indexOf() - can't convert `" + this + "` to object");
        }
        var  nIdx = isFinite(nStartFrom) ? Math.floor(nStartFrom) : 0,
            oThis = this instanceof Object ? this : new Object(this),
            nLen  = isFinite(oThis.length) ? Math.floor(oThis.length) : 0;
        if (nIdx >= nLen) {return -1;}
        if (nIdx < 0) {
            nIdx = Math.max(nLen + nIdx, 0);
        }
        if (vMember === undefined) {
            /*
            Since `vMember` is undefined, keys that don't exist will have the same
            value as `vMember`, and thus do need to be checked.
            */
            do {
                if (nIdx in oThis && oThis[nIdx] === undefined) {
                    return nIdx;
                }
            } while (++nIdx < nLen);
        } else {
            do {
                if (oThis[nIdx] === vMember) {
                    return nIdx;
                }
            } while (++nIdx < nLen);
        }
        return -1;
    };
};
