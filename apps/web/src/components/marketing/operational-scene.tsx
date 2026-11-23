"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Escena propia para la sección pinned: un terreno de líneas en 3D con cuatro
 * nodos que representan las etapas de la orden. No es una imagen ni un video;
 * se dibuja en un solo canvas WebGL y se pausa fuera de viewport.
 */
export function OperationalScene({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / Math.max(1, mount.clientHeight),
      0.1,
      100,
    );
    camera.position.set(0, 2.5, 5.4);
    camera.lookAt(0, -0.1, 0);

    const geometry = new THREE.PlaneGeometry(12, 6.4, 72, 42);
    const material = new THREE.MeshBasicMaterial({
      color: 0x8d97aa,
      wireframe: true,
      transparent: true,
      opacity: 0.23,
    });
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.85;
    scene.add(terrain);

    const nodeGeometry = new THREE.SphereGeometry(0.055, 14, 14);
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xe4572e });
    const nodeAltMaterial = new THREE.MeshBasicMaterial({ color: 0x9fe3d0 });
    const nodeXs = [-4.2, -1.4, 1.4, 4.2];
    const nodes = nodeXs.map((x, index) => {
      const node = new THREE.Mesh(
        nodeGeometry,
        index === 1 ? nodeAltMaterial : nodeMaterial,
      );
      node.position.set(x, 0.18, 0.15);
      scene.add(node);
      return node;
    });

    const base = Float32Array.from(geometry.attributes.position.array as Float32Array);
    const position = geometry.attributes.position as THREE.BufferAttribute;
    const pointer = { x: 0, y: 0 };
    const startTime = performance.now();
    let raf = 0;
    let running = false;

    const renderFrame = (time: number) => {
      for (let i = 0; i < base.length; i += 3) {
        const x = base[i];
        const y = base[i + 1];
        const height =
          Math.sin(x * 0.62 + time * 0.45) * 0.2 +
          Math.cos(y * 0.95 - time * 0.32) * 0.12;
        (position.array as Float32Array)[i + 2] = height;
      }
      position.needsUpdate = true;
      nodes.forEach((node, index) => {
        node.position.y = 0.18 + Math.sin(time * 0.7 + index * 1.4) * 0.08;
      });
      if (!reduce) {
        camera.position.x += (pointer.x * 0.55 - camera.position.x) * 0.035;
        camera.position.y += (2.5 + pointer.y * 0.25 - camera.position.y) * 0.035;
        camera.lookAt(0, -0.1, 0);
      }
      renderer.render(scene, camera);
    };

    const start = () => {
      if (running) return;
      running = true;
      const tick = () => {
        if (!running) return;
        renderFrame(reduce ? 0 : (performance.now() - startTime) / 1000);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (reduce || event.pointerType === "touch") return;
      const rect = mount.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    };
    const onPointerLeave = () => {
      pointer.x = 0;
      pointer.y = 0;
    };
    mount.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerleave", onPointerLeave);

    const resize = () => {
      const width = mount.clientWidth;
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (reduce) renderFrame(0);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    let visible = true;
    const intersection = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible) start();
        else stop();
      },
      { rootMargin: "200px" },
    );
    intersection.observe(mount);

    if (reduce) renderFrame(0);
    else if (visible) start();

    return () => {
      stop();
      intersection.disconnect();
      resizeObserver.disconnect();
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerleave", onPointerLeave);
      scene.remove(terrain, ...nodes);
      geometry.dispose();
      material.dispose();
      nodeGeometry.dispose();
      nodeMaterial.dispose();
      nodeAltMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} aria-hidden="true" className={className} />;
}
