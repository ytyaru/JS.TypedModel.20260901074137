import { isT, owT, tof } from '../../lib/ist/dist/bun/esm/bundle.js';

// スキーマ（オブジェクト）かどうかを判定
const isSchema = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// バリデータまたはスキーマに応じたデフォルト値を再帰的に生成
const getDefaultValue = (validator) => {
    if (isSchema(validator)) {
        return makeBaseObj(validator);
    }
    if ([isT.p, isT.p.bln, owT.p, owT.p.bln].some(c => c === validator)) return false;
    if ([isT.p.int, isT.p.fin, owT.p.int, owT.p.fin].some(c => c === validator)) return 0;
    if (isT.p.big === validator || owT.p.big === validator) return 0n;
    if (isT.p.str === validator || owT.p.str === validator) return '';
    if (isT.p.sym === validator || owT.p.sym === validator) return Symbol();
    if (isT.o.ary === validator || owT.o.ary === validator) return [];
    if (isT.o.obj === validator || owT.o.obj === validator) return {};
    return null;
};

// ベースとなる実データオブジェクトを再帰的に構築
const makeBaseObj = (o) => {
    const base = {};
    for (let [name, validator] of Object.entries(o)) {
        base[name] = getDefaultValue(validator);
    }
    return base;
};

// プロパティのディスクリプタを生成（ネスト対応）
const makeDescriptor = (base, name, validator) => (isSchema(validator) ? makeNestDes : makeDatDes)(base, name, validator);
const makeNestDes = (base, name, validator) => {
    // ネストされたオブジェクトの場合、子階層も struct 化して返す
    // 内部データ（base._[name]）を親の管理下に置いたまま、ラップされた構造を返す
    const nestedStruct = struct(validator, base._[name]);
    return {
        get() { return nestedStruct; },
        set(v) {
            // オブジェクト丸ごと代入された場合のバリデーションや浅いコピーの処理が必要に応じて入る
            owT.o.obj(v);
            for (const k of Object.keys(v)) {
                nestedStruct[k] = v[k];
            }
        }
    };
}
const makeDatDes = (base, name, validator) => {
    return {
        get() { return base._[name]; },
        set(v) { if (validator(v)) { base._[name] = v; } },
    };
}

export const struct = (o, existingBase = null) => {
    owT.o.obj(o);
    // 既存のベースがあればそれを利用し、なければ新規作成（再帰呼び出し用）
    const base = { _: existingBase || makeBaseObj(o) };

    for (let [name, validator] of Object.entries(o)) {
        Object.defineProperty(base, name, makeDescriptor(base, name, validator));
    }

    return base;
};

/*
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
*/
