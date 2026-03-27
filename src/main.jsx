import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from "gsap/SplitText";
import Lenis from 'lenis';
import botModel from '../public/hexa-bottle/source/bot.glb';

document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger, SplitText);

    // ── Smooth scroll ──────────────────────────────────────────────────────────
    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // ── SplitText setup ────────────────────────────────────────────────────────
    const header1Split = new SplitText(".header-1 h1", {
        type: "char",
        charsClass: "char",
    });

    header1Split.chars.forEach(
        (char) => (char.innerHTML = `<span>${char.innerHTML}</span>`)
    );

    // Sare 6 tooltips ke liye SplitText alag alag
    document.querySelectorAll(".tooltip .title h2").forEach(el => {
        const split = new SplitText(el, { type: "lines", linesClass: "line" });
        split.lines.forEach(l => (l.innerHTML = `<span>${l.innerHTML}</span>`));
    });

    document.querySelectorAll(".tooltip .description p").forEach(el => {
        const split = new SplitText(el, { type: "lines", linesClass: "line" });
        split.lines.forEach(l => (l.innerHTML = `<span>${l.innerHTML}</span>`));
    });

    // ── Header-1 entrance trigger ──────────────────────────────────────────────
    ScrollTrigger.create({
        trigger: ".product-overview",
        start: "75% bottom",
        onEnter: () =>
            gsap.to(".header-1 h1 .char > span", {
                y: "0%",
                duration: 1,
                ease: "power3.out",
                stagger: 0.025,
            }),
        onLeaveBack: () =>
            gsap.to(".header-1 h1 .char > span", {
                y: "100%",
                duration: 1,
                ease: "power3.out",
                stagger: 0.025,
            }),
    });

    // ── Three.js setup ─────────────────────────────────────────────────────────
    let model, currentRotation = 0, modelSize;
    let modelMeshes = [];

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.LinearEncoding;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1.0;
    document.querySelector(".model-container").appendChild(renderer.domElement);

    // ── Lights ────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(1, 2, 3);
    mainLight.castShadow = true;
    mainLight.shadow.bias = -0.001;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-2, 0, -1);
    scene.add(fillLight);

    // ── Color stops ───────────────────────────────────────────────────────────
    const COLOR_STOPS = [
        { at: 0.00, color: "#ffffff" },
        { at: 0.35, color: "#c8f0ff" },
        { at: 0.60, color: "#ff6b35" },
        { at: 0.85, color: "#7c3aed" },
        { at: 1.00, color: "#1a1a2e" },
    ];

    const parsedStops = COLOR_STOPS.map(s => ({
        at: s.at,
        color: new THREE.Color(s.color),
    }));

    function getColorAtProgress(p) {
        p = Math.max(0, Math.min(1, p));

        let from = parsedStops[0];
        let to   = parsedStops[parsedStops.length - 1];

        for (let i = 0; i < parsedStops.length - 1; i++) {
            if (p >= parsedStops[i].at && p <= parsedStops[i + 1].at) {
                from = parsedStops[i];
                to   = parsedStops[i + 1];
                break;
            }
        }

        const range = to.at - from.at;
        const t = range === 0 ? 0 : (p - from.at) / range;
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        return new THREE.Color().lerpColors(from.color, to.color, eased);
    }

    function applyColorToModel(color) {
        modelMeshes.forEach(mesh => {
            const mats = Array.isArray(mesh.material)
                ? mesh.material
                : [mesh.material];
            mats.forEach(mat => {
                if (mat.color) mat.color.set(color);
            });
        });
    }

    // ── Model position setup ──────────────────────────────────────────────────
    function setupModel() {
        if (!model || !modelSize) return;
        const isMobile = window.innerWidth < 1000;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());

        model.position.set(
            isMobile ? center.x + modelSize.x * 1 : -center.x - modelSize.x * 0.4,
            -center.y + modelSize.y * 0.085,
            -center.z
        );
        model.rotation.z = isMobile ? 0 : THREE.MathUtils.degToRad(-25);

        const cameraDistance = isMobile ? 2 : 1.25;
        camera.position.set(0, 0, Math.max(modelSize.x, modelSize.y, modelSize.z) * cameraDistance);
        camera.lookAt(0, 0, 0);
    }

    // ── Load model ────────────────────────────────────────────────────────────
    new GLTFLoader().load(botModel, (gltf) => {
        model = gltf.scene;
        model.traverse((node) => {
            if (node.isMesh && node.material) {
                Object.assign(node.material, { metalness: 0.05, roughness: 0.9 });
                modelMeshes.push(node);
            }
        });
        const box = new THREE.Box3().setFromObject(model);
        modelSize = box.getSize(new THREE.Vector3());
        scene.add(model);
        setupModel();
        applyColorToModel(parsedStops[0].color);
    });

    // ── Render loop ───────────────────────────────────────────────────────────
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    // ── Resize ────────────────────────────────────────────────────────────────
    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        setupModel();
    });

    // ── Utility ───────────────────────────────────────────────────────────────
    const mapRange = (val, inMin, inMax) =>
        Math.max(0, Math.min(1, (val - inMin) / (inMax - inMin)));

    // ── Tooltip selectors (order: L1, L2, L3, R1, R2, R3) ────────────────────
    const leftSel  = n => `.tooltips-col.left  .tooltip:nth-child(${n + 1})`;
    const rightSel = n => `.tooltips-col.right .tooltip:nth-child(${n + 1})`;

    const tooltipSelectors = [
        leftSel(0), leftSel(1), leftSel(2),
        rightSel(0), rightSel(1), rightSel(2),
    ];

    // ── Per-tooltip reveal function ───────────────────────────────────────────
    function revealTooltip(sel, progress, startP, speed = 0.055) {
        const iconP  = startP;
        const divP   = startP + speed * 0.5;
        const titleP = startP + speed;
        const descP  = startP + speed * 2;

        gsap.set(`${sel} .icon ion-icon`, {
            y: `${(1 - mapRange(progress, iconP, iconP + speed)) * 125}%`,
        });
        gsap.set(`${sel} .divider`, {
            scaleX: mapRange(progress, divP, divP + speed * 1.5),
        });
        gsap.set(`${sel} .title .line > span`, {
            y: `${(1 - mapRange(progress, titleP, titleP + speed)) * 125}%`,
        });
        gsap.set(`${sel} .description .line > span`, {
            y: `${(1 - mapRange(progress, descP, descP + speed)) * 125}%`,
        });
    }

    // ── Main ScrollTrigger ────────────────────────────────────────────────────
    const SCROLL_MULTIPLIER = 8;

    ScrollTrigger.create({
        trigger: ".product-overview",
        start: "top top",
        end: `+=${window.innerHeight * SCROLL_MULTIPLIER}px`,
        pin: true,
        pinSpacing: true,
        scrub: 1.2,

        onUpdate: ({ progress }) => {

            // Header-1 slide out
            gsap.set(".header-1", {
                xPercent: -100 * mapRange(progress, 0.03, 0.12),
            });

            // Circular mask expand
            const maskSize = 100 * mapRange(progress, 0.08, 0.18);
            gsap.set(".circular-mask", {
                clipPath: `circle(${maskSize}% at 50% 50%)`,
            });

            // Header-2 slide in then slide out
            let h2X;
            if      (progress < 0.08) h2X = 100;
            else if (progress < 0.18) h2X = 100 - 100 * mapRange(progress, 0.08, 0.18);
            else if (progress < 0.28) h2X = -200 * mapRange(progress, 0.18, 0.28);
            else                      h2X = -200;
            gsap.set(".header-2", { xPercent: h2X });


            const T_START = 0.30;
            const T_STEP  = 0.105;
            const T_SPEED = 0.055;

            tooltipSelectors.forEach((sel, i) => {
                revealTooltip(sel, progress, T_START + i * T_STEP, T_SPEED);
            });

            // Model rotation
            if (model && progress > 0.05) {
                const rotP = (progress - 0.05) / 0.95;
                const targetRot = Math.PI * 2 * 2 * rotP;
                const diff = targetRot - currentRotation;
                if (Math.abs(diff) > 0.001) {
                    model.rotateOnAxis(new THREE.Vector3(0, 1, 0), diff);
                    currentRotation = targetRot;
                }
            }

            // Model color change
            if (modelMeshes.length > 0) {
                applyColorToModel(getColorAtProgress(progress));
            }
        },
    });
});