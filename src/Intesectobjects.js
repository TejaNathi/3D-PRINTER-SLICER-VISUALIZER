

import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';

// Other imports and code...

// Create scene
//import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.120.1/build/three.module.js';

//import { STLLoader } from 'https://cdn.jsdelivr.net/npm/three@0.120.1/examples/jsm/loaders/STLLoader.js';
//import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { quickHull } from './quickHull.mjs';
import * as layflat from './Layflatnormal.mjs';



const loader = new STLLoader();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight);
camera.position.set(0,10, 100);
camera.lookAt(scene.position);
camera.near = 0.1;
camera.far = 1000;

let shapes=[];

const renderer = new THREE.WebGLRenderer({ depth: true, depthBuffer: true, depthWrite: true, depthTest: true });

renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
// Add a plane to the scene
const planeGeometry = new THREE.PlaneGeometry(100, 100,10,10);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, wireframe: true });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.visible=true;
plane.rotation.x = Math.PI / 2; // Rotate the plane to be horizontal
plane.position.y = 0; // Adjust the position of the plane
scene.add(plane);
console.log("pale",plane.position,plane)
// const faceIndex = 0; // You can change this index based on your requirements
// const faceNormal = new THREE.Vector3();
// planeGeometry.faces[faceIndex].normal.clone(faceNormal);


const constantPlaneNormal = new THREE.Vector3(0, -1, 0);
// //var controls = new THREE.OrbitControls( camera, renderer.domElement );
const controls = new OrbitControls(camera, renderer.domElement);
 controls.enableDamping = true;

const circleGeometry = new THREE.CircleGeometry(30, 50); // Radius: 50, Segments: 32
const circleMaterial = new THREE.LineBasicMaterial({ color: 0xff0000,linewidth:1});
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


let convexMesh=null;
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
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: false });
     meshes = new THREE.Mesh(geometry, material);
    meshes.position.set(0, 0, 0);
    scene.add(meshes);
    geometrys=meshes.geometry;

    const verticess = geometry.attributes.position.array;
      const points = [];

      // Convert flat array to array of Vector3
      for (let i = 0; i < verticess.length; i += 3) {
        points.push(new THREE.Vector3(verticess[i], verticess[i + 1], verticess[i + 2]));
      }

      const convexGeometry = new ConvexGeometry(points);
      convexMesh = new THREE.Mesh(convexGeometry, new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true }));
      scene.add(convexMesh);
      convexMesh.visible=false;
      console.log("convemesh",convexMesh);
      convexGeometry.setAttribute('color', geometry.getAttribute('normal').clone());
      const projectedVertices = getProjectedVertices(geometry);
      const convexHull = computeConvexHull(projectedVertices);
      visualizeConvexHull(convexHull);


    //   nor = geometry.getAttribute('normal');
    //   pos = geometry.getAttribute('position');
     // col = geometry.getAttribute('color');

      console.log("color"   , convexGeometry);
   
if(geometrys!=null){
    // Assuming 'mesh' is your three.js mesh object
boundingBox = new THREE.Box3().setFromObject(meshes);
console.log("gemeotry",geometrys);

const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const wireframeGeometry = new THREE.BoxGeometry(
  boundingBox.max.x - boundingBox.min.x,
  boundingBox.max.y - boundingBox.min.y,
  boundingBox.max.z - boundingBox.min.z
  
);
boundingBoxMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);


boundingBox.getCenter(boundingBoxCenter);
boundingBoxMesh.position.copy(boundingBoxCenter);
// Add the bounding box to the scene
scene.add(boundingBoxMesh);
boundingBoxMesh.visible=false;
    const selectedOuterFaces =layflat.selectOuterFacesAutomatically(convexMesh.geometry);
    console.log("Selected Outer Faces:", selectedOuterFaces);
  selectedNeighbours(convexMesh.geometry,selectedOuterFaces);


setTimeout(() => {
    const intersectedresults = raycastFaces(finalMergedMesh.geometry, selectedOuterFaces, meshes, 0.1);
    largestNeighbors =findLargestNeighborIndex(finalMergedMesh.geometry, intersectedresults);
  
    

    
},1000);
 
    }
    meshes.userData = { file };


        fileInput.value = '';
       
    
    
        });}
        

// Handle mesh cloning
// document.getElementById('cloneButton').faddEventListener('click', function () {
//     if (selectedMesh) {
//         const clonedMesh = selectedMesh.clone();
//         clonedMesh.position.x += 2;
//         scene.add(clonedMesh);
//     }
// });
document.getElementById('Autoplace').addEventListener('click', function () {
 autoplace(finalMergedMesh,meshes,largestNeighbors);

});




function getProjectedVertices(geometry) {
    const positions = geometry.attributes.position.array;
    const projectedVertices = [];

    for (let i = 0; i < positions.length; i += 3) {
        // Project onto the XZ plane (ignore Y coordinate)
        projectedVertices.push(new THREE.Vector2(positions[i], positions[i + 2]));
    }

    return projectedVertices;
}

