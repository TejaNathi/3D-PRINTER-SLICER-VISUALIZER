// Find the convex hull using QuickHull


// // Create a cube geometry
// const geometry = new THREE.BoxBufferGeometry(10, 30, 10);
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, multiMaterial);
// scene.add(cube);

// const bufferGeometry =cube.geometry;
// bufferGeometry.computeFaceNormals();

// // Compute vertex normals
// bufferGeometry.computeVertexNormals();

// // Log the normals of the cube
// // function normalsupdates(cubegeomerty){
// //     const faces =cubegeomerty.attributes.normal.Array;

// // // Array to store normals
// // const normals = [];

// // // Iterate through the faces and get the normals
// // for (let i = 0; i < faces.length; i++) {
// //     normals.push(faces[i].normal);
// // }
// // console.log("normals",normals);
// // }

// function findUpFaces(geometry, threshold = 0.1) {
//     const upFaces = [];

//     // Iterate through faces to find those with normals approximately matching (0, 1, 0)
//     for (let i = 0; i < geometry.faces.length; i++) {
//         const faceNormal = geometry.faces[i].normal;
//         if (Math.abs(faceNormal.x) < threshold && faceNormal.y > 1 - threshold && Math.abs(faceNormal.z) < threshold) {
//             upFaces.push(i);
//         }
//     }

//     return upFaces;
// }
// function getFaceNormals(geometry, faceIndex) {
//     const normals = geometry.attributes.normal.array;
//     const startIndex = faceIndex * 6;  // Corrected indexing for BufferGeometry

//     // For a BufferGeometry, each normal is represented by three components (x, y, z)
//     const normal = new THREE.Vector3( normals[startIndex],normals[startIndex + 1], normals[startIndex + 2]);

//     // Assuming y is up, no need to switch y and z components
//     return normal;
// }




// let xAxisLine, yAxisLine, zAxisLine;
// function createAxesLines(mesh) {
//     // Extract the columns of the mesh matrix (local coordinate axes)
//     const xAxis = new THREE.Vector3().fromArray(mesh.matrix.elements.slice(0, 3));
//     const yAxis = new THREE.Vector3().fromArray(mesh.matrix.elements.slice(4, 7));
//     const zAxis = new THREE.Vector3().fromArray(mesh.matrix.elements.slice(8, 11));

//     // Remove existing lines if they exist
//     if (xAxisLine) scene.remove(xAxisLine);
//     if (yAxisLine) scene.remove(yAxisLine);
//     if (zAxisLine) scene.remove(zAxisLine);

//     // Create lines along the local coordinate axes
//     xAxisLine = new THREE.ArrowHelper(xAxis, mesh.position, 20, 0xff0000);
//     yAxisLine = new THREE.ArrowHelper(yAxis, mesh.position, 20, 0x00ff00);
//     zAxisLine = new THREE.ArrowHelper(zAxis, mesh.position, 20, 0x0000ff);

//     // Add the lines to the scene
//     scene.add(xAxisLine);
//     scene.add(yAxisLine);
//     scene.add(zAxisLine);
// }
// createAxesLines(cube)

// function updateNormalsAfterRotation(cube) {
//     // Assuming three components (x, y, z) per normal
//     const normals = cube.geometry.attributes.normal.array;

//     // Iterate through each face of the cube
//     for (let i = 0; i < normals.length; i += 3) { // Updated the increment to 3
//         const normal = new THREE.Vector3(normals[i], normals[i + 1], normals[i + 2]);

//         // Apply quaternion to the normal
//         normal.applyQuaternion(cube.quaternion);

//         // Update the normal values in the buffer
//         normals[i] = normal.x;
//         normals[i + 1] = normal.y;
//         normals[i + 2] = normal.z;
//     }

//     // Notify Three.js that normals are updated
//     cube.geometry.attributes.normal.needsUpdate = true;
//     cube.updateMatrixWorld();
// }




// function getFaceIndexWithNormal(cube, threshold = 0.01) {
//     const normals = cube.geometry.attributes.normal.array;
//     const quaternion = cube.quaternion.clone();

//     // Transform the target normal {0, 1, 0} using the quaternion
//     const targetNormal = new THREE.Vector3(0, -1, 0).applyQuaternion(quaternion);

//     // Find the face index with the closest normal to the transformed target normal
//     let closestFaceIndex = -1;
//     let minAngle = Infinity;

//     for (let i = 0; i < normals.length; i += 3) {
//         const normal = new THREE.Vector3(normals[i], normals[i + 1], normals[i + 2]);

