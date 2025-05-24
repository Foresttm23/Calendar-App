from flask_dance.contrib.google import google
from flask import redirect, url_for, session, Blueprint, jsonify

# from webhook import webhook_controller
from redis_setup import r
from db_log_utils import log_action

google_auth_control = Blueprint("google_auth_control", __name__)


# ✅🗞️
@google_auth_control.route("/login")
def user_login():
    resp = google.get("/oauth2/v2/userinfo")
    assert resp.ok, resp.text
    user_info = resp.json()

    session["user_info"] = {
        "name": user_info["name"],
        "picture": user_info["picture"],
        "user_id": user_info["id"],
        "user_email": user_info["email"],
    }

    log_action(
        session["user_info"]["user_email"],
        f"User: Login",
    )

    return redirect(url_for("index"))


# ✅🗞️
@google_auth_control.route("/logout")
def user_logout():
    user_id = session["user_info"]["user_id"]

    key_pattern = f"User_events_syncToken:{user_id}:*"
    keys = list(r.scan_iter(match=key_pattern))

    for key in keys:
        # Якщо в користувача не завантажуються івенти, він може просто перезайти в аккаунт для вирішення проблеми
        deleted = r.delete(key)
        if deleted == 0:
            log_action(
                session["user_info"]["user_email"],
                f"User: Logout; User_events_syncToken: {key}; NOT deleted",
            )

    remaining_keys = list(r.scan_iter(match=key_pattern))
    if remaining_keys:
        log_action(
            session["user_info"]["user_email"],
            f"Logout: Some keys not deleted: {remaining_keys}",
        )

    log_action(
        session["user_info"]["user_email"],
        f"User: Logout",
    )

    session.clear()
    return redirect("/")
