export class Sounds { 
    constructor() {
        // Initialize the AudioContext, which is used to manage and play audio
        window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
        
        this.ctx = null;
        try {
            this.ctx = new AudioContext();  // Create a new AudioContext
        } catch (e) {
            alert("Your browser does not support AudioContext!");
            console.log(e);
        }

        // Arrays to hold the audio sources and corresponding gain nodes
        this.sourceList = [];
        this.sourceGains = [];

        // Used for recording and storing audio data
        this.recordedData = [];
        this.recorder = null;
        this.buffer = [];

        // Oscillators are used to generate sound of a specific frequency
        this.osc = [];
        
        // GainNode controls the volume
        this.gainNode = this.ctx.createGain();
        
        // AnalyserNode provides real-time frequency and time-domain analysis information
        this.analyserNode = this.ctx.createAnalyser();
        
        // Connect the gain node to the analyser, and the analyser to the destination (speakers)
        this.out = this.ctx.destination;
        this.gainNode.connect(this.analyserNode);
        this.analyserNode.connect(this.out);
    }

    // Play a frequency or an array of frequencies using an oscillator
    playFreq(freq = [1000], seconds = 0, type = 'sine', startTime = this.ctx.currentTime) { 
        freq.forEach((element) => {
            let osc = this.ctx.createOscillator();  // Create a new oscillator
            osc.type = type;  // Set the waveform type (sine, square, sawtooth, triangle, or custom)
            osc.connect(this.gainNode);  // Connect the oscillator to the gain node
            osc.frequency.setValueAtTime(element, startTime);  // Set the frequency

            osc.start(startTime);  // Start the oscillator at the specified time

            if (seconds !== 0) {
                osc.stop(startTime + seconds);  // Stop the oscillator after a certain duration
            }

            osc.onended = () => {
                osc.disconnect();  // Disconnect the oscillator when done
                const index = this.osc.indexOf(osc);
                if (index !== -1) {
                    this.osc.splice(index, 1);  // Remove the oscillator from the array
                }
            };

            this.osc.push(osc);  // Add the oscillator to the array for tracking
        });
    }

    // Stop one or more oscillators after an optional delay
    stopFreq(firstIndex = 0, number = 1, delay = 0) { 
        for (let i = firstIndex; i < firstIndex + number; i++) {
            if (this.osc[i]) {
                this.osc[i].stop(this.ctx.currentTime + delay);  // Stop the oscillator with a delay
            } else {
                console.log("No oscillator found at index:", i);
            }
        }
    }

    // Add sound files to the source list, either from a URL or a local file
    addSounds(urlList = [''], onReady = (sourceListIdx, buffer) => {}, onBeginDecoding = () => {}, canAddFile = false) {
        if (typeof urlList === 'string') urlList = [urlList];
        let bufferLoader = new BufferLoader(this, urlList, this.finishedLoading.bind(this), onReady, onBeginDecoding);
        bufferLoader.load(canAddFile);  // Load the sound files using BufferLoader
    }

    // Create a copy of an existing sound buffer
    copySound(soundBuffer) {
        let buf = this.ctx.createBuffer(soundBuffer.numberOfChannels, soundBuffer.length, soundBuffer.sampleRate);
        for (let i = 0; i < soundBuffer.numberOfChannels; i++) {
            buf.copyToChannel(soundBuffer.getChannelData(i), i);  // Copy the channel data into the new buffer
        }
        let newSourceIndices = this.finishedLoading([buf]);  // Add the new buffer to the source list
        return newSourceIndices[0];  // Return the index of the new sound source
    }

    // Decode a local audio file selected by the user
    decodeLocalAudioFile(onReady = (sourceListIdx, buffer) => {}, onBeginDecoding = () => {}) {
        let input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';  // Restrict file selection to audio files

        input.onchange = (e) => {
            if (e.target.files.length !== 0) {
                let file = e.target.files[0];
                let fr = new FileReader();
                fr.onload = (ev) => {
                    let fileResult = ev.target.result;
                    if (this.ctx === null) {
                        return;
                    }
                    onBeginDecoding();  // Callback before decoding starts
                    this.ctx.decodeAudioData(fileResult, (buffer) => {
                        this.finishedLoading([buffer]);  // Add the decoded buffer to the source list
                        onReady(this.sourceList.length - 1, buffer);  // Callback when decoding is complete
                    }, (er) => {
                        console.error(er);
                    });
                };
                fr.onerror = function(er) {
                    console.error(er);
                };
                fr.readAsArrayBuffer(file);  // Read the file as an ArrayBuffer
            }
        };
        input.click();  // Trigger the file input dialog
    }

