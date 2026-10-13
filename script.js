// =========================================
// script.js — ALL the JavaScript for the site
// Link it at the end of <body> on every page:
//   <script src="js/script.js"></script>
//
// PART 1  "?" button + about box ......... every page
// PART 2  label that follows the pointer . every page
// PART 3  falling, draggable cone ........ only pages that have a .dropcone
// =========================================


// =========================================
// PART 1 — "?" button + about box
// =========================================

const aboutButton = document.querySelector('.aboutbutton');
const aboutBox = document.querySelector('.aboutbox');

function openAbout() {
    aboutBox.hidden = false;
    aboutButton.textContent = '×';
    aboutButton.setAttribute('aria-label', 'Close about');
}

function closeAbout() {
    aboutBox.hidden = true;
    aboutButton.textContent = '?';
    aboutButton.setAttribute('aria-label', 'About this project');
}

// click "?" to open, click "×" to close
aboutButton.addEventListener('click', function () {
    if (aboutBox.hidden) {
        openAbout();
    } else {
        closeAbout();
    }
});

// click anywhere on the white layer to close
aboutBox.addEventListener('click', closeAbout);

// the Esc key also closes it
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeAbout();
    }
});


// =========================================
// PART 2 — label that follows the pointer
// Any element with data-label="..." shows that text on hover.
// =========================================

const pointerLabel = document.querySelector('.pointerlabel');

document.addEventListener('mousemove', function (event) {
    // is the pointer over something with a label?
    const target = event.target.closest('[data-label]');

    // hide it when there is no label, while a cone is falling or being dragged,
    // or while the about box is open
    if (!target || target.classList.contains('falling') || target.classList.contains('dragging') || !aboutBox.hidden) {
        pointerLabel.hidden = true;
        return;
    }

    pointerLabel.textContent = target.dataset.label;
    pointerLabel.style.left = (event.clientX + 16) + 'px';
    pointerLabel.style.top = (event.clientY + 16) + 'px';
    pointerLabel.hidden = false;
});

// hide the label when the pointer leaves the window
document.addEventListener('mouseleave', function () {
    pointerLabel.hidden = true;
});


// =========================================
// PART 3 — falling, draggable cone (image index + readings)
//
// 1. When the page opens, the cone falls to the bottom center
//    of the window with a small bounce.
// 2. You can drag it anywhere inside the window. It stays where you let go.
// 3. A quick click (no drag) goes back to the home page.
// 4. Every refresh or new visit starts over from the top.
// =========================================

const cone = document.querySelector('.dropcone');

// the home page has no .dropcone, so this part only runs on the other pages
if (cone) {
    const coneImage = cone.querySelector('img');

    const FALL_TIME = 900;   // length of the drop, in milliseconds
    const BOUNCE = 0.08;     // bounce height, as a share of the cone's height

    let x = 0;               // cone position, in px from the window's left edge
    let y = 0;               // cone position, in px from the window's top edge
    let isFalling = false;
    let isDragging = false;
    let wasDragged = false;
    let grabX = 0, grabY = 0;    // where on the cone you grabbed it
    let startX = 0, startY = 0;  // where the pointer was when you pressed


    // ---------- helpers ----------

    // move the cone on screen
    function placeCone() {
        cone.style.left = x + 'px';
        cone.style.top = y + 'px';
    }

    // keep the cone inside the window
    function keepInside() {
        const maxX = window.innerWidth - cone.offsetWidth;
        const maxY = window.innerHeight - cone.offsetHeight;
        x = Math.min(Math.max(x, 0), maxX);
        y = Math.min(Math.max(y, 0), maxY);
    }


    // ---------- 1. the drop ----------

    function dropCone() {
        const ground = window.innerHeight - cone.offsetHeight;   // y when it sits on the bottom
        const fallHeight = ground + cone.offsetHeight + 20;      // start fully above the window
        const bounceHeight = cone.offsetHeight * BOUNCE;
        const startTime = performance.now();

        x = (window.innerWidth - cone.offsetWidth) / 2;          // horizontal center
        isFalling = true;
        cone.classList.add('falling');

        function step(now) {
            const progress = Math.min(1, (now - startTime) / FALL_TIME);  // 0 → 1
            let lift;

            if (progress < 0.7) {
                // falling, speeding up
                const t = progress / 0.7;
                lift = fallHeight * (1 - t * t);
            } else {
                // one small bounce
                const t = (progress - 0.7) / 0.3;
                lift = bounceHeight * Math.sin(Math.PI * t);
            }

            y = ground - lift;
            placeCone();

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                isFalling = false;
                cone.classList.remove('falling');
            }
        }

        requestAnimationFrame(step);
    }

    // wait for the image to load so we know its size, then drop
    if (coneImage.complete) {
        dropCone();
    } else {
        coneImage.addEventListener('load', dropCone);
    }

    // coming back with the browser's Back button: drop again
    window.addEventListener('pageshow', function (event) {
        if (event.persisted) {
            dropCone();
        }
    });


    // ---------- 2. dragging ----------

    cone.addEventListener('pointerdown', function (event) {
        if (isFalling) return;
        event.preventDefault();
        cone.setPointerCapture(event.pointerId);   // keep following even if the pointer moves fast

        isDragging = true;
        wasDragged = false;
        grabX = event.clientX - x;
        grabY = event.clientY - y;
        startX = event.clientX;
        startY = event.clientY;
        cone.classList.add('dragging');
    });

    cone.addEventListener('pointermove', function (event) {
        if (!isDragging) return;

        // moved more than 4px? then it counts as a drag, not a click
        if (Math.abs(event.clientX - startX) + Math.abs(event.clientY - startY) > 4) {
            wasDragged = true;
        }

        x = event.clientX - grabX;
        y = event.clientY - grabY;
        keepInside();
        placeCone();
    });

    function stopDragging() {
        isDragging = false;
        cone.classList.remove('dragging');
    }

    cone.addEventListener('pointerup', stopDragging);
    cone.addEventListener('pointercancel', stopDragging);


    // ---------- 3. click goes home (but not after a drag) ----------

    cone.addEventListener('click', function (event) {
        if (isFalling || wasDragged) {
            event.preventDefault();   // cancel the link
            wasDragged = false;
        }
    });


    // ---------- keep it inside when the window is resized ----------

    window.addEventListener('resize', function () {
        keepInside();
        placeCone();
    });
}