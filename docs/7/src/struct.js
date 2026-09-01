import { isT, owT, tof } from '../../lib/ist/dist/bun/esm/bundle.js';
import {dfv} from './dfv.js';

const getDefaultValue = (validator) => isT.o.obj(validator) ? makeBaseObj(validator) : dfv(validator);

const makeBaseObj = (o) => {
    const base = {};
    for (let [name, validator] of Object.entries(o)) {
        base[name] = getDefaultValue(validator);
    }
    return base;
};

// 1. 各種セッターの生成（初期化時に完全に独立した関数として生成し、実行時分岐を排除）
const createFreezeSetter = () => () => {
    throw new Error('Cannot assign to a frozen struct.');
};

const createPrimitiveSetter = (baseData, name, validator) => (v) => {
    if (validator(v)) {
        baseData[name] = v;
    }
};

const createSealUndefinedHandler = (k) => {
    throw new Error(`Property "${k}" is not defined in the schema.`);
};

// アトミック性のための事前検証
const validateNestedAssignment = (validator, v) => {
    owT.o.obj(v);
    const schemaKeys = Object.keys(validator);

    for (const k of Object.keys(v)) {
        if (!schemaKeys.includes(k)) {
            createSealUndefinedHandler(k);
        }
    }

    for (const k of schemaKeys) {
        if (k in v) {
            const subValidator = validator[k];
            const subVal = v[k];
            if (isT.o.obj(subValidator)) {
                validateNestedAssignment(subValidator, subVal);
            } else {
                owT.o.fn(subValidator);
                if (!subValidator(subVal)) {
                    throw new Error(`Invalid value for property "${k}"`);
                }
            }
        }
    }
};

const createNestedSetter = (validator, nestedStruct) => (v) => {
    validateNestedAssignment(validator, v);

    const schemaKeys = Object.keys(validator);
    for (const k of schemaKeys) {
        if (k in v) {
            nestedStruct[k] = v[k];
        }
    }
};

/*
// 2. ゲッター生成（実行時分岐なし）
const createGetter = (baseData, name, validator, nestedStruct) => {
    if (isT.o.obj(validator)) {
        return () => nestedStruct;
    }
    return () => baseData[name];
};
*/
const createGetter = (baseData, name, validator, nestedStruct) => isT.o.obj(validator) ?  (() => nestedStruct) : (() => baseData[name]);

// 3. ディスクリプタ生成
const makeDescriptor = (baseData, structObj, name, validator, mode) => {
    const isNested = isT.o.obj(validator);
    const nestedStruct = isNested ? createStruct(validator, baseData[name], mode) : null;
    
    if (isNested) {
        structObj[name] = nestedStruct;
    }

    const getter = createGetter(baseData, name, validator, nestedStruct);
    
    // 初期化時にセッターを完全に決定。実行時は分岐ゼロでそのまま呼ぶだけにする。
    /*
    let setter;
    if (mode === 'freeze') {
        setter = createFreezeSetter();
    } else if (isNested) {
        setter = createNestedSetter(validator, nestedStruct);
    } else {
        setter = createPrimitiveSetter(baseData, name, validator);
    }
    */
    const setter = (mode === 'freeze') ? createFreezeSetter() : isNested ? createNestedSetter(validator, nestedStruct) : createPrimitiveSetter(baseData, name, validator);

    return {
        get: getter,
        set: setter, // 実行時引数の切り替えや分岐を一切排し、生成されたセッターをそのままバインド
        configurable: false,
        enumerable: true
    };
};

const createStruct = (o, existingBase = null, mode = 'seal') => {
    owT.o.obj(o);
    for (const validator of Object.values(o)) {
        if (!isT.o.obj(validator)) {
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

export const struct = (o) => createStruct(o, null, 'seal');
//struct.seal = (o) => createStruct(o, null, 'seal');
struct.freeze = (o) => createStruct(o, null, 'freeze');
