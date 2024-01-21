

//import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

// Create scene
//import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.120.1/build/three.module.js';

import { STLLoader } from 'https://cdn.jsdelivr.net/npm/three@0.120.1/examples/jsm/loaders/STLLoader.js';
//import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { quickHull } from './quickHull.mjs';
import * as layflat from './Layflatnormal.mjs';



const loader = new STLLoader();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight);
camera.position.set(0,10, 100);
camera.lookAt(scene.position);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
// Add a plane to the scene
const planeGeometry = new THREE.PlaneGeometry(100, 100,10,10);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, wireframe: true });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2; // Rotate the plane to be horizontal
plane.position.y = 0; // Adjust the position of the plane
scene.add(plane);
const faceIndex = 0; // You can change this index based on your requirements
const faceNormal = new THREE.Vector3();
planeGeometry.faces[faceIndex].normal.clone(faceNormal);

const constantPlaneNormal = new THREE.Vector3(0, -1, 0);
// //var controls = new THREE.OrbitControls( camera, renderer.domElement );
const controls = new THREE.OrbitControls(camera, renderer.domElement);
 controls.enableDamping = true;

const circleGeometry = new THREE.CircleGeometry(30, 50); // Radius: 50, Segments: 32
const circleMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
const circleMesh = new THREE.LineLoop(circleGeometry, circleMaterial);
circleMesh.rotation.x = Math.PI / 2;
circleMesh.visible=false;
// Add the circle to the scene
scene.add(circleMesh);

// Add radial lines to represent specific degrees
const degrees = [0,45, 90, 135, 180, 225, 270, 360];
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

degrees.forEach(degree => {
  const angleInRadians = (degree / 180) * Math.PI;
  const x = 30 * Math.cos(angleInRadians);
  const y = 30 * Math.sin(angleInRadians);

  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(x, y, 0)
  ]);

  const line = new THREE.Line(lineGeometry, lineMaterial);
  circleMesh.add(line);
});
function createPlaneMesh(center, normal, dimensions, color) {
    const epsilon = 1e-6; // A small value to handle rounding errors

    // Check if dimensions.width is close to zero
    if (Math.abs(dimensions.width) < epsilon) {
        // Set dimensions.width to a small positive value
        dimensions.width = epsilon;
    }

    // Check if dimensions.height is close to zero
    if (Math.abs(dimensions.height) < epsilon) {
        // Set dimensions.height to a small positive value
        dimensions.height = epsilon;
    }

    // Check if dimensions.depth is close to zero
    if (Math.abs(dimensions.depth) < epsilon) {
        // Set dimensions.depth to a small positive value
        dimensions.depth = epsilon;
    }

    // If width is zero, set depth to dimensions.width
    if (Math.abs(dimensions.width) < epsilon) {
        dimensions.depth = dimensions.width;
    }

    // If height is zero, set depth to dimensions.height
    if (Math.abs(dimensions.height) < epsilon) {
        dimensions.depth = dimensions.height;
    }

    // Calculate the orientation of the plane based on the normal vector
    const orientation = new THREE.Matrix4();
    const up = new THREE.Vector3(0, 1, 0); // Assuming up direction is y-axis
    orientation.lookAt(new THREE.Vector3(), normal, up);

    // Create a plane geometry
    const planeGeometry = new THREE.PlaneGeometry(dimensions.width, dimensions.height);

    // If width is zero, set depth to dimensions.width
    if (Math.abs(dimensions.width) < epsilon) {
        planeGeometry.parameters.width = dimensions.depth;
        planeGeometry.parameters.height = dimensions.height;
    }

    // If height is zero, set depth to dimensions.height
    if (Math.abs(dimensions.height) < epsilon) {
        planeGeometry.parameters.width = dimensions.width;
        planeGeometry.parameters.height = dimensions.depth;
    }

    // Apply the orientation and position to the geometry
    planeGeometry.applyMatrix4(orientation);
    planeGeometry.translate(center.x, center.y, center.z);

    // Create a material (you can customize this based on your needs)
    const material = new THREE.MeshPhongMaterial({ color: color || 0xff0000, side: THREE.DoubleSide });

    // Create a mesh using the geometry and material
    const planeMesh = new THREE.Mesh(planeGeometry, material);

    return planeMesh;
}


// 
//const dimensions = { width: 5, height: 5 }; // Example dimensions (adjust as needed)
const color = 0xff0000; // Red color (adjust as needed)
;



