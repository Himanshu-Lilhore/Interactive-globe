"use client";
import * as THREE from "three";
import { useEffect, useRef } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";

export default function Home() {
    const canvasRef = useRef(null);

    useEffect(() => {
        // ——— scene, camera, renderer, controls ———
        const scene = new THREE.Scene();
        const sizes = { width: window.innerWidth, height: window.innerHeight };
        const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
        camera.position.z = 20;
        scene.add(camera);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true, // uncomment if you want transparent BG
        });
        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0)

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 5;
        controls.enablePan = false;
        controls.enableZoom = false;

        scene.add(new THREE.HemisphereLight(0xffffff, 0xaaaaaa, 0.5));
        const light = new THREE.PointLight(0xffffff, 100, 300);
        light.position.set(10, 10, 10);
        scene.add(light);

        // ——— load your Earth model ———
        const loader = new GLTFLoader();
        const modelRoot = new THREE.Group(); // placeholder pivot
        scene.add(modelRoot);

        loader.load(
            "/models/Earth.glb",
            (gltf) => {
                // pull out the loaded scene
                const earth = gltf.scene;

                earth.traverse((obj) => {
                    if (obj.isMesh && obj.material) {
                        // if there's an array of materials:
                        if (Array.isArray(obj.material)) {
                            obj.material.forEach((mat) => {
                                mat.transparent = false;
                                mat.opacity = 1;
                                // if the model uses alphaTest, you can disable it:
                                mat.alphaTest = 0;
                            });
                        } else {
                            obj.material.transparent = false;
                            obj.material.opacity = 1;
                            obj.material.alphaTest = 0;
                        }
                    }
                });

                // Center pivot
                const box = new THREE.Box3().setFromObject(earth);
                const center = box.getCenter(new THREE.Vector3());
                earth.position.sub(center);

                modelRoot.add(earth);
                modelRoot.scale.set(5, 5, 5);
                modelRoot.position.set(0, -0.5, 0);
                controls.target.copy(modelRoot.position);
                controls.update();

                // intro tween
                gsap.fromTo(
                    modelRoot.scale,
                    { x: 0, y: 0, z: 0 },
                    { x: 5, y: 5, z: 5, duration: 1, ease: "power2.out" }
                );

                // ——— radial‑gradient circle as a Sprite ———
                // create a canvas and draw white→transparent radial gradient
                const size = 512;
                const gradCanvas = document.createElement("canvas");
                gradCanvas.width = gradCanvas.height = size;
                const ctx = gradCanvas.getContext("2d");
                const grad = ctx.createRadialGradient(
                    size / 2,
                    size / 2,
                    0,
                    size / 2,
                    size / 2,
                    size / 2
                );
                grad.addColorStop(0, "rgba(255,255,255,1)");
                grad.addColorStop(1, "rgba(255,255,255,0)");
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, size, size);

                // make a texture from it
                const gradientTex = new THREE.CanvasTexture(gradCanvas);

                // SpriteMaterial with additive blending
                const spriteMat = new THREE.SpriteMaterial({
                    map: gradientTex,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    opacity: 0.25, // adjust as needed
                });

                // Sprite that always faces camera
                const sprite = new THREE.Sprite(spriteMat);
                // scale it so it surrounds your earth (5 units → 10 world units)
                const worldSize = 8;
                sprite.scale.set(worldSize, worldSize, 1);
                sprite.position.copy(modelRoot.position);
                scene.add(sprite);
            },
            undefined,
            (err) => console.error("GLTF load error:", err)
        );

        // ——— resize handler ———
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
        const tick = () => {
            controls.update();
            renderer.render(scene, camera);
            frameId = requestAnimationFrame(tick);
        };
        tick();

        // ——— cleanup ———
        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener("resize", onResize);
            controls.dispose();
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

    return <canvas ref={canvasRef} className="webgl" />;
}
