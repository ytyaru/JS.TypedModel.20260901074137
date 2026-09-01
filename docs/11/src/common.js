import { isT, owT, tof } from '../../lib/ist/dist/bun/esm/bundle.js';
import { dfv } from './dfv.js';

export const isSchema = (v) => isT.o.obj(v);

export const validateAssignment = (validator, v) => {
    owT.o.obj(v);
    const schemaKeys = Object.keys(validator);

    for (const k of Object.keys(v)) {
        if (!schemaKeys.includes(k)) {
            throw new Error(`Property "${k}" is not defined in the schema.`);
        }
    }

    for (const k of schemaKeys) {
        if (k in v) {
            const subValidator = validator[k];
            const subVal = v[k];
            if (isSchema(subValidator)) {
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

export const makeBaseObj = (o) => {
    const base = {};
    for (let [name, validator] of Object.entries(o)) {
        base[name] = isSchema(validator) ? makeBaseObj(validator) : dfv(validator);
    }
    return base;
};
