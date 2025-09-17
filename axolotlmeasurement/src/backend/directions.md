## Virtual Environment setup (allows temporary installation of python packages)

1) Navigate to src/backend

If no venv folder:
2) python3 -m venv venv (MacOS/Linux) or python -m venv venv (Windows) -> This creates a virtual environment named 'venv'

If venv folder exists (or once you've set this virtual env folder up):
3) source venv/bin/activate (macOS/Linux) or venv\Scripts\activate (Windows) -> This activates the virtual environment
4) pip install -r requirements.txt -> This installs the packages detailed in requirements.txt into the virtual environment

## Starting app: (Assuming you have the venv set up, according to above instructions)

1) Navigate to axolotlmeasurement directory
2) Run npm install
3) Run npm run start-backend (or start-backend mac, depending on OS). This will launch python server. KEEP THIS OPEN
4) Open a separate terminal tab and run npm run start. This will start the electron application (including main/renderer electron processes). ALSO KEEP THIS TAB OPEN.
5) To make changes to my code, press ctrl+c in the electron process to shut it down, then run npm run start again. The python server can run in the background and should work with edits, but you can shut it down & restart it as well, if you'd like/if you encounter errors.

Changes aren't hot reloaded by default, ctrl+c out of the 'npm run start' command and re-run it to see changes.
 - I know there's ways to get hot reload working, but realistically it takes a few minutes to set up and as is, I can press ctrl+c, up arrow, and enter quickly, so I don't bother.
