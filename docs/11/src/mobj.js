import { isT, owT } from '../../lib/ist/dist/bun/esm/bundle.js';
import { isSchema, validateAssignment, makeBaseObj } from './common.js';

const createDescriptor = (baseData, structObj, name, validator) => {
    const isNested = isSchema(validator);
    const nestedObj = isNested ? createMObj(validator, baseData[name]) : null;

    if (isNested) {
        structObj[name] = nestedObj;
    }

    return {
        get: isNested ? (() => nestedObj) : (() => baseData[name]),
        set: isNested ? (v) => {
            validateAssignment(validator, v);
            for (const [k, val] of Object.entries(v)) {
                nestedObj[k] = val;
            }
        } : (v) => {
            // mobjは全型を許容するため、validatorが関数なら何でも通す（あるいは独自判定）
            if (validator(v)) {
                baseData[name] = v;
            }
        },
        configurable: false,
        enumerable: true
    };
};

const createMObj = (o, existingBase = null) => {
    owT.o.obj(o);
    const base = existingBase || makeBaseObj(o);
    const obj = {};

    for (let [name, validator] of Object.entries(o)) {
        Object.defineProperty(obj, name, createDescriptor(base, obj, name, validator));
    }

    Object.seal(obj);
    Object.seal(base);
    return obj;
};

export const mobj = (o) => createMObj(o, null);