let boundingBoxMesh=null;
let boundingBox=null;
let selectedMesh = null;
const boundingBoxCenter = new THREE.Vector3();
window.addEventListener('resize', (event) => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
window.addEventListener('mousedown', (event) => {
    event.preventDefault();
});
let selectedFaceIndex = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
document.getElementById('fileInput').addEventListener('change', handleFileSelect);
function handleFileSelect(event) {
    const file = event.target.files[0];
    let meshes=null;
    let geometrys =null;

    if (file) {
        const loader = new STLLoader();
        loader.load(URL.createObjectURL(file), function (geometry) {
    const material = new THREE.MeshNormalMaterial();
     meshes = new THREE.Mesh(geometry, material);
    meshes.position.set(0, 0, 0);
    scene.add(meshes);
    geometrys=meshes.geometry;
    
if(geometrys!=null){
    // Assuming 'mesh' is your three.js mesh object
boundingBox = new THREE.Box3().setFromObject(meshes);
console.log("gemeotry",geometrys);

// Create a wireframe material for the bounding box
const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const wireframeGeometry = new THREE.BoxGeometry(
  boundingBox.max.x - boundingBox.min.x,
  boundingBox.max.y - boundingBox.min.y,
  boundingBox.max.z - boundingBox.min.z
  
);
boundingBoxMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
boundingBoxMesh.visible = false;

boundingBox.getCenter(boundingBoxCenter);
boundingBoxMesh.position.copy(boundingBoxCenter);
// Add the bounding box to the scene
scene.add(boundingBoxMesh);
    const selectedOuterFaces =layflat.selectOuterFacesAutomatically(geometrys);
    console.log("Selected Outer Faces:", selectedOuterFaces);
    const selectedLayFlatFacesss = layflat.selectLayFlatFacesWithNormals(geometrys,selectedOuterFaces );
    console.log("Combined Selected Faces:", selectedLayFlatFacesss);
   
  const removedface =isOuterFace(geometrys,selectedLayFlatFacesss, meshes);
  console.log("removedface",removedface);
  selectedNeighbours(geometrys,removedface);
  finalMergedMesh.visible=false;

 
    }
    meshes.userData = { file };

    meshes.addEventListener('click', function () {
        if (selectedMesh) {
            selectedMesh.material.emissive.setHex(0x000000);
            console.log("slectdmesh",selectedMesh);
        }

        selectedMesh = mesh;
        mesh.material.emissive.setHex(0x00ff00);
    });

        fileInput.value = '';
        console.log("geometrys",geometrys);
    
    
        });}
        

// Handle mesh cloning
document.getElementById('cloneButton').addEventListener('click', function () {
    if (selectedMesh) {
        const clonedMesh = selectedMesh.clone();
        clonedMesh.position.x += 2;
        scene.add(clonedMesh);
    }
});

    // Handle mouse click to select face
   // window.removeEventListener('click', onMouseClick);
    // Add the click event listener
   //window.addEventListener('click', onMouseClick, false);
    

    function onMouseClick(event) {
        event.preventDefault();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(finalMergedMesh);

        if (intersects.length > 0) {
            selectedFaceIndex = intersects[0].faceIndex;
            console.log('Selected Face Index:', selectedFaceIndex);
        //    findAllNeighboringFaces(geometrys, selectedFaceIndex);
            
            var neigbourface = findAllNeighboringFaces(geometrys, selectedFaceIndex);
            console.log("facess", neigbourface);
         
const centerOfNeighboringFaces = findCenterOfNeighboringFaces(geometrys, neigbourface,selectedFaceIndex );
const dimensionsOfCombinedFace = findCombinedFaceDimensions(geometrys, neigbourface,selectedFaceIndex);


console.log("Center of Neighboring Faces:", centerOfNeighboringFaces);
 console.log("Dimensions of Combined Face:", dimensionsOfCombinedFace);
// const lineGeometry = new THREE.Geometry();
// lineGeometry.vertices.push(centerOfNeighboringFaces, new THREE.Vector3(0, 0, 0));
// const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
// const line = new THREE.Line(lineGeometry, lineMaterial);
// scene.add(line);
// const planeMesh = createPlaneGeometry(centerOfNeighboringFaces, dimensionsOfCombinedFace);
// scene.add(planeMesh);
// const isOuter = isOuterFace(geometrys, selectedFaceIndex,meshes);
    
// if (isOuter) {
//     console.log(`Face ${selectedFaceIndex} is likely an outer face.`);
// } else {
//     console.log(`Face ${selectedFaceIndex} is not an outer face.`);
// }


          // const singlenormal= computeAverageNormal(geometry,neigbourface);

         //  console.log("singlenormal",singlenormal);
         //  const centroids = computeCentroid(geometry, neigbourface, meshes);
         //  const averageNormal = computeAverageNormal(geometry,  neigbourface);
         //  const planeMesh = createPlaneMesh(averageNormal, 10, 0x00ff00, centroids);
         //  scene.add(planeMesh);
           


            const selectedFaceNormal = getFaceNormal(finalMergedMesh.geometry, selectedFaceIndex);
           console.log("gotfacenormal",selectedFaceNormal);
            
           
            //const filteredNormals = filterNormalsBySelectedFace(geometrys, selectedFaceNormal, neigbourface);
           // console.log('Filtered Normals:', filteredNormals);
          //  highlightFilteredNormals(geometrys, selectedFaceIndex, neigbourface);
            const normalss = getFaceNormal(geometrys,selectedFaceIndex);
const angless= isAngleInSet(normalss, angleSet)
 console.log("angles",angless);
        }
    }
 
    function isOuterFace(geometry, flatfaces, mesh) {
        const facesToRemove = [];
    
        // Loop through the flatfaces object
        for (const angles in flatfaces) {
            for (const direction in flatfaces[angles]) {
                const entries = flatfaces[angles][direction];
    
                // Loop through the normals and face indices for each direction entry
                for (let i = 0; i < entries.normals.length; i++) {
                    const faceNormal = entries.normals[i];
                    const centroid = calculateFaceCentroid(geometry, entries.faceIndices[i]);
    
                    const raycaster = new THREE.Raycaster(centroid, faceNormal);
                    const intersections = raycaster.intersectObject(mesh);
    
                    // If no intersections, it's likely an outer face
                    if (intersections.length === 0) {
                        facesToRemove.push(entries.faceIndices[i]);
                    }
                }
            }
        }
    
        return facesToRemove;
    }
    
    
    function calculateFaceCentroid(geometry, faceIndex) {
        const faceVertices = getFaceVerticx(geometry, faceIndex);
    
        // Use the faceVertices array directly
        const center = calculateFaceCenter(faceVertices);
    
        return center;
    }
    

    
    function isAngleInSet(normal, angleSet) {
        // Ensure the normal vector is normalized
        const length = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
        const normalizedNormal = {
            x: normal.x / length,
            y: normal.y / length,
            z: normal.z / length,
        };
    
        // Calculate the angle in radians using atan2, considering all three components
        const angle = Math.atan2(normalizedNormal.y, normalizedNormal.x, normalizedNormal.z);
    
    
        // Convert the angle to degrees and ensure it's within [0, 360] degrees
        let degrees = (angle * 180) / Math.PI;
        
        degrees = (degrees + 360) % 360;
       // console.log("degree",degrees);
    
        // Adjust for negative angles
        if (degrees < 0) {
            degrees += 360;
        }
    
        // Round the angle to the nearest integer
        degrees = Math.round(degrees);
    
        const isInSet = angleSet.includes(degrees);
    
       
        return { angle: degrees, isInSet };
    }
    
    const angleSet = [0, 45, 90, 70,135, 180,225,270,360,315];

    
    // Usage
    
    

    function findAllNeighboringFaces(geometry, selectedFaceIndex) {
        const faces = geometry.attributes.position.count / 3;
        const neighbors = [];
        const selectedVertices = getFaceVertices(geometry, selectedFaceIndex);
    
        for (let i = 0; i < faces; i++) {
            if (i !== selectedFaceIndex) {
                const vertices = getFaceVertices(geometry, i);
                if (areVerticesInSamePlane(selectedVertices, vertices)) {
                    neighbors.push(i);
                }
            }
        }
    
       // console.log("neighbours", neighbors);
        return neighbors;
    }
    let isDragging = false;
    let isrotating=false

// Offset between intersection point and click position
const dragOffset = new THREE.Vector3();

let isRotationEventAttached = false;

document.getElementById('rotationButton').addEventListener('click', function () {

    if (!isRotationEventAttached) {
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        isRotationEventAttached = true;
        circleMesh.visible=true;
    } else {
        document.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        isRotationEventAttached = false;
        circleMesh.visible=false;
        
    }
});



let previousMousePosition = {
    x: 0,
    y: 0
};
// Disable OrbitControls on mousedown if ray intersects the mesh
function onMouseDown(event) {
    event.preventDefault();

    // Set mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections
    const intersects = raycaster.intersectObject(boundingBoxMesh);

    if (intersects.length > 0) {
        isrotating = true;
        isDragging=false

        // Calculate the offset between intersection point and click position
        dragOffset.copy(intersects[0].point).sub(meshes.position);
        meshes.verticesNeedUpdate=true
        meshes.normalsNeedUpdate=true;

       
        meshes.updateMatrixWorld();

        // Disable OrbitControls
       
    }
}

const rotationAxis = new THREE.Vector3(0, 1, 0);
// Move the mesh on mousemove if dragging
function onMouseMove(event) {
    event.preventDefault();

    if (isrotating) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObject(boundingBoxMesh);

        if (intersects.length > 0) {
            const deltaX = mouse.x - previousMousePosition.x;
            const angle = deltaX * 10;

            boundingBoxMesh.rotateOnWorldAxis(rotationAxis, angle);

            boundingBox.setFromObject(boundingBoxMesh);
            boundingBox.getCenter(boundingBoxCenter);
            createAxesLines(boundingBoxMesh);
            circleMesh.position.copy(boundingBoxCenter)
        
    
            // Update the rotation of the mesh to match the bounding box
          //  mesh.rotation.copy(boundingBoxMesh.rotation);
          
           // meshes.position.copy(boundingBoxMesh.position);
            meshes.rotation.copy(boundingBoxMesh.rotation);
            finalMergedMesh.rotation.copy(meshes.rotation);
        }

        previousMousePosition = { x: mouse.x, y: mouse.y };
    }
}





// Enable OrbitControls on mouseup
function onMouseUp() {
    isrotating = false;
  geometrys.verticesNeedUpdate=true
    geometrys.normalsNeedUpdate=true;
    finalMergedMesh.geometry.verticesNeedUpdate=true;
    finalMergedMesh.normalsNeedUpdate=true;
    
  
               
                meshes.updateMatrixWorld();
                finalMergedMesh.updateMatrixWorld();
   
    
    boundingBox.setFromObject(meshes);
    boundingBox.getCenter(boundingBoxCenter);
    boundingBoxMesh.position.copy(boundingBoxCenter);
    boundingBoxMesh.rotation.copy(meshes.rotation);
    
   

    // Enable OrbitControls
    controls.enabled = true;
}



document.addEventListener('mousedown',  onobject);
        document.addEventListener('mousemove', onobjectmove);
        document.addEventListener('mouseup', onup);


function onobject(event) {
    event.preventDefault();

    // Set mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections
    const intersects = raycaster.intersectObject(meshes);

    if (intersects.length > 0) {
        isDragging = true;

        // Calculate the offset between intersection point and click position
        dragOffset.copy(intersects[0].point).sub(meshes.position);

        // Disable OrbitControls
        controls.enabled = false;
    }
}


// Move the mesh on mousemove if dragging
function onobjectmove(event) {
    event.preventDefault();

    if (isDragging) {
        // Update the mouse coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update the raycaster
        raycaster.setFromCamera(mouse, camera);

        // Raycast to find the intersection point
        const intersects = raycaster.intersectObject(meshes);

        if (intersects.length > 0) {
            // Calculate the new position
            const newX = intersects[0].point.x - dragOffset.x;
            const newZ = intersects[0].point.z - dragOffset.z;

            // Restrict the movement within the plane boundaries
            const halfPlaneSize = 50; // Assuming the plane size is 200x200
            meshes.position.x = THREE.MathUtils.clamp(newX, -halfPlaneSize, halfPlaneSize);
            meshes.position.z = THREE.MathUtils.clamp(newZ, -halfPlaneSize, halfPlaneSize);

            // Update the geometry and bounding box
            geometrys.verticesNeedUpdate = true;
            geometrys.normalsNeedUpdate = true;
            geometrys.positionNeedYpdate = true;
            finalMergedMesh.verticesNeedUpdate = true;
            finalMergedMesh.normalsNeedUpdate = true;
            finalMergedMesh.positionNeedYpdate = true;

            meshes.updateMatrixWorld();
            finalMergedMesh.position.copy(meshes.position);
            finalMergedMesh.updateMatrixWorld();

            boundingBox.setFromObject(meshes);
            boundingBox.getCenter(boundingBoxCenter);
            boundingBoxMesh.position.copy(boundingBoxCenter);
            createAxesLines(meshes);
        }
    }
}
// Create a circle geometry


// Enable OrbitControls on mouseup
function onup() {
    isDragging = false;
    meshes.verticesNeedUpdate=true
    meshes.normalsNeedUpdate=true;
    boundingBox.setFromObject(meshes);
    boundingBox.getCenter(boundingBoxCenter);
    boundingBoxMesh.position.copy(boundingBoxCenter);
   
    meshes.updateMatrixWorld();

    // Enable OrbitControls
    controls.enabled = true;
}





    
   
 //  highlightFilteredNormals(geometry, 33, neigbourfacesss  );

    
    function areVerticesInSamePlane(vertices1, vertices2) {
        const threshold = 0.001; // Adjust the threshold based on your model
        const plane = new THREE.Plane().setFromCoplanarPoints(vertices1[0], vertices1[1], vertices1[2]);
        return vertices2.every(vertex => Math.abs(plane.distanceToPoint(vertex)) < threshold);
    }
    
    
    // Function to get the vertices of a face
    function getFaceVertices(geometry, faceIndex) {
        const positions = geometry.attributes.position.array;
        const startIndex = faceIndex * 9;
        return [
            new THREE.Vector3(positions[startIndex], positions[startIndex + 1], positions[startIndex + 2]),
            new THREE.Vector3(positions[startIndex + 3], positions[startIndex + 4], positions[startIndex + 5]),
            new THREE.Vector3(positions[startIndex + 6], positions[startIndex + 7], positions[startIndex + 8]),
        ];
    }
    

const mergedPositions = [];
    
    let mergedMesh=null;
    let mergedarraynormals=[];
    let mergedarray=[];

    
   
    function highlightFilteredNormalss(geometry, selectedFaceIndex, filteredNormals) {
        const positions = geometry.attributes.position.array;
        const normals = geometry.attributes.normal.array;
    
        let mergedNormals = [];
       // createAxesLines(meshes);
    
        // Add the selected face to the merged geometry
        const selectedFaceStart = selectedFaceIndex * 9;
        const selectedFaceEnd = selectedFaceStart + 9;
        mergedPositions.push(...positions.slice(selectedFaceStart, selectedFaceEnd));
        mergedNormals.push(...normals.slice(selectedFaceStart, selectedFaceEnd));
    
        // Extract positions and normals of selected and filtered neighboring faces
        filteredNormals.forEach((faceIndex) => {
            const startIndex = faceIndex * 9;
            const endIndex = startIndex + 9;
    
            const facePositions = positions.slice(startIndex, endIndex);
            const faceNormals = normals.slice(startIndex, endIndex);
    
            if (!containsNaN(facePositions) && !containsNaN(faceNormals)) {
                mergedPositions.push(...facePositions);
                mergedNormals.push(...faceNormals);
            }
        });
    
        // Create a new BufferGeometry for the merged faces
        const mergedGeometry = new THREE.BufferGeometry();
        mergedGeometry.setAttribute(
            'position',
            new THREE.BufferAttribute(new Float32Array(mergedPositions), 3)
        );
        mergedGeometry.setAttribute(
            'normal',
            new THREE.BufferAttribute(new Float32Array(mergedNormals), 3)
        );
    
        // Calculate a single normal for the merged faces
        
        

    
        // Create a mesh with the merged geometry
        const mergedMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        mergedMesh = new THREE.Mesh(mergedGeometry, mergedMaterial);
         
        // Add the merged mesh to the scene
        scene.add(mergedMesh);
    
    
    mergedarray.push(mergedMesh);
    mergedarraynormals.push(mergedNormals);
    
    let maxLength = 0;
    let longestMeshIndex = -1;

    for (let i = 0; i < mergedarray.length; i++) {
        const normalsArray = mergedarray[i].geometry.getAttribute('normal').array;
      //  console.log(`Normals for Mesh ${i + 1}:`, normalsArray.length);
        let normils = normalsArray[i];
      //  console.log("normils", normils);
         normalSum = new THREE.Vector3(); // Initialize outside the loop to accumulate all normals

        for (let i = 0; i < mergedarray.length; i++) {
            const normalsArray = mergedarray[i].geometry.getAttribute('normal').array;
           // console.log(`Normals for Mesh ${i + 1}:`, normalsArray.length);
        
            // Sum up all normals
            for (let j = 0; j < normalsArray.length; j += 3) {
                const normal = new THREE.Vector3(normalsArray[j], normalsArray[j + 1], normalsArray[j + 2]);
                normalSum.add(normal);
            }
        
            if (normalsArray.length > maxLength) {
                maxLength = normalsArray.length;
                longestMeshIndex = i;
            }
        }
        
     // console.log(`Mesh with the longest normals is at index ${longestMeshIndex} with length ${maxLength}`);
        
        // Normalize the sum to get the average normal
        normalSum.normalize();
       //console.log("Combined Face Normal:", normalSum);
    }}
    function mergeGeometries(geometries) {
        const mergedGeometry = new THREE.BufferGeometry();
    
        // Merge position attributes
        const positionArrays = geometries.map(geometry => geometry.getAttribute('position').array);
        const mergedPositionArray = new Float32Array(positionArrays.reduce((acc, arr) => acc.concat(Array.from(arr)), []));
        mergedGeometry.setAttribute('position', new THREE.BufferAttribute(mergedPositionArray, 3));
    
        // Merge normal attributes
        const normalArrays = geometries.map(geometry => geometry.getAttribute('normal').array);
        const mergedNormalArray = new Float32Array(normalArrays.reduce((acc, arr) => acc.concat(Array.from(arr)), []));
        mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(mergedNormalArray, 3));
    
        return mergedGeometry;
    }
    
    function mergeMeshes(meshes) {
        const geometries = meshes.map(mesh => mesh.geometry);
        const mergedGeometry = mergeGeometries(geometries);
    
        const mergedMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff, // White color
            opacity: 0.5,     // Adjust opacity as needed
            transparent: true, // Enable transparency
        });
        
        const mergedMesh = new THREE.Mesh(mergedGeometry, mergedMaterial);
    
        return mergedMesh;
    }
    
    
    function highlightFilteredNormals(geometry, selectedFaceIndex, filteredNormals, mergedMeshes) {
        const positions = geometry.attributes.position.array;
        const normals = geometry.attributes.normal.array;
    
        const geometries = [];
    
        // Add the selected face geometry
        const selectedFaceStart = selectedFaceIndex * 9;
        const selectedFaceEnd = selectedFaceStart + 9;
        const selectedFaceGeometry = new THREE.BufferGeometry();
        selectedFaceGeometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(selectedFaceStart, selectedFaceEnd), 3));
        selectedFaceGeometry.setAttribute('normal', new THREE.BufferAttribute(normals.slice(selectedFaceStart, selectedFaceEnd), 3));
        geometries.push(selectedFaceGeometry);
    
        // Add filtered faces geometries
        filteredNormals.forEach((faceIndex) => {
            const startIndex = faceIndex * 9;
            const endIndex = startIndex + 9;
    
            const faceGeometry = new THREE.BufferGeometry();
            faceGeometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(startIndex, endIndex), 3));
            faceGeometry.setAttribute('normal', new THREE.BufferAttribute(normals.slice(startIndex, endIndex), 3));
    
            if (!containsNaN(faceGeometry.attributes.position.array) && !containsNaN(faceGeometry.attributes.normal.array)) {
                geometries.push(faceGeometry);
            }
        });
    
        // Merge all geometries into a single geometry
        const mergedGeometry = mergeGeometries(geometries);
    
        // Create a new mesh with the merged geometry
        const mergedMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000, // White color
            opacity: 0.2,     // Adjust opacity as needed
            transparent: true, // Enable transparency
        });
        const mergedMesh = new THREE.Mesh(mergedGeometry, mergedMaterial);
    
      
    
        // Add the merged mesh to the array
        mergedMeshes.push(mergedMesh);
    }
    

