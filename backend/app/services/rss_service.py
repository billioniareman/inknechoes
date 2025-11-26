import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List
from app.models.post import Post
from app.models.user import User
from app.config import get_settings
import email.utils

settings = get_settings()
BASE_URL = "http://localhost:3000"  # Should ideally come from settings

def format_rfc822_date(dt: datetime) -> str:
    """Format datetime to RFC 822 (standard for RSS)"""
    return email.utils.format_datetime(dt)

def generate_rss_feed(
    title: str,
    link: str,
    description: str,
    posts: List[Post],
    users_map: dict = None
) -> str:
    """
    Generate RSS 2.0 XML string from a list of posts.
    """
    rss = ET.Element("rss", version="2.0")
    channel = ET.SubElement(rss, "channel")

    ET.SubElement(channel, "title").text = title
    ET.SubElement(channel, "link").text = link
    ET.SubElement(channel, "description").text = description
    ET.SubElement(channel, "language").text = "en-us"
    ET.SubElement(channel, "lastBuildDate").text = format_rfc822_date(datetime.utcnow())
    ET.SubElement(channel, "generator").text = "Ink&Echoes RSS Generator"

    for post in posts:
        item = ET.SubElement(channel, "item")
        ET.SubElement(item, "title").text = post.title
        
        # Link to the post
        post_link = f"{BASE_URL}/post/{post.slug}"
        ET.SubElement(item, "link").text = post_link
        ET.SubElement(item, "guid", isPermaLink="true").text = post_link
        
        # Author
        if users_map and post.author_id in users_map:
            author_name = users_map[post.author_id].username
            ET.SubElement(item, "author").text = f"noreply@inknechoes.com ({author_name})"
        
        # PubDate
        if post.created_at:
            ET.SubElement(item, "pubDate").text = format_rfc822_date(post.created_at)
            
        # Description (using title for now, ideally fetch summary)
        # Note: Fetching full content for every item in RSS might be heavy if we have many items.
        # We'll use a placeholder or the title as description if content isn't available.
        # If we want rich content, we'd need to fetch from MongoDB.
        # For now, let's keep it lightweight.
        ET.SubElement(item, "description").text = f"{post.title} - A {post.content_type} on Ink&Echoes"

    return ET.tostring(rss, encoding="unicode", method="xml")