function computeConvexHull(points) {
    points.sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);

    const lower = [];
    for (let point of points) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
            lower.pop();
        }
        lower.push(point);
    }

    const upper = [];
    for (let i = points.length - 1; i >= 0; i--) {
        const point = points[i];
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
            upper.pop();
        }
        upper.push(point);
    }

    upper.pop();
    lower.pop();
    return lower.concat(upper);
}

function cross(o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function visualizeConvexHull(hullPoints) {
    const geometry = new THREE.BufferGeometry().setFromPoints(hullPoints);
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const line = new THREE.LineLoop(geometry, material);
    line.rotation.x = Math.PI / 2;  // Rotate to align with the XZ plane
    scene.add(line);
    shapes.push(line);
    console.log("shapein the bin",shapes);
}


   
  // window.addEventListener('click', onMouseClick, false);
    

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
            
            var neigbourface = findAllNeighboringFaces(finalMergedMesh.geometry, selectedFaceIndex);
        console.log("facess", neigbourface);
        const selectedFaceNormal = getFaceNormal(finalMergedMesh.geometry, selectedFaceIndex);
        console.log("gotfacenormal",selectedFaceNormal);
        const normalss = getFaceNormal(finalMergedMesh.geometry,selectedFaceIndex);
        const angless= isAngleInSet(normalss, angleSet);
        
        console.log("angles",angless);
        }
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
    
    
// Function to create a line geometry between two points
function createLineGeometry(startPoint, endPoint) {
    const points = [startPoint, endPoint];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
}

// Function to add intersection point lines to the scene
function addIntersectionPointLines(intersectionPointsArray) {
    const linesGroup = new THREE.Group();

    // Iterate over each array of intersection points
    for (const intersectionPoints of intersectionPointsArray) {
        // Ensure there are at least two points to create a line
        if (intersectionPoints.length < 2) {
            continue;
        }

        // Create a single line geometry for the entire array of intersection points
        const points = [];
        for (let i = 0; i < intersectionPoints.length; i++) {
            const point = intersectionPoints[i];
            points.push(point.x, point.y, point.z);

            // Connect the last point to the first point to form a closed loop
            if (i === intersectionPoints.length - 1) {
                const firstPoint = intersectionPoints[0];
                points.push(firstPoint.x, firstPoint.y, firstPoint.z);
            }
        }

        const lineGeometry = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Adjust the color as needed
        const line = new THREE.Line(lineGeometry, lineMaterial);
        linesGroup.add(line);
    }

    // Add the lines group to the scene
    scene.add(linesGroup);
}



// Example usage



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
        meshes.verticesNeedUpdate=true;
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
        const rect = renderer.domElement.getBoundingClientRect();

        // Adjust mouse coordinates based on renderer position
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Get the center of the renderer
        const centerX = renderer.domElement.width / 2;
        const centerY = renderer.domElement.height / 2;

        // Calculate delta from the center
        const deltaX = mouseX - centerX;
        const deltaY = mouseY - centerY;

        // Convert delta to polar coordinates
        const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX);

        // Update the rotation angle
        const rotationSpeed = 0.01;
        boundingBoxMesh.rotateOnWorldAxis(rotationAxis, angle * rotationSpeed);

      

        // Save current mouse position for next frame
        previousMousePosition = { x: mouseX, y: mouseY };
    }
}




// Enable OrbitControls on mouseup
function onMouseUp() {
    isrotating = false;
  geometrys.verticesNeedUpdate=true
    geometrys.normalsNeedUpdate=true;
    convexMesh.geometry.verticesNeedUpdate=true;
    convexMesh.normalsNeedUpdate=true;
    finalMergedMesh.geometry.verticesNeedUpdate=true;
    finalMergedMesh.geometry.normalsNeedUpdate=true;

    
  
               
                meshes.updateMatrixWorld();
                convexMesh.updateMatrixWorld();
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
            console.log("Before update:",meshes.geometry);
            // Restrict the movement within the plane boundaries
            const halfPlaneSize = 50; // Assuming the plane size is 200x200
            meshes.position.x = THREE.MathUtils.clamp(newX, -halfPlaneSize, halfPlaneSize);
            meshes.position.z = THREE.MathUtils.clamp(newZ, -halfPlaneSize, halfPlaneSize);
            meshes.updateMatrixWorld();
            meshes.geometry.verticesNeedUpdate=true
                 meshes.geometry.normalsNeedUpdate = true;
                 meshes.geometry.positionNeedUpdate=true;

            // Update the geometry and bounding box
            geometrys.verticesNeedUpdate = true;
            geometrys.normalsNeedUpdate = true;
            geometrys.positionNeedUpdate = true;
            convexMesh.verticesNeedUpdate = true;
            convexMesh.normalsNeedUpdate = true;
            convexMesh.positionNeedUpdate = true;
            geometrys.attributes.position.needsUpdate = true;
            // Mark the positions buffer attribute as needing update
            positions.needsUpdate = true;
         
            
           // meshes.updateMatrixWorld();
            finalMergedMesh.position.copy(meshes.position);
            boundingBox.setFromObject(meshes);
            boundingBox.getCenter(boundingBoxCenter);
            boundingBoxMesh.position.copy(boundingBoxCenter);
            meshes.updateMatrixWorld();
            meshes.geometry.verticesNeedUpdate=true
                 meshes.geometry.normalsNeedUpdate = true;
                 meshes.geometry.positionNeedUpdate=true;
                 finalMergedMesh.updateMatrixWorld();
        
                 finalMergedMesh.updateMatrixWorld();
        finalMergedMesh.geometry.attributes.position.needsUpdate = true;
        finalMergedMesh.geometry.normalsNeedUpdate = true;
        finalMergedMesh.geometry.positionNeedUpdate = true;
                 console.log("finaled",finalMergedMesh.geometry.attributes.position);
   // Update the geometry and bounding box
   finalMergedMesh.geometry.attributes.position.needsUpdate = true;
   finalMergedMesh.geometry.computeVertexNormals(); // Optional: Update normals
   
            createAxesLines(meshes);
        }
    }
}
// Create a circle geometry


