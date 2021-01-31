var camera, scene, renderer, controls, mouse, raycaster, GUI, gameOver
var rollOverMesh
var cubeList = mineList = []
var cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5)
var cubeMaterial = new THREE.MeshNormalMaterial()
var mineMaterial = new THREE.MeshBasicMaterial({color: 0xfeb74c, opacity: 1, transparent: true})
var rollOverGeo = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5)
var rollOverMaterial = new THREE.MeshBasicMaterial({color: 0xff0000, opacity: 1, transparent: true})
var tipGeo = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5)

init()
addGUI()

function init() {
    camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 100)
    camera.position.z = 10
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)
    renderer = new THREE.WebGLRenderer({antialias: true})
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    raycaster = new THREE.Raycaster()
    mouse = new THREE.Vector2()
    gameOver = false
    cubeList = addCubes()
    addMines(cubeList)
    addTips(cubeList)
    rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial)
    scene.add(rollOverMesh)
    document.body.appendChild(renderer.domElement)
    document.addEventListener('mousemove', onDocumentMouseMove, false)
    document.addEventListener('pointerdown', onDocumentMouseDown, false)
    window.addEventListener('resize', onWindowResize, false)
    controls = new THREE.OrbitControls(camera, renderer.domElement)
    controls.addEventListener('change', render)
}

function addCubes(cubeCountPerEdge=3) {
    var xList = yList = zList = []
    if (cubeCountPerEdge > 5) {
        cubeCountPerEdge = 5
    }
    for (var i=-cubeCountPerEdge/2 ; i<cubeCountPerEdge/2 ; i+=1) {
        xList.push(i)
    }
    for (var x in xList)
        for (var y in yList)
            for (var z in zList) {
                    var cubeMesh = new THREE.Mesh(cubeGeo, cubeMaterial)
                    cubeMesh.position.set(x, y, z)
                    cubeMesh.isMine = false
                    cubeList.push(cubeMesh)
                }
    for (var i in cubeList) {
            scene.add(cubeList[i])
        }
    render()
    return cubeList
}

function addGUI() {
    var API = {
        'Reset': function() {
            location.reload()
        }
    };
    GUI = new dat.GUI()
    GUI.add(API, 'Reset')
}

function addMines(cubeList, minesTotal=10) {
    if (minesTotal >= cubeList.length) {
        return
    }
    cubeList.sort(() => Math.random() - 0.5);
    mineList = cubeList.slice(0, minesTotal);
    for (var i in mineList) {
        mineList[i].isMine = true
    }
}

function addTip(minesAround) {
    var canvas = document.createElement('canvas')
    canvas.width = 25
    canvas.height = 25
    var context = canvas.getContext('2d')
    context.fillStyle = 'white'
    context.fillText(minesAround, canvas.width/4, canvas.height/2)
    var texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return new THREE.MeshBasicMaterial({map: texture})
}

function addTips(cubeList) {
    for (var i in cubeList) {
        var minesAround = countMinesAround(cubeList[i], cubeList)
        cubeList[i].tip = addTip(minesAround)
    }
}

function countMinesAround(cube, cubeList) {
    var cubesAroundList = []
    var aList = range(parseInt(cube.position.x) - 1, parseInt(cube.position.x) + 1)
    var bList = range(parseInt(cube.position.y) - 1, parseInt(cube.position.y) + 1)
    var cList = range(parseInt(cube.position.z) - 1, parseInt(cube.position.z) + 1)
    for (var a in aList)
        for (var b in bList)
            for (var c in cList) {
                var cubeAround = new THREE.Vector3(a, b, c)
                cubesAroundList.push(cubeAround)
            }
    var minesAround = 0
    for (var i in cubeList)
        for (var v in cubesAroundList) {
            if (cubeList[i].position.equals(cubesAroundList[v]) && cubeList[i].isMine) {
                minesAround ++
            }
        }
    return minesAround
}

function onDocumentMouseDown(event) {
    mouse.set((event.clientX/window.innerWidth)*2-1, -(event.clientY/window.innerHeight)*2+1)
    raycaster.setFromCamera(mouse, camera)
    var intersects = raycaster.intersectObjects(cubeList)
    if (intersects.length > 0) {
        var intersect = intersects[0]
        var m = new THREE.Mesh(tipGeo, cubeMaterial)
        m.position.copy(intersect.point)
        m.position.x = '' + Math.round(m.position.x)
        m.position.y = '' + Math.round(m.position.y)
        m.position.z = '' + Math.round(m.position.z)
        var minesAround = countMinesAround(m, cubeList)
        m.material = addTip(minesAround)
        for (var i in cubeList) {
            if (cubeList[i].position.equals(m.position) && cubeList[i].isMine) {
                for (c in cubeList) {
                    cubeList[c].material = m.material
                    if (cubeList[c].isMine) {
                        cubeList[c].material = mineMaterial
                        gameOver = true
                    }
                }
            }
        }
        m.position.divideScalar(2).floor().multiplyScalar(1).addScalar(1)
        scene.add(m)
        render()
    }
}

function onDocumentMouseMove(event) {
    mouse.set((event.clientX/window.innerWidth)*2-1, -(event.clientY/window.innerHeight)*2+1)
    raycaster.setFromCamera(mouse, camera)
    var intersects = raycaster.intersectObjects(cubeList)
    if (intersects.length > 0 && !gameOver) {
        var intersect = intersects[0]
        rollOverMesh.position.copy(intersect.point)
        rollOverMesh.position.divideScalar(2).floor().multiplyScalar(1).addScalar(1)
    }
    render()
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

function range(start, stop) {
    var rangeList = []
    for (var i=start; i<=stop; i++) {
        rangeList.push(i)
    }
    return rangeList
}

function render() {
    renderer.render(scene, camera)
}