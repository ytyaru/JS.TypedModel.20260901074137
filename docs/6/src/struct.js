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

// 1. 各種セッター・ハンドラの生成（SRP）
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

const createNestedSetter = (validator) => (v, nestedStruct) => {
    owT.o.obj(v);
    const schemaKeys = Object.keys(validator);
    
    // スキーマに定義されているキーのみマージ代入
    for (const k of schemaKeys) {
        if (k in v) {
            nestedStruct[k] = v[k];
        }
    }

    // スキーマ外のキーは一律で拒否（厳格なseal動作）
    for (const k of Object.keys(v)) {
        if (!schemaKeys.includes(k)) {
            createSealUndefinedHandler(k);
        }
    }
};

const createSetter = (validator, mode) => {
    if (mode === 'freeze') {
        return createFreezeSetter();
    }
    if (isSchema(validator)) {
        return createNestedSetter(validator);
    }
    return null; // プリミティブ用は直接構築
};

// 2. ゲッター生成
const createGetter = (baseData, name, validator, nestedStruct) => {
    if (isSchema(validator)) {
        return () => nestedStruct;
    }
    return () => baseData[name];
};

// 3. ディスクリプタ生成（DRY）
const makeDescriptor = (baseData, structObj, name, validator, mode) => {
    const isNested = isSchema(validator);
    const nestedStruct = isNested ? createStruct(validator, baseData[name], mode) : null;
    
    if (isNested) {
        structObj[name] = nestedStruct;
    }

    const getter = createGetter(baseData, name, validator, nestedStruct);
    const setter = isNested 
        ? createSetter(validator, mode) 
        : createDataSetter(baseData, name, validator);

    return {
        get: getter,
        set(v) { 
            if (mode === 'freeze') {
                createFreezeSetter()();
            }
            setter(v, isNested ? nestedStruct : undefined); 
        },
        configurable: false, // キーの削除・再定義を禁止（Sealの徹底）
        enumerable: true
    };
};

const createStruct = (o, existingBase = null, mode = 'seal') => {
    owT.o.obj(o);
    for (const validator of Object.values(o)) {
        if (!isSchema(validator)) {
            owT.o.fn(validator);
        }
    }

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

    Object.seal(structObj);
    Object.seal(base._);

    if (mode === 'freeze') {
        Object.freeze(structObj);
        Object.freeze(base._);
    }

    return structObj;
};

// API定義
export const struct = (o) => createStruct(o, null, 'seal');
struct.seal = (o) => createStruct(o, null, 'seal');
struct.freeze = (o) => createStruct(o, null, 'freeze');
