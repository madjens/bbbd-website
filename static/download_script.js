// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
    let baseUrl;
    const downloadButtonFP = document.getElementById('download-button');
    const downloadProgressButtonFP = document.getElementById('download-progress-button');
    const datasetInfoFP = document.getElementById('dataset-info-fullpage');
    const datasetTableContainer = document.getElementById('table-container'); // Table container for displaying the HTML file

    const datasetMessage = document.getElementById('dataset-message'); // Message for the dataset
    const optionsButtons = document.getElementById('options-buttons'); // Container for option buttons
    const subjectsDiv = document.getElementById('subjects');
    const sessionsDiv = document.getElementById('sessions');
    const stimuliDiv = document.getElementById('stimuli');
    let selectedButton = null;
    const output = document.getElementById('output');

    const selections = {
        subject: null,
        session: null,
        stimulus: null
    };

    const currentPage = window.location.pathname;
    console.log("Current Page:", currentPage);

    const links = document.querySelectorAll(".nav-link");

    links.forEach(link => {
        console.log("Checking link:", link.getAttribute("href"));

        if (link.getAttribute("href") === currentPage) {
            console.log("Match found:", link);
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

                // Auto-select the button with dataset.id = 1
                if (dataset.id === 1) {
                    button.click(); // Simulate a click on the button with id = 1
                }

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
                // console.log(pageURL)
                datasetInfoFP.innerHTML = `
                    <h3 style='text-decoration: underline'>${dataset.name}</h3>
                    <p><strong>Description:</strong> ${dataset.description}
                    <br><strong>Subjects:</strong> ${dataset.subjects}
                    <br><strong>Sessions:</strong> ${dataset.sessions}
                    <br><strong>Session Conditions: <br></strong> ${dataset.Conditions}
                    <br><strong>Tasks (Stimuli):<br></strong> ${dataset.Stimuli} (Open <a href="${pageURL}">respective experiment page</a> for more info on what stimuli was used)
                    <br><strong>Modalities Recorded:</strong> ${dataset.Modalities}</p>
                `;

                // Download BIDS File
                downloadButtonFP.style.display = 'block';
                downloadButtonFP.textContent = `Download ${dataset.name} Dataset - BIDS Format`;
                console.log(dataset.bidsname)
                downloadButtonFP.onclick = () => {
                    console.log(pageURL)
                    download_file(dataset.bidsname);
                };
            })
            .catch(() => {
                datasetInfoFP.innerHTML = '<p>Dataset not found.</p>';
                downloadButtonFP.style.display = 'none';
            });
    }

        

    async function fetchAndCountDownloads() {
        try {
            const response_ind = await fetch('/get_individual_download_logs');
            const data = await response_ind.json();
            if (data.error) {
                console.error("Error fetching logs:", data.error);
                return;
            }
            
            const response = await fetch('/get_download_logs');
            const logs = await response.json();
    
            if (logs.error) {
                console.error("Error fetching logs:", logs.error);
                return;
            }
    
            // Count occurrences of each filename
            let downloadCounts = {};
            logs.forEach(log => {
                let filename = log.filename;
                downloadCounts[filename] = (downloadCounts[filename] || 0) + 1;
            });
            // Display the counts in a table
            displayBIDSDownloadCounts(downloadCounts);
            
            const rawCount = data.rawCount;
            const processedCount = data.processedCount;
            console.log("Raw Downloads:", rawCount);
            console.log("Processed Downloads:", processedCount);
            displayRawProcessedCounts(rawCount, processedCount);

        } catch (error) {
            console.error("Failed to fetch logs:", error);
        }
    }
    function displayBIDSDownloadCounts(counts) {
        let table = `<table border="1" style="border-collapse: collapse; border: 1px solid #eee4e4ec; margin-top: 4px;">`;
        table += `<tr style="background-color: #3f51b5; font-weight: bold;">`;
        for (let filename in counts) {
            table += `<td style="border: 1px solid #eee4e4ec; padding: 8px;">${filename}</td>`;
        }
        table += `</tr>
                  <tr style="background-color: #3f51b5; font-weight: bold;">`;
        for (let filename in counts) {
            table += `<td style="border: 1px solid #eee4e4ec; padding: 8px;">${counts[filename]}</td>`;
        }
        table += `</tr></table>`;
        document.getElementById("countTable").innerHTML = table;
    }

    function displayRawProcessedCounts(rawCount, processedCount) {
        let countTable = `
            <table border="1" style="border-collapse: collapse; border: 1px solid #eee4e4ec; margin-top: 10px;">
                <tr style="background-color: #3f51b5; font-weight: bold;">
                    <td>Raw</td>
                    <td>Processed</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #eee4e4ec; background-color: #3f51b5; padding: 8px;">${rawCount}</td>
                    <td style="border: 1px solid #eee4e4ec; background-color: #3f51b5; padding: 8px;">${processedCount}</td>
                </tr>
            </table>
        `;
        document.getElementById("rawProcessedCounts").innerHTML = countTable;
    }

    // Fetch logs when the page loads
    window.onload = fetchAndCountDownloads;
    

    function fetchTableHTML() {
        fetch('/table')  // Fetch the HTML file from the Flask route
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }
                return response.text();  // Parse the response as text
            })
            .then(data => {
                datasetTableContainer.innerHTML = data;
                datasetTableContainer.addEventListener('click', (event) => {
                    const target = event.target;

                    if (target.closest('.download-btn')) {
                        const filename = target.closest('.download-btn').getAttribute('data-filename');
                        const datatype = filename.split('/')[0];
                        const exp = filename.split('/')[1];

                        console.log('exp:', encodeURIComponent(exp));
                        console.log('filename:', filename);
                        console.log('datatype:', encodeURIComponent(datatype));

                        fetch(`/download_modality?filename=${filename}&exp=${encodeURIComponent(exp)}&datatype=${encodeURIComponent(datatype)}`)
                            .then(response_file => {
                                if (!response_file.ok) {
                                    throw new Error('File not found or server error');
                                }
                                return response_file.json(); // Convert the response to a Blob
                            })
                            .then(datalink => {
                                window.location.href = datalink.download_url;
                            })
                            .catch(error => {
                                console.error('Download failed:', error);
                                alert('An error occurred while trying to download the file.');
                            });
                    };
                });
            });
    };

    function download_file(filename) {
        console.log('Downloading Filename: ' ,filename);
        // alert("Downloading: " + filename);  // Optional: Show an alert for debugging
        window.location.href = '/download-zip/' + filename;  // Trigger file download
    }

    fetchTableHTML();

    document.querySelectorAll('.material-symbols-outlined.icon').forEach(icon => {
        const tooltip = document.getElementById('tooltip_download');

        icon.addEventListener('mouseover', event => {
            // Get the aria-label from the parent button
            const ariaLabel = event.target.closest('button').getAttribute('aria-label');

            if (ariaLabel) {
                tooltip.style.display = 'block';
                tooltip.textContent = ariaLabel;
            }
        });

        icon.addEventListener('mousemove', event => {
            // Update tooltip position
            tooltip.style.left = `${event.pageX + 10}px`;
            tooltip.style.top = `${event.pageY + 10}px`;
        });

        icon.addEventListener('mouseout', () => {
            // Hide tooltip on mouse out
            tooltip.style.display = 'none';
            tooltip.textContent = '';
        });
    });

    
    
});