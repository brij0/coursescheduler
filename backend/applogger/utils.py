import logging

logger = logging.getLogger("app")

def log_info(message, extra=None):
    logger.info(message, extra=extra)

def log_error(message, extra=None):
    logger.error(message, extra=extra)

def log_debug(message, extra=None):
    logger.debug(message, extra=extra)