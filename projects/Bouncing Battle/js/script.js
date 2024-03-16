window.onload = function init() {

  console.log("page loaded and DOM is ready");

  const gameOverSound = document.querySelector('#gameOverSound');
  const obstacleSound = document.querySelector('#obstacleSound');
  obstacleSound.volume = 0.5;
  const powerUpSound = document.querySelector('#powerUpSound');
  const playerSound = document.querySelector('#playerSound');
  const missSound = document.querySelector('#missSound');
  const backgroundMusic = document.querySelector('#backgroundMusic');
  backgroundMusic.volume = 0.3;
  const muteButton = document.querySelector('#muteButton');

  muteButton.addEventListener('click', function(){
    gameOverSound.muted = !gameOverSound.muted; //change the mute states of all audio elements between true and false
    obstacleSound.muted = !obstacleSound.muted;
    powerUpSound.muted = !powerUpSound.muted;
    playerSound.muted = !playerSound.muted;
    missSound.muted = !missSound.muted;
    backgroundMusic.muted = !backgroundMusic.muted;
    muteButton.textContent = missSound.muted ? 'UNMUTE' : 'MUTE'; //Update the button text based on the mute state of one of the audio elements
  });

  const player1ColorSelector=document.querySelector('#player1ColorSelector');
  player1ColorSelector.addEventListener('change',function(){
    player1.color=player1ColorSelector.value;
    document.querySelectorAll('.p1Color').forEach(element =>{
      element.style.color=player1ColorSelector.value;
    });
    if(replayButton)drawPlayer(player1); //if game has started, draw the player 
  });
  const player2ColorSelector=document.querySelector('#player2ColorSelector');
  player2ColorSelector.addEventListener('change',function(){
    player2.color=player2ColorSelector.value;
    document.querySelectorAll('.p2Color').forEach(element => {
      element.style.color=player2ColorSelector.value;
    });
    if(replayButton)drawPlayer(player2);
  });

  const winStatus1=document.querySelector('#winStatus1');
  const winStatus2=document.querySelector('#winStatus2');
  const replayButtonDiv = document.querySelector('#replayButtonDiv');
  let replayButton; // = document.querySelector('#replayButton') but I cannot assign now since the element will be created dynamically.
  const dropdownButton = document.querySelector("#dropdownButton");
  const dropdownContent = document.querySelector("#dropdownContent");
  dropdownButton.addEventListener("click", function () {
    dropdownContent.style.display =(dropdownContent.style.display === "block") ? "none" : "block";
  });
  document.addEventListener('click', function(evt){ //to close menu if you click outside of menu and button
    if (!dropdownContent.contains(evt.target) && !dropdownButton.contains(evt.target)){
      //if I don't exclude button, when button is clicked for opening it will open and close menu due to event propagation
      dropdownContent.style.display="none";
    }
  });
  const canvas = document.querySelector("#gameCanvas");
  const w = canvas.width; 
  const h = canvas.height;
  const canvasBackgroundImage = new Image();
  canvasBackgroundImage.src = 'assets/canvasBackgroundImage.jpg';
  let ctx;
  let animationId,timerId;//flag variables to store return values of requestAnimationFrame() and setTimeout() for future manipulation
  let distanceX, distanceY;
  let isArrowUpPressed = false;
  let isArrowDownPressed = false;
  let isWPressed = false;
  let isSPressed = false;
  let didPlayer1Hit=true;
  let didPlayer2Hit=true;
  let player1Score=0;
  let player2Score=0;
  let isP1LastHitter=false;
  let isP2LastHitter=false;
  let hitCount=0;
  let startTime1, startTime2, timeRemaining1,timeRemaining2; //for keeping track of players' elapsed powerUp time between pause/play
  const timeGiven=10000;
  const winScore=10;

  let ball={
    x:45,
    y:250,
    speedX:5,
    speedY:0,
    radius:10,
    color:"white"
  };

  let player1={
    x:0,
    y:0,
    speed: 5,
    height:100,
    width: 35,
    color: 'mediumseagreen'
  };
  player1.y=(h-player1.height)/2;

  let player2={ 
    x:0,
    y:0,
    speed: 5,
    height:100,
    width: 35,
    color: 'orange'
  };
  player2.x=w-player2.width;
  player2.y=(h-player2.height)/2;

  let obstacle={
    x:(w-30)/2,
    y:-30,
    speed:5,
    angle:0,
    angularSpeed:0.001*Math.PI,
    size:30,
    color: 'red'
  };

  let powerUp={
    x:w/2,
    y:-940,//carefully chosen spot such that the powerUp will pass twice untouched by the ball of speed (5,0) if obstacles haven't randomised the game yet
    speed:3,
    radius:45,
    color1:"green",
    color2:"pink"
  };

  let p1Space={ //range of free space between player1 and obstacle, used for the hitMissChecker function 
    x1:45,
    x2:60
  }

  let p2Space={ //range of free space between player2 and obstacle, used for the hitMissChecker function
    x1:440,
    x2:455
  }


  document.addEventListener('keydown', keydownHandler);


  function keydownHandler(event) {
    if (event.key === 'ArrowUp') {
      event.preventDefault(); //prevent default scrolling
      isArrowUpPressed = true;
    } else if (event.key === 'ArrowDown') {
      event.preventDefault(); //prevent default scrolling
      isArrowDownPressed = true;
    } else if (event.key === 'w') {
      isWPressed = true;
    } else if (event.key === 's') {
      isSPressed = true;
    }
  }


  document.addEventListener('keyup', keyupHandler);
  

  function keyupHandler(event) {
    if (event.key === 'ArrowUp') {
      isArrowUpPressed = false;
    } else if (event.key === 'ArrowDown') {
      isArrowDownPressed = false;
    } else if (event.key === 'w') {
      isWPressed = false;
    } else if (event.key === 's') {
      isSPressed = false;
    }
  }


  document.querySelector('#playPauseButton').addEventListener('click',startStopBallLoop);


  function startStopBallLoop() {
    if (!replayButton) {
      replayButtonDiv.innerHTML= '<button id="replayButton">REPLAY</button>' //This makes replay button appear when game is started
      replayButton = document.querySelector('#replayButton'); //I can assign the element now that it exists
      replayButton.addEventListener('click', replay);
    }
    if (!animationId) { //if the animation frame is not already running, let it run
      ballLoop();
      playBackgroundMusic();
      playPauseButton.textContent ='PAUSE';
      resumeSetTimeout();
    } else { //if the animation frame is running, stop it 
      cancelAnimationFrame(animationId);
      animationId = undefined; // Reset the flag variable to indicate that the loop is stopped
      backgroundMusic.pause();
      playPauseButton.textContent ='PLAY';
      pauseSetTimeout();
    }
  }


  function replay(){
    if (animationId) { //if the animation frame is running, stop it.
      cancelAnimationFrame(animationId);
      animationId = undefined;
    }
    resetAllVariables();
    startStopBallLoop();
  }


  function playBackgroundMusic(){
    if((player1Score!==winScore)&&(player2Score!==winScore)){
      backgroundMusic.play();
    }
  }


  function pauseSetTimeout(){
    if((isP1LastHitter)||(isP2LastHitter))clearTimeout(timerId); //don't bother if no one has hit the ball
    timeRemaining1-=Date.now()-startTime1;
    timeRemaining2-=Date.now()-startTime2;
  }


  function resumeSetTimeout(){
    if((player1Score!==winScore)&&(player2Score!==winScore)){
      if(timeRemaining1>0){
        timerId=setTimeout(()=>{
          player1.height/=2; //restore paddle size
          player1.y+=player1.height/2; //centralize paddle
          powerUp.speed=3; //and let powerUp start falling again
        },timeRemaining1);
        startTime1=Date.now();
      }else if(timeRemaining2>0){
        timerId=setTimeout(()=>{ 
          player2.height/=2; //restore paddle size
          player2.y+=player2.height/2; //centralize paddle
          powerUp.speed=3; //and let powerUp start falling again
        },timeRemaining2);
        startTime2=Date.now();
      }
    }
  }


  function resetAllVariables(){
    backgroundMusic.pause();
    backgroundMusic.currentTime=0;
    gameOverSound.pause();
    didPlayer1Hit=true;
    didPlayer2Hit=true;
    isP1LastHitter=false;
    isP2LastHitter=false;
    hitCount=0;
    player1Score=0;
    player2Score=0;
    updateScore();
    winStatus1.innerHTML='';
    winStatus2.innerHTML='';
    clearTimeout(timerId); //abort any powerUp setTimeout waiting to half the height of a player
    startTime1=0;
    startTime2=0;
    timeRemaining1=0;
    timeRemaining2=0;
    ball.x=45;
    ball.y=250;
    ball.speedX=5;
    ball.speedY=0;
    player1.height=100; //in case the player is on powerUp
    player1.y=(h-player1.height)/2; //then centralize
    player2.height=100;
    player2.y=(h-player2.height)/2;
    obstacle.x=(w-30)/2;
    obstacle.y=-30;
    obstacle.speed=5;
    obstacle.angle=0;
    obstacle.angularSpeed=0.001*Math.PI;
    obstacle.size=30;
    powerUp.x=w/2;
    powerUp.y=-940;
    powerUp.speed=3;
    powerUp.radius=45;
  }


  function ballLoop(){
    ctx = canvas.getContext('2d');
    
    if((player1Score===winScore)||(player2Score===winScore)){//loop gets cancelled when called if someone is on winScore
      cancelAnimationFrame(animationId);
      animationId = undefined; // Reset the variable to indicate that the loop is stopped
    }else{
      // clear the canvas i.e remove previous ball and players
      ctx.clearRect(0, 0, w, h);
      
      ctx.drawImage(canvasBackgroundImage, 0, 0, w, h);

      //draw current ball, players, obstacle
      drawBall(ball); 
      drawPlayer(player1); 
      drawPlayer(player2);
      drawObstacle(obstacle);
      drawPowerUp(powerUp);
      
      //determine next position of ball, players, obstacle
      determineBallNextPosition(ball); 
      determinePlayerNextPosition(player1); 
      determinePlayerNextPosition(player2);
      determineObstacleNextPosition(obstacle);
      determinePowerUpNextPosition(powerUp);
      
      //handlers for canvas boundaries
      handleBallBoundaries(ball); 
      handlePlayerBoundaries(player1); 
      handlePlayerBoundaries(player2);
      handleObstacleBoundaries(obstacle);
      handlePowerUpBoundaries(powerUp);

      //check if a player hit or missed the ball (to update scores and know who claims powerUp)
      hitMissChecker();

      //handle collision between ball and players
      handleBallPlayerCollision(ball,player1);
      handleBallPlayerCollision(ball,player2);

      //handle collision between ball and Obstacle
      handleBallObstacleCollision();

      //handle collision between ball and powerUp
      handleBallPowerUpCollision(ball,powerUp);

      //request a new frame of animation in 1/60s
      animationId=requestAnimationFrame(ballLoop);
    }
  }


  function drawBall(b){
    ctx.save();
    ctx.translate(b.x,b.y);
    ctx.fillStyle=b.color;
    ctx.beginPath();
    ctx.arc(0, 0,b.radius, 0, 2*Math.PI);
    ctx.fill();
    ctx.restore();
  }


 function drawPlayer(p){
    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.fillStyle=p.color;
    ctx.fillRect(0, 0, p.width, p.height);
    ctx.restore();
  }


  function drawObstacle(ob){
    ctx.save();
    ctx.translate(ob.x+ob.size/2,ob.y+ob.size/2);
    ctx.rotate(ob.angle);
    ctx.fillStyle=ob.color;
    ctx.fillRect(-ob.size/2, -ob.size/2, ob.size, ob.size);
    ctx.fillStyle='black';
    ctx.fillRect(-ob.size*7/16, -ob.size*7/16, ob.size*7/8, ob.size*7/8);
    ctx.fillStyle=ob.color;
    ctx.fillRect(-ob.size*5/16, -ob.size*5/16, ob.size*5/8, ob.size*5/8);
    ctx.fillStyle='white';
    ctx.fillRect(-ob.size/4, -ob.size/4, ob.size/2, ob.size/2);
    ctx.restore();
    ctx.save();
    ctx.translate(ob.x+ob.size/2,ob.y+ob.size/2);
    ctx.fillStyle='black';
    ctx.beginPath();
    ctx.arc(0, 0,ob.size/4, 0, 2*Math.PI);
    ctx.fill();
    ctx.fillStyle=ob.color;
    ctx.fillRect(-Math.sqrt(2)*ob.size/16, -Math.sqrt(2)*ob.size/16, Math.sqrt(2)*ob.size/8, Math.sqrt(2)*ob.size/8);
    ctx.restore();
  }


  function drawPowerUp(u){
    ctx.save();
    ctx.translate(u.x,u.y);
    ctx.fillStyle=u.color1;
    ctx.beginPath();
    ctx.arc(0, 0,u.radius, 0, 2*Math.PI);
    ctx.fill();
    ctx.fillStyle=u.color2;
    ctx.beginPath();
    ctx.arc(0, 0,u.radius*2/3, 0, 2*Math.PI);
    ctx.fill();
    ctx.fillStyle=u.color1;
    ctx.beginPath();
    ctx.arc(0, 0,u.radius*1/3, 0, 2*Math.PI);
    ctx.fill();
    ctx.restore();
  }


  function determineBallNextPosition(b){
    b.x +=b.speedX;
    b.y += b.speedY;
  }


  function determinePlayerNextPosition(p){
    if (p===player1){
      if (isWPressed) {
        //console.log('W is pressed');
        p.y -= p.speed;
      }
      if (isSPressed) {
        //console.log('S is pressed');
        p.y += p.speed;
      }
    } else if (p===player2){
      if (isArrowUpPressed) {
        //console.log('Arrow Up is pressed');
        p.y -= p.speed;
      }
      if (isArrowDownPressed) {
        //console.log('Arrow Down is pressed');
        p.y += p.speed;
      }
    }
  }


  function determineObstacleNextPosition(ob){
    ob.y+=ob.speed;
    ob.angle+=ob.angularSpeed;
  }


  function determinePowerUpNextPosition(u){
    u.y +=u.speed;
  }


  function handleBallBoundaries(b){
    //for vertical boundaries:
    if((b.x + b.radius)> w){
      //it hit right canvas side so return ball to surface and direct ball left
      b.x =w-b.radius;
      b.speedX=-Math.abs(b.speedX);
    } else if((b.x-b.radius)<0){
      //it hit left canvas side so return ball to surface and direct ball right
      b.x =b.radius;
      b.speedX=Math.abs(b.speedX);
    }

    //for horizontal boundaries:
    if((b.y + b.radius)> h){
      //it hit bottom canvas side so return ball to surface and direct ball up
      b.y =h-b.radius;
      b.speedY=-Math.abs(b.speedY);
    } else if((b.y-b.radius)<0){
      //it hit top canvas side so return ball to surface and direct ball down
      b.y =b.radius;
      b.speedY=Math.abs(b.speedY);
    }
  }


  function handlePlayerBoundaries(p){
    if((p.y + p.height)> h){
      //return player to collision point
      p.y =h-p.height;
    } else if(p.y<0){
      //return player to collision point
      p.y =0;
    }
  }


  function handleObstacleBoundaries(ob){
    if(ob.y>h+1.21*ob.size){ // the obstacle just went out of sight
      ob.size=30+120*Math.random(); //randomize the size from 30 to 150
      ob.speed=1+4*Math.random(); //randomize the speed from 1 to 5
      ob.angularSpeed=Math.PI*(0.001+0.009*Math.random()); //randomize the angular speed from 0.001Pi to 0.01Pi
      ob.x=(w-ob.size)/2; //centralize the obstacle
      ob.y=-ob.size; //send it in from the top
    }
  }


  function handlePowerUpBoundaries(u){
    if(u.y>h+u.radius){ // the powerUp just went out of sight
      u.y=-u.radius; //send it in from the top
    }
  }


  function hitMissChecker(){
    if((ball.x>p1Space.x1)&&(ball.x<p1Space.x2)&&(ball.speedX===-Math.abs(ball.speedX))){//ball close to and heading towards player1
      didPlayer1Hit=false;
    }else if ((ball.x>p2Space.x1)&&(ball.x<p2Space.x2)&&(ball.speedX===Math.abs(ball.speedX))){//ball close to and heading towards player2
      didPlayer2Hit=false;
    }
    if(overlap(ball,player1)){ // a hit!
      didPlayer1Hit=true;
      isP1LastHitter=true;
      isP2LastHitter=false;
      accelerateBall();
      playPlayerSound();
    } else if (overlap(ball,player2)){ // a hit!
      didPlayer2Hit=true;
      isP1LastHitter=false;
      isP2LastHitter=true;
      accelerateBall();
      playPlayerSound();
    }
    if((ball.x>p1Space.x2)&&(ball.speedX===Math.abs(ball.speedX))&&(didPlayer1Hit===false)){//ball going away from player1 without contact (a miss!)
      player2Score+=1;
      updateScore();
      didPlayer1Hit=true;//reset to avoid detecting the miss continously
      deccelerateBall();
      playMissSound();
    } else if ((ball.x<p2Space.x1)&&(ball.speedX===-Math.abs(ball.speedX))&&(didPlayer2Hit===false)){//ball going away from player2 without contact (a miss!)
      player1Score+=1;
      updateScore();
      didPlayer2Hit=true;//reset to avoid detecting the miss continously
      deccelerateBall();
      playMissSound();
    }
  }


  function overlap(b,p){
    // Find the x and y coordinates of closest point to the circle within the rectangle
    let closestX = Math.max(p.x, Math.min(b.x, p.x + p.width));
    let closestY = Math.max(p.y, Math.min(b.y, p.y + p.height));

    // Calculate the distance between the circle's center and this closest point
    distanceX = b.x - closestX;
    distanceY = b.y - closestY;
    let distanceSquared = distanceX * distanceX + distanceY * distanceY;

    // If the distance is less than the circle's radius, there is a collision(overlap)
    return(distanceSquared < (b.radius * b.radius));
  }


  function accelerateBall(){
    hitCount+=1;
    if((hitCount%10===0)&&(hitCount<=50)){ //at every 10 hits we accelerate, and stop after 5 times of accelerating
      ball.speedX*=1.1;//This line and the next jointly multiply the resultant speed by 1.1
      ball.speedY*=1.1;
    }
  }


  function deccelerateBall(){
    ball.speedX*=5/Math.sqrt(ball.speedX**2+ball.speedY**2);//This line and the next jointly restore the resultant speed to 5
    ball.speedY*=5/Math.sqrt(ball.speedX**2+ball.speedY**2);
    hitCount=0; //resets the acceleration count
  }


  function playPlayerSound(){
    playerSound.currentTime = 75/1000;
    playerSound.play();
  }


  function playMissSound(){
    if((player1Score!==winScore)&&(player2Score!==winScore)){
      missSound.currentTime = 0;
      missSound.play();
    }
  }


  function updateScore(){
    document.querySelector('#player1Score').innerHTML=player1Score;
    document.querySelector('#player2Score').innerHTML=player2Score;
    if(player1Score===winScore){
      winStatus1.innerHTML='<br><br>YOU WIN';
      winStatus2.innerHTML='<br><br>YOU LOSE';
      backgroundMusic.pause();
      playGameOverSound();
      gameOverAnimation();
      clearTimeout(timerId); //abort any powerUp setTimeout waiting to half the height of a player
    } else if(player2Score===winScore){
      winStatus1.innerHTML='<br><br>YOU LOSE';
      winStatus2.innerHTML='<br><br>YOU WIN';
      backgroundMusic.pause();
      playGameOverSound();
      gameOverAnimation();
      clearTimeout(timerId); //abort any powerUp setTimeout waiting to half the height of a player
    }
  }


  function playGameOverSound(){
    gameOverSound.currentTime = 0;
    gameOverSound.play();
  }


  function gameOverAnimation(){
    ctx.font='bold 100px cursive';
    ctx.fillStyle = "orange";
    ctx.fillText("G", 68, 227);  
    setTimeout(()=>{
      ctx.fillStyle = "mediumseagreen";
      ctx.fillText("A", 168, 227);
    },1850);    
    setTimeout(()=>{
      ctx.fillStyle = "tomato";
      ctx.fillText("M", 268, 227);
    },3700);    
    setTimeout(()=>{
      ctx.fillStyle = "mediumseagreen";
      ctx.fillText("E", 368, 227);
    },5550);    
    setTimeout(()=>{
      ctx.fillStyle = "dodgerblue";
      ctx.fillText("O", 37, 325);
    },7400);    
    setTimeout(()=>{
      ctx.fillStyle = "violet";
      ctx.fillText("V", 137, 325);
    },9250);    
    setTimeout(()=>{
      ctx.fillStyle = "mediumseagreen";
      ctx.fillText("E", 237, 325);
    },11100);    
    setTimeout(()=>{
      ctx.fillStyle = "orange";
      ctx.fillText("R", 337, 325);
    },12950);    
    setTimeout(()=>{
      ctx.fillStyle = "tomato";
      ctx.fillText("!", 437, 325);
    },14800);
  }
 

  function handleBallPlayerCollision(b,p){
    if(overlap(b,p)){

      //we then decide how to deflect/direct the ball depending on which side of the rectangle it hit
      //or which side it hit more on, in case it hit the vertex
      if(Math.abs(distanceX)<Math.abs(distanceY)){
        //it hit the vertex more on a horizontal side of the rectangle(or entirely on a horizontal side if distanceX is zero)
        if(distanceY>0){
          //it hit bottom side so return ball to surface and direct ball down
          b.y=p.y+p.height+b.radius;
          b.speedY=Math.abs(b.speedY);
        } else {
          //it hit top side so return ball to surface and direct ball up 
          b.y=p.y-b.radius;
          b.speedY=-Math.abs(b.speedY); 
        }
      } else if(Math.abs(distanceX)>Math.abs(distanceY)){
        //it hit the vertex more on a vertical side of the rectangle(or entirely on a vertical side if distanceY is zero)
        if(distanceX>0){
          //it hit right side so return ball to surface and direct ball right
          b.x=p.x+p.width+b.radius; 
          b.speedX=Math.abs(b.speedX);  
        } else{
          //it hit left side so return ball to surface and direct ball left
          b.x=p.x-b.radius;
          b.speedX=-Math.abs(b.speedX); 
        }
      } else {//i.e Math.abs(distanceX)=Math.abs(distanceY) 
        if(distanceX===0){ 
          //as in |0|=|0| meaning the ball center has been forced by 'relative speed' or 'canvas boundaries' into the inside of player
          //Can only happen from top/bottom of ball cuz ball is never fast enough to enter player except combining an opposing vertical speed of player
          //or when the ball is crushed between player and canvas
          if(b.y<p.y+0.5*p.height){
            //it happened at top of player so return ball to surface of player and direct ball up 
            b.y=p.y-b.radius;
            b.speedY=-Math.abs(b.speedY);
          }else {
            //it happened at bottom of player so return ball to surface of player and direct ball down
            b.y=p.y+p.height+b.radius;
            b.speedY=Math.abs(b.speedY);
          }
        } else{
          //as in e.g |-3|=|+3| meaning it hit the vertex so evenly that the circle center and the rectangle's vertex form opposite vertices of a square
          if(distanceY>0&&distanceX>0){
            //it hit bottomRight corner so move ball bottomRightWards
            b.speedY=Math.abs(b.speedY); 
            b.speedX=Math.abs(b.speedX); 
          } else if(distanceY>0&&distanceX<0){
            // ...bottomLeftWards
            b.speedY=Math.abs(b.speedY); 
            b.speedX=-Math.abs(b.speedX); 
          } else if(distanceY<0&&distanceX>0){
            // ...topRightWards
            b.speedY=-Math.abs(b.speedY); 
            b.speedX=Math.abs(b.speedX); 
          } else {
             // ...topLeftWards
            b.speedY=-Math.abs(b.speedY); 
            b.speedX=-Math.abs(b.speedX);
          }
        }
      }
    }
  }

  
  function handleBallObstacleCollision(){
    let rotatedBall={}; //we create this anti-ball to coincide(or not) with obstacle unrotated rectangle
    //because if this anti-rotated ball coincides with obstacle unrotated rectangle, then actual ball coincides with actual (rotated) obstacle 
    rotatedBall.x=rotateAnticlockwiseAroundCenter(ball.x, ball.y,obstacle.x+obstacle.size/2,obstacle.y+obstacle.size/2, obstacle.angle).x;
    rotatedBall.y=rotateAnticlockwiseAroundCenter(ball.x, ball.y,obstacle.x+obstacle.size/2,obstacle.y+obstacle.size/2, obstacle.angle).y;
    rotatedBall.speedX=rotateAnticlockwiseAroundCenter(ball.speedX, ball.speedY,0,0, obstacle.angle).x;//speeds are not points but vectors so rotate about
    rotatedBall.speedY=rotateAnticlockwiseAroundCenter(ball.speedX, ball.speedY,0,0, obstacle.angle).y; //origin to preserve magnitude change direction
    rotatedBall.radius=ball.radius;
    obstacle.height=obstacle.size;// we explicitely give the square obstacle, height and width properties so we can handle collision like it was a player
    obstacle.width=obstacle.size;
    if (overlap(rotatedBall,obstacle)){
      playObstacleSound();
    }
    handleBallPlayerCollision(rotatedBall,obstacle); //after this function has made necessary alterations to anti-ball, we convert to our real ball
    ball.x=rotateClockwiseAroundCenter(rotatedBall.x, rotatedBall.y,obstacle.x+obstacle.size/2,obstacle.y+obstacle.size/2, obstacle.angle).x;
    ball.y=rotateClockwiseAroundCenter(rotatedBall.x, rotatedBall.y,obstacle.x+obstacle.size/2,obstacle.y+obstacle.size/2, obstacle.angle).y;
    ball.speedX=rotateClockwiseAroundCenter(rotatedBall.speedX, rotatedBall.speedY,0,0, obstacle.angle).x;
    ball.speedY=rotateClockwiseAroundCenter(rotatedBall.speedX, rotatedBall.speedY,0,0, obstacle.angle).y;
  }


  function playObstacleSound(){
    obstacleSound.currentTime = 0;
    obstacleSound.play();
  }


  function rotateClockwiseAroundCenter(x, y, cx, cy, angleInRadians){ //This is Anticlockwise for cartesian cuz HTML canvas y-axis is flipped
    // Translate to the origin
    let translatedX = x - cx;
    let translatedY = y - cy;
    // Rotate around the origin
    let rotatedX = translatedX * Math.cos(angleInRadians) - translatedY * Math.sin(angleInRadians);
    let rotatedY = translatedX * Math.sin(angleInRadians) + translatedY * Math.cos(angleInRadians);
    // Translate back to the original position
    let finalX = rotatedX + cx;
    let finalY = rotatedY + cy;
    return { x: finalX, y: finalY };
  }


  function rotateAnticlockwiseAroundCenter(x, y, cx, cy, angleInRadians){ //This is Clockwise for cartesian cuz HTML canvas y-axis is flipped
    // Translate to the origin
    let translatedX = x - cx;
    let translatedY = y - cy;
    // Rotate around the origin
    let rotatedX = translatedX * Math.cos(angleInRadians) + translatedY * Math.sin(angleInRadians);
    let rotatedY = -translatedX * Math.sin(angleInRadians) + translatedY * Math.cos(angleInRadians);
    // Translate back to the original position
    let finalX = rotatedX + cx;
    let finalY = rotatedY + cy;
    return { x: finalX, y: finalY };
  }
  

  function handleBallPowerUpCollision(b,u){
    if((b.x-u.x)**2+(b.y-u.y)**2<(b.radius+u.radius)**2){ //there is ball powerUp collision
      playPowerUpSound();
      u.y=-u.radius; //take powerUp out just above the canvas
      u.speed=0; //and make it stationary
      if(isP1LastHitter){
        player1.height*=2; //double paddle size
        player1.y-=player1.height/4; //centralize paddle
        timerId=setTimeout(()=>{ //wait 10 seconds (timerId can be used to abort the function before it executes using clearTimeout)
          player1.height/=2; //restore paddle size
          player1.y+=player1.height/2; //centralize paddle
          u.speed=3; //and let powerUp start falling again
        },timeGiven);
        startTime1=Date.now();
        timeRemaining1=timeGiven;
      }else if(isP2LastHitter){
        player2.height*=2; //double paddle size
        player2.y-=player2.height/4; //centralize paddle
        timerId=setTimeout(()=>{ //wait 10 seconds
          player2.height/=2; //restore paddle size
          player2.y+=player2.height/2; //centralize paddle
          u.speed=3; //and let powerUp start falling again
        },timeGiven);
        startTime2=Date.now();
        timeRemaining2=timeGiven;
      }else{ //neither of the players has hit the ball
        timerId=setTimeout(()=>{
          u.speed=3; //let powerUp start falling again after 10 seconds
        },timeGiven);
      }

    }
  }


  function playPowerUpSound(){
    powerUpSound.currentTime = 0;
    powerUpSound.play();
  }


};