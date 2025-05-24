from flask import Blueprint, session, request, jsonify, render_template, current_app
from flask_dance.contrib.google import google
from datetime import date, timedelta
from sqlalchemy import func
import json

from db_setup import Log, User
from db_init import db

db_log_control = Blueprint("db_log_control", __name__)


# ✅🗞️
def log_action(email, message):
    try:
        user = User.query.filter_by(Email=email).first()

        if not user:
            user = User(Email=email)
            db.session.add(user)
            db.session.commit()

        log = Log(User_Id=user.Id, Message=(message))
        db.session.add(log)
        db.session.commit()

        return jsonify({"message": "Log_action; OK"}), 200

    except Exception as e:
        current_app.logger.info(f"Log_action: Couldnt Write Logs; Error: {e}")
        db.session.rollback()

        return jsonify({"message": "Log_action; Server Error"}), 500


# ✅🗞️
@db_log_control.route("/log", methods=["POST"])
def endpoint_log_action():
    if not google.authorized or "user_info" not in session:
        user_email = "guest"
    else:
        user_email = session["user_info"]["user_email"]

    data = request.get_json()
    message = data.get("message")

    if not user_email or not message:
        log_action("admin", "Endpoint_log_action: Emty Message or User Email")

        return jsonify({"error": "Недостатньо даних"}), 400

    return log_action(user_email, message)


def get_logs():
    try:
        logs = (
            db.session.query(Log, User)
            .join(User, Log.User_Id == User.Id)
            # .filter(func.date(Log.Log_created_date) == date.today()) # Якщо велике навантаження, то можна і по днях виводити
            .order_by(Log.Log_created_date.desc())
            .all()
        )

        logs_data = [
            {
                "email": user.Email,
                "message": log.Message,
                "date": (log.Log_created_date + timedelta(hours=3)).strftime(
                    "%Y-%m-%d %H:%M:%S"
                ),
            }
            for log, user in logs
        ]
        return logs_data

    except Exception as e:
        current_app.logger.info(f"Get_logs: Couldnt Recieve Logs; Error: {e}")

        return []


# ✅🗞️
@db_log_control.route("/admin")
def view_logs():
    logs = get_logs()

    return render_template("logs.html", logs=logs)
