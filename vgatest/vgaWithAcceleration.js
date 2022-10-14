/*VGATest. For more information, look at VGATest.txt*/
let fbTexture;
window.onload = ()=>{
    let importObj = {
        "js": {
            "memory": new WebAssembly.Memory({
                initial: 10,
                maximum: 100
            }),
            "pixel": (al, cx, dx)=>{
                writePixel(fbTexture, al, 0, cx, dx);
            }
        }
    };
    let ba = (async ()=>{
        
        const mod = await WebAssembly.instantiateStreaming(fetch("./vga.wasm"), importObj);
        console.log("WASM Loaded :)");
        window.mod = mod;
        window.obj = importObj;
    });
    ba().then(()=>{
        main();
    })
}
function elem(id){
    return document.querySelector(id);
}
let mesh = new Float32Array([
    -1, 1, 0, 0, 0,
    1, 1, 0, 1, 0,
    1, -1, 0, 1, 1,
    -1, -1, 0, 0,1 
])
let indices = new Uint16Array([
    0, 1, 2, 0, 2, 3
]);
let shaderVS = `#version 300 es
layout(location = 0) in vec3 vertices;
layout(location = 1) in vec2 aTexCoord;
out vec2 texCoord;
void main(void){
    gl_Position = vec4(vertices, 1);
    texCoord = aTexCoord;
}

`
let shaderFS = `#version 300 es
precision highp float;
precision mediump int;
out vec4 FragColor;
in vec2 texCoord;
uniform sampler2D tex;
void main(void){

    vec2 tex2d = vec2(texCoord.x, -texCoord.y);
    FragColor = texture(tex, tex2d);
    
}
`

function loadShaders(sourceVS, sourceFS){
    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, sourceVS);
    gl.compileShader(vertexShader);
    
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        alert("Couldn't compile vertex shader");
        console.error(gl.getShaderInfoLog(vertexShader));
    }
    let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, sourceFS);
    gl.compileShader(fragShader);

    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)){
        alert("Couldn't compile fragment shader");
        console.error(gl.getShaderInfoLog(fragShader));
    }

    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragShader);
    
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
        alert("Couldn't link program");
        console.error(gl.getProgramInfoLog(program));
    }
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragShader);
    return {
        program: program,
        attributes: {
            vertices: 0,
            uv: 1
        },
        use: ()=>{
            gl.useProgram(program);
        },
        unuse: ()=>{
            gl.useProgram(null);
        },
        uniformMat4f: (location, mat)=>{
            
            gl.uniformMatrix4fv(gl.getUniformLocation(program, location), false, mat);
        },
        uniformInt: (location, value)=>{
            gl.uniform1i(gl.getUniformLocation(program, location), value);
        },
        uniformFloat: (location, value)=>{
            gl.uniform1f(gl.getUniformLocation(program, location), value)
        },
        uniformVec3: (location, values)=>{
            gl.uniform3fv(gl.getUniformLocation(program, location), values)
        },
        uniformVec2: (location, values)=>{
            gl.uniform2fv(gl.getUniformLocation(location), values);
        },
        
        
    }
}
/**Returns blank alpha-transparent texture */
function generatePixels(width, height){
    return new Uint8ClampedArray(width * height * 4);
}

/**Returns colored opaqure texture */
function generatePixelsOpaque(color, width, height){
    let result = new Uint8ClampedArray(width * height * 4);
    
        
        for (let i = 0; i < (width * height); i++){
            result.set(color, i * 4);
        }
    
    return result;
}
/**
 * 
 * @param {boolean} fix Should we flip the y coordinates when making texture?
 */
function setFlipYFix(fix){
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, fix);
}
function initFbTexture(width, height) {
//    setFlipYFix(false);
    let tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    window.setFlipYFix = setFlipYFix;
    setFlipYFix(true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE,null);
    let fb = gl.createFramebuffer();
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    setFlipYFix(false);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    
    gl.viewport(0, 0, width, height);
    
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // setFlipYFix(false);
    return {
        framebuffer: fb,
        texture: tex,
        bind: ()=>{
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        },
        unbind: ()=>{
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        },
        width: width,
        height: height,
        /**Avoid resizing. Put this function for convenience*/
        resize: (width, height)=>{
            // setFlipYFix(false);
            bind();
            gl.viewport(0, 0, width, height);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            // setFlipYFix(false);
        }
    }
}
/**
 * Initialize a Mesh
 * @param {Float32Array} vertices 
 * @param {Uint16Array} indices 
 */