    // Add decoded audio buffers to the source list and create corresponding gain nodes
    finishedLoading(bufferList) {
        let newBufferSourceIndices = [];
        bufferList.forEach((element) => {
            let source = this.ctx.createBufferSource();  // Create a new buffer source
            let gain = this.ctx.createGain();  // Create a new gain node

            source.buffer = element;  // Set the buffer for the source
            source.connect(gain);  // Connect the source to the gain node
            gain.connect(this.gainNode);  // Connect the gain node to the main gain node

            this.sourceList.push(source);  // Add the source to the source list
            this.sourceGains.push(gain);  // Add the gain node to the gain list

            let idx = this.sourceList.length - 1;
            newBufferSourceIndices.push(idx);

            source.onended = () => {
                this.playing = false;
                source.disconnect();
                gain.disconnect();
                this.sourceList.splice(idx, 1);  // Remove the source from the list when it ends
                this.sourceGains.splice(idx, 1);  // Remove the gain node from the list
            };
        });
        return newBufferSourceIndices;
    }

    // Play a sound buffer by its index
    playSound(bufferIndex, seconds = 0, repeat = false, startTime = this.ctx.currentTime) {
        if (repeat === true) {
            this.sourceList[bufferIndex].loop = true;  // Enable looping if repeat is true
        }

        this.sourceList[bufferIndex].start(startTime);  // Start the sound at the specified time
        this.playing = true;
        if (seconds !== 0) {
            this.sourceList[bufferIndex].stop(startTime + seconds);  // Stop the sound after a certain duration
            this.playing = false;
        }
    }

    // Stop a sound by its buffer index
    stopSound(bufferIndex) {
        if (this.sourceList[bufferIndex]) {
            this.sourceList[bufferIndex].stop(0);  // Stop the sound immediately
            this.playing = false;
        }
    }

    // Set the playback rate for a sound buffer
    setPlaybackRate(bufferIndex, rate) {
        if (this.sourceList[bufferIndex]) {
            this.sourceList[bufferIndex].playbackRate.value = rate;  // Set the playback rate
        }
    }

    // Seek within a sound buffer by stopping the current source and creating a new one
    seekSound(bufferIndex, seekTime = 0, repeat = false) {
        if (this.sourceList[bufferIndex]) {
            let buffer = this.sourceList[bufferIndex].buffer;  // Get the current buffer
            let gain = this.sourceGains[bufferIndex];  // Get the corresponding gain node

            let newSource = this.ctx.createBufferSource();  // Create a new buffer source
            newSource.buffer = buffer;  // Set the buffer for the new source
            newSource.connect(gain);  // Connect the new source to the gain node

            if (repeat) {
                newSource.loop = true;  // Enable looping if repeat is true
            }

            this.sourceList[bufferIndex].stop();  // Stop the old source
            this.sourceList[bufferIndex].disconnect();  // Disconnect the old source

            this.sourceList[bufferIndex] = newSource;  // Replace the old source with the new one
            newSource.start(this.ctx.currentTime, seekTime);  // Start the new source at the specified seek time
        }
    }

    // Get real-time frequency data from the AnalyserNode
    getAnalyzerData(fftSize = 512) {
        this.analyserNode.fftSize = fftSize;
        let array = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.analyserNode.getByteFrequencyData(array);  // Populate the array with frequency data
        return array;
    }

    getFFTData(normalized = true, fftSize = 512, minDecibels = -100, maxDecibels = 0) {
        this.analyserNode.minDecibels = minDecibels;
        this.analyserNode.maxDecibels = maxDecibels;
        this.analyserNode.fftSize = fftSize;
        
        let array = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.analyserNode.getByteFrequencyData(array);
    
        if (normalized) {
            return array.map(value => value / 255); // Normalize to range 0-1
        }
        return array;
    }

