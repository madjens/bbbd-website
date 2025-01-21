document.addEventListener("DOMContentLoaded", () => {
    const stimuli = {
        1: 'https://www.youtube.com/embed/VVAKFJ8VVp4', // Why are Stars Shaped
        2: 'https://www.youtube.com/embed/oCEKMEeZXug', // How Modern Light Bulbs Work
        3: 'https://www.youtube.com/embed/zQGOcOUBi6s', // The Immune System Explained – Bacteria Infection
        4: 'https://www.youtube.com/embed/21eFwbb48sE', // Who Invented the Internet - And Why
        5: 'https://www.youtube.com/embed/3IaYhG11ckA', // Why Do We Have More Boys Than Girls
        };

    const videoNames = {
        1: 'Why are Stars Star-Shaped',
        2: 'How Modern Light Bulbs Work',
        3: 'The Immune System Explained – Bacteria Infection',
        4: 'Who Invented the Internet - And Why',
        5: 'Why Do We Have More Boys Than Girls',
    };

    const stimuliIdsContainer = document.getElementById('stimuli-ids-exp2');
    const videoFrame = document.getElementById('video-frame');
    const tooltip = document.getElementById('tooltip');
    const currentPage = window.location.pathname.split("/").pop();
    const links = document.querySelectorAll("nav ul li a");

    links.forEach(link => {
        const linkHref = link.getAttribute("href").split("/").pop();
        if (linkHref === currentPage) {
            link.classList.add("active");
        }
    });

    // Populate stimuli ID buttons
    Object.keys(stimuli).forEach(key => {
        const button = document.createElement('button');
        button.textContent = `Stim 0${key}`;
        button.dataset.id = key;
        button.addEventListener('click', () => showVideo(key));
        
        button.addEventListener('mouseover', (event) => {
            const videoName = videoNames[key];
            tooltip.textContent = videoName;
            tooltip.style.display = 'block';
            tooltip.style.left = `${event.pageX + 10}px`; // Position tooltip slightly to the right of the pointer
            tooltip.style.top = `${event.pageY + 10}px`; // Position tooltip slightly below the pointer
        });

        button.addEventListener('mouseout', () => {
            tooltip.style.display = 'none';
        });

        stimuliIdsContainer.appendChild(button);
    });

    function showVideo(id) {
        const videoUrl = stimuli[id];
        if (videoUrl) {
            videoFrame.innerHTML = `<iframe width="560" height="315" src="${videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        } else {
            videoFrame.innerHTML = '<p>Video not found.</p>';
        }
    }

    // Show the first video by default
    showVideo(1);
});
