import json
import pytest
from unittest.mock import patch, MagicMock
from flask import session

from app import app


def login_session(client):
    with client.session_transaction() as sess:
        sess["user_info"] = {"user_id": "123", "user_email": "test@example.com"}


# test_delete_event_success
@patch("events_control.get_credentials")
@patch("events_control.build")
@patch("events_control.log_action")
@patch("events_control.check_auth", return_value=None)
def test_delete_event_success(
    mock_check_auth, mock_log, mock_build, mock_get_credentials, client
):
    login_session(client)

    mock_service = MagicMock()
    mock_events_delete = MagicMock()
    mock_events_delete.execute.return_value = None
    mock_service.events.return_value.delete.return_value = mock_events_delete
    mock_build.return_value = mock_service

    resp = client.delete("/delete_event/cal1/event123")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["message"] == "Event deleted"
    assert data["event_id"] == "event123"
    mock_log.assert_called()


# test_delete_event_error
@patch("events_control.get_credentials")
@patch("events_control.build")
@patch("events_control.log_action")
@patch("events_control.check_auth", return_value=None)
def test_delete_event_error(
    mock_check_auth, mock_log, mock_build, mock_get_credentials, client
):
    login_session(client)

    mock_service = MagicMock()
    mock_events_delete = MagicMock()
    mock_events_delete.execute.side_effect = Exception("Test error")
    mock_service.events.return_value.delete.return_value = mock_events_delete
    mock_build.return_value = mock_service

    resp = client.delete("/delete_event/cal1/event123")
    assert resp.status_code == 500
    data = resp.get_json()
    assert data["message"] == "Delete_event; Server Error"
    mock_log.assert_called()
