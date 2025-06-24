"use client";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import React, { useRef, useEffect, useState } from "react";
import {
    WebGLRenderer,
    Scene,
    PerspectiveCamera,
    SphereGeometry,
    MeshBasicMaterial,
    Mesh,
    Vector3,
    CircleGeometry,
    ShaderMaterial,
} from "three";
import { geoInterpolate } from "d3-geo";
import throttle from "lodash/throttle";

const toXYZ = (lat, lon, radius) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
};

export default function StripeCopy() {
    console.log("StripeCopy component rendered");
    const mountRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const globeRef = useRef();

    useEffect(() => {
        console.log("Three.js useEffect running");
        // Scene setup
        const width = mountRef.current.clientWidth || window.innerWidth;
        const height = mountRef.current.clientHeight || window.innerHeight;
        const scene = new Scene();
        const camera = new PerspectiveCamera(45, width / height, 1, 2000);
        camera.position.set(0, 0, 1500);

        const renderer = new WebGLRenderer({ antialias: false, alpha: true });
        renderer.setSize(width, height);
        mountRef.current.appendChild(renderer.domElement);

        // Base Sphere (Ocean layer)
        const oceanGeo = new SphereGeometry(600, 50, 50);
        const oceanMat = new MeshBasicMaterial({
            color: 0x001e3e,
            transparent: true,
            opacity: 0.6,
        });
        const ocean = new Mesh(oceanGeo, oceanMat);
        scene.add(ocean);

        // Dots layer (Sunflower pattern)
        const DOT_COUNT = 6000;
        const dotGeom = new CircleGeometry(2, 5);
        const positions = [];
        const vector = new Vector3();
        for (let i = DOT_COUNT; i >= 0; i--) {
            const phi = Math.acos(-1 + (2 * i) / DOT_COUNT);
            const theta = Math.sqrt(DOT_COUNT * Math.PI) * phi;
            vector.setFromSphericalCoords(600, phi, theta);
            dotGeom.lookAt(vector);
            dotGeom.translate(vector.x, vector.y, vector.z);
        }
        const dotsMat = new MeshBasicMaterial({ color: 0xffffff });
        const dots = new Mesh(dotGeom, dotsMat);
        scene.add(dots);

        // Arc class
        class Arc extends THREE.Group {
            constructor(start, end, radius) {
                super();
                const startV = toXYZ(start[0], start[1], radius);
                const endV = toXYZ(end[0], end[1], radius);
                const d3Interp = geoInterpolate([start[1], start[0]], [end[1], end[0]]);
                const c1 = d3Interp(0.25);
                const c2 = d3Interp(0.75);
                const ctrl1 = toXYZ(c1[1], c1[0], startV.distanceTo(endV) * 0.5 + radius);
                const ctrl2 = toXYZ(c2[1], c2[0], startV.distanceTo(endV) * 0.5 + radius);
                const curve = new THREE.CubicBezierCurve3(startV, ctrl1, ctrl2, endV);
                this.geometry = new THREE.TubeGeometry(curve, 44, 0.5, 8);
                this.material = new ShaderMaterial({
                    /* custom fragment shader code here */
                });
                this.mesh = new Mesh(this.geometry, this.material);
                this.add(this.mesh);
                this.startTime = performance.now();
                this.geometry.setDrawRange(0, 1);
                this.drawAnimatedLine();
            }

            drawAnimatedLine = () => {
                const timeElapsed = performance.now() - this.startTime;
                const progress = timeElapsed / 2500;
                const drawCount = progress * 3000;
                this.geometry.setDrawRange(0, drawCount);
                if (progress < 0.999) requestAnimationFrame(this.drawAnimatedLine);
            };
        }

        // Example arc
        const arc = new Arc([37.7749, -122.4194], [51.5074, -0.1278], 600);
        scene.add(arc);

        // Scroll handler
        const SCROLL_EPSILON = 0.0016;
        let oldScroll = window.scrollY;
        const onScroll = throttle(() => {
            const newScroll = window.scrollY;
            const delta = oldScroll - newScroll;
            ocean.rotation.y += delta * SCROLL_EPSILON;
            oldScroll = newScroll;
        }, 16);
        window.addEventListener("scroll", onScroll);

        // Animation loop
        const animate = () => {
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };
        animate();

        setIsLoaded(true);
        globeRef.current = { scene, camera, renderer };

        return () => {
            window.removeEventListener("scroll", onScroll);
            mountRef.current.removeChild(renderer.domElement);
        };
    }, []);

    return (
        <div
            ref={mountRef}
            style={{
                width: "100%",
                height: "100vh",
                minHeight: 400,
                minWidth: 400,
                background: "#222",
            }}
        >
            {/* {!isLoaded && 'Loading...'} */}
        </div>
    );
}
