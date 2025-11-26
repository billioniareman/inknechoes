import markdown
try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except OSError:
    WEASYPRINT_AVAILABLE = False
    print("Warning: WeasyPrint not available. PDF export will be disabled.")
from ebooklib import epub
import io
import os
from app.models.post import Post
from app.models.user import User
from datetime import datetime

def generate_pdf(post: Post, content: dict, author: User) -> bytes:
    """
    Generate PDF from post content using WeasyPrint.
    """
    if not WEASYPRINT_AVAILABLE:
        raise RuntimeError(
            "PDF export is currently unavailable. Server is missing required dependencies (GTK3). "
            "Please install GTK3 runtime or use a different export format."
        )

    # Convert markdown body to HTML
    html_body = markdown.markdown(content.body)
    
    # Create HTML structure
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>{post.title}</title>
        <style>
            @page {{
                margin: 2cm;
                @bottom-center {{
                    content: counter(page);
                }}
            }}
            body {{
                font-family: 'Georgia', serif;
                line-height: 1.6;
                color: #333;
            }}
            h1 {{
                text-align: center;
                color: #2c3e50;
                margin-bottom: 0.5em;
            }}
            .meta {{
                text-align: center;
                color: #7f8c8d;
                margin-bottom: 2em;
                font-style: italic;
            }}
            .content {{
                text-align: justify;
            }}
            img {{
                max-width: 100%;
                height: auto;
                display: block;
                margin: 1em auto;
            }}
        </style>
    </head>
    <body>
        <h1>{post.title}</h1>
        <div class="meta">
            By {author.username}<br>
            Published on {post.created_at.strftime('%B %d, %Y')}
        </div>
        <div class="content">
            {html_body}
        </div>
    </body>
    </html>
    """
    
    # Generate PDF
    pdf_file = io.BytesIO()
    HTML(string=html_content).write_pdf(pdf_file)
    pdf_file.seek(0)
    return pdf_file.getvalue()

def generate_epub(post: Post, content: dict, author: User) -> bytes:
    """
    Generate EPUB from post content using EbookLib.
    """
    book = epub.EpubBook()

    # Set metadata
    book.set_identifier(f'inknechoes-{post.slug}')
    book.set_title(post.title)
    book.set_language('en')
    book.add_author(author.username)
    
    # Create chapters
    # For now, treat the whole body as one chapter, or split if it's a book
    # If content_type is 'book', we might want to split by chapters if we had them structure
    # But currently the body is just one big string or we fetch chapters separately?
    # The current Post model has 'chapters' relationship but content is in MongoDB.
    # If it's a book, we should probably fetch all chapters.
    # For simplicity, let's just use the main body for now.
    
    html_body = markdown.markdown(content.body)
    
    c1 = epub.EpubHtml(title='Content', file_name='content.xhtml', lang='en')
    c1.content = f'<h1>{post.title}</h1>{html_body}'
    
    book.add_item(c1)

    # Add default NCX and Nav
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())

    # Define CSS style
    style = 'body { font-family: Times, serif; }'
    nav_css = epub.EpubItem(uid="style_nav", file_name="style/nav.css", media_type="text/css", content=style)
    book.add_item(nav_css)

    # Basic spine
    book.spine = ['nav', c1]

    # Write to buffer
    buffer = io.BytesIO()
    epub.write_epub(buffer, book, {})
    buffer.seek(0)
    return buffer.getvalue()
