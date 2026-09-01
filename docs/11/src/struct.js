import { isT, owT } from '../../lib/ist/dist/bun/esm/bundle.js';
import { isSchema, validateAssignment, makeBaseObj } from './common.js';

const kSchema = Symbol();
const kState = Symbol();
const kMode = Symbol();

const deepCloneState = (val) => {
    if (val === null || typeof val !== 'object') return val;
    if (val instanceof Date) return new Date(val.getTime());
    if (val instanceof RegExp) return new RegExp(val);
    if (Array.isArray(val)) {
        return val.map(deepCloneState);
    }
    if (Object.prototype === Object.getPrototypeOf(val)) {
        const copy = {};
        for (const [k, v] of Object.entries(val)) {
            copy[k] = deepCloneState(v);
        }
        return copy;
    }
    return val;
};

const makeDescriptor = (baseData, structObj, name, validator, mode) => {
    const isNested = isSchema(validator);
    const nestedStruct = isNested ? createStruct(validator, baseData[name], mode) : null;

    if (isNested) {
        structObj[name] = nestedStruct;
    }

    const setter = (mode === 'freeze') 
        ? () => { throw new Error('Cannot assign to a frozen struct.'); }
        : isNested 
            ? (v) => {
                validateAssignment(validator, v);
                for (const [k, val] of Object.entries(v)) {
                    nestedStruct[k] = val;
                }
            }
            : (v) => {
                if (validator(v)) {
                    baseData[name] = v;
                }
            };

    return {
        get: isNested ? (() => nestedStruct) : (() => baseData[name]),
        set: setter,
        configurable: false,
        enumerable: true
    };
};

const createStruct = (o, existingBase = null, mode = 'seal') => {
    owT.o.obj(o);
    const base = existingBase || makeBaseObj(o);
    const structObj = {};

    Object.defineProperty(structObj, kSchema, { value: o, writable: false, configurable: false, enumerable: false });
    Object.defineProperty(structObj, kState, { value: base, writable: false, configurable: false, enumerable: false });
    Object.defineProperty(structObj, kMode, { value: mode, writable: false, configurable: false, enumerable: false });

    for (let [name, validator] of Object.entries(o)) {
        Object.defineProperty(structObj, name, makeDescriptor(base, structObj, name, validator, mode));
    }

    Object.seal(structObj);
    Object.seal(base);
    if (mode === 'freeze') {
        Object.freeze(structObj);
        Object.freeze(base);
    }

    return structObj;
};

export const struct = (o) => createStruct(o, null, 'seal');
struct.freeze = (o) => createStruct(o, null, 'freeze');
struct.clone = (target) => {
    owT.o.obj(target);
    return createStruct(target[kSchema], deepCloneState(target[kState]), target[kMode]);
};
struct.extends = (target, additionalSchema) => {
    owT.o.obj(target);
    owT.o.obj(additionalSchema);
    return createStruct(
        { ...target[kSchema], ...additionalSchema },
        { ...deepCloneState(target[kState]), ...makeBaseObj(additionalSchema) },
        target[kMode]
    );
};
