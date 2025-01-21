

// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
    let baseUrl;
    const downloadButton = document.getElementById('download-button');
    const datasetInfo = document.getElementById('dataset-info');
    const datasetTableContainer = document.getElementById('table-container'); // Table container for displaying the HTML file
    const datasetHomeTableContainer = document.getElementById('hometable-container');
    // const optionsButtons = document.getElementById('options-buttons'); // Container for option buttons
    const subjectsDiv = document.getElementById('subjects');
    const sessionsDiv = document.getElementById('sessions');
    const stimuliDiv = document.getElementById('stimuli');
    let selectedButton = null;
    // const output = document.getElementById('output');

    // Object to store selected values
    const selections = {
        subject: null,
        session: null,
        stimulus: null
    };

    const currentPage = window.location.pathname;
    const links = document.querySelectorAll(".nav-link");

    links.forEach(link => {
        if (link.getAttribute("href") === currentPage) {
            link.classList.add("active");
        }
    });

    fetch('/api/base-url')
        .then(response => response.json())
        .then(data => {
            baseUrl = data.base_url;
            console.log('Base URL from API:', baseUrl);
        })
        .catch(error => console.error('Error fetching base URL:', error));

    // Fetch the list of datasets from the server
    fetch('/datasets')
        .then(response => response.json())
        .then(data => {
            const datasetList = document.getElementById('datasets');
            data.datasets.forEach(dataset => {
                const button = document.createElement('button');
                button.textContent = dataset.name;
                button.dataset.id = dataset.id;
                button.addEventListener('click', () => loadDatasetDetails(dataset.id, button));
                datasetList?.appendChild(button);
            });
        })
        .catch(error => console.error('Error fetching datasets:', error));




    // Function to load dataset details and display them
    function loadDatasetDetails(datasetId, button) {
        // Clear previously selected button
        if (selectedButton) {
            selectedButton.classList.remove('selected');
        }

        // Highlight the clicked button
        button.classList.add('selected');
        selectedButton = button;

        // Fetch details for the selected dataset
        fetch(`/dataset/${datasetId}`)
            .then(response => response.json())
            .then(dataset => {
                const pageURL = `${baseUrl}${dataset.page}`;
                console.log(pageURL)
                datasetInfo.innerHTML = `
                    <h3 style='text-decoration: underline'>${dataset.name}</h3>
                    <p><strong>Description:</strong> ${dataset.description}</p>
                    <br><p><strong>Subjects:</strong> ${dataset.subjects}</p>
                    <br><p><strong>Sessions:</strong> ${dataset.sessions}</p>
                    <p><strong>^ Session Conditions: <br></strong> ${dataset.Conditions}</p>
                    <br><p><strong>Tasks (Stimuli):<br></strong> ${dataset.Stimuli} (Open <a href="${pageURL}">respective experiment page</a> for more info on what stimuli was used)</p>
                    <br><p><strong>Modalities Recorded:</strong> ${dataset.Modalities}</p>
                `;

                // Download BIDS File

                downloadButton.style.display = 'block';
                downloadButton.onclick = () => {
                    console.log(dataset.filename)
                    download_file(dataset.filename);
                };
            })
            .catch(() => {
                datasetInfo.innerHTML = '<p>Dataset not found.</p>';
                downloadButton.style.display = 'none';
            });
    }

    loadDatasetSignals(5);
    // Function to load dataset details and display them
    function loadDatasetSignals(datasetId) {
        // Fetch details for the selected dataset
        fetch(`/dataset/${datasetId}`)
            .then(response => response.json())
            .then(dataset => {

                const bidsname = dataset.filename.replace(/\.zip$/, '');
                const bidsdirname = dataset.bidsname;

                // Static Subjects
                const subjects = ['16', '17', '18'];
                // const subjects = ['04', '05', '06'];
                subjectsDiv.innerHTML = '<strong>Subject:</strong> ';
                const subjectButtons = [];
                subjects.forEach(subject => {
                    const button = document.createElement('button');
                    button.textContent = subject;
                    button.onclick = () => handleSelection('subject', subject, subjectsDiv, button, bidsdirname);
                    subjectsDiv.appendChild(button);
                    subjectButtons.push(button);
                    // Select the first subject by default
                    // if (index === 0) button.click();
                });
                if (subjectButtons.length > 0) {
                    handleSelection('subject', subjects[0], subjectsDiv, subjectButtons[0], bidsdirname);
                }

                // Static Sessions
                const sessions = ['01', '02'];
                sessionsDiv.innerHTML = '<strong>Session:</strong> ';
                const sessionButtons = [];
                sessions.forEach(session => {
                    const button = document.createElement('button');
                    button.textContent = session;
                    button.onclick = () => handleSelection('session', session, sessionsDiv, button, bidsdirname);
                    sessionsDiv.appendChild(button);
                    // Select the first subject by default
                    // if (index === 0) button.click();
                    sessionButtons.push(button);
                });
                if (sessionButtons.length > 0) {
                    handleSelection('session', sessions[0], sessionsDiv, sessionButtons[0], bidsdirname);
                }

                // Static Stimuli
                const stimuli = ['01', '02', '03'];
                stimuliDiv.innerHTML = '<strong>Stimuli:</strong> ';
                const stimuliButtons = [];
                stimuli.forEach(stimulus => {
                    const button = document.createElement('button');
                    button.textContent = stimulus;
                    button.onclick = () => handleSelection('stimulus', stimulus, stimuliDiv, button, bidsdirname);
                    stimuliDiv.appendChild(button);
                    // Select the first subject by default
                    // if (index === 0) button.click();
                    stimuliButtons.push(button);
                });
                if (stimuliButtons.length > 0) {
                    handleSelection('stimulus', stimuli[0], stimuliDiv, stimuliButtons[0], bidsdirname);
                }

                // Function to handle button selection
                function handleSelection(type, selectedValue, parentDiv, selectedButton, bidsname) {
                    // Remove highlight from all buttons in the same group
                    const allButtons = parentDiv.getElementsByTagName('button');
                    for (let btn of allButtons) {
                        btn.classList.remove('selected');
                    }
                    // Highlight the selected button
                    selectedButton.classList.add('selected');

                    // You can add logic here to do something with the selection
                    console.log(`Selected: ${selectedButton.textContent}`);

                    selections[type] = selectedValue;
                    console.log(selections);

                    fetchSignal(bidsname, selections.subject,selections.session,selections.stimulus);
                }
            })
    }

    async function fetchSignal(bidsname, sub, ses, stim) {
        const signalPath = `${bidsname}/${sub}/${ses}/${stim}`;
        const loadingElement = document.getElementById('loading');

        try {
             // Show the loading indicator
            loadingElement.style.display = 'block';

            // Fetching signal data from Flask
            const response = await fetch(`/plot/${signalPath}`);

            if (!response.ok) {
                throw new Error(`Error fetching signal: ${response.statusText}`);
            }

            const signalData = await response.json();  // Parse the JSON response

            const rawData = signalData.raw;
            const derivedData = signalData.derived;

            // Process and plot the signal data
            plotSignalRaw(rawData, 'plotraw', sub, ses, stim);
            plotSignalDerived(derivedData, 'plotderived', sub, ses, stim);

        } catch (error) {
            console.error('Failed to load signal:', error);
        } finally {
            // Hide the loading indicator
            loadingElement.style.display = 'none';
        }
    }

    function plotSignalRaw(signalData, htmlcode, sub, ses, stim) {
        // Extract values from the signal data
        const ecgValues = signalData.ecg_values || [];
        const eyeX = signalData.eye_data.gaze_x || [];
        const eyeY = signalData.eye_data.gaze_y || [];
        const pupilSize = signalData.eye_data.pupil_size || [];
        const headX = signalData.head_data.head_x || [];
        const headY = signalData.head_data.head_y || [];
        const headZ = signalData.head_data.head_z || [];

        const ecgSamplingRate = 128; // Sampling rate for ECG
        const eyeHeadSamplingRate = 128; // Sampling rate for eye and head data

        // Create time arrays based on the respective sampling rates
        // const ecgTime = ecgValues.map((_, index) => index / ecgSamplingRate);
        const eyeHeadTime = eyeX.map((_, index) => index / eyeHeadSamplingRate); // Use eyeX to determine length

        // Create traces for each signal
        const traces = [
            {
                x: eyeHeadTime,
                y: ecgValues,
                mode: 'lines',
                name: 'ECG Signal',
                yaxis: 'y1'
            },
            {
                x: eyeHeadTime,
                y: eyeX,
                mode: 'lines',
                name: 'Gaze X',
                yaxis: 'y2'
            },
            {
                x: eyeHeadTime,
                y: eyeY,
                mode: 'lines',
                name: 'Gaze Y',
                yaxis: 'y3'
            },
            {
                x: eyeHeadTime,
                y: pupilSize,
                mode: 'lines',
                name: 'Pupil Size',
                yaxis: 'y4'
            },
            {
                x: eyeHeadTime,
                y: headX,
                mode: 'lines',
                name: 'Head Pos X',
                yaxis: 'y5'
            },
            {
                x: eyeHeadTime,
                y: headY,
                mode: 'lines',
                name: 'Head Pos Y',
                yaxis: 'y6'
            },
            {
                x: eyeHeadTime,
                y: headZ,
                mode: 'lines',
                name: 'Head Pos Z',
                yaxis: 'y7'
            }
        ];

        // Create layout for the subplots
        const layout = {
            title: `Subject: ${sub}, Session: ${ses}, Stimulus: ${stim}`,
            height: 900, // Adjust the overall height for better visualization
            grid: { rows: traces.length, columns: 1, pattern: 'independent' },
            showlegend: true,
            paper_bgcolor: '#181a1b', // Set the background color of the entire plot
            plot_bgcolor: '#181a1b',  // Set the background color of the plotting area
            font: { color: 'white' },
            xaxis: {
                title: 'Time (s)', // Add title to the shared x-axis
                zeroline: false,
                showline: true,
                mirror: false,
                linecolor: 'grey',
                tickfont: { size: 10, color: 'white' },
                domain: [0, 1], // Use the full width of the plot
                anchor: 'y7' // Anchor to the last (bottom-most) y-axis
            }
        };

        // Create y-axis layout for each subplot
        traces.forEach((trace, index) => {
            layout[`yaxis${index + 1}`] = {
                title: trace.name,
                domain: [(traces.length - index - 1) / traces.length, (traces.length - index) / traces.length],
                zeroline: false,
                titlefont: { size: 12 },
                tickfont: { size: 10 },
                showticklabels: true,
                anchor: 'x' // Bind each y-axis to the shared x-axis
            };
        });

        // Plot the signals in subplots
        Plotly.newPlot(htmlcode, traces, layout);
    }



    function plotSignalDerived(signalData,htmlcode, sub, ses, stim) {
        // Extract values from the signal data
        const ecgValues = signalData.ecg_values || [];
        const heartrate = signalData.heart_rate || [];
        const breathrate = signalData.breath_rate || [];
        const eyeX = signalData.eye_data.gaze_x || [];
        const eyeY = signalData.eye_data.gaze_y || [];
        const pupilSize = signalData.eye_data.pupil_size || [];

        const ecgSamplingRate = 128; // Sampling rate for ECG

        // Create time arrays based on the respective sampling rates
        const ecgTime = ecgValues.map((_, index) => index / ecgSamplingRate);

        // Create traces for each signal
        const traces = [
            {
                x: ecgTime,
                y: ecgValues,
                mode: 'lines',
                name: 'Filtered ECG Signal',
                yaxis: 'y1'
            },
            {
                x: ecgTime,
                y: eyeX,
                mode: 'lines',
                name: 'Gaze X',
                yaxis: 'y2'
            },
            {
                x: ecgTime,
                y: eyeY,
                mode: 'lines',
                name: 'Gaze Y',
                yaxis: 'y3'
            },
            {
                x: ecgTime,
                y: pupilSize,
                mode: 'lines',
                name: 'Pupil Size',
                yaxis: 'y4'
            },
            {
                x: ecgTime,
                y: heartrate,
                mode: 'lines',
                name: 'Heart Rate',
                yaxis: 'y5'
            },
            {
                x: ecgTime,
                y: breathrate,
                mode: 'lines',
                name: 'Breath Rate',
                yaxis: 'y6'
            }
        ];

        // Create layout for the subplots
        const layout = {
            title: `Subject: ${sub}, Session: ${ses}, Stimulus: ${stim}`,
            // height: (900*3.5)/7, // Adjust the overall height for better visualization
            height: 900,
            grid: { rows: traces.length, columns: 1, pattern: 'independent' },
            showlegend: true,
            paper_bgcolor: '#181a1b', // Set the background color of the entire plot
            plot_bgcolor: '#181a1b',  // Set the background color of the plotting area
            font: { color: 'white' },
            xaxis: {
                title: 'Time (s)', // Add title to the shared x-axis
                zeroline: false,
                showline: true,
                mirror: false,
                linecolor: 'grey',
                tickfont: { size: 10, color: 'white' },
                domain: [0, 1], // Use the full width of the plot
                anchor: 'y6' // Anchor to the last (bottom-most) y-axis
            }
        };

        // Create y-axis layout for each subplot
        traces.forEach((trace, index) => {
            layout[`yaxis${index + 1}`] = {
                title: trace.name,
                domain: [(traces.length - index - 1) / traces.length, (traces.length - index) / traces.length],
                zeroline: false,
                titlefont: { size: 12 },
                tickfont: { size: 10 },
                showticklabels: true,
                anchor: 'x'
            };


        });

        // Plot the signals in subplots
        Plotly.newPlot(htmlcode, traces, layout);
    }

    // // Function to fetch and display the HTML table
    // function fetchTableHTML() {
    //     fetch('/table')  // Fetch the HTML file from the Flask route
    //         .then(response => {
    //             if (!response.ok) {
    //                 throw new Error('Network response was not ok');
    //             }
    //             return response.text();  // Parse the response as text
    //         })
    //         .then(data => {
    //             datasetTableContainer.innerHTML = data;
    //             });
    // }

    // function download_file(filename, subdirectory) {
    //     console.log(filename);
    //     alert("Downloading: " + filename);  // Optional: Show an alert for debugging
    //     window.location.href = '/download/' + subdirectory + '/' + filename;  // Trigger file download
    // }

    function download_file(filename) {
        console.log(filename);
        alert("Downloading: " + filename);  // Optional: Show an alert for debugging
        window.location.href = '/download/' + filename;  // Trigger file download
    }

    // Function to fetch and display the HTML table
    function fetchHomeTableHTML() {
        fetch('/homepage_table')  // Fetch the HTML file from the Flask route
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();  // Parse the response as text
            })
            .then(data => {
                datasetHomeTableContainer.innerHTML = data; // Insert the fetched HTML into the container

        });
    }

    fetchHomeTableHTML()



    // document.addEventListener("DOMContentLoaded", function() {



    // });

    // Function to handle file download





    // Search functionality for filtering displayed datasets
    // const searchInput = document.getElementById('dataset-search'); // Search input field

    // searchInput.addEventListener('input', function() {
    //     const searchValue = this.value.toLowerCase(); // Get the search input and convert it to lowercase
    //     const rows = datasetTableContainer.getElementsByTagName('tr'); // Get all rows in the fetched HTML table

    //     // Iterate over each row (skipping the header row)
    //     for (let i = 1; i < rows.length; i++) {
    //         const cells = rows[i].getElementsByTagName('td'); // Get all cells in the row
    //         let rowContainsSearchValue = false; // Flag to track if the row matches the search value

    //         // Check each cell for the search value
    //         for (let j = 0; j < cells.length; j++) {
    //             const cellValue = cells[j].textContent.toLowerCase(); // Get the cell value and convert to lowercase
    //             if (cellValue.includes(searchValue)) { // Check if cell value includes the search value
    //                 rowContainsSearchValue = true; // Set flag to true if match found
    //                 break; // Exit the loop if a match is found
    //             }
    //         }

    //         // Show or hide the row based on the search result
    //         rows[i].style.display = rowContainsSearchValue ? '' : 'none';
    //     }
    // });
});