let normalSum=null;
let isMouseDownEventAttached = false;

document.getElementById('layflat').addEventListener('click', function () {

    if (!isMouseDownEventAttached) {
        document.addEventListener('mousedown', onMouseClicksss, false);
        isMouseDownEventAttached = true;
        finalMergedMesh.visible=true;
    
    } else {
        document.removeEventListener('mousedown', onMouseClicksss, false);
        isMouseDownEventAttached = false;
        finalMergedMesh.visible=false;
    }
});
// const neigbourfacesss = findAllNeighboringFaces(geometry, 58);
//    console.log("negia",neigbourfacesss);


    function calculateMeshDimensions(mesh) {
        const geometry = mesh.geometry;
        const positions = geometry.attributes.position.array;
    
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
    
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
    
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
    
        const length = maxX - minX;
        const width = maxY - minY;
    
        return { length, width };
    }
    
// Helper function to check for NaN values in an array
function containsNaN(array) {
    for (let i = 0; i < array.length; i++) {
        if (isNaN(array[i])) {
            return true;
        }
    }
    return false;
}







function mergeMeshesIntoSingleMesh(meshes) {
    const mergedGeometry = new THREE.BufferGeometry();
    const mergedMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });

    const mergedPositions = [];
    const mergedNormals = [];

    meshes.forEach((mesh) => {
        const positions = mesh.geometry.getAttribute('position').array;
        const normals = mesh.geometry.getAttribute('normal').array;

        mergedPositions.push(...positions);
        mergedNormals.push(...normals);
    });

    mergedGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(mergedPositions), 3));
    mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(mergedNormals), 3));

    // Create a mesh with the merged geometry and material
    const mergedMesh = new THREE.Mesh(mergedGeometry, mergedMaterial);
    return mergedMesh;
}   

