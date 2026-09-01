import { owT } from '../../lib/ist/dist/bun/esm/bundle.js';
import { isNestedStructure, validateAssignment, makeBaseObj, defineManagedProperty } from './common.js';

const kInstanceState = Symbol('model.instanceState');

const createInstance = (definition, initialValues = {}) => {
    const base = makeBaseObj(definition);
    const targetObj = {};

    Object.defineProperty(targetObj, kInstanceState, {
        value: base,
        writable: false,
        configurable: false,
        enumerable: false
    });

    for (const [name, validator] of Object.entries(definition)) {
        const isNested = isNestedStructure(validator);
        let getter, setter;

        if (isNested) {
            const nestedObj = createInstance(validator);
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

    if (initialValues) {
        for (const [k, v] of Object.entries(initialValues)) {
            if (k in targetObj) {
                targetObj[k] = v;
            }
        }
    }

    Object.seal(targetObj);
    Object.seal(base);
    return targetObj;
};

export const model = (modelName, definition) => {
    owT.o.obj(definition);

    const ModelClass = {
        [modelName]: {
            definition,
            new(initialValues = {}) {
                return createInstance(definition, initialValues);
            },
            extends(extName, additionalDefinition) {
                owT.o.obj(additionalDefinition);
                return model(extName, { ...definition, ...additionalDefinition });
            }
        }
    };

    return ModelClass[modelName];
};
