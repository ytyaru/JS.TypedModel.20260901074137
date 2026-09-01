import { isT, owT } from '../../lib/ist/dist/bun/esm/bundle.js';
import { isNestedStructure, validateAssignment, makeBaseObj } from './common.js';

const kInstanceState = Symbol('model.instanceState');

const defineProperties = (definition, subBase, targetObj) => {
    for (const [name, validator] of Object.entries(definition)) {
        const isNested = isNestedStructure(validator);
        if (isNested) {
            const nestedObj = {};
            defineProperties(validator, subBase[name], nestedObj);
            targetObj[name] = nestedObj;
            Object.defineProperty(targetObj, name, {
                get: () => nestedObj,
                set: (v) => {
                    validateAssignment(validator, v);
                    for (const [k, val] of Object.entries(v)) {
                        nestedObj[k] = val;
                    }
                },
                configurable: false,
                enumerable: true
            });
        } else {
            Object.defineProperty(targetObj, name, {
                get: () => subBase[name],
                set: (v) => {
                    if (validator(v)) {
                        subBase[name] = v;
                    }
                },
                configurable: false,
                enumerable: true
            });
        }
    }
};

const createInstance = (definition, initialValues = {}) => {
    const base = makeBaseObj(definition);
    const instance = {};

    Object.defineProperty(instance, kInstanceState, {
        value: base,
        writable: false,
        configurable: false,
        enumerable: false
    });

    defineProperties(definition, base, instance);

    if (initialValues) {
        for (const [k, v] of Object.entries(initialValues)) {
            if (k in instance) {
                instance[k] = v;
            }
        }
    }

    Object.seal(instance);
    Object.seal(base);
    return instance;
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
