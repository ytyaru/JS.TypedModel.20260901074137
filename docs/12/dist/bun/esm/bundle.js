// @bun
// ../lib/ist/dist/bun/esm/bundle.js
class Tys {
  static name(v) {
    if (v === null)
      return "Null";
    if (v === undefined)
      return "Undefined";
    if (Array.isArray(v))
      return "Array";
    const to = typeof v;
    if (to === "function")
      return FnTys.name(v);
    const name = this._name(v);
    return to === "object" ? this._obj(v, name) : name === "Number" ? this._num(v, name) : name;
  }
  static _name(v) {
    return Object.prototype.toString.call(v).slice(8, -1);
  }
  static _num(v, name) {
    return Number.isNaN(v) ? "NaN" : v === Infinity ? "Infinity" : v === -Infinity ? "-Infinity" : Number.isSafeInteger(v) ? "Integer" : Number.isFinite(v) ? "Finite" : name;
  }
  static _obj(v, name) {
    const proto = Object.getPrototypeOf(v);
    if (proto === null)
      return `HasNotPrototypeObject`;
    if ([Boolean, Number, String].some((C) => v instanceof C)) {
      return `BoxedPrimitive<${v.constructor.name}>`;
    }
    const des = DesTys.name(v);
    if (des)
      return des;
    const isPlain = Object.prototype === proto;
    if (isPlain)
      return `PlainObject`;
    const ctor = proto.constructor;
    const isEs6Ins = this._isEs6Ins(proto, ctor);
    const isEs5Ins = this._isEs5Ins(v, proto, ctor);
    if (!isPlain && name !== "Object" && !isEs6Ins && !isEs5Ins)
      return `NativeInstance<${name}>`;
    if (isEs6Ins || isEs5Ins)
      return `${isEs5Ins ? "ES5." : ""}Instance<${ctor.name || "(Anonymous)"}>`;
    return "PrototypedObject";
  }
  static _isEs6Ins(proto, ctor) {
    if (typeof ctor !== "function")
      return false;
    return FnTys._isEs6Cls(ctor);
  }
  static _isEs5Ins(v, proto, ctor) {
    return typeof ctor !== "function" || (ctor === Object || ctor === Function) || (FnTys._isEs6Cls(ctor) || FnTys._isNative(ctor, Function.prototype.toString.call(ctor))) ? false : FnTys._isEs5Cls(ctor) || proto !== Object.prototype && proto !== Function.prototype;
  }
}

class DesTys {
  static is(v) {
    const keys = Object.getOwnPropertyNames(v);
    if (keys.length === 0)
      return false;
    const allowedKeys = ["value", "writable", "get", "set", "configurable", "enumerable"];
    if (!keys.every((key) => allowedKeys.includes(key)))
      return false;
    const hasValue = keys.includes("value");
    const hasWritable = keys.includes("writable");
    const hasGet = keys.includes("get") && v.get !== undefined;
    const hasSet = keys.includes("set") && v.set !== undefined;
    return (hasValue || hasWritable) && (hasGet || hasSet) || hasGet && typeof v.get !== "function" && v.get !== undefined || hasSet && typeof v.set !== "function" && v.set !== undefined || !hasValue && !hasWritable && !hasGet && !hasSet ? false : this._naming(v, hasValue, hasGet, hasSet);
  }
  static _naming(v, hasValue, hasGet, hasSet) {
    return hasGet || hasSet ? hasGet && hasSet ? "Accessor" : hasGet ? "Getter" : "Setter" : hasValue && typeof v.value === "function" ? "Method" : "Value";
  }
  static name(v) {
    const type = this.is(v);
    return type ? `Descriptor<${type}>` : "";
  }
}

