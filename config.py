# config.py
import os

class ConfigVariables:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default_secret_key')  # For sessions
    S3_BUCKET = os.environ.get('S3_BUCKET', 'fcp-indi')             # For S3 bucket
    S3_PREFIX = os.environ.get('S3_PREFIX', 'data/Projects/CUNY_MADSEN/BBBD')  # For S3 prefix
