from dateutil import parser
from flask_dance.contrib.google import google
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import datetime, timedelta, time

from google_bp import google_bp
from db_log_utils import log_action
from redis_setup import r

import os


def event_prepare_data(calendar_id, color_id, event, HOURS):
    segments = []

    start_info = event.get("start", {})
    end_info = event.get("end", {})

    event_id = event.get("id")

    summary = event.get("summary", "Без назви")
    description = event.get("description", "")

    if "holiday" in calendar_id:
        dt_start_holidays_d = datetime.strptime(start_info["date"], "%Y-%m-%d")
        dt_end_holidays_d = datetime.strptime(end_info["date"], "%Y-%m-%d")

        dt_start_holidays = dt_start_holidays_d.date()
        dt_end_holidays = dt_end_holidays_d.date()

        segments.append(
            {
                "calendarId": calendar_id,
                "event_id": event_id,
                "summary": summary,
                "description": description,
                "eventStart": dt_start_holidays_d.isoformat(),
                "eventEnd": dt_end_holidays_d.isoformat(),
                "start": {
                    "year": dt_start_holidays.year,
                    "month": dt_start_holidays.month,
                    "day": dt_start_holidays.day,
                },
                "end": {
                    "year": dt_end_holidays.year,
                    "month": dt_end_holidays.month,
                    "day": dt_end_holidays.day,
                },
            }
        )

        return segments

    status = event.get("status")

    creator_email = event.get("creator", {}).get("email", "Невідомо")
    attendees = event.get("attendees", [])
    attendee_emails = [a.get("email", "Невідомо") for a in attendees]

    dt_start = (
        parse_datetime(start_info.get("dateTime"))
        if "dateTime" in start_info
        else datetime.strptime(start_info.get("date"), "%Y-%m-%d")
    )
    dt_end = (
        parse_datetime(end_info.get("dateTime"))
        if "dateTime" in end_info
        else datetime.strptime(end_info.get("date"), "%Y-%m-%d")
    )

    dt_end_save = dt_end

    if dt_start and dt_end:
        long_event = False
        if (dt_end.date() - dt_start.date()).days > 0:
            long_event = True
            dt_end -= timedelta(seconds=1)

        current_day = dt_start.date()
        last_day = dt_end.date()

        while current_day <= last_day:

            segment_start = datetime.combine(current_day, datetime.min.time())
            segment_end = datetime.combine(current_day, datetime.max.time())

            if current_day == dt_start.date():
                segment_start = dt_start

            if current_day == dt_end.date():
                segment_end = dt_end

            start_minutes = segment_start.hour * 60 + segment_start.minute
            end_minutes = segment_end.hour * 60 + segment_end.minute

            start_position = start_minutes / (HOURS * 60)
            end_position = ((end_minutes - start_minutes) / 60) / HOURS

            # log_action(
            #     "admin",
            #     f"event_prepare_data: current_day.day: {current_day.day}; dt_start: {dt_start}; dt_end: {dt_end}; event_id: {event_id}; start_position: {start_position}; end_position: {end_position}",
            # )

            segments.append(
                {
                    "calendarId": calendar_id,
                    "summary": summary,
                    "description": description,
                    "event_id": event_id,
                    "colorId": color_id,
                    "status": status,
                    # "creator_email": creator_email,
                    # "attendees": attendees,
                    # "attendee_emails": attendee_emails,
                    "eventStart": dt_start.isoformat(),
                    "eventEnd": dt_end_save.isoformat(),
                    "start": {
                        "year": current_day.year,
                        "month": current_day.month,
                        "day": current_day.day,
                        "hour": segment_start.hour,
                        "minutes": segment_start.minute,
                    },
                    "end": {
                        "year": current_day.year,
                        "month": current_day.month,
                        "day": current_day.day,
                        "hour": segment_end.hour,
                        "minutes": segment_end.minute,
                    },
                    "startMinutes": start_minutes,
                    "endMinutes": end_minutes,
                    "startPosition": start_position,
                    "endPosition": end_position,
                    "longEvent": long_event,
                    "overlaps": 0,
                    "column": 0,
                }
            )

            current_day += timedelta(days=1)

    # log_action("admin", f"event_prepare_data: segments: {segments};")
    return segments


def parse_datetime(dt_str):
    if not dt_str:
        return None
    try:
        return parser.parse(dt_str)
    except Exception as e:
        log_action("admin", f"Parse_datetime: Parser Invalid Value; Error: {e}")

        return None


# Фактично не потрібен, бо я і так пінгую сервер 😒😒😒😒😒😒😒😒😒
# def get_user_id(channel_id):
#     parts = channel_id.split("=")

#     if (
#         len(parts) == 6
#         and parts[0] == "user"
#         and parts[2] == "calendar"
#         and parts[4] == "time"
#     ):
#         user_id = parts[1]
#         calendar = parts[3]
#         return user_id, calendar

#     else:
#         log_action("admin", f"Get_user_id: channel_id Parts Invalid Lenght")

#         return None, None
# Фактично не потрібен, бо я і так пінгую сервер 😒😒😒😒😒😒😒😒😒


def get_credentials():
    token = google.token["access_token"]
    refresh_token = google.token.get("refresh_token")
    client_id = google_bp.client_id
    client_secret = google_bp.client_secret
    token_uri = "https://oauth2.googleapis.com/token"

    scope = google_bp.scope

    credentials = Credentials(
        token=token,
        refresh_token=refresh_token,
        token_uri=token_uri,
        client_id=client_id,
        client_secret=client_secret,
        scopes=scope,
    )

    return credentials


def get_calendar_list():
    creds = get_credentials()
    service = build("calendar", "v3", credentials=creds)

    try:
        calendar_list = service.calendarList().list().execute()
    except Exception as e:
        log_action("admin", f"get_calendar_list: Error: {e}")
        raise e

    color_id = 0
    calendars = []
    for calendar in calendar_list.get("items", []):
        if not "holiday" in calendar.get("id"):
            color_id += 1

            calendars.append(
                {
                    "id": calendar.get("id"),
                    "summary": calendar.get("summary"),
                    "timeZone": calendar.get("timeZone"),
                    "accessRole": calendar.get("accessRole"),
                    "colorId": color_id,
                }
            )

    return calendars