function getFaceNormal(geometry, faceIndex) {
        const normals = geometry.attributes.normal.array;
        const startIndex = faceIndex * 9;
       
        return new THREE.Vector3(normals[startIndex], normals[startIndex + 1], normals[startIndex + 2]);
       
    }

    // Function to filter neighboring faces based on normals using dot product
    function filterNormalsBySelectedFace(geometry, selectedFaceNormal, neighboringFaces) {
        return neighboringFaces.filter(neighboringFaceIndex => {
            const neighboringFaceNormal = getFaceNormal(geometry, neighboringFaceIndex);
            // Normalize the vectors before computing the dot product
            selectedFaceNormal.normalize();
            neighboringFaceNormal.normalize();
            // Compare normals using the dot product
            const dotProduct = selectedFaceNormal.dot(neighboringFaceNormal);
            // You can adjust the threshold based on your requirements
            const threshold = 0.999; // Cosine of a small angle (e.g., 2 degrees)
            return dotProduct > threshold;
        });
  }
  function getFaceVerticess(geometry, faceIndex) {
    const vertices = [];

    if (geometry instanceof THREE.BufferGeometry) {
        // Handle BufferGeometry
        const positions = geometry.attributes.position.array;
        const startIndex = faceIndex * 9;
        for (let i = 0; i < 9; i += 3) {
            vertices.push(
                new THREE.Vector3(positions[startIndex + i], positions[startIndex + i + 1], positions[startIndex + i + 2])
            );
        }
    } else if (geometry instanceof THREE.Geometry) {
        // Handle Geometry (deprecated in newer Three.js versions)
        const face = geometry.faces[faceIndex];
        const verticesIndices = [face.a, face.b, face.c];
        verticesIndices.forEach(index => {
            const vertex = geometry.vertices[index];
            vertices.push(new THREE.Vector3(vertex.x, vertex.y, vertex.z));
        });
    } else {
        // Handle other geometry types as needed
        // You might need additional checks for different geometry types
    }

    return vertices;
}


