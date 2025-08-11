import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "coursescheduler.settings")

app = Celery("coursescheduler")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'calculate-metrics-every-5-minutes': {
        'task': 'metrics.tasks.calculate_and_store_metrics',
        'schedule': crontab(minute='*/5'),
    },
}