import pytest
from app import app, db
from db_setup import User, Log


@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client
        with app.app_context():
            db.drop_all()


def test_post_log_success(client):
    with client.session_transaction() as sess:
        sess["user_info"] = {"user_email": "test@example.com"}

    response = client.post("/log", json={"message": "Test log"})
    assert response.status_code == 200
    assert b"Log_action; OK" in response.data


def test_post_log_missing_data(client):
    response = client.post("/log", json={})
    assert response.status_code == 400
    assert b"Not Enough Data" in response.data


def test_view_logs_html(client):
    with app.app_context():
        user = User(Email="admin@test.com")
        db.session.add(user)
        db.session.commit()

        log = Log(User_Id=user.Id, Message="Admin log test")
        db.session.add(log)
        db.session.commit()

    response = client.get("/admin")
    assert response.status_code == 200
    assert b"Admin log test" in response.data
