var camera, scene, renderer;
var geometry, material, mesh;
var controls;

THREE.ImageUtils.crossOrigin = '';

var obj_path = "objects/"
var vr_images_path = "images/"

var objects = [];

//all_object_names = ["Warehouse", "engine", "untitled", "shocker_absorber","motor_all", "somemach"]
//all_object_position = [[0,0,0],  [1.2,0.35,0.5], [1.1,0.3,-0.5], [-1,0.2,-0.5], [-1,1,-4], [-1.5,0.1,0.5]]
var all_object_names = ["Warehouse", "engine", "untitled", "shocker_absorber","motor_all"]
var all_object_position = [[0,0,0],  [1.2,0.35,0.5], [1.1,0.3,-0.5], [-1,0.2,-0.5], [-1,1,-4]]
var all_object_scale = [1.0, 0.01, 0.05, 0.1, 0.05]
var all_object_rotation = [[0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0]]

var ray_cast_object_names = ["engine", "untitled","amortizer", "shocker_absorber","motor_all"]

var all_object_diplay_name = {
	"Warehouse": "Asset Store",
	"engine":"LK Engine",
	"untitled": "Pump Motor",
	"shocker_absorber": "Shocker Absorber",
	"motor_all":"Engine Motor"	
}

var all_object_discription = {
	"Warehouse": "Place: Huston, US<br/>Total Assets: 1,24,879<br/>ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore",
	"engine":"Cost: $1,234 <br/>ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore",
	"untitled": "Cost: $942 <br/>ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore",
	"shocker_absorber": "Cost: $541 <br/>ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore",
	"motor_all": "Cost: $473 <br/>ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore",	
}

ray_cast_obj = [];
all_objects = []

var raycaster;
var on_focus_object = null;

var check;
var controlsEnabled = false;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();


var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');
// http://www.html5rocks.com/en/tutorials/pointerlock/intro/

function set_scale(obj, scale){
	if(obj.type == "Group"){
		obj.children.forEach(function(m) {
			m.scale.set(scale,scale,scale)
		});
	}
	else{
		obj.scale.set(scale,scale,scale)
	}
}

function get_crosshair(){
	var material = new THREE.LineBasicMaterial({ color: 0xAAFFAA });

	// crosshair size
	var x = 0.01, y = 0.01;

	var geometry = new THREE.Geometry();

	// crosshair
	geometry.vertices.push(new THREE.Vector3(0, y, 0));
	geometry.vertices.push(new THREE.Vector3(0, -y, 0));
	geometry.vertices.push(new THREE.Vector3(0, 0, 0));
	geometry.vertices.push(new THREE.Vector3(x, 0, 0));    
	geometry.vertices.push(new THREE.Vector3(-x, 0, 0));

	var crosshair = new THREE.Line( geometry, material );

	// place it in the center :/
	//var crosshairPercentX = 0;
	//var crosshairPercentY = 0;
	var crosshairPercentX = 49.5;
	var crosshairPercentY = 56;

	var crosshairPositionX = (crosshairPercentX / 100) * 2 - 1;
	var crosshairPositionY = (crosshairPercentY / 100) * 2 - 1;

	crosshair.position.x = crosshairPositionX * camera.aspect;
	crosshair.position.y = crosshairPositionY;

	crosshair.position.z = -1;
	
	return crosshair;
}



function load_obj(f_name, scale, position, rotation) {
	var mtlLoader = new THREE.MTLLoader();
	mtlLoader.setCrossOrigin("");
	mtlLoader.setPath(obj_path);
	mtlLoader.load(f_name + '.mtl', function (materials) {

		materials.preload();
		var objLoader = new THREE.OBJLoader();
		objLoader.setMaterials(materials);
		objLoader.setPath(obj_path);
		objLoader.load(f_name + '.obj', function (object) {
			if(f_name != "Warehouse"){
				object.position.x= position[0];
				object.position.y= position[1];
				object.position.z= position[2];

				object.rotation.x = rotation[0];
				object.rotation.y = rotation[1];
				object.rotation.z = rotation[2];
			}
			if(f_name=="motor_all"){
				var motor_temp_list = object.children;
				for(x in motor_temp_list){
					motor_temp_list[x].material.color.setHex(0x80ff80)
				}
			}
			object.name = f_name;
			set_scale(object, scale)
			scene.add(object);
			all_objects.push(object)
			if(ray_cast_object_names.indexOf(f_name.toLowerCase()) > -1){
				ray_cast_obj.push(object)
			}			
		}, onProgress, onError);
	});
}

var added_in_cart = []


function freq(arr) {
    var a = [], b = [], prev;
    arr.sort();
    for ( var i = 0; i < arr.length; i++ ) {
        if ( arr[i] !== prev ) {
            a.push(arr[i]);
            b.push(1);
        } else {
            b[b.length-1]++;
        }
        prev = arr[i];
    }
    
    return [a, b];
}


function generate_html(){
	html_str = "<b>User Cart:</b> <br/>"
	cart_freq = freq(added_in_cart)
	for (i in cart_freq[0]){
		html_str += all_object_diplay_name[cart_freq[0][i]] +": "+ cart_freq[1][i]+"<br/>"	
	}
	return html_str
}

function show_info(obj_name){
	$("#asset_info").html(all_object_diplay_name[obj_name] + "<br/><br/>" + all_object_discription[obj_name])
	$("#asset_info").show()
}

function hide_info(){
	$("#asset_info").hide()
}

