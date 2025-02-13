# app
from flask import Flask, jsonify, abort, render_template, request, abort, Response, redirect, url_for, send_file
import logging
from datetime import datetime
import pandas as pd
from io import BytesIO
import io
import gzip
import requests
import boto3
from botocore import UNSIGNED
from botocore.client import Config
import git

# from threading import Thread
from config import ConfigVariables
from datasets_info import datasets
import os

app = Flask(__name__)
app.config.from_object(ConfigVariables)

bucket_name = app.config['S3_BUCKET']
prefix_s3 = app.config['S3_PREFIX']

bids_log_file = "./bbbd-website/logs" + "/bids_datasets_download.log"
print("BIDS LOG FILE", bids_log_file)
individual_log_file = "./bbbd-website/logs" + "/individual_files_download.log"
print("INDIVIDUAL LOG FILE", individual_log_file)

@app.route('/git_update', methods=['POST'])
def git_update():
    repo = git.Repo('./bbbd-website')
    origin = repo.remotes.origin
    repo.create_head('main',
                     origin.refs.main).set_tracking_branch(origin.refs.main).checkout()
    origin.pull()
    return '', 200

logging.basicConfig(level=logging.INFO)
bids_logger = logging.getLogger("bids_download")
indiv_logger = logging.getLogger("individual_download")
bids_handler = logging.FileHandler(bids_log_file)
indiv_handler = logging.FileHandler(individual_log_file)
bids_logger.addHandler(bids_handler)
indiv_logger.addHandler(indiv_handler)

@app.route('/')
def index():
    base_url = request.url_root
    print(f"Base URL: {base_url}")
    return render_template('index.html', base_url=base_url)

@app.route('/api/base-url')
def api_base_url():
    base_url = request.url_root
    return jsonify(base_url=base_url)

#### Webpages ####
@app.route('/download_page')
def download_page():
    return render_template('download_page.html')

@app.route('/about-page')
def about_page():
    return render_template('about_page.html')

@app.route('/tutorials-page')
def tutorials_page():
    return render_template('tutorials_page.html')

@app.route('/experiments-page')
def experiments_page():
    return render_template('experiments_page.html')

@app.route('/questionnaires-page')
def questionnaires_page():
    return render_template('questionnaires_page.html')

@app.route('/research-page')
def research_page():
    return render_template('research_page.html')

@app.route('/changelog')
def changelog_page():
    return render_template('changelog_page.html')

@app.route('/table')
def table():
    return render_template('table.html')

@app.route('/homepage_table')
def homepage_table():
    return render_template('homepage_table.html')

##### Backend Data Fetching ####
@app.route('/datasets', methods=['GET'])
def get_datasets():
    return jsonify({'datasets': [{'id': d['id'], 'name': d['name']} for d in datasets]})

@app.route('/dataset/<int:dataset_id>', methods=['GET'])
def get_dataset_info(dataset_id):
    dataset = next((d for d in datasets if d['id'] == dataset_id), None)
    if dataset:
        return jsonify(dataset)
    else:
        abort(404, description="Dataset not found")

@app.route('/download-zip/<exp_name>', methods=['GET'])
def download_zip(exp_name):
    bucket_name = "fcp-indi"
    s3 = boto3.client('s3', config=Config(signature_version=UNSIGNED))
    prefix = prefix_s3 + '/bids_data/' + f"{exp_name}"
    try:
        # Generate a pre-signed URL for the specific file
        download_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': prefix},
            ExpiresIn=3600  # Link valid for 1 hour
        )
        # Log the download
        bids_logger.info(f"{datetime.now()} - {exp_name} - {download_url}")
        return redirect(download_url)

    except s3.exceptions.NoSuchKey:
        return jsonify({'error': f'Zip file for {exp_name} not found'}), 404

@app.route('/download_modality')
def download_file():
    filename = request.args.get('filename')
    exp = request.args.get('exp')
    datatype = request.args.get('datatype')

    base_path = f"data/Projects/CUNY_MADSEN/BBBD/matrix_data"
    s3 = boto3.client('s3', config=Config(signature_version=UNSIGNED))

    bucket_name = 'fcp-indi'

    try:
        if 'all' in filename.lower():
            # Change the file extension to .zip
            filename = filename.rsplit('.', 1)[0] + '.zip'
            full_key = base_path + '/' + filename
        
        elif 'demographics' in filename.lower():
            filename = f'raw/{exp}/{exp}_demographics.zip'
            full_key = base_path + '/' + filename

        elif 'questionnaires' in filename.lower():
            filename = f'raw/{exp}/{exp}_questionnaires.zip'
            full_key = base_path + '/' + filename
            
        else:
            full_key = base_path + '/' + filename
        
        print('full key: ', full_key)
        download_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': full_key},
            ExpiresIn=3600  # Link valid for 1 hour
        )
        print(download_url)
        # Log the download
        indiv_logger.info(f"{datetime.now()} - {filename} - {download_url}")
        return jsonify({'download_url': download_url})

    except Exception as e:
        print(f"Error: {e}, {full_key}")
        return "Internal Server Error", 500

##############################
#### Signal Visualisation ####
##############################