let transformationMatrixss =null;

function onMouseClicksss(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(finalMergedMesh);

    if (intersects.length > 0) {
        selectedFaceIndex = intersects[0].faceIndex;
        console.log('Selected Face Index:', selectedFaceIndex);
        const beforroation=  getFacePositions(finalMergedMesh.geometry, selectedFaceIndex, finalMergedMesh);
       console.log("beforerotationface",beforroation);
        
       meshes.rotation.set(0, 0, 0);
       finalMergedMesh.rotation.set(0, 0, 0);
        let selectedFaceNormals =getFaceNormal(finalMergedMesh.geometry, selectedFaceIndex);
        console.log('Selected Face Normals:', selectedFaceNormals);
    //const   angles = isAngleInSet( selectedFaceNormals, angleSet)
   // console.log("angless",angles);
   // singlemeshes.updateMatrixWorld();
      //  let boxmatrixss=planes.matrix.identity();
       // console.log("boxesmatrixss",boxmatrixss);
        let rotationMatrix = calculateRotationMatrix(selectedFaceNormals, constantPlaneNormal);
       
       
        let transformationMatrixss = new THREE.Matrix4().copy(finalMergedMesh.matrix);
       console.log("mesh matrix",transformationMatrixss);
       let transformationMatrixsss = new THREE.Matrix4().copy(meshes.matrix);

    
   //console.log("singlmesh".singlemesh);

    
        // Multiply the mesh matrix with the rotation matrix
     const combinedMatrix = new THREE.Matrix4().multiplyMatrices( transformationMatrixss,rotationMatrix);
     const combinedMatrixss = new THREE.Matrix4().multiplyMatrices( transformationMatrixss,rotationMatrix);


        // Apply the new rotation to the existing matrix
   
        finalMergedMesh.geometry.applyMatrix4(combinedMatrix);
        geometrys.applyMatrix4(combinedMatrixss);

    // meshes.updateMatrixWorld();
    const afeterrotation=  getFacePositions(finalMergedMesh.geometry, selectedFaceIndex,finalMergedMesh);
    const afeterrotations=  getFacePositions(geometrys, selectedFaceIndex,meshes);
    

    geometrys.verticesNeedUpdate=true
    geometrys.normalsNeedUpdate = true;
    geometrys.positionNeedYpdate=true;
    meshes.updateMatrixWorld();
    finalMergedMesh.updateMatrixWorld();
    transformationMatrixss = new THREE.Matrix4().copy(finalMergedMesh.matrix);
    transformationMatrixsss = new THREE.Matrix4().copy(meshes.matrix);
    console.log("afterrotationmatrix",transformationMatrixss);
    let transformations = calculateTransformationMatrixs(selectedFaceIndex,plane, finalMergedMesh,afeterrotation);

    let transformation = calculateTransformationMatrixs(selectedFaceIndex,plane, meshes,afeterrotations);
    
    const combinedMatrixs = new THREE.Matrix4().multiplyMatrices( transformationMatrixss, transformations);
    const combinedMatrixsss = new THREE.Matrix4().multiplyMatrices( transformationMatrixsss,transformation);
    
    console.log("combined matr",combinedMatrixs);
    
    finalMergedMesh.geometry.applyMatrix4(combinedMatrixs);
    geometrys.applyMatrix4(combinedMatrixs);

   // meshes.updateMatrixWorld();
    geometrys.verticesNeedUpdate=true
    geometrys.normalsNeedUpdate=true;
    geometrys.positionNeedYpdate=true;
               
                meshes.updateMatrixWorld();
              
                boundingBox.setFromObject(meshes);
                boundingBox.getCenter(boundingBoxCenter);
                boundingBoxMesh.position.copy(boundingBoxCenter);
                boundingBoxMesh.rotation.copy(meshes.rotation);
               



               // resetMeshOrigin(meshes, boundingBox)
  
                createAxesLines(meshes);
                 
    transformationMatrixss = new THREE.Matrix4().copy(finalMergedMesh.matrix);
    transformationMatrixsss = new THREE.Matrix4().copy(meshes.matrix);

   
    }
}


