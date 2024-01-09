

//import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

// Create scene
//import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.120.1/build/three.module.js';
import * as Oribtcontrols from"https://cdn.jsdelivr.net/npm/three@0.114/examples/js/controls/OrbitControls.js"
import Stats from 'https://cdn.jsdelivr.net/npm/three@0.120.1/examples/jsm/libs/stats.module.min.js';
import { STLLoader } from 'https://cdn.jsdelivr.net/npm/three@0.120.1/examples/jsm/loaders/STLLoader.js';







const loader = new STLLoader();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight);
camera.position.set(0,10, 100);
camera.lookAt(scene.position);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
// Add a plane to the scene
const planeGeometry = new THREE.PlaneGeometry(100, 100,100,100);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, wireframe: true });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2; // Rotate the plane to be horizontal
plane.position.y = 0; // Adjust the position of the plane
scene.add(plane);
const faceIndex = 0; // You can change this index based on your requirements
const faceNormal = new THREE.Vector3();
planeGeometry.faces[faceIndex].normal.clone(faceNormal);
// Create materials for each face
const materialFront = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red
const materialBack = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green
const materialTop = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Blue
const materialBottom = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Yellow
const materialLeft = new THREE.MeshBasicMaterial({ color: 0xff00ff }); // Magenta
const materialRight = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // Cyan

// Create a MultiMaterial by combining the materials
const multiMaterial = new THREE.MultiMaterial([
    materialFront,
    materialBack,
    materialTop,
    materialBottom,
    materialLeft,
    materialRight
]);

// Create a box geometry
// const boxGeometry = new THREE.BoxGeometry(4, 4, 4);

// // Create a mesh with the MultiMaterial
// const planes = new THREE.Mesh(boxGeometry, multiMaterial);

// // Add the mesh to the scene
// scene.add(planes);


// The 'faceNormal' now contains the normal of the specified face
//console.log('Face Normal:', faceNormal);
const planeGeometrys = new THREE.BoxGeometry(4, 4,4);
const planeMaterials = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, wireframe: true });
const planes = new THREE.Mesh(planeGeometrys,  multiMaterial);
planes.rotation.x = Math.PI / 1; // Rotate the plane to be horizontal
planes.position.y = 2; // Adjust the position of the plane
//scene.add(planes);



var controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
// an animation loop is required when either damping or auto-rotation are enabled
//controls.dampingFactor = 1;
 //controls.screenSpacePanning = false;
// controls.maxPolarAngle = Math.PI / 2;
// controls.minDistance = 3;
// controls.maxDistance = 10;

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
loader.load('Voron_Design_Cube_v7.stl', function (geometry) {
    const material = new THREE.MeshNormalMaterial();
    const meshes = new THREE.Mesh(geometry, material);
    meshes.position.set(0, 0, 0);
    scene.add(meshes);});
// Load STL model
loader.load('Voron_Design_Cube_v7.stl', 
function (geometry) {
    const material = new THREE.MeshNormalMaterial();
    const meshes = new THREE.Mesh(geometry, material);
    meshes.position.set(0, 0, 0);
    scene.add(meshes);});

    // Handle mouse click to select face
    window.addEventListener('click', onMouseClick, false);

    function onMouseClick(event) {
        event.preventDefault();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(meshes);

        if (intersects.length > 0) {
            selectedFaceIndex = intersects[0].faceIndex;
            console.log('Selected Face Index:', selectedFaceIndex);
            findAllNeighboringFaces(geometry, selectedFaceIndex);
            var neigbourface = findAllNeighboringFaces(geometry, selectedFaceIndex);
            console.log("facess", neigbourface);

            const selectedFaceNormal = getFaceNormal(geometry, selectedFaceIndex);
            console.log("gotfacenormal",selectedFaceNormal);
            const filteredNormals = filterNormalsBySelectedFace(geometry, selectedFaceNormal, neigbourface);
           // console.log('Filtered Normals:', filteredNormals);
            highlightFilteredNormals(geometry, selectedFaceIndex, filteredNormals);
            const normalss = getFaceNormal(geometry,selectedFaceIndex);
const angless= isAngleInSet(normalss, angleSet)
console.log("angles",angless);
        }
    }

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

    
   
 //  highlightFilteredNormals(geometry, 33, neigbourfacesss  );

    
    function areVerticesInSamePlane(vertices1, vertices2) {
        const threshold = 0.001; // Adjust the threshold based on your model
        const plane = new THREE.Plane().setFromCoplanarPoints(vertices1[0], vertices1[1], vertices1[2]);
        return vertices2.every(vertex => Math.abs(plane.distanceToPoint(vertex)) < threshold);
    }
    