// Enable OrbitControls on mouseup
function onup() {
    isDragging = false;
  //  meshes.verticesNeedUpdate=true
  //  meshes.normalsNeedUpdate=true;
    boundingBox.setFromObject(meshes);
    boundingBox.getCenter(boundingBoxCenter);
    boundingBoxMesh.position.copy(boundingBoxCenter);

    meshes.updateMatrixWorld();
    
    meshes.geometry.verticesNeedUpdate=true
         meshes.geometry.normalsNeedUpdate = true;
         meshes.geometry.positionNeedUpdate=true;
         finalMergedMesh.updateMatrixWorld();

         finalMergedMesh.geometry.verticesNeedUpdate=true;
         finalMergedMesh.geometry.normalsNeedUpdate=true;
 
   
  //  console.log("needupdate", finalMergedMesh.geometry.normalsNeedUpdate);


    

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

    
   // Function to calculate intersection points between a slicing plane and a triangle
// Function to calculate intersection points for all faces in the geometry
// Function to calculate intersection points for all faces in the geometry
function calculateAllIntersectionPoints(geometry, slicingHeight) {
    const numFaces = geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
    const intersectionPointsArray = [];

    for (let i = 0; i < numFaces; i++) {
        // Get vertices of the triangle
        const vertices = getFaceVertices(geometry, i);
        const vertex1 = vertices[0];
        const vertex2 = vertices[1];
        const vertex3 = vertices[2];

        const intersectionPoints = [];

        // Check intersection of each edge with slicing plane
        const edges = [[vertex1, vertex2], [vertex2, vertex3], [vertex3, vertex1]];
        for (let j = 0; j < 3; j++) {
            const edge = edges[j];
            const edgeVertex1 = edge[0];
            const edgeVertex2 = edge[1];

            // Check if vertices are on opposite sides of the slicing plane
            if ((edgeVertex1.y >= slicingHeight && edgeVertex2.y <=slicingHeight) || (edgeVertex2.y >= slicingHeight && edgeVertex1.y <= slicingHeight)) {
                const t = (slicingHeight - edgeVertex1.y) / (edgeVertex2.y - edgeVertex1.y);
                const intersectionX = edgeVertex1.x + (edgeVertex2.x - edgeVertex1.x) * t;
                const intersectionZ = edgeVertex1.z + (edgeVertex2.z - edgeVertex1.z) * t;
                intersectionPoints.push(new THREE.Vector3(intersectionX, slicingHeight, intersectionZ));
                
            }
        }

        // Only push intersection points for current face to the array
        if (intersectionPoints.length > 0) {
            intersectionPointsArray.push(intersectionPoints);
        }
    }

    return intersectionPointsArray;
}


// Assuming you have a Three.js scene initialized

// Function to create a dot geometry
function createDotGeometry() {
    const dotGeometry = new THREE.SphereGeometry(0.05); // Adjust the radius as needed
    const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Adjust the color as needed
    return new THREE.Mesh(dotGeometry, dotMaterial);
}

// Function to add intersection point dots to the scene
function addIntersectionPointDots(intersectionPointsArray) {
    const dotsGroup = new THREE.Group();

    // Iterate over each array of intersection points
    for (const intersectionPoints of intersectionPointsArray) {
        // Iterate over each intersection point in the array
        for (const intersectionPoint of intersectionPoints) {
            // Create a dot geometry at the intersection point
            const dot = createDotGeometry();
            dot.position.copy(intersectionPoint);
            dotsGroup.add(dot);
        }
    }

    // Add the dots group to the scene
    scene.add(dotsGroup);
}





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
    function mergeGeometriesWithGroups(geometries, materials) {
        const mergedGeometry = new THREE.BufferGeometry();
    
        const positionArrays = [];
        const normalArrays = [];
        const groups = [];
    
        let vertexOffset = 0;
    
        // Extract attributes and groups from each geometry
        geometries.forEach((geometry, index) => {
            const positions = geometry.getAttribute('position').array;
            const normals = geometry.getAttribute('normal').array;
            const material = materials[index];
    
            // Calculate the number of vertices in the geometry
            const numVertices = positions.length / 3;
    
            // Create a group for the current geometry
            groups.push({
                start: vertexOffset,
                count: numVertices,
                materialIndex: index,
            });
    
            // Increment the vertex offset for the next geometry
            vertexOffset += numVertices;
    
            positionArrays.push(positions);
            normalArrays.push(normals);
        });
    
        // Merge position attributes
        const mergedPositionArray = new Float32Array(positionArrays.reduce((acc, arr) => acc.concat(Array.from(arr)), []));
        mergedGeometry.setAttribute('position', new THREE.BufferAttribute(mergedPositionArray, 3));
    
        // Merge normal attributes
        const mergedNormalArray = new Float32Array(normalArrays.reduce((acc, arr) => acc.concat(Array.from(arr)), []));
        mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(mergedNormalArray, 3));
    
        // Set groups in the merged geometry
        mergedGeometry.groups = groups;
    
        return mergedGeometry;
    }
    

    
    function mergeMeshes(meshes) {
        const geometries = meshes.map(mesh => mesh.geometry);
        const materials = meshes.map(mesh => new THREE.MeshBasicMaterial()); // You can customize material creation if needed
        const mergedGeometry = mergeGeometriesWithGroups(geometries, materials);
    
        // If you want to use a single material for the entire merged mesh, you can use the following:
        // const mergedMaterial = new THREE.MeshBasicMaterial({
        //     color: 0xffffff,
        //     transparent: true,
        //     opacity: 0.5,
        //     depthWrite: false,
        //     polygonOffset: true,
        //     polygonOffsetFactor: -2,
        //     polygonOffsetUnits: -2,
        // });
        
        // If you want to use different materials for each group, you can use the following:
        const mergedMaterials = materials.map(material => new THREE.MeshBasicMaterial({           color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2,


    })); // Customize material creation if needed
        const mergedMesh = new THREE.Mesh(mergedGeometry, mergedMaterials);
    
        return mergedMesh;
    }
    
    
    function insetGeometry(geometry, insetAmount) {
        const positions = geometry.attributes.position.array;
    
        for (let i = 0; i < positions.length; i += 9) {
            // Calculate the face center
            const centerX = (positions[i] + positions[i + 3] + positions[i + 6]) / 3;
            const centerY = (positions[i + 1] + positions[i + 4] + positions[i + 7]) / 3;
            const centerZ = (positions[i + 2] + positions[i + 5] + positions[i + 8]) / 3;
    
            // Move the vertices of the face inward to achieve the inset effect
            for (let j = 0; j < 9; j += 3) {
                positions[i + j] += Math.min((centerX - positions[i + j]) * insetAmount, 0.5);
                positions[i + j + 1] += Math.min((centerY - positions[i + j + 1]) * insetAmount, 0.5);
                positions[i + j + 2] += Math.min((centerZ - positions[i + j + 2]) * insetAmount, 0.5);
            }
        }
    
        // Update the attributes of the geometry
        geometry.attributes.position.needsUpdate = true;
        // geometry.computeFaceNormals();
        // geometry.computeVertexNormals();
    }
    
    
    function highlightFilteredNormals(geometry, selectedFaceIndex, filteredNormals, mergedMesh) {
        const positions = geometry.attributes.position.array;
        const normals = geometry.attributes.normal.array;
    
        const geometries = [];
        const materials = [];
    
        // Add the selected face geometry
        const selectedFaceStart = selectedFaceIndex * 9;
        const selectedFaceEnd = selectedFaceStart + 9;
        const selectedFaceGeometry = new THREE.BufferGeometry();
        selectedFaceGeometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(selectedFaceStart, selectedFaceEnd), 3));
        selectedFaceGeometry.setAttribute('normal', new THREE.BufferAttribute(normals.slice(selectedFaceStart, selectedFaceEnd), 3));
        geometries.push(selectedFaceGeometry);
    
        // Create a new material for the selected face
        const selectedMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
        });
        materials.push(selectedMaterial);
    
        // Apply inset effect to the selected face
        insetGeometry(selectedFaceGeometry, 0.05);
    
        // Add filtered faces geometries
        filteredNormals.forEach((faceIndex) => {
            const startIndex = faceIndex * 9;
            const endIndex = startIndex + 9;
    
            const faceGeometry = new THREE.BufferGeometry();
            faceGeometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(startIndex, endIndex), 3));
            faceGeometry.setAttribute('normal', new THREE.BufferAttribute(normals.slice(startIndex, endIndex), 3));
    
            if (!containsNaN(faceGeometry.attributes.position.array) && !containsNaN(faceGeometry.attributes.normal.array)) {
                // Apply inset effect to each face individually
                insetGeometry(faceGeometry, 0.05);
                geometries.push(faceGeometry);
    
                // Create a new material for each filtered face
                const filteredMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.05,
                    depthWrite: false,
                    polygonOffset: true,
                    polygonOffsetFactor: -1,
                    polygonOffsetUnits: -1,
                });
                materials.push(filteredMaterial);
            }
        });
    
        // Merge all geometries into a single geometry
        const mergedGeometry = mergeGeometries(geometries);
    
        // Create a new mesh with the merged geometry and inset effect
        const mergedMeshMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
        });
        const mergedMeshWithInset = new THREE.Mesh(mergedGeometry, materials);
    
        // Set material indices for the selected face and filtered faces
        setMaterialIndices(mergedMeshWithInset, selectedFaceIndex, filteredNormals);
    
        mergedMesh.push(mergedMeshWithInset);
    }
    
    
    function setMaterialIndices(mesh, selectedFaceIndex, filteredNormals) {
        const indices = new Float32Array(mesh.geometry.attributes.position.count);
    
        // Set material index for the selected face
        for (let i = selectedFaceIndex * 3 * 3; i < (selectedFaceIndex + 1) * 3 * 3; i += 3) {
            indices[i] = 0;
            indices[i + 1] = 0;
            indices[i + 2] = 0;
        }
    
        // Set material indices for the filtered faces
        filteredNormals.forEach((faceIndex, index) => {
            for (let i = faceIndex * 3 * 3; i < (faceIndex + 1) * 3 * 3; i += 3) {
                indices[i] = index + 1;
                indices[i + 1] = index + 1;
                indices[i + 2] = index + 1;
            }
        });
    
        mesh.geometry.setAttribute('materialIndex', new THREE.BufferAttribute(indices, 1));
       
    }
    
    
        
        // Usage
        
        
