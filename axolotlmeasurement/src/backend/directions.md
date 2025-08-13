this is my first time using virtual environments, so here's the setup to remind myself

1) Navigate to src/backend

If no venv folder:
2) python3 -m venv venv (MacOS/Linux) or python -m venv venv (Windows) -> This creates a virtual environment named 'venv'

Once venv folder exists:
3) source venv/bin/activate (macOS/Linux) or venv\Scripts\activate (Windows) -> This activates the virtual environment
4) pip install -r requirements.txt -> This installs the packages detailed in requirements.txt into the virtual environment

In case someone happens upon this document looking for how to launch the entire app locally:

1) Navigate to axolotlmeasurement
2) Run npm install
3) Run npm run start-backend (or start-backend mac). This will launch python server
4) Open another terminal tab and run npm run start. This will start the electron application (including main/renderer electron processes).

Changes aren't hot reloaded by default, ctrl+c out of the 'npm run start' command and re-run it to see changes.
 - I know there's ways to get hot reload working, but realistically it takes a few minutes to set up and as is, I can press ctrl+c, up arrow, and enter quickly, so I don't bother.
