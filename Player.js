let minJumpSpeed = 5
let maxJumpSpeed = 22
let maxJumpTimer = 30
let jumpSpeedHorizontal = 8
let terminalVelocity = 20
let gravity = 0.6;

let runSpeed = 4;
let maxBlizzardForce = 0.3;
let blizzardMaxSpeedHoldTime = 150
let blizzardAccelerationMagnitude = 0.003;
let blizzardImageSpeedMultiplier = 50;

let iceFrictionAcceleration = 0.2;
let playerIceRunAcceleration = 0.2;

class Player {


    constructor() {
        this.width = 50;
        this.height = 65;

        this.currentPos = createVector(width / 2, height - 200); // this is the top left corner of the hitbox
        this.currentSpeed = createVector(0, 0);
        this.isOnGround = false;

        this.jumpHeld = false;
        this.jumpTimer = 0;
        this.leftHeld = false;
        this.rightHeld = false;


        this.facingRight = true;
        this.hasBumped = false;
        this.isRunning = false;
        this.isSlidding = false;
        this.currentRunIndex = 1;
        this.runCycle = [run1Image, run1Image, run1Image, run1Image, run1Image, run1Image, run1Image, run1Image, run1Image, run1Image, run1Image, run1Image, run1Image, run2Image, run2Image, run2Image, run2Image, run2Image, run2Image, run3Image, run3Image, run3Image, run3Image, run3Image, run3Image, run3Image, run3Image, run3Image, run3Image, run3Image, run3Image, run3Image, run2Image, run2Image, run2Image, run2Image, run2Image, run2Image]
        this.sliddingRight = false;

        this.currentLevelNo = 0;

        this.jumpStartingHeight = 0;
        this.hasFallen = false;

        this.blizzardForce = 0;
        this.blizzardForceAccelerationDirection = 1;
        this.maxBlizzardForceTimer = 0;
        this.snowImagePosition = 0;

        this.playersDead = false;

        this.previousSpeed = createVector(0, 0);

        this.maxCollisionChecks = 20;
        this.currentNumberOfCollisionChecks = 0;

    }

    ResetPlayer() {
        this.currentPos = createVector(width / 2, height - 200); // this is the top left corner of the hitbox
        this.currentSpeed = createVector(0, 0);
        this.isOnGround = false;

        this.jumpHeld = false;
        this.jumpTimer = 0;
        this.leftHeld = false;
        this.rightHeld = false;


        this.facingRight = true;
        this.hasBumped = false;
        this.isRunning = false;
        this.isSlidding = false;
        this.currentRunIndex = 1;
        this.sliddingRight = false;

        this.currentLevelNo = 0;

        this.jumpStartingHeight = 0;
        this.hasFallen = false;

        this.blizzardForce = 0;
        this.blizzardForceAccelerationDirection = 1;
        this.maxBlizzardForceTimer = 0;
        this.snowImagePosition = 0;

        this.playersDead = false;
        this.previousSpeed = createVector(0, 0)
    }


    Update() {
        if (this.playersDead)//|| this.hasFinishedInstructions)
            return;
        
        let currentLevel = levels[this.currentLevelNo];
        
        let currentLines = [...currentLevel.lines]; 

        for (let tl of currentLevel.toggleLines) {
            if (tl.isCollidable) { 
                currentLines.push(tl);
            }
        }
        
        this.UpdatePlayerSlide(currentLines);
        this.ApplyGravity()
        this.ApplyBlizzardForce();
        this.UpdatePlayerRun(currentLines);
        this.currentPos.add(this.currentSpeed);
        this.previousSpeed = this.currentSpeed.copy();

        this.currentNumberOfCollisionChecks = 0;
        this.CheckCollisions(currentLines)
        this.UpdateJumpTimer()
        this.CheckForLevelChange();
        this.CheckForCoinCollisions();

    }

