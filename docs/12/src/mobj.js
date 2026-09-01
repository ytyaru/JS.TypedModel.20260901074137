import { isT, owT } from '../../lib/ist/dist/bun/esm/bundle.js';
import { isNestedStructure, validateAssignment, makeBaseObj } from './common.js';

const createDescriptor = (baseData, containerObj, name, validator) => {
    const isNested = isNestedStructure(validator);
    const nestedObj = isNested ? createMObj(validator, baseData[name]) : null;

    if (isNested) {
        containerObj[name] = nestedObj;
    }

    return {
        get: isNested ? (() => nestedObj) : (() => baseData[name]),
        set: isNested ? (v) => {
            validateAssignment(validator, v);
            for (const [k, val] of Object.entries(v)) {
                nestedObj[k] = val;
            }
        } : (v) => {
            if (validator(v)) {
                baseData[name] = v;
            }
        },
        configurable: false,
        enumerable: true
    };
};

const createMObj = (definition, existingBase = null) => {
    owT.o.obj(definition);
    const base = existingBase || makeBaseObj(definition);
    const obj = {};

    for (let [name, validator] of Object.entries(definition)) {
        Object.defineProperty(obj, name, createDescriptor(base, obj, name, validator));
    }

    Object.seal(obj);
    Object.seal(base);
    return obj;
};

export const mobj = (definition) => createMObj(definition, null);