// Function to check if all vertices are close to the plane formed by the selected face
// function areVerticesCloseToPlane(selectedVertices, vertices, selectedNormal, threshold) {
//     const plane = new THREE.Plane().setFromCoplanarPoints(selectedVertices[0], selectedVertices[1], selectedVertices[2]);

//     for (let i = 0; i < vertices.length; i++) {
//         const distance = plane.distanceToPoint(vertices[i]);
//         if (distance > threshold) {
//             return false;
//         }
//     }

//     return true;
// }



    
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

    
   
    function highlightFilteredNormals(geometry, selectedFaceIndex, filteredNormals) {
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
        
     //   console.log(`Mesh with the longest normals is at index ${longestMeshIndex} with length ${maxLength}`);
        
        // Normalize the sum to get the average normal
        normalSum.normalize();
       // console.log("Combined Face Normal:", normalSum);
    }}
let normalSum=null;


// document.getElementById('executeButton').addEventListener('click', function () {
// //   let rotionofcube=calculateRotationMatrix(normalSum,constantPlaneNormal);
// //   let transformationMatrixss = new THREE.Matrix4().copy(meshes.matrix);
// //   console.log("mesh matrix",transformationMatrixss);



// //   // Multiply the mesh matrix with the rotation matrix
// //   const combinedMatrix = new THREE.Matrix4().multiplyMatrices(transformationMatrixss,rotionofcube);
// //   // Apply the new rotation to the existing matrix
  


// //   // Apply the combined transformation to the mesh
// //  meshes.applyMatrix4(combinedMatrix);
// //   geometry.verticesNeedUpdate = true; // Update vertices if necessary
// //   geometry.normalsNeedUpdate = true;
// //   geometry.positionNeedUpdate = true;
// //   console.log(meshes.position);


//   // CreateAxesLines should be called outside the click event for efficiency
//  // createAxesLines(meshes);

// });
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


//document.addEventListener('mousedown', onMouseClicksss, false);



function onMouseClicksss(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(meshes);

    if (intersects.length > 0) {
        selectedFaceIndex = intersects[0].faceIndex;
        console.log('Selected Face Index:', selectedFaceIndex);
        
        let selectedFaceNormals =getFaceNormal(geometry, selectedFaceIndex);
        console.log('Selected Face Normals:', selectedFaceNormals);
      //  let boxmatrixss=planes.matrix.identity();
       // console.log("boxesmatrixss",boxmatrixss);
        let rotationMatrix = calculateRotationMatrix(selectedFaceNormals, constantPlaneNormal);
        console.log("rotaito",rotationMatrix);
        // Clear previous rotation by resetting the matrix
       // let previousRotationMatrix = new THREE.Matrix4();
        
        let transformationMatrixss = new THREE.Matrix4().copy(meshes.matrix);
        console.log("mesh matrix",transformationMatrixss);
   

    
        // Multiply the mesh matrix with the rotation matrix
        const combinedMatrix = new THREE.Matrix4().multiplyMatrices(transformationMatrixss,rotationMatrix);
        // Apply the new rotation to the existing matrix
        


        // Apply the combined transformation to the mesh
       meshes.applyMatrix4(combinedMatrix);
        geometry.verticesNeedUpdate = true; // Update vertices if necessary
        geometry.normalsNeedUpdate = true;
        geometry.positionNeedUpdate = true;
        console.log(meshes.position);
    

        // CreateAxesLines should be called outside the click event for efficiency
      //  createAxesLines(meshes);
    }
}

