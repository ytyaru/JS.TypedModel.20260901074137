import { isT, owT, tof } from '../../lib/ist/dist/bun/esm/bundle.js';
export const dfv = (validator) => {
    if ([isT.p, isT.p.bln, owT.p, owT.p.bln].some(c => c === validator)) return false;
    if ([isT.p.int, isT.p.fin, owT.p.int, owT.p.fin].some(c => c === validator)) return 0;
    if (isT.p.big === validator || owT.p.big === validator) return 0n;
    if (isT.p.str === validator || owT.p.str === validator) return '';
    if (isT.p.sym === validator || owT.p.sym === validator) return Symbol();
    if (isT.o.ary === validator || owT.o.ary === validator) return [];
    if (isT.o.obj === validator || owT.o.obj === validator) return {};
    return null;
};