    ApplyGravity() {
        if (!this.isOnGround) {
            if (this.isSlidding) {
                this.currentSpeed.y = min(this.currentSpeed.y + gravity * 0.5, terminalVelocity * 0.5);
                if (this.sliddingRight) {
                    this.currentSpeed.x = min(this.currentSpeed.x + gravity * 0.5, terminalVelocity * 0.5);
                } else {
                    this.currentSpeed.x = max(this.currentSpeed.x - gravity * 0.5, -terminalVelocity * 0.5);
                }
            } else {

                this.currentSpeed.y = min(this.currentSpeed.y + gravity, terminalVelocity);
            }
        }
    }


    ApplyBlizzardForce() {

        if (abs(this.blizzardForce) >= maxBlizzardForce) {
            this.maxBlizzardForceTimer += 1;
            if (this.maxBlizzardForceTimer > blizzardMaxSpeedHoldTime) {
                this.blizzardForceAccelerationDirection *= -1;
                this.maxBlizzardForceTimer = 0;
            }
        }


        this.blizzardForce += this.blizzardForceAccelerationDirection * blizzardAccelerationMagnitude;
        if (abs(this.blizzardForce) > maxBlizzardForce) {
            this.blizzardForce = maxBlizzardForce * this.blizzardForceAccelerationDirection;
        }


        this.snowImagePosition += this.blizzardForce * blizzardImageSpeedMultiplier;


        if (!this.isOnGround && levels[this.currentLevelNo].isBlizzardLevel) {
            this.currentSpeed.x += this.blizzardForce;
        }


    }

