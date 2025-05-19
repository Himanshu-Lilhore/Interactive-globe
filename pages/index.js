"use client";
import * as THREE from "three";
import { useEffect, useRef } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";

export default function Home() {
    const canvasRef = useRef(null);

    useEffect(() => {
        // scene
        const scene = new THREE.Scene();

        // geometry
        const mySphere = new THREE.SphereGeometry(3, 64, 64);

        // material
        const material = new THREE.MeshStandardMaterial({
            color: "#39FF14",
        });

        //mesh
        const mesh = new THREE.Mesh(mySphere, material);
        scene.add(mesh);

        // light
        const light = new THREE.PointLight(0xffffff, 100, 800);
        light.position.set(10, 10, 10);
        scene.add(light);

        scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444, 0.5));


        // ambient fill
        // const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        // scene.add(ambient);

        // sizes
        const sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
        };

        // camera
        const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
        camera.position.z = 20;
        scene.add(camera);

        // renderer
        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
        renderer.setSize(sizes.width, sizes.height);
        renderer.render(scene, camera);
        renderer.setPixelRatio(2); // more smooth sphere

        window.addEventListener("resize", () => {
            sizes.width = window.innerWidth;
            sizes.height = window.innerHeight;
            camera.aspect = sizes.width / sizes.height;
            camera.updateProjectionMatrix();
            renderer.setSize(sizes.width, sizes.height);
        });

        // controls
        const controls = new OrbitControls(camera, canvasRef.current);
        controls.enableDamping = true;
        // controls.enablePan = false;
        // controls.enableZoom = false;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 5;

        let frameId;
        const loop = () => {
            controls.update();
            renderer.render(scene, camera);
            frameId = requestAnimationFrame(loop);
        };
        loop();

        // gsap timeline
        const t1 = gsap.timeline({ defaults: { duration: 1 } });
        t1.fromTo(mesh.scale, { z: 0, x: 0, y: 0 }, { z: 1, x: 1, y: 1 });

        return () => {
          cancelAnimationFrame(frameId);
          // window.removeEventListener("resize", onResize)
          controls.dispose();
          mesh.geometry.dispose();
          mesh.geometry.dispose();
          mesh.material.dispose();
          renderer.dispose();
        }
    }, []);

    return <canvas ref={canvasRef} className="webgl" />;
}