class FnTys {
  static name(v) {
    const s = Function.prototype.toString.call(v);
    const [isEs6, isEs5] = [this._isEs6Cls(v, s), this._isEs5Cls(v, s)];
    if (isEs6 || isEs5)
      return `${isEs5 ? "ES5." : ""}Class<${v.name || "(Anonymous)"}>`;
    if (this._isBound(v, s))
      return `BoundFunction<${v.name.replace(/bound /, "")}>`;
    if (this._isNative(v, s))
      return `Native${this._isNativeClass(v) ? "Class" : "Function"}<${v.name}>`;
    if (this._isArrow(v, s))
      return `${FnAgTys.name(v, s)}ArrowFunction`;
    if (this._isMethod(v, s))
      return `${FnAgTys.name(v, s)}Method`;
    const ag = FnAgTys.name(v, s);
    return !ag && !v.name ? "AnonymousFunction" : `${ag}Function`;
  }
  static _isEs6Cls(v, s) {
    if (!s)
      s = Function.prototype.toString.call(v);
    return /^\s*(?:\/\*[\s\S]*?\*\/\s*)*class\b/.test(s);
  }
  static _isEs5Cls(v, s) {
    if (!s)
      s = Function.prototype.toString.call(v);
    if (this._isEs6Cls(v, s) || this._isNative(v, s) || this._isArrow(v, s))
      return false;
    const proto = v.prototype;
    if (!proto || typeof proto !== "object")
      return false;
    const isCtorSelf = proto.constructor === v;
    if (!isCtorSelf)
      return false;
    const keys = Object.getOwnPropertyNames(proto);
    const hasCustomProps = keys.length > 1 || keys.length === 1 && keys[0] !== "constructor";
    const cleanS = s.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "").replace(/(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g, '""').replace(/\/([^\/\n\\]|\\.)+\/[gimsuy]*/g, "//");
    if (hasCustomProps || /\bthis\./.test(cleanS))
      return true;
    const name = v.name || "";
    return /^[A-Z]/.test(name);
  }
  static _isNative(v, s) {
    return s.includes("[native code]");
  }
  static _isNativeClass(v) {
    return v.prototype !== undefined && typeof v.prototype === "object";
  }
  static _isBound(v, s) {
    return v.name.startsWith("bound ");
  }
  static _isArrow(v, s) {
    return !v.hasOwnProperty("prototype") && s.includes("=>");
  }
  static _isMethod(v, s) {
    return /\bfunction\b/.test(s.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "")) ? false : !s.includes("=>");
  }
}

class FnAgTys {
  static name(v, s) {
    if (typeof v !== "function")
      return "";
    const cName = v.constructor?.name;
    if (cName === "AsyncGeneratorFunction")
      return "AsyncGenerator";
    if (cName === "GeneratorFunction")
      return "Generator";
    if (cName === "AsyncFunction")
      return "Async";
    if (!s)
      s = Function.prototype.toString.call(v);
    const cleanStr = s.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "").trim();
    const isAsync = cleanStr.startsWith("async") || cleanStr.includes("async ");
    const isGenerator = s.includes("*");
    return isAsync && isGenerator ? "AsyncGenerator" : isGenerator ? "Generator" : isAsync ? "Async" : "";
  }
}

