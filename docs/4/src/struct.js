import { isT, owT, tof } from '../../lib/ist/dist/bun/esm/bundle.js';

const isSchema = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const getDefaultValue = (validator) => {
    if (isSchema(validator)) return makeBaseObj(validator);
    if ([isT.p, isT.p.bln, owT.p, owT.p.bln].some(c => c === validator)) return false;
    if ([isT.p.int, isT.p.fin, owT.p.int, owT.p.fin].some(c => c === validator)) return 0;
    if (isT.p.big === validator || owT.p.big === validator) return 0n;
    if (isT.p.str === validator || owT.p.str === validator) return '';
    if (isT.p.sym === validator || owT.p.sym === validator) return Symbol();
    if (isT.o.ary === validator || owT.o.ary === validator) return [];
    if (isT.o.obj === validator || owT.o.obj === validator) return {};
    return null;
};

const makeBaseObj = (o) => {
    const base = {};
    for (let [name, validator] of Object.entries(o)) {
        base[name] = getDefaultValue(validator);
    }
    return base;
};

// 1. 各種ハンドラ・セッターの生成責務（SRP）
const createFreezeSetter = () => () => {
    throw new Error('Cannot assign to a frozen struct.');
};

const createDataSetter = (baseData, name, validator) => (v) => {
    if (validator(v)) {
        baseData[name] = v;
    }
};

const createSealUndefinedHandler = (k) => {
    throw new Error(`Property "${k}" is not defined in the schema.`);
};

const createNormalUndefinedHandler = (baseData, name, validator, nestedStruct, mode) => (k, val) => {
    baseData[name][k] = val;
    validator[k] = () => true;
    Object.defineProperty(nestedStruct, k, makeDescriptor(baseData[name], nestedStruct, k, validator[k], mode));
};

const createNestedSetter = (validator, undefinedHandler) => (v, nestedStruct) => {
    owT.o.obj(v);
    const schemaKeys = Object.keys(validator);
    
    for (const k of schemaKeys) {
        if (k in v) {
            nestedStruct[k] = v[k];
        }
    }

    for (const [k, val] of Object.entries(v)) {
        if (!schemaKeys.includes(k)) {
            undefinedHandler(k, val);
        }
    }
};

const createSetter = (baseData, name, structObj, validator, mode) => {
    if (mode === 'freeze') {
        return createFreezeSetter();
    }
    if (isSchema(validator)) {
        const nestedStruct = structObj[name];
        const undefinedHandler = mode === 'normal'
            ? createNormalUndefinedHandler(baseData, name, validator, nestedStruct, mode)
            : createSealUndefinedHandler;
        return createNestedSetter(validator, undefinedHandler);
    }
    return createDataSetter(baseData, name, validator);
};

// 2. ゲッター生成のファクトリ
const createGetter = (baseData, name, validator, nestedStruct) => {
    if (isSchema(validator)) {
        return () => nestedStruct;
    }
    return () => baseData[name];
};

// 3. ディスクリプタ生成の返却口は必ずこの1箇所に一本化（DRY）
const makeDescriptor = (baseData, structObj, name, validator, mode) => {
    const isNested = isSchema(validator);

    const nestedStruct = isNested ? createStruct(validator, baseData[name], mode) : null;
    if (isNested) {
        structObj[name] = nestedStruct;
    }

    const getter = createGetter(baseData, name, validator, nestedStruct);
    const setter = createSetter(baseData, name, structObj, validator, mode);

    return {
        get: getter,
        set(v) { setter(v, structObj); },
        configurable: mode === 'normal',
        enumerable: true
    };
};

const createStruct = (o, existingBase = null, mode = 'normal') => {
    owT.o.obj(o);
    const base = { _: existingBase || makeBaseObj(o) };
    const structObj = {};

    Object.defineProperty(structObj, '_', {
        value: base._,
        writable: false,
        configurable: false,
        enumerable: false
    });

    for (let [name, validator] of Object.entries(o)) {
        Object.defineProperty(structObj, name, makeDescriptor(base._, structObj, name, validator, mode));
    }

    if (mode === 'seal') Object.seal(structObj);
    if (mode === 'freeze') Object.freeze(structObj);

    return structObj;
};

export const struct = (o) => createStruct(o, null, 'normal');
struct.seal = (o) => createStruct(o, null, 'seal');
struct.freeze = (o) => createStruct(o, null, 'freeze');
