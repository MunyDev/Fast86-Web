window.onload = ()=>{main()};
function main() {
    (async ()=>{
        let importObj = {
            js: {
                memory: new WebAssembly.Memory({initial: 31250}),
                log: (data)=>{
                    console.log(data);
                },
                initVGAScreen: (width, height)=>{
                    
                }
            }
        }
        let mod = await WebAssembly.instantiateStreaming(fetch("./tex.wasm"), importObj);
        return mod.instance;
    })().then((mod)=>{
        mod.exports.sumAndPrint(12, 12);
        window.mod = mod;
    });
}
