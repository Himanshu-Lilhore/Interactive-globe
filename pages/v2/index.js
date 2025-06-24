"use client";
import * as THREE from "three";
import { useEffect, useRef } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";

function createArcTubeAndCurve({
    fromLat,
    fromLng,
    toLat,
    toLng,
    radius = 1,
    altitude = 0.2,
    segments = 100,
    tubeRadius = 0.005,
    tubeRadialSegments = 8,
    opacity = 0.8,
} = {}) {
    // — Lat/Lng → Vector3
    const φ1 = THREE.MathUtils.degToRad(fromLat);
    const θ1 = THREE.MathUtils.degToRad(fromLng - 180);
    const from = new THREE.Vector3(
        -radius * Math.cos(φ1) * Math.cos(θ1),
        radius * Math.sin(φ1),
        radius * Math.cos(φ1) * Math.sin(θ1)
    );

    const φ2 = THREE.MathUtils.degToRad(toLat);
    const θ2 = THREE.MathUtils.degToRad(toLng - 180);
    const to = new THREE.Vector3(
        -radius * Math.cos(φ2) * Math.cos(θ2),
        radius * Math.sin(φ2),
        radius * Math.cos(φ2) * Math.sin(θ2)
    );

    // — Control points lifted above the surface
    const mid1 = from
        .clone()
        .lerp(to, 0.25)
        .multiplyScalar(1 + altitude);
    const mid2 = from
        .clone()
        .lerp(to, 0.75)
        .multiplyScalar(1 + altitude);

    // — The bezier curve…
    const curve = new THREE.CubicBezierCurve3(from, mid1, mid2, to);

    // — Tube geometry around that curve
    const tubeGeo = new THREE.TubeGeometry(curve, segments, tubeRadius, tubeRadialSegments, false);

    // — Random color material
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const tubeMat = new THREE.MeshStandardMaterial({ color, transparent: true, opacity });
    const mesh = new THREE.Mesh(tubeGeo, tubeMat);

    return { mesh, curve };
}

export default function V2() {
    const canvasRef = useRef(null);

    const routes = [
        { fromLat: 37.7749, fromLng: -122.4194, toLat: 35.6895, toLng: 139.6917 }, // SF → Tokyo
        { fromLat: 51.5074, fromLng: -0.1278, toLat: 40.7128, toLng: -74.006 }, // London → NYC
    ];

    useEffect(() => {
        // ——— scene, camera, renderer, controls ———
        const scene = new THREE.Scene();
        const sizes = { width: window.innerWidth, height: window.innerHeight };
        const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
        camera.position.z = 4;
        scene.add(camera);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true, // uncomment if you want transparent BG
        });
        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        // controls.autoRotate = true;
        // controls.autoRotateSpeed = 5;
        controls.enablePan = true;
        controls.enableZoom = true;

        const pointLight = new THREE.PointLight(0xffffff, 5, 100, 1);
        pointLight.position.set(2, 2, 2);
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        scene.add(pointLight, ambientLight);

        const textureLoader = new THREE.TextureLoader();
        // const earthTexture = textureLoader.load("/textures/earthTexture.jpg");
        // const earthTexture = textureLoader.load("/textures/earthMapDark.png");
        // const earthTexture = textureLoader.load("/textures/earthMapDark.webp");
        // const earthTexture = textureLoader.load("/textures/earthGrayscaleTx.png");
        // const earthTexture = textureLoader.load("/textures/EquirectangularProjection.svg");
        const earthTexture = textureLoader.load("/textures/earthGreenWhite.png");

        const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
        const earthMaterial = new THREE.MeshStandardMaterial({
            // color: 0x0000ff,
            map: earthTexture,
        });
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        scene.add(earth);

        //--------------// ARC //--------------//
        // routes.forEach((route) => {
        //     // Building Arc
        //     const { mesh: arcMesh, curve } = createArcTubeAndCurve({
        //         ...route,
        //         radius: 1,
        //         altitude: 0.5,
        //         tubeRadius: 0.005,
        //     });
        //     scene.add(arcMesh);

        //     // Arc Animations
        //     const geo = arcMesh.geometry;
        //     const total = geo.index.count;

        //     const state = { head: 0, tail: 0 };

        //     const tl = gsap.timeline({
        //         repeat: -1,
        //         defaults: {
        //             ease: "none",
        //             immediateRender: false, // don’t apply start values prematurely
        //         },
        //     });
        //     // Phase A: draw in from 0→total
        //     tl.fromTo(
        //         state,
        //         { head: 0, tail: 0 },
        //         {
        //             head: total,
        //             duration: 2,
        //             onUpdate: () => {
        //                 geo.setDrawRange(
        //                     Math.floor(state.tail),
        //                     Math.floor(state.head - state.tail)
        //                 );
        //             },
        //         }
        //     );
        //     // Phase B: wipe out from front 0→total
        //     tl.to(state, {
        //         tail: total,
        //         duration: 2,
        //         onUpdate: () => {
        //             geo.setDrawRange(Math.floor(state.tail), Math.floor(state.head - state.tail));
        //         },
        //     });

        //     //--------------// DOTTED //--------------//

        //     // 3) Flying dot along the same curve
        //     // const dot = new THREE.Mesh(
        //     //   new THREE.SphereGeometry(0.01, 8, 8),
        //     //   new THREE.MeshBasicMaterial({ color: 0xffffff })
        //     // );
        //     // scene.add(dot);

        //     // const state = { t: 0 };
        //     // gsap.to(state, {
        //     //   t: 1,
        //     //   duration: 3,
        //     //   ease: "none",
        //     //   repeat: -1,
        //     //   onUpdate: () => {
        //     //     dot.position.copy(curve.getPoint(state.t));
        //     //   },
        //     // });
        // });

        const anims = routes.map((route) => {
            const { mesh: arcMesh, curve } = createArcTubeAndCurve({
                ...route,
                radius: 1,
                altitude: 0.5,
                tubeRadius: 0.005,
            });
            scene.add(arcMesh);

            const geo = arcMesh.geometry;
            const total = geo.index.count;

            // reset drawRange
            geo.setDrawRange(0, 0);

            return { geo, total, head: 0, tail: 0 };
        });

        const cycleDuration = 2; // seconds for draw
        const wipeDuration = 2; // seconds for erase
        const fullCycle = cycleDuration + wipeDuration;

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
        const clock = new THREE.Clock();
        const tick = () => {
            const elapsed = clock.getElapsedTime();
            const t = elapsed % fullCycle;

            anims.forEach((anim) => {
                // Phase A: 0 → cycleDuration
                if (t < cycleDuration) {
                    anim.head = (t / cycleDuration) * anim.total;
                    anim.tail = 0;
                }
                // Phase B: cycleDuration → fullCycle
                else {
                    const tt = (t - cycleDuration) / wipeDuration;
                    anim.head = anim.total;
                    anim.tail = tt * anim.total;
                }

                // apply drawRange
                anim.geo.setDrawRange(Math.floor(anim.tail), Math.floor(anim.head - anim.tail));
            });
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
