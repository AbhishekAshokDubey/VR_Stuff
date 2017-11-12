delta = 0.1;

document.onkeydown = function (e) {
    switch (e.key) {
        case 'ArrowUp':
            console.log("up")
			camera.position.y = camera.position.y - delta;
            break;
        case 'ArrowDown':
            console.log("down")
			camera.position.y = camera.position.y + delta;
            break;
        case 'ArrowLeft':
            console.log("left")
			camera.position.x = camera.position.x - delta;
            break;
        case 'ArrowRight':
            console.log("right")
			//console.log(camera.position.x)
			camera.position.x = camera.position.x + delta;
			//console.log(camera.position.x)
    }
};