//         // Apply quaternion to the normal
//         normal.applyQuaternion(quaternion);

//         // Calculate the angle between the target normal and the current normal
//         const angle = targetNormal.angleTo(normal);

//         // Update the closest face index if the current angle is smaller and within the threshold
//         if (angle < minAngle && angle < threshold) {
//             minAngle = angle;
//             closestFaceIndex = i / 9; // Convert index to face index
//         }
//     }

//     return closestFaceIndex;
// }







// console.log("buffer",bufferGeometry);
// //normalsupdates(bufferGeometry);

// // Assuming you have a mesh with BufferGeometry


// // Check if the geometry is BufferGeometry and has the position attribute
// if (bufferGeometry.isBufferGeometry && bufferGeometry.attributes) {
//     const positionAttribute = bufferGeometry.attributes.position;
//     const positionArray = positionAttribute.array;

//     // Assuming the item size is 3 (common for position)
//     const itemSize = positionAttribute.itemSize;

//     // Access individual components of the position attribute
//     for (let i = 0; i < positionAttribute.count; i++) {
//         const xPos = positionArray[i * itemSize];
//         const yPos = positionArray[i * itemSize + 1];
//         const zPos = positionArray[i * itemSize + 2];

//         // Do something with the individual components...
//     }
// } else {
//     console.error("Position attribute not found in BufferGeometry.");
// }



// let isDragging = false;
// let previousMouseX = 0;

// // Event listeners for mouse move and mouse down/up
// document.addEventListener('mousedown', onMouseDown);
// document.addEventListener('mousemove', onMouseMove);
// document.addEventListener('mouseup', onMouseUp);

// function onMouseDown(event) {
//     mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//     mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

//     // Update the raycaster
//     raycaster.setFromCamera(mouse, camera);

//     // Check for intersections
//     const intersects = raycaster.intersectObject(cube);
//    // console.log("intersects",intersects);
//     //isDragging = true;
//    // previousMouseX = event.clientX;

//     if (intersects.length > 0) {
//         const selectedfaces=intersects[0].faceIndex;
//         console.log("faceindex",selectedfaces);
//         const normal=getFaceNormals(bufferGeometry,selectedfaces)
//         console.log("normals", normal);updateNormalsAfterRotation(cube);

//        controls.enabled=false;

//         // Log the normal of the selected face
    
//         isDragging = true;


// }}

// function onMouseMove(event) {
//     if (isDragging) {
//         const deltaX = event.clientX - previousMouseX;
       
//         controls.enabled=false;

//     //    normalsupdates(cube.geometry);

//         // Rotate the cube around its y-axis by a small amount
//         cube.rotation.z += deltaX * (Math.PI / 180); // Adjust this factor for sensitivity

//         // Check for snapping angles (90, 180, 270 degrees)
//         const angle = cube.rotation.z * (180 / Math.PI);

//        // console.log("angles",angle);

//         if (angle % 90 < 5 || angle % 90 > 85) {
//             // Snap to the nearest 90-degree angle
//             cube.rotation.z = Math.round(angle / 90) * (Math.PI / 2);
//            // cube.updateMatrixWorld();
           
//            updateNormalsAfterRotation(cube);
           
            
          
//         }
//         controls.enabled=false;
//         createAxesLines(cube);
        
//         // Update previous mouse position
//         previousMouseX = event.clientX;

//     }
   
// }

// function onMouseUp() {
 
//     isDragging = false;
//     updateNormalsAfterRotation(cube);
//     const yup= getFaceIndexWithNormal(cube);
//     console.log("yup",yup);
//     controls.enabled=true;
//     console.log("cube",cube.geometry.attributes);
//     //updateNormalsAfterRotation(cube);
   
  
// }
// const materialFront = new THREE.MeshBasicMaterial({ color: 0xff0000  }); // Red
// const materialBack = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green
// const materialTop = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Blue
// const materialBottom = new THREE.MeshBasicMaterial({ color: 0xffff00}); // Yellow
// const materialLeft = new THREE.MeshBasicMaterial({ color: 0xff00ff }); // Magenta
// const materialRight = new THREE.MeshBasicMaterial({ color: 0x00ffff}); // Cyan

// // Create a MultiMaterial by combining the materials
// const multiMaterial = new THREE.MultiMaterial([
//     materialFront,
//     materialBack,
//     materialTop,
//     materialBottom,
//     materialLeft,
//     materialRight
// ]);
// Or, if the above doesn't work, try:
// console.log("Cube Normals:", cubeGeometry.attributes.normals.array);