function resetMeshOrigin(mesh, boundingBox) {
    // Get the center of the bounding box
    boundingBox.setFromObject(boundingBoxMesh);
 boundingBox.getCenter(boundingBoxCenter);

    // Set the mesh's position to the center of the bounding box
    const displacement = boundingBoxCenter.clone().sub(mesh.position);

    // Update each vertex in the geometry to move it to the new origin
    mesh.geometry.vertices.forEach((vertex) => {
        vertex.sub(displacement);
    });

    // Update normals and apply changes
    mesh.geometry.computeVertexNormals();
    mesh.geometry.verticesNeedUpdate = true;
    mesh.geometry.normalsNeedUpdate = true;

    // Update the position to the bounding box center
    mesh.position.copy(boundingBoxCenter);

    // Update the matrix world to apply the changes
    mesh.updateMatrixWorld();}


let xAxisLine, yAxisLine, zAxisLine;
function createAxesLines(mesh) {
    // Extract the columns of the mesh matrix (local coordinate axes)
    const xAxis = new THREE.Vector3().fromArray(mesh.matrix.elements.slice(0, 3));
    const yAxis = new THREE.Vector3().fromArray(mesh.matrix.elements.slice(4, 7));
    const zAxis = new THREE.Vector3().fromArray(mesh.matrix.elements.slice(8, 11));

    // Remove existing lines if they exist
    if (xAxisLine) scene.remove(xAxisLine);
    if (yAxisLine) scene.remove(yAxisLine);
    if (zAxisLine) scene.remove(zAxisLine);

    // Create lines along the local coordinate axes
    xAxisLine = new THREE.ArrowHelper(xAxis, mesh.position, 30, 0xff0000);
    yAxisLine = new THREE.ArrowHelper(yAxis, mesh.position, 30, 0x00ff00);
    zAxisLine = new THREE.ArrowHelper(zAxis, mesh.position, 30, 0x0000ff);

    // Add the lines to the scene
    scene.add(xAxisLine);
    scene.add(yAxisLine);
    scene.add(zAxisLine);
}

