export { Sounds };
export class THREEShaderHelper {
    static defaultVertex: string;
    static defaultFragmentSimple: string;
    static defaultFragment: string;
    static juliaFragment: string;
    static makeBlankTexture: (w?: number, h?: number) => any;
    static generateShaderGeometry(type: string, width: any, height: any, fragment?: string, vertex?: string): any;
    static generateShaderMaterial(fragment?: string, vertex?: string): any;
    static createMeshGeometry(type?: string, width?: number, height?: number): any;
    static downsample(array: any, fitCount: any, scalar?: number): any;
    static upsample(data: any, fitCount: any, scalar?: number): any[];
    constructor(canvas?: any, sounds?: any, fragment?: string, vertex?: string, meshType?: string);
    audio: any;
    canvas: any;
    startTime: number;
    lastTime: number;
    lastFrame: number;
    mouseclicked: number;
    mousexyzw: number[];
    uniforms: {};
    uniformSettings: {};
    vertex: string;
    fragment: string;
    shaderSettings: {
        name: string;
        vertexShader: string;
        fragmentShader: string;
        uniformNames: any[];
        author: string;
    }[];
    three: {};
    currentViews: string[];
    materials: any[];
    meshes: any[];
    createDefaultUniforms(canvas?: any, date?: Date): {
        iResolution: {
            value: any;
        };
        iTime: {
            value: number;
        };
        iTimeDelta: {
            value: number;
        };
        iFrame: {
            value: number;
        };
        iFrameRate: {
            value: number;
        };
        iChannelTime: {
            value: number[];
        };
        iChannelResolution: {
            type: string;
            value: any[];
        };
        iChannel0: {
            type: string;
            value: any;
        };
        iChannel1: {
            type: string;
            value: any;
        };
        iChannel2: {
            type: string;
            value: any;
        };
        iChannel3: {
            type: string;
            value: any;
        };
        iSampleRate: {
            type: string;
            value: number;
        };
        iDate: {
            value: any;
        };
        iMouse: {
            value: number[];
        };
        iMouseInput: {
            value: boolean;
        };
        iImage: {
            type: string;
            value: any;
        };
        iAudio: {
            value: any[];
        };
        iHRV: {
            value: number;
        };
        iHEG: {
            value: number;
        };
        iHR: {
            value: number;
        };
        iHB: {
            value: number;
        };
        iBRV: {
            value: number;
        };
        iFFT: {
            value: any[];
        };
        iDelta: {
            value: number;
        };
        iTheta: {
            value: number;
        };
        iAlpha1: {
            value: number;
        };
        iAlpha2: {
            value: number;
        };
        iBeta: {
            value: number;
        };
        iGamma: {
            value: number;
        };
        iThetaBeta: {
            value: number;
        };
        iAlpha1Alpha2: {
            value: number;
        };
        iAlphaBeta: {
            value: number;
        };
        iAlphaTheta: {
            value: number;
        };
        i40Hz: {
            value: number;
        };
        iFrontalAlpha1Coherence: {
            value: number;
        };
    };
    createDefaultUniformSettings(canvas?: any, date?: Date): {
        iResolution: {
            default: any;
            min: number;
            max: number;
            step: number;
        };
        iTime: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iTimeDelta: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iFrame: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iFrameRate: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iChannelTime: {
            default: number[];
            min: number;
            max: number;
            step: number;
        };
        iChannelResolution: {
            type: string;
            min: number;
            max: number;
            step: number;
            default: any[];
        };
        iChannel0: {
            type: string;
            default: any;
        };
        iChannel1: {
            type: string;
            default: any;
        };
        iChannel2: {
            type: string;
            default: any;
        };
        iChannel3: {
            type: string;
            default: any;
        };
        iSampleRate: {
            type: string;
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iDate: {
            default: any;
        };
        iMouse: {
            default: number[];
            min: number;
            max: number;
            step: number;
        };
        iMouseInput: {
            default: boolean;
        };
        iImage: {
            type: string;
            default: any;
        };
        iAudio: {
            default: any[];
            min: number;
            max: number;
            step: number;
        };
        iHRV: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iHEG: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iHR: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iHB: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iBRV: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iFFT: {
            default: any[];
            min: number;
            max: number;
        };
        iDelta: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iTheta: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iAlpha1: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iAlpha2: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iBeta: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iGamma: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iThetaBeta: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iAlpha1Alpha2: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iAlphaBeta: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iAlphaTheta: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        i40Hz: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
        iFrontalAlpha1Coherence: {
            default: number;
            min: number;
            max: number;
            step: number;
        };
    };
    updateUniformSettings(uniformSettings: any): void;
    deinit(): void;
    onmousemove: (ev: any) => void;
    mousedown: (ev: any) => void;
    addCanvasEventListeners(canvas?: any): void;
    removeCanvasEventListeners(canvas?: any): void;
    addUniformSetting(name?: string, defaultValue?: number, type?: any, callback?: () => number, min?: number, max?: number, step?: number): void;
    addNewShaderMesh(fragment?: any, vertex?: any, type?: string, width?: any, height?: any, name?: string, author?: string): any;
    setUniforms(uniforms?: {}): {};
    setMeshGeometry(type?: string, matidx?: number): any;
    setMeshRotation(anglex?: number, angley?: number, anglez?: number, matidx?: number): any;
    setChannelTexture(channelNum?: number, imageOrVideo?: any, material?: any): void;
    resetMaterialUniforms(material?: any, uniformNames?: any[]): void;
    updateMaterialUniforms(material?: any, uniformNames?: any[], meshType?: string): void;
    updateAllMaterialUniforms(): void;
    swapShader(matidx?: number, onchange?: () => void): void;
    setShader(fragmentShaderText?: string, vertexShaderText?: string, onchange?: () => void, matidx?: number, name?: string, author?: string): void;
    getUniformsFromText(shaderText?: string, canvas?: any, date?: Date): {
        uniformNames: any[];
        uniforms: {};
        uniformSettings: {};
    };
    clearGUI(): void;
    guiControllers: any[] | {
        Uniforms?: undefined;
    } | {
        Uniforms: {
            menu: any;
            items: any[];
        };
    };
    generateGUI(uniformNames?: any[], material?: any): any;
    createRenderer(canvas?: any, controls?: boolean): void;
    gui: any;
    /**
     * Camera
     */
    baseCameraPos: any;
    camera: any;
    fov_y: number;
    destroyRenderer(): void;
}
import { Sounds } from './sound';