function Mesh(vertices, indices, shader) {
    let vertexArray = gl.createVertexArray();
    gl.bindVertexArray(vertexArray);
    let buffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer1);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    let vert = 0, uv = 1;
    let bpe = Float32Array.BYTES_PER_ELEMENT;
    gl.enableVertexAttribArray(vert);
    gl.vertexAttribPointer(vert, 3, gl.FLOAT, false, 5 * bpe, 0);
    gl.enableVertexAttribArray(uv);
    gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 5 * bpe, 3 * bpe);
    let buffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer2);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    
    return {
        vao: vertexArray,
        vbo: buffer1,
        vbo2: buffer2,
        shader: shader,
        bind: ()=>{
            shader.use();
            gl.bindVertexArray(vertexArray);

        },
        draw: (mode, count)=>{
            
            gl.bindVertexArray(vertexArray);
            shader.use();
            gl.drawElements(mode, count, gl.UNSIGNED_SHORT, 0);
            gl.bindVertexArray(null);
        },
        unbind: ()=>{
            gl.bindVertexArray(null);
        },
        getShader: ()=>{
            return shader;
        }
    }
}
function hexToRgb(hex) {
    var bigint = hex;
    var i = (bigint >> 24) & 255;
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    return [r, g, b, i];
}
/**Write graphics pixel	AH=0Ch	AL = Color, BH = Page Number, CX = x, DX = y */
function writePixel(fbTexture, al, bh, cx, dx){
    let fb = fbTexture.framebuffer;
    let tex = fbTexture.texture;
    let w = fbTexture.width, h = fbTexture.height;
    let pixelColor = hexToRgb(al);
    pixelColor[3] = 255;
    // console.log(pixelColor);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbTexture.framebuffer);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    let yval = fbTexture.height - dx;
    
    // console.log(yval);
    if (yval === fbTexture.height){
        yval -= 1;
    }
    if ((yval > fbTexture.height) || (cx > fbTexture.width)){
        console.error("Program attempted to write pixel out of bounds");
        fbTexture.unbind();
        gl.bindTexture(gl.TEXTURE_2D, null);
        return;
    }
    gl.texSubImage2D(gl.TEXTURE_2D, 0, cx, (yval), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8ClampedArray(pixelColor));
    fbTexture.unbind();
    gl.bindTexture(gl.TEXTURE_2D, null);
}
function fillTextureSection(fbTexture, al, bh, cx, dx, w, h){
    let x = cx;
    let y = dx;
    
}
/**@type{WebGL2RenderingContext} */
let gl;
/**
 * 
 * @param {WebAssembly.Instance} module 
 */
function main(module){
    
    // let px = generatePixels();
    
    let canvas = elem("#vga");

    gl = canvas.getContext('webgl2');
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    let pi1 = loadShaders(shaderVS, shaderFS);
    let pi2 = loadShaders(
        `#version 300 es
        layout(location = 0) in vec3 aVertices;
        layout(location = 1) in vec3 aTexCoords;
        
        void main(void) {
            gl_Position = vec4(aVertices, 1);
        }
        `,
        `#version 300 es
        precision highp float;
        precision mediump int;
        out vec4 FragColor;
        void main(void){
            FragColor = vec4(0, 1, 0, 1);
        }
        `
    );
    let result = accelerationTestInit(pi2);
    fbTexture = initFbTexture(320, 300);
    
    let px2 = generatePixelsOpaque([255, 255, 0, 255], 30, 30);

    //Buffers
    // let vertexArray = gl.createVertexArray();
    // gl.bindVertexArray(vertexArray);
    // let buffer = gl.createBuffer();
    // let buffer2 = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
    
    // let vertexAttrib = 0;
    // gl.enableVertexAttribArray(vertexArray);
    // gl.vertexAttribPointer(vertexAttrib, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
    
    // let uvAttrib = 1;
    // gl.enableVertexAttribArray(uvAttrib);
    // gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);

    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer2);
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    let mesht = Mesh(mesh, indices, pi1);
    console.log("hello world");
    let tex = fbTexture.texture;
    let ypos = 0;
    
    let x = 0, y = 0;
    function frame(){
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        fbTexture.bind();
        gl.clearColor(0, 0, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        onDraw(result);
        // fillTextureSection(fbTe/xture, 0x0FFFF, 0, 0, ypos, 30, 30);
        
        fbTexture.unbind();
        let dv = new DataView(obj.js.memory.buffer);
        dv.setInt32(0, 0x00FFFF, true);
        dv.setInt32(4, x, true);
        dv.setInt32(8, y, true);
        mod.instance.exports.main();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        mesht.bind();
        pi1.uniformInt('tex', 0);
        mesht.draw(gl.TRIANGLES, 6);
        
        mesht.unbind();
        x++; y++;
        requestAnimationFrame(frame);
        
    }
    requestAnimationFrame(frame);
    
}

function accelerationTestInit(shader) {
    let vertices1 = new Float32Array([
        -0.5, 0.4, 0, 0, 0,
        0.5, 0.5, 0, 1, 0,
        0.5, -0.5, 0, 1, 1, 
        -0.5, -0.5, 0, 0, 1
    ]);
    let indices1 = new Uint16Array([
        0, 1, 2, 0, 2, 3
    ]);
    let meshd = Mesh(vertices1, indices1, shader);
    
    return meshd;
}
function onDraw(meshd){
    meshd.bind();
    meshd.draw(gl.TRIANGLES, 6);
    meshd.unbind();
}