function calculateTransformationMatrixs(faceIndex, planeMesh, mesh,facePosition) {
    // Ensure geometry is updated
    mesh.geometry.computeBoundingBox();
    mesh.updateMatrixWorld();
    const planeNormal = planeMesh.geometry.faces[0].normal.clone().applyQuaternion(planeMesh.quaternion);
    const planePosition = planeMesh.position;

    // Calculate the vector from the face position to a point on the plane
    const vectorToPlane = new THREE.Vector3().subVectors(facePosition, planePosition);

    // Project the vector onto the plane's normal to find the distance to the plane
    const distanceToPlane = (vectorToPlane.dot(planeNormal))*2;
    console.log("distanceto the plane",distanceToPlane);

    // Get the vertices of the selected face
    const faceVertices = getFaceVertices(mesh.geometry, faceIndex);
    console.log("faceposition",facePosition);
    const faceBoundingBox = new THREE.Box3().setFromObject(mesh);

    // Calculate the center of the bounding box
    const boundingBoxCenter = new THREE.Vector3();
    faceBoundingBox.getCenter(boundingBoxCenter);

    // Calculate the center of the face
    const faceCenter = new THREE.Vector3();
    faceVertices.forEach((vertex) => faceCenter.add(vertex));
    faceCenter.divideScalar(faceVertices.length);
   
    // Create a translation matrix to move the object's origin to the face center and then move up to the top of the plane
    const translationMatrix = new THREE.Matrix4().makeTranslation(
        -boundingBoxCenter.x,
        faceCenter.y + distanceToPlane,
        -boundingBoxCenter.z
    );
    mesh.positionNeedUpdate=true;
    console.log("transla",translationMatrix);

    console.log("facecenter",faceCenter);
    return translationMatrix;
}
function resetMeshOrigin(mesh) {
    // Reset the position of the mesh
    mesh.position.set(0, 0, 0);

    // Update the matrix world to apply the position change
    mesh.updateMatrixWorld();

    // Reset the geometry to its center
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);

    mesh.geometry.translate(-center.x, -center.y, -center.z);
    mesh.geometry.verticesNeedUpdate = true;
    mesh.geometry.normalsNeedUpdate = true;

    // Update the matrix world again
    mesh.updateMatrixWorld();
}

function getFacePositions(geometry, faceIndex, mesh) {
    const positions = geometry.attributes.position.array;
    const startIndex = faceIndex * 3 * 3;

    // Calculate the average position of the vertices to get the face position in local coordinates
    const localPosition = new THREE.Vector3();
    for (let i = 0; i < 3; i++) {
        const index = startIndex + i * 3;
        const x = positions[index];
        const y = positions[index + 1];
        const z = positions[index + 2];

        localPosition.add(new THREE.Vector3(x, y, z));
    }
    localPosition.divideScalar(3);
    console.log("local",localPosition);
    

    // Convert the local face position to global coordinates by applying the mesh's matrixWorld
    const globalPosition = localPosition.clone().applyMatrix4(mesh.matrixWorld);
 //   console.log("meshworld",mesh.matrixWorld);

    return globalPosition;
}

let singlemeshes=null;

let negibourefaces = [];
let finalMergedMesh=null;

