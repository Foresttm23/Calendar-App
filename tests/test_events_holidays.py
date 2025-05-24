from flask import jsonify
import pytest
from unittest.mock import patch, MagicMock

from app import app


def login_session(client):
    with client.session_transaction() as sess:
        sess["user_info"] = {"user_id": "123", "user_email": "test@example.com"}


def mock_check_auth_fail():
    # Фейк для неавторизованого доступу

    return jsonify({"message": "Unauthorized"}), 401


# test_get_holidays_success
@patch("events_control.check_auth", return_value=None)
@patch("events_control.requests.get")
@patch("events_control.event_prepare_data")
@patch("events_control.log_action")
def test_get_holidays_success(
    mock_log, mock_prepare, mock_requests_get, mock_auth, client
):
    year = 2025

    fake_google_response = {
        "items": [
            {
                "id": "holiday1",
                "summary": "Holiday 1",
                "start": {"date": "2025-01-01"},
                "end": {"date": "2025-01-02"},
            }
        ]
    }

    mock_resp = MagicMock()
    mock_resp.json.return_value = fake_google_response
    mock_requests_get.return_value = mock_resp

    # event_prepare_data поверне список із одного холидаю
    mock_prepare.return_value = [{"summary": "Holiday 1"}]

    response = client.get(f"/get_holidays/{year}")

    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert data[0]["summary"] == "Holiday 1"
    mock_log.assert_not_called()  # Логування помилки не має бути


# test_get_holidays_unauthorized
@patch("events_control.check_auth", side_effect=mock_check_auth_fail)
def test_get_holidays_unauthorized(mock_auth, client):
    response = client.get("/get_holidays/2025")
    assert response.status_code == 200


# test_get_holidays_error
@patch("events_control.requests.get")
@patch("events_control.log_action")
def test_get_holidays_error(mock_log_action, mock_requests_get, client):
    # Мокаємо requests.get так, щоб він викликав виключення
    mock_requests_get.side_effect = Exception("Test Exception")

    response = client.get("/get_holidays/2025")

    assert response.status_code == 500
    data = response.get_json()
    assert data["message"] == "Get_holidays; Server Error"
    mock_log_action.assert_called_once()
