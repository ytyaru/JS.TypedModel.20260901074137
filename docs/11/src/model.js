import { isT, owT } from '../../lib/ist/dist/bun/esm/bundle.js';
import { isSchema, validateAssignment, makeBaseObj } from './common.js';

const kModelSchema = Symbol('model.schema');
const kInstanceState = Symbol('model.instanceState');

const createInstance = (schema, initialValues = {}) => {
    const base = makeBaseObj(schema);
    const instance = {};

    Object.defineProperty(instance, kInstanceState, {
        value: base,
        writable: false,
        configurable: false,
        enumerable: false
    });

    const defineProps = (subSchema, subBase, targetObj) => {
        for (const [name, validator] of Object.entries(subSchema)) {
            const isNested = isSchema(validator);
            if (isNested) {
                const nestedObj = {};
                defineProps(validator, subBase[name], nestedObj);
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

    defineProps(schema, base, instance);

    if (initialValues) {
        // 初期値の適用とバリデーション
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

export const model = (modelName, schema) => {
    owT.o.obj(schema);

    const ModelClass = {
        [modelName]: {
            schema,
            new(initialValues = {}) {
                return createInstance(schema, initialValues);
            },
            extends(extName, additionalSchema) {
                owT.o.obj(additionalSchema);
                const mergedSchema = { ...schema, ...additionalSchema };
                return model(extName, mergedSchema);
            }
        }
    };

    return ModelClass[modelName];
};

