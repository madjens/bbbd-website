import sys
path = '/home/nkuppa/mysite'
if path not in sys.path:
   sys.path.insert(0, path)

from bids_app_online import app

if __name__ == "__main__":
    app.run()