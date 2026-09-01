import { owT } from '../../lib/ist/dist/bun/esm/bundle.js';
import { isNestedStructure, validateAssignment, makeBaseObj, defineManagedProperty } from './common.js';

const createMObj = (definition, existingBase = null) => {
    owT.o.obj(definition);
    const base = existingBase || makeBaseObj(definition);
    const targetObj = {};

    for (const [name, validator] of Object.entries(definition)) {
        const isNested = isNestedStructure(validator);
        let getter, setter;

        if (isNested) {
            const nestedObj = createMObj(validator, base[name]);
            targetObj[name] = nestedObj;
            getter = () => nestedObj;
            setter = (v) => {
                validateAssignment(validator, v);
                for (const [k, val] of Object.entries(v)) {
                    nestedObj[k] = val;
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

        defineManagedProperty({ targetObj, name, getter, setter, mode: 'seal' });
    }

    Object.seal(targetObj);
    Object.seal(base);
    return targetObj;
};

export const mobj = (definition) => createMObj(definition, null);
