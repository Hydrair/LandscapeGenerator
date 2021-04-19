// python -m http.server -d www
// "C:\Users\Mikey\AppData\Local\Mozilla Firefox\firefox.exe" -start-debugger-server
// TODO: clear terrain, set props on terrain, merge geo tarrain
var propsAttributes = [];

function setAttributes(name) {
	if (name == "farm") {
		propsAttributes = {
			"path": "farm/",
			"houseS": "0.01",
			"houseM": "0.007",
			"houseL": "0.01",
			"treeN": "0.002",
			"treeNY": "-7",
			"treeB": "0.003",
			"treeBY": "-2.5",
			"mountain": "0.009"
		}
	}
	if (name == "forest") {
		propsAttributes = {
			"path": "forest/",
			"houseS": "0.01",
			"houseM": "0.001",
			"houseL": "0.001",
			"treeN": "0.002",
			"treeNY": "-11",
			"treeB": "0.003",
			"treeBY": "-7.5",
			"mountain": "0.1"
		}
	}
	if (name == "mobs") {
		propsAttributes = {
			"path": "mobs/",
			"houseS": "0.01",
			"houseM": "0.01",
			"houseL": "0.008",
			"treeN": "0.006",
			"treeNY": "-6",
			"treeB": "0.003",
			"treeBY": "-7.5",
			"mountain": "0.02"
		}
	}
}
function loadScene(scene) {
	var geo = new THREE.PlaneBufferGeometry(150, 150, 150, 150);
	const texture = new THREE.TextureLoader().load("images/grassjpg.jpg");
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(1, 1);
	var mat = new THREE.MeshPhongMaterial({
		// color: "rgb(0,200,0)",
		map: texture,
		side: THREE.DoubleSide
	});

	var floor = new THREE.Mesh(geo, mat);
	floor.name = "floor";
	floor.receiveShadow = true;
	floor.castShadow = true;
	floor.rotation.x = Math.PI / 2;
	scene.add(floor)

	var geoBig = new THREE.PlaneBufferGeometry(500, 500, 1, 1);
	var floorBig = new THREE.Mesh(geoBig, mat);
	floorBig.name = "floorBig";
	floorBig.receiveShadow = true;
	floorBig.castShadow = true;
	floorBig.rotation.x = Math.PI / 2;
	scene.add(floorBig)

	var bias = -0.001
	var light = new THREE.PointLight(0xffffff, 1);
	light.position.y = 120;
	light.position.z = 120;
	light.position.x = 230;
	light.intensity = 1;
	light.castShadow = true;
	light.shadow.bias = bias;
	// light.target.position.set(0, 0, 0);
	scene.add(light);

	var light2 = new THREE.PointLight(0xffffff, 1);
	light2.position.y = 130;
	light2.position.z = -280;
	light2.position.x = -280;
	light2.intensity = 0.5;
	light2.castShadow = true;
	light2.shadow.bias = bias;
	// light2.target.position.set(0, 0, 0);
	scene.add(light2);

	var pointLight2 = new THREE.AmbientLight(0xffffff, 1);
	pointLight2.position.y = 0;
	pointLight2.position.z = 0;
	pointLight2.position.x = 0;
	pointLight2.intensity = 0.5;
	// pointLight2.castShadow = true;
	// pointLight2.shadow.bias = bias;
	scene.add(pointLight2)

	skybox(scene);

	return scene;
}

