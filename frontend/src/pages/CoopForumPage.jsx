import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, ArrowDown, MessageCircle, Send, User, Plus, Loader2, Users, Search } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'
import api from '../contexts/API'

const CoopForumPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPostForm, setShowPostForm] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', job_title: '', organization: '', job_term: '', job_location: '' })
  const [message, setMessage] = useState({ type: '', text: '' })
  // Search state variables
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchTimeoutId, setSearchTimeoutId] = useState(null)

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth?from=' + encodeURIComponent('/coop-forum'))
    }
  }, [user, navigate])

  // Fetch posts
  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const data = await api.fetchPosts()
      console.log("Posts data received:", data)
      
      // Process posts to include user vote information
      const processedPosts = Array.isArray(data) ? data : (data.results || [])
      setPosts(processedPosts)
    } catch (err) {
      console.error("Error fetching posts:", err)
      setError('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  // Voting with optimistic updates
  const handleVote = async (e, postId, value) => {
    e.stopPropagation() // Prevent navigation when voting
    
    if (!user) {
      setMessage({ type: 'error', text: 'Login required to vote.' })
      return
    }

    try {
      const updatedPost = await api.voteOnPost(postId, value)
      
      // Update the post in the appropriate array
      const updatePostInArray = (posts) => posts.map(post => 
        post.id === postId ? updatedPost : post
      )

      if (isSearchMode) {
        setSearchResults(updatePostInArray)
      } else {
        setPosts(updatePostInArray)
      }

    } catch (err) {
      console.error("Error voting:", err)
      setMessage({ type: 'error', text: 'Failed to vote.' })
    }
  }

  // Navigate to post detail page
  const navigateToPost = (postId) => {
    navigate(`/coop-forum/post/${postId}`)
  }

  // Add post
  const handleAddPost = async (e) => {
    e.preventDefault()
    if (!user) {
      setMessage({ type: 'error', text: 'Login required to post.' })
      return
    }
    setLoading(true)
    try {
      const data = await api.createPost(newPost)
      
      setShowPostForm(false)
      setNewPost({ title: '', content: '', job_title: '', organization: '', job_term: '', job_location: '' })
      
      // Navigate to the newly created post
      if (data && data.id) {
        navigate(`/coop-forum/post/${data.id}`)
      } else {
        fetchPosts()
        setMessage({ type: 'success', text: 'Post added!' })
      }
    } catch (err) {
      console.error("Error adding post:", err)
      setMessage({ type: 'error', text: 'Failed to add post.' })
    } finally {
      setLoading(false)
    }
  }

  // Search function
  const handleSearch = async (query) => {
    if (!query.trim()) {
      clearSearch()
      return
    }
    
    setIsSearching(true)
    try {
      const data = await api.searchPosts(query)
      setSearchResults(data.results || [])
      setIsSearchMode(true)
    } catch (err) {
      console.error("Error searching posts:", err)
      setError('Failed to search posts')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchInput = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    
    // Clear previous timeout
    if (searchTimeoutId) {
      clearTimeout(searchTimeoutId)
    }
    
    // Set new timeout for debounced search
    const timeoutId = setTimeout(() => {
      handleSearch(query)
    }, 300) // 300ms delay
    
    setSearchTimeoutId(timeoutId)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setIsSearchMode(false)
  }

  // Determine which posts to display
  const displayPosts = isSearchMode ? searchResults : posts
  const isDisplayingPosts = displayPosts.length > 0

  const renderPost = (post) => (
    <motion.div
      key={post.id}
      className="elegant-card rounded-2xl p-6 flex gap-6 bg-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onClick={() => navigateToPost(post.id)}
    >
      {/* Voting */}
      <div className="flex flex-col items-center justify-start pt-2">
        <button
          className={`transition-colors ${
            post.user_vote === 1 
              ? 'text-green-600' 
              : 'text-neutral-400 hover:text-green-600'
          }`}
          onClick={(e) => handleVote(e, post.id, 1)}
          disabled={!user}
          title="Upvote"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <span className="font-bold text-lg my-1">{post.score || 0}</span>
        <button
          className={`transition-colors ${
            post.user_vote === -1 
              ? 'text-red-600' 
              : 'text-neutral-400 hover:text-red-600'
          }`}
          onClick={(e) => handleVote(e, post.id, -1)}
          disabled={!user}
          title="Downvote"
        >
          <ArrowDown className="w-6 h-6" />
        </button>
      </div>
      {/* Post Content */}
      <div className="flex-1">
        <div className="flex items-center mb-2">
          <User className="w-5 h-5 text-neutral-400 mr-2" />
          <span className="font-semibold text-neutral-700">{post.user?.username || "Anonymous"}</span>
          <span className="mx-2 text-neutral-400">•</span>
          <span className="text-xs text-neutral-500">{post.created_at ? new Date(post.created_at).toLocaleString() : "Unknown date"}</span>
        </div>
        <h2 className="text-xl font-bold text-primary-700 mb-1">{post.title}</h2>
        <p className="text-neutral-700 mb-2 line-clamp-3">{post.content}</p>
        {/* Job Info */}
        {(post.job_title || post.organization || post.job_term || post.job_location) && (
          <div className="mb-2 text-sm text-neutral-500">
            {post.job_title && <span className="font-semibold">{post.job_title}</span>} 
            {post.organization && <span> @ {post.organization}</span>}
            {post.job_term && <span> • {post.job_term}</span>}
            {post.job_location && <span> • {post.job_location}</span>}
          </div>
        )}
        <div 
          className="flex items-center space-x-2 text-primary-600 mt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle className="w-5 h-5" />
          <span>Comments</span>
        </div>
      </div>
    </motion.div>
  )

  // Loading check for user authentication
  if (!user) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F3F9FF' }}>
        <Navbar />
        <div className="pt-32 pb-12 px-4 max-w-4xl mx-auto">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-center">
            <p className="text-blue-800">This page is only available for logged-in students.</p>
            <Link to="/login" className="mt-4 inline-flex items-center text-primary-600 hover:underline">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F9FF' }}>
      <Helmet>
        <title>Co-op Forum | ugflow</title>
        <meta name="description" content="Access co-op job experiences, tips and advice from fellow students. Share your own insights and navigate your co-op journey confidently." />
        <meta name="keywords" content="university co-op, job experiences, internship forum, ugflow" />
        <link rel="canonical" href="https://ugflow.com/coop-forum" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Co-op Forum | ugflow" />
        <meta property="og:description" content="Share and access co-op experiences and advice from fellow university students." />
        <meta property="og:url" content="https://ugflow.com/coop-forum" />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <Navbar />
      <section className="pt-32 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: '#456882' }}>
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold" style={{ color: '#456882' }}>
                Co-op Forum
              </h1>
            </div>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              Share your co-op job experiences, ask questions, and help fellow Gryphons. Upvote helpful posts, comment, and join the conversation!
            </p>
          </motion.div>

          {/* Search bar and new post button */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <form onSubmit={(e) => e.preventDefault()} className="flex-1 w-full">
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-10 pr-12 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:border-transparent transition-all"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={handleSearchInput}
                  style={{ '--tw-ring-color': '#456882' }}
                />
                <Search className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                {isSearchMode && (
                  <button
                    type="button" 
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xl font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            </form>
            
            <motion.button
              onClick={() => setShowPostForm(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-white hover:shadow-lg transition-all duration-300 whitespace-nowrap"
              style={{ backgroundColor: '#456882' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5" />
              <span>New Post</span>
            </motion.button>
          </div>
          
          <AnimatePresence>
            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto text-current hover:opacity-70">×</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Posts List */}
          <div className="space-y-8">
            {isSearching ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : error ? (
              <div className="text-center text-red-600">{error}</div>
            ) : isSearchMode ? (
              <>
                <div className="text-sm text-neutral-500 mb-4">
                  Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                </div>
                {searchResults.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500">
                    No results found for "{searchQuery}"
                  </div>
                ) : (
                  searchResults.map(renderPost)
                )}
              </>
            ) : loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">No posts yet. Be the first to share!</div>
            ) : (
              posts.map(renderPost)
            )}
          </div>

          {/* Post Form Modal */}
          <AnimatePresence>
            {showPostForm && (
              <motion.div
                className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPostForm(false)}
              >
                <motion.form
                  className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 border border-neutral-200"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={e => e.stopPropagation()}
                  onSubmit={handleAddPost}
                >
                  <h2 className="text-2xl font-bold mb-6" style={{ color: '#456882' }}>Create New Post</h2>
                  <input
                    type="text"
                    className="w-full mb-4 px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                    style={{ '--tw-ring-color': '#456882' }}
                    placeholder="Title"
                    value={newPost.title}
                    onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                    required
                  />
                  <textarea
                    className="w-full mb-4 px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:border-transparent transition-all resize-none"
                    style={{ '--tw-ring-color': '#456882' }}
                    placeholder="Share your experience or question..."
                    rows={4}
                    value={newPost.content}
                    onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                    required
                  />
                  {/* Optional job info */}
                  <input
                    type="text"
                    className="w-full mb-2 px-4 py-2 border border-neutral-200 rounded-lg"
                    placeholder="Job Title (optional)"
                    value={newPost.job_title}
                    onChange={e => setNewPost({ ...newPost, job_title: e.target.value })}
                  />
                  <input
                    type="text"
                    className="w-full mb-2 px-4 py-2 border border-neutral-200 rounded-lg"
                    placeholder="Organization (optional)"
                    value={newPost.organization}
                    onChange={e => setNewPost({ ...newPost, organization: e.target.value })}
                  />
                  <input
                    type="text"
                    className="w-full mb-2 px-4 py-2 border border-neutral-200 rounded-lg"
                    placeholder="Term (e.g. Fall 2024)"
                    value={newPost.job_term}
                    onChange={e => setNewPost({ ...newPost, job_term: e.target.value })}
                  />
                  <input
                    type="text"
                    className="w-full mb-4 px-4 py-2 border border-neutral-200 rounded-lg"
                    placeholder="Location (optional)"
                    value={newPost.job_location}
                    onChange={e => setNewPost({ ...newPost, job_location: e.target.value })}
                  />
                  <motion.button
                    type="submit"
                    className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:bg-primary-600 hover:shadow-lg transition-all duration-300"
                    style={{ backgroundColor: '#456882' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    <span>{loading ? 'Posting...' : 'Post'}</span>
                  </motion.button>
                </motion.form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  )
}

export default CoopForumPage