function calculateRotationMatrix(selectedFaceNormal, constantPlaneNormal) {
    let axis = new THREE.Vector3().crossVectors(selectedFaceNormal, constantPlaneNormal).normalize();

    // Ensure axis is positive
    if (axis.x < 0 || axis.y < 0 || axis.z < 0) {
        axis.negate();
    }

    let angle = Math.acos(selectedFaceNormal.dot(constantPlaneNormal) / (selectedFaceNormal.length() * constantPlaneNormal.length()));

    // Construct the rotation matrix manually
    const rotationMatrix = new THREE.Matrix4();
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const t = 1 - c;

    const x = axis.x;
    const y = axis.y;
    const z = axis.z;

    rotationMatrix.set(
        t * x * x + c, t * x * y - s * z, t * x * z + s * y, 0,
        t * x * y + s * z, t * y * y + c, t * y * z - s * x, 0,
        t * x * z - s * y, t * y * z + s * x, t * z * z + c, 0,
        0, 0, 0, 1
    );

    return rotationMatrix;
}


// Assuming mesh is your THREE.Mesh object

// Extract the columns of the mesh matrix (local coordinate axes)
let xAxisLine, yAxisLine, zAxisLine;

// ... (other initialization code)

// Function to create lines along local coordinate axes
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
    xAxisLine = new THREE.ArrowHelper(xAxis, mesh.position, 4, 0xff0000);
    yAxisLine = new THREE.ArrowHelper(yAxis, mesh.position, 4, 0x00ff00);
    zAxisLine = new THREE.ArrowHelper(zAxis, mesh.position, 4, 0x0000ff);

    // Add the lines to the scene
    scene.add(xAxisLine);
    scene.add(yAxisLine);
    scene.add(zAxisLine);
}
createAxesLines(meshes);

function getFaceCenter(geometry, faceIndex) {
    const vertices = getFaceVerticess(geometry, faceIndex);
    const center = new THREE.Vector3();

    for (const vertex of vertices) {
        center.add(vertex);
    }

    center.divideScalar(vertices.length);

    return center;
}

function calculateTransformationMatrix(faceNormal, center, planeNormal, mesh) {
    // 1. Calculate the rotation matrix based on the normal
    const rotationMatrix = calculateRotationMatrix(faceNormal,  planeNormal);
    console.log("rotaionss", rotationMatrix);

    // 2. Calculate the translation matrix based on the center
    const translationMatrix = new THREE.Matrix4();


    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    console.log("siezw", size);
    const offset = size.y / 2;
    //const centersss=getFaceCenter(planes,  0);
   const adjustedCenter = center.clone().add(new THREE.Vector3(0, offset, 0));
    console.log("sie",adjustedCenter);
   // const translationMatrix = new THREE.Matrix4();
    translationMatrix.makeTranslation(adjustedCenter.x, adjustedCenter.y, adjustedCenter.z);
    console.log("translation",translationMatrix);
    

    // 3. Combine the rotation and translation matrices
    const transformationMatrix = new THREE.Matrix4();
    transformationMatrix.multiplyMatrices(rotationMatrix, translationMatrix);
    console.log("transformation",transformationMatrix);

    // 4. (Optional) If your plane is not aligned with the world axis, adjust the rotation further
    if (planeNormal) {
        const alignMatrix = new THREE.Matrix4();
        const axis = new THREE.Vector3().crossVectors(faceNormal, planeNormal).normalize();
        const angle = Math.acos(faceNormal.dot(planeNormal) / (faceNormal.length() * planeNormal.length()));
        alignMatrix.makeRotationAxis(axis, angle);
        transformationMatrix.premultiply(alignMatrix);
    }

    return transformationMatrix;
}