    // Visualize FFT data on a canvas
    visualizeFFT(canvas) {
        const ctx = canvas.getContext('2d');
        const draw = () => {
            const data = this.getFFTData();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            data.forEach((value, index) => {
                const x = index * (canvas.width / data.length);
                const y = canvas.height - (value * canvas.height);
                ctx.fillRect(x, y, 1, canvas.height - y);
            });
            
            requestAnimationFrame(draw); // Continuously update the visualization
        };
        
        draw(); // Start the drawing loop
    }

    // Adjust volume
    setVolume(bufferIndex, volumeLevel) {
        if (this.sourceGains[bufferIndex]) {
            this.sourceGains[bufferIndex].gain.setValueAtTime(volumeLevel, this.ctx.currentTime);
        }
    }

    // Panning control (stereo balance)
    setPanning(bufferIndex, panValue) {
        const panNode = this.ctx.createStereoPanner();
        panNode.pan.setValueAtTime(panValue, this.ctx.currentTime); // panValue between -1 (left) and 1 (right)

        if (this.sourceList[bufferIndex]) {
            this.sourceList[bufferIndex].disconnect(this.gainNode);
            this.sourceList[bufferIndex].connect(panNode);
            panNode.connect(this.gainNode);
        }
    }

    // Trigger a custom event when a frequency crosses a threshold
    triggerOnFrequencyCross(frequency, threshold, callback) {
        const checkFrequency = () => {
            const data = this.getFFTData();
            const index = Math.round(frequency / (this.ctx.sampleRate / 2) * data.length);
            if (data[index] > threshold) {
                callback(); // Call the callback function
            }
            requestAnimationFrame(checkFrequency); // Continue checking
        };

        checkFrequency(); // Start checking the frequency
    }


    // Record audio or video using MediaRecorder and save it if required
    record(name = new Date().toISOString(), args = {audio: true, video: false}, type = null, streamElement = null, save = false, onBegin = () => {}) {
        let supported = null;
        let ext = null;
        let types = type || [
            'video/webm',
            'video/webm;codecs=vp8',
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8.0',
            'video/webm;codecs=vp9.0',
            'video/webm;codecs=h264',
            'video/webm;codecs=H264',
            'video/webm;codecs=avc1',
            'video/webm;codecs=vp8,opus',
            'video/WEBM;codecs=VP8,OPUS',
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,vp9,opus',
            'video/webm;codecs=h264,opus',
            'video/webm;codecs=h264,vp9,opus',
            'video/x-matroska;codecs=avc1',
            'audio/wav',
            'audio/mp3',
            'audio/webm',
            'audio/webm;codecs=opus',
            'audio/webm;codecs=pcm',
            'audio/ogg',
            'audio/x-matroska'
        ];

        for (let i = 0; i < types.length; i++) {
            if (MediaRecorder.isTypeSupported(types[i])) {
                supported = types[i];
                ext = this.getExtensionFromType(types[i]);  // Determine the appropriate file extension
                break;
            }
        }

        if (supported !== null) {
            navigator.mediaDevices.getUserMedia(args).then((recordingDevice) => {
                console.log("Media stream created.");
                
                if (supported.indexOf('audio') !== -1) {
                    let micSrc = this.ctx.createMediaStreamSource(recordingDevice);  // Create a source from the microphone
                    let micGain = this.ctx.createGain();  // Create a gain node for the microphone

                    this.sourceList.push(micSrc);  // Add the microphone source to the source list
                    this.sourceGains.push(micGain);  // Add the microphone gain node to the gain list

                    micSrc.onended = () => {
                        this.cleanupSource(micSrc, micGain);  // Clean up when the microphone source ends
                    };

                    micSrc.connect(micGain);  // Connect the microphone source to the gain node
                    micGain.connect(this.analyserNode);  // Connect the gain node to the analyser
                }

                onBegin();  // Callback to indicate recording has started

                if (streamElement !== null) {
                    streamElement.srcObject = recordingDevice;  // Attach the recording to a media element
                }  

                if (save === true) {
                    this.recorder = new MediaRecorder(recordingDevice);

                    this.recorder.onstop = (e) => {
                        console.log("Media recorded, saving...");

                        let blob = new Blob(this.recordedData, {
                            type: supported
                        });

                        let url = URL.createObjectURL(blob);
                        let a = document.createElement("a");
                        document.body.appendChild(a);
                        a.style = "display: none";
                        a.href = url;
                        a.download = name + ext;  // Use the appropriate file extension
                        a.click();
                        window.URL.revokeObjectURL(url);
                    };
                    
                    this.recorder.ondataavailable = (e) => {
                        this.recordedData.push(e.data);  // Store recorded data as it becomes available
                    };

                    this.recorder.start();  // Start recording
                }

            }).catch((err) => console.log(err));

            return this.sourceList.length;  // Return the number of sources
        } else {
            alert("Cannot record! Check function call settings, ensure browser is compatible."); 
            return undefined; 
        } 
    }

