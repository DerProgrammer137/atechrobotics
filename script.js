// Button click event listeners
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function() {
        const buttonText = this.textContent;
        console.log('Button clicked: ' + buttonText);
        
        // Add a brief feedback effect
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = '';
        }, 100);
    });
});

// Optional: Add page load animation
window.addEventListener('load', function() {
    document.querySelector('.logo').style.opacity = '0';
    document.querySelector('.logo').style.animation = 'fadeIn 0.8s ease-in forwards';
});

// Define fade-in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

// Scroll-triggered animations using Intersection Observer
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up', 'fade-in-left', 'fade-in-right');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Robotic arm SVG mouse tracking
const roboticArmSvg = document.getElementById('roboticArm');
if (roboticArmSvg) {
    let targetX = window.innerWidth + 500; // Start retracted
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let armGlideSpeed = 0.05; // Default slow glide when retracting
    
    // Get SVG elements
    const upperLine = roboticArmSvg.querySelectorAll('line')[0]; // First line (upper arm)
    const forearmLine = roboticArmSvg.querySelectorAll('line')[1]; // Second line (forearm)
    const shoulderCircle = roboticArmSvg.querySelectorAll('circle')[0]; // Shoulder joint
    const elbowCircle = roboticArmSvg.querySelectorAll('circle')[1]; // Elbow joint
    const wristCircle = roboticArmSvg.querySelectorAll('circle')[2]; // Wrist joint
    
    // Add hover listeners to buttons (exclude hidden contact button in header)
    const buttons = document.querySelectorAll('.btn:not(.contact-btn-hidden)');
    let isHoveringButton = false;
    buttons.forEach(button => {
        button.addEventListener('mouseenter', (e) => {
            isHoveringButton = true;
            hoveredButton = button;
            const buttonRect = button.getBoundingClientRect();
            targetX = buttonRect.left + buttonRect.width / 2;
            
            // Apply different Y offsets based on button position
            const buttonText = button.textContent;
            let yOffset = 30; // Default for Courses and AlphaEcosystem
            if (buttonText.includes('Shop')) {
                yOffset = 60; // Shop button needs more downward
            }
            
            targetY = buttonRect.top + buttonRect.height / 2 + yOffset;
            armGlideSpeed = 0.15; // Fast glide when pointing to buttons
        });
        button.addEventListener('mouseleave', () => {
            isHoveringButton = false;
            hoveredButton = null;
            // Retract arm - move it far off screen
            targetX = window.innerWidth + 500;
            targetY = window.innerHeight / 2;
            armGlideSpeed = 0.05; // Slow glide when retracting
        });
    });
    
    function updateArmPosition() {
        const svgRect = roboticArmSvg.getBoundingClientRect();
        const viewBox = roboticArmSvg.viewBox.baseVal;
        const shoulderSvgX = 50;
        const shoulderSvgY = 20;
        
        // Shoulder position in screen coordinates
        const svgShoulderX = svgRect.left + ((shoulderSvgX - viewBox.x) / viewBox.width) * svgRect.width;
        const svgShoulderY = svgRect.top + ((shoulderSvgY - viewBox.y) / viewBox.height) * svgRect.height;
        
        // Smoothly glide towards target - use variable glide speed
        currentX += (targetX - currentX) * armGlideSpeed;
        currentY += (targetY - currentY) * armGlideSpeed;
        
        // Vector from shoulder to target
        const deltaX = currentX - svgShoulderX;
        const deltaY = currentY - svgShoulderY;
        const distanceScreen = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Convert screen distance to SVG units
        const pixelsPerSvgUnit = svgRect.width / viewBox.width;
        const distance = distanceScreen / pixelsPerSvgUnit;
        
        // Calculate angle directly to target
        const angleToTarget = Math.atan2(deltaX, -deltaY);
        
        // Arm lengths (in SVG units)
        const upperArmLen = 160; // From shoulder (y=20) center to elbow (y=180) center
        const forearmLen = 152; // From elbow (y=188) to wrist (y=340)
        
        // Clamp distance to reachable range
        const maxReach = upperArmLen + forearmLen - 30;
        const reachDist = Math.min(distance, maxReach);
        
        // Inverse kinematics - calculate elbow bend
        const cosElbow = (upperArmLen * upperArmLen + forearmLen * forearmLen - reachDist * reachDist) / 
                         (2 * upperArmLen * forearmLen);
        const elbowBend = Math.acos(Math.max(-1, Math.min(1, cosElbow)));
        
        // Calculate angles
        const shoulderAngle = angleToTarget;
        const forearmAngle = angleToTarget + (Math.PI - elbowBend);
        
        // Apply rotations with supplements
        upperArmRotate = (Math.PI - shoulderAngle) * 180 / Math.PI;
        forearmRotate = (Math.PI - forearmAngle) * 180 / Math.PI;
        
        // Apply rotations to SVG lines
        // Upper arm: rotate around shoulder (50, 20)
        upperLine.setAttribute('transform', `rotate(${upperArmRotate} 50 20)`);
        
        // Calculate rotated elbow position
        // Arm starts pointing down (0, 160), so we use sin for x and cos for y
        const upperArmRad = upperArmRotate * Math.PI / 180;
        const elbowX = 50 + upperArmLen * Math.sin(upperArmRad);
        const elbowY = 20 + upperArmLen * Math.cos(upperArmRad);
        
        // Update upper arm line to connect shoulder to elbow
        upperLine.setAttribute('x1', '50');
        upperLine.setAttribute('y1', '20');
        upperLine.setAttribute('x2', elbowX);
        upperLine.setAttribute('y2', elbowY);
        upperLine.setAttribute('transform', '');
        
        // Rotate forearm around its elbow position
        forearmLine.setAttribute('transform', `rotate(${forearmRotate} ${elbowX} ${elbowY})`);
        
        // Update elbow circle to match rotated arm endpoint
        elbowCircle.setAttribute('cx', elbowX);
        elbowCircle.setAttribute('cy', elbowY);
        
        // Calculate rotated wrist position
        // Forearm starts pointing down from elbow (0, 152)
        const forearmRad = forearmRotate * Math.PI / 180;
        const wristX = elbowX + forearmLen * Math.sin(forearmRad);
        const wristY = elbowY + forearmLen * Math.cos(forearmRad);
        
        // Update forearm line to connect elbow to wrist
        forearmLine.setAttribute('x1', elbowX);
        forearmLine.setAttribute('y1', elbowY);
        forearmLine.setAttribute('x2', wristX);
        forearmLine.setAttribute('y2', wristY);
        forearmLine.setAttribute('transform', '');
        
        // Update wrist circle
        wristCircle.setAttribute('cx', wristX);
        wristCircle.setAttribute('cy', wristY);
        
        requestAnimationFrame(updateArmPosition);
    }
    
    updateArmPosition();
}

