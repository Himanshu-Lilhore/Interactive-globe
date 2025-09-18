import * as THREE from "three";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function GlobeV3() {
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
        const earthTexture = textureLoader.load("/textures/smallDotMapBlack.png");

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
        const hazeGeometry = new THREE.CircleGeometry(earthRadius * 1.06, 64);

        const hazeMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, // Black color to create a dimming effect
            transparent: true,
            opacity: 0.15, // Low opacity for a subtle haze
            depthWrite: false, // Prevents depth conflicts with other transparent objects
        });

        const hazeCircle = new THREE.Mesh(hazeGeometry, hazeMaterial);

        // ----- HALO ------
        const haloWidth = earthRadius * 0.01,
            haloRadius = earthRadius * 1.13;
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
        earthGroup.add(earth);
        earthGroup.add(hazeCircle);

        const ringsGroup = new THREE.Group();
        ringsGroup.add(halo);
        ringsGroup.add(boundary);

        const masterGroup = new THREE.Group();
        masterGroup.add(earthGroup);
        masterGroup.add(ringsGroup);
        scene.add(masterGroup);

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
        let iniVal = 0;
        const tick = () => {
            const elapsed = clock.getElapsedTime();

            earthGroup.rotation.y = elapsed * 0.15 - 2;
            hazeCircle.lookAt(camera.position);

            halo.rotation.z = elapsed * 0.2 - 2;
            masterGroup.lookAt(camera.position);

            renderer.render(scene, camera);
            frameId = requestAnimationFrame(tick);
        };
        tick();

        // // ------ gsap animation -------
        // masterGroup.scale.set(0.8, 0.8, 0.8);
        // hazeMaterial.opacity = 0;
        // haloMaterial.opacity = 0;
        // boundaryMaterial.opacity = 0;

        // const tl = gsap.timeline();

        // // Animate the group's scale to 1
        // tl.to(masterGroup.scale, {
        //     duration: 3, // Animation duration in seconds
        //     x: 1,
        //     y: 1,
        //     z: 1,
        //     ease: "power3.out", // A nice easing function for a smooth effect
        // });

        // tl.to(
        //     [earthMaterial, haloMaterial, boundaryMaterial, hazeMaterial],
        //     {
        //         duration: 3,
        //         opacity: (i) => {
        //             // Return the final opacity for each material in the array
        //             if (i === 0) return 1; // earthMaterial
        //             if (i === 1) return 0.8; // haloMaterial
        //             if (i === 2) return 1; // boundaryMaterial
        //             return 0.2; // hazeMaterial
        //         },
        //         ease: "power2.out",
        //     },
        //     "<"
        // );

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

    return <canvas ref={canvasRef} className="webgl" />;
}
