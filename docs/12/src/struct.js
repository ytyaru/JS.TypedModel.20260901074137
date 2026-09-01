import { isT, owT } from '../../lib/ist/dist/bun/esm/bundle.js';
import { isNestedStructure, validateAssignment, makeBaseObj } from './common.js';

const kDefinition = Symbol();
const kState = Symbol();
const kMode = Symbol();

// プリミティブおよび配列・プレーンオブジェクトのみのシンプルなディープコピー
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

const makeDescriptor = (baseData, structObj, name, validator, mode) => {
    const isNested = isNestedStructure(validator);
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

const createStruct = (definition, existingBase = null, mode = 'seal') => {
    owT.o.obj(definition);
    const base = existingBase || makeBaseObj(definition);
    const structObj = {};

    Object.defineProperty(structObj, kDefinition, { value: definition, writable: false, configurable: false, enumerable: false });
    Object.defineProperty(structObj, kState, { value: base, writable: false, configurable: false, enumerable: false });
    Object.defineProperty(structObj, kMode, { value: mode, writable: false, configurable: false, enumerable: false });

    for (let [name, validator] of Object.entries(definition)) {
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
