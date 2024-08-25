// Import necessary dependencies
import * as THREE from 'three'
import { THREEShaderHelper } from '../THREEShaderHelper'; // Assuming this is the file where your shader helper class is defined
import { Sounds } from '../sound'; // Assuming this is where your Sounds class is defined

// Function to run the default shader and play a sound
export function main() {
    // Create a canvas element and append it to the body
    // Create a button to play the sound
    const button = document.createElement('button');
    button.innerText = 'Play Sound';
    document.body.appendChild(button);
    
    const canvas = document.createElement('canvas');
    canvas.style.width = '512px';
    canvas.style.height = '512px';
    document.body.appendChild(canvas);

    const sounds = new Sounds();

    //setTimeout(()=>{
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Instantiate the THREEShaderHelper with the canvas
    const shaderHelper = new THREEShaderHelper(
        canvas, 
        sounds
    );
    
    // Set up the default renderer and start the animation loop
    shaderHelper.createRenderer();
    // shaderHelper.generateGUI();
    // Optional: Set a background color for the renderer to see if it updates
    shaderHelper.three.renderer.setClearColor(0x000000, 1);
    //}, 300);


    // Instantiate the Sounds class when the button is clicked and play a default sound
    button.addEventListener('click', () => {
        const soundURL = './sample.mp3'; // Default sound URL
        sounds.addSounds([soundURL], (sourceListIdx) => {
            sounds.playSound(sourceListIdx);
        });
    });
}

main();