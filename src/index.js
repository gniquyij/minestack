var camera, scene, renderer, controls, mouse, raycaster;
var rollOverMesh;
var cubeList = mineList = [];
var cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
var cubeMaterial = new THREE.MeshNormalMaterial();
var mineGeo = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5);
var mineMaterial = new THREE.MeshBasicMaterial({color: 0xfeb74c, opacity: 1, transparent: true});
var rollOverGeo = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5);
var rollOverMaterial = new THREE.MeshBasicMaterial({color: 0xff0000, opacity: 1, transparent: true});
var tipGeo = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5);
var tipMaterial = new THREE.MeshBasicMaterial({color: 0x46eb34, opacity: 1, transparent: true});

init();

function init() {
    camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 100);
    camera.position.z = 10;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    cubeList = addCubes();
    addMines(cubeList);
    rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
    scene.add(rollOverMesh);
    document.body.appendChild(renderer.domElement);
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('pointerdown', onDocumentMouseDown, false);
    window.addEventListener('resize', onWindowResize, false);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', render);
}

function addCubes(cubeCountPerEdge=3) {
    var xList = yList = zList = [];
    if (cubeCountPerEdge > 5) {
        cubeCountPerEdge = 5
    }
    for (var i=-cubeCountPerEdge/2 ; i<cubeCountPerEdge/2 ; i+=1) {
        xList.push(i);
    }
    for (var x in xList)
        for (var y in yList)
            for (var z in zList) {
                    var cubeMesh = new THREE.Mesh(cubeGeo, cubeMaterial);
                    cubeMesh.position.set(x, y, z);
                    cubeMesh.isMine = false;
                    cubeList.push(cubeMesh);
                }
    for (i in cubeList) {
            scene.add(cubeList[i]);
        }
    render();
    return cubeList;
}

function addMines(cubeList, mineCount=10) {
    mineList = cubeList.slice(0, mineCount);
    for (i in mineList) {
            mineList[i].isMine = true;
        }
    cubeList.sort(() => Math.random() - 0.5);
}

function onDocumentMouseDown(event) {
    mouse.set((event.clientX/window.innerWidth)*2-1, -(event.clientY/window.innerHeight)*2+1);
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(cubeList);
    if (intersects.length > 0) {
        var intersect = intersects[0];
        var m;
        m = new THREE.Mesh(tipGeo, tipMaterial);
        m.position.copy(intersect.point);
        m.position.divideScalar(2).floor().multiplyScalar(1).addScalar(1);
        if (intersect.object.isMine) {
            for (i in cubeList) {
                cubeList[i].material = tipMaterial;
                if (cubeList[i].isMine) {
                    cubeList[i].material = mineMaterial;
                }
            }
        }
        scene.add(m);
        render();
    }
}

function onDocumentMouseMove(event) {
    mouse.set((event.clientX/window.innerWidth)*2-1, -(event.clientY/window.innerHeight)*2+1);
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(cubeList);
    if (intersects.length > 0) {
        var intersect = intersects[0];
        rollOverMesh.position.copy(intersect.point);
        rollOverMesh.position.divideScalar(2).floor().multiplyScalar(1).addScalar(1);
    }
    render();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
    renderer.render(scene, camera)
}