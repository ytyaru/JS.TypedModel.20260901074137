import { isT, owT } from '../../lib/ist/dist/bun/esm/bundle.js';
import { dfv } from './dfv.js';

export const isNestedStructure = (v) => isT.o.obj(v);

export const validateAssignment = (definition, v) => {
    owT.o.obj(v);
    const schemaKeys = Object.keys(definition);

    for (const k of Object.keys(v)) {
        if (!schemaKeys.includes(k)) {
            throw new Error(`Property "${k}" is not defined in the structure.`);
        }
    }

    for (const k of schemaKeys) {
        if (k in v) {
            const subValidator = definition[k];
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

// Object.defineProperty を一箇所に集約した共通関数
export const defineManagedProperty = ({
    targetObj,
    name,
    getter,
    setter,
    mode
}) => {
    Object.defineProperty(targetObj, name, {
        get: getter,
        set: (v) => {
            if (mode === 'freeze') {
                throw new Error('Cannot assign to a frozen object.');
            }
            setter(v);
        },
        configurable: false,
        enumerable: true
    });
};
