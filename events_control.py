from flask import Blueprint, jsonify, request, redirect, url_for, session, current_app
from datetime import datetime
from flask_dance.contrib.google import google
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import requests

from utils import event_prepare_data, get_credentials, get_calendar_list
from redis_setup import r
from db_log_utils import log_action

import os

events_control = Blueprint("events_control", __name__)

WEBHOOK_TTL_SECONDS = 43200  # 43200 = 12 годин
HOURS = 24


# ✅🗞️
@events_control.route("/get_events/<year>")
def get_event(year):
    check = check_auth()
    # None якщо все ок
    if check:
        return check

    year = int(year)

    time_min = f"{year}-01-01T00:00:00Z"
    time_max = f"{year + 1}-01-01T00:00:00Z"
    #

    user_id = session["user_info"]["user_id"]

    creds = get_credentials()
    service = build("calendar", "v3", credentials=creds)

    all_events = {}
    syncType = {}

    try:
        calendars = get_calendar_list()

        for calendar in calendars:
            calendar_id = calendar["id"]

            # Свята окремо отримаємо
            syncType[calendar_id] = "Full"

            key = f"User_events_syncToken:{user_id}:{year}:{calendar_id}"

            params = {
                "timeMin": time_min,
                "timeMax": time_max,
                "singleEvents": True,
                "showDeleted": True,
            }

            # Якщо користувач активно користується, то ми отримуємо тільки зміни, щоб не навантажувати гугл апі та сервер,
            # якщо користувач пішов, то ми отримуємо всі події, щоб впевнитись, що в нас актуальні дані
            syncToken_b = r.get(key)

            if syncToken_b:
                syncToken = syncToken_b.decode("utf-8")
                # При першому виклику, отримуємо повну синхронізацію,
                # при наступних в період WEBHOOK_TTL_SECONDS, отримуємо тільки зміни,
                # якщо користувач не активний,
                # то syncType = "Full" за замовчуванням, й отримуємо всі події по конкретному календарю
                params = {"syncToken": syncToken, "showDeleted": True}
                syncType[calendar_id] = "Partial"

            response = service.events().list(calendarId=calendar_id, **params).execute()
            events = response.get("items", [])
            all_events[calendar_id] = events

            syncToken = response.get("nextSyncToken")
            r.setex(key, WEBHOOK_TTL_SECONDS, syncToken)

    except HttpError as e:
        if e.resp.status == 410:
            log_action("admin", f"syncToken: Google API; Error: {e}")
            return jsonify({"message": "syncToken:Error; Please Relogin"}), 410

        log_action("admin", f"Get_event: Google API; Error: {e}")
        return jsonify({"message": "Server Error"}), 500

    # current_app.logger.info(
    #     f'User: {session["user_info"]["user_email"]}; Get_event: updatedMin param for get_event()'
    # )

    #
    result = []

    color_id = 0

    for calendar_id, events in all_events.items():
        color_id += 1
        for event in events:
            result.extend(event_prepare_data(calendar_id, color_id, event, HOURS))

    if result:
        log_action(
            session["user_info"]["user_email"],
            f"Get_event: Received",
        )

        response_data = {  # Просто словник
            "syncType": syncType,
            "result": result,
        }

        return jsonify(response_data), 200
    else:
        if len(result) == 0:
            # current_app.logger.info(
            #     f'User: {session["user_info"]["user_email"]}; Get_event: no Events to Receive'
            # )
            log_action(
                session["user_info"]["user_email"],
                f"Get_event: no Events to Receive",
            )

            return "", 204

        else:
            log_action(
                session["user_info"]["user_email"],
                f"Get_event: Unknown Error; Result: {result}",
            )
            # Невідома помилка, повертаємо помилку 404
            return jsonify({"message": "Unknown Error"}), 404


@events_control.route("/get_holidays/<year>")
def get_holidays(year):
    try:
        year = int(year)

        calendar_id = os.getenv("HOLIDAY_CALENDAR")
        api_key = os.getenv("API_KEY")

        time_min = f"{year}-01-01T00:00:00Z"
        time_max = f"{year + 1}-01-01T00:00:00Z"

        url = (
            f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events"
            f"?key={api_key}&timeMin={time_min}&timeMax={time_max}&singleEvents=true"
        )

        response = requests.get(url)
        data = response.json()

        events = data.get("items", [])
        holidays = []

        # import json
        # print("Google API Response:", json.dumps(data, indent=2))

        for event in events:
            holidays.extend(event_prepare_data(calendar_id, 99, event, HOURS))

        return jsonify(holidays), 200

    except Exception as e:
        log_action("admin", f"Get_holidays: Error: {e}")
        return jsonify({"message": "Get_holidays; Server Error"}), 500


