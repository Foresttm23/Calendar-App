from flask import Blueprint, current_app
from datetime import datetime, timedelta
from db_init import db

db_control = Blueprint("db_control", __name__)


class User(db.Model):
    __tablename__ = "Users"

    Id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Email = db.Column(db.String(100), nullable=False)
    User_created_date = db.Column(db.DateTime, default=datetime.utcnow())

    Logs = db.relationship("Log", backref="user", cascade="all, delete", lazy=True)


class Log(db.Model):
    __tablename__ = "Logs"

    Id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    User_Id = db.Column(
        db.Integer, db.ForeignKey("Users.Id", ondelete="CASCADE"), nullable=False
    )
    Message = db.Column(db.String(1000), nullable=False)
    Log_created_date = db.Column(db.DateTime, default=datetime.utcnow())