    CheckCollisions(currentLines) {

        let collidedLines = [];
        for (let i = 0; i < currentLines.length; i++) {
            if (this.IsCollidingWithLine(currentLines[i])) {
                collidedLines.push(currentLines[i]);
            }
        }

        let chosenLine = this.GetPriorityCollision(collidedLines)

        let potentialLanding = false;
        if (chosenLine == null) return;

        if (chosenLine.isHorizontal) {
            if (this.IsMovingDown()) {
                this.currentPos.y = chosenLine.y1 - this.height;

                if (collidedLines.length > 1) {
                    potentialLanding = true;
                    if (levels[this.currentLevelNo].isIceLevel) {
                        this.currentSpeed.y = 0;
                        if (this.IsMovingRight()) {
                            this.currentSpeed.x -= iceFrictionAcceleration;
                        } else {
                            this.currentSpeed.x += iceFrictionAcceleration;
                        }

                    } else {
                        this.currentSpeed = createVector(0, 0)

                    }

                } else {
                    this.playerLanded();
                }

            } else {

                this.currentSpeed.y = 0 - this.currentSpeed.y / 2;
                this.currentPos.y = chosenLine.y1;
                bumpSound.playMode('sustain');
                bumpSound.play();

            }


        } else if (chosenLine.isVertical) {
            if (this.IsMovingRight()) {
                this.currentPos.x = chosenLine.x1 - this.width;
            } else if (this.IsMovingLeft()) {
                this.currentPos.x = chosenLine.x1;
            } else {
                if (this.previousSpeed.x > 0) {
                    this.currentPos.x = chosenLine.x1 - this.width;
                } else {
                    this.currentPos.x = chosenLine.x1;
                }
            }
            this.currentSpeed.x = 0 - this.currentSpeed.x / 2;
            if (!this.isOnGround) {
                this.hasBumped = true;
                bumpSound.playMode('sustain');
                bumpSound.play();
            }
        } else {
            this.isSlidding = true;
            this.hasBumped = true;

            if (chosenLine.diagonalCollisionInfo.collisionPoints.length === 2) {
                let midpoint = chosenLine.diagonalCollisionInfo.collisionPoints[0].copy();
                midpoint.add(chosenLine.diagonalCollisionInfo.collisionPoints[1].copy());
                midpoint.mult(0.5);

                let left = chosenLine.diagonalCollisionInfo.leftSideOfPlayerCollided;
                let right = chosenLine.diagonalCollisionInfo.rightSideOfPlayerCollided;
                let top = chosenLine.diagonalCollisionInfo.topSideOfPlayerCollided;
                let bottom = chosenLine.diagonalCollisionInfo.bottomSideOfPlayerCollided;

                let playerCornerPos = null;

                if (top && left) {
                    playerCornerPos = this.currentPos.copy();

                }
                if (top && right) {
                    playerCornerPos = this.currentPos.copy();
                    playerCornerPos.x += this.width;

                }
                if (bottom && left) {
                    playerCornerPos = this.currentPos.copy();
                    playerCornerPos.y += this.height;
                    this.sliddingRight = true;
                }
                if (bottom && right) {
                    playerCornerPos = this.currentPos.copy();
                    playerCornerPos.y += this.height;
                    playerCornerPos.x += this.width;
                    this.sliddingRight = false;
                }
                let correctionX = 0;
                let correctionY = 0;

                if (playerCornerPos === null) {
                    print("fuck");
                    print(left, right, top, bottom);
                    playerCornerPos = this.currentPos.copy();

                    if (this.IsMovingDown()) {
                        playerCornerPos.y += this.height;
                    }
                    if (this.IsMovingRight()) {
                        playerCornerPos.x += this.width;
                    }
                }
                correctionX = midpoint.x - playerCornerPos.x;
                correctionY = midpoint.y - playerCornerPos.y;


                this.currentPos.x += correctionX;
                this.currentPos.y += correctionY;

                let lineVector = createVector(chosenLine.x2 - chosenLine.x1, chosenLine.y2 - chosenLine.y1)
                lineVector.normalize();

                let speedMagnitude = p5.Vector.dot(this.currentSpeed, lineVector);
                this.currentSpeed = p5.Vector.mult(lineVector, speedMagnitude);
                if (top) {
                    this.currentSpeed = createVector(0, 0)
                    this.isSlidding = false;
                }


            } else {
                let left = chosenLine.diagonalCollisionInfo.leftSideOfPlayerCollided;
                let right = chosenLine.diagonalCollisionInfo.rightSideOfPlayerCollided;
                let top = chosenLine.diagonalCollisionInfo.topSideOfPlayerCollided;
                let bottom = chosenLine.diagonalCollisionInfo.bottomSideOfPlayerCollided;

                let playerCornerPos = null;
                if (top) {
                    let closestPointY = max(chosenLine.y1, chosenLine.y2)
                    this.currentPos.y = closestPointY + 1;
                    this.currentSpeed.y = 0 - this.currentSpeed.y / 2;

                }
                if (bottom) {
                    let closestPointY = min(chosenLine.y1, chosenLine.y2)
                    this.currentSpeed = createVector(0, 0)
                    this.currentPos.y = closestPointY - this.height - 1;

                }
                if (left) {
                    this.currentPos.x = max(chosenLine.x1, chosenLine.x2) + 1;
                    if (this.IsMovingLeft())
                        this.currentSpeed.x = 0 - this.currentSpeed.x / 2;
                    if (!this.isOnGround) this.hasBumped = true;
                }
                if (right) {
                    this.currentPos.x = min(chosenLine.x1, chosenLine.x2) - this.width - 1;
                    if (this.IsMovingRight())
                        this.currentSpeed.x = 0 - this.currentSpeed.x / 2;

                    if (!this.isOnGround) this.hasBumped = true;
                }


            }


        }
        if (collidedLines.length > 1) {
            this.currentNumberOfCollisionChecks += 1;
            if (this.currentNumberOfCollisionChecks > this.maxCollisionChecks) {
                this.playersDead = true;
            } else {
                this.CheckCollisions(currentLines);
            }

            if (potentialLanding) {
                if (this.IsPlayerOnGround(currentLines)) {
                    this.playerLanded();
                }

            }
        }

    }

    Show() {
        if (this.playersDead)
            return;
        push();

        translate(this.currentPos.x, this.currentPos.y);

        let imageToUse = this.GetImageToUseBasedOnState();

        if (!this.facingRight) {
            push()
            scale(-1, 1);
            if (this.hasBumped) {
                image(imageToUse, -70, -30);
            } else if (imageToUse == jumpImage || imageToUse == fallImage) {
                image(imageToUse, -70, -28);
            } else {
                image(imageToUse, -70, -35);
            }
            pop()
        } else {

            if (this.hasBumped) {
                image(imageToUse, -20, -30);
            } else if (imageToUse == jumpImage || imageToUse == fallImage) {
                image(imageToUse, -20, -28);
            } else {
                image(imageToUse, -20, -35);
            }

        }
        pop();

        if (levels[this.currentLevelNo].isBlizzardLevel) {

            let snowDrawPosition = this.snowImagePosition;
            while (snowDrawPosition <= 0) {
                snowDrawPosition += width;
            }
            snowDrawPosition = snowDrawPosition % width;

            image(snowImage, snowDrawPosition, 0);
            image(snowImage, snowDrawPosition - width, 0);
        }


    }

