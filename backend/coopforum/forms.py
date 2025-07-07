from django import forms
from .models import Post, Comment

# Used for admin or server-side rendering (not used by API frontend)
class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ['title', 'content']


class CommentForm(forms.ModelForm):
    # parent field comes from hidden input (for replies)
    parent = forms.IntegerField(widget=forms.HiddenInput(), required=False)

    class Meta:
        model = Comment
        fields = ['content']