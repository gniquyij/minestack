var camera, scene, renderer, controls, mouse, raycaster, gui, light
var cubeCountPerEdge = 3
var rollOverMesh
var cubeList, mineList, nonMineList
var cubeGroup
var cubeGroupObj
var cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5)
var cubeMaterial = new THREE.MeshStandardMaterial()
if (document.documentElement.lang == 'en') {
    CDN = 'https://raw.githubusercontent.com/gniquyij'
} else if (document.documentElement.lang == 'zh') {
    CDN = 'https://6d69-minestack-9g0oaah6510bf145-1305308580.tcb.qcloud.la'
}
var mineTexture = new THREE.TextureLoader().load(`${CDN}/minestack/gh-pages/src/mine.jpg`)
var mineMaterial = new THREE.MeshStandardMaterial({map: mineTexture})
var mineRevealedMaterial = new THREE.MeshStandardMaterial({color: '#00c91e', opacity: 1, transparent: true})
var rollOverGeo = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5)
var rollOverMaterial = new THREE.MeshStandardMaterial({color: '#ff0000', opacity: 0.5, transparent: true})
var flagTexture = new THREE.TextureLoader().load(`${CDN}/minestack/gh-pages/src/flag.jpg`)
var flagMaterial = new THREE.MeshStandardMaterial({map: flagTexture})
var rendererCanvas = document.createElement('canvas')
rendererCanvas.id = 'rendererCanvas'
var timer, timerStopped, hour, minute, second, record
var gameRound = 0
var cubeSound, bgSound
var cubeSoundPath = `${CDN}/minestack/gh-pages/src/test-cube.mp3` //cr: pikachu
var bgSoundIsOn = false
var bgSoundPath = `${CDN}/minestack/gh-pages/src/bg.mp3` //bootleg: chant iii
var touchTime = new Date().getTime()
var tipColors = [
    '#1401f5',
    '#377e22',
    '#e83323',
    '#05017b',
    '#77150f',
    '#377e7e',
    '#000000',
    '#808080',
    '#1401f5',
    '#377e22',
    '#e83323',
    '#05017b',
    '#77150f',
    '#377e7e',
    '#000000',
    '#808080'
]
var params = {
    'bgSound': false,
    'cubesPerEdge': 3,
    'reset': function() {
        cubeCountPerEdge = params.cubesPerEdge
        bgSoundIsOn = params.bgSound
        while (scene.children.length > 0) {
            scene.remove(scene.children[0])
        }
        main()
        gui.close()
    },
    'rotate': false
}

init()
main()
addGui()

function init() {
    camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 100)
    camera.position.z = 10
    scene = new THREE.Scene()
    scene.background = new THREE.Color('#f0f0f0')
    renderer = new THREE.WebGLRenderer({antialias: true, canvas: rendererCanvas})
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)
    document.addEventListener('mousemove', onMouseMove, false)
    document.addEventListener('pointerdown', onMouseClick, false)
    window.addEventListener('resize', onWindowResize, false)
    controls = new THREE.OrbitControls(camera, renderer.domElement)
    controls.addEventListener('change', render)
    raycaster = new THREE.Raycaster()
    mouse = new THREE.Vector2()
    timer = document.getElementById('stopwatch')
    record = document.getElementById('record')
    bgSound = loadAudio(bgSoundPath)
    cubeSound = loadAudio(cubeSoundPath)
}

function main() {
    light = new THREE.HemisphereLight('#ababab', '#030303')
    light.position.set(-2, 3, 20)
    scene.add(light)
    gameOver = false
    gameStarted = false
    timerStopped = true
    hour = 0
    minute = 0
    second = 0
    timer.innerHTML = '00:00:00'
    cubeList = []
    mineList = []
    nonMineList = []
    cubeGroup = new THREE.Group()
    cubeGroupObj = new THREE.Object3D()
    cubeList, cubeGroup = addCubes(cubeCountPerEdge)
    rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial)
    scene.add(rollOverMesh)
    cubeGroup.add(rollOverMesh)
    autoRotate()
    playAudio(bgSound, bgSoundIsOn, true)
}

