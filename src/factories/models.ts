import * as THREE from 'three';
import type { FishSpecies } from '../entities/Fish';

function standardMaterial(color: number, emissive = 0x000000): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.25,
    roughness: 0.52,
    metalness: 0.08,
    flatShading: true,
  });
}

export function createFishModel(species: FishSpecies, color: number): THREE.Group {
  const group = new THREE.Group();
  const bodyMaterial = standardMaterial(color, species === 'puffer' ? 0x3a2500 : 0x301400);
  const finMaterial = standardMaterial(species === 'puffer' ? 0xe7a91f : 0xff6c12);

  const bodyGeometry = species === 'puffer'
    ? new THREE.IcosahedronGeometry(0.88, 2)
    : new THREE.SphereGeometry(1, 18, 12);
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.scale.set(species === 'puffer' ? 1 : 1.15, species === 'puffer' ? 1 : 0.68, 0.58);
  body.castShadow = true;
  group.add(body);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.66, 1.15, 3), finMaterial);
  tail.position.set(-1.18, 0, 0);
  tail.rotation.z = Math.PI / 2;
  tail.scale.z = 0.55;
  tail.castShadow = true;
  group.add(tail);

  const topFin = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.75, 3), finMaterial);
  topFin.position.set(-0.15, 0.72, 0);
  topFin.rotation.z = -0.06;
  topFin.scale.z = 0.42;
  group.add(topFin);

  const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), standardMaterial(0xfbf7ed));
  eyeWhite.position.set(0.68, 0.23, 0.49);
  group.add(eyeWhite);

  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 8), standardMaterial(0x17233a, 0x04080f));
  pupil.position.set(0.77, 0.24, 0.68);
  group.add(pupil);

  if (species === 'puffer') {
    const spikeMaterial = standardMaterial(0xd99518);
    const spikeGeometry = new THREE.ConeGeometry(0.1, 0.42, 5);
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2;
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      spike.position.set(Math.cos(angle) * 0.82, Math.sin(angle) * 0.82, 0);
      spike.rotation.z = angle - Math.PI / 2;
      group.add(spike);
    }
  }

  group.userData.entityType = 'fish';
  return group;
}

export function createEnemyModel(): THREE.Group {
  const group = new THREE.Group();
  const armorMaterial = standardMaterial(0x563a98, 0x15082c);
  const domeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0a695f,
    emissive: 0x04231f,
    emissiveIntensity: 0.7,
    roughness: 0.1,
    metalness: 0.15,
    transmission: 0.18,
    transparent: true,
    opacity: 0.93,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 1.08, 0.52, 10), armorMaterial);
  base.rotation.x = Math.PI / 2;
  group.add(base);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), domeMaterial);
  dome.position.y = 0.25;
  group.add(dome);

  const eyeMaterial = standardMaterial(0xff2e21, 0xff1208);
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), eyeMaterial);
  leftEye.position.set(-0.25, 0.25, 0.67);
  group.add(leftEye);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.25;
  group.add(rightEye);

  const legGeometry = new THREE.CylinderGeometry(0.09, 0.14, 0.75, 6);
  for (const x of [-0.68, -0.28, 0.28, 0.68]) {
    const leg = new THREE.Mesh(legGeometry, armorMaterial);
    leg.position.set(x, -0.55, 0);
    leg.rotation.z = x < 0 ? -0.55 : 0.55;
    group.add(leg);
  }

  group.userData.entityType = 'enemy';
  return group;
}