// Smooth section snap scrolling (slideshow effect)
let isSnapping = false;
let scrollTimeout;
let lastScrollPosition = 0;
let currentSectionIndex = 0;
const sections = document.querySelectorAll('.hero, .scroll-section');

function getHeaderHeight() {
    return document.querySelector('header').offsetHeight;
}

function smoothScrollToSection(targetPosition) {
    isSnapping = true;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    const duration = 600;
    let start = null;
    
    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    function animation(currentTime) {
        if (start === null) start = currentTime;
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        window.scrollTo(0, startPosition + distance * easeInOutQuad(progress));
        
        if (progress < 1) {
            requestAnimationFrame(animation);
        } else {
            isSnapping = false;
        }
    }
    
    requestAnimationFrame(animation);
}

function getCurrentSectionIndex() {
    const scrollPosition = window.scrollY + getHeaderHeight();
    let index = 0;
    
    sections.forEach((section, i) => {
        if (section.offsetTop <= scrollPosition) {
            index = i;
        }
    });
    
    return index;
}

function scrollToSection(index) {
    if (index < 0) index = 0;
    if (index >= sections.length) index = sections.length - 1;
    
    currentSectionIndex = index;
    const targetPosition = sections[index].offsetTop;
    smoothScrollToSection(targetPosition);
}

// Scroll wheel detection for section navigation
let wheelTimeout;
window.addEventListener('wheel', (e) => {
    if (isSnapping) return;
    
    clearTimeout(wheelTimeout);
    
    wheelTimeout = setTimeout(() => {
        const currentIndex = getCurrentSectionIndex();
        
        if (e.deltaY > 0) {
            // Scrolling down
            scrollToSection(currentIndex + 1);
        } else if (e.deltaY < 0) {
            // Scrolling up
            scrollToSection(currentIndex - 1);
        }
    }, 100);
}, { passive: true });

// Keyboard arrow keys for section navigation
document.addEventListener('keydown', (e) => {
    if (isSnapping) return;
    
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        scrollToSection(currentSectionIndex + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollToSection(currentSectionIndex - 1);
    }
});