let normalSum=null;
let isMouseDownEventAttached = false;

let translationApplied = false;
function applyTranslationToObject(object) {
    // Extract the current position components from the object
    const currentX = object.position.x;
    const currentY = object.position.y;
    const currentZ = object.position.z;

    // Extract the translation components from the object's matrix
    const translationMatrix = new THREE.Matrix4().copy(object.matrix);
    const translation = new THREE.Vector3();
    translationMatrix.decompose(new THREE.Vector3(), new THREE.Quaternion(), translation);

    // Apply the translation to the geometry's position attribute directly
    const positionAttribute = object.geometry.getAttribute("position");
    const positions = positionAttribute.array;

    for (let i = 0; i < positions.length; i += 3) {
        positions[i] += translation.x - currentX;
        positions[i + 1] += translation.y - currentY;
        positions[i + 2] += translation.z - currentZ;
    }


    // Reset the object's position to its current position
    object.updateMatrixWorld(true);

    // Mark the position attribute as needing an update
    positionAttribute.needsUpdate = true;
    object.geometry.computeVertexNormals(); 

    object.position.set(0, 0, 0);
    
   // Optional: Update normals
}




document.getElementById('layflat').addEventListener('click', function () {
    
    if (!isMouseDownEventAttached) {
        document.addEventListener('mousedown', onMouseClicksss, false);
        isMouseDownEventAttached = true;
        finalMergedMesh.visible = true;
    } else {
        document.removeEventListener('mousedown', onMouseClicksss, false);
        isMouseDownEventAttached = false;
        convexMesh.visible = false;
        finalMergedMesh.visible = false;
      
   
    }
});

