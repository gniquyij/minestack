var camera, scene, renderer, controls, mouse, raycaster, gui, gameOver
var rollOverMesh
var cubeList = mineList = []
var cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5)
var cubeMaterial = new THREE.MeshNormalMaterial()
var mineMaterial = new THREE.MeshBasicMaterial({color: 0xfeb74c, opacity: 1, transparent: true})
var rollOverGeo = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5)
var rollOverMaterial = new THREE.MeshBasicMaterial({color: 0xff0000, opacity: 1, transparent: true})
var tipGeo = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5)
var cubeGroup = new THREE.Group()
var cubeGroupObj = new THREE.Object3D()
var params = {
    'reset': function() {
        location.reload()
    }
//    'rotate': true
}

init()
addGui()
autoRotate()

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
    gameStarted = false
    cubeList, cubeGroup = addCubes()
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
    for (var i=-cubeCountPerEdge/2; i<cubeCountPerEdge/2; i+=1) {
        xList.push(i)
    }
    for (var x in xList)
        for (var y in yList)
            for (var z in zList) {
                    var cubeMesh = new THREE.Mesh(cubeGeo, cubeMaterial)
                    cubeMesh.position.set(Math.round(xList[x]), Math.round(yList[y]), Math.round(zList[z]))
                    cubeMesh.isMine = false
                    cubeGroupObj.add(cubeMesh)
                }
    cubeList = cubeGroupObj.children
    scene.add(cubeGroup)
    cubeGroup.add(cubeGroupObj)
    render()
    return cubeList, cubeGroup
}

function addGui() {
    gui = new dat.GUI()
    gui.add(params, 'reset')
//    gui.add(params, 'rotate')
}

function addMines(cubeList, minesTotal=10) {
    if (minesTotal >= cubeList.length) {
        return
    }
    cubeList.sort(() => Math.random() - 0.5)
    mineList = cubeList.slice(0, minesTotal)
    for (var i in mineList) {
        mineList[i].isMine = true
    }
}

function addRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function addTip(mineAroundCount) {
    var canvas = document.createElement('canvas')
    canvas.width = 25
    canvas.height = 25
    var context = canvas.getContext('2d')
    context.fillStyle = 'white'
    context.fillText(mineAroundCount, canvas.width/4, canvas.height/2)
    var texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return new THREE.MeshBasicMaterial({map: texture})
}

function addTips(cubeList) {
    for (var i in cubeList) {
        var cubeAround = getCubeAround(cubeList[i], cubeList)
        cubeList[i].tip = addTip(cubeAround.countMineAround)
    }
}

function getCubeAround(cube, cubeList) {
    var abcList = []
    var cubeAroundList = []
    var aList = range(parseInt(cube.position.x) - 1, parseInt(cube.position.x) + 1)
    var bList = range(parseInt(cube.position.y) - 1, parseInt(cube.position.y) + 1)
    var cList = range(parseInt(cube.position.z) - 1, parseInt(cube.position.z) + 1)
    for (var a in aList)
        for (var b in bList)
            for (var c in cList) {
                var cubeAround = new THREE.Vector3(parseInt(aList[a]), parseInt(bList[b]), parseInt(cList[c]))
                abcList.push(cubeAround)
            }
    var mineAroundCount = 0
    for (var i in cubeList)
        for (var v in abcList) {
            if (cubeList[i].position.equals(abcList[v])) {
                cubeAroundList.push(cubeList[i])
                if (cubeList[i].isMine) {
                    mineAroundCount ++
                }
            }
        }
    return {
        listCubeAround: cubeAroundList,
        countMineAround: mineAroundCount
    }
}

function onDocumentMouseDown(event) {
    mouse.set((event.clientX/window.innerWidth)*2-1, -(event.clientY/window.innerHeight)*2+1)
    raycaster.setFromCamera(mouse, camera)
    var intersects = raycaster.intersectObjects(cubeList)
    if (intersects.length > 0) {
        var intersect = intersects[0]
        var m = new THREE.Mesh(tipGeo, cubeMaterial)
        m.position.copy(intersect.point)
        m.position.x = Math.round(m.position.x)
        m.position.y = Math.round(m.position.y)
        m.position.z = Math.round(m.position.z)
        for (var i in cubeList) {
            if (cubeList[i].position.equals(m.position)) {
                if (!gameStarted) {
                    mineAroundTheFirstCount = addRandomInt(0, 7)
                    var cubeAroundTheFirst = getCubeAround(cubeList[i], cubeList)
                    var cubeAroundTheFirstList = cubeAroundTheFirst.listCubeAround
                    addMines(cubeAroundTheFirstList, mineAroundTheFirstCount)
                    var cubeAroundWithoutTheFirstList = cubeList.filter(x => !cubeAroundTheFirstList.includes(x))
                    addMines(cubeAroundWithoutTheFirstList, 10 - mineAroundTheFirstCount)
                    addTips(cubeList)
                    m.material = cubeList[i].tip
                    m.position.divideScalar(2).floor().multiplyScalar(1).addScalar(1)
                    scene.add(m)
                    render()
                    gameStarted = true
                    return
                }
                if (cubeList[i].isMine) {
                    for (c in cubeList) {
                        cubeList[c].material = cubeList[c].tip
                        if (cubeList[c].isMine) {
                            cubeList[c].material = mineMaterial
                            gameOver = true
                        }
                    }
                    scene.remove(rollOverMesh)
                }
                m.material = cubeList[i].tip
                var cubeAroundM = getCubeAround(cubeList[i], cubeList)
                var cubeAroundMList = cubeAroundM.listCubeAround
                var cubeAroundMListIndex = range(0, Math.round(cubeAroundMList.length / 2))
                for (var i in cubeAroundMListIndex) {
                    cubeAroundMList[cubeAroundMListIndex[i]].material = cubeAroundMList[cubeAroundMListIndex[i]].tip
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
        rangeList.push(i.toString())
    }
    return rangeList
}

function render() {
    renderer.render(scene, camera)
}

function autoRotate() {
    if (params.rotate) {
        cubeGroup.rotation.y += 0.005
        requestAnimationFrame(autoRotate)
    }
    render()
}