    Jump() {
        if (!this.isOnGround) {
            return;
        }

        let verticalJumpSpeed = map(this.jumpTimer, 0, maxJumpTimer, minJumpSpeed, maxJumpSpeed)
        if (this.leftHeld) {
            this.currentSpeed = createVector(-jumpSpeedHorizontal, -verticalJumpSpeed)
            this.facingRight = false;
        } else if (this.rightHeld) {
            this.currentSpeed = createVector(jumpSpeedHorizontal, -verticalJumpSpeed)
            this.facingRight = true;

        } else {
            this.currentSpeed = createVector(0, -verticalJumpSpeed)
        }
        this.hasFallen = false;
        this.isOnGround = false
        this.jumpTimer = 0
        this.jumpStartingHeight = (height - this.currentPos.y) + height * this.currentLevelNo;
        jumpSound.playMode('sustain');
        jumpSound.play();
    }

    IsCollidingWithLine(l) {
        if (l.isHorizontal) {
            var isRectWithinLineX = (l.x1 < this.currentPos.x && this.currentPos.x < l.x2) || (l.x1 < this.currentPos.x + this.width && this.currentPos.x + this.width < l.x2) || (this.currentPos.x < l.x1 && l.x1 < this.currentPos.x + this.width) || (this.currentPos.x < l.x2 && l.x2 < this.currentPos.x + this.width);
            var isRectWithinLineY = this.currentPos.y < l.y1 && l.y1 < this.currentPos.y + this.height;
            return isRectWithinLineX && isRectWithinLineY;
        } else if (l.isVertical) {
            isRectWithinLineY = (l.y1 < this.currentPos.y && this.currentPos.y < l.y2) || (l.y1 < this.currentPos.y + this.height && this.currentPos.y + this.height < l.y2) || (this.currentPos.y < l.y1 && l.y1 < this.currentPos.y + this.height) || (this.currentPos.y < l.y2 && l.y2 < this.currentPos.y + this.height);
            isRectWithinLineX = this.currentPos.x < l.x1 && l.x1 < this.currentPos.x + this.width;
            return isRectWithinLineX && isRectWithinLineY;
        } else {

            let tl = this.currentPos.copy();
            let tr = tl.copy();
            tr.x += this.width;
            let bl = tl.copy();
            bl.y += this.height - 1;
            let br = bl.copy();
            br.x += this.width;

            let leftCollision = AreLinesColliding(tl.x, tl.y, bl.x, bl.y, l.x1, l.y1, l.x2, l.y2);
            let rightCollision = AreLinesColliding(tr.x, tr.y, br.x, br.y, l.x1, l.y1, l.x2, l.y2);
            let topCollision = AreLinesColliding(tl.x, tl.y, tr.x, tr.y, l.x1, l.y1, l.x2, l.y2);
            let bottomCollision = AreLinesColliding(bl.x, bl.y, br.x, br.y, l.x1, l.y1, l.x2, l.y2);

            if (leftCollision[0] || rightCollision[0] || topCollision[0] || bottomCollision[0]) {
                let collisionInfo = new DiagonalCollisionInfo();
                collisionInfo.leftSideOfPlayerCollided = leftCollision[0]
                collisionInfo.rightSideOfPlayerCollided = rightCollision[0];
                collisionInfo.topSideOfPlayerCollided = topCollision[0];
                collisionInfo.bottomSideOfPlayerCollided = bottomCollision[0];

                if (leftCollision[0])
                    collisionInfo.collisionPoints.push(createVector(leftCollision[1], leftCollision[2]))
                if (rightCollision[0])
                    collisionInfo.collisionPoints.push(createVector(rightCollision[1], rightCollision[2]))
                if (topCollision[0])
                    collisionInfo.collisionPoints.push(createVector(topCollision[1], topCollision[2]))
                if (bottomCollision[0])
                    collisionInfo.collisionPoints.push(createVector(bottomCollision[1], bottomCollision[2]))

                l.diagonalCollisionInfo = collisionInfo;
                return true;
            } else {
                return false;
            }


        }


    }


