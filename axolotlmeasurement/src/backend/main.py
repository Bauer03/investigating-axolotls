from fastapi import FastAPI # do i need venv for this? hmm

app = FastAPI()

@app.get("/data")
def read_data():
    return {"message": "Hello from FastAPI"}
