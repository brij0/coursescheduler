from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models import Sum
from mptt.models import MPTTModel, TreeForeignKey
from django.contrib.contenttypes.fields import GenericRelation, GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import User
import uuid
from datetime import timedelta


class TimeStampedModel(models.Model):
    """
    Abstract base class providing self-managed "created_at" and "updated_at" timestamps.
    """
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Post(TimeStampedModel):
    """
    Primary discussion post. Students create posts to start new topics or threads.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posts',
        help_text='Author of the post'
    )
    title = models.CharField(
        max_length=255,
        help_text='Headline or summary of the post'
    )
    content = models.TextField(
        help_text='Body content of the post'
    )
    is_deleted = models.BooleanField(
        default=False,
        help_text='Soft delete flag'
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Timestamp when post was deleted'
    )
    # Generic votes relation
    votes = GenericRelation(
        'Vote',
        content_type_field='content_type',
        object_id_field='object_id',
        related_query_name='post'
    )
    major = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text='Student major or field of study'
    )
    job_id = models.CharField(
        unique=True,
        max_length=100,
        null=True,
        blank=True,)
    job_term = models.CharField(
        max_length=100,
        null=True,
        blank=True,)
    job_title = models.CharField(
        max_length=255,
        null=True,
        blank=True,)
    organization = models.CharField(
        max_length=255,
        null=True,
        blank=True,)
    job_location = models.CharField(
        max_length=255,
        null=True,
        blank=True,)
    class Meta:
        db_table = 'discussion_post'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]
        verbose_name = 'Post'
        verbose_name_plural = 'Posts'

    def delete(self, using=None, keep_parents=False):
        """
        Soft delete: flag post as deleted without removing data.
        """
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])

    @property
    def score(self):
        """
        Calculate net score from related votes.
        """
        result = self.votes.aggregate(score=Sum('value'))['score']
        return result or 1

    def __str__(self):
        return f"Post(id={self.pk}, title={self.title!r}, score={self.score})"


class Comment(MPTTModel, TimeStampedModel):
    """
    Represents a nested comment/reply under a Post.
    Uses django-mptt for tree structure.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments',
        help_text='Author of the comment'
    )
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments',
        help_text='Parent post of this comment'
    )
    content = models.TextField(
        help_text='Text content of the comment'
    )
    parent = TreeForeignKey(
        'self',
        null=True,
        blank=True,
        related_name='children',
        on_delete=models.CASCADE,
        help_text='Parent comment for nested replies'
    )
    is_deleted = models.BooleanField(
        default=False,
        help_text='Soft delete flag'
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Timestamp when comment was deleted'
    )
    votes = GenericRelation(
        'Vote',
        content_type_field='content_type',
        object_id_field='object_id',
        related_query_name='comment'
    )

    class MPTTMeta:
        order_insertion_by = ['created_at']

    class Meta:
        db_table = 'discussion_comment'
        ordering = ['tree_id', 'lft']
        indexes = [
            models.Index(fields=['post', 'parent']),
            models.Index(fields=['user', 'created_at']),
        ]
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'

    def delete(self, using=None, keep_parents=False):
        """
        Soft delete: flag comment as deleted without pruning tree.
        """
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])

    @property
    def score(self):
        """
        Net score from related votes.
        """
        result = self.votes.aggregate(score=Sum('value'))['score']
        return result or 1

    def __str__(self):
        return f"Comment(id={self.pk}, post_id={self.post_id}, score={self.score})"


class Vote(TimeStampedModel):
    """
    Generic vote model that applies to both Posts and Comments.
    Uses Django ContentTypes to relate to any votable object.
    """
    UPVOTE = 1
    DOWNVOTE = -1
    VALUE_CHOICES = (
        (UPVOTE, 'Upvote'),
        (DOWNVOTE, 'Downvote'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='votes',
        help_text='User casting the vote'
    )
    # Generic foreign key to either Post or Comment
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        help_text='Content type of the voted object'
    )
    object_id = models.PositiveIntegerField(
        help_text='Primary key of the voted object'
    )
    content_object = GenericForeignKey('content_type', 'object_id')
    value = models.SmallIntegerField(
        choices=VALUE_CHOICES,
        help_text='+1 for upvote, -1 for downvote'
    )

    class Meta:
        db_table = 'discussion_vote'
        unique_together = ('user', 'content_type', 'object_id')
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['content_type', 'object_id']),
        ]
        verbose_name = 'Vote'
        verbose_name_plural = 'Votes'

    def __str__(self):
        action = 'Upvote' if self.value == self.UPVOTE else 'Downvote'
        return f"{action} by {self.user} on {self.content_type.model}(id={self.object_id})"

class EmailVerificationToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    
    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(hours=24)
    def __str__(self):
        return f"Token for {self.user.username}"