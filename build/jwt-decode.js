(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
})((function () { 'use strict';

    /**
     * The code was extracted from:
     * https://github.com/davidchambers/Base64.js
     */

    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    function InvalidCharacterError(message) {
        this.message = message;
    }

    InvalidCharacterError.prototype = new Error();
    InvalidCharacterError.prototype.name = "InvalidCharacterError";

    function polyfill(input) {
        var str = String(input).replace(/=+$/, "");
        if (str.length % 4 == 1) {
            throw new InvalidCharacterError(
                "'atob' failed: The string to be decoded is not correctly encoded."
            );
        }
        for (
            // initialize result and counters
            var bc = 0, bs, buffer, idx = 0, output = "";
            // get next character
            (buffer = str.charAt(idx++));
            // character found in table? initialize bit storage and add its ascii value;
            ~buffer &&
            ((bs = bc % 4 ? bs * 64 + buffer : buffer),
                // and if not first of each 4 characters,
                // convert the first 8 bits to one ascii character
                bc++ % 4) ?
            (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)))) :
            0
        ) {
            // try to find character in table (0-63, not found => -1)
            buffer = chars.indexOf(buffer);
        }
        return output;
    }

    var atob = (typeof window !== "undefined" &&
        window.atob &&
        window.atob.bind(window)) ||
    polyfill;

    function b64DecodeUnicode(str) {
        return decodeURIComponent(
            atob(str).replace(/(.)/g, function(m, p) {
                var code = p.charCodeAt(0).toString(16).toUpperCase();
                if (code.length < 2) {
                    code = "0" + code;
                }
                return "%" + code;
            })
        );
    }

    function base64_url_decode(str) {
        var output = str.replace(/-/g, "+").replace(/_/g, "/");
        switch (output.length % 4) {
            case 0:
                break;
            case 2:
                output += "==";
                break;
            case 3:
                output += "=";
                break;
            default:
                throw new Error("base64 string is not of the correct length");
        }

        try {
            return b64DecodeUnicode(output);
        } catch (err) {
            return atob(output);
        }
    }

    function InvalidTokenError(message) {
        this.message = message;
    }

    InvalidTokenError.prototype = new Error();
    InvalidTokenError.prototype.name = "InvalidTokenError";

    function jwtDecode(token, options) {
        if (typeof token !== "string") {
            throw new InvalidTokenError("Invalid token specified: must be a string");
        }

        options = options || {};
        var pos = options.header === true ? 0 : 1;

        var part = token.split(".")[pos];
        if (typeof part !== "string") {
            throw new InvalidTokenError("Invalid token specified: missing part #" + (pos + 1));
        }

        try {
            var decoded = base64_url_decode(part);
        } catch (e) {
            throw new InvalidTokenError("Invalid token specified: invalid base64 for part #" + (pos + 1) + ' (' + e.message + ')');
        }

        try {
            var parsed = JSON.parse(decoded);
        } catch (e) {
            throw new InvalidTokenError("Invalid token specified: invalid json for part #" + (pos + 1) + ' (' + e.message + ')');
        }

        
        if(options.validate && options.header){
          var validationError = validateHeader(parsed);
        } else if(options.validate && !options.header){
          var validationError = validatePayload(parsed);
        } else {
            var validationError = undefined;
        }

        if(validationError){
             throw new InvalidTokenError("Invalid token specified: failed to validate, error:" + validationError);
        }

        return parsed;
    }

    function validateHeader(obj){
        if(typeof obj !== "object"){
            return "header expected to be an object"
        }

        // select all fields that are not valid
        var invalidFields = ["typ", "alg", "kid"].filter(function(name){
            return !isNullOrString(obj, name);
        });
        if(invalidFields.length){
            return "fields " + invalidFields.join(", ") + " expected to be string or undefined"
        }
    }

    function validatePayload(obj){
        if(typeof obj !== "object"){
            throw new InvalidTokenError("payload expected to be an object");
        }

        // select all fields that are not valid
        var invalidStringFields = ["iss", "sub", "jti"].filter(function(name){
            return !isNullOrString(obj, name);
        });
        var invalidNumberFields = ["exp", "nbf", "iat"].filter(function(name){
            return !isNullOrNumber(obj, name);
        });
        var invalidArrayOfStringFields = ["aud"].filter(function(name){
            return !isNullOrString(obj, name) && !isNullOrArrayOfString(obj, name);
        });

        var invalidFields = [...invalidStringFields, ...invalidNumberFields,...invalidArrayOfStringFields ];
        if(invalidFields.length){
            throw new InvalidTokenError("Invalid token specified: invalid payload fields " + invalidFields.join(", ") + " expected to be string or undefined");
        }
    }

    function isNullOrString(obj, name){
        var value = obj[name];
        return typeof value === "undefined" ||  typeof value === "string"
    }

    function isNullOrArrayOfString(obj, name){
        var value = obj[name];
        return Array.isArray(value) && value.every(function(item){ return typeof item === "string" })
    }

    function isNullOrNumber(obj, name){
        var value = obj[name];
        return typeof value === "undefined" ||  typeof value === "number"
    }

    /*
     * Expose the function on the window object
     */

    //use amd or just through the window object.
    if (window) {
        if (typeof window.define == "function" && window.define.amd) {
            window.define("jwt_decode", function() {
                return jwtDecode;
            });
        } else if (window) {
            window.jwt_decode = jwtDecode;
        }
    }

}));
//# sourceMappingURL=jwt-decode.js.map
