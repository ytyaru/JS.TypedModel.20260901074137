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

// 1. 各種ハンドラ・セッターの生成責務
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

const createNormalUndefinedHandler = (baseData, name, validator, structProxy, mode) => (k, val) => {
    baseData[name][k] = val;
    validator[k] = () => true;
    Object.defineProperty(structProxy, k, makeDescriptor(baseData[name], structProxy, k, validator[k], mode));
};

const createNestedSetter = (validator, undefinedHandler) => (v, baseData, name, structProxy) => {
    owT.o.obj(v);
    const schemaKeys = Object.keys(validator);
    
    // スキーマに定義されているキーのみ、存在する場合に下位のプロパティへ代入
    for (const k of schemaKeys) {
        if (k in v) {
            structProxy[k] = v[k];
        }
    }

    // スキーマ外の未知キー処理
    for (const [k, val] of Object.entries(v)) {
        if (!schemaKeys.includes(k)) {
            undefinedHandler(k, val);
        }
    }
};

// 2. セッター選定のファクトリ
const createSetter = (baseData, structObj, name, validator, mode) => {
    if (mode === 'freeze') {
        return createFreezeSetter();
    }
    if (isSchema(validator)) {
        const undefinedHandler = mode === 'normal'
            ? createNormalUndefinedHandler(baseData, name, validator, structObj, mode)
            : createSealUndefinedHandler;
        return createNestedSetter(validator, undefinedHandler);
    }
    return createDataSetter(baseData, name, validator);
};

// 3. ディスクリプタ生成の返却口を1箇所に一本化（DRY）
const makeDescriptor = (baseData, structObj, name, validator, mode) => {
    const isNested = isSchema(validator);
    
    // ネスト構造の場合、対応する子structインスタンスをキャッシュまたは生成して保持
    if (isNested && !structObj.__structs__) {
        structObj.__structs__ = {};
    }
    
    if (isNested && !structObj.__structs__[name]) {
        structObj.__structs__[name] = createStruct(validator, baseData[name], mode);
    }

    const setter = createSetter(baseData, structObj.__structs__ ? structObj.__structs__[name] : structObj, name, validator, mode);

    return {
        get() {
            return isNested ? structObj.__structs__[name] : baseData[name];
        },
        set(v) {
            setter(v, baseData, name, isNested ? structObj.__structs__[name] : structObj);
        },
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
/*
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

// 1. 各種ハンドラ・セッターの生成責務を完全に独立したファクトリに分割（SRP）
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

const createNestedSetter = (validator, undefinedHandler) => (v, structObj, name) => {
    owT.o.obj(v);
    const schemaKeys = Object.keys(validator);
    const nestedStruct = structObj[name];
    for (const [k, val] of Object.entries(v)) {
        if (schemaKeys.includes(k)) {
            nestedStruct[k] = val;
        } else {
            undefinedHandler(k, val);
        }
    }
};

// 2. セッター選定の責務を持つファクトリ
const createSetter = (baseData, structObj, name, validator, mode) => {
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

// 3. ディスクリプタの返却口は必ずこの1箇所のみ（DRYの徹底）
const makeDescriptor = (baseData, structObj, name, validator, mode) => {
    const isNested = isSchema(validator);

    if (isNested && !structObj[name]) {
        structObj[name] = createStruct(validator, baseData[name], mode);
    }

    const setter = createSetter(baseData, structObj, name, validator, mode);

    return {
        get: isNested ? () => structObj[name] : () => baseData[name],
        set(v) { setter(v, structObj, name); },
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


/*
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

const createSetter = (base, name, validator, mode) => {
    const isNested = isSchema(validator);
    if (mode === 'freeze') return createFreezeSetter();
    if (isNested) return createNestedSetter(base, name, validator, 'normal'===mode ? createNormalNestedUndefinedMethod : createSealNestedUndefinedMethod);
    return createDataSetter();
};
const createFreezeSetter = (base, name, validator, mode) => () => { throw new Error('Cannot assign to a frozen struct.'); };
const createDataSetter = (base, name, validator, mode) => (v) => {if(validator(v)) {base._[name] = v;}};
const createSealNestedUndefinedMethod = ()=>throw new Error(`Property "${k}" is not defined in the schema.`);
const createNormalNestedUndefinedMethod = (base, name, validator, k)=>{
    base._[name][k] = val;
    validator[k] = () => true;
    Object.defineProperty(nestedStruct, k, makeDescriptor(base._[name], nestedStruct, k, validator[k], mode));
}
const createNestedSetter = (base, name, validator, undefinedMethod) => {
    return (v, structObj) => {
        owT.o.obj(v);
        const schemaKeys = Object.keys(validator);
        const nestedStruct = structObj[name];
        for (const [k, val] of Object.entries(v)) {
            if (schemaKeys.includes(k)) {
                nestedStruct[k] = val;
            } else {
                undefinedMethod(base, name, validator);
            }
        }
    };
}
// 単一のプロパティディスクリプタを作成する責務に特化
const makeDescriptor = (baseData, structObj, name, validator, mode) => {
    const isNested = isSchema(validator);
    const nestedStruct = isNested ? createStruct(validator, baseData[name], mode) : null;

    if (isNested) {
        // structObj にネストされたオブジェクトを保持させるための初期設定
        structObj[name] = nestedStruct;
    }

    return {
        get() {
            return isNested ? structObj[name] : baseData[name];
        },
        set(v) {
            const setter = createSetter({ _: baseData }, name, validator, mode);
            setter(v, structObj);
        },
        configurable: mode === 'normal',
        enumerable: true
    };
};
const makeNestDes = (baseData, structObj, name, validator, mode) => {
}
const makeDataDes = (baseData, structObj, name, validator, mode) => {
}

const makeDes = (baseData, structObj, name, validator, mode) => {
    const setter = createSetter({ _: baseData }, name, validator, mode); // 実行する度に作るのではなく初回だけ作るべき。
    return {
        get() {
            return isNested ? structObj[name] : baseData[name];
        },
        set: setter(v, structObj),
        configurable: mode === 'normal',
        enumerable: true
    };
}
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
*/
