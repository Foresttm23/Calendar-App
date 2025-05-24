import json
import pytest
from unittest.mock import patch, MagicMock
from flask import session

from app import app


def login_session(client):
    with client.session_transaction() as sess:
        sess["user_info"] = {"user_id": "123", "user_email": "test@example.com"}


# test_create_event_success
@patch("events_control.get_credentials")
@patch("events_control.build")
@patch("events_control.log_action")
@patch("events_control.check_auth", return_value=None)
@patch("events_control.event_prepare_data", return_value=[{"id": "new_event"}])
def test_create_event_success(
    mock_prepare, mock_check_auth, mock_log, mock_build, mock_get_credentials, client
):
    login_session(client)

    mock_service = MagicMock()
    mock_events_insert = MagicMock()
    mock_events_insert.execute.return_value = {"id": "new_event"}
    mock_service.events.return_value.insert.return_value = mock_events_insert
    mock_build.return_value = mock_service

    payload = {
        "summary": "Test Event",
        "description": "Desc",
        "start": "2025-05-24T10:00:00",
        "end": "2025-05-24T11:00:00",
    }

    resp = client.post("/create_event/cal1/1", json=payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["message"] == "Event created"
    assert data["event"][0]["id"] == "new_event"
    mock_log.assert_called()


# def test_create_event_error
@patch("events_control.get_credentials")
@patch("events_control.build")
@patch("events_control.log_action")
@patch("events_control.check_auth", return_value=None)
def test_create_event_error(
    mock_check_auth, mock_log, mock_build, mock_get_credentials, client
):
    login_session(client)

    # Налаштовуємо mock, який викликає Exception при insert().execute()
    mock_service = MagicMock()
    mock_insert = MagicMock()
    mock_insert.execute.side_effect = Exception("API error")
    mock_service.events.return_value.insert.return_value = mock_insert
    mock_build.return_value = mock_service

    payload = {
        "summary": "Test Event",
        "description": "Desc",
        "start": "2025-05-24T10:00:00",
        "end": "2025-05-24T11:00:00",
    }

    resp = client.post("/create_event/cal1/1", json=payload)
    assert resp.status_code == 500
    data = resp.get_json()
    assert "Server Error" in data["message"]
    mock_log.assert_called()
