# Generated by Django 5.2.4 on 2025-07-10 17:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('scheduler', '0008_alter_course_unique_together_course_offered_term_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='dates',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='event',
            name='days',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name='event',
            name='location',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
