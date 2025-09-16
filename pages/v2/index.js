import * as THREE from "three";
import { useEffect, useRef } from "react";
import Image from "next/image";
import starBg from "../../public/images/starBg.png";

export default function V2() {
    const canvasRef = useRef(null);

    useEffect(() => {
        // ——— scene, camera, renderer, controls ———
        const scene = new THREE.Scene();
        const sizes = { width: window.innerWidth, height: window.innerHeight };
        const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
        camera.position.z = 5;
        scene.add(camera);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        // renderer.setClearColor(0x000000, 0);
        renderer.transparent = true;
        renderer.alpha = 0;

        const textureLoader = new THREE.TextureLoader();

        // EARTH
        // const earthTexture = textureLoader.load("/textures/earthTexture.jpg");
        // const earthTexture = textureLoader.load("/textures/earthMapDark.png");
        // const earthTexture = textureLoader.load("/textures/earthMapDark.webp");
        // const earthTexture = textureLoader.load("/textures/earthGrayscaleTx.png");
        // const earthTexture = textureLoader.load("/textures/EquirectangularProjection.svg");
        // const earthTexture = textureLoader.load("/textures/NewEqPro.svg");
        // const earthTexture = textureLoader.load("/textures/earthGreenWhite.png");
        // const earthTexture = textureLoader.load("/textures/Mapearth.png");
        // const earthTexture = textureLoader.load("/textures/dottedMap.jpg");
        const earthTexture = textureLoader.load("/textures/hexPattern.png");

        const earthRadius = 1.7;
        const earthGeometry = new THREE.SphereGeometry(earthRadius, 32, 32);
        const earthMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: earthTexture,
            // metalness: 0.6,
            // roughness: 0.6,
            alphaMap: earthTexture, // Use the texture for transparency
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide,
        });
        // earthMaterial.transparent = false;
        // earthMaterial.opacity = 1;
        // earthMaterial.alphaTest = 0;
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        scene.add(earth);






        // --- INNER HAZE CIRCLE ---
// This circle sits inside the globe to give it a sense of volume.
const hazeGeometry = new THREE.CircleGeometry(earthRadius*1.04, 64); // Same radius as Earth

const hazeMaterial = new THREE.MeshBasicMaterial({
    color: 0x212121, // Black color to create a dimming effect
    transparent: true,
    opacity: 0.2, // Low opacity for a subtle haze
    depthWrite: false, // Prevents depth conflicts with other transparent objects
});

const hazeCircle = new THREE.Mesh(hazeGeometry, hazeMaterial);







        // ----- HALO ------
        const haloWidth = earthRadius * 0.025,
            haloRadius = earthRadius * 1.15;
        const haloGeometry = new THREE.RingGeometry(haloRadius, haloRadius + haloWidth, 128);

        const darkColor = new THREE.Color("#241D0F");
        const lightColor = new THREE.Color("#FFFFFF");

        const vertexCount = haloGeometry.attributes.position.count;
        const positions = haloGeometry.attributes.position.array;
        const colors = new Float32Array(vertexCount * 3); // RGB

        const Q1_END = Math.PI / 2; // 90 degrees
        const Q2_END = Math.PI; // 180 degrees
        const Q3_END = (3 * Math.PI) / 2; // 270 degrees

        for (let i = 0; i < vertexCount; i++) {
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const currentColor = new THREE.Color();

            let angle = Math.atan2(y, x);
            if (angle < 0) {
                angle += 2 * Math.PI; // Normalize angle to be from 0 to 2*PI
            }

            if (angle <= Q1_END) {
                // Quadrant 1: Solid dark color
                currentColor.copy(darkColor);
            } else if (angle <= Q2_END) {
                // Quadrant 2: Gradient from dark to light
                const factor = (angle - Q1_END) / (Math.PI / 2);
                currentColor.copy(darkColor).lerp(lightColor, factor);
            } else if (angle <= Q3_END) {
                // Quadrant 3: Solid light color
                currentColor.copy(lightColor);
            } else {
                // Quadrant 4: Gradient from light back to dark
                const factor = (angle - Q3_END) / (Math.PI / 2);
                currentColor.copy(lightColor).lerp(darkColor, factor);
            }

            colors[i * 3] = currentColor.r;
            colors[i * 3 + 1] = currentColor.g;
            colors[i * 3 + 2] = currentColor.b;
        }

        haloGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const haloMaterial = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            depthWrite: false,
        });

        const halo = new THREE.Mesh(haloGeometry, haloMaterial);
        scene.add(halo);

        // --- BOUNDARY RING (Solid White) ---
        const boundaryWidth = earthRadius * 0.002,
            boundaryRadius = earthRadius * 1.08;
        const boundaryGeometry = new THREE.RingGeometry(
            boundaryRadius,
            boundaryRadius + boundaryWidth,
            128
        );
        const boundaryMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff, // Solid white color
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
        });

        const boundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
        scene.add(boundary);

        const earthGroup = new THREE.Group();
        earthGroup.add(earth, hazeCircle);
        scene.add(earthGroup);

        const onResize = () => {
            sizes.width = window.innerWidth;
            sizes.height = window.innerHeight;
            camera.aspect = sizes.width / sizes.height;
            camera.updateProjectionMatrix();
            renderer.setSize(sizes.width, sizes.height);
        };
        window.addEventListener("resize", onResize);

        // ——— render loop ———
        let frameId;
        const clock = new THREE.Clock();
        const tick = () => {
            const elapsed = clock.getElapsedTime();
            earthGroup.rotation.y = elapsed * 0.2;
            halo.lookAt(camera.position);
            halo.rotation.z = elapsed * 0.2;
            boundary.lookAt(camera.position);
            renderer.render(scene, camera);
            hazeCircle.lookAt(camera.position);
            frameId = requestAnimationFrame(tick);
        };
        tick();

        // ——— cleanup ———
        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener("resize", onResize);
            renderer.dispose();
            scene.traverse((obj) => {
                if (obj.isMesh || obj.isSprite) {
                    if (obj.geometry) obj.geometry.dispose();
                    if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
                    else if (obj.material) obj.material.dispose();
                }
            });
        };
    }, []);

    return (
        <div className="relative w-screen h-screen overflow-hidden ">
            <Image src={starBg} className="object-cover w-full h-full z-10" fill alt="bg-image" />
            <div className="z-20 absolute top-0 left-0 h-full w-full bg-gradient-to-tl from-[#ED9C0022] to-transparent"></div>
            <div className="relative flex flex-col z-40 text-[#FFFFFF] w-full p-[6vw] gap-[1vw]">
                <div className="text-[4.5vw] font-medium">Your Success Story Starts Here</div>
                <div className="text-[2.5vw]">
                    Get expert guidance to achieve admits you once only dreamed of
                </div>
                <div className="flex gap-[0.9vw] h-[1vw] mt-[1.5vw]">
                    <div className="w-[4vw] bg-white rounded-full"></div>
                    <div className="w-[1.2vw] bg-white/60 rounded-full"></div>
                    <div className="w-[1.2vw] bg-white/60 rounded-full"></div>
                </div>
            </div>
            <div className="overflow-none relative z-30 h-full w-full">
                <canvas
                    ref={canvasRef}
                    className="webgl z-30 absolute h-full w-full bottom-0 left-[-25%] p-5"
                />
            </div>
        </div>
    );
}
