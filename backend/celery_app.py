import gevent.monkey
gevent.monkey.patch_all()

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "coursescheduler.settings")

from coursescheduler.celery import app

__all__ = ['app']