document.addEventListener('mousemove',onhighlight);

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






let highlightedFaceMeshes = []; // Assuming you maintain an array of highlighted face meshes

function resetPreviousSelection() {
    // Iterate over each highlighted face mesh
    highlightedFaceMeshes.forEach(highlightedFaceMesh => {
        // Remove the highlighted face mesh from the scene
        scene.remove(highlightedFaceMesh);
        // Optionally, dispose of the geometry and material to free up resources
        highlightedFaceMesh.geometry.dispose();
        highlightedFaceMesh.material.dispose();
    });

    // Clear the array of highlighted face meshes
    highlightedFaceMeshes = [];
}


// Function to highlight selected face
function highlightSelectedFace(mesh,faceIndices) {
    resetPreviousSelection();
         highlightedFaceMeshes = [];
    
        // Iterate over each face index
        faceIndices.forEach(faceIndex => {
            // Create a new geometry for the highlighted face
            const geometrys = new THREE.BufferGeometry();
            const positions = mesh.geometry.attributes.position.array;
            const normals = mesh.geometry.attributes.normal.array;
    
            // Extract the vertices of the selected face
            const startIndex = faceIndex * 9;
            const endIndex = startIndex + 9;
            const faceVertices = positions.slice(startIndex, endIndex);
            const faceNormals = normals.slice(startIndex, endIndex);
    
            // Set the position and normal attributes for the highlighted face
            geometrys.setAttribute('position', new THREE.BufferAttribute(new Float32Array(faceVertices), 3));
            geometrys.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(faceNormals), 3));
    
            // Create a new material for highlighting (e.g., red color)
            const highlightMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,

                depthWrite: false,
                polygonOffset: true,
                polygonOffsetFactor:- 1,
                polygonOffsetUnits: -1,
            });
            
    
            // Create a mesh with the highlighted face geometry and material
            const highlightedFaceMesh = new THREE.Mesh(geometrys, highlightMaterial);
    
            // Add the highlighted face mesh to the array
            highlightedFaceMeshes.push(highlightedFaceMesh);
    
            // Add the highlighted face mesh to the scene
            scene.add(highlightedFaceMesh);
        });
    
        // Return the array of highlighted face meshes
        return highlightedFaceMeshes;
    }
    

    let originalMaterials = null;

