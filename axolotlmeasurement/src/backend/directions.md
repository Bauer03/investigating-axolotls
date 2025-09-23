### Running InvestigatingAxolotls locally

Before getting started:

Ensure you have python installed on your computer.
To check, run python --version or python3 --version. If you have either installed, you'll get the version number.

Next, you need the model. It should be named best.pt. Put it into src/backend.
Now, we can run the app locally.

## Virtual Environment setup (allows local installation of python packages)

1) Open a terminal, and navigate to src/backend

If you don't yet have a venv folder set up:
2) python3 -m venv venv (or python -m venv venv if you're using that)
  This creates a virtual environment named 'venv'
  After you've run this for the fisrt time, as long as the venv folder is there, you don't need to run this command again.

Once venv folder exists:
3) source venv/bin/activate (macOS/Linux) or venv\Scripts\activate (Windows)
  This activates your virtual environment
  You DO need to run this every time
4) IN THE SAME TAB, go back to the axolotlmeasurement directory. (running cd ../.. should take you there)

## Starting app: (Assuming you have the venv set up, according to above instructions)

1) Check you're in the axolotlmeasurement directory, and that your virtual environment is set up.
  If one of these isn't the case, look above
2) Run npm run start-backend (or start-backend mac, depending on OS). This will launch python server.
KEEP THIS TERMINAL TAB OPEN UNTIL YOU WANT TO SHUT DOWN THE PROGRAM
3) Open A SEPARATE terminal tab. This one does not need the venv set up.
4) Run npm install
5) Run npm start. This will start the electron application (including main/renderer electron processes).
KEEP THIS TERMINAL TAB OPEN UNTIL YOU WANT TO SHUT DOWN THE PROGRAM