function selectedNeighbours(geometry, selectedOuterFaces) {
    const mergedMeshes = [];

    for (const selectedFaceIndex of selectedOuterFaces) {
        const normal = getFaceNormal(geometry, selectedFaceIndex);
        const neighbors = findAllNeighboringFaces(geometry, selectedFaceIndex);
        highlightFilteredNormals(geometry, selectedFaceIndex, neighbors, mergedMeshes);
    }

    // Merge all the merged meshes into a single mesh
finalMergedMesh = mergeMeshes(mergedMeshes);

    // Add the final merged mesh to the scene
    scene.add(finalMergedMesh);
    console.log("finalmesh",finalMergedMesh);
}

 //   const centered=  findCenterOfNeighboringFaces(geometry, neighbors,selectedFaceIndex);
    //  const dimension= findCombinedFaceDimensions(geometry, neighbors);
    //  console.log("centerd",centered);
    //  const planeMesh = createPlaneMesh(centered, normal, dimension, color);
    // scene.add(planeMesh);
    // console.log("plane",planeMesh);

   

//console.log("mesd",singlemeshes);
//selectedNeighbours(farthestFaces, geometry);
function getFacePosition(geometry, faceIndex) {
    const vertices = getFaceVertices(geometry, faceIndex);

    // Calculate the average position of the vertices to get the face position
    const position = {
        x: (vertices[0].x + vertices[1].x + vertices[2].x) / 3,
        y: (vertices[0].y + vertices[1].y + vertices[2].y) / 3,
        z: (vertices[0].z + vertices[1].z + vertices[2].z) / 3,
    };

    return position;
}

function getFaceNormals(geometry, faceIndex) {
    const normal = new THREE.Vector3();

    // Get the vertices of the face
    const vertices = getFaceVerticess(geometry, faceIndex);
    console.log(vertices);

    if (vertices.length >= 3) {
        // Calculate the face normal using the cross product of two edges
        const edge1 = new THREE.Vector3().subVectors(vertices[1], vertices[0]);
        const edge2 = new THREE.Vector3().subVectors(vertices[2], vertices[0]);

        // Ensure the vertices form a valid face (at least three vertices)
        normal.crossVectors(edge1, edge2).normalize();
    }


    return normal;
}

 // Replace with your constant plane normal

function calculateRotationMatrix(selectedFaceNormal, constantPlaneNormal) {
    const axis = new THREE.Vector3().crossVectors(selectedFaceNormal, constantPlaneNormal).normalize();
    console.log(" axis",axis );
   

    const angle =Math.acos(selectedFaceNormal.dot(constantPlaneNormal) / (selectedFaceNormal.length() * constantPlaneNormal.length()));
   


    // Ensure axis is consistently pointing away from the constant plane normal
    
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationAxis(axis, angle);

    return rotationMatrix;
}

}
function findCenterOfNeighboringFaces(geometry, neighboringFaces,slectedface) {
    const center = new THREE.Vector3();

    neighboringFaces.forEach(faceIndex => {
        const faceVertices = getFaceVerticx(geometry, faceIndex);
        const faceCenter = calculateFaceCenter(faceVertices);
        center.add(faceCenter);
    });

    // If there are no neighboring faces, use the center of the selected face
    if (neighboringFaces.length === 0) {
        const selectedFaceVertices = getFaceVerticx(geometry ,slectedface);
        center.copy(calculateFaceCenter(selectedFaceVertices));
    } else {
        center.divideScalar(neighboringFaces.length);
    }

    return center;
}
function calculateFaceCenter(faceVertices) {
    const center = new THREE.Vector3();

    for (let i = 0; i < faceVertices.length; i++) {
        center.add(faceVertices[i]);
    }

    center.divideScalar(faceVertices.length);

    return center;
}



// Draw a line from the center to some point (e.g., origin)


function getFaceVerticx(geometry, faceIndex) {
    const positions = geometry.attributes.position.array;
    const startIndex = faceIndex * 9;
    return [
        new THREE.Vector3(positions[startIndex], positions[startIndex + 1], positions[startIndex + 2]),
        new THREE.Vector3(positions[startIndex + 3], positions[startIndex + 4], positions[startIndex + 5]),
        new THREE.Vector3(positions[startIndex + 6], positions[startIndex + 7], positions[startIndex + 8]),
    ];
}

function findCombinedFaceDimensions(geometry, neighboringFaces, selectedFaceIndex) {
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    // Include the vertices of the selected face
    const selectedFaceVertices = getFaceVerticx(geometry, selectedFaceIndex);
    selectedFaceVertices.forEach(vertex => {
        minX = Math.min(minX, vertex.x);
        minY = Math.min(minY, vertex.y);
        minZ = Math.min(minZ, vertex.z);
        maxX = Math.max(maxX, vertex.x);
        maxY = Math.max(maxY, vertex.y);
        maxZ = Math.max(maxZ, vertex.z);
    });

    if (neighboringFaces.length === 0) {
        // If there are no neighboring faces, use the vertices of the selected face
        const selectedFaceVertices = getFaceVerticx(geometry, selectedFaceIndex);

        selectedFaceVertices.forEach(vertex => {
            minX = Math.min(minX, vertex.x);
            minY = Math.min(minY, vertex.y);
            minZ = Math.min(minZ, vertex.z);
            maxX = Math.max(maxX, vertex.x);
            maxY = Math.max(maxY, vertex.y);
            maxZ = Math.max(maxZ, vertex.z);
        });
    } else {
        neighboringFaces.forEach(faceIndex => {
            const faceVertices = getFaceVerticx(geometry, faceIndex);

            faceVertices.forEach(vertex => {
                minX = Math.min(minX, vertex.x);
                minY = Math.min(minY, vertex.y);
                minZ = Math.min(minZ, vertex.z);
                maxX = Math.max(maxX, vertex.x);
                maxY = Math.max(maxY, vertex.y);
                maxZ = Math.max(maxZ, vertex.z);
            });
        });
    }

    const dimensions = {
        width: maxX - minX,
        height: maxY - minY,
        depth: maxZ - minZ
    };

    return dimensions;

  
}







function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();