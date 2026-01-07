import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()


MONGO_URI = os.getenv("DATABASE_URL")

client = MongoClient(MONGO_URI)
db =  client['Taskmanager']

def get_db():
    """Dependency that yields a pymongo Database instance."""
    try:
        yield db
    finally:
        pass