def read_gzip_data(url, data_container, signal_type):
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for bad responses

        # Debug output: Response details
        print(f"Response status code: {response.status_code}")

        # Read the GZIP content
        with gzip.GzipFile(fileobj=BytesIO(response.content)) as f:
            df = pd.read_csv(f, sep='\t')

        print(signal_type, " data loaded successfully")

        if signal_type == 'ecg':
            data_container['ecg_values'] = df.iloc[:, 0].tolist()
        elif signal_type == 'hr':
            data_container['heart_rate'] = df.iloc[:, 0].tolist()
        elif signal_type == 'br':
            data_container['breath_rate'] = df.iloc[:, 0].tolist()
        elif signal_type == 'gaze':
            data_container['eye_data']['gaze_x'] = df.iloc[:, 0].tolist()
            data_container['eye_data']['gaze_y'] = df.iloc[:, 1].tolist()
        elif signal_type == 'pupil':
            data_container['eye_data']['pupil_size'] = df.iloc[:, 0].tolist()
        elif signal_type == 'head':
            data_container['head_data']['head_x'] = df.iloc[:, 0].tolist()
            data_container['head_data']['head_y'] = df.iloc[:, 1].tolist()
            data_container['head_data']['head_z'] = df.iloc[:, 2].tolist()

        print(f'{signal_type.capitalize()} data loaded from {url}')
    except Exception as e:
        print(f"Error reading data from {url}: {str(e)}")

@app.route('/plot/<string:bidsname>/<string:sub>/<string:ses>/<string:stim>')
def load_signal(bidsname, sub, ses, stim):
    print(f"Received bidname: {bidsname}, sub: {sub}, ses: {ses}, stim: {stim}")

    raw_ecg_path = 'https://fcp-indi.s3.amazonaws.com/' + prefix_s3 + f'/plot_data_website/{bidsname}/sub-{sub}/ses-{ses}/beh/sub-{sub}_ses-{ses}_task-stim{stim}_recording-ecg_physio.tsv.gz'
    raw_gaze_path = 'https://fcp-indi.s3.amazonaws.com/' + prefix_s3 + f'/plot_data_website/{bidsname}/sub-{sub}/ses-{ses}/eyetrack/sub-{sub}_ses-{ses}_task-stim{stim}_gaze_eyetrack.tsv.gz'
    raw_pupil_path = 'https://fcp-indi.s3.amazonaws.com/' + prefix_s3 + f'/plot_data_website/{bidsname}/sub-{sub}/ses-{ses}/eyetrack/sub-{sub}_ses-{ses}_task-stim{stim}_pupil_eyetrack.tsv.gz'
    raw_head_path = 'https://fcp-indi.s3.amazonaws.com/' + prefix_s3 + f'/plot_data_website/{bidsname}/sub-{sub}/ses-{ses}/eyetrack/sub-{sub}_ses-{ses}_task-stim{stim}_head_eyetrack.tsv.gz'

    derived_ecg_path = 'https://fcp-indi.s3.amazonaws.com/' + prefix_s3 + f'/plot_data_website/{bidsname}/derivatives/sub-{sub}/ses-{ses}/beh/sub-{sub}_ses-{ses}_task-stim{stim}_desc-filteredECG.tsv.gz'
    derived_hr_path = 'https://fcp-indi.s3.amazonaws.com/' + prefix_s3 + f'/plot_data_website/{bidsname}/derivatives/sub-{sub}/ses-{ses}/beh/sub-{sub}_ses-{ses}_task-stim{stim}_desc-heartrate.tsv.gz'
    derived_br_path = 'https://fcp-indi.s3.amazonaws.com/' + prefix_s3 + f'/plot_data_website/{bidsname}/derivatives/sub-{sub}/ses-{ses}/beh/sub-{sub}_ses-{ses}_task-stim{stim}_desc-breathrate.tsv.gz'

    derived_pupil_path = 'https://fcp-indi.s3.amazonaws.com/' + prefix_s3 + f'/plot_data_website/{bidsname}/derivatives/sub-{sub}/ses-{ses}/eyetrack/sub-{sub}_ses-{ses}_task-stim{stim}_desc-pupil_eyetrack.tsv.gz'
    derived_gaze_path = 'https://fcp-indi.s3.amazonaws.com/' + prefix_s3 + f'/plot_data_website/{bidsname}/derivatives/sub-{sub}/ses-{ses}/eyetrack/sub-{sub}_ses-{ses}_task-stim{stim}_desc-gaze_eyetrack.tsv.gz'

    signal_data = {
        'raw': {
            'ecg_values': [],
            'eye_data': {'gaze_x': [], 'gaze_y': [], 'pupil_size': []},
            'head_data': {'head_x': [], 'head_y': [], 'head_z': []}
        },
        'derived': {
            'ecg_values': [],
            'heart_rate': [],
            'breath_rate': [],
            'eye_data': {'gaze_x': [], 'gaze_y': [], 'pupil_size': []},
        }
    }

    read_gzip_data(raw_ecg_path, signal_data['raw'], 'ecg')
    read_gzip_data(raw_gaze_path, signal_data['raw'], 'gaze')
    read_gzip_data(raw_pupil_path, signal_data['raw'], 'pupil')
    read_gzip_data(raw_head_path, signal_data['raw'], 'head')

    # Load derived (processed) data
    read_gzip_data(derived_ecg_path, signal_data['derived'], 'ecg')
    read_gzip_data(derived_hr_path, signal_data['derived'], 'hr')
    read_gzip_data(derived_br_path, signal_data['derived'], 'br')
    read_gzip_data(derived_gaze_path, signal_data['derived'], 'gaze')
    read_gzip_data(derived_pupil_path, signal_data['derived'], 'pupil')

    return jsonify(signal_data)

#######################
#### Main Function ####
#######################

if __name__ == '__main__':
    # app.run(debug=True) # Development debugging
    app.run(debug=False)
    # app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default_secret_key')

