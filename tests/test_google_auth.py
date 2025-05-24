import pytest
from unittest.mock import patch, MagicMock
from flask import session, url_for


# # test_user_login_success
# @patch("google_auth.google.get")
# @patch("google_auth.log_action")
# def test_user_login_success(mock_log_action, mock_google_get, client):
#     # Налаштовуємо мок Google API
#     mock_resp = MagicMock()
#     mock_resp.ok = True
#     mock_resp.json.return_value = {
#         "name": "Test User",
#         "picture": "http://example.com/pic.jpg",
#         "id": "12345",
#         "email": "test@example.com",
#     }
#     mock_google_get.return_value = mock_resp

#     response = client.get("/login")

#     # Перевіряємо, що нас редіректить на index
#     assert response.status_code == 302
#     assert "/index" in response.location

#     with client.session_transaction() as sess:
#         assert sess["user_info"]["user_email"] == "test@example.com"

#     # Перевірка логування
#     mock_log_action.assert_called_with("test@example.com", "User: Login")


# test_user_logout_success
@patch("google_auth.log_action")
@patch("google_auth.r")
def test_user_logout_success(mock_redis, mock_log_action, client):
    with client.session_transaction() as sess:
        sess["user_info"] = {
            "user_id": "user123",
            "user_email": "test@example.com",
        }

    keys = [b"User_events_syncToken:user123:1", b"User_events_syncToken:user123:2"]
    mock_redis.scan_iter.return_value = keys

    mock_redis.delete.return_value = 1

    response = client.get("/logout")

    assert response.status_code == 302
    assert response.headers["Location"].endswith("/")

    calls = [((key,),) for key in keys]
    mock_redis.delete.assert_any_call(keys[0])
    mock_redis.delete.assert_any_call(keys[1])

    mock_log_action.assert_any_call("test@example.com", "User: Logout")

    with client.session_transaction() as sess:
        assert sess == {}


# test_user_logout_keys_not_deleted
@patch("google_auth.log_action")
@patch("google_auth.r")
def test_user_logout_keys_not_deleted(mock_redis, mock_log_action, client):
    with client.session_transaction() as sess:
        sess["user_info"] = {
            "user_id": "user123",
            "user_email": "test@example.com",
        }

    keys = [b"User_events_syncToken:user123:1"]
    mock_redis.scan_iter.side_effect = [keys, keys]
    mock_redis.delete.return_value = 0

    response = client.get("/logout")

    assert response.status_code == 302
    assert response.headers["Location"].endswith("/")

    mock_log_action.assert_any_call(
        "test@example.com",
        f"User: Logout; User_events_syncToken: {keys[0]}; NOT deleted",
    )
    mock_log_action.assert_any_call(
        "test@example.com", f"Logout: Some keys not deleted: {keys}"
    )
    mock_log_action.assert_any_call("test@example.com", "User: Logout")
