"use client";
import * as THREE from "three";
import { useEffect, useRef } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";

export default function Home() {
    const canvasRef = useRef(null);

    useEffect(() => {
        // ——— scene, camera, renderer, controls (same as you had) ———
        const scene = new THREE.Scene();
        const sizes = { width: window.innerWidth, height: window.innerHeight };
        const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
        camera.position.z = 20;
        scene.add(camera);

        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 5;

        scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444, 1.5));

        // ——— load your Blender model ———
        const loader = new GLTFLoader();
        let modelRoot = null;
        loader.load(
            "/models/Earth.glb", // file in public/models
            (gltf) => {
                modelRoot = gltf.scene;
                // optional: tweak scale/position/rotation
                modelRoot.scale.set(5, 5, 5);
                modelRoot.position.set(0, -0.5, 0);
                scene.add(modelRoot);

                // optional: intro tween
                gsap.fromTo(
                    modelRoot.scale,
                    { x: 0, y: 0, z: 0 },
                    { x: 5, y: 5, z: 5, duration: 1 }
                );
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

        // ——— animation loop ———
        let frameId;
        const tick = () => {
            controls.update();
            renderer.render(scene, camera);
            frameId = requestAnimationFrame(tick);
        };
        tick();

        // ——— intro animation ———
        // gsap.fromTo(sphereMesh.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, duration: 1 });

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener("resize", onResize);
            controls.dispose();
            renderer.dispose();
            if (modelRoot) {
                modelRoot.traverse((obj) => {
                    if (obj.isMesh) {
                        obj.geometry.dispose();
                        if (Array.isArray(obj.material)) {
                            obj.material.forEach((m) => m.dispose());
                        } else {
                            obj.material.dispose();
                        }
                    }
                });
            }
        };
    }, []);

    return <canvas ref={canvasRef} className="webgl" />;
}