class FnObj {
  static mk(someFn, { getters = {}, methods = {} } = {}) {
    const fn = function(...args) {
      if (new.target)
        throw new ReferenceError("Constructors are not allowed.");
      return someFn(...args);
    };
    fn.some = fn;
    for (const [key, val] of Object.entries(methods)) {
      fn[key] = val;
    }
    for (const [key, val] of Object.entries(getters)) {
      Object.defineProperty(fn, key, { get: () => val });
    }
    return fn;
  }
  static mkEr(isObj, pathStr) {
    const someFn = (v, ...args) => {
      if (isObj(v, ...args))
        return true;
      throw new TypeError(`Expected: a value that makes '${pathStr}' return true.
Actual: ${Tys.name(v)}`);
    };
    const methods = {};
    const getters = {};
    for (const key of Object.getOwnPropertyNames(isObj)) {
      if (["some", "_some", "_", "length", "name", "prototype", "caller", "arguments"].includes(key))
        continue;
      const val = isObj[key];
      if (typeof val === "function") {
        const subKeys = Object.getOwnPropertyNames(val).filter((k) => !["length", "name", "prototype", "caller", "arguments"].includes(k));
        if (subKeys.length > 0) {
          const subPathStr = pathStr.replace(/\.some\(v\)$/, `.${key}.some(v)`);
          getters[key] = FnObj.mkEr(val, subPathStr);
        } else {
          methods[key] = (v, ...args) => {
            if (val(v, ...args))
              return true;
            throw new TypeError(`Expected: '${val.toString()}' like value.
Actual: ${Tys.name(v)}`);
          };
        }
      }
    }
    if (typeof isObj._ === "function") {
      methods._ = (n, v, ...args) => {
        if (isObj[n](v, ...args))
          return true;
        throw new TypeError(`Expected: '${isObj[n].toString()}' like value.
Actual: ${Tys.name(v)}`);
      };
    }
    return this.mk(someFn, { getters, methods });
  }
}
var Typis = FnObj.mk((v) => "bln int fin big str sym".split(" ").some((n) => Typis[n](v)), {
  methods: {
    bln: (v) => typeof v === "boolean",
    int: (v) => Number.isSafeInteger(v),
    fin: (v) => Number.isFinite(v) && v <= Number.MAX_SAFE_INTEGER && Number.MIN_SAFE_INTEGER <= v,
    big: (v) => typeof v === "bigint",
    str: (v) => typeof v === "string",
    sym: (v) => typeof v === "symbol"
  }
});
var TyoisArrFn = FnObj.mk((v) => Tys.name(v).endsWith("ArrowFunction"), {
  methods: {
    a: (v) => Tys.name(v) === "AsyncArrowFunction",
    s: (v) => Tys.name(v) === "ArrowFunction"
  }
});
var TyoisFn = FnObj.mk((v) => {
  const N = Tys.name(v);
  return N.endsWith("Function") || `Bound Native`.split(" ").some((n) => N.startsWith(n + "Function<"));
}, {
  getters: { arrow: TyoisArrFn },
  methods: {
    bound: (v) => Tys.name(v).startsWith(`BoundFunction<`),
    native: (v) => Tys.name(v).startsWith(`NativeFunction<`),
    a: (v) => Tys.name(v) === "AsyncFunction",
    g: (v) => Tys.name(v) === "GeneratorFunction",
    ag: (v) => Tys.name(v) === "AsyncGeneratorFunction",
    s: (v) => Tys.name(v) === "Function",
    anonymous: (v) => Tys.name(v) === "AnonymousFunction",
    _some: (N) => N.endsWith("Function") || `Bound Native`.split(" ").some((n) => N.startsWith(n + "Function<"))
  }
});
var TyoisCls = FnObj.mk((v) => ["", "ES5.", "Native"].some((n) => Tys.name(v).startsWith(`${n}Class<`)), {
  methods: {
    es6: (v) => Tys.name(v).startsWith("Class<"),
    es5: (v) => Tys.name(v).startsWith("ES5.Class<"),
    native: (v) => Tys.name(v).startsWith("NativeClass<")
  }
});
var TyoisIns = FnObj.mk((v, C) => ["", "ES5.", "Native"].some((n) => Tys.name(v).startsWith(`${n}Instance<`)) && (C ? v instanceof C : true), {
  methods: {
    es6: (v, C) => Tys.name(v).startsWith("Instance<") && (C ? v instanceof C : true),
    es5: (v, C) => Tys.name(v).startsWith("ES5.Instance<") && (C ? v instanceof C : true),
    native: (v, C) => Tys.name(v).startsWith("NativeInstance<") && (C ? v instanceof C : true)
  }
});
var TyoisDesDA = (v, names) => names.map((n) => `Descriptor<${n}>`).some((n) => n === Tys.name(v));
var TyoisDesD = FnObj.mk((v) => TyoisDesDA(v, "Value Method".split(" ")), {
  methods: {
    v: (v) => Tys.name(v) === "Descriptor<Value>",
    m: (v) => Tys.name(v) === "Descriptor<Method>"
  }
});
var TyoisDesA = FnObj.mk((v) => TyoisDesDA(v, "Getter Setter Accessor".split(" ")), {
  methods: {
    g: (v) => Tys.name(v) === "Descriptor<Getter>",
    s: (v) => Tys.name(v) === "Descriptor<Setter>",
    a: (v) => Tys.name(v) === "Descriptor<Accessor>"
  }
});
var TyoisDes = FnObj.mk((v) => Tys.name(v).startsWith("Descriptor<"), {
  getters: { d: TyoisDesD, a: TyoisDesA }
});
var TyoisMd = FnObj.mk((v) => Tys.name(v).endsWith("Method"), {
  methods: {
    a: (v) => Tys.name(v) === "AsyncMethod",
    g: (v) => Tys.name(v) === "GeneratorMethod",
    ag: (v) => Tys.name(v) === "AsyncGeneratorMethod",
    s: (v) => Tys.name(v) === "Method"
  }
});
var Tyois = FnObj.mk((v) => {
  const N = Tys.name(v);
  return TyoisFn._some(N) || ["Method"].some((n) => N.endsWith(n)) || ["PlainObject", "Array"].some((n) => n === N) || ["Descriptor", "Class", "Instance"].some((n) => N.startsWith(n + "<"));
}, {
  getters: { cls: TyoisCls, ins: TyoisIns, des: TyoisDes, fn: TyoisFn, md: TyoisMd },
  methods: {
    obj: (v) => Tys.name(v) === "PlainObject",
    ary: (v) => Array.isArray(v)
  }
});
var TydisNum = FnObj.mk((v) => "nan inf ofin".split(" ").some((n) => TydisNum[n](v)), {
  methods: {
    nan: (v) => Number.isNaN(v),
    inf: (v) => [Infinity, -Infinity].some((x) => x === v),
    pinf: (v) => v === Infinity,
    ninf: (v) => v === -Infinity,
    oint: (v) => Number.isInteger(v) && !Number.isSafeInteger(v),
    ofin: (v) => Number.isFinite(v) && (Number.MAX_SAFE_INTEGER < v || v < Number.MIN_SAFE_INTEGER)
  }
});
var TydisObj = FnObj.mk((v) => {
  const N = Tys.name(v);
  return N.startsWith(`BoxedPrimitive<`) || "HasNotPrototypeObject PrototypedObject".split(" ").some((n) => n === N);
}, {
  methods: {
    boxed: (v) => Tys.name(v).startsWith(`BoxedPrimitive<`),
    hasNotProto: (v) => Tys.name(v) === "HasNotPrototypeObject",
    prototyped: (v) => Tys.name(v) === "PrototypedObject"
  }
});
var Tydis = FnObj.mk((v) => "und nul".split(" ").some((n) => Tydis[n](v)) || "num obj".split(" ").some((n) => Tydis[n].some(v)), {
  getters: { num: TydisNum, obj: TydisObj },
  methods: {
    und: (v) => v === undefined,
    nul: (v) => v === null
  }
});
var owTp = FnObj.mkEr(Typis, "isT.p.some(v)");
var owTo = FnObj.mkEr(Tyois, "isT.o.some(v)");
var owTd = FnObj.mkEr(Tydis, "isT.d.some(v)");
var isT = Object.freeze({
  get p() {
    return Typis;
  },
  get o() {
    return Tyois;
  },
  get d() {
    return Tydis;
  }
});
var owT = Object.freeze({
  get p() {
    return owTp;
  },
  get o() {
    return owTo;
  },
  get d() {
    return owTd;
  }
});
var tof = (v) => Tys.name(v);

