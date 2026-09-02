import { isT, owT } from '../../lib/ist/dist/bun/esm/bundle.js';
import { isNestedStructure, validateDefinition, validateAssignment, makeBaseObj, defineManagedProperty } from './common.js';
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
//    if (!isT.p(val) && !isT.d.nul(val) && !isT.d.und(val) && !isT.d.num(val)) {throw new TypeError(`structの代入値はプリミティブ型のみ有効です。`)}
    return val;
};

const createStruct = (definition, existingBase = null, mode = 'seal') => {
//    owT.o.obj(definition);
    validateDefinition(definition); // ここで非関数を検知して例外を投げる
    const base = existingBase || makeBaseObj(definition);
    const targetObj = {};

    Object.defineProperty(targetObj, kDefinition, { value: definition, writable: false, configurable: false, enumerable: false });
    Object.defineProperty(targetObj, kState, { value: base, writable: false, configurable: false, enumerable: false });
    Object.defineProperty(targetObj, kMode, { value: mode, writable: false, configurable: false, enumerable: false });

    for (const [name, validator] of Object.entries(definition)) {
//        [isT.p, isT.p.some, isT.p.bln, isT.p.fin, isT.p.int, isT.p.big, isT.p.str, isT.p.sym, isT.d.nul, isT.d.und, isT.d.num, isT.d.num.some, isT.d.num.nan, isT.d.num.inf, isT.d.num.pinf, isT.d.num.ninf, owT.p, owT.p.some, owT.p.bln, owT.p.fin, owT.p.int, owT.p.big, owT.p.str, owT.p.sym, owT.d.nul, owT.d.und, owT.d.num, owT.d.num.some, owT.d.num.nan, owT.d.num.inf, owT.d.num.pinf, owT.d.num.ninf].some()
//        if (!isT.p(val) && !isT.d.nul(val) && !isT.d.und(val) && !isT.d.num(val)) {throw new TypeError(`structの代入値はプリミティブ型のみ有効です。`)}
        defineManagedProperty((isNestedStructure(validator) ? getNestDes : getDataDes)(base, targetObj, name, validator, mode));
        /*
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
        */
    }

    Object.seal(targetObj);
    Object.seal(base);
    if (mode === 'freeze') {
        Object.freeze(targetObj);
        Object.freeze(base);
    }

    return targetObj;
};

const isPrim = (v) => {// structの代入値はプリミティブ型のみ有効です。
    if (!isT.p(v) && !isT.d.nul(v) && !isT.d.und(v) && !isT.d.num(v)) {throw new TypeError(`Only primitive types are valid for struct assignment values.`)}
    return true;
}

const getNestDes = (base, targetObj, name, validator, mode) => {
    const nestedStruct = createStruct(validator, base[name], mode);
    targetObj[name] = nestedStruct;
    return {targetObj,name,
        getter:()=>nestedStruct,
        setter:(v)=>{
            validateAssignment(validator, v);
            for (const [k, val] of Object.entries(v)) {
                nestedStruct[k] = val;
            }
        },mode
    };
}
const getDataDes = (base, targetObj, name, validator, mode) => {
    return {targetObj,name,
        getter:()=>base[name],
        setter:(v)=>{
//            if (validator(v)) {
            if (validator(v) && isPrim(v)) {
                base[name] = v;
            }
        },mode
    };
}

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
