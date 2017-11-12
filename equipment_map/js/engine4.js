var container, stats;
objects = [];
var camera, scene, renderer;
var all_objects = [];
var all_object_names = ["cover_rims_1", "front_wings_3", "motor_4"]
var onProgress, onError
var front_wings;
var front_wheel;
var vr_canvas_height = window.innerHeight
var vr_canvas_width = window.innerWidth - 400
var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var isOpen = false
var open_clock_counter = 0

var isfaulty = false;

/*
d = scene.getObjectByName( "front_wings_3", true );
var box = new THREE.Box3().setFromObject(d);
box.getCenter()
{x: 6.215636759996414, y: 4.978958606719971, z: 36.48832988739014}
m = scene.getObjectByName( "motor_4", true );
var box = new THREE.Box3().setFromObject(m);
box.getCenter()
{x: 11.637608766555786, y: 5.056406617164612, z: 42.857173919677734}
*/

var p = new THREE.Vector3(6.215636759996414, 4.978958606719971, 36.48832988739014);
var ax = new THREE.Vector3(5.421972006559372, 0.07744801044464111, 6.368844032287598).normalize();
var frames = 300;
var r = 0, t = -1, a = 0;


current_motor_color = 0x80ff80
//console.log(getURLParameter('faulty'))
function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(window.location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}


$(document).ready(function(){
    if(isfaulty){
        $("#check_store").show()
    }
    $("#check_store").click(function(e) {
        e.stopPropagation();
        window.parent.$("#virtual_world_iframe").attr("src", "http://localhost:8000/index.html?assetstore=true")
        window.location = "http://localhost:8000/index.html?assetstore=true";
    });
});


if(getURLParameter('faulty') == "true"){
    current_motor_color = 0xff8080
    isfaulty = true;
}


function set_motor_color(color_hex = 0x999999){
    var motor_temp_list = scene.getObjectByName("motor_4").children;
    for(x in motor_temp_list){
        motor_temp_list[x].material.color.setHex(color_hex)
    }
}

    THREE.Object3D.prototype.rotateAroundWorldAxis = function () {
        var q1 = new THREE.Quaternion();
        return function (point, axis, angle) {
            axis = axis.normalize();
            q1.setFromAxisAngle(axis, angle);
            this.quaternion.multiplyQuaternions(q1, this.quaternion);
            this.position.sub(point);
            this.position.applyQuaternion(q1);
            //this.position.setEulerFromQuaternion( q1 );
            this.position.add(point);
            return this;
        }
    }();

    init();

    function onDocumentTouchStart( event ) {
        event.preventDefault();
        console.log("touch")
        event.clientX = event.touches[0].clientX;
        event.clientY = event.touches[0].clientY;
        onDocumentMouseDown( event );
    }

    function onDocumentMouseDown( event ) {
        event.preventDefault();
        console.log("down")
        mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
        raycaster.setFromCamera( mouse, camera );
        var intersects = raycaster.intersectObjects( all_objects , true);
        console.log(intersects)
        if ( intersects.length > 0 ) {
            if(isOpen){
                isOpen = false;
                set_motor_color(current_motor_color);
                scene.getObjectByName( "cover_rims_1" ).position.x = 0;
                $("#statistics_container").css("display","None");
            }
            else{
                isOpen = true;
                open_clock_counter = renderer.domElement.clientWidth;
                //console.log("in")
                set_motor_color(current_motor_color);
                $("#statistics_container").css("display","inline");
            }
            //intersects[ 0 ].object.material.color.setHex( Math.random() * 0xffffff );
            /*var particle = new THREE.Sprite( particleMaterial );
            particle.position.copy( intersects[ 0 ].point );
            particle.scale.x = particle.scale.y = 16;
            scene.add( particle );*/
        }
    }

    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'touchstart', onDocumentTouchStart, false );


    animate();

    function load_obj(f_name) {
        var mtlLoader = new THREE.MTLLoader();
        mtlLoader.setPath('objects/');
        mtlLoader.load(f_name + '.mtl', function (materials) {

            materials.preload();

            var objLoader = new THREE.OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.setPath('objects/');
            objLoader.load(f_name + '.obj', function (object) {
                if(f_name == "motor_4"){
                    object.children[0].material.color.setHex(current_motor_color)
                }
                scene.add(object);
                object.name = f_name;
                all_objects.push(object)

            }, onProgress, onError);
        });
    }

    function init() {
        container = document.createElement('div');
        container.id = "main_canvas_container"
        document.body.appendChild(container);

        camera = new THREE.PerspectiveCamera(5, window.innerWidth / window.innerHeight, 1, 2000);
        camera.position.z = -400;
        camera.position.x = -100;

        // scene
        scene = new THREE.Scene();

        var ambient = new THREE.AmbientLight(0x444444);
        scene.add(ambient);

        var directionalLight = new THREE.DirectionalLight(0xffeedd);
        directionalLight.position.set(0, 0, -250).normalize();
        scene.add(directionalLight);

        onProgress = function (xhr) {
            if (xhr.lengthComputable) {
                var percentComplete = xhr.loaded / xhr.total * 100;
                console.log(Math.round(percentComplete, 2) + '% downloaded');
            }
        };
        onError = function (xhr) { };

        //THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );
        for (i in all_object_names) { load_obj(all_object_names[i]) }

        renderer = new THREE.WebGLRenderer({alpha: true});
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(vr_canvas_width, vr_canvas_height);
        renderer.setClearColor(0xffffff, 0.0);
        renderer.domElement.id = 'main_canvas';
        container.appendChild(renderer.domElement);

        document.addEventListener( 'mousemove', onDocumentMouseMove, false );
        window.addEventListener('resize', onWindowResize, false);
    }

    function onWindowResize() {
        vr_canvas_height = window.innerHeight
        vr_canvas_width = window.innerWidth - 400
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;

        camera.aspect = vr_canvas_width / vr_canvas_height;
        camera.updateProjectionMatrix();

        renderer.setSize(vr_canvas_width, vr_canvas_height);
    }

    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX) / 2;
        mouseY = (event.clientY - windowHalfY) / 2;
        //mouseX = event.clientX
        //mouseY = event.clientY		
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    function render() {
        camera.position.x += ( - mouseX - camera.position.x ) * 1.0;
        camera.position.y += ( - mouseY - camera.position.y ) * 1.0;
 
        if (isOpen && (open_clock_counter>0)){
            //console.log("moving")
            scene.getObjectByName( "cover_rims_1" ).position.x += -1;
            open_clock_counter -= 1;
        }

        if (typeof front_wheel != "undefined") {
            rotation = new Date().getTime() * 0.000001
            front_wheel.rotateAroundWorldAxis(p, ax, rotation);
        }
        else {
            front_wheel = scene.getObjectByName("front_wings_3", false)
        }
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
    }