function onhighlight(event) {
    event.preventDefault();
    if (isMouseDownEventAttached) {
        const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const rect = renderer.domElement.getBoundingClientRect();

// Adjust mouse coordinates based on renderer position
mouse.x = ((event.clientX - rect.left) / window.innerWidth) * 2 - 1;
mouse.y = -((event.clientY - rect.top) / window.innerHeight) * 2 + 1;

        // Set up the raycaster
        raycaster.setFromCamera(mouse, camera);

        // Find intersected faces
        const intersects = raycaster.intersectObject(finalMergedMesh);

        // Check if there is an intersection
        if (intersects.length > 0) {
            // Get the face index
            const faceIndex = intersects[0].faceIndex*3;
            console.log("highlightfaceinject",faceIndex);
              
        changeFaceMaterial(finalMergedMesh, faceIndex);
           
    }
    else {
        // Restore original materials if the mouse is not over the mesh
        restoreOriginalMaterials(finalMergedMesh);
    }
}
}
function changeFaceMaterial(mesh, faceIndex) {
    // Store the original materials if not already stored
    if (!originalMaterials) {
        originalMaterials = mesh.material.map(material => material.clone());
    }

    // Assuming mergedMesh has a BufferGeometry with groups
    const groups = mesh.geometry.groups;

    // Find the group that corresponds to the faceIndex
    const group = groups.find(group => faceIndex >= group.start && faceIndex < group.start + group.count);

    // Check if the group is found
    if (group) {
        // Update the material for the specific group
        mesh.material[group.materialIndex].color.set(0xff0000); // Set your desired color
    }
}

function restoreOriginalMaterials(mesh) {
    // Restore the original materials
    if (originalMaterials) {
        mesh.material.forEach((material, index) => {
            material.copy(originalMaterials[index]);
        });

        originalMaterials = null; // Reset originalMaterials after restoration
    }
}





let transformationMatrixss =null;

