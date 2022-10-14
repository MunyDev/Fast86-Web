(module
(type $vgapixel (func (param i32)(param i32)))
(type $vgatext (func (param i32)(param i32)))
(import "js" "pixel" (func $pixel(param i32)(param i32)(param i32)))
(import "js" "memory" (memory 1))
(func $main(
    call $pixel
        (i32.add 
            (i32.const 2)
            (i32.load 
                (i32.const 0)
            )
        )
        (i32.load 
            (i32.const 4)
        )
        (i32.load
            (i32.const 8)
        )
    

))
(func (export "getnumber")(result i32)
(i32.sub
    (
        i32.const 200
    )
    (i32.load
        (i32.const 0)  
    )
)
)
(export "main" (func $main))
)