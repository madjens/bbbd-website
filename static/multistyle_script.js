document.addEventListener("DOMContentLoaded", () => {
    const stimuli = {
        1: 'https://www.youtube.com/embed/9w-5wJYVmcw', // What If We Killed All the Mosquitoes
        2: 'https://www.youtube.com/embed/mnYSMhR3jCI', // Are We All Related
        3: 'https://www.youtube.com/embed/30o4omX5qfo', // Work and the work-energy principle Physics Khan Academy
        4: 'https://www.youtube.com/embed/rkntp3_cZl4', // Dielectrics in capacitors Circuits Physics Khan Academy
        5: 'https://www.youtube.com/embed/bYgV9nvgJ3E', // How Do People Measure Planets Suns About Astrophysics Outer Space
        6: 'https://www.youtube.com/embed/lkRZKqDdwzU' // Three Factors That May Alter the Action of an Enzyme Chemistry Biology Concepts
    };

    const videoNames = {
        1: 'What If We Killed All the Mosquitoes',
        2: 'Are We All Related',
        3: 'Work and the work-energy principle',
        4: 'Dielectrics in capacitors Circuits',
        5: 'How Do People Measure Planets & Suns',
        6: 'Three Factors That May Alter the Action of an Enzyme'
    };

    const stimuliIdsContainer = document.getElementById('stimuli-ids-exp3');
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
    // showVideo(1);
});
