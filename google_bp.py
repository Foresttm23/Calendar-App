from flask_dance.contrib.google import make_google_blueprint

import os

google_bp = make_google_blueprint(
    client_id=os.getenv("CLIENT_ID"),
    client_secret=os.getenv("CLIENT_SECRET"),
    redirect_url="/login",
    scope=[
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/calendar",
        "openid",
    ],
    reprompt_consent=True,
    offline=True,
)