    UpdateJumpTimer() {
        if (this.isOnGround && this.jumpHeld && this.jumpTimer < maxJumpTimer) {
            this.jumpTimer += 1
        }
    }


    IsMovingUp() {
        return this.currentSpeed.y < 0;
    }

    IsMovingDown() {
        return this.currentSpeed.y > 0;
    }

    IsMovingLeft() {
        return this.currentSpeed.x < 0;
    }

    IsMovingRight() {
        return this.currentSpeed.x > 0;
    }

    GetImageToUseBasedOnState() {


        if (this.jumpHeld && this.isOnGround) return squatImage;
        if (this.hasFallen) return fallenImage;
        if (this.hasBumped) return oofImage;
        if (this.currentSpeed.y < 0) return jumpImage;
        if (this.isRunning) {

            this.currentRunIndex += 1;
            if (this.currentRunIndex >= this.runCycle.length) this.currentRunIndex = 0;
            return (this.runCycle[this.currentRunIndex])

        }

        if (this.isOnGround) return idleImage;
        return fallImage;
    }

    UpdatePlayerSlide(currentLines) {
        if (this.isSlidding) {
            if (!this.IsPlayerOnDiagonal(currentLines)) {
                this.isSlidding = false;
            }
        }

    }

    UpdatePlayerRun(currentLines) {
        this.isRunning = false;
        let runAllowed = (!levels[this.currentLevelNo].isBlizzardLevel || this.currentLevelNo === 31 || this.currentLevelNo == 25);
        if (this.isOnGround) {
            if (!this.IsPlayerOnGround(currentLines)) {
                this.isOnGround = false;
                return;
            }
            if (!this.jumpHeld) {
                if (this.rightHeld && runAllowed) {
                    this.hasFallen = false;
                    this.isRunning = true;
                    this.facingRight = true;
                    if (!levels[this.currentLevelNo].isIceLevel) {
                        this.currentSpeed = createVector(runSpeed, 0);
                    } else {
                        this.currentSpeed.x += playerIceRunAcceleration;
                        this.currentSpeed.x = min(runSpeed, this.currentSpeed.x);

                    }

                } else if (this.leftHeld && runAllowed) {
                    this.hasFallen = false;
                    this.isRunning = true;
                    this.facingRight = false;
                    if (!levels[this.currentLevelNo].isIceLevel) {
                        this.currentSpeed = createVector(-runSpeed, 0);
                    } else {
                        this.currentSpeed.x -= playerIceRunAcceleration;
                        this.currentSpeed.x = max(0 - runSpeed, this.currentSpeed.x);
                    }


                } else {
                    if (!levels[this.currentLevelNo].isIceLevel) {
                        this.currentSpeed = createVector(0, 0);
                    } else {
                        this.currentSpeed.y = 0;
                        if (this.IsMovingRight()) {
                            this.currentSpeed.x -= iceFrictionAcceleration;
                        } else {
                            this.currentSpeed.x += iceFrictionAcceleration;
                        }
                        if (abs(this.currentSpeed.x) <= iceFrictionAcceleration) {
                            this.currentSpeed.x = 0;
                        }

                    }
                }


            } else {

                if (!levels[this.currentLevelNo].isIceLevel) {
                    this.currentSpeed = createVector(0, 0);
                } else {
                    this.currentSpeed.y = 0;
                    if (this.IsMovingRight()) {
                        this.currentSpeed.x -= iceFrictionAcceleration;
                    } else {
                        this.currentSpeed.x += iceFrictionAcceleration;
                    }
                    if (abs(this.currentSpeed.x) <= iceFrictionAcceleration) {
                        this.currentSpeed.x = 0;
                    }

                }
            }
        }
    }

    IsPlayerOnGround(currentLines) {
        this.currentPos.y += 1;
        for (let i = 0; i < currentLines.length; i++) {
            if (currentLines[i].isHorizontal && this.IsCollidingWithLine(currentLines[i])) {
                this.currentPos.y -= 1;
                return true;
            }
        }
        this.currentPos.y -= 1;
        return false;
    }

