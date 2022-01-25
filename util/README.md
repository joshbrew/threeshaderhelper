## SoundJS usage

This is just a boneheaded utility for loading and playing audio buffers. You can load as many as you want from local files or urls, or create oscillators. 

```js

import {SoundJS} from './Sound.js'

let audio = new SoundJS();

function onReady(sourceidx,buffer) {
    console.log('Audio ready! Play from index:', sourceidx, buffer);

    audio.playSound(sourceidx, undefined, true); //set the audio to loop

    setTimeout(()=>{
        console.log(audio.getAnalyzerData())
    },1000);
};

function onBeginDecoding() {
    console.log('Audio found! Loading...')
}

audio.decodeLocalAudioFile(
    onReady,
    onBeginDecoding
);


```

There are basic recording features, basic oscillator macros, etc.

Use `audio.addSounds()` to add from a string url or array of urls instead of locally.