// src/dfv.js
var dfv = (validator) => {
  return [isT.p, isT.p.bln, owT.p, owT.p.bln].some((c) => c === validator) ? false : [isT.p.int, isT.p.fin, owT.p.int, owT.p.fin].some((c) => c === validator) ? 0 : isT.p.big === validator || owT.p.big === validator ? 0n : isT.p.str === validator || owT.p.str === validator ? "" : isT.p.sym === validator || owT.p.sym === validator ? Symbol() : isT.o.ary === validator || owT.o.ary === validator ? [] : isT.o.obj === validator || owT.o.obj === validator ? {} : null;
};

// src/struct.js
var getDefaultValue = (validator) => isT.o.obj(validator) ? makeBaseObj(validator) : dfv(validator);
var makeBaseObj = (o) => {
  const base = {};
  for (let [name, validator] of Object.entries(o)) {
    base[name] = getDefaultValue(validator);
  }
  return base;
};
var createFreezeSetter = () => () => {
  throw new Error("Cannot assign to a frozen struct.");
};
var createPrimitiveSetter = (baseData, name, validator) => (v) => {
  if (validator(v)) {
    baseData[name] = v;
  }
};
var createSealUndefinedHandler = (k) => {
  throw new Error(`Property "${k}" is not defined in the schema.`);
};
var validateNestedAssignment = (validator, v) => {
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
var createNestedSetter = (validator, nestedStruct) => (v) => {
  validateNestedAssignment(validator, v);
  const schemaKeys = Object.keys(validator);
  for (const k of schemaKeys) {
    if (k in v) {
      nestedStruct[k] = v[k];
    }
  }
};
var createGetter = (baseData, name, validator, nestedStruct) => isT.o.obj(validator) ? () => nestedStruct : () => baseData[name];
var makeDescriptor = (baseData, structObj, name, validator, mode) => {
  const isNested = isT.o.obj(validator);
  const nestedStruct = isNested ? createStruct(validator, baseData[name], mode) : null;
  if (isNested) {
    structObj[name] = nestedStruct;
  }
  const getter = createGetter(baseData, name, validator, nestedStruct);
  const setter = mode === "freeze" ? createFreezeSetter() : isNested ? createNestedSetter(validator, nestedStruct) : createPrimitiveSetter(baseData, name, validator);
  return {
    get: getter,
    set: setter,
    configurable: false,
    enumerable: true
  };
};
var createStruct = (o, existingBase = null, mode = "seal") => {
  owT.o.obj(o);
  for (const validator of Object.values(o)) {
    if (!isT.o.obj(validator)) {
      owT.o.fn(validator);
    }
  }
  const base = { _: existingBase || makeBaseObj(o) };
  const structObj = {};
  Object.defineProperty(structObj, "_", {
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
  if (mode === "freeze") {
    Object.freeze(structObj);
    Object.freeze(base._);
  }
  return structObj;
};
var struct = (o) => createStruct(o, null, "seal");
struct.freeze = (o) => createStruct(o, null, "freeze");
export {
  tof,
  struct,
  owT,
  isT,
  dfv
};
