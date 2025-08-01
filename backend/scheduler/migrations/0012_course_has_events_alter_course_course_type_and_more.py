# Generated by Django 5.2.4 on 2025-08-01 15:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('scheduler', '0011_alter_courseevent_days_alter_courseevent_location_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='has_events',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AlterField(
            model_name='course',
            name='course_type',
            field=models.CharField(db_index=True, max_length=20),
        ),
        migrations.AlterField(
            model_name='course',
            name='offered_term',
            field=models.CharField(blank=True, db_index=True, max_length=20, null=True),
        ),
        migrations.AddIndex(
            model_name='course',
            index=models.Index(fields=['offered_term', 'has_events'], name='courses_offered_08a0c2_idx'),
        ),
        migrations.AddIndex(
            model_name='course',
            index=models.Index(fields=['offered_term', 'course_type', 'has_events'], name='courses_offered_a3b71c_idx'),
        ),
    ]
