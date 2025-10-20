// import './style.css'
import * as THREE from "https://cdn.skypack.dev/three@0.132.2";

import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js";


// import { Geometry, TetrahedronGeometry } from 'three'

/**
 * Base
 */
// Debug

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

//galaxy
const parameters = {}
parameters.count = 100000;
parameters.size = 0.01;
parameters.radius = 2.15; 
parameters.branches = 3; 
parameters.spin = 3;
parameters.randomness = 5;
parameters.randomnessPower = 4;
parameters.insideColor = '#ff6030';
parameters.outsideColor = '#0949f0';

const IMAGE_SIZE_FACTOR = 1.0;

let material = null; 
let geometry = null; 
let points = null; 

const generateGalaxy = () => {
    
if(points !== null){
    geometry.dispose();
    material.dispose();
    scene.remove(points);
}

function makeHeartTexture (size = 128) {
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')
  
    ctx.clearRect(0, 0, size, size)
  
    // Đặt gốc ở giữa canvas để dễ scale/định hình, có lề đủ để không bị cắt
    ctx.save()
    ctx.translate(size / 2, size / 2)
  
    // Scale để tim nằm gọn trong canvas, chừa mép ~6–8px
    const s = size / 64 // 64 đơn vị "logic" ~ 1/2 bề rộng canvas
    ctx.scale(s, s)
  
    // Path trái tim có chóp nhọn tại (0, 40)
    ctx.beginPath()
    ctx.moveTo(0, 30)                            // chóp nhọn
    ctx.bezierCurveTo(-35, 15, -32, -20, 0, -8)  // nửa trái
    ctx.bezierCurveTo(32, -20, 35, 15, 0, 40)    // nửa phải
    ctx.closePath()
  
    // Màu trắng để còn "nhuộm" bởi vertexColors
    ctx.fillStyle = 'white'
    ctx.fill()
  
    ctx.restore()
  
    const tex = new THREE.CanvasTexture(c)
    tex.generateMipmaps = false
    tex.minFilter = THREE.LinearFilter  
    tex.magFilter = THREE.LinearFilter
    tex.premultiplyAlpha = true // giúp mép mượt hơn khi blend
    return tex
  }
  // Tạo 1 lần, bên ngoài generateGalaxy()
  const heartTex = makeHeartTexture()
  

  
material = new THREE.PointsMaterial({
    size: parameters.size,          // có thể tăng 0.02–0.05 để thấy rõ
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    map: heartTex,
    transparent: true,
    alphaTest: 0.005                // hạ thấp để giữ lại pixel mảnh ở chóp
  })

    geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(parameters.count * 3);

    const colors = new Float32Array(parameters.count * 3);
    const colorInside = new THREE.Color(parameters.insideColor);
    const colorOutside = new THREE.Color(parameters.outsideColor);


    for(let i=0; i<parameters.count; i++){
        const i3 = i*3;
        const radius = Math.pow(Math.random()*parameters.randomness, Math.random()*parameters.radius);
        const spinAngle = radius*parameters.spin;
        const branchAngle = ((i%parameters.branches)/parameters.branches)*Math.PI*2;
        

        const negPos = [1,-1];
        const randomX = Math.pow(Math.random(), parameters.randomnessPower)*negPos[Math.floor(Math.random() * negPos.length)];
        const randomY = Math.pow(Math.random(), parameters.randomnessPower)*negPos[Math.floor(Math.random() * negPos.length)];
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower)*negPos[Math.floor(Math.random() * negPos.length)];

        positions[i3] = Math.cos(branchAngle + spinAngle)*(radius) + randomX;
        positions[i3+1] = randomY;
        positions[i3+2] = Math.sin(branchAngle + spinAngle)*(radius) + randomZ;

        const mixedColor = colorInside.clone();
        mixedColor.lerp(colorOutside, Math.random()*radius/parameters.radius);

        colors[i3] = mixedColor.r;
        colors[i3+1] = mixedColor.g;
        colors[i3+2] = mixedColor.b;
        
        
    }
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));

    points = new THREE.Points(geometry, material);
    scene.add(points);

}
generateGalaxy();

/**
 * Test cube
 */
/*
const imageSprites = [];

function addImageSprite(url, {
  position = new THREE.Vector3(0, 0, 0),
  size = parameters.size * IMAGE_SIZE_FACTOR,   // bề ngang ≈ trái tim
  renderOrder = 3,
  opacity = 1.0,
  depthTest = false
} = {}) {
  const tex = new THREE.TextureLoader().load(url);
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.encoding  = THREE.sRGBEncoding;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity,
    depthTest,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(mat);
  sprite.position.copy(position);
  sprite.scale.set(size, size, 1); // vuông: ngang = dọc = size
  sprite.renderOrder = renderOrder;
  scene.add(sprite);
  imageSprites.push(sprite);
  return sprite;
}

// Rải nhiều ảnh hơn (ví dụ 80 cái), kích thước ≈ trái tim (có jitter nhỏ)
const imageUrls = [
  'photo1.jpg',
  'photo2.jpg',
  'photo3.jpg'
];
function scatterSprites(urls, n = 500) {
  for (let i = 0; i < n; i++) {
    const url = urls[i % urls.length];

    // vị trí ngẫu nhiên trong bán kính ngân hà (mỏng theo y)
    const r = Math.random() * parameters.radius * 1.2;
    const theta = Math.random() * Math.PI * 2;
    const x = Math.cos(theta) * r;
    const y = (Math.random() - 0.5) * 0.6;
    const z = Math.sin(theta) * r;

    // kích thước = size tim ±15% cho tự nhiên
    const jitter = 0.85 + Math.random() * 0.3; // 0.85–1.15
    const spriteSize = parameters.size * IMAGE_SIZE_FACTOR * jitter;

    addImageSprite(url, {
      position: new THREE.Vector3(x, y, z),
      size: spriteSize,
      renderOrder: 3,
      depthTest: false
    });
  }
}
scatterSprites(imageUrls, 500);

// (tuỳ chọn) nếu sau này bạn đổi parameters.size và muốn ảnh tự co theo:
function rescaleAllImageSprites() {
  const base = parameters.size * IMAGE_SIZE_FACTOR;
  for (const s of imageSprites) {
    // giữ tỉ lệ vuông; nếu muốn giữ jitter, có thể lưu jitter riêng khi tạo
    const cur = Math.max(s.scale.x, s.scale.y);
    const ratio = cur / base; // tỉ lệ hiện tại đối với base cũ
    s.scale.set(base * ratio, base * ratio, 1);
  }
}
**/

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new 
THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 3
camera.position.y = 3
camera.position.z = 3
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    camera.position.x = Math.cos(elapsedTime*0.05);
    camera.position.z = Math.sin(elapsedTime*0.05);
    camera.lookAt(0,0,0);

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()