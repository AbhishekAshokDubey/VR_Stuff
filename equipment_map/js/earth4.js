// For getting the basic earth right:
// http://blog.mastermaps.com/2013/09/creating-webgl-earth-with-threejs.html
$(document).ready(function () {
    var marker;
    var objects = []
    var width = 0
    var height = 0
    var healthy_color = 0x80ff80
    var faulty_color = 0xff8080
    var marker_objs = []
    var isassetstore = false
    all_markers = []


    THREE.ImageUtils.crossOrigin = '';
    //earth_scene.remove(earth_scene.getObjectByName("clouds"))

    function getURLParameter(name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(window.location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
    }

    if (getURLParameter('assetstore') == "true") {
        isassetstore = true
        all_markers = [[-0.07, 0, -0.5, faulty_color],
                    [0, 0, 0.5, healthy_color]]
    }
    else {
        all_markers = [[-0.07, 0, -0.5, faulty_color],
                        [0, 0, 0.5, healthy_color],
                        [0, -0.1, 0.49, healthy_color],
                        [0.18, -0.2, 0.425, healthy_color],
                        [-0.2, 0.2, 0.415, healthy_color]]
    }

    var webglEl = document.getElementById('webgl');

    if (!Detector.webgl) {
        Detector.addGetWebGLMessage(webglEl);
        //return;
        console.log("webgl not detected")
    }

    var isInIframe = (window.location != window.parent.location) ? true : false;

    if (isInIframe) {
        width = window.parent.$("#virtual_world_iframe").attr("width");
        height = window.parent.$("#virtual_world_iframe").attr("height");
    }
    else {
        width = window.innerWidth,
		height = window.innerHeight;
    }
    //console.log(window)
    if ((width == 0) || (height == 0)) {
        width = 600
        height = 300
    }

    //$('body').css('width', String(width)+'px');
    //$('html').css('width', String(width)+'px');
    // Earth params
    var radius = 0.5,
		segments = 32,
		rotation = 6;

    var scene = new THREE.Scene();

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

    var camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
    camera.position.z = 1.5;

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    scene.add(new THREE.AmbientLight(0x333333));

    var light = new THREE.DirectionalLight(0xffffff, 0.3);
    light.position.set(5, 3, 5);
    scene.add(light);

    var sphere = createSphere(radius, segments);
    sphere.name = 'globe'
    sphere.rotation.y = rotation;
    scene.add(sphere)
    //objects.push(sphere);

    var clouds = createClouds(radius, segments);
    clouds.name = 'clouds'
    clouds.rotation.y = rotation;
    scene.add(clouds)

    var stars = createStars(90, 64);
    scene.add(stars);

    var parent1 = new THREE.Object3D();
    scene.add(parent1);
    var pivot = new THREE.Object3D();
    parent1.add(pivot);



    for (i = 0; i < all_markers.length; i++) {
        var marker = create_marker(all_markers[i][3]);
        marker.position.x = all_markers[i][0];
        marker.position.y = all_markers[i][1];
        marker.position.z = all_markers[i][2];
        marker.rotation.x = 120 * Math.sign(all_markers[i][2]);
        if (isassetstore) {
            marker.name = "assetstore_" + i.toString()
        }
        else {
            marker.name = "rig_" + i.toString()
        }
        pivot.add(marker);
        objects.push(marker);
        marker_objs.push(marker);
    }

    var controls = new THREE.TrackballControls(camera);

    webglEl.appendChild(renderer.domElement);

    function onDocumentTouchStart(event) {
        event.preventDefault();
        event.clientX = event.touches[0].clientX;
        event.clientY = event.touches[0].clientY;
        onDocumentMouseDown(event);
    }

    function onDocumentMouseDown(event) {
        event.preventDefault();
        mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(objects);
        if (intersects.length > 0) {
            if (isassetstore) {
                window.location.href = '/assetstore.html';
            }
            else {
                if (intersects[0].object.material.color.getHex() == faulty_color) {
                    window.location.href = '/engine.html?faulty=true';
                }
                else {
                    window.location.href = '/engine?faulty=false';
                }
                //intersects[ 0 ].object.material.color.setHex( Math.random() * 0xffffff );
                /*var particle = new THREE.Sprite( particleMaterial );
				particle.position.copy( intersects[ 0 ].point );
				particle.scale.x = particle.scale.y = 16;
				scene.add( particle );*/
            }
        }
    }

    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('touchstart', onDocumentTouchStart, false);
    render();

    function render() {
        controls.update();
        sphere.rotation.y += 0.0003;
        clouds.rotation.y += 0.0003;
        for (i = 0; i <= marker_objs.length; i++) {
            if (marker_objs[i]) {
                marker_objs[i].rotation.y += 0.05;
                //marker_objs[i].lookAt(camera.position)
                //marker_objs[i].rotation.x += 0.1;
                //marker_objs[i].rotation.z += 0.1;

            }
        }
        parent1.rotation.y += 0.0003;
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }

    function create_marker(color=0x80ff80){
        var geo;
        var mesh;
        if(isassetstore){
            geo = new THREE.BoxBufferGeometry(0.005, 0.005, 0.01),
			mesh = new THREE.MeshBasicMaterial( {color: color} )
        }
        else{
            geo = new THREE.ConeGeometry(0.005, 0.01, 0.005),
			mesh = new THREE.MeshBasicMaterial( {color: color} )				
        }
        return new THREE.Mesh(geo,mesh);
    }

    function createSphere(radius, segments) {
        return new THREE.Mesh(
			new THREE.SphereGeometry(radius, segments, segments),
			new THREE.MeshPhongMaterial({
			    map: THREE.ImageUtils.loadTexture('images/2_no_clouds_4k.jpg'),
			    bumpMap: THREE.ImageUtils.loadTexture('images/elev_bump_4k.jpg'),
			    bumpScale: 0.005,
			    specularMap: THREE.ImageUtils.loadTexture('images/water_4k.png'),
			    specular: new THREE.Color('grey')
			})
		);
    }

    function createClouds(radius, segments) {
        return new THREE.Mesh(
			new THREE.SphereGeometry(radius + 0.003, segments, segments),
			new THREE.MeshPhongMaterial({
			    map: THREE.ImageUtils.loadTexture('images/fair_clouds_4k.png'),
			    transparent: true
			})
		);
    }

    function createStars(radius, segments) {
        return new THREE.Mesh(
			new THREE.SphereGeometry(radius, segments, segments),
			new THREE.MeshBasicMaterial({
			    map: THREE.ImageUtils.loadTexture('images/galaxy_starfield.png'),
			    side: THREE.BackSide
			})
		);
    }
    window.parent.$(".modal-backdrop").remove();
});