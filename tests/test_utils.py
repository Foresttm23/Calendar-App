import pytest
from datetime import datetime, timedelta

from utils import event_prepare_data

HOURS = 24


def create_event(start, end, use_datetime=True):
    if use_datetime:
        start_field = {"dateTime": start.isoformat()}
        end_field = {"dateTime": end.isoformat()}
    else:
        start_field = {"date": start.strftime("%Y-%m-%d")}
        end_field = {"date": end.strftime("%Y-%m-%d")}

    event = {
        "id": "event123",
        "summary": "Test Event",
        "description": "Test Description",
        "start": start_field,
        "end": end_field,
        "status": "confirmed",
    }

    return event


def test_holiday_event():
    start = datetime(2024, 12, 25)
    end = datetime(2024, 12, 26)

    event = create_event(start, end, False)
    result = event_prepare_data("holiday_calendar", None, event, HOURS)

    assert len(result) == 1
    assert result[0]["calendarId"] == "holiday_calendar"
    assert result[0]["start"]["day"] == 25
    assert result[0]["end"]["day"] == 26


def test_single_day_event():
    start = datetime(2024, 5, 24, 10, 0)
    end = datetime(2024, 5, 24, 11, 0)

    event = create_event(start, end)
    result = event_prepare_data("calendar123", "5", event, HOURS)

    assert len(result) == 1
    assert result[0]["start"]["hour"] == 10
    assert result[0]["end"]["hour"] == 11
    assert result[0]["event_id"] == "event123"
    assert result[0]["colorId"] == "5"


def test_multi_day_event():
    start = datetime(2024, 5, 23, 22, 0)
    end = datetime(2024, 5, 25, 1, 0)

    event = create_event(start, end)
    result = event_prepare_data("calendar123", "5", event, HOURS)

    assert len(result) == 3
    assert result[0]["longEvent"] == True


def test_event_without_datetime():
    start = datetime(2024, 5, 24)
    end = datetime(2024, 5, 25)

    event = create_event(start, end, False)
    result = event_prepare_data("calendar123", "1", event, HOURS)

    # Оскільки повний день, очікуємо тільки один елемент
    assert len(result) == 1
    # Оскільки це повний день, то дата початку і кінця в один день
    assert result[0]["start"]["day"] == 24
    assert result[0]["end"]["day"] == 24
