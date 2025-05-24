from flask import Flask, render_template, session
from flask_assets import Environment
import os

from assets import js, css
from google_bp import google_bp
from events_control import events_control

# from webhook import webhook_control
from google_auth import google_auth_control

# from ping import ping_control
from logger_setup import logger_setup
from db_setup import db_control
from db_log_utils import db_log_control
from db_init import db, init_db

from dotenv import load_dotenv
import os

load_dotenv()


#
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
#
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")
#
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("POSTGRESQL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = os.getenv(
    "SQLALCHEMY_TRACK_MODIFICATIONS"
)

init_db(app)


#
logger_setup(app)
#
assets = Environment(app)
assets.register("js_all", js)
assets.register("css_all", css)
#
app.register_blueprint(events_control)
app.register_blueprint(google_bp, url_prefix="/login")
# app.register_blueprint(webhook_control)
app.register_blueprint(google_auth_control)
# app.register_blueprint(ping_control)
app.register_blueprint(db_control)
app.register_blueprint(db_log_control)

with app.app_context():
    db.create_all()


@app.route("/")
def index():
    user = session.get("user_info")
    return render_template("import.html", user=user)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
