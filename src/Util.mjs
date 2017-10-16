// https://jsperf.com/object-create-null-vs-new-empty-prototype

export function Empty (src) {
    if (src) {
        Object.assign(this, src);
    }
}

// For sanity (not safe to drop this one out):
Object.defineProperty(Empty.prototype = Object.create(null), 'hasOwnProperty', {
    value: Object.prototype.hasOwnProperty
});

class MyMap extends Map {
    addAll (src) {
        for (let [key, value] of src) {
            this.add(key, value);
        }

        return this;
    }

    clone () {
        return new MyMap().addAll(this);
    }
}

export { MyMap as Map };

class MySet extends Set {
    constructor () {
        super();
    }

    addAll (src) {
        for (let v of src) {
            this.add(v);
        }

        return this;
    }

    clone () {
        return new MySet().addAll(this);
    }
}

export { MySet as Set };

export function nullFn () {}

export function copy (dest, ...sources) {
    if (dest) {
        for (let src of sources) {
            if (src) {
                for (let key in src) {
                    dest[key] = src[key];
                }
            }
        }
    }

    return dest;
}

export function copyIf (dest, ...sources) {
    if (dest) {
        for (let src of sources) {
            if (src) {
                for (let key in src) {
                    if (!(key in dest)) {
                        dest[key] = src[key];
                    }
                }
            }
        }
    }

    return dest;
}

export function capitalize (str) {
    return str ? str[0].toUpperCase() + str.substr(1) : '';
}

export function decapitalize (str) {
    return str ? str[0].toLowerCase() + str.substr(1) : '';
}

export function raise (msg) {
    throw new Error(msg);
}

export function prototype (members) {
    return C => {
        Object.assign(C.prototype, members);
    }
}

export function statics (members) {
    return C => {
        Object.assign(C, members);
    }
}

const setProto = Object.setPrototypeOf || (function () {
        let base = { works: 1 };
        let extended = {};

        extended.__proto__ = base;

        if (!extended.works) {
            return function () {
                Util.raise(`Cannot polyfill setPrototypeOf`);
            };
        }

        return function (object, prototype) {
            object.__proto__ = prototype;
        };
    }());

export { setProto };

export function toArray (src) {
    if (src && !Array.isArray(src)) {
        src = [src];
    }
    return src;
}
