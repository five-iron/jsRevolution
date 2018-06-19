const DIRECTIONS = {
    left: { keycode: 37 },
    down: { keycode: 40 },
    up: { keycode: 38 },
    right: { keycode: 39 }
};
const THRESH = {bottom: 0, top: Infinity};
const DEFAULT_SPACING = 4;
const DEFAULT_ARROW_SPAWN_INTERVAL = 12;
var frame = 0;
var best = 0;
// 'notes' to store Arrows
var notes = [];
// Stops animation
var halt = false, paused = false;
var solution = [], startTime, docHeight, practiceMode;

// ==== CLASS FOR ARROWS ==== //
// 1. Direction of arrows
// 2. jQuery img that links to direction bottom
// 3. Destroy when it arrow gets to the
// 4. Explode when arrow gets to the bottom
// Class Arrow
function Arrow(direction) {
	// CSS spacings for the arrows //
	this.direction = direction;
	this.image = $('<img src="./arrows/' + direction + '.gif"/>');
	this.image.css({
		position: 'absolute',
		top: '0px',
		left: $('#' + direction).position().left
	});
	$('#stage').append(this.image);
}

// To enable animating the arrows
Arrow.prototype.step = function() {
    // Check for cleanup
    if (this.image.position().top > docHeight) {
        this.destroy();
        $('#misses').text(Number($('#misses').text())+1);
    }
	// Controls the vertical spacing of the arrows
	this.image.css('top', '+=' + $('#spacing').val() + 'px');
};

// Deletes arrows when they get to bottom of page
Arrow.prototype.destroy = function() {
	// removes the image of the DOM
	this.image.remove();
	// Removes the note/arrow from memory/array
	notes.splice(notes.indexOf(this), 1);
    if(solution.length === 0 && notes.length === 0) { // finished
        console.log((new Date() - startTime)/1000 + ' seconds');
        stop();
    }
};

function destroyAll() {
    notes.forEach(n => {
        n.image.remove();
    });
    notes = [];
}

// https://runeapps.org/apps/clue/
function parseSolution() {
    solutionRaw = $('#solutionBox').val();
    if(!solutionRaw) { return; }
    var trimmed = solutionRaw.match(/[^1]+1\.([^S]+)Solved.*/);
    trimmed = trimmed ? trimmed[1] : solutionRaw;
    var replaced = trimmed.toLowerCase().replace(/[^a-z]/g, '') || solutionRaw;
    solution = replaced.split(/(down|left|up|right)/g).filter(n => !!n);
}

function gen() {
    if(practiceMode) {
        randomGen();
    } else {
        arrayGen();
    }
}

function arrayGen() {
    if(solution.length === 0) { return; }
    notes.push(new Arrow(solution.shift()));
}

// Random generator for arrows
function randomGen() {
	// Randomizes between 1 and 4
	var randNum = Math.floor(Math.random() * 4);
    notes.push(new Arrow(Object.keys(DIRECTIONS)[randNum]));
}

// Render function //
function render() {
	if (frame++ % $('#interval').val() === 0) {
		gen();
	}
	// Animate arrows showering down //
	notes.map(n => n.step());
}

function init() {
    // shim layer with setTimeout fallback
    window.requestAnimFrame = (function() {
        return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 40 / 75); // framerate?
        };
    })();

    $('#go').on('click', go);
    $('#stop').on('click', stop);
    $('#practice').on('click', function() {
        $('#solutionBox').attr('disabled', $('#practice').is(':checked'));
    });

    $('#stop').attr('disabled', true);
    $('#spacing').val(DEFAULT_SPACING);
    $('#interval').val(DEFAULT_ARROW_SPAWN_INTERVAL);

    var instructions = [
        'Paste slide puzzle screenshot into runeapps on the right',
        'In settings, ensure Output type is Instruction list, Flip directions',
        'Open guide',
        'Ctrl+A, Ctrl+C',
        'Paste here',
        'Click Go!'
    ]
    placeholder = 'Instructions:\n'
    instructions.forEach(function(instr, i) {
        placeholder += (i+1) + '. ' + instr + '\n'
    });
    $('#solutionBox').attr('placeholder', placeholder);

    $('#controls').width(0);
    var imgSelector = Object.keys(DIRECTIONS).map(k=>'#' + k).join(',');
    $.map($(imgSelector), function(img) {
        $(img).load(() => $('#controls').width((el, old) => old + $(img).width()));
        if(img.complete) { $(img).load(); }
    });
}
$(init);

// jQuery to animate arrows
function go() {
    startTime = new Date();
    halt = false;
    docHeight = $(document).height();
    practiceMode = $('#practice').is(':checked');
    $('#practice').attr("disabled", true);
    $('#go').attr('disabled', true);
    $('#stop').attr('disabled', false);
    $('#go').blur();
    if(!practiceMode) {
        parseSolution();
    }

    // Infinte loop for game play
    (function animloop() {
        if(halt) { return; }
        requestAnimFrame(animloop);
        if(paused) { return; }
        render();
    })();

}

function stop() {
    halt = true;
    paused = false;
    $('#go').attr('disabled', false);
    $('#stop').attr('disabled', true);
    $('#practice').attr("disabled", false);
    destroyAll();
}

// Listening for when the key is pressed
$(document).keydown(function(event) {
    // Spacebar to pause/resume
    if(event.keyCode === 32) {
        paused = !paused;
        return;
    }
    if(paused || halt || (notes.length === 0 && solution.length === 0)) { return; }
    // use forLoop for more 'DDR' like behavior
	// notes.forEach(function(note) {
        note = notes[0];
        noteTop = note.image.position().top;
		if (DIRECTIONS[note.direction].keycode === event.keyCode &&
            noteTop > THRESH.bottom && noteTop < THRESH.top) {
                note.destroy();
                $('#hits').text(Number($('#hits').text())+1);
                $('#streak').text(Number($('#streak').text())+1);
		} else {
            $('#misses').text(Number($('#misses').text())+1);
            $('#streak').text(0);
        }
        if(Number($('#streak').text()) >= best) {
            best = $('#streak').text();
            $('#best').text(best);
        }
	// });
});
