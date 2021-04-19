// python -m http.server -d www
// "C:\Users\Mikey\AppData\Local\Mozilla Firefox\firefox.exe" -start-debugger-server
// TODO: floor höhen terrain
// TODO: custom size and postition params
// TODO: load scene selbst erstellen, receive shadows change material plane
// TODO:
var propsGlobal = [];

function loadScene(scene) {
	var geo = new THREE.PlaneBufferGeometry(90, 90, 90, 90);
	modifyFloor(geo, 20)
	var mat = new THREE.MeshPhongMaterial({
		color: "rgb(0,200,0)",
		side: THREE.DoubleSide
	});

	var geo2 = new THREE.PlaneBufferGeometry(90, 90, 90, 90);
	modifyFloor2(geo2, 5);
	geos = [];
	geos.push(geo);
	geos.push(geo2)
	geo = THREE.BufferGeometryUtils.mergeBufferGeometries(geos);

	var floor = new THREE.Mesh(geo, mat);
	floor.name = "floor";
	floor.receiveShadow = true;
	floor.castShadow = true;
	floor.rotation.x = Math.PI / 2;
	scene.add(floor);

	for (var i = 0; i < geo.attributes.position.count; i++) {
		if (geo.attributes.position.getX(i) == 0 && geo.attributes.position.getY(i) == 0) {
			console.log("Z:" + geo.attributes.position.getZ(i));
		}

	}

	var pointLight = new THREE.PointLight(0xffffff, 1);
	pointLight.position.y = 80;
	pointLight.position.z = -40;
	pointLight.position.x = -40;
	pointLight.intensity = 1.2;
	pointLight.castShadow = true;
	scene.add(pointLight);

	var pointLight2 = new THREE.PointLight(0xffffff, 1);
	pointLight2.position.y = 80;
	pointLight2.position.z = 40;
	pointLight2.position.x = 40;
	pointLight2.intensity = 1;
	pointLight2.castShadow = true;
	scene.add(pointLight2);

	return scene;
}

function initCamera() {
	camera = new THREE.PerspectiveCamera(
		45,
		window.innerWidth / window.innerHeight,
		1,
		2000
	);
	camera.position.z = -50;
	camera.position.y = 55;
	camera.position.x = -62;
	camera.lookAt(new THREE.Vector3(0, 0, -5));

	return camera;
}

function initRenderer() {
	var renderer = new THREE.WebGLRenderer();
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor("rgb(60,60,60)");
	document.getElementById('webgl').appendChild(renderer.domElement);

	return renderer;
}

function update(renderer, scene, camera, controls) {
	renderer.render(scene, camera);

	controls.update();

	scene.children[0].geometry.attributes.position.needsUpdate = true;


	requestAnimationFrame(function () {
		update(renderer, scene, camera, controls);
	});
}

function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

function modifyFloor(geo, value) {
	var positionAttribute = geo.attributes.position;
	// console.log(positionAttribute);

	var vector = new THREE.Vector3(25, 25, value);
	for (var i = 0; i < positionAttribute.count; i++) {
		var x = positionAttribute.getX(i);
		var y = positionAttribute.getY(i);
		var z = positionAttribute.getZ(i);
		vec = new THREE.Vector3(x, y, z);
		dist = vec.distanceTo(vector)
		if (dist < 2 * value) {
			z -= 2 * value - (dist);
		}
		positionAttribute.setXYZ(i, x, y, z);
		if (positionAttribute.getX(i) == 25 && positionAttribute.getY(i) == 25) {
			// console.log(z);
		}

	}
	geo.needsUpdate = true;
}
function modifyFloor2(geo, value) {
	var positionAttribute = geo.attributes.position;
	// console.log(positionAttribute);

	var vector = new THREE.Vector3(0, 0, value);
	for (var i = 0; i < positionAttribute.count; i++) {
		var x = positionAttribute.getX(i);
		var y = positionAttribute.getY(i);
		var z = positionAttribute.getZ(i);
		vec = new THREE.Vector3(x, y, z);
		dist = vec.distanceTo(vector)
		if (dist < 2 * value) {
			z -= 2 * value - (dist);
		}
		positionAttribute.setXYZ(i, x, y, z);
		if (positionAttribute.getX(i) == 75 && positionAttribute.getY(i) == 75) {
			// console.log(z);
		}

	}
	geo.needsUpdate = true;
}

function main() {
	var scene = new THREE.Scene();
	scene = loadScene(scene);

	var camera = initCamera();
	var renderer = initRenderer();
	var controls = new THREE.OrbitControls(camera, renderer.domElement);


	update(renderer, scene, camera, controls)
	return scene;
}

scene = main();
var floor = (scene.getObjectByName("floor"));
console.log(scene);