function addCubes(cubeCountPerEdge) {
    var xList = yList = zList = []
    if (cubeCountPerEdge > 5) {
        cubeCountPerEdge = 5
    }
    for (var i = - cubeCountPerEdge / 2; i < cubeCountPerEdge / 2; i += 1) {
        xList.push(i)
    }
    for (var x in xList)
        for (var y in yList)
            for (var z in zList) {
                    var cubeMesh = new THREE.Mesh(cubeGeo, cubeMaterial)
                    cubeMesh.position.set(Math.round(xList[x]), Math.round(yList[y]), Math.round(zList[z]))
                    cubeMesh.isMine = false
                    cubeMesh.isRevealed = false
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
    gui.domElement.id = 'gui'
    gui_position = document.getElementsByClassName('dg ac')[0].setAttribute("id", "guiParent")
    gui.close()
    if (document.documentElement.lang == 'en') {
        gui.add(params, 'bgSound').name('Sound')
        gui.add(params, 'reset').name('Reset')
    //    gui.add(params, 'cubesPerEdge', 2, 5).step(1).name('Cubes per edge')
    //    gui.add(params, 'rotate').name('Rotate')
    } else if (document.documentElement.lang == 'zh') {
        gui.add(params, 'bgSound').name('音效')
        gui.add(params, 'reset').name('重新开始')
    }
}

function addMines(cubeList, minesTotal) {
    if (minesTotal >= cubeList.length) {
        return
    }
    cubeList.sort(() => Math.random() - 0.5)
    var mineList = cubeList.slice(0, minesTotal)
    for (var i in mineList) {
        mineList[i].isMine = true
    }
}

function addRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function addTip(mineAroundCount) {
    var canvas = document.createElement('canvas')
    canvas.width = 500
    canvas.height = 500
    var context = canvas.getContext('2d')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.font = 'Bold 250px Times'
    context.textAlign = 'center'
    if (mineAroundCount == 0) {
        context.fillStyle = '#808080'
    }
    context.fillStyle = tipColors[mineAroundCount - 1]
    context.fillText(mineAroundCount, canvas.width / 2, canvas.height * 2 / 3)
    var texture = new THREE.CanvasTexture(canvas)
    return new THREE.MeshStandardMaterial({map: texture})
}

function addTips(cubeList) {
    for (var i in cubeList) {
        var cubeAround = getCubeAround(cubeList[i], cubeList)
        cubeList[i].tip = addTip(cubeAround.countMineAround)
    }
}

function autoRotate() {
    if (params.rotate) {
        cubeGroup.rotation.y += 0.005
        requestAnimationFrame(autoRotate)
    }
    render()
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
    for (var i in abcList) {
        if (abcList[i].equals(cube.position)) {
            abcList.splice(i, 1)
        }
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

function loadAudio(soundPath) {
    sound = new Audio(soundPath)
    sound.preload = 'auto'
    return sound
}

function playAudio(sound, soundIsOn=true, onLoop=false) {
    if (onLoop) {
        sound.loop = true
    }
    sound.pause()
    if (soundIsOn) {
        sound.play()
    }
}

function onMouseClick(event) {
    var delay = 500
    var delta = new Date().getTime() - touchTime
    onMouseSingleClick(event)
    if (delta < delay) {
        onMouseDoubleClick(event)
    }
    touchTime = new Date().getTime()
}

function onMouseDoubleClick(event) {
    mouse.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1)
    raycaster.setFromCamera(mouse, camera)
    var intersects = raycaster.intersectObjects(cubeList)
    if (intersects.length > 0 && !gameOver) {
        var intersect = intersects[0]
        for (var i in cubeList) {
            if (cubeList[i].position.equals(intersect.point.round())) {
                if (!gameStarted) {
                    mineAroundTheFirstCount = addRandomInt(1, 6)
                    var cubeAroundTheFirst = getCubeAround(cubeList[i], cubeList)
                    var cubeAroundTheFirstList = cubeAroundTheFirst.listCubeAround
                    addMines(cubeAroundTheFirstList, mineAroundTheFirstCount)
                    var cubeTheFirstList = []
                    for (var n in cubeAroundTheFirstList) {
                        cubeTheFirstList.push(cubeAroundTheFirstList[n])
                    }
                    cubeTheFirstList.push(cubeList[i])
                    var cubeOutOfTheFirstList = cubeList.filter(x => !cubeTheFirstList.includes(x))
                    addMines(cubeOutOfTheFirstList, 10 - mineAroundTheFirstCount)
                    addTips(cubeList)
                    for (var q in cubeList) {
                        if (cubeList[q].isMine) {
                            mineList.push(cubeList[q])
                        } else {
                            nonMineList.push(cubeList[q])
                        }
                    }
                    cubeList[i].material = cubeList[i].tip
                    cubeList[i].isRevealed = true
                    render()
                    gameStarted = true
                    startTimer()
//                    playAudio(cubeSound)
                    return
                }
                if (cubeList[i].isMine) {
                    for (var c in cubeList) {
                        cubeList[c].material = cubeList[c].tip
                        if (cubeList[c].isMine) {
                            cubeList[c].material = mineMaterial
                        }
                    }
                    gameOver = true
                    stopTimer()
                    scene.remove(rollOverMesh)
                    return
                }
                cubeList[i].material = cubeList[i].tip
                cubeList[i].isRevealed = true
                var cubeAroundM = getCubeAround(cubeList[i], cubeList)
                var cubeAroundMList = cubeAroundM.listCubeAround
                var cubeAroundMListIndex = range(0, Math.round(cubeAroundMList.length / 2))
                for (var i in cubeAroundMListIndex) {
                    if (!cubeAroundMList[cubeAroundMListIndex[i]].isMine) {
                        cubeAroundMList[cubeAroundMListIndex[i]].material = cubeAroundMList[cubeAroundMListIndex[i]].tip
                        cubeAroundMList[cubeAroundMListIndex[i]].isRevealed = true
                    }
                }
                var cubeRevealedCount = 0
                for (var i in nonMineList) {
                    if (nonMineList[i].isRevealed) {
                        cubeRevealedCount ++
                    }
                }
                if (cubeRevealedCount == nonMineList.length) {
                    for (var q in mineList) {
                        mineList[q].material = mineRevealedMaterial
                    }
                    gameOver = true
                    stopTimer()
                    scene.remove(rollOverMesh)
                    recordToSecond = timeToSecond(record)
                    timerToSecond = timeToSecond(timer)
                    if (gameRound == 0) {
                        record.innerHTML = timer.innerHTML
                        gameRound ++
                    } else if (timerToSecond < recordToSecond) {
                        record.innerHTML = timer.innerHTML
                    }
                }
            }
        }
//        playAudio(cubeSound)
        render()
    }
}

function onMouseMove(event) {
    mouse.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1)
    raycaster.setFromCamera(mouse, camera)
    var intersects = raycaster.intersectObjects(cubeList)
    if (intersects.length > 0 && !gameOver) {
        var intersect = intersects[0]
        for (var i in cubeList) {
            if (cubeList[i].position.equals(intersect.point.round())) {
                rollOverMesh.position.copy(intersect.point.round())
            }
        }
    }
    render()
}

function onMouseSingleClick(event) {
    mouse.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1)
    raycaster.setFromCamera(mouse, camera)
    var intersects = raycaster.intersectObjects(cubeList)
    if (intersects.length > 0 && !gameOver) {
        var intersect = intersects[0]
        for (var i in cubeList) {
            if (cubeList[i].position.equals(intersect.point.round())) {
                cubeList[i].material = flagMaterial
            }
        }
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
    for (var i = start; i <= stop; i ++) {
        rangeList.push(i.toString())
    }
    return rangeList
}

function render() {
    renderer.render(scene, camera)
}

function startTimer() {
    if (timerStopped) {
        timerStopped = false
        timerCycle()
    }
}

function stopTimer() {
    if (!timerStopped) {
        timerStopped = true
    }
}

function timerCycle() {
    if (!timerStopped) {
        second = parseInt(second)
        minute = parseInt(minute)
        hour = parseInt(hour)
        second = second + 1
        if (second == 60) {
            minute = minute + 1
            second = 0
        }
        if (minute == 60) {
            hour = hour + 1
            minute = 0
            second = 0
        }
        if (second == 0 || second < 10) {
            second = '0' + second
        }
        if (minute == 0 || minute < 10) {
            minute = '0' + minute
        }
        if (hour == 0 || hour < 10) {
            hour = '0' + hour
        }
        timer.innerHTML = hour + ':' + minute + ':' + second
        setTimeout('timerCycle()', 1000)
    }
}

function timeToSecond(time) {
    timeToArray = time.innerHTML.split(":")
    h = parseInt(timeToArray[0])
    m = parseInt(timeToArray[1])
    s = parseInt(timeToArray[2])
    return h * 60 * 60 + m * 60 + s
}