import pytest
from unittest.mock import patch, MagicMock

from googleapiclient.errors import HttpError

from app import app


def login_session(client):
    with client.session_transaction() as sess:
        sess["user_info"] = {"user_id": "123", "user_email": "test@example.com"}


# test_unauthorized_access
def test_unauthorized_access(client):
    """Перевірка відповіді 401 без авторизації"""
    resp = client.get("/get_events/2025")
    assert resp.status_code == 401
    assert resp.json["message"] == "Unauthorized"


# test_get_events_success
@patch("events_control.get_credentials")
@patch("events_control.get_calendar_list")
@patch("events_control.r")
@patch("events_control.build")
@patch("events_control.log_action")
@patch("events_control.check_auth", return_value=None)  # примусова авторизація
@patch(
    "events_control.event_prepare_data",
    side_effect=lambda cal_id, color_id, event, hours: [{"id": event.get("id", "e1")}],
)
def test_get_events_success(
    mock_prepare,
    mock_check_auth,
    mock_log,
    mock_build,
    mock_r,
    mock_get_calendar_list,
    mock_get_credentials,
    client,
):
    login_session(client)

    # Налаштовуємо мок для календарів і подій
    mock_get_calendar_list.return_value = [{"id": "cal1"}]
    mock_r.get.return_value = None  # відсутній syncToken

    # Мок відповіді Google API
    events_response = {"items": [{"id": "event1"}], "nextSyncToken": "token123"}
    mock_service = MagicMock()
    mock_events_list = MagicMock()
    mock_events_list.execute.return_value = events_response
    mock_service.events.return_value.list.return_value = mock_events_list
    mock_build.return_value = mock_service

    resp = client.get("/get_events/2025")

    assert resp.status_code == 200
    data = resp.get_json()
    assert data["syncType"] == {"cal1": "Full"}
    assert "result" in data
    assert isinstance(data["result"], list)
    assert data["result"][0]["id"] == "event1"

    mock_r.setex.assert_called_once()  # Перевірка, що токен зберігається
    mock_log.assert_called()  # Перевірка логування


# test_get_events_with_sync_token
@patch("events_control.get_credentials")
@patch("events_control.get_calendar_list")
@patch("events_control.r")
@patch("events_control.build")
@patch("events_control.log_action")
@patch("events_control.check_auth", return_value=None)
@patch(
    "events_control.event_prepare_data",
    side_effect=lambda cal_id, color_id, event, hours: [{"id": event.get("id", "e1")}],
)
def test_get_events_with_sync_token(
    mock_prepare,
    mock_check_auth,
    mock_log,
    mock_build,
    mock_r,
    mock_get_calendar_list,
    mock_get_credentials,
    client,
):
    login_session(client)
    mock_get_calendar_list.return_value = [{"id": "cal1"}]
    mock_r.get.return_value = b"old_token"

    events_response = {"items": [{"id": "event2"}], "nextSyncToken": "new_token"}
    mock_service = MagicMock()
    mock_events_list = MagicMock()
    mock_events_list.execute.return_value = events_response
    mock_service.events.return_value.list.return_value = mock_events_list
    mock_build.return_value = mock_service

    resp = client.get("/get_events/2025")
    data = resp.get_json()
    assert resp.status_code == 200
    assert data["syncType"] == {"cal1": "Partial"}
    assert data["result"][0]["id"] == "event2"


# test_get_events_sync_token_error
@patch("events_control.get_credentials")
@patch("events_control.get_calendar_list")
@patch("events_control.r")
@patch("events_control.build")
@patch("events_control.log_action")
@patch("events_control.check_auth", return_value=None)
def test_get_events_sync_token_error(
    mock_check_auth,
    mock_log,
    mock_build,
    mock_r,
    mock_get_calendar_list,
    mock_get_credentials,
    client,
):
    login_session(client)
    mock_get_calendar_list.return_value = [{"id": "cal1"}]

    error = HttpError(resp=MagicMock(status=410), content=b"token expired")
    mock_service = MagicMock()
    mock_service.events.return_value.list.side_effect = error
    mock_build.return_value = mock_service

    resp = client.get("/get_events/2025")
    assert resp.status_code == 410
    assert "syncToken:Error" in resp.get_json()["message"]


# test_get_events_server_error
@patch("events_control.get_credentials")
@patch("events_control.get_calendar_list")
@patch("events_control.r")
@patch("events_control.build")
@patch("events_control.log_action")
@patch("events_control.check_auth", return_value=None)
def test_get_events_server_error(
    mock_check_auth,
    mock_log,
    mock_build,
    mock_r,
    mock_get_calendar_list,
    mock_get_credentials,
    client,
):
    login_session(client)
    mock_get_calendar_list.return_value = [{"id": "cal1"}]

    error = HttpError(resp=MagicMock(status=500), content=b"server error")
    mock_service = MagicMock()
    mock_service.events.return_value.list.side_effect = error
    mock_build.return_value = mock_service

    resp = client.get("/get_events/2025")
    assert resp.status_code == 500
    assert "Server Error" in resp.get_json()["message"]


# test_get_events_empty
@patch("events_control.get_credentials")
@patch("events_control.get_calendar_list")
@patch("events_control.r")
@patch("events_control.build")
@patch("events_control.log_action")
@patch("events_control.check_auth", return_value=None)
@patch("events_control.event_prepare_data", return_value=[])
def test_get_events_empty(
    mock_prepare,
    mock_check_auth,
    mock_log,
    mock_build,
    mock_r,
    mock_get_calendar_list,
    mock_get_credentials,
    client,
):
    login_session(client)
    mock_get_calendar_list.return_value = [{"id": "cal1"}]
    mock_r.get.return_value = None

    events_response = {"items": [], "nextSyncToken": "token123"}
    mock_service = MagicMock()
    mock_events_list = MagicMock()
    mock_events_list.execute.return_value = events_response
    mock_service.events.return_value.list.return_value = mock_events_list
    mock_build.return_value = mock_service

    resp = client.get("/get_events/2025")
    assert resp.status_code == 204