function skybox(scene) {
	let materialArray = [];
	let texture_up = new THREE.TextureLoader().load('obj/sky/posy.jpg');
	let texture_dn = new THREE.TextureLoader().load('obj/sky/negy.jpg');
	let texture_ft = new THREE.TextureLoader().load('obj/sky/posx.jpg');
	let texture_lf = new THREE.TextureLoader().load('obj/sky/negz.jpg');
	let texture_bk = new THREE.TextureLoader().load('obj/sky/negx.jpg');
	let texture_rt = new THREE.TextureLoader().load('obj/sky/posz.jpg');

	materialArray.push(new THREE.MeshBasicMaterial({ map: texture_ft }));
	materialArray.push(new THREE.MeshBasicMaterial({ map: texture_bk }));
	materialArray.push(new THREE.MeshBasicMaterial({ map: texture_up }));
	materialArray.push(new THREE.MeshBasicMaterial({ map: texture_dn }));
	materialArray.push(new THREE.MeshBasicMaterial({ map: texture_rt }));
	materialArray.push(new THREE.MeshBasicMaterial({ map: texture_lf }));

	for (let i = 0; i < 6; i++)
		materialArray[i].side = THREE.BackSide;

	let skyboxGeo = new THREE.BoxGeometry(500, 500, 500);
	let skybox = new THREE.Mesh(skyboxGeo, materialArray);
	scene.add(skybox);
}

function initCamera() {
	camera = new THREE.PerspectiveCamera(
		45,
		window.innerWidth / window.innerHeight,
		1,
		2000
	);
	camera.position.z = 180;
	camera.position.y = 90;
	camera.position.x = 100;
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

function modifyFloor(geo, d) {
	var positionAttribute = geo.attributes.position;
	var value = d.pips * 1.5;
	var vector = new THREE.Vector3(d.points[0], d.points[1], value);
	for (var i = 0; i < positionAttribute.count; i++) {
		var x = positionAttribute.getX(i);
		var y = positionAttribute.getY(i);
		var z = positionAttribute.getZ(i);
		vec = new THREE.Vector3(x, y, z);
		dist = vec.distanceTo(vector)
		if (dist < 3 * value) {
			z -= 1.5 * value - (0.5 * dist);
		}
		positionAttribute.setXYZ(i, x, y, z);
	}

}

function checkNew(scene, msg) {
	var propsComp = [];
	var propsComp = JSON.parse(msg);
	var groupObj = scene.getObjectByName("objects");
	var groupGeo = scene.getObjectByName("geos");
	var floor = scene.getObjectByName("floor");

	var objs = groupObj.children
	var found = false;

	for (let i = 0; i < propsComp.length; i++) {
		var name = propsComp[i].id;
		var obj = scene.getObjectByName(name);
		if (propsComp[i].pips > 6 && typeof obj == "undefined") {


			var newGeo = new THREE.PlaneBufferGeometry(150, 150, 150, 150);
			modifyFloor(newGeo, propsComp[i]);
			var mat = new THREE.MeshPhongMaterial();
			var floorNew = new THREE.Mesh(newGeo, mat);
			floorNew.visible = false;
			floorNew.name = name;

			groupGeo.add(floorNew);

			var arrayGeo = [];
			for (let j = 0; j < groupGeo.children.length; j++) {
				const element = groupGeo.children[j].geometry;
				arrayGeo.push(element)

			}

			floor.geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(arrayGeo);



			continue;
		}
		if (typeof obj == "undefined") {
			//nicht drin, es soll rein
			copyObj(scene, propsComp[i]);
		}
	}



	for (let i = 0; i < objs.length; i++) {
		var name = objs[i].name;
		for (let j = 0; j < propsComp.length; j++) {
			var name2 = propsComp[j].id;
			if (name == name2) {
				found = true;
				break;
			}
		}
		if (!found) {
			groupObj = groupObj.remove(scene.getObjectByName(name));
		}
		found = false;
	}

	for (let i = 0; i < groupGeo.children.length; i++) {
		var name = groupGeo.children[i].name;
		for (let j = 0; j < propsComp.length; j++) {
			var name2 = propsComp[j].id;
			if (name == name2) {
				found = true;
				break;
			}
		}
		if (!found) {
			if (groupGeo.getObjectByName(name)) {
				groupGeo.remove(scene.getObjectByName(name));
				var newGeo = new THREE.PlaneBufferGeometry(150, 150, 150, 150);
				var geos = [];
				geos.push(newGeo);
				for (let k = 0; k < groupGeo.children.length; k++) {
					geos.push(groupGeo.children[k].geometry);
				}
				// geos.push(groupGeo.children);
				var floor = scene.getObjectByName("floor");
				floor.geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geos);
				continue;
			}
		}
		found = false;

		for (let j = 0; j < groupObj.children.length; j++) {
			var geo = floor.geometry.attributes.position;
			var z = geo.getZ((75 + groupObj.children[j].position.x) + (151 * (75 + (groupObj.children[j].position.z) * (-1))));

			if (groupObj.children[j].type == "/treeB") {
				groupObj.children[j].position.y = propsAttributes.treeBY - z;
			}
			else if (groupObj.children[j].type == "/treeN") {
				groupObj.children[j].position.y = propsAttributes.treeNY - z;
			}
			else {
				groupObj.children[j].position.y = - z;
				groupObj.children[j].needsUpdate = true;
			}
		}
	}
}