@events_control.route("/create_event/<calendar_id>/<color_id>", methods=["POST"])
def create_event(calendar_id, color_id):
    check = check_auth()
    # None якщо все ок
    if check:
        return check

    try:
        data = request.get_json()
        creds = get_credentials()

        service = build("calendar", "v3", credentials=creds)

        event_body = {
            "summary": data.get("summary", "Без назви"),
            "description": data.get("description", ""),
            "start": {
                "dateTime": data["start"],
                "timeZone": "Europe/Kyiv",
            },
            "end": {
                "dateTime": data["end"],
                "timeZone": "Europe/Kyiv",
            },
        }

        response = (
            service.events().insert(calendarId=calendar_id, body=event_body).execute()
        )
        log_action(session["user_info"]["user_email"], "Create_event: created")

        event = []

        event.extend(
            event_prepare_data(calendar_id, color_id, response, HOURS)
        )  # colorId взяти з джс

        return jsonify({"message": "Event created", "event": event}), 201

    except Exception as e:
        log_action(session["user_info"]["user_email"], f"Create_event: Error: {e}")
        return jsonify({"message": "Create_event; Server Error"}), 500


@events_control.route(
    "/update_event/<calendar_id>/<color_id>/<event_id>", methods=["PATCH"]
)
def update_event(calendar_id, color_id, event_id):
    check = check_auth()
    # None якщо все ок
    if check:
        return check

    try:
        data = request.get_json()

        creds = get_credentials()
        service = build("calendar", "v3", credentials=creds)

        # якщо передати тільки частину, то воно може вказатись як порожнє, тому для безпечності
        event = service.events().get(calendarId=calendar_id, eventId=event_id).execute()

        if "summary" in data:
            event["summary"] = data["summary"]
        if "description" in data:
            event["description"] = data["description"]
        if "start" in data:
            event["start"]["dateTime"] = data["start"]
        if "end" in data:
            event["end"]["dateTime"] = data["end"]

        # Оскільки немає локалізації, то зайжди буде Україна
        event["start"]["timeZone"] = "Europe/Kyiv"
        event["end"]["timeZone"] = "Europe/Kyiv"

        updated_event = (
            service.events()
            .update(calendarId=calendar_id, eventId=event_id, body=event)
            .execute()
        )

        event = []

        event.extend(
            event_prepare_data(calendar_id, color_id, updated_event, HOURS)
        )  # colorId взяти з джс

        log_action(session["user_info"]["user_email"], f"Update_event: Updated")
        return jsonify({"message": "Event updated", "event": event}), 200

    except Exception as e:
        log_action(
            session["user_info"]["user_email"], f"Update_event: Not Updated; Error: {e}"
        )
        return jsonify({"message": "Update_event; Server Error"}), 500


@events_control.route("/delete_event/<calendar_id>/<event_id>", methods=["DELETE"])
def delete_event(calendar_id, event_id):
    check = check_auth()
    # None якщо все ок
    if check:
        return check

    try:
        creds = get_credentials()
        service = build("calendar", "v3", credentials=creds)

        service.events().delete(calendarId=calendar_id, eventId=event_id).execute()

        log_action(session["user_info"]["user_email"], f"Delete_event: {event_id}")
        return jsonify({"message": "Event deleted", "event_id": event_id}), 200

    except Exception as e:
        log_action(session["user_info"]["user_email"], f"Delete_event: Error: {e}")
        return jsonify({"message": "Delete_event; Server Error"}), 500


@events_control.route("/list_calendars")
def list_calendars():
    check = check_auth()
    # None якщо все ок
    if check:
        return check

    try:
        calendars = get_calendar_list()

        if len(calendars) > 0:
            log_action("admin", f"list_calendars: len(calendars): {len(calendars)}")

            return (
                jsonify({"message": "Calendars Received", "calendars": calendars}),
                200,
            )

        return "", 204

    except Exception as e:
        log_action("admin", f"List_calendars: Error: {e}")
        return jsonify({"message": "List_calendars; Server Error"}), 500


def check_auth():
    if not google.authorized or "user_info" not in session:
        return jsonify({"message": "Unauthorized"}), 401
    return None
