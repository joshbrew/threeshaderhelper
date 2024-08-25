export class Sounds {
    ctx: AudioContext;
    sourceList: any[];
    sourceGains: any[];
    recordedData: any[];
    recorder: MediaRecorder;
    buffer: any[];
    osc: any[];
    gainNode: GainNode;
    analyserNode: AnalyserNode;
    out: AudioDestinationNode;
    playFreq(freq?: number[], seconds?: number, type?: string, startTime?: number): void;
    stopFreq(firstIndex?: number, number?: number, delay?: number): void;
    addSounds(urlList?: string[], onReady?: (sourceListIdx: any, buffer: any) => void, onBeginDecoding?: () => void, canAddFile?: boolean): void;
    copySound(soundBuffer: any): any;
    decodeLocalAudioFile(onReady?: (sourceListIdx: any, buffer: any) => void, onBeginDecoding?: () => void): void;
    finishedLoading(bufferList: any): any[];
    playing: boolean;
    playSound(bufferIndex: any, seconds?: number, repeat?: boolean, startTime?: number): void;
    stopSound(bufferIndex: any): void;
    setPlaybackRate(bufferIndex: any, rate: any): void;
    seekSound(bufferIndex: any, seekTime?: number, repeat?: boolean): void;
    getAnalyzerData(fftSize?: number): Uint8Array;
    getFFTData(normalized?: boolean, fftSize?: number, minDecibels?: number, maxDecibels?: number): Uint8Array;
    visualizeFFT(canvas: any): void;
    setVolume(bufferIndex: any, volumeLevel: any): void;
    setPanning(bufferIndex: any, panValue: any): void;
    triggerOnFrequencyCross(frequency: any, threshold: any, callback: any): void;
    record(name?: string, args?: {
        audio: boolean;
        video: boolean;
    }, type?: any, streamElement?: any, save?: boolean, onBegin?: () => void): number;
    getExtensionFromType(type: any): "" | ".webm" | ".ogg" | ".mp3" | ".wav" | ".mkv";
    cleanupSource(source: any, gain: any): void;
    replayRecording(streamElement: any): void;
}
export class BufferLoader {
    constructor(SoundJSInstance: any, urlList: any, callback: any, onReady?: (sourceListIdx: any) => void, onBeginDecoding?: () => void);
    audio: any;
    ctx: any;
    urlList: any;
    onload: any;
    bufferList: any[];
    loadCount: number;
    onBeginDecoding: () => void;
    onReady: (sourceListIdx: any) => void;
    loadBuffer(url: string, index: any, canAddFile?: boolean, crossOrigin?: boolean): void;
    load(canAddFile?: boolean): void;
}
