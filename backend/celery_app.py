# import gevent.monkey
# gevent.monkey.patch_all()

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "coursescheduler.settings")

from coursescheduler.celery import app
from celery import Celery
from celery.schedules import crontab
from metrics.tasks import calculate_and_store_metrics

app = Celery('coursescheduler')

# Periodic task to calculate metrics every 5 minutes
app.conf.beat_schedule = {
    'calculate-metrics-every-5-minutes': {
        'task': 'metrics.tasks.calculate_and_store_metrics',
        'schedule': crontab(minute='*/5'),
    },
}

__all__ = ['app']