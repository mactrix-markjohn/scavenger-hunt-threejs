import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// Helper to define 3D assets and coordinate target scans with game state & UI
export const initScenePipelineModule = (gameState, uiManager) => {
  const anchorGroups = {}
  const spinMeshes = []
  const mixers = []
  const clock = new THREE.Clock()

  // Populates lighting, shadows, and default placeholder geometries
  const initXrScene = ({scene, camera, renderer}) => {
    renderer.shadowMap.enabled = true

    // Add lights for realistic shadows and GLB reflections
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(5, 12, 8)
    directionalLight.castShadow = true
    
    // Configure shadow maps for better quality
    directionalLight.shadow.mapSize.width = 1024
    directionalLight.shadow.mapSize.height = 1024
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 25
    scene.add(directionalLight)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    // Define coordinates syncing anchors for each target
    const targetNames = ['image-target-atomic', 'image-target-back-power']
    
    targetNames.forEach((name) => {
      // 1. Create a tracking group for this anchor
      const group = new THREE.Group()
      group.visible = false // Hide until detected
      scene.add(group)
      anchorGroups[name] = group

      // 2. Add a sleek neon loading ring as a tracking placeholder
      const ringGeo = new THREE.RingGeometry(0.3, 0.35, 32)
      ringGeo.rotateX(-Math.PI / 2)
      const ringMat = new THREE.MeshBasicMaterial({
        color: name === 'image-target-atomic' ? 0xffd700 : 0x00f2fe,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      })
      const placeholderRing = new THREE.Mesh(ringGeo, ringMat)
      group.add(placeholderRing)
      spinMeshes.push(placeholderRing) // Spin the placeholder ring

      // 3. Load the custom GLTF model asynchronously
      const loader = new GLTFLoader()
      const modelUrl = name === 'image-target-atomic' ? 'assets/AstronautThumbUp.glb' : 'assets/PirateFail.glb'
      
      loader.load(
        modelUrl,
        (gltf) => {
          // Remove the placeholder ring when model is loaded
          group.remove(placeholderRing)
          
          const model = gltf.scene
          
          // Print model bounds size for visual scaling reference
          const box = new THREE.Box3().setFromObject(model)
          const size = box.getSize(new THREE.Vector3())
          console.log(`[AR] Model loaded for ${name}, bounds size:`, size)

          // Configure model scale and position based on target
          if (name === 'image-target-atomic') {
            // Astronaut model is usually large (~2m tall), scale it down
            model.scale.set(0.2, 0.2, 0.2)
          } else {
            // Pirate model is also large (~2m tall), scale it down
            model.scale.set(0.2, 0.2, 0.2)
          }
          
          model.position.set(0, 0.05, 0) // Align slightly above cover surface
          
          // Enable shadow casting for meshes in the model
          model.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true
              node.receiveShadow = true
            }
          })
          
          group.add(model)

          // Play loaded GLTF skeletal animations immediately
          if (gltf.animations && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model)
            const action = mixer.clipAction(gltf.animations[0])
            action.play()
            mixers.push(mixer)
            console.log(`[AR] Playing animation "${gltf.animations[0].name}" for target: ${name}`)
          }
        },
        undefined,
        (error) => {
          console.error(`Error loading model ${modelUrl}:`, error)
        }
      )
    })

    camera.position.set(0, 2, 3)
  }

  return {
    name: 'scavenger-hunt-3d-renderer',

    // Runs once when the camera feed starts and the canvas is bound
    onStart: ({canvas}) => {
      const {scene, camera, renderer} = XR8.Threejs.xrScene()

      initXrScene({scene, camera, renderer})

      // Sync 8th Wall coordinate system with cameras initial offset
      XR8.XrController.updateCameraProjectionMatrix({
        origin: camera.position,
        facing: camera.quaternion
      })
    },

    // Runs every tick (frame update) for animations
    onUpdate: () => {
      // Rotate placeholder loading rings
      spinMeshes.forEach((mesh) => {
        if (mesh.parent && mesh.parent.visible) {
          mesh.rotation.y += 0.015
        }
      })

      // Update animation mixers with clock delta time
      const delta = clock.getDelta()
      mixers.forEach((mixer) => {
        mixer.update(delta)
      })
    },

    // Register target events listeners directly through the pipeline module listeners
    listeners: [
      {
        event: 'reality.imagefound',
        process: (event) => {
          const detail = event.detail || event
          const {name, position, rotation, scale} = detail
          const group = anchorGroups[name]

          if (group) {
            group.position.copy(position)
            group.quaternion.copy(rotation)
            group.scale.set(scale, scale, scale)
            group.visible = true

            // Award points and check completions via game state
            const reward = gameState.scanTarget(name)
            if (reward) {
              // Update HUD values
              uiManager.updateHUD(
                reward.totalScore,
                reward.progress,
                gameState.totalTargets,
                reward.nextClue
              )

              // Open found overlay
              uiManager.showFoundModal(
                reward.title,
                reward.description,
                reward.points,
                () => {
                  // Check if hunt is finished on close
                  if (reward.isFinished) {
                    uiManager.showGameOverModal('QUEST-HERO-99', (email) => {
                      alert(`Giveaway entry confirmed for: ${email}\nClaim your prize at the desk!`)
                      uiManager.hideAllModals()
                    })
                  }
                }
              )
            }
          }
        }
      },
      {
        event: 'reality.imageupdated',
        process: (event) => {
          const detail = event.detail || event
          const {name, position, rotation, scale} = detail
          const group = anchorGroups[name]

          if (group) {
            group.position.copy(position)
            group.quaternion.copy(rotation)
            group.scale.set(scale, scale, scale)
          }
        }
      },
      {
        event: 'reality.imagelost',
        process: (event) => {
          const detail = event.detail || event
          const {name} = detail
          const group = anchorGroups[name]

          if (group) {
            group.visible = false
          }
        }
      }
    ]
  }
}
