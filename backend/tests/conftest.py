import os
import tempfile

# Use an isolated database for tests, set before the app is imported
_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["DEMO_TODAY"] = "2026-10-23"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


def login(client, email="rb@aicte-demo.org"):
    r = client.post("/auth/login", json={"email": email, "password": "password"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['accessToken']}"}


@pytest.fixture(scope="session")
def rb(client):
    return login(client, "rb@aicte-demo.org")


@pytest.fixture(scope="session")
def regional(client):
    return login(client, "regional@aicte-demo.org")


@pytest.fixture(scope="session")
def senior(client):
    return login(client, "senior@aicte-demo.org")