function getRequest(path) {
	var request = new XMLHttpRequest();
	request.open("GET", path, false);
	request.send(null);
	return request;
}

// function getProps(props) {
// 	var request = getRequest("../obj/dice.json");
// 	var propsTemp = JSON.parse(request.responseText);

// 	// var isNotIn = true;
// 	// for (const die in propsTemp) {
// 	// 	if (Object.hasOwnProperty.call(propsTemp, die)) {
// 	// 		const d1 = propsTemp[die];
// 	// 		props.some(function(d2, index){
// 	// 			if (d1 == d2) {
// 	// 				isNotIn = true;
// 	// 				return true;
// 	// 			}
// 	// 			else{
// 	// 				return false;
// 	// 			}
// 	// 		});
// 	// 		if (isNotIn) {
// 	// 			props.push(d1);
// 	// 			isNotIn = false;
// 	// 		};		
// 	// 	}
// 	// }

// 	for (const die in propsTemp) {
// 		if (Object.hasOwnProperty.call(propsTemp, die)) {
// 			const d = propsTemp[die];
// 			props.push(d);
// 		}
// 	}

// 	return props;
// }

function getAsset(d) {
	var asset = {
		"path": "",
		"scale": 1,
		"rotation": -Math.PI / 2,
		"rotationZ": 0,
		"positionY": 0
	};

	switch (d.pips) {
		case 1:
			asset["path"] = "/houseS";
			asset["scale"] = propsAttributes.houseS;
			asset["rotationZ"] = d.angle;
			break;
		case 2:
			asset["path"] = "/houseM";
			asset["scale"] = propsAttributes.houseM;
			asset["rotationZ"] = d.angle;
			break;
		case 3:
			asset["path"] = "/houseL";
			asset["scale"] = propsAttributes.houseL;
			asset["rotationZ"] = d.angle;
			break;
		case 4:
			asset["path"] = "/treeN";
			asset["scale"] = propsAttributes.treeN;// * (Math.abs(d.angle) / 150);
			asset["positionY"] = propsAttributes.treeNY;
			asset["rotationZ"] = d.angle;
			break;
		case 5:
			asset["path"] = "/treeB";
			asset["scale"] = propsAttributes.treeB;// * (Math.abs(d.angle) / 150);
			asset["positionY"] = propsAttributes.treeBY;
			asset["rotationZ"] = d.angle;
			break;
		case 6:
			asset["path"] = "/mountain";
			asset["scale"] = propsAttributes.mountain;
			asset["rotationZ"] = Math.random() * 360;
			break;
		default:
			break;
	}

	return asset;
}

// function loadOneObj(group, d) {
// 	var asset = getAsset(d);

// 	var manager = new THREE.LoadingManager();
// 	manager.onProgress = function (item, loaded, total) {
// 		console.log(item, loaded, total);
// 	};

