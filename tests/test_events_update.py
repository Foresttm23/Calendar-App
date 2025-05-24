import json
import pytest
from unittest.mock import patch, MagicMock
from flask import session

from app import app


def login_session(client):
    with client.session_transaction() as sess:
        sess["user_info"] = {"user_id": "123", "user_email": "test@example.com"}


# test_update_event_success
@patch("events_control.check_auth", return_value=None)
@patch("events_control.get_credentials")
@patch("events_control.build")
@patch("events_control.event_prepare_data")
@patch("events_control.log_action")
def test_update_event_success(
    mock_log, mock_prepare, mock_build, mock_creds, mock_auth, client
):
    login_session(client)

    calendar_id = "calendar_123"
    color_id = "5"
    event_id = "event_456"

    event_mock = {
        "summary": "Old summary",
        "description": "Old desc",
        "start": {"dateTime": "2025-01-01T10:00:00Z", "timeZone": "UTC"},
        "end": {"dateTime": "2025-01-01T11:00:00Z", "timeZone": "UTC"},
    }

    updated_event_mock = {
        "id": event_id,
        "summary": "New summary",
        "description": "New desc",
        "start": {"dateTime": "2025-01-01T12:00:00Z", "timeZone": "Europe/Kyiv"},
        "end": {"dateTime": "2025-01-01T13:00:00Z", "timeZone": "Europe/Kyiv"},
    }

    service_mock = MagicMock()
    events_mock = service_mock.events.return_value
    events_mock.get.return_value.execute.return_value = event_mock
    events_mock.update.return_value.execute.return_value = updated_event_mock

    mock_build.return_value = service_mock

    mock_prepare.return_value = [{"summary": "New summary"}]

    payload = {
        "summary": "New summary",
        "description": "New desc",
        "start": "2025-01-01T12:00:00",
        "end": "2025-01-01T13:00:00",
    }

    response = client.patch(
        f"/update_event/{calendar_id}/{color_id}/{event_id}",
        data=json.dumps(payload),
        content_type="application/json",
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "Event updated"
    assert isinstance(data["event"], list)
    mock_log.assert_called_once()


@patch("events_control.check_auth", return_value=None)
@patch("events_control.get_credentials")
@patch("events_control.build")
@patch("events_control.log_action")
def test_update_event_error(mock_log, mock_build, mock_creds, mock_auth, client):
    login_session(client)

    service_mock = MagicMock()
    events_mock = service_mock.events.return_value

    events_mock.get.return_value.execute.side_effect = Exception("Test error")
    mock_build.return_value = service_mock

    calendar_id = "calendar_123"
    color_id = "5"
    event_id = "event_456"

    payload = {"summary": "New summary"}

    response = client.patch(
        f"/update_event/{calendar_id}/{color_id}/{event_id}",
        data=json.dumps(payload),
        content_type="application/json",
    )

    assert response.status_code == 500
    data = response.get_json()
    assert data["message"] == "Update_event; Server Error"
    mock_log.assert_called_once()
