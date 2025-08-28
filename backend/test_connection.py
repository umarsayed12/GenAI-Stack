# test_connection.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

print("--- Starting Connection Test ---")

# 1. Load the .env file
load_dotenv()
db_url = os.getenv("DATABASE_URL")

if not db_url:
    print("ERROR: DATABASE_URL not found in .env file!")
else:
    print(f"Found DATABASE_URL: {db_url}")

    try:
        # 2. Try to connect
        print("Attempting to create engine...")
        engine = create_engine(db_url)

        print("Engine created. Attempting to connect...")
        connection = engine.connect()

        print("\n\n✅✅✅ SUCCESS! Connection to the database was successful. ✅✅✅")

        connection.close()
        print("Connection closed.")

    except Exception as e:
        print("\n\n❌❌❌ FAILED! Could not connect to the database. ❌❌❌")
        print(f"Error details: {e}")

print("--- Test Finished ---")