// 	var mtl = new THREE.MTLLoader(manager);
// 	mtl.load('obj/' + asset["path"] + '.mtl', function (materials) {
// 		materials.preload();
// 		var loader = new THREE.OBJLoader(manager);
// 		loader.setMaterials(materials)
// 		loader.load('obj/' + asset["path"] + '.obj', function (obj) {
// 			obj.name = d.id;
// 			obj.position.x = d.points[0];
// 			obj.position.z = d.points[1];
// 			obj.position.y = asset["positionY"];
// 			obj.scale.x = asset["scale"];
// 			obj.scale.y = asset["scale"];
// 			obj.scale.z = asset["scale"];
// 			obj.rotation.x = -Math.PI / 2;
// 			obj.rotation.z = asset["rotationZ"];
// 			obj.castShadow = true;
// 			group.add(obj);
// 		});
// 	});
// }

// function loadObj(scene, props) {
// 	var props = getProps(props);
// 	var group = new THREE.Group();
// 	group.name = "objects"
// 	props.forEach(d => {
// 		loadOneObj(group, d);
// 	});
// 	scene.add(group);
// }

function copyObj(scene, d) {
	var asset = getAsset(d);
	var model = scene.getObjectByName(asset["path"]).clone();
	var group = scene.getObjectByName("objects");
	var floor = scene.getObjectByName("floor");
	var geo = floor.geometry.attributes.position;
	var z = geo.getZ((75 + d.points[0]) + (151 * (75 + (d.points[1]) * (-1))));

	model.name = d.id;
	model.type = asset["path"];
	model.position.x = d.points[0];
	model.position.z = d.points[1];
	model.position.y = asset["positionY"] - z;
	model.scale.x = asset["scale"];
	model.scale.y = asset["scale"];
	model.scale.z = asset["scale"];
	model.rotation.x = -Math.PI / 2;
	model.rotation.z = asset["rotationZ"];
	model.castShadow = true;
	model.visible = true;
	group.add(model);
}

function initObj(scene) {
	var pips = {};
	pips.pips = 0;
	pips.angle = 0;
	var group = new THREE.Group();
	group.name = "dummys";
	scene.add(group);
	var groupObj = new THREE.Group();
	groupObj.name = "objects";
	scene.add(groupObj);
	var groupGeo = new THREE.Group();
	groupGeo.name = "geos";
	scene.add(groupGeo);

	for (var i = 1; i <= 6; i++) {
		pips.pips = i;
		loadObj(group, pips);

	}
	return scene;
}

function loadObj(group, d) {
	var asset = getAsset(d);
	var manager = new THREE.LoadingManager();
	manager.onProgress = function (item, loaded, total) {
		console.log(item, loaded, total);
	};

	var mtl = new THREE.MTLLoader(manager);
	mtl.load('obj/' + propsAttributes.path + asset["path"] + '.mtl', function (materials) {
		materials.preload();
		var loader = new THREE.OBJLoader(manager);
		loader.setMaterials(materials)
		loader.load('obj/' + propsAttributes.path + asset["path"] + '.obj', function (obj) {
			obj.name = asset["path"];
			obj.scale.x = asset["scale"];
			obj.scale.y = asset["scale"];
			obj.scale.z = asset["scale"];
			obj.rotation.x = -Math.PI / 2;
			obj.castShadow = true;
			obj.visible = false;
			obj.traverse(function (child) { child.castShadow = true; });
			group.add(obj);
		});
	});
}

function socketing(scene) {
	var connection = new WebSocket("ws://localhost:9001", "echo-protocol");
	connection.onmessage = function (event) {
		console.log("incoming")
		checkNew(scene, event.data)
	}
	connection.onerror = function (event) {
		console.log("error")
		setTimeout(socketing, 1000, scene)
	}
	connection.onopen = function (event) {
		console.log("connected")
	}

}

function main() {
	setAttributes("forest");
	var scene = new THREE.Scene();
	scene = loadScene(scene);


	var camera = initCamera();
	var renderer = initRenderer();
	var controls = new THREE.OrbitControls(camera, renderer.domElement);

	scene = initObj(scene);

	socketing(scene)

	update(renderer, scene, camera, controls)
	return scene;
}

scene = main();
console.log(scene);
// setInterval(checkNew, 1000, scene);