function onMouseClicksss(event) {
    event.preventDefault();
    const rect = renderer.domElement.getBoundingClientRect();

    // Adjust mouse coordinates based on renderer position
    mouse.x = ((event.clientX - rect.left) / window.innerWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(finalMergedMesh,true);

    if (intersects.length > 0) {
        selectedFaceIndex = intersects[0].faceIndex;
        console.log('Selected Face Index:', selectedFaceIndex);
        const beforroation=  getFacePositions(finalMergedMesh.geometry, selectedFaceIndex, finalMergedMesh);
       console.log("beforerotationface",beforroation);
       const highneibour=findAllNeighboringFaces(finalMergedMesh.geometry,selectedFaceIndex);
       console.log("neiboashighlight",highneibour);
        
       meshes.rotation.set(0, 0, 0);
       finalMergedMesh.rotation.set(0, 0, 0);

        let selectedFaceNormals =getFaceNormal(finalMergedMesh.geometry, selectedFaceIndex);
        console.log('Selected Face Normals:', selectedFaceNormals);
        meshes.updateMatrixWorld();
        meshes.geometry.verticesNeedUpdate=true
        meshes.geometry.normalsNeedUpdate = true;
        meshes.geometry.positionNeedUpdate=true;
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
        meshes.geometry.applyMatrix4(combinedMatrixss);

    // meshes.updateMatrixWorld();
    const afeterrotation=  getFacePositions(finalMergedMesh.geometry, selectedFaceIndex,finalMergedMesh);
   // console.log("afterrotation",afeterrotation);
    const afeterrotations=  getFacePositions(meshes.geometry, selectedFaceIndex,meshes);
   // console.log("afterrotation",afeterrotations);
    meshes.updateMatrixWorld();
   meshes.geometry.verticesNeedUpdate=true
        meshes.geometry.normalsNeedUpdate = true;
        meshes.geometry.positionNeedUpdate=true;
        finalMergedMesh.geometry.verticesNeedUpdate=true;
        finalMergedMesh.geometry.normalsNeedUpdate=true;
    
    finalMergedMesh.updateMatrixWorld();
    transformationMatrixss = new THREE.Matrix4().copy(finalMergedMesh.matrix);
    transformationMatrixsss = new THREE.Matrix4().copy(meshes.matrix);
    //console.log("afterrotationmatrix",transformationMatrixss);
    let transformations = calculateTransformationMatrixs(selectedFaceIndex,plane, finalMergedMesh,afeterrotation);

    let transformation = calculateTransformationMatrixs(selectedFaceIndex,plane, meshes,afeterrotations);
    
    const combinedMatrixs = new THREE.Matrix4().multiplyMatrices( transformationMatrixss, transformations);
    const combinedMatrixsss = new THREE.Matrix4().multiplyMatrices( transformationMatrixsss,transformation);
    
    //console.log("combined matr",combinedMatrixs);
    
    finalMergedMesh.geometry.applyMatrix4(combinedMatrixs);
    geometrys.applyMatrix4(combinedMatrixs);

   // meshes.updateMatrixWorld();
    // geometrys.verticesNeedUpdate=true
    // geometrys.normalsNeedUpdate=true;
    // geometrys.positionNeedYpdate=true;
    meshes.updateMatrixWorld();
    meshes.geometry.verticesNeedUpdate=true
        meshes.geometry.normalsNeedUpdate = true;
        meshes.geometry.positionNeedUpdate=true;
        finalMergedMesh.geometry.verticesNeedUpdate=true;
        finalMergedMesh.geometry.normalsNeedUpdate=true;
    
    finalMergedMesh.updateMatrixWorld();
               
     console.log("finalpostionoffinalmeregedmesh",finalMergedMesh);
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


function autoplace(finalMergedMesh,meshes, selectedFaceIndex){

    const beforroation=  getFacePositions(finalMergedMesh.geometry, selectedFaceIndex, finalMergedMesh);
    console.log("beforerotationface",beforroation);
    const highneibour=findAllNeighboringFaces(finalMergedMesh.geometry,selectedFaceIndex);
    console.log("neiboashighlight",highneibour);
     
    meshes.rotation.set(0, 0, 0);
    finalMergedMesh.rotation.set(0, 0, 0);

     let selectedFaceNormals =getFaceNormal(finalMergedMesh.geometry, selectedFaceIndex);
     console.log('Selected Face Normals:', selectedFaceNormals);
     meshes.updateMatrixWorld();
     meshes.geometry.verticesNeedUpdate=true
     meshes.geometry.normalsNeedUpdate = true;
     meshes.geometry.positionNeedUpdate=true;
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
     meshes.geometry.applyMatrix4(combinedMatrixss);

 // meshes.updateMatrixWorld();
 const afeterrotation=  getFacePositions(finalMergedMesh.geometry, selectedFaceIndex,finalMergedMesh);
// console.log("afterrotation",afeterrotation);
 const afeterrotations=  getFacePositions(meshes.geometry, selectedFaceIndex,meshes);
// console.log("afterrotation",afeterrotations);
 meshes.updateMatrixWorld();
meshes.geometry.verticesNeedUpdate=true
     meshes.geometry.normalsNeedUpdate = true;
     meshes.geometry.positionNeedUpdate=true;
     finalMergedMesh.geometry.verticesNeedUpdate=true;
     finalMergedMesh.geometry.normalsNeedUpdate=true;
 
 finalMergedMesh.updateMatrixWorld();
 transformationMatrixss = new THREE.Matrix4().copy(finalMergedMesh.matrix);
 transformationMatrixsss = new THREE.Matrix4().copy(meshes.matrix);
 //console.log("afterrotationmatrix",transformationMatrixss);
 let transformations = calculateTransformationMatrixs(selectedFaceIndex,plane, finalMergedMesh,afeterrotation);

 let transformation = calculateTransformationMatrixs(selectedFaceIndex,plane, meshes,afeterrotations);
 
 const combinedMatrixs = new THREE.Matrix4().multiplyMatrices( transformationMatrixss, transformations);
 const combinedMatrixsss = new THREE.Matrix4().multiplyMatrices( transformationMatrixsss,transformation);
 
 //console.log("combined matr",combinedMatrixs);
 
 finalMergedMesh.geometry.applyMatrix4(combinedMatrixs);
 geometrys.applyMatrix4(combinedMatrixs);

// meshes.updateMatrixWorld();
 // geometrys.verticesNeedUpdate=true
 // geometrys.normalsNeedUpdate=true;
 // geometrys.positionNeedYpdate=true;
 meshes.updateMatrixWorld();
 meshes.geometry.verticesNeedUpdate=true
     meshes.geometry.normalsNeedUpdate = true;
     meshes.geometry.positionNeedUpdate=true;
     finalMergedMesh.geometry.verticesNeedUpdate=true;
     finalMergedMesh.geometry.normalsNeedUpdate=true;
 
 finalMergedMesh.updateMatrixWorld();
            
  console.log("finalpostionoffinalmeregedmesh",finalMergedMesh);
             boundingBox.setFromObject(meshes);
             boundingBox.getCenter(boundingBoxCenter);
             boundingBoxMesh.position.copy(boundingBoxCenter);
             boundingBoxMesh.rotation.copy(meshes.rotation);
            



            // resetMeshOrigin(meshes, boundingBox)

             createAxesLines(meshes);
              
 transformationMatrixss = new THREE.Matrix4().copy(finalMergedMesh.matrix);
 transformationMatrixsss = new THREE.Matrix4().copy(meshes.matrix);
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

    mesh.updateMatrixWorld();
    const planeNormal = new THREE.Vector3(0, -1, 0);
    const planePosition = planeMesh.position;
    console.log("facetransformation",planePosition);

    // Calculate the vector from the face position to a point on the plane
    const vectorToPlane = new THREE.Vector3().subVectors(facePosition, planePosition);
    
    // Project the vector onto the plane's normal to find the distance to the plane
    const distanceToPlane = (vectorToPlane.dot(planeNormal))*2;
    console.log("distanceto the plane",distanceToPlane );
    

    // Get the vertices of the selected face
    const faceVertices = getFaceVertices(mesh.geometry, faceIndex);
    console.log("faceposition",faceVertices);
    const faceBoundingBox = new THREE.Box3().setFromObject(mesh);

    // Calculate the center of the bounding box
    const boundingBoxCenter = new THREE.Vector3();
    faceBoundingBox.getCenter(boundingBoxCenter);
    console.log("bouanklsdlfnansd",boundingBox);
    console.log("meshesd",mesh)

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
let results=null;
let largestNeighbors=null;


function selectedNeighbours(geometry, selectedOuterFaces) {
    let mergedMeshes = [];
    const faceMaterials = [];
   
    
    
    
    
    for (const selectedFaceIndex of selectedOuterFaces) {
        const normal = getFaceNormal(geometry, selectedFaceIndex);
        const neighbors = findAllNeighboringFaces(geometry, selectedFaceIndex);

    
     
         highlightFilteredNormals(geometry, selectedFaceIndex, neighbors,mergedMeshes);
        
    }

   


    // Merge all the merged meshes into a single mesh
    finalMergedMesh = mergeMeshes(mergedMeshes);
    finalMergedMesh.faceMaterials = faceMaterials;

    // Add the final merged mesh to the scene
    scene.add(finalMergedMesh);

//   const intersectedresults=  raycastFaces(finalMergedMesh.geometry, selectedOuterFaces, meshes, 0.1);
//   console.log("intsdsjjfjadsf",intersectedresults.selectedFaceIndex);
 

//   largestNeighbors = findLargestNeighborIndices(finalMergedMesh.geometry,   intersectedresults);
    
}



function findLargestNeighborIndex(geometry, intersectionResults) {
    let largestNeighbor = -1; // Initialize with an invalid index
    let largestSize = 0; // Initialize with a size of 0

    for (const result of intersectionResults) {
        const selectedFaceIndex = result.selectedFaceIndex;
        const neighborIndices = result.neighborIndices;
        
        const dimensions = findCombinedFaceDimensions(geometry, neighborIndices, selectedFaceIndex);
        const combinedSize = calculateSizeFromDimensions(dimensions);
        console.log("faceindex", selectedFaceIndex, combinedSize);

        if (combinedSize > largestSize) {
            largestSize = combinedSize;
            largestNeighbor = selectedFaceIndex;
        }
    }
    
    console.log("largestnode", largestNeighbor);
    return largestNeighbor;
}






function calculateSizeFromDimensions(dimensions){
    const area =dimensions.width+dimensions.height+dimensions.depth;
    return area;


}


function raycastFaces(geometry, selectedOuterFaces, originalMeshgeometry, threshold) {
    const raycasters = new THREE.Raycaster();
    const intersectionResults = [];

    for (const selectedFaceIndex of selectedOuterFaces) {
        // Create a copy of the face's normal to invert it
        let invertedNormal = getFaceNormal(geometry, selectedFaceIndex);
        invertedNormal.negate();
let neigboured=null;
        // Create a vector representing the face's position
        const facePosition = getFacePosition(geometry, selectedFaceIndex);

        raycasters.set(facePosition, invertedNormal);

        // Get the intersection point and face index on the original mesh
        const intersection = raycasters.intersectObject(originalMeshgeometry, true);
       
        if (intersection.length > 0) {
            const distance = getDistance(intersection[0].point, facePosition);

            if (distance <= threshold) {
                const neighbors = findAllNeighboringFaces(geometry, selectedFaceIndex);
                intersectionResults.push({ selectedFaceIndex, neighborIndices: neighbors });
                continue;
            }
          
        }
        else{
            neigboured = findAllNeighboringFaces(geometry, selectedFaceIndex);

        const neighborIndices = [];

        for (const neighborIndex of neigboured) {
            const neighborFacePosition = getFacePosition(geometry, neighborIndex);
            const invertedNormals = getFaceNormal(geometry, neighborIndex);
            invertedNormal.negate();
            raycasters.set(neighborFacePosition, invertedNormals);

            const neighborIntersection = raycasters.intersectObject(originalMeshgeometry, true);

            if (neighborIntersection.length > 0) {
                const neighborDistance = getDistance(neighborIntersection[0].point, neighborFacePosition);
                if (neighborDistance <= threshold) {
                    neighborIndices.push(neighborIndex);
                }
            }
        }

        if (neighborIndices.length > 0) {
            intersectionResults.push({ selectedFaceIndex, neighborIndices });
        }
    }}

    return intersectionResults;
}


// Additional helper functions
function getIntersectedFaceIndex(intersection) {
    // Assuming the intersection object contains a reference to the face index
    return intersection.faceIndex;
}

function getDistance(point1, point2) {
    // Calculate the distance between two points using Euclidean distance formula
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
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