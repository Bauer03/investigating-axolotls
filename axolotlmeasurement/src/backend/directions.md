this is my first time using virtual environments, so here's the setup to remind myself

1) Navigate to src/backend

If no venv folder:
2) python3 -m venv venv (MacOS/Linux) or python -m venv venv (Windows) -> This creates a virtual environment named 'venv'

Once venv folder exists:
3) source venv/bin/activate (macOS/Linux) or venv\Scripts\activate (Windows) -> This activates the virtual environment
4) pip install -r requirements.txt -> This installs the packages detailed in requirements.txt into the virtual environment