    IsPlayerOnDiagonal(currentLines) {
        this.currentPos.y += 5;
        for (let i = 0; i < currentLines.length; i++) {
            if (currentLines[i].isDiagonal && this.IsCollidingWithLine(currentLines[i])) {
                this.currentPos.y -= 5;
                return true;
            }
        }
        this.currentPos.y -= 5;
        return false;
    }

    GetPriorityCollision(collidedLines) {

        if (collidedLines.length === 2) {
            let vert = null
            let horiz = null;
            let diag = null;
            if (collidedLines[0].isVertical) vert = collidedLines[0]
            if (collidedLines[0].isHorizontal) horiz = collidedLines[0]
            if (collidedLines[0].isDiagonal) diag = collidedLines[0]
            if (collidedLines[1].isVertical) vert = collidedLines[1]
            if (collidedLines[1].isHorizontal) horiz = collidedLines[1]
            if (collidedLines[1].isDiagonal) diag = collidedLines[1]

            if (vert != null && horiz != null) {
                if (this.IsMovingUp()) {
                    if (vert.midPoint.y > horiz.midPoint.y) {
                        return vert;
                    } else {
                    }
                } else {
                }
            }
            if (horiz != null && diag != null) {
                if (diag.midPoint.y > horiz.midPoint.y) {
                    return horiz;
                }
            }
        }

        let maxAllowedXCorrection = 0 - this.currentSpeed.x;
        let maxAllowedYCorrection = 0 - this.currentSpeed.y;

        let minCorrection = 10000;
        let maxCorrection = 0;

        let chosenLine = null;
        if (collidedLines.length === 0) return null;

        chosenLine = collidedLines[0];

        if (collidedLines.length > 1) {
            for (let l of collidedLines) {
                let directedCorrection = createVector(0, 0)
                let correction = 10000;
                if (l.isHorizontal) {
                    if (this.IsMovingDown()) {
                        directedCorrection.y = l.y1 - (this.currentPos.y + this.height)

                        correction = abs(directedCorrection)
                        correction = abs(this.currentPos.y - (l.y1 - this.height))
                    } else {
                        directedCorrection.y = l.y1 - this.currentPos.y;
                        correction = abs(this.currentPos.y - l.y1);
                    }

                } else if (l.isVertical) {
                    if (this.IsMovingRight()) {
                        directedCorrection.x = l.x1 - (this.currentPos.x + this.width);
                        correction = abs(this.currentPos.x - (l.x1 - this.width));
                    } else {
                        directedCorrection.x = l.x1 - this.currentPos.x;

                        correction = abs(this.currentPos.x - l.x1);
                    }
                } else {
                    if (l.diagonalCollisionInfo.collisionPoints.length === 2) {
                        let midpoint = l.diagonalCollisionInfo.collisionPoints[0].copy();
                        midpoint.add(l.diagonalCollisionInfo.collisionPoints[1].copy());
                        midpoint.mult(0.5);

                        let left = l.diagonalCollisionInfo.leftSideOfPlayerCollided;
                        let right = l.diagonalCollisionInfo.rightSideOfPlayerCollided;
                        let top = l.diagonalCollisionInfo.topSideOfPlayerCollided;
                        let bottom = l.diagonalCollisionInfo.bottomSideOfPlayerCollided;

                        let playerCornerPos = null;
                        if (top && left) {
                            playerCornerPos = this.currentPos.copy();

                        }
                        if (top && right) {
                            playerCornerPos = this.currentPos.copy();
                            playerCornerPos.x += this.width;
                        }
                        if (bottom && left) {
                            playerCornerPos = this.currentPos.copy();
                            playerCornerPos.y += this.height;
                        }
                        if (bottom && right) {
                            playerCornerPos = this.currentPos.copy();
                            playerCornerPos.y += this.height;
                            playerCornerPos.x += this.width;
                        }


                        if (playerCornerPos === null) {
                            print("fuck");
                            print(left, right, top, bottom);
                            playerCornerPos = this.currentPos.copy();

                            if (this.IsMovingDown()) {
                                playerCornerPos.y += this.height;
                            }
                            if (this.IsMovingRight()) {
                                playerCornerPos.x += this.width;
                            }
                        }

                        directedCorrection.x = midpoint.x - playerCornerPos.x;
                        directedCorrection.y = midpoint.y - playerCornerPos.y;
                        correction = dist(playerCornerPos.x, playerCornerPos.y, midpoint.x, midpoint.y)
                    } else {
                        let left = l.diagonalCollisionInfo.leftSideOfPlayerCollided;
                        let right = l.diagonalCollisionInfo.rightSideOfPlayerCollided;
                        let top = l.diagonalCollisionInfo.topSideOfPlayerCollided;
                        let bottom = l.diagonalCollisionInfo.bottomSideOfPlayerCollided;

                        let playerCornerPos = null;
                        if (top) {
                            let closestPointY = max(l.y1, l.y2)
                            directedCorrection.y = closestPointY - (this.currentPos.y)

                            correction = abs(this.currentPos.y - closestPointY);

                        }
                        if (bottom) {
                            let closestPointY = min(l.y1, l.y2)
                            directedCorrection.y = closestPointY - (this.currentPos.y + this.height)
                            correction = abs((this.currentPos.y + this.height) - closestPointY);
                        }
                        if (left) {
                            let closestPointX = max(l.x1, l.x2)
                            directedCorrection.x = closestPointX - this.currentPos.x;
                            correction = abs(this.currentPos.x - closestPointX);
                        }
                        if (right) {
                            let closestPointX = min(l.x1, l.x2)
                            directedCorrection.x = closestPointX - (this.currentPos.x + this.width);
                            correction = abs((this.currentPos.x + this.width) - closestPointX);
                        }


                    }
                }

                function isBetween(a, b1, b2) {
                    return (b1 <= a && a <= b2) || (b2 <= a && a <= b1)

                }

                if (isBetween(directedCorrection.x, 0, maxAllowedXCorrection) &&
                    isBetween(directedCorrection.y, 0, maxAllowedYCorrection)) {
                    if (correction < minCorrection) {
                        minCorrection = correction;
                        chosenLine = l;
                    }

                }


            }
        }
        return chosenLine;
    }

