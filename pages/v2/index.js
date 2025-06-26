"use client";
import * as THREE from "three";
import { useEffect, useRef } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

function createArcTubeAndCurve({
    fromLat,
    fromLng,
    toLat,
    toLng,
    radius = 1.5,
    altitude = 0.4,
    segments = 100,
    tubeRadius = 0.03,
    tubeRadialSegments = 8,
    opacity = 1,
} = {}) {
    // — Lat/Lng → Vector3
    const angle1 = THREE.MathUtils.degToRad(fromLat);
    const angle2 = THREE.MathUtils.degToRad(fromLng - 180);
    const from = new THREE.Vector3(
        -radius * Math.cos(angle1) * Math.cos(angle2),
        radius * Math.sin(angle1),
        radius * Math.cos(angle1) * Math.sin(angle2)
    );

    const angle3 = THREE.MathUtils.degToRad(toLat);
    const angle4 = THREE.MathUtils.degToRad(toLng - 180);
    const to = new THREE.Vector3(
        -radius * Math.cos(angle3) * Math.cos(angle4),
        radius * Math.sin(angle3),
        radius * Math.cos(angle3) * Math.sin(angle4)
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
    // const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const color = new THREE.Color(0,0,0);
    const tubeMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
    const mesh = new THREE.Mesh(tubeGeo, tubeMat);

    return { mesh, curve, from, to };
}

export default function V2() {
    const canvasRef = useRef(null);

    const routes = [
        { fromLat: 37.7749, fromLng: -122.4194, toLat: 35.6895, toLng: 139.6917 }, // San Francisco → Tokyo
        { fromLat: 51.5074, fromLng: -0.1278, toLat: 40.7128, toLng: -74.006 }, // London → New York
        { fromLat: 48.8566, fromLng: 2.3522, toLat: -33.8688, toLng: 151.2093 }, // Paris → Sydney
        { fromLat: -22.9068, fromLng: -43.1729, toLat: -33.9249, toLng: 18.4241 }, // Rio de Janeiro → Cape Town
        { fromLat: 55.7558, fromLng: 37.6173, toLat: 39.9042, toLng: 116.4074 }, // Moscow → Beijing
        { fromLat: 30.0444, fromLng: 31.2357, toLat: -1.2921, toLng: 36.8219 }, // Cairo → Nairobi
        { fromLat: -33.4489, fromLng: -70.6693, toLat: -36.8485, toLng: 174.7633 }, // Santiago → Auckland
        { fromLat: 19.076, fromLng: 72.8777, toLat: 25.2048, toLng: 55.2708 }, // Mumbai → Dubai
        { fromLat: 43.6532, fromLng: -79.3832, toLat: 34.0522, toLng: -118.2437 }, // Toronto → Los Angeles
        { fromLat: -34.6037, fromLng: -58.3816, toLat: 40.4168, toLng: -3.7038 }, // Buenos Aires → Madrid
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
        // controls.enablePan = true;
        controls.enableZoom = true;

        const pointLight = new THREE.PointLight(0xffffff, 8, 100, 4);
        pointLight.position.set(2, 1, 1);
        const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.2)
        // scene.add(pointLightHelper)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        // scene.add(pointLight, ambientLight);

        const textureLoader = new THREE.TextureLoader();

        // EARTH
        // const earthTexture = textureLoader.load("/textures/earthTexture.jpg");
        // const earthTexture = textureLoader.load("/textures/earthMapDark.png");
        // const earthTexture = textureLoader.load("/textures/earthMapDark.webp");
        // const earthTexture = textureLoader.load("/textures/earthGrayscaleTx.png");
        // const earthTexture = textureLoader.load("/textures/EquirectangularProjection.svg");
        // const earthTexture = textureLoader.load("/textures/NewEqPro.svg");
        // const earthTexture = textureLoader.load("/textures/earthGreenWhite.png");
        const earthTexture = textureLoader.load("/textures/Mapearth.png");
        // const earthTexture = textureLoader.load("/textures/dottedMap.jpg");

        const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
        const earthMaterial = new THREE.MeshBasicMaterial({
            // color: 0x0000ff,
            map: earthTexture,
            metalness: 0.6,
            roughness: 0.6
        });
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        scene.add(earth);
        
        // MOON
        const moonTexture = textureLoader.load("/textures/moonEquirectangular.jpg")
        const moonGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const moonMaterial = new THREE.MeshStandardMaterial({
            map: moonTexture,
            metalness: 0.4,
            roughness: 0.7
        });
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.position.x = 5
        // scene.add(moon);

        const earthGroup = new THREE.Group()
        earthGroup.add(earth)
        scene.add(earthGroup)





        const anims = routes.map((route) => {
            const { mesh: arcMesh, curve, from, to } = createArcTubeAndCurve({
                ...route,
                radius: 1,
                altitude: 0.5,
                tubeRadius: 0.002,
            });
            scene.add(arcMesh);
            earthGroup.add(arcMesh)

            // FROM / TO circular markers
            const markMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const markGeo = new THREE.CircleGeometry(0.01, 16);
            const fromMarker = new THREE.Mesh(markGeo, markMat);
            fromMarker.position.copy(from);
            fromMarker.lookAt(from.clone().multiplyScalar(2));
            scene.add(fromMarker);
            const toMarker = new THREE.Mesh(markGeo, markMat);
            toMarker.position.copy(to);
            toMarker.lookAt(to.clone().multiplyScalar(2));
            scene.add(toMarker);
            earthGroup.add(fromMarker, toMarker)

            const geo = arcMesh.geometry;
            const total = geo.index.count;
            
            // reset drawRange
            geo.setDrawRange(0, 0);

            const startDelay = 1+ Math.random()*1;
            const cycleDuration = 0.9; // seconds for draw
            const wipeDuration = 0.4; // seconds for erase
            const holdDuration = 1+ Math.random()*1;

            return { geo, total, head: 0, tail: 0, startDelay, cycleDuration, wipeDuration, holdDuration };
        });


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
            
            anims.forEach((anim) => {
                const fullCycle = anim.cycleDuration + anim.holdDuration + anim.wipeDuration + anim.startDelay;
                const t = elapsed % fullCycle;
                if(t < anim.startDelay) {
                    anim.head = 0;
                    anim.tail = 0;
                }
                else if (t < anim.startDelay+anim.cycleDuration) {
                    anim.head = ((t-anim.startDelay) / anim.cycleDuration) * anim.total;
                    anim.tail = 0;
                }
                else if(t < anim.startDelay+anim.cycleDuration+anim.holdDuration) {
                    anim.head = anim.total;
                    anim.tail = 0;
                }
                else {
                    const tt = (t -anim.cycleDuration-anim.holdDuration-anim.startDelay) / anim.wipeDuration;
                    anim.head = anim.total;
                    anim.tail = tt * anim.total;
                }

                anim.geo.setDrawRange(Math.floor(anim.tail), Math.floor(anim.head - anim.tail));
            });


            earthGroup.rotation.y = elapsed/2
            moon.position.x = 6 * Math.sin(elapsed/2)
            moon.position.z = 6 * Math.cos(elapsed/2)
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
