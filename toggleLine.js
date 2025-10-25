class ToggleLine extends Line {

    constructor(x1, y1, x2, y2, onDuration, offDuration, initialState = true, phaseOffset = 0) {
        super(x1, y1, x2, y2);

        this.onDuration = onDuration;
        this.offDuration = offDuration;
        this.isOn = initialState;
        
        this.isCollidable = initialState; 
        
        this.timer = (phaseOffset % (this.onDuration + this.offDuration)) || 0;
    }

    Update() {
        this.timer++;

        if (this.isOn) {
            if (this.timer >= this.onDuration) {
                this.isOn = false;
                this.isCollidable = false;
                this.timer = 0;
            }
        } else {

            if (this.timer >= this.offDuration) {
                this.isOn = true;
                this.isCollidable = true;
                this.timer = 0;
            }
        }
    }

    Show() {
        if (!this.isOn) {
            push();
            stroke(255, 0, 0, 50);
            strokeWeight(3);
            line(this.x1, this.y1, this.x2, this.y2);
            pop();
        } else {
            super.Show();
        }
    }
}