    CheckForLevelChange() {
        if (this.currentPos.y < -this.height) {
            this.currentLevelNo += 1;
            this.currentPos.y += height;
            if (this.currentLevelNo === 43) {
                finishGame();
            }

        } else if (this.currentPos.y > height - this.height) {
            if (this.currentLevelNo === 0) {
                this.currentLevelNo = 1;
                this.playersDead = true;
            }
            this.currentLevelNo -= 1;
            this.currentPos.y -= height;

        }


    }

    playerLanded() {

        this.isOnGround = true
        if (levels[this.currentLevelNo].isIceLevel) {
            this.currentSpeed.y = 0;
            if (this.IsMovingRight()) {
                this.currentSpeed.x -= iceFrictionAcceleration;
            } else {
                this.currentSpeed.x += iceFrictionAcceleration;
            }

        } else {
            this.currentSpeed = createVector(0, 0)

        }


        this.isSlidding = false;
        this.hasBumped = false;

        if (this.jumpStartingHeight - height / 2 > (height - this.currentPos.y) + height * this.currentLevelNo) {
            this.hasFallen = true;
        }

        if (this.hasFallen) {
            fallSound.playMode('sustain');
            fallSound.play();
        } else {
            landSound.playMode('sustain');
            landSound.play();
        }
    }

    CheckForCoinCollisions() {
        let currentLevel = levels[this.currentLevelNo];
        for (let i = 0; i < currentLevel.coins.length; i++) {
            if (currentLevel.coins[i].collidesWithPlayer(this)) {
                //nothing yet
            }
        }

    }
}

function AreLinesColliding(x1, y1, x2, y2, x3, y3, x4, y4) {
    let uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    let uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
        let intersectionX = x1 + (uA * (x2 - x1));
        let intersectionY = y1 + (uA * (y2 - y1));
        return [true, intersectionX, intersectionY];
    }
    return [false, 0, 0]

}