function set_raycast_obj(){
		var mouse = new THREE.Vector2(); // create once
		var current_obj = null
		mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

		raycaster.setFromCamera( mouse, camera );
		var intersects = raycaster.intersectObjects( ray_cast_obj, true);
        // Change color if hit block
        if ( intersects.length > 0 ) {
			current_obj = intersects[0].object
			console.log(current_obj.name)
			if (current_obj.parent.type.toLowerCase() == "group"){
				current_obj = intersects[0].object.parent
			}
			if( on_focus_object != current_obj ){
				on_focus_object = current_obj
				obj_name = current_obj.name
				show_info(obj_name)
				scale = all_object_scale[all_object_names.indexOf(obj_name)]
				set_scale(current_obj, scale * 1.1)
			}
        }
		else{
			if(on_focus_object){
				hide_info()
				scale = all_object_scale[all_object_names.indexOf(obj_name)]
				set_scale(on_focus_object, scale)
			}
			on_focus_object = null;
		}
}

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if (havePointerLock) {
    var element = document.body;
    var pointerlockchange = function (event) {
        if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
            controlsEnabled = true;
            controls.enabled = true;
            blocker.style.display = 'none';
        } else {
            controls.enabled = false;
            blocker.style.display = '-webkit-box';
            blocker.style.display = '-moz-box';
            blocker.style.display = 'box';
            instructions.style.display = '';
        }
    };

    var pointerlockerror = function (event) {
        instructions.style.display = '';
    };

    // Hook pointer lock state change events
    document.addEventListener('pointerlockchange', pointerlockchange, false);
    document.addEventListener('mozpointerlockchange', pointerlockchange, false);
    document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

    document.addEventListener('pointerlockerror', pointerlockerror, false);
    document.addEventListener('mozpointerlockerror', pointerlockerror, false);
    document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

    instructions.addEventListener('click', function (event) {
        instructions.style.display = 'none';
        // Ask the browser to lock the pointer
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        element.requestPointerLock();

    }, false);

} else {
    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
}

init();
animate();


function init() {

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xDCDCDC);

    var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);

	crosshair = get_crosshair()
	camera.add( crosshair );
	
    controls = new THREE.PointerLockControls(camera);
    scene.add(controls.getObject());

	
    var onKeyDown = function (event) {
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                moveForward = true;
                break;
            case 37: // left
            case 65: // a
                moveLeft = true; break;
            case 40: // down
            case 83: // s
                moveBackward = true;
                break;
            case 39: // right
            case 68: // d
                moveRight = true;
                break;
            case 32: // space
                if (canJump === true) velocity.y += 30;
                canJump = false;
                break;
        }
    };

    var onKeyUp = function (event) {
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                moveForward = false;
                break;
            case 37: // left
            case 65: // a
                moveLeft = false;
                break;
            case 40: // down
            case 83: // s
                moveBackward = false;
                break;
            case 39: // right
            case 68: // d
                moveRight = false;
                break;
        }
    };
	
	var onDocumentMouseDown = function ( event ){
		if(on_focus_object){
			added_in_cart.push(on_focus_object.name)
			$("#user_cart").html(generate_html())
			console.log("clicked: "+on_focus_object.name)
		}
	}

	var onDocMouseMove = function(event){
		console.log(set_raycast_obj())
	}
	
	document.addEventListener("mousemove", onDocMouseMove, false);
	document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

	//raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
	//raycaster = new THREE.Raycaster( camera.position, mouseVector.subSelf( camera.position ).normalize() );
	raycaster = new THREE.Raycaster( camera.getWorldPosition(), camera.getWorldDirection());

    // floor
	geometry = new THREE.PlaneGeometry( 1000, 1000, 10, 10 );
	geometry.rotateX( - Math.PI / 2 );
	floorTexture = new THREE.TextureLoader().load( vr_images_path+'grass.jpg' );
	floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
	floorTexture.repeat.set(20, 20);
	material = new THREE.MeshBasicMaterial({map: floorTexture}),
	mesh = new THREE.Mesh( geometry, material );
    scene.add(mesh);

    // objects
	onProgress = function (xhr) {
		if (xhr.lengthComputable) {
			var percentComplete = xhr.loaded / xhr.total * 100;
			console.log(Math.round(percentComplete, 2) + '% downloaded');
		}
	};
	onError = function (xhr) { };

	//THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );
	for (i in all_object_names) { load_obj(all_object_names[i], all_object_scale[i], all_object_position[i], all_object_rotation[i]) }
    //


	var material = new THREE.LineBasicMaterial({ color: 0xAAFFAA });

	
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //
    window.addEventListener('resize', onWindowResize, false);
	
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (controlsEnabled) {
        raycaster.ray.origin.copy(controls.getObject().position);
        raycaster.ray.origin.y -= 10;

        var intersections = raycaster.intersectObjects(all_objects);
        var isOnObject = intersections.length > 0;
        var time = performance.now();
        var delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 10.0 * delta; // 100.0 = mass

        if (moveForward) velocity.z -= 30.0 * delta;
        if (moveBackward) velocity.z += 30.0 * delta;

        if (moveLeft) velocity.x -= 30.0 * delta;
        if (moveRight) velocity.x += 30.0 * delta;

        if (isOnObject === true) {
            velocity.y = Math.max(0, velocity.y);
            canJump = true;
        }

        controls.getObject().translateX(velocity.x * delta);
        controls.getObject().translateY(velocity.y * delta);
        controls.getObject().translateZ(velocity.z * delta);

        if (controls.getObject().position.y <= 1) {
            velocity.y = 0;
            controls.getObject().position.y = 1;
            canJump = true;
        }
		//controls.getObject().position.y = 1;
        prevTime = time;
    }
    renderer.render(scene, camera);
}