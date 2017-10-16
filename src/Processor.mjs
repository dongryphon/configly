'use strict';

import { Empty, capitalize, raise, toArray } from './Util.mjs';

/**
 * Processors are helper objects that capture the options of the `processors` mechanism
 * for classes.
 *
 * For example:
 *
 *      @define({
 *          processors: [ 'config' ]
 *      })
 *      class Foo extends Base {
 *          static applyConfig () {
 *          }
 *      }
 *
 * Alternatively:
 *
 *      @define({
 *          processors: {
 *              config: 'mixins'
 *
 *              // Equivalent to:
 *              config: {
 *                  after: 'mixins'
 *              }
 *          }
 *      })
 *      class Foo extends Base {
 *          static applyConfig () {
 *          }
 *      }
 */
export default class Processor {
    constructor (name, options) {
        this.applier = Processor.getApplierName(name);
        this.name = name;

        if (options) {
            let after;

            if (typeof options === 'string') {
                after = [options];
            }
            else if (Array.isArray(options)) {
                after = options;
            }
            else {
                after = toArray(options.after) || null;
                this.before = toArray(options.before) || null;
            }

            this.after = after;
        }
    }

    clone () {
        let after = this.after;
        let before = this.before;
        let options = after ? { after: after } : null;

        if (before) {
            (options || (options = {})).before = before;
        }

        return new Processor(this.name, options);
    }

    sort (state) {
        if (this.sorted) {
            return;
        }

        let name = this.name;
        let path = state.path;

        path.push(name);

        if (this.sorting) {
            raise(`Circular processor dependencies: ${path.join(" --> ")}`);
        }

        this.sorting = true;

        for (let after = this.after, i = 0; i < 2; ++i, after = state.afters[name]) {
            if (after) {
                for (let a of after) {
                    state.map[a].sort(state);
                }
            }
        }

        this.sorting = false;
        this.sorted = true;

        path.pop();
        state.sorted.push(this);
    }

    static decode (processors, inherited) {
        let map = new Empty();

        if (typeof processors === 'string') {
            processors = [processors];
        }

        if (Array.isArray(processors)) {
            for (let name of processors) {
                map[name] = new Processor(name);
            }
        }
        else {
            for (let name in processors) {
                map[name] = new Processor(name, processors[name]);
            }
        }

        if (inherited) {
            for (let proc of inherited) {
                if (!map[proc.name]) {
                    proc = proc.clone();
                    proc.inherited = true;
                    map[proc.name] = proc;
                }
            }
        }

        return Processor.sort(map);
    }

    static getApplierName (name) {
        let nameMap = Processor.nameMap;
        let ret = nameMap[name];

        if (!ret) {
            let cap = capitalize(name);

            nameMap[name] = ret = 'apply' + cap;
        }

        return ret;
    }

    static sort (procMap) {
        let processors = Object.values(procMap);
        let ret = [];
        let state = {
            afters: new Empty(),
            map: procMap,
            path: [],
            sorted: ret
        };

        for (let proc of processors) {
            let before = proc.before;

            if (before) {
                for (let b of before) {
                    if (!procMap[b]) {
                        raise(`No processor matches "before"="${b}" on ${proc.name}`);
                    }

                    let afters = state.afters;
                    (afters[b] || (afters[b] = [])).push(proc.name);
                }
            }
        }

        // Sort the processors so that inherited processors are inserted first.
        processors.sort(Processor.sortFn);

        for (let proc of processors) {
            proc.sort(state);
        }

        ret.byName = procMap;
        return ret;
    }

    static sortFn (a, b) {
        if (a.inherited === b.inherited) {
            return (a.name < b.name) ? -1 : ((b.name < a.name) ? 1 : 0);
        }

        return a.inherited ? -1 : 1;
    }
}

Object.assign(Processor.prototype, {
    after: null,
    before: null,

    inherited: false,
    sorting: false,
    sorted: false
});

Processor.nameMap = new Empty();
