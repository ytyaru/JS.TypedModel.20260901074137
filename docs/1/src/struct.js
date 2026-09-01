import {isT,owT,tof} from '../../lib/ist/dist/bun/esm/bundle.js';
const getDefaultValue = (v) => {
    if ([isT.p, isT.p.bln, owT.p, owT.p.bln].some(c=>c===v)) return false;
    if ([isT.p.int,isT.p.fin,owT.p.int,owT.p.fin].some(c=>c===v)) return 0;
    if (isT.p.big===v || owT.p.big===v) return 0n;
    if (isT.p.str===v || owT.p.str===v) return '';
    if (isT.p.sym===v || owT.p.sym===v) return Symbol();
    if (isT.o.ary===v || owT.o.ary===v) return [];
    if (isT.o.obj===v || owT.o.obj===v) return {};
    return null;
}
const makeBaseObj = (o) => {
    const base = {}
    for (let [name, validator] of Object.entries(o)) {
        base[name] = getDefaultValue(validator);
    }
    return base;
}
const makeDescriptor = (base, name, validator) => {
    return {
        get() {return base._[name]},
        set(v) {if(validator(v)){base._[name]=v}},
    }
}
export const struct = (o) => {
    owT.o.obj(o);
    const base = {_: makeBaseObj(o)};
    for (let [name, validator] of Object.entries(o)) {
        base[name] = getDefaultValue(validator);
        Object.defineProperty(base, name, makeDescriptor(base, name, validator));
    }
    return base;
}

