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
    test(`Nest系`, ()=>{
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
        expect(o.a.b).not.toHaveProperty('d');
    });
    /*
    test(`({a:isT.p.int}) set false String`, ()=>{// 異なる型の場合代入されず無視される
        const o = struct({a:isT.p.int});
        expect(o).toBeInstanceOf(Object);
        expect(o).toHaveProperty('a');
        expect(o.a).toBe(0);
//        console.log(o);
        o.a = '1';
        expect(o.a).toBe(0); 
    });
    test(`({a:owT.p.int}) set TypeError String`, ()=>{// 異なる型の場合代入されず例外発生する
        const o = struct({a:owT.p.int});
        expect(o).toBeInstanceOf(Object);
        expect(o).toHaveProperty('a');
        expect(o.a).toBe(0);
//        console.log(o);
        assertThrow(TypeError, `Expected: '${isT.p.int.toString()}' like value.\nActual: String`, ()=>o.a = '1')
    });
    test(`({a:isT.p.int}) set false Finite`, ()=>{// 異なる型の場合代入されず無視される
        const o = struct({a:isT.p.int});
        expect(o).toBeInstanceOf(Object);
        expect(o).toHaveProperty('a');
        expect(o.a).toBe(0);
//        console.log(o);
        o.a = 0.1;
        expect(o.a).toBe(0); 
    });
    test(`({a:owT.p.int}) set TypeError Finite`, ()=>{// 異なる型の場合代入されず例外発生する
        const o = struct({a:owT.p.int});
        expect(o).toBeInstanceOf(Object);
        expect(o).toHaveProperty('a');
        expect(o.a).toBe(0);
//        console.log(o);
        assertThrow(TypeError, `Expected: '${isT.p.int.toString()}' like value.\nActual: Finite`, ()=>o.a = 0.1)
    });



    test(`({a:isT.p.bln})`, ()=>{
        const o = struct({a:isT.p.bln});
        expect(o).toBeInstanceOf(Object);
        expect(o).toHaveProperty('a');
        expect(o.a).toBe(false);
//        console.log(o);
        o.a = true;
        expect(o.a).toBe(true);
    });
    test(`({a:isT.p.big})`, ()=>{
        const o = struct({a:isT.p.big});
        expect(o).toBeInstanceOf(Object);
        expect(o).toHaveProperty('a');
        expect(o.a).toBe(0n);
//        console.log(o);
        o.a = 1n;
        expect(o.a).toBe(1n);
    });

    test(`({a:isT.p.int})`, ()=>{
        const o = struct({a:isT.p.int});
        expect(o).toBeInstanceOf(Object);
        expect(o).toHaveProperty('a');
        expect(o.a).toBe(0);
//        console.log(o);
        o.a = 1;
        expect(o.a).toBe(1);
    });
    test(`({a:isT.p.int}) set false String`, ()=>{// 異なる型の場合代入されず無視される
        const o = struct({a:isT.p.int});
        expect(o).toBeInstanceOf(Object);
        expect(o).toHaveProperty('a');
        expect(o.a).toBe(0);
//        console.log(o);
        o.a = '1';
        expect(o.a).toBe(0); 
    });
    test(`({a:owT.p.int}) set TypeError String`, ()=>{// 異なる型の場合代入されず例外発生する
        const o = struct({a:owT.p.int});
        expect(o).toBeInstanceOf(Object);
        expect(o).toHaveProperty('a');
        expect(o.a).toBe(0);
//        console.log(o);
        assertThrow(TypeError, `Expected: '${isT.p.int.toString()}' like value.\nActual: String`, ()=>o.a = '1')
    });
    test(`({a:isT.p.int}) set false Finite`, ()=>{// 異なる型の場合代入されず無視される
        const o = struct({a:isT.p.int});
        expect(o).toBeInstanceOf(Object);
        expect(o).toHaveProperty('a');
        expect(o.a).toBe(0);
//        console.log(o);
        o.a = 0.1;
        expect(o.a).toBe(0); 
    });
    test(`({a:owT.p.int}) set TypeError Finite`, ()=>{// 異なる型の場合代入されず例外発生する
        const o = struct({a:owT.p.int});
        expect(o).toBeInstanceOf(Object);
        expect(o).toHaveProperty('a');
        expect(o.a).toBe(0);
//        console.log(o);
        assertThrow(TypeError, `Expected: '${isT.p.int.toString()}' like value.\nActual: Finite`, ()=>o.a = 0.1)
    });
    */



    /*
    describe(`is`, ()=>{
        describe(`()`, ()=>{
            test(`ReferenceError`, ()=>assertThrow(ReferenceError, `Constructors are not allowed.`, ()=>new Typis()));
            describe(`false`, ()=>{
                test.each([[undefined],[null],[NaN],[Infinity],[-Infinity],[new Boolean()],[new Number()],[new String()],[Object.create(null)],[Object.create({})]])(`(%p)`, (v)=>{
                    expect(Typis(v)).toBe(false);
                });
            });
            describe(`true`, ()=>{
                test.each([[true],[false],[0],[Number.MAX_SAFE_INTEGER],[Number.MIN_SAFE_INTEGER],[0.1],[0n],[''],[Symbol()]])(`(%p)`, (v)=>{
                    expect(Typis(v)).toBe(true);
                });
            });
        });
        describe(`some`, ()=>{
            describe(`false`, ()=>{
                test.each([[undefined],[null],[NaN],[Infinity],[-Infinity],[new Boolean()],[new Number()],[new String()],[Object.create(null)],[Object.create({})]])(`(%p)`, (v)=>{
                    expect(Typis.some(v)).toBe(false);
                });
            });
            describe(`true`, ()=>{
                test.each([[true],[false],[0],[Number.MAX_SAFE_INTEGER],[Number.MIN_SAFE_INTEGER],[0.1],[0n],[''],[Symbol()]])(`(%p)`, (v)=>{
                    expect(Typis.some(v)).toBe(true);
                });
            });
        });
        describe(`bln`, ()=>{
            describe(`false`, ()=>{
                test.each([[undefined],[null],[NaN],[Infinity],[-Infinity],[new Boolean()],[new Number()],[new String()],[Object.create(null)],[0],[0n],[''],[Symbol()]])(`(%p)`, (v)=>{
                    expect(Typis.bln(v)).toBe(false);
                });
            });
            describe(`true`, ()=>{
                test.each([[true],[false]])(`(%p)`, (v)=>{
                    expect(Typis.bln(v)).toBe(true);
                });
            });
        });
        describe(`int`, ()=>{
            describe(`false`, ()=>{
                test.each([[undefined],[null],[NaN],[Infinity],[-Infinity],[Number.MAX_SAFE_INTEGER+1],[Number.MIN_SAFE_INTEGER-1],[new Boolean()],[new Number()],[new String()],[Object.create(null)],[0.1],[0n],[''],[Symbol()]])(`(%p)`, (v)=>{
                    expect(Typis.int(v)).toBe(false);
                });
            });
            describe(`true`, ()=>{
                test.each([[0],[Number.MAX_SAFE_INTEGER],[Number.MIN_SAFE_INTEGER]])(`(%p)`, (v)=>{
                    expect(Typis.int(v)).toBe(true);
                });
            });
        });
        describe(`finite`, ()=>{
            describe(`false`, ()=>{
                test.each([[undefined],[null],[NaN],[Infinity],[-Infinity],[new Boolean()],[new Number()],[new String()],[Object.create(null)],[0n],[''],[Symbol()]])(`(%p)`, (v)=>{
                    expect(Typis.fin(v)).toBe(false);
                });
            });
            describe(`true`, ()=>{
                test.each([[0],[1.0],[0.1],[-12.3],[45.6789],[Number.MAX_SAFE_INTEGER],[Number.MIN_SAFE_INTEGER],[Number.MAX_SAFE_INTEGER-0.1],[Number.MIN_SAFE_INTEGER+0.1]])(`(%p)`, (v)=>{
                    expect(Typis.fin(v)).toBe(true);
                });
            });
        });
        describe(`big`, ()=>{
            describe(`false`, ()=>{
                test.each([[undefined],[null],[NaN],[Infinity],[-Infinity],[Number.MAX_SAFE_INTEGER+1],[Number.MIN_SAFE_INTEGER-1],[new Boolean()],[new Number()],[new String()],[Object.create(null)],[0.1],[0],[''],[Symbol()]])(`(%p)`, (v)=>{
                    expect(Typis.big(v)).toBe(false);
                });
            });
            describe(`true`, ()=>{
                test.each([[0n],[BigInt(Number.MAX_SAFE_INTEGER) + 1n],[BigInt(Number.MIN_SAFE_INTEGER) - 1n]])(`(%p)`, (v)=>{
                    expect(Typis.big(v)).toBe(true);
                });
            });
        });
        describe(`str`, ()=>{
            describe(`false`, ()=>{
                test.each([[undefined],[null],[NaN],[Infinity],[-Infinity],[Number.MAX_SAFE_INTEGER+1],[Number.MIN_SAFE_INTEGER-1],[new Boolean()],[new Number()],[new String()],[Object.create(null)],[0.1],[0],[0n],[Symbol()]])(`(%p)`, (v)=>{
                    expect(Typis.str(v)).toBe(false);
                });
            });
            describe(`true`, ()=>{
                test.each([[''],[' '],['\n'],['a'],['あ']])(`(%p)`, (v)=>{
                    expect(Typis.str(v)).toBe(true);
                });
            });
        });
        describe(`sym`, ()=>{
            describe(`false`, ()=>{
                test.each([[undefined],[null],[NaN],[Infinity],[-Infinity],[Number.MAX_SAFE_INTEGER+1],[Number.MIN_SAFE_INTEGER-1],[new Boolean()],[new Number()],[new String()],[Object.create(null)],[0.1],[0],[0n],['']])(`(%p)`, (v)=>{
                    expect(Typis.sym(v)).toBe(false);
                });
            });
            describe(`true`, ()=>{
                test.each([[Symbol()],[Symbol('a')],[Symbol.for('a')]])(`(%p)`, (v)=>{
                    expect(Typis.sym(v)).toBe(true);
                });
            });
        });
    });
    */
});

