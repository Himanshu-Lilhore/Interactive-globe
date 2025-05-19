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
            // alpha: true, // transparent background
        });
        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 5;

        scene.add(new THREE.HemisphereLight(0xffffff, 0xaaaaaa, 0.5));
        const light = new THREE.PointLight(0xffffff, 100, 300);
        light.position.set(10, 10, 10);
        scene.add(light);

        // ——— load your Earth model ———
        const loader = new GLTFLoader();
        let modelRoot = new THREE.Group(); // placeholder pivot
        scene.add(modelRoot);

        loader.load(
            "/models/Earth.glb",
            (gltf) => {
                // pull out the loaded scene
                const earth = gltf.scene;

                // Center pivot: compute bounding box center and recast earth's position
                const box = new THREE.Box3().setFromObject(earth);
                const center = box.getCenter(new THREE.Vector3());
                earth.position.sub(center); // move geometry so its center is at 0,0,0

                // add earth into our pivot-group
                modelRoot.add(earth);

                // scale & reposition the pivot-group if desired
                modelRoot.scale.set(5, 5, 5);
                modelRoot.position.set(0, -0.5, 0);

                // make controls rotate around the pivot
                controls.target.copy(modelRoot.position);
                controls.update();

                // optional: intro tween on the earth itself
                gsap.fromTo(
                    modelRoot.scale,
                    { x: 0, y: 0, z: 0 },
                    { x: 5, y: 5, z: 5, duration: 1, ease: "power2.out" }
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
                if (obj.isMesh) {
                    obj.geometry.dispose();
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach((m) => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            });
        };
    }, []);

    return <canvas ref={canvasRef} className="webgl" />;
}
