import { expect, test, describe } from "bun:test";
import {struct} from '../src/struct.js';
import {assertThrow,C,c,fn,gfn,afn,agfn,arrFn,aarrFn,des,cal,prims,objs,dangers,cls,ins,_obj,getDes} from './test-data.js';
import {isT,owT,tof} from '../../lib/ist/dist/bun/esm/bundle.js';
class D{}; const d = new D();
describe(`struct`, ()=>{
    test(`()`, ()=>assertThrow(TypeError, `Expected: '${isT.o.obj.toString()}' like value.\nActual: Undefined`, ()=>struct()));
    test(`(0)`, ()=>assertThrow(TypeError, `Expected: '${isT.o.obj.toString()}' like value.\nActual: Integer`, ()=>struct(0)));
    test(`({})`, ()=>{
        const o = struct({});
        expect(struct({})).toBeInstanceOf(Object);
    });
    describe(`正常系`, ()=>{
        describe(`Primitive系`, ()=>{
            test.each([[isT.p.bln,false,true], [isT.p.int,0,1], [isT.p.fin,0,0.1], [isT.p.big,0n,1n], [isT.p.str,'','a']])(`({a:%p})`, (v,d,a)=>{
                const o = struct({v:v});
                expect(o).toBeInstanceOf(Object);
                expect(o).toHaveProperty('v');
                expect(o.v).toBe(d);
                o.v = a;
                expect(o.v).toBe(a);
            });
        });
        describe(`Object系`, ()=>{
            test.each([[isT.o.obj,{},{x:0}], [isT.o.ary,[],[0,'a']], [isT.o.cls,null,C], [isT.o.ins,null,c], [isT.o.des,null,des.i[0][0]], [isT.o.fn,null,cal.fn[0][0]], [isT.o.md,null,cal.md[0][0]]])(`({a:%p})`, (v,d,a)=>{
                const o = struct({v:v});
                expect(o).toBeInstanceOf(Object);
                expect(o).toHaveProperty('v');
                expect(o.v).toEqual(d);
                o.v = a;
                expect(o.v).toEqual(a);
            });
        });
    });
    describe(`異常系`, ()=>{
        describe(`Primitive系`, ()=>{
            describe(`isT系`, ()=>{//, [isT.p.sym,Symbol(),1]
                test.each([[isT.p.bln,false,1], [isT.p.int,0,0.1], [isT.p.fin,0,'1'], [isT.p.big,0n,1], [isT.p.str,'',1]])(`({a:%p})`, (v,d,a)=>{
                    const o = struct({v:v});
                    expect(o).toBeInstanceOf(Object);
                    expect(o).toHaveProperty('v');
                    expect(o.v).toBe(d);
                    o.v = a;
                    expect(o.v).toBe(d);// 異なる型の場合代入されず無視される
                });
            });
            describe(`owT系`, ()=>{
                test.each([[owT.p.bln,false,1], [owT.p.int,0,0.1], [owT.p.fin,0,'1'], [owT.p.big,0n,1], [owT.p.str,'',1]])(`({a:%p})`, (v,d,a)=>{
                    const o = struct({v:v});
                    expect(o).toBeInstanceOf(Object);
                    expect(o).toHaveProperty('v');
                    expect(o.v).toBe(d);
//                    assertThrow(TypeError, `Expected: '${v.toString()}' like value.\nActual: String`, ()=>o.v = a);
                    assertThrow(TypeError, /^Expected: /, ()=>o.v = a);
                });
            });
        });
        describe(`Object系`, ()=>{
            describe(`isT系`, ()=>{//, [isT.p.sym,Symbol(),1]
                test.each([[isT.o.obj,{},[]], [isT.o.ary,[],{}], [isT.o.cls,null,c], [isT.o.ins,null,C], [isT.o.des,null,{}], [isT.o.fn,null,cal.md[0][0]], [isT.o.md,null,cal.fn[0][0]]])(`({a:%p})`, (v,d,a)=>{
                    const o = struct({v:v});
                    expect(o).toBeInstanceOf(Object);
                    expect(o).toHaveProperty('v');
                    expect(o.v).toEqual(d);
                    o.v = a;
                    expect(o.v).toEqual(d);// 異なる型の場合代入されず無視される
                });
            });
            describe(`owT系`, ()=>{
                test.each([[owT.o.obj,{},[]], [owT.o.ary,[],{}], [owT.o.cls,null,c], [owT.o.ins,null,C], [owT.o.des,null,{}], [owT.o.fn,null,cal.md[0][0]], [owT.o.md,null,cal.fn[0][0]]])(`({a:%p})`, (v,d,a)=>{
                    const o = struct({v:v});
                    expect(o).toBeInstanceOf(Object);
                    expect(o).toHaveProperty('v');
                    expect(o.v).toEqual(d);
//                    assertThrow(TypeError, `Expected: '${v.toString()}' like value.\nActual: String`, ()=>o.v = a);
                    assertThrow(TypeError, /^Expected: /, ()=>o.v = a);
                });
            });
        });
    });
    describe(`Nest系`, ()=>{
        test(`新規追加`, ()=>{
            const o = struct({a:{b:{c:isT.p.int}}});
            expect(o).toBeInstanceOf(Object);
            expect(o).toHaveProperty('a');
            expect(o.a).toHaveProperty('b');
            expect(o.a.b).toHaveProperty('c');
            expect(o.a.b.c).toBe(0);
            o.a.b.c = 1;
            expect(o.a.b.c).toBe(1);
            o.a.b = {};
            expect(o.a.b.c).toBe(1);
            o.a.b = {d:2}; // 生成時に存在しないプロパティ
    //        expect(o.a.b).not.toHaveProperty('d');
            expect(o.a.b.d).toBe(2);
        });
        test(`既存削除`, ()=>{
            const o = struct({a:{b:{c:isT.p.int, d:isT.p.str}}});
            expect(o).toBeInstanceOf(Object);
            expect(o).toHaveProperty('a');
            expect(o.a).toHaveProperty('b');
            expect(o.a.b).toHaveProperty('c');
            expect(o.a.b).toHaveProperty('d');
            delete o.a.b.d;
            expect(o).toHaveProperty('a');
            expect(o.a).toHaveProperty('b');
            expect(o.a.b).toHaveProperty('c');
            expect(o.a.b).not.toHaveProperty('d');
            delete o.a.b.c;
            expect(o).toHaveProperty('a');
            expect(o.a).toHaveProperty('b');
            expect(o.a.b).not.toHaveProperty('c');
            expect(o.a.b).not.toHaveProperty('d');
            delete o.a.b;
            expect(o).toHaveProperty('a');
            expect(o.a).not.toHaveProperty('b');
            expect(o.a.b).not.toHaveProperty('c');
            expect(o.a.b).not.toHaveProperty('d');
        });
    });
});
describe(`struct.seal`, ()=>{
    test(`Nest系`, ()=>{
        const o = struct.seal({a:{b:{c:isT.p.int}}});
        expect(o).toBeInstanceOf(Object);
        expect(o).toHaveProperty('a');
        expect(o.a).toHaveProperty('b');
        expect(o.a.b).toHaveProperty('c');
        expect(o.a.b.c).toBe(0);
        o.a.b.c = 1;
        expect(o.a.b.c).toBe(1);
        o.a.b = {};
        expect(o.a.b.c).toBe(1);
        // 生成時に存在しないプロパティを代入する
        assertThrow(Error, 'Property "d" is not defined in the schema.', ()=>o.a.b = {d:2});
//        o.a.b = {d:2}; // 生成時に存在しないプロパティ
//        expect(o.a.b).not.toHaveProperty('d');
//        expect(o.a.b.d).toBe(2);
    });
});
describe(`struct.freeze`, ()=>{
    test(`Nest系`, ()=>{
        const o = struct.freeze({a:{b:{c:isT.p.int}}});
        expect(o).toBeInstanceOf(Object);
        expect(o).toHaveProperty('a');
        expect(o.a).toHaveProperty('b');
        expect(o.a.b).toHaveProperty('c');
        expect(o.a.b.c).toBe(0);
        //o.a.b.c = 1;
        assertThrow(Error, 'Cannot assign to a frozen struct.', ()=>o.a.b.c = 1);
        //expect(o.a.b.c).toBe(1);
        expect(o.a.b.c).toBe(0);
        //o.a.b = {};
        assertThrow(Error, 'Cannot assign to a frozen struct.', ()=>o.a.b = {});
//        expect(o.a.b.c).toBe(1);
        expect(o.a.b.c).toBe(0);
        // 生成時に存在しないプロパティを代入する
        assertThrow(Error, 'Cannot assign to a frozen struct.', ()=>o.a.b = {d:2});
        expect(o.a.b).not.toHaveProperty('d');
//        o.a.b = {d:2}; // 生成時に存在しないプロパティ
//        expect(o.a.b).not.toHaveProperty('d');
//        expect(o.a.b.d).toBe(2);
    });
});

