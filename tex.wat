(module
(import "js" "memory" (memory 31250))
(import "js" "log" (func $log (param f32)))
(func $sumAndPrint (param $lhs f32) (param $rhs f32)
    local.get $lhs
    local.get $rhs
    f32.add
    call $log
)
(export "sumAndPrint" (func $sumAndPrint))
)