    // Determine the appropriate file extension based on the MIME type
    getExtensionFromType(type) {
        if (type.indexOf('webm') !== -1) return '.webm';
        if (type.indexOf('ogg') !== -1) return '.ogg';
        if (type.indexOf('mp3') !== -1) return '.mp3';
        if (type.indexOf('wav') !== -1) return '.wav';
        if (type.indexOf('x-matroska') !== -1) return '.mkv';
        return '';
    }
    
    // Clean up by disconnecting and removing a source and its gain node
    cleanupSource(source, gain) {
        source.disconnect();
        gain.disconnect();
        this.sourceList = this.sourceList.filter(s => s !== source);
        this.sourceGains = this.sourceGains.filter(g => g !== gain);
    }
    
    // Replay a recorded media stream
    replayRecording(streamElement) {
        if (this.recordedData.length > 1) {
            this.buffer = new Blob(this.recordedData);
            streamElement.src = window.URL.createObjectURL(this.buffer);
        }
    }
}




// Parse Audio file buffers
export class BufferLoader {
    constructor(SoundJSInstance, urlList, callback, onReady = (sourceListIdx) => {}, onBeginDecoding = () => {}) {
        this.audio = SoundJSInstance;
        this.ctx = this.audio.ctx;
        this.urlList = urlList;
        this.onload = callback;
        this.bufferList = [];
        this.loadCount = 0;
        this.onBeginDecoding = onBeginDecoding;
        this.onReady = onReady;
    }

    loadBuffer(url = '', index, canAddFile = false, crossOrigin=true) {
        let request = new XMLHttpRequest();
        //if(crossOrigin) request.setRequestHeader('Access-Control-Allow-Origin','*');
    
        request.responseType = "arraybuffer";
        let responseBuf = null;

        if (url.length > 1) {
            request.open("GET", url, true);
            request.onreadystatechange = () => {
                if (request.readyState === 4 && (request.status === 200 || request.status === 0)) {
                    responseBuf = request.response;
                }
            };

            request.onload = () => {
                this.onBeginDecoding();
                this.ctx.decodeAudioData(responseBuf, (buffer) => {
                    if (!buffer) {
                        alert('Error decoding file data: ' + url);
                        return;
                    }
                    this.bufferList[index] = buffer;
                    if (++this.loadCount === this.urlList.length) {
                        this.onload(this.bufferList);
                    }
                    this.onReady(this.audio.sourceList.length - 1);
                }, (error) => {
                    console.error('decodeAudioData error: ' + error + ", from url: " + url);
                });
            };

            request.onerror = function() {
                alert('BufferLoader: XHR error');
            };

            request.send();
        } else if (canAddFile) {
            let fr = new FileReader();
            fr.onload = (e) => {
                let fileResult = e.target.result;
                this.onBeginDecoding();
                this.ctx.decodeAudioData(fileResult, (buffer) => {
                    if (!buffer) {
                        alert('Error decoding file data');
                        return;
                    }
                    this.bufferList[index] = buffer;
                    if (++this.loadCount === this.urlList.length) {
                        this.onload(this.bufferList);
                    }
                    this.onReady(this.audio.sourceList.length - 1);
                }, (error) => {
                    console.error('decodeAudioData error: ', error);
                });
            };

            fr.onerror = (e) => {
                console.log(e);
            };

            let input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;

            input.onchange = e => {
                fr.readAsArrayBuffer(e.target.files[0]);
                input.value = '';
            };
            input.click();
        }
    }

    load(canAddFile = true) {
        for (let i = 0; i < this.urlList.length; ++i) {
            this.loadBuffer(this.urlList[i], i, canAddFile);
        }
    }
}