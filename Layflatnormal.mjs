export function selectOuterFacesAutomatically(geometry) {
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
            const thresholdMin = 0.2; // Adjust this threshold based on your requirements
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

 
export function selectLayFlatFacesWithNormals(geometry, selectedOuterFaces, angleSet = [0, 45, 90, 70,135, 180,225,270,360,315]) {
    const flatfaces = {};

    selectedOuterFaces.forEach(selectedFaceIndex => {
        const selectedFaceNormal = getFaceNormal(geometry, selectedFaceIndex);

        // Check if the face normal is within the specified angle set
        const result =isAngleInSet(selectedFaceNormal, angleSet);
        if (result.isInSet) {
            const angles = result.angle;
            const direction = getDirectionLabel(selectedFaceNormal);

            // Initialize the angles entry if it doesn't exist
            if (!flatfaces[angles]) {
                flatfaces[angles] = {};
            }

            // Initialize the direction entry if it doesn't exist
            if (!flatfaces[angles][direction]) {
                flatfaces[angles][direction] = {
                    normals: [],
                    faceIndices: []
                };
            }

            // Add the current normal and face index to the direction entry
            flatfaces[angles][direction].normals.push(selectedFaceNormal);
            flatfaces[angles][direction].faceIndices.push(selectedFaceIndex);
        }
    });

    return flatfaces;
}

function getDirectionLabel(normal, threshold = 0.99, thresholdmin=0.2,thresholdMax=0.9) {
    const epsilon = 1e-6; // A small value to handle rounding errors

    if (normal.x > threshold) {
        return 'x';
    } else if (normal.x < -threshold) {
        return '-x';
    } else if (normal.y > threshold) {
        return 'y';
    } else if (normal.y < -threshold) {
        return '-y';
    } else if (normal.z > threshold) {
        return 'z';
    } else if (normal.z < -threshold) {
        return '-z';
    } else if (Math.abs(normal.x) < epsilon && Math.abs(normal.y) < epsilon) {
        return 'z'; // xy plane
    } else if (Math.abs(normal.x) < epsilon && Math.abs(normal.z) < epsilon) {
        return 'y'; // xz plane
    } else if (Math.abs(normal.y) < epsilon && Math.abs(normal.z) < epsilon) {
        return 'x'; // yz plane
    } else if (Math.abs(normal.x) < epsilon && Math.abs(normal.y) < threshold && Math.abs(normal.z) < threshold) {
        return 'xy'; // plane between x and y
    } else if (Math.abs(normal.x) < threshold && Math.abs(normal.y) < epsilon && Math.abs(normal.z) < threshold) {
        return 'xz'; // plane between x and z
    } else if (Math.abs(normal.x) < threshold && Math.abs(normal.y) < threshold && Math.abs(normal.z) < epsilon) {
        return 'yz'; // plane between y and z
    } else if (
        Math.abs(normal.x)  >= thresholdmin &&  Math.abs(normal.x)  <= thresholdMax,
        Math.abs(normal.y)  >= thresholdmin &&  Math.abs(normal.y)  <= thresholdMax,
        Math.abs(normal.y)  >= thresholdmin &&  Math.abs(normal.y)  <= thresholdMax
    ) {
       
        return 'xyz'; // Zero in all directions
    } else {
        return 'unknown';
    }
}



const epsilon = 1e-6; // A small value to handle rounding errors
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




function findFarthestFaces(selectedFacesWithNormals, geometry, mesh) {
        const farthestFaces = {};
    
        for (const direction in selectedFacesWithNormals) {
            if (Object.hasOwnProperty.call(selectedFacesWithNormals, direction)) {
                const directionData = selectedFacesWithNormals[direction];
    
                let positiveDistance = -Infinity;
                let negativeDistance = Infinity;
                let farthestPositiveFace = null;
                let farthestNegativeFace = null;
    
                for (let i = 0; i < directionData.faceIndices.length; i++) {
                    const faceIndex = directionData.faceIndices[i];
                    const facePosition = getFacePositions(geometry, faceIndex, mesh);
    
                    let distance;
    
                    switch (direction) {
                        case 'x':
                        case '-x':
                            distance = facePosition.x;
                            break;
                        case 'y':
                        case '-y':
                            distance = facePosition.y;
                            break;
                        case 'z':
                        case '-z':
                            distance = facePosition.z;
                            break;
                        case 'xy':
                            distance = Math.sqrt(facePosition.x ** 2 + facePosition.y ** 2);
                            break;
                        case 'xz':
                            distance = Math.sqrt(facePosition.x ** 2 + facePosition.z ** 2);
                            break;
                        case 'yz':
                            distance = Math.sqrt(facePosition.y ** 2 + facePosition.z ** 2);
                            break;
                        // Add more cases for other directions as needed
                    }
    
                    // Update the farthest face for positive and negative distances
                    if (distance !== undefined) {
                        if (distance > positiveDistance) {
                            positiveDistance = distance;
                            farthestPositiveFace = faceIndex;
                        }
    
                        if (distance < negativeDistance) {
                            negativeDistance = distance;
                            farthestNegativeFace = faceIndex;
                        }
                    }
                }
    
                // Determine the overall farthest face based on the maximum absolute distance
                if (Math.abs(positiveDistance) > Math.abs(negativeDistance)) {
                    farthestFaces[direction] = farthestPositiveFace;
                } else {
                    farthestFaces[direction] = farthestNegativeFace;
                }
            }
        }
    
        return farthestFaces;
    }
    function getFaceNormal(geometry, faceIndex) {
        const normals = geometry.attributes.normal.array;
        const startIndex = faceIndex * 9;
       
        return new THREE.Vector3(normals[startIndex], normals[startIndex + 1], normals[startIndex + 2]);
       
    }
    
//const farthestFaces = findFarthestFaces(selectedLayFlatFacesss, geometry,meshes);

//console.log("Farthest Faces:", farthestFaces);

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
