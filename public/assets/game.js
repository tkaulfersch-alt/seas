// hier wird ein phaser spiel erstellt und mit socket.io verbunden
// wir erstellen eine scene mit create und update , laden racetrack.jpg als titlesprite
// und erstellen ein auto als sprite, das sich mit den Pfeiltasten bewegen lässt
// wir verbinden das spiel mit socket.io, damit wir die position des autos an den server senden können
// und die position des autos von anderen Spielern empfangen können

const socket = io();

class OmegaIo extends Phaser.Scene {
    preload() {
        this.load.image("racetrack", "/assets/racetrack.jpg");
        this.load.image("car", "/assets/car1.png");

    }

    create() {
        this.add.tileSprite(0, 0, 1200, 800, "racetrack").setOrigin(0, 0);
        
        this.car = this.physics.add.sprite(400, 300, "car"). setCollideWorldBounds(true).setScale(0.2);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.remoteCars ={}
        this.setupMultiplayer();
    }

    update() {
            // hier können wir die position des autos aktualisieren und an den server senden
        // Bewegung des Autos mit den Pfeiltasten. links und rechts rotieren und vorwärts und rückwärts bewegen
        if (this.cursors.left.isDown) {
            this.car.setAngularVelocity(-150);
        } 
        else if (this.cursors.right.isDown) {
            this.car.setAngularVelocity(150);
        }else {
            this.car.setAngularVelocity(0);
        }
        
        
        if (this.cursors.up.isDown) {
            this.physics.velocityFromRotation(this.car.rotation - Math.PI / 2, 200, this.car.body.velocity);
        }
        else if (this.cursors.down.isDown) {
            this.physics.velocityFromRotation(this.car.rotation - Math.PI / 2, -100, this.car.body.velocity);
        } 
        else {
            this.car.body.velocity.scale(0.98);
        }
      
       socket.emit("update", {x: this.car.x, y: this.car.y, angle: this.car.angle});

    }
    addRemoteCar(player){
        if (player.id === this.playerId || this.remoteCars[player.id]) return; // don't add our own car

        const car = this.add.sprite( player.x, player.y, "car").setScale(0.2);
        car.setAngle(player.angle);
        car.setTint(player.color);
        this.remoteCars[player.id] = car;
    }


    setupMultiplayer() {
        socket.emit("ready");

        socket.on("init", (data) => {
            this.playerId = data.id;
            this.players = data.players;
            // hier übernehmen wir für unser car die position und den winkel und die farbe die wir vom server erhalten
            const playerData = this.players[this.playerId];
            this.car.setPosition(playerData.x, playerData.y);
            this.car.setAngle(playerData.angle);
            this.car.setTint(playerData.color);


            for (const player of Object.values(this.players)) {
                this.addRemoteCar(player);
            }
        });


        socket.on("playerMoved", (data) => {
            // Hier können wir die Position und den Winkel anderer Spieler aktualisieren
            const car = this.remoteCars[data.id];
            if (car) {
                car.setPosition(data.x, data.y);
                car.setAngle(data.angle);
            }
        });

        socket.on("playerJoined", (player) => {
            this.addRemoteCar(player);
        });
    }
}


new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: OmegaIo,
    parent: "game-container",
    physics: {
        default: "arcade",
        arcade: {
            debug: true,
        },
    },
});