function separateFacesByDirection(geometry) {
    const totalFaces = geometry.attributes.position.count / 3;

    // Initialize arrays for faces in different directions
    let positiveX = [];
    let negativeX = [];
    let positiveY = [];
    let negativeY = [];
    let positiveZ = [];
    let negativeZ = [];

    // Iterate through all faces in the geometry
    for (let faceIndex = 0; faceIndex < totalFaces; faceIndex++) {
        // Get face normal
        const faceNormal = getFaceNormal(geometry, faceIndex);
        

        // Categorize faces based on direction
        if (faceNormal.x > 0) positiveX.push(faceIndex);
        else if (faceNormal.x < 0) negativeX.push(faceIndex);
        if (faceNormal.y > 0) positiveY.push(faceIndex);
        else if (faceNormal.y < 0) negativeY.push(faceIndex);
        if (faceNormal.z > 0) positiveZ.push(faceIndex);
        else if (faceNormal.z < 0) negativeZ.push(faceIndex);
    }

    // Return an object containing arrays of face indices for each direction
    return {
        positiveX,
        negativeX,
        positiveY,
        negativeY,
        positiveZ,
        negativeZ
    };
}
function selectOuterFacesAutomatically(geometry) {
    const faces = geometry.attributes.position.count / 3;
    const selectedFaces = new Set();
    const excludedFaces = new Set();

    const processFace = (faceIndex) => {
        if (!excludedFaces.has(faceIndex)) {
            const neighbors = findAllNeighboringFaces(geometry, faceIndex);

            neighbors.forEach(neighborIndex => {
                excludedFaces.add(neighborIndex); // Exclude neighbors from future iterations
            });

            const normal = getFaceNormal(geometry, faceIndex);
            const thresholdMin = 0.8; // Adjust this threshold based on your requirements
            const thresholdMax = 1;

            // Check if the absolute values are within the range [0.9, 1.1]
            if (
                Math.abs(normal.x) >= thresholdMin && Math.abs(normal.x) <= thresholdMax ||
                Math.abs(normal.y) >= thresholdMin && Math.abs(normal.y) <= thresholdMax ||
                Math.abs(normal.z) >= thresholdMin && Math.abs(normal.z) <= thresholdMax
            ) {
                selectedFaces.add(faceIndex);
            }

            neighbors.forEach(processFace); // Recursively process neighbors
        }
    };

    // Start processing faces from the beginning
    for (let i = 0; i < faces; i++) {
        processFace(i);
    }

    return Array.from(selectedFaces);
}

const selectedOuterFaces = selectOuterFacesAutomatically(geometry);
 //onsole.log("Selected Outer Faces:", selectedOuterFaces);
function selectLayFlatFaces(geometry, selectedOuterFaces, angleSet) {
    const selectedFaces = new Set();
    //const excludedFaces = new Set();

    selectedOuterFaces.forEach(selectedFaceIndex => {
        const selectedFaceNormal = getFaceNormal(geometry, selectedFaceIndex);
        // Check if the face normal is within the specified angle set
        if (isAngleInSet(selectedFaceNormal, angleSet)) {
            selectedFaces.add(selectedFaceIndex);
        }
    });

    return Array.from(selectedFaces);
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

    // Adjust for negative angles
    if (degrees < 0) {
        degrees += 360;
    }

    // Round the angle to the nearest integer
    degrees = Math.round(degrees);

    // Check if the calculated angle is in the specified set
    return angleSet.includes(degrees);
}

const angleSet = [0, 45, 90, 135, 180,270];

const selectedLayFlatFacesss = selectLayFlatFaces(geometry,selectedOuterFaces,angleSet );


console.log("Combined Selected Faces:", selectedLayFlatFacesss);

function separateNormalsByAngleSet(geometry, selectLayFlatFaces, angleSet) {
    const separatedNormals = {};

    // Initialize each angle category
    angleSet.forEach(angle => {
        separatedNormals[angle] = { normals: [], faceIndices: [] };
    });

    selectLayFlatFaces.forEach(faceIndex => {
        const normal = getFaceNormal(geometry, faceIndex); // Get the normal of the face

        const angle = calculateAngle(normal); // Calculate the angle of the normal

        // Find the closest angle from the angleSet for categorization
        const closestAngle = angleSet.reduce((prev, curr) => {
            return Math.abs(curr - angle) < Math.abs(prev - angle) ? curr : prev;
        });

        separatedNormals[closestAngle].normals.push(normal);
        separatedNormals[closestAngle].faceIndices.push(faceIndex);

    });

    return separatedNormals;
}

// Function to calculate the angle of a normal
function calculateAngle(normal) {
    // Ensure the normal vector is normalized
    const length = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
    const normalizedNormal = {
        x: normal.x / length,
        y: normal.y / length,
        z: normal.z / length,
    };

    // Calculate the angle in radians using atan2
    const angle = Math.atan2(normalizedNormal.y, normalizedNormal.x);

    // Convert the angle to degrees
    let degrees = (angle * 180) / Math.PI;
    degrees = (degrees + 360) % 360;

    return Math.round(degrees);
}

// Example usage:
 // Provide the face indices from selectLayFlatFaces


const separatedNormals = separateNormalsByAngleSet(geometry, selectedLayFlatFacesss, angleSet);

// Print the separated normals for each angle category
Object.keys(separatedNormals).forEach(angle => {
    console.log(`Normals at angle ${angle} degrees:`, separatedNormals[angle].normals);
    console.log(`Face indices at angle ${angle} degrees:`, separatedNormals[angle].faceIndices);
});







let negibourefaces = [];

function selectedneightbous(selectedFaces, geometry) {
    for (const selectedFaceIndex of selectedFaces) {
        const neighbors = findAllNeighboringFaces(geometry, selectedFaceIndex);
     //negibourefaces.push(neighbors);
     const selectedFaceNormal = getFaceNormal(geometry, selectedFaceIndex);
     //  console.log("gotfacenormal",selectedFaceNormal);
      // const filteredNormals = filterNormalsBySelectedFace(geometry, selectedFaceNormal, neigbourface);
       // console.log('Filtered Normals:', filteredNormals);
  highlightFilteredNormals(geometry, selectedFaceIndex, neighbors);
    }
}

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





//selectedneightbous(selectedLayFlatFaces, geometry);
//console.log("selectedneighbours",negibourefaces )


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
const constantPlaneNormal = new THREE.Vector3(0, 1, 0); // Replace with your constant plane normal

// function calculateRotationMatrix(selectedFaceNormal, constantPlaneNormal) {
//     const axis = new THREE.Vector3().crossVectors(selectedFaceNormal, constantPlaneNormal).normalize();
//     const angle = Math.acos(selectedFaceNormal.dot(constantPlaneNormal) / (selectedFaceNormal.length() * constantPlaneNormal.length()));
//     const rotationMatrix = new THREE.Matrix4();
//     rotationMatrix.makeRotationAxis(axis, angle);
//     console.log("axis",axis,"angle",angle);
//     return rotationMatrix;
// }
function areNormalsSimilar(normal1, normal2, threshold) {
    // Normalize the vectors
    const normalizedNormal1 = normal1.clone().normalize();
    const normalizedNormal2 = normal2.clone().normalize();

    // Calculate the dot product
    const dotProduct = normalizedNormal1.dot(normalizedNormal2);

    // Check if the dot product is above the threshold
    return dotProduct >= threshold;
}


    // Usage example
    function animate() {
        requestAnimationFrame(animate);
        controls.update(); // Update controls in the animation loop
        renderer.render(scene, camera);
    }

    animate();
