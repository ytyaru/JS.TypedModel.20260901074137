import { isT, owT } from '../../lib/ist/dist/bun/esm/bundle.js';
import { dfv } from './dfv.js';

// オブジェクトの入れ子（ネスト構造）であるかを判定する述語
export const isNestedStructure = (v) => isT.o.obj(v);

export const validateAssignment = (validator, v) => {
    owT.o.obj(v);
    const schemaKeys = Object.keys(validator);

    for (const k of Object.keys(v)) {
        if (!schemaKeys.includes(k)) {
            throw new Error(`Property "${k}" is not defined in the structure.`);
        }
    }

    for (const k of schemaKeys) {
        if (k in v) {
            const subValidator = validator[k];
            const subVal = v[k];
            if (isNestedStructure(subValidator)) {
                validateAssignment(subValidator, subVal);
            } else {
                owT.o.fn(subValidator);
                if (!subValidator(subVal)) {
                    throw new Error(`Invalid value for property "${k}"`);
                }
            }
        }
    }
};

export const makeBaseObj = (definition) => {
    const base = {};
    for (let [name, validator] of Object.entries(definition)) {
        base[name] = isNestedStructure(validator) ? makeBaseObj(validator) : dfv(validator);
    }
    return base;
};
