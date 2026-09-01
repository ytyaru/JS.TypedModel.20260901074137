import { isT, owT, tof } from '../../lib/ist/dist/bun/esm/bundle.js';
export const dfv = (validator) => {
    return ([isT.p, isT.p.bln, owT.p, owT.p.bln].some(c => c === validator)) ? false
        : ([isT.p.int, isT.p.fin, owT.p.int, owT.p.fin].some(c => c === validator)) ? 0
        : (isT.p.big === validator || owT.p.big === validator) ? 0n
        : (isT.p.str === validator || owT.p.str === validator) ? ''
        : (isT.p.sym === validator || owT.p.sym === validator) ? Symbol()
        : (isT.o.ary === validator || owT.o.ary === validator) ? []
        : (isT.o.obj === validator || owT.o.obj === validator) ? {}
        : null;
};

