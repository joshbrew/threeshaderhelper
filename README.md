## THREEShaderHelper

This is a fairly straightforward utility for ThreeJS to create shader materials and apply any shaders from text with the ability to push uniform updates. It replicates a lot of functionality from ShaderToy, but we extended it to let us use arbitrary uniforms which can be generated from the shader text itself. We use it for biofeedback. It also includes its own audio decoder to get audio FFT data into the shader.

For now, see [Sensorium](https://app.brainsatplay.com#Sensorium) in Brains@Play for a full demonstration, though it is using a raw version of this library baked right into the applet. Will create a standalone demo later.


More docs incoming for this powerful little tool, otherwise give the code a try and see the test function createRenderer which includes camera, GUI & orbit controls

From [Sensorium](https://app.brainsatplay.com#Sensorium) biofeedback demo.
![Capture](./Capture.png)

Class methods
```js


//Static functions
generateShaderGeometry(type,width,height,fragment,vertex);
generateShaderMaterial(fragment,vertex);
createMeshGeometry(type,width,height);
downsample(array,fitCount,scalar);
upsample(array,fitCount,scalar);

//also this.defaultVertex and this.defaultFragment have default shaders, the defaultFragment is fine to use universally until you want to do more optimization

//Class instance methods
addUniformSetting(name,defaultValue,type,callback,min,max,step);
addNewShaderMesh(fragment,vertex,type,width,height,uniformNaes,name,author);
setUniforms(uniforms);
setMeshGeometry(matidx,type);
setMeshRotation(matidx,anglex,angley,anglez);
resetMaterialUniforms(material,uniformNames);
updateMaterialUniforms(material,uniformNames,meshType);
updateAllMaterialUniforms();
setShaderFromText(matidx,fragmentShaderText,vertexShaderText,name,author);
swapShader(matidx,onchange);
setShader(matidx,name,vertexShader,fragmentShader,uniformNames,author);
setChannelTexture(channelNum,imageOrVideo,material);

//frontend stuff
generateGUI(uniformNames,material);
createRenderer(canvas);
destroyRenderer();


```
