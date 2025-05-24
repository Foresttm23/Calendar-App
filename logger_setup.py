import logging
import sys


def logger_setup(app):
    root = logging.getLogger()
    log_level = logging.INFO
    root.setLevel(log_level)
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(log_level)
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    handler.setFormatter(formatter)
    app.logger.setLevel(log_level)
