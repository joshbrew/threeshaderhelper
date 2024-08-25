import * as THREE from 'three';
import { GUI } from 'dat.gui'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sounds } from './sound';

export { Sounds }

export class THREEShaderHelper {

    //the vertex in this case we'll use mostly as a base 
    static defaultVertex = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);
            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectedPosition = projectionMatrix * viewPosition;
            gl_Position = projectedPosition;
        }
    `;


    //uniforms will be parsed into our manipulable system
    static defaultFragmentSimple = `
        #define FFTLENGTH 256
        precision mediump float;
        uniform vec2 iResolution; //Shader display resolution
        uniform float iTime; //Shader time increment

        uniform float iHEG;
        uniform float iHRV;
        uniform float iHR;
        uniform float iHB;
        uniform float iFrontalAlpha1Coherence;
        uniform float iFFT[FFTLENGTH];
        uniform float iAudio[FFTLENGTH];
        void main(){
            gl_FragColor = vec4(iAudio[20]/255. + iHEG*0.1+gl_FragCoord.x/gl_FragCoord.y,gl_FragCoord.y/gl_FragCoord.x,gl_FragCoord.y/gl_FragCoord.x - iHEG*0.1 - iAudio[120]/255.,1.0);
        }              
    `;

    //borrowed from shadertoy
    static defaultFragment = `
        #define FFTSIZE 256
        precision mediump float;
        varying vec2 vUv;
        uniform vec2 iResolution;
        uniform float iTime;
        uniform float iHEG;
        uniform float iHRV;
        uniform float iHR;
        uniform float iHB;
        uniform float iFrontalAlpha1Coherence;
        uniform float iFFT[FFTSIZE];
        uniform float iAudio[FFTSIZE];

        //CBS, borrowed from ShaderToy
        //Parallax scrolling fractal galaxy.
        //Inspired by JoshP's Simplicity shader: https://www.shadertoy.com/view/lslGWr

        // http://www.fractalforums.com/new-theories-and-research/very-simple-formula-for-fractal-patterns/
        float field(in vec3 p,float s) {
            float strength = 7. + .03 * log(1.e-6 + fract(sin(iTime) * 4373.11));
            float accum = s/4.;
            float prev = 0.;
            float tw = 0.;
            for (int i = 0; i < 14; ++i) {
                float mag = dot(p, p);
                p = abs(p) / mag + vec3(-.5+(iAudio[100]*0.00001)+iHB*0.5+iHEG*0.001, -.4+(iAudio[200]*0.00001)+iHB*0.5+iHEG*0.1, -1.5);
                float w = exp(-float(i) / (7.+iHRV*0.1+iFrontalAlpha1Coherence));
                accum += w * exp(-strength * pow(abs(mag - prev), 2.2));
                tw += w;
                prev = mag;
            }
            return max(0., 5. * accum / tw - .7);
        }

        // Less iterations for second layer
        float field2(in vec3 p, float s) {
            float strength = 7. + .03 * log(1.e-6 + fract(sin(iTime) * 4373.11));
            float accum = s/4.;
            float prev = 0.;
            float tw = 0.;
            for (int i = 0; i < 14; ++i) {
                float mag = dot(p, p);
                p = abs(p) / mag + vec3(-.5+iAudio[80]*0.00001-iHB*0.5, -.4+iAudio[160]*0.00001 + iFrontalAlpha1Coherence*.4, -1.5);
                float w = exp(-float(i) / 7.);
                accum += w * exp(-strength * pow(abs(mag - prev), 2.2));
                tw += w;
                prev = mag;
            }
            return max(0., 5. * accum / tw - .7);
        }

        vec3 nrand3( vec2 co )
        {
            vec3 a = fract( cos( co.x*8.3e-3 + co.y )*vec3(1.3e5, 4.7e5, 2.9e5) );
            vec3 b = fract( sin( co.x*0.3e-3 + co.y )*vec3(8.1e5, 1.0e5, 0.1e5) );
            vec3 c = mix(a, b, 0.5);
            return c;
        }


        void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
            vec2 uv = 2. * fragCoord.xy / iResolution.xy - 1.;
            vec2 uvs = uv * iResolution.xy / max(iResolution.x, iResolution.y);
            vec3 p = vec3(uvs, 0) + vec3(1., -1.3, 0.);
            p += .2 * vec3(sin(iTime / 16.), sin(iTime / 12.),  sin(iTime / 128.));
            
            float freqs[4];
            
            //Sound
            freqs[0] = iAudio[25]/255.+iFFT[25]*.1+.25+iHEG*0.1;
            freqs[1] = iAudio[75]/255.+iFFT[75]*.1+.1+iHR*0.001;
            freqs[2] = iAudio[125]/255.+iFFT[125]*.1+.15+iHRV*0.01;
            freqs[3] = iAudio[200]/255.+iFFT[200]*.1+.3;

            float t = field(p,freqs[2])*2.;
            float v = (1. - exp((abs(uv.x) - 1.) * 6.)) * (1. - exp((abs(uv.y) - 1.) * 6.));
            
            //Second Layer
            vec3 p2 = vec3(5.*uvs / (4.+sin(iTime*0.11)*0.2+0.2+sin(iTime*0.15)*0.3+0.4), 1.5) + vec3(2., -1.3, -1.);
            p2 += 0.25 * vec3(sin(iTime / 16.), sin(iTime / 12.),  sin(iTime / 128.));
            float t2 = field2(p2,freqs[3]);
            vec4 c2 = mix(.4, 1., v) * vec4(1.3 * t2 * t2 * t2 ,1.8  * t2 * t2 , t2* freqs[0], t2);
            
            
            //Let's add some stars
            //Thanks to http://glsl.heroku.com/e#6904.0
            vec2 seed = p.xy * 75.;	
            seed = floor(seed * iResolution.x);
            vec3 rnd = nrand3( seed );
            vec4 starcolor = vec4(pow(rnd.y,40.0));
            
            //Second Layer
            vec2 seed2 = p2.xy * 50.;
            seed2 = floor(seed2 * iResolution.x);
            vec3 rnd2 = nrand3( seed2 );
            starcolor += vec4(pow(rnd2.y,40.0));
            
            fragColor = mix(freqs[3]-.3, 1., v) * vec4(1.5*freqs[2] * t * t* t , 1.2*freqs[1] * t * t, freqs[3]*t, 1.0)+c2+starcolor;
        }


        void main() {
            mainImage(gl_FragColor, vUv*iResolution);
        }

    `;

    //borrowed from shadertoy
    static juliaFragment = `
        #define FFTLENGTH 256
        precision mediump float;
        varying vec2 vUv;
        uniform vec2 iResolution;
        uniform float iTime;
        uniform float iHEG;
        uniform float iHRV;
        uniform float iHR;
        uniform float iHB;
        uniform float iFrontalAlpha1Coherence;
        uniform float iFFT[FFTLENGTH];
        uniform float iAudio[FFTLENGTH];

        vec2 f(vec2 x, vec2 c) {
            return mat2(x,-x.y,x.x)*x + c;
        }

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
            return a + b*cos( 6.28318*(c*t+d) );
        }

        void mainImage( out vec4 fragColor, in vec2 fragCoord )
        {
            vec2 uv = fragCoord/iResolution.xy;
            uv -= 0.5;uv *= 1.3;uv += 0.5;
            vec4 col = vec4(1.0);
            float time = iTime*0.05+1.0;
            
            int u_maxIterations = 75;
            
            float r=0.7885*(sin((time/(3.+iHRV*0.01+iFFT[80]*0.001+iAudio[150]*0.0001+iHB))-1.57)*0.2+0.85);
            vec2 c=vec2(r*cos((time/(3.01+iHEG+iFFT[30]*0.001-iAudio[60]*0.0001+iFrontalAlpha1Coherence))),r*sin((time/3.)));
            
            vec2 z = vec2(0.);
            z.x = 3.0 * (uv.x - 0.5);
            z.y = 2.0 * (uv.y - 0.5);
            bool escaped = false;
            int iterations;
            for (int i = 0; i < 10000; i++) {
                if (i > u_maxIterations) break;
                iterations = i;
                z = f(z, c);
                if (dot(z,z) > 4.0) {
                    escaped = true;
                    break;
                }
            }
                    
            vec3 iterationCol = vec3(palette(float(iterations)/ float(u_maxIterations),
                                            vec3(0.5),
                                            vec3(0.5),
                                            vec3(1.0, 1.0, 0.0),
                                            vec3(0.3 + 0.3 * sin(time),
                                                0.2 + 0.2 * sin(1. + time),
                                                0.2  + 0.2 * sin(1.5 + time))));
                
            vec3 coreCol = vec3(0.);
            
            float f_ite = float(iterations);
            float f_maxIte = float(u_maxIterations);
            fragColor = vec4(escaped ? iterationCol : coreCol,3.-f_ite/f_maxIte );
        }


        void main() {
            mainImage(gl_FragColor, vUv*iResolution);
        }


        /** SHADERDATA
        {
            "title": "Fractal.4",
            "description": "Old fractal exploration https://codepen.io/gThiesson/pen/PowYRqg",
            "model": "nothing"
        }
        */
    `;

    constructor(
        canvas = undefined, 
        sounds = undefined,
        fragment = THREEShaderHelper.defaultFragment,
        vertex = THREEShaderHelper.defaultVertex,
        meshType = 'plane' //'plane' 'sphere', 'halfsphere' 'vrscreen' 'circle'
    ) {
        if (!canvas) {
            console.error('THREEShaderHelper needs a canvas!');
            return false;
        }

        this.audio = sounds || new Sounds();
        this.canvas = canvas;
        this.startTime = Date.now();
        this.lastTime = this.startTime;
        this.lastFrame = this.startTime;
        this.mouseclicked = 0.0;
        this.mousexyzw = [0, 0, 0, 0];

        this.addCanvasEventListeners(canvas);

        let date = new Date();

        const {uniformNames, uniforms, uniformSettings} = this.getUniformsFromText(fragment);

        this.uniforms = uniforms;
        this.uniformSettings = uniformSettings;

        this.vertex = vertex;
        this.fragment = fragment;

        this.shaderSettings = [{
            name: 'default',
            vertexShader: this.vertex,
            fragmentShader: this.fragment,
            uniformNames: uniformNames,
            author: ''
        }];

        this.three = {};

        let geometry = THREEShaderHelper.createMeshGeometry(meshType, canvas?.width || 512, canvas?.height || 512);
        this.currentViews = [meshType];

        let material = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            vertexShader: this.shaderSettings[0].vertexShader || THREEShaderHelper.defaultVertex,
            fragmentShader: this.shaderSettings[0].fragmentShader || THREEShaderHelper.defaultFragment,
            uniforms: uniforms
        });

        let mesh = new THREE.Mesh(geometry, material);

        //default uniform and mesh
        this.materials = [material];
        this.meshes = [mesh];

        this.setMeshRotation(0);
    }

    createDefaultUniforms(canvas=this.canvas, date = new Date()) {
        return {
            iResolution: { value: new THREE.Vector2(canvas?.width || 100, canvas?.height || 100) },
            iTime: { value: 0 },
            iTimeDelta: { value: 0 },
            iFrame: { value: 0 },
            iFrameRate: { value: 0 },
            iChannelTime: { value: [0, 0, 0, 0] },
            iChannelResolution: { type: 'v3v', value: [new THREE.Vector3(100, 100), new THREE.Vector3(100, 100), new THREE.Vector3(100, 100), new THREE.Vector3(100, 100)] },
            iChannel0: { type: 't', value: THREEShaderHelper.makeBlankTexture() },
            iChannel1: { type: 't', value: THREEShaderHelper.makeBlankTexture() },
            iChannel2: { type: 't', value: THREEShaderHelper.makeBlankTexture() },
            iChannel3: { type: 't', value: THREEShaderHelper.makeBlankTexture() },
            iSampleRate: { type: '1f', value: 44100 },
            iDate: { value: new THREE.Vector4(date.getYear(), date.getMonth(), date.getDay(), date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()) },
            iMouse: { value: [0, 0, 0, 0] },
            iMouseInput: { value: false },
            iImage: { type: 't', value: canvas ? new THREE.Texture(canvas) : THREEShaderHelper.makeBlankTexture() },
            iAudio: { value: new Array(256).fill(0) },
            iHRV: { value: 0 },
            iHEG: { value: 0 },
            iHR: { value: 0 },
            iHB: { value: 0 },
            iBRV: { value: 0 },
            iFFT: { value: new Array(256).fill(0) },
            iDelta: { value: 0 },
            iTheta: { value: 0 },
            iAlpha1: { value: 0 },
            iAlpha2: { value: 0 },
            iBeta: { value: 0 },
            iGamma: { value: 0 },
            iThetaBeta: { value: 0 },
            iAlpha1Alpha2: { value: 0 },
            iAlphaBeta: { value: 0 },
            iAlphaTheta: { value: 0 },
            i40Hz: { value: 0 },
            iFrontalAlpha1Coherence: { value: 0 }
        }
    }

    createDefaultUniformSettings(canvas=this.canvas, date = new Date()) {
        return {
            iResolution: { default: new THREE.Vector2(canvas?.width || 100, canvas?.height || 100), min: 8, max: 8192, step: 1 },
            iTime: { default: 0, min: 0, max: 999999, step: 1 },
            iTimeDelta: { default: 0, min: 0, max: 2, step: 0.1 },
            iFrame: { default: 0, min: 0, max: 999999, step: 1 },
            iFrameRate: { default: 0, min: 0, max: 144, step: 1 },
            iChannelTime: { default: [0, 0, 0, 0], min: 0, max: 99999, step: 1 },
            iChannelResolution: { type: 'v3v', min: 8, max: 8192, step: 1, default: [new THREE.Vector3(100, 100), new THREE.Vector3(100, 100), new THREE.Vector3(100, 100), new THREE.Vector3(100, 100)] },
            iChannel0: { type: 't', default: THREEShaderHelper.makeBlankTexture() },
            iChannel1: { type: 't', default: THREEShaderHelper.makeBlankTexture() },
            iChannel2: { type: 't', default: THREEShaderHelper.makeBlankTexture() },
            iChannel3: { type: 't', default: THREEShaderHelper.makeBlankTexture() },
            iSampleRate: { type: '1f', default: 44100, min: 8000, max: 96000, step: 1000 },
            iDate: { default: new THREE.Vector4(date.getYear(), date.getMonth(), date.getDay(), date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()) },
            iMouse: { default: [0, 0, 0, 0], min: 0, max: 8192, step: 1 },
            iMouseInput: { default: false },
            iImage: { type: 't', default: new THREE.Texture(canvas) },
            iAudio: { default: new Array(256).fill(0), min: 0, max: 255, step: 1 },
            iHRV: { default: 0, min: 0, max: 40, step: 0.5 },
            iHEG: { default: 0, min: -3, max: 3, step: 0.1 },
            iHR: { default: 0, min: 0, max: 240, step: 1 },
            iHB: { default: 0, min: 0, max: 1, step: 0.1 },
            iBRV: { default: 0, min: 0, max: 10, step: 0.5 },
            iFFT: { default: new Array(256).fill(0), min: 0, max: 1000 },
            iDelta: { default: 0, min: 0, max: 100, step: 0.5 },
            iTheta: { default: 0, min: 0, max: 100, step: 0.5 },
            iAlpha1: { default: 0, min: 0, max: 100, step: 0.5 },
            iAlpha2: { default: 0, min: 0, max: 100, step: 0.5 },
            iBeta: { default: 0, min: 0, max: 100, step: 0.5 },
            iGamma: { default: 0, min: 0, max: 100, step: 0.5 },
            iThetaBeta: { default: 0, min: 0, max: 5, step: 0.1 },
            iAlpha1Alpha2: { default: 0, min: 0, max: 5, step: 0.1 },
            iAlphaBeta: { default: 0, min: 0, max: 5, step: 0.1 },
            iAlphaTheta: { default: 0, min: 0, max: 5, step: 0.1 },
            i40Hz: { default: 0, min: 0, max: 10, step: 0.1 },
            iFrontalAlpha1Coherence: { default: 0, min: 0, max: 1.1, step: 0.1 }
        }
    }

    //uniformSettings={[key:string]:{default?:number, min?:number, max?: number, step?:number, value?:any, callback?:()=>any}}
    updateUniformSettings(uniformSettings) {
        for(const key in uniformSettings) {
            if(this.uniformSettings[key]) Object.assign(this.uniformSettings[key], uniformSettings[key]);
            else this.uniformSettings[key] = uniformSettings[key];
        }
    }

    static makeBlankTexture = (w=512,h=512) => {
        const blankData = new Uint8Array(4 * w * h); // 512x512 texture with RGBA channels
        const blankTexture = new THREE.DataTexture(blankData, w, h, THREE.RGBAFormat);
        blankTexture.needsUpdate = true;
        return blankTexture;
    }

    // Generate a shader mesh with the specified parameters. Returns a mesh with the ShaderMaterial applied.
    static generateShaderGeometry(type = 'plane', width, height, fragment = THREEShaderHelper.defaultFragment, vertex = THREEShaderHelper.defaultVertex) {
        let geometry = THREEShaderHelper.createMeshGeometry(type, width, height);
        let material = THREEShaderHelper.generateShaderMaterial(fragment, vertex);
        return new THREE.Mesh(geometry, material);
    }

    // Generate a shader material with the specified vertex and fragment. Returns a material.
    static generateShaderMaterial(fragment = THREEShaderHelper.defaultFragment, vertex = THREEShaderHelper.defaultVertex) {
        return new THREE.ShaderMaterial({
            vertexShader: vertex,
            fragmentShader: fragment,
            side: THREE.DoubleSide,
            transparent: true
        });
    }

    // Generate a shader mesh with the specified parameters: supports sphere, plane, circle, halfsphere, vrscreen
    static createMeshGeometry(type = 'plane', width=512, height=512) {
        if (type === 'sphere') {
            return new THREE.SphereGeometry(Math.min(width, height), 50, 50).rotateY(-Math.PI * 0.5);
        } else if (type === 'plane') {
            return new THREE.PlaneGeometry(width, height, 1, 1);
        } else if (type === 'circle') {
            return new THREE.CircleGeometry(Math.min(width, height), 32);
        } else if (type === 'halfsphere') {
            return new THREE.SphereGeometry(Math.min(width, height), 50, 50, -2 * Math.PI, Math.PI, 0, Math.PI).translate(0, 0, -3);
        } else if (type === 'vrscreen') {
            return new THREE.SphereGeometry(Math.min(width, height), 50, 50, -2 * Math.PI - 1, Math.PI + 1, 0.5, Math.PI - 1).rotateY(0.5).translate(0, 0, -3);
        }
    }

    // Averages values when downsampling.
    static downsample(array, fitCount, scalar = 1) {
        if (array.length > fitCount) {
            let output = new Array(fitCount);
            let incr = array.length / fitCount;
            let lastIdx = array.length - 1;
            let last = 0;
            let counter = 0;
            for (let i = incr; i < array.length; i += incr) {
                let rounded = Math.round(i);
                if (rounded > lastIdx) rounded = lastIdx;
                for (let j = last; j < rounded; j++) {
                    output[counter] += array[j];
                }
                output[counter] /= (rounded - last) * scalar;
                counter++;
                last = rounded;
            }
            return output;
        } else return array; // can't downsample a smaller array
    }

    static upsample(data, fitCount, scalar = 1) {
        var linearInterpolate = function (before, after, atPoint) {
            return (before + (after - before) * atPoint) * scalar;
        };

        var newData = new Array();
        var springFactor = (data.length - 1) / (fitCount - 1);
        newData[0] = data[0]; // for new allocation
        for (var i = 1; i < fitCount - 1; i++) {
            var tmp = i * springFactor;
            var before = Math.floor(tmp);
            var after = Math.ceil(tmp);
            var atPoint = tmp - before;
            newData[i] = linearInterpolate(data[before], data[after], atPoint);
        }
        newData[fitCount - 1] = data[data.length - 1]; // for new allocation
        return newData;
    }

    deinit() {
        this.removeCanvasEventListeners();
    }

    onmousemove = (ev) => {
        this.mousexyzw[0] = ev.offsetX;
        this.mousexyzw[1] = ev.offsetY;
    };

    mousedown = (ev) => {
        this.mouseclicked = 1.0;
        this.mousexyzw[2] = ev.offsetX;
        this.mousexyzw[3] = ev.offsetY;
    };

    addCanvasEventListeners(canvas = this.canvas) {
        canvas.addEventListener('mousemove', this.onmousemove);
        canvas.addEventListener('mousedown', this.mousedown);
    }

    removeCanvasEventListeners(canvas = this.canvas) {
        canvas.removeEventListener('mousemove', this.onmousemove);
        canvas.removeEventListener('mousedown', this.mousedown);
    }

    // Lets you add uniform settings, e.g., textures, floats, vertex lists (for meshes, type=v3v)
    addUniformSetting(name = 'newUniform', defaultValue = 0, type = undefined, callback = () => { return 0; }, min = 0, max = 1, step = 0.1) {
        this.uniformSettings[name] = { default: defaultValue, min: min, max: max, step: step, callback: callback };
        this.uniforms[name] = { value: defaultValue };
        if (type) {
            this.uniforms[name].type = type;
        }

    }

    // Create a whole new shader mesh with specified settings
    addNewShaderMesh(
        fragment = this.defaultFragment,
        vertex = this.defaultVertex,
        type = 'plane',
        width = this.canvas.width,
        height = this.canvas.height,
        name = '',
        author = ''
    ) {
        let geometry;
        if (typeof type === 'string') geometry = THREEShaderHelper.createMeshGeometry(type, width, height);
        else geometry = type; // can pass a str8 geometry object
        let material = THREEShaderHelper.generateShaderMaterial(fragment, vertex);
        let mesh = new THREE.Mesh(geometry, material);


        const {uniforms, uniformNames, uniformSettings} = this.getUniformsFromText(fragment);

        this.uniforms = uniforms; this.uniformSettings = uniformSettings;

        this.shaderSettings.push({
            name: name,
            vertexShader: vertex,
            fragmentShader: fragment,
            uniformNames: uniformNames,
            author: author
        });

        material.uniforms = uniforms;

        this.updateMaterialUniforms(material, uniformNames, type);

        this.currentViews.push(type);
        this.materials.push(material);
        this.meshes.push(mesh);

        return mesh;
    }

    // Sets the uniforms to be updated
    setUniforms(uniforms = {}) {
        for (const prop in uniforms) {
            if (this.uniforms[prop].value)
                this.uniforms[prop].value = uniforms[prop];
            else this.uniforms[prop].value = { value: uniforms[prop] };
        }

        return this.uniforms;
    }

    // Only applies to the main mesh geometry
    setMeshGeometry(type = 'plane', matidx = 0) {
        if(!['plane','sphere','vrscreen','halfsphere','circle'].find((t)=>{if(t === type) return true;})) 
            throw new Error(`Unsupported geometry, the options are 'plane','sphere','vrscreen','halfsphere','circle'`);
        if (this.meshes[matidx]) {
            this.currentViews[matidx] = type;
            this.meshes[matidx].geometry = THREEShaderHelper.createMeshGeometry(type, this.canvas.width, this.canvas.height);
            this.meshes[matidx].rotation.set(0, Math.PI, 0);
        }

        return this.meshes[matidx];
    }

    setMeshRotation(matidx = 0, anglex = 0, angley = Math.PI, anglez = 0) {
        if (this.meshes[matidx])
            this.meshes[matidx].rotation.set(anglex, angley, anglez);

        return this.meshes[matidx];
    }

    // This should allow you to set custom textures
    setChannelTexture(channelNum = 0, imageOrVideo = new THREE.DataTexture(), material = this.materials[0]) {
        if (!this.uniforms['iChannel' + channelNum]) { // if adding new textures, the GLSL needs to be able to accommodate it
            let l = this.uniforms['iChannelResolution'].value.length - 1;
            if (this.uniforms['iChannelResolution'].value.length - 1 < channelNum) {
                this.uniforms['iChannelResolution'].value.push(...new Array(channelNum - l).fill(0));
                this.uniforms['iChannelTime'].value.push(...new Array(channelNum - l).fill(Date.now() - this.startTime));
            }
        }
        this.uniforms['iChannel' + channelNum] = { type: 't', value: new THREE.Texture(imageOrVideo) };
        this.uniforms['iChannelResolution'].value[channelNum] = new THREE.Vector2(imageOrVideo.width, imageOrVideo.height);
        if (material) {
            material.uniforms['iChannel' + channelNum] = this.uniforms['iChannel' + channelNum];
            material.uniforms['iChannelResolution'] = this.uniforms['iChannelResolution'];
            material.uniforms['iChannelTime'] = this.uniforms['iChannelTime'];
        }
    }

    //can provide the list of names
    resetMaterialUniforms(material = this.materials[0], uniformNames = this.shaderSettings[0].uniformNames) {
        for (let name in uniformNames) {
            if (this.uniformSettings[name]) {
                this.uniforms[name].value = this.uniformSettings[name].default;
                material.uniforms[name] = this.uniforms[name];
            }
        }
    }

    // Updates dynamic uniforms for selected material, uniforms. Static uniforms (textures, meshes, etc) are set once.
    updateMaterialUniforms(
        material = this.materials[0], 
        uniformNames = this.shaderSettings[0].uniformNames, 
        meshType = this.currentViews[0]
    ) {
        let time = Date.now();
        for (let name of uniformNames) {
            if (!material.uniforms[name]) {
                material.uniforms[name] = { value: 0 };
            }

            //deal with special parameters then move onto custom
            if (name === 'iResolution') {
                if(material.uniforms.iResolution.value?.x !== this.canvas.width && material.uniforms.iResolution.value?.y !== this.canvas.height) {
                    if (meshType === 'halfsphere' || meshType === 'circle') {
                        material.uniforms.iResolution.value = new THREE.Vector2(this.canvas.width, this.canvas.height);
                    } else if (meshType !== 'plane') {
                        material.uniforms.iResolution.value = new THREE.Vector2(Math.max(this.canvas.width, this.canvas.height), this.canvas.width); // fix for messed up aspect ratio on vrscreen and sphere
                    } else {
                        material.uniforms.iResolution.value = new THREE.Vector2(this.canvas.width, this.canvas.height); // leave plane aspect alone
                    }
                }
            } else if (name === 'iTime') {
                material.uniforms.iTime.value = (time - this.startTime) * 0.001;
            } else if (name === 'iTimeDelta') {
                let t0 = time - this.lastTime;
                material.uniforms.iTimeDelta.value = (t0) * 0.001;
                if (t0 > 5) {
                    this.lastTime = time;
                }
            } else if (name === 'iFrame') {
                material.uniforms.iFrame.value++;
            } else if (name === 'iFrameRate') {
                let t0 = time - this.lastFrame;
                material.uniforms.iFrameRate.value = 1 / (t0 * 0.001);
                if (t0 > 5) {
                    this.lastFrame = time;
                }
            } else if (name === 'iChannelTime') {
                let t = (time - this.startTime) * 0.001;
                material.uniforms.iChannelTime.value.forEach((t, i) => {
                    material.uniforms.iChannelTime.value[i] = t;
                });
            } else if (name === 'iDate') {
                let date = new Date();
                material.uniforms.iDate.value.x = date.getYear();
                material.uniforms.iDate.value.y = date.getMonth();
                material.uniforms.iDate.value.z = date.getDay();
                material.uniforms.iDate.value.w = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
            } else if (name === 'iMouse') {
                material.uniforms.iMouse.value = new THREE.Vector4(...this.mousexyzw);
            } else if (name === 'iMouseInput') {
                material.uniforms.iMouseInput.value = this.mouseclicked;
            } else if (name === 'iImage') {
                material.uniforms.iImage.value = new THREE.Texture(this.canvas);
            } else if (name === 'iAudio') {
                if (this.audio && this.audio.playing) { // using Sound.js
                    material.uniforms.iAudio.value = THREEShaderHelper.downsample(Array.from(this.audio.getAnalyzerData()), 256);
                } else {
                    material.uniforms.iAudio.value = this.uniforms.iAudio.value;
                }
            } else if (this.uniformSettings[name]) { // arbitrary uniforms
                if (this.uniformSettings[name].callback) {
                    material.uniforms[name].value = this.uniformSettings[name].callback();
                } else if ('value' in this.uniformSettings[name]) {
                    material.uniforms[name].value = this.uniformSettings[name].value;
                    delete this.uniformSettings[name].value; //you could update this value to trigger it to set on frame instead
                }
            }
        }
    }

    // Update all of the uniforms simultaneously to save time
    updateAllMaterialUniforms() {
        let time = Date.now();
        Object.keys(this.uniforms).forEach((name) => {
            let materialsfiltered = [];
            this.shaderSettings.filter((setting, j) => {
                if (setting.uniformNames.indexOf(name) > -1) {
                    materialsfiltered.push(this.materials[j]);
                    return true;
                }
            });
            if (materialsfiltered.length > 0) {
                let value;
                if (name === 'iResolution') {
                    if (this.currentViews[0] === 'halfsphere' || this.currentViews[0] === 'circle') {
                        value = new THREE.Vector2(this.canvas.width, this.canvas.height);
                    } else if (this.currentViews[0] !== 'plane') {
                        value = new THREE.Vector2(Math.max(this.canvas.width, this.canvas.height), this.canvas.width);
                    } else {
                        value = new THREE.Vector2(this.canvas.width, this.canvas.height);
                    }
                } else if (name === 'iTime') {
                    value = (time - this.startTime) * 0.001;
                } else if (name === 'iTimeDelta') {
                    value = (time - this.lastTime) * 0.001;
                    this.lastTime = time;
                } else if (name === 'iFrame') {
                    this.uniforms.iFrame.value++;
                    value = this.uniforms.iFrame.value;
                } else if (name === 'iFrameRate') {
                    value = 1 / ((time - this.lastFrame) * 0.001);
                    this.lastFrame = time;
                } else if (name === 'iChannelTime') {
                    let t = (time - this.startTime) * 0.001;
                    this.uniforms.iChannelTime.value.forEach((t, i) => {
                        this.uniforms.iChannelTime.value[i] = t;
                    });
                    value = this.uniforms.iChannelTime.value;
                } else if (name === 'iDate') {
                    let date = new Date();
                    value = new THREE.Vector4(date.getYear(), date.getMonth(), date.getDay(), date.getHours() * 60 * 60 + date.getMinutes() * 60 + date.getSeconds());
                } else if (name === 'iMouse') {
                    value = new THREE.Vector4(...this.mousexyzw);
                } else if (name === 'iMouseInput') {
                    value = this.mouseclicked;
                } else if (name === 'iImage') {
                    value = new THREE.Texture(this.canvas);
                } else if (name === 'iAudio') {
                    if (this.audio) { // using Sound.js
                        value = Array.from(this.audio.getAnalyzerData().slice(0, 256));
                    } else {
                        value = this.uniforms.iAudio.value;
                    }
                } else if (this.uniformSettings[name]) { // arbitrary uniforms
                    if (this.uniformSettings[name].callback) {
                        value = this.uniformSettings[name].callback();
                    } else {
                        value = this.uniforms[name].value;
                    }
                }

                materialsfiltered.forEach(material => {
                    if (!material.uniforms[name]) {
                        material.uniforms[name] = { value: value };
                    } else material.uniforms[name].value = value;
                });
            }
        });
    }

    // Applies to main shader
    setShader(matidx = 0, name = '',fragmentShader = ``,  vertexShader = THREEShaderHelper.defaultVertex, author = '') {
        const {uniforms, uniformNames, uniformSettings} = this.getUniformsFromText(fragmentShader);
        this.uniforms = uniforms; this.uniformSettings = uniformSettings;

        this.shaderSettings[matidx].name = name;
        this.shaderSettings[matidx].vertexShader = vertexShader;
        this.shaderSettings[matidx].fragmentShader = fragmentShader;
        this.shaderSettings[matidx].uniformNames = uniformNames;
        this.shaderSettings[matidx].author = author;


        this.materials[matidx] = new THREE.ShaderMaterial({
            vertexShader: this.shaderSettings[matidx].vertexShader,
            fragmentShader: this.shaderSettings[matidx].fragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: uniforms
        });

        this.updateMaterialUniforms(this.materials[matidx], uniformNames, this.currentViews[matidx]);

        if (this.meshes[matidx]) {
            this.meshes[matidx].material.dispose();
            this.meshes[matidx].material = this.materials[matidx];
        }
    }

    swapShader(matidx = 0, onchange = () => { this.startTime = Date.now(); }) {
        const {uniforms, uniformNames, uniformSettings} = this.getUniformsFromText(fragmentShader);
        this.uniforms = uniforms; this.uniformSettings = uniformSettings;

        this.materials[matidx] = new THREE.ShaderMaterial({
            vertexShader: this.shaderSettings[matidx].vertexShader,
            fragmentShader: this.shaderSettings[matidx].fragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: uniforms
        });

        this.updateMaterialUniforms(this.materials[matidx], uniformNames);

        if (this.meshes[matidx]) {
            this.meshes[matidx].material.dispose();
            this.meshes[matidx].material = this.materials[matidx];
        }

        onchange();
    }

    setShaderFromText(
        matidx = 0,
        fragmentShaderText = THREEShaderHelper.defaultFragment,
        vertexShaderText = THREEShaderHelper.defaultVertex,
        onchange = () => { this.startTime = Date.now(); },
        name = '',
        author = ''
    ) {
        this.fragment = fragmentShaderText;
        this.vertex = vertexShaderText;

        // Dynamically Extract Uniforms
        const {uniformNames, uniforms, uniformSettings} = this.getUniformsFromText()
        this.uniforms = uniforms; 
        this.uniformSettings = uniformSettings;

        this.shaderSettings[matidx].name = name;
        this.shaderSettings[matidx].vertexShader = vertexShaderText;
        this.shaderSettings[matidx].fragmentShader = fragmentShaderText;
        this.shaderSettings[matidx].author = author;
        this.shaderSettings[matidx].uniformNames = uniformNames;

        this.swapShader(matidx, onchange);
    }

    getUniformsFromText(shaderText='', canvas = this.canvas, date = new Date()) {
        // Define the default uniforms and their corresponding settings
        const predefinedUniforms = this.createDefaultUniforms(canvas, date);
        const predefinedUniformSettings = this.createDefaultUniformSettings(canvas, date);
    
        // Extract #define directives for array sizes
        let defineRegex = new RegExp('#define\\s+(\\w+)\\s+(\\d+)', 'g');
        let defines = {};
        let defineMatch;
        while ((defineMatch = defineRegex.exec(shaderText)) !== null) {
            defines[defineMatch[1]] = parseInt(defineMatch[2]);
        }
    
        // Dynamically Extract Uniforms
        let uniformRegex = new RegExp('uniform\\s+([\\w]+)\\s+([\\w]+)(\\[\\w+\\])?;', 'g');
        let result = [...shaderText.matchAll(uniformRegex)];
        let uniforms = {};
        let uniformSettings = {};
        let uniformNames = [];
    
        result.forEach(a => {
            const u = a[2]; // Uniform name
            const arraySizeMatch = a[3]; // Matches array size, e.g., [256] or [ARRAYSIZE]
    
            // Determine the array size if applicable
            let arraySize = 1;
            if (arraySizeMatch) {
                let sizeStr = arraySizeMatch.replace(/[\[\]]/g, '');
                if (defines[sizeStr] !== undefined) {
                    arraySize = defines[sizeStr];
                } else {
                    arraySize = parseInt(sizeStr) || 1;
                }
            }
    
            // Check if this uniform matches a predefined uniform
            if (predefinedUniforms.hasOwnProperty(u)) {
                uniforms[u] = predefinedUniforms[u];
                uniformSettings[u] = predefinedUniformSettings[u];
            } else {
                // Handle different GLSL types
                if (a[1].includes('sampler')) {
                    uniforms[u] = { value: THREEShaderHelper.makeBlankTexture(), type: 't' };
                    uniformSettings[u] = { default: THREEShaderHelper.makeBlankTexture(), type: 't' };
                } else if (a[1].includes('float')) {
                    uniforms[u] = { value: arraySize > 1 ? new Array(arraySize).fill(0) : 0, type: '1f' };
                    uniformSettings[u] = { default: arraySize > 1 ? new Array(arraySize).fill(0) : 0, min: 0, max: 100, step: 1, type: '1f' };
                } else if (a[1].includes('vec2')) {
                    uniforms[u] = { value: arraySize > 1 ? new Array(arraySize).fill(new THREE.Vector2(0, 0)) : new THREE.Vector2(0, 0), type: 'v2' };
                    uniformSettings[u] = { default: arraySize > 1 ? new Array(arraySize).fill(new THREE.Vector2(0, 0)) : new THREE.Vector2(0, 0), min: 0, max: 1000, step: 1, type: 'v2' };
                } else if (a[1].includes('vec3')) {
                    uniforms[u] = { value: arraySize > 1 ? new Array(arraySize).fill(new THREE.Vector3(0, 0, 0)) : new THREE.Vector3(0, 0, 0), type: 'v3' };
                    uniformSettings[u] = { default: arraySize > 1 ? new Array(arraySize).fill(new THREE.Vector3(0, 0, 0)) : new THREE.Vector3(0, 0, 0), min: 0, max: 1000, step: 1, type: 'v3' };
                } else if (a[1].includes('vec4')) {
                    uniforms[u] = { value: arraySize > 1 ? new Array(arraySize).fill(new THREE.Vector4(0, 0, 0, 0)) : new THREE.Vector4(0, 0, 0, 0), type: 'v4' };
                    uniformSettings[u] = { default: arraySize > 1 ? new Array(arraySize).fill(new THREE.Vector4(0, 0, 0, 0)) : new THREE.Vector4(0, 0, 0, 0), min: 0, max: 1000, step: 1, type: 'v4' };
                } else if (a[1].includes('int')) {
                    uniforms[u] = { value: arraySize > 1 ? new Array(arraySize).fill(0) : 0, type: '1i' };
                    uniformSettings[u] = { default: arraySize > 1 ? new Array(arraySize).fill(0) : 0, min: 0, max: 100, step: 1, type: '1i' };
                } else if (a[1].includes('bool')) {
                    uniforms[u] = { value: arraySize > 1 ? new Array(arraySize).fill(false) : false, type: 'bool' };
                    uniformSettings[u] = { default: arraySize > 1 ? new Array(arraySize).fill(false) : false, type: 'bool' };
                } else if (a[1].includes('mat3')) {
                    uniforms[u] = { value: arraySize > 1 ? new Array(arraySize).fill(new THREE.Matrix3()) : new THREE.Matrix3(), type: 'mat3' };
                    uniformSettings[u] = { default: arraySize > 1 ? new Array(arraySize).fill(new THREE.Matrix3()) : new THREE.Matrix3(), type: 'mat3' };
                } else if (a[1].includes('mat4')) {
                    uniforms[u] = { value: arraySize > 1 ? new Array(arraySize).fill(new THREE.Matrix4()) : new THREE.Matrix4(), type: 'mat4' };
                    uniformSettings[u] = { default: arraySize > 1 ? new Array(arraySize).fill(new THREE.Matrix4()) : new THREE.Matrix4(), type: 'mat4' };
                }
                // Add more types if needed
            }
            uniformNames.push(u);
        });
    
        // Merge with default uniforms (optional step if you want to ensure all defaults are present)
        uniforms = { ...uniforms };
        uniformSettings = { ...uniformSettings };
    
        return { uniformNames, uniforms, uniformSettings };
    }
    
    clearGUI() {
        if(this.guiControllers) Object.keys(this.guiControllers).forEach(c => {
            let controller = this.guiControllers[c];
            controller.items.forEach((item)=>{controller.menu.remove(item);})
        });
        this.guiControllers = {};
    }

    generateGUI(uniformNames = this.shaderSettings[0].uniformNames, material = this.materials[0]) {
        if (!this.gui) return undefined;

        let updateUniforms = (key, value) => {
            if (material.uniforms[key] == null) material.uniforms[key] = {};
            material.uniforms[key].value = value;
        };

        let folders = Object.keys(this.gui.__folders);
        if (!folders.includes('Uniforms')) {
            this.gui.addFolder('Uniforms');
        }


        let paramsMenu = this.gui.__folders['Uniforms'];

        if(this.guiControllers) Object.keys(this.guiControllers).forEach(c => {
            let controller = this.guiControllers[c];
            controller.items.forEach((item)=>{controller.menu.remove(item);})
        });

        this.guiControllers = { 'Uniforms':{menu:paramsMenu, items:[]} };

        let keys = Object.keys(this.uniforms);
        
        let guiObject = {};
        uniformNames.forEach((name) => {
            guiObject[name] = this.uniforms[name].value;
        })

        uniformNames.forEach((name) => {
            if(name === 'iResolution' || name === 'iTime' || name === 'iDate' || name === 'iFrame' || name === 'iFrameRate' || name === 'iTimeDelta' || name === 'iMouse' || name === 'iMouseInput') return; //these are just overwritten by internal processes anyway
            if (typeof this.uniforms[name].value !== 'object' && typeof this.uniformSettings[name].min !== 'undefined' && typeof this.uniformSettings[name].max !== 'undefined' && typeof this.uniformSettings[name].step !== 'undefined') {
                let menuitem = paramsMenu.add(
                    guiObject,
                    name,
                    this.uniformSettings[name].min,
                    this.uniformSettings[name].max,
                    this.uniformSettings[name].step
                ); 

                menuitem.onChange(
                    (val) => updateUniforms(name, val)
                );
                
                this.guiControllers['Uniforms'].items.push(menuitem);
                
            } else if (typeof this.uniforms[name].value === 'object' && this.uniforms[name].type !== 't') {
                let folders = Object.keys(this.gui.__folders);
                if (!folders.includes(name)) {
                    this.gui.addFolder(name);
                }

                let subMenu = this.gui.__folders[name];

                this.guiControllers[name] = {menu:subMenu, items:[]};

                for(const key in this.uniforms[name].value) {
                    let menuitem = subMenu.add(
                        guiObject[name],
                        key,
                        this.uniformSettings[name].min,
                        this.uniformSettings[name].max,
                        this.uniformSettings[name].step
                    ); 

                    menuitem.onChange(
                        (val) => {
                            guiObject[name][key] = val;
                            updateUniforms(name, guiObject[name]);
                        }
                    );
                    
                    this.guiControllers[name].items.push(menuitem);
                }

            }
        });
    }

    // Test the renderer
    createRenderer(canvas = this.canvas) {
        this.gui;
        this.guiControllers = [];
        try {
            this.gui = new GUI({ autoPlace: true });
            this.generateGUI();
        } catch (err) {
            // probably not on main thread
        }

        /**
         * Scene
         */
        this.three.scene = new THREE.Scene();

        /**
         * Camera
         */

        this.baseCameraPos = new THREE.Vector3(0, 0, 0.65*canvas.width*canvas.height/canvas.width);
        this.camera = new THREE.PerspectiveCamera(75, (canvas?.width || 512) / (canvas?.height || 512), 0.01, 5000);

        // Set the aspect ratio and ensure the camera's position is appropriate
        this.camera.aspect = canvas.width / canvas.height;
        this.camera.updateProjectionMatrix();

        // Position the camera so that the mesh fits perfectly in the view
        this.camera.position.z = this.baseCameraPos.z;
        this.camera.lookAt(0, 0, 0);

        /**
         * Texture Params
         */

        let containerAspect = canvas.width / canvas.height;
        this.fov_y = this.camera.position.z * this.camera.getFilmHeight() / this.camera.getFocalLength();

        // Fit Screen
        this.three.meshWidth = this.fov_y * this.camera.aspect;
        this.three.meshHeight = this.three.meshWidth / containerAspect;

        // Renderer
        this.three.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: this.canvas });
        this.three.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.three.renderer.setSize(this.canvas.width, this.canvas.height);
        // this.three.renderer.domElement.style.width = '100%';
        // this.three.renderer.domElement.style.height = '100%';
        // this.three.renderer.domElement.style.opacity = '0';
        // this.three.renderer.domElement.style.transition = 'opacity 1s';

        // Controls
        this.three.controls = new OrbitControls(this.camera, this.three.renderer.domElement);
        this.three.controls.enablePan = true;
        this.three.controls.enableDamping = true;
        this.three.controls.enabled = true;
        this.three.controls.minPolarAngle = (2 * Math.PI) / 6; // radians
        this.three.controls.maxPolarAngle = (4 * Math.PI) / 6; // radians
        this.three.controls.minDistance = this.baseCameraPos.z; // radians
        this.three.controls.maxDistance = this.baseCameraPos.z * 1000; // radians

        //test sphere to check scene 
        // const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
        // const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x0077ff });
        // const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        // this.three.scene.add(sphereMesh);

          // Add the shader mesh to the scene
        this.meshes.forEach(mesh => {
            this.three.scene.add(mesh);
        });


        if(this.uniforms.iResolution) this.uniforms.iResolution.value = new THREE.Vector2(
            this.three.meshWidth, 
            this.three.meshHeight
        ); // Required for ShaderToy shaders

        // Animate
        this.startTime = Date.now();

        let render = () => {
            if (this.three.renderer.domElement != null) {
                // let time = (Date.now() - this.startTime) / 1000;
                // if(this.uniforms.iTimeDelta) this.uniforms.iTimeDelta.value = time - this.uniforms.iTime.value;
                // if(this.uniforms.iTime) this.uniforms.iTime.value = time;
                // if(this.uniforms.iFrame) this.uniforms.iFrame.value++;
                // if(this.uniforms.iFrameRate) this.uniforms.iFrameRate.value = 1 / (this.uniforms.iTimeDelta.value * 0.001);

                this.meshes.forEach((p,i) => {
                    this.updateMaterialUniforms(p.material, this.shaderSettings[i].uniformNames, this.currentViews[i]);
                });

                this.three.renderer.render(this.three.scene, this.camera);
            }
        };

        this.three.renderer.setAnimationLoop(render);
    }

    destroyRenderer() {
        this.three.renderer?.setAnimationLoop(null);
        for (let i = this.three.scene.children.length - 1; i >= 0; i--) {
            const object = this.three.scene.children[i];
            if (object.type === 'Mesh') {
                object.geometry.dispose();
                object.material.dispose();
            }
            this.three.scene.remove(object);
        }
        this.three.scene = null;
        this.three.renderer.domElement = null;
        this.three.renderer = null;
    }
}


/**
 * 
 *     
    static hyperbolicVertex = `
        varying vec2 vUv;

        void main() {
            vUv = uv;

            vec4 modelPosition = modelMatrix * vec4(position, 1.0);

            // Hard-coded K value for Cartesian Hyperbolic Transformation
            float uK = 1.0;

            // Cartesian Hyperbolic Transformation
            modelPosition.x /= (modelPosition.x * modelPosition.x + uK * uK);
            modelPosition.y /= (modelPosition.y * modelPosition.y + uK * uK);

            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectedPosition = projectionMatrix * viewPosition;

            gl_Position = projectedPosition;
        }
    `;

    static hyperbolicFragment = `
        varying vec2 vUv;

        void main() {
            // Visualize UVs as colors
            vec3 color = vec3(vUv, 1.0);
            gl_FragColor = vec4(color, 1.0);
        }
    `;

 * 
 */