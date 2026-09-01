import { owT } from '../../lib/ist/dist/bun/esm/bundle.js';
import { isNestedStructure, validateAssignment, makeBaseObj, defineManagedProperty } from './common.js';

const kDefinition = Symbol();
const kState = Symbol();
const kMode = Symbol();

const deepCloneState = (val) => {
    if (val === null || typeof val !== 'object') return val;
    if (Array.isArray(val)) return val.map(deepCloneState);
    if (Object.prototype === Object.getPrototypeOf(val)) {
        const copy = {};
        for (const [k, v] of Object.entries(val)) {
            copy[k] = deepCloneState(v);
        }
        return copy;
    }
    return val;
};

const createStruct = (definition, existingBase = null, mode = 'seal') => {
    owT.o.obj(definition);
    const base = existingBase || makeBaseObj(definition);
    const targetObj = {};

    Object.defineProperty(targetObj, kDefinition, { value: definition, writable: false, configurable: false, enumerable: false });
    Object.defineProperty(targetObj, kState, { value: base, writable: false, configurable: false, enumerable: false });
    Object.defineProperty(targetObj, kMode, { value: mode, writable: false, configurable: false, enumerable: false });

    for (const [name, validator] of Object.entries(definition)) {
        const isNested = isNestedStructure(validator);
        let getter, setter;

        if (isNested) {
            const nestedStruct = createStruct(validator, base[name], mode);
            targetObj[name] = nestedStruct;
            getter = () => nestedStruct;
            setter = (v) => {
                validateAssignment(validator, v);
                for (const [k, val] of Object.entries(v)) {
                    nestedStruct[k] = val;
                }
            };
        } else {
            getter = () => base[name];
            setter = (v) => {
                if (validator(v)) {
                    base[name] = v;
                }
            };
        }

        defineManagedProperty({ targetObj, name, getter, setter, mode });
    }

    Object.seal(targetObj);
    Object.seal(base);
    if (mode === 'freeze') {
        Object.freeze(targetObj);
        Object.freeze(base);
    }

    return targetObj;
};

export const struct = (definition) => createStruct(definition, null, 'seal');
struct.freeze = (definition) => createStruct(definition, null, 'freeze');
struct.clone = (target) => {
    owT.o.obj(target);
    return createStruct(target[kDefinition], deepCloneState(target[kState]), target[kMode]);
};
struct.extends = (target, additionalDefinition) => {
    owT.o.obj(target);
    owT.o.obj(additionalDefinition);
    return createStruct(
        { ...target[kDefinition], ...additionalDefinition },
        { ...deepCloneState(target[kState]), ...makeBaseObj(additionalDefinition) },
        target[kMode]
    );
};
