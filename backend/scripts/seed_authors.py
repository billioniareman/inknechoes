"""
Database Seeding Script for Ink&Echoes
Creates realistic literary authors, published works, and co-authoring setups.
"""
import sys
import os
import asyncio
from datetime import datetime, timezone

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database.postgres import SessionLocal, engine, Base
from app.database.mongo import connect_to_mongo, get_mongo_db
from app.models.user import User
from app.models.post import Post
from app.models.chapter import Chapter
from app.models.collaborative_book import CollaborativeBook
from app.models.notification import Notification
from app.models.follower import followers
from app.services.auth_service import get_password_hash


USERS_SPEC = [
    # --- ACTIVE AUTHORS ---
    {
        "username": "elena_vance",
        "email": "elena@inknechoes.com",
        "bio": "Novelist exploring forgotten shorelines, occult architectures, and psychological labyrinths. Currently co-authoring 'Echoes of the Obsidian Shore' with Marcus Thorne.",
        "genre_tags": "fiction,gothic,mystery,dark-fantasy",
        "is_admin": False,
        "avatar_color": "#ec4899",
    },
    {
        "username": "marcus_thorne",
        "email": "marcus@inknechoes.com",
        "bio": "Cultural essayist, antiquarian scholar, and co-author. Fascinated by forgotten maritime manuscripts and linguistic decay.",
        "genre_tags": "essays,history,literary,dark-fantasy",
        "is_admin": False,
        "avatar_color": "#2563eb",
    },
    {
        "username": "clara_oswald",
        "email": "clara@inknechoes.com",
        "bio": "Poet laureate of fleeting mornings and autumn rain. Words poured between dusk and the first toll of morning bells.",
        "genre_tags": "poetry,lyric,nature,sonnets",
        "is_admin": False,
        "avatar_color": "#10b981",
    },
    {
        "username": "julian_reed",
        "email": "julian@inknechoes.com",
        "bio": "Speculative fiction writer and astrophysicist. Building worlds at the edge of known physics and orbital mechanics.",
        "genre_tags": "sci-fi,speculative,cyberpunk,cosmology",
        "is_admin": False,
        "avatar_color": "#8b5cf6",
    },
    {
        "username": "maya_lin",
        "email": "maya@inknechoes.com",
        "bio": "Wanderer with a fountain pen. Chronicling solitary journeys and quiet teahouses from Kyoto to Lisbon.",
        "genre_tags": "memoir,travel,journal,philosophy",
        "is_admin": False,
        "avatar_color": "#f59e0b",
    },
    # --- COMMUNITY USERS & READERS ---
    {
        "username": "arthur_pendleton",
        "email": "arthur@inknechoes.com",
        "bio": "Avid collector of rare folios and literary periodicals.",
        "genre_tags": "history,classics,fiction",
        "is_admin": False,
    },
    {
        "username": "beatrice_faye",
        "email": "beatrice@inknechoes.com",
        "bio": "Poetry critic and evening reader.",
        "genre_tags": "poetry,modernism",
        "is_admin": False,
    },
    {
        "username": "liam_novak",
        "email": "liam@inknechoes.com",
        "bio": "Hard sci-fi aficionado and tech reviewer.",
        "genre_tags": "sci-fi,futurism",
        "is_admin": False,
    },
    {
        "username": "zoe_kravitz",
        "email": "zoe@inknechoes.com",
        "bio": "Comparative literature student researching gothic romanticism.",
        "genre_tags": "gothic,literary,philosophy",
        "is_admin": False,
    },
    {
        "username": "david_hume",
        "email": "david@inknechoes.com",
        "bio": "Student of reason and the human understanding.",
        "genre_tags": "philosophy,essays",
        "is_admin": False,
    },
    {
        "username": "charlotte_bronte",
        "email": "charlotte@inknechoes.com",
        "bio": "Admirer of atmospheric moorland literature.",
        "genre_tags": "victorian,classics,fiction",
        "is_admin": False,
    },
    {
        "username": "gabriel_garcia",
        "email": "gabriel@inknechoes.com",
        "bio": "Searching for magic in every coastal village.",
        "genre_tags": "magical-realism,fiction",
        "is_admin": False,
    },
    # --- SYSTEM ADMIN ---
    {
        "username": "admin",
        "email": "admin@inknechoes.com",
        "bio": "Platform Administrator of Ink&Echoes.",
        "genre_tags": "platform,curation",
        "is_admin": True,
    },
]


async def seed():
    print("[INFO] Initializing tables...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        await connect_to_mongo()
    except Exception as e:
        print(f"[WARN] Mongo connection note: {e}")
    mongo_db = get_mongo_db()

    print("[INFO] Seeding users...")
    user_map = {}
    default_password_hash = get_password_hash("password123")

    for u in USERS_SPEC:
        existing = db.query(User).filter(User.username == u["username"]).first()
        if not existing:
            user = User(
                username=u["username"],
                email=u["email"],
                hashed_password=default_password_hash,
                bio=u["bio"],
                genre_tags=u["genre_tags"],
                is_active=True,
                is_admin=u.get("is_admin", False),
                email_verified=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"  + Created user: {user.username} ({user.email})")
            user_map[user.username] = user
        else:
            # Ensure email is verified and active
            existing.email_verified = True
            existing.is_active = True
            db.commit()
            user_map[existing.username] = existing
            print(f"  = Found user: {existing.username}")

    elena = user_map["elena_vance"]
    marcus = user_map["marcus_thorne"]
    clara = user_map["clara_oswald"]
    julian = user_map["julian_reed"]
    maya = user_map["maya_lin"]

    # --- SEED COLLABORATIVE BOOK ---
    collab_book_slug = "echoes-of-the-obsidian-shore"
    book_post = db.query(Post).filter(Post.slug == collab_book_slug).first()

    if not book_post:
        # Create MongoDB post content
        book_doc = {
            "body": "<p>A collaborative gothic mystery by <strong>Elena Vance</strong> and <strong>Marcus Thorne</strong>. Set along the desolate salt-flats of North Umber, where the tide recedes to reveal architectures not made by human hands.</p>",
            "tags": ["gothic", "co-author", "mystery", "obsidian-shore", "dark-fantasy"],
            "description": "A gothic mystery exploring forgotten coastal monoliths and shifting tides, written in collaboration between Elena Vance and Marcus Thorne.",
            "cover_image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        res = await mongo_db.posts.insert_one(book_doc)
        book_mongo_id = str(res.inserted_id)

        book_post = Post(
            author_id=elena.id,
            title="Echoes of the Obsidian Shore",
            slug=collab_book_slug,
            mongo_id=book_mongo_id,
            visibility="public",
            content_type="book",
            likes_count=42,
            claps_count=88,
        )
        db.add(book_post)
        db.commit()
        db.refresh(book_post)
        print(f"  + Created Collaborative Book: {book_post.title} (ID: {book_post.id})")
    else:
        print(f"  = Found Collaborative Book: {book_post.title} (ID: {book_post.id})")

    # --- SEED CHAPTERS FOR COLLABORATIVE BOOK ---
    chapters_spec = [
        {
            "order": 1,
            "title": "Chapter 1: The Lighthouse at Low Tide",
            "body": """<h2>Chapter 1: The Lighthouse at Low Tide</h2>
<p>The fog had rolled in off the basalt shelf long before dusk, thick with the brine of dying kelp. From the kitchen window of the keeper's cottage, Elena watched the beacon's lens revolve on its brass raceway, casting periodic sweeps of pale emerald across the wet sand.</p>
<p><em>"There is a second lantern beneath the water,"</em> Marcus had written in the margins of his field journal two winters ago. At the time, she had dismissed it as the romantic excess of an antiquarian unused to maritime isolation. Now, with the tide pulling back farther than the lunar tables predicted, the jagged spine of the reef had broken the surface.</p>
<p>And beneath the reef, something pulsed.</p>
<p>She tightened her oilskin coat, took the brass storm lantern, and descended the iron rungs bolted into the cliffside.</p>"""
        },
        {
            "order": 2,
            "title": "Chapter 2: Whispers in the Brine",
            "body": """<h2>Chapter 2: Whispers in the Brine</h2>
<p>Marcus joined the survey at dawn. His tweed coat was damp from the spray, and his spectacles fogged continuously against the biting sea mist.</p>
<p>"You shouldn't have gone down alone," he said, setting his brass surveyor's quadrant upon the basalt boulder. "The subterranean currents here aren't governed by the moon. Look at the sediment patterns."</p>
<p>He pointed to the concentric ridges of black sand radiating outward from the mouth of the sea cave. They weren't tidal ripples; they were acoustic dampeners, carved into the stone floor with geometric precision centuries before the lighthouse was even conceived.</p>
<p>"Listen," Elena whispered, holding up a gloved hand.</p>
<p>From the depths of the shaft came a low, rhythmic vibration—like air being forced through a sunken pipe organ.</p>"""
        },
        {
            "order": 3,
            "title": "Chapter 3: The Cartographer's Compass",
            "body": """<h2>Chapter 3: The Cartographer's Compass</h2>
<p>By midday, the tide should have reclaimed the reef. It did not.</p>
<p>The ocean remained suspended at the horizon like a held breath, exposing terraces of dark slate inscribed with archaic navigational glyphs. Marcus knelt beside a circular indentation, tracing the petroglyph with charcoal paper.</p>
<p>"This isn't a chart of the North Sea," he murmured, his voice tightening. "It's a polar projection of an ocean that dried up before the ice age. And this symbol here—the inverted trident—marks where we are standing."</p>"""
        }
    ]

    seeded_chapters = []
    for ch_spec in chapters_spec:
        ch = db.query(Chapter).filter(Chapter.post_id == book_post.id, Chapter.order == ch_spec["order"]).first()
        if not ch:
            ch_doc = {
                "body": ch_spec["body"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            res = await mongo_db.chapters.insert_one(ch_doc)
            ch = Chapter(
                post_id=book_post.id,
                title=ch_spec["title"],
                order=ch_spec["order"],
                mongo_id=str(res.inserted_id)
            )
            db.add(ch)
            db.commit()
            db.refresh(ch)
            print(f"    + Created Chapter {ch.order}: {ch.title} (ID: {ch.id})")
        else:
            print(f"    = Found Chapter {ch.order}: {ch.title} (ID: {ch.id})")
        seeded_chapters.append(ch)

    # --- SEED COLLABORATIVE_BOOKS RECORDS ---
    # Book-level collaboration
    book_collab = db.query(CollaborativeBook).filter(
        CollaborativeBook.book_id == book_post.id,
        CollaborativeBook.chapter_id.is_(None)
    ).first()

    collab_members = [
        {"user_id": elena.id, "role": "owner", "display_name": "Elena Vance", "color": "#ec4899"},
        {"user_id": marcus.id, "role": "editor", "display_name": "Marcus Thorne", "color": "#2563eb"}
    ]

    if not book_collab:
        book_collab = CollaborativeBook(
            book_id=book_post.id,
            chapter_id=None,
            title=book_post.title,
            owner_id=elena.id,
            collaborators=collab_members,
            permissions={"edit": True, "comment": True},
            is_active=True
        )
        db.add(book_collab)
        db.commit()
        db.refresh(book_collab)
        print(f"  + Configured Book-level Collaboration (Collab ID: {book_collab.id})")
    else:
        book_collab.collaborators = collab_members
        db.commit()
        print(f"  = Updated Book-level Collaboration (Collab ID: {book_collab.id})")

    # Chapter-level collaborations for chapters 1 and 2
    for ch in seeded_chapters[:2]:
        ch_collab = db.query(CollaborativeBook).filter(
            CollaborativeBook.book_id == book_post.id,
            CollaborativeBook.chapter_id == ch.id
        ).first()
        if not ch_collab:
            ch_collab = CollaborativeBook(
                book_id=book_post.id,
                chapter_id=ch.id,
                title=f"{book_post.title} - {ch.title}",
                owner_id=elena.id,
                collaborators=collab_members,
                permissions={"edit": True, "comment": True},
                is_active=True
            )
            db.add(ch_collab)
            db.commit()
            print(f"  + Configured Chapter Collaboration for Chapter {ch.order} (ID: {ch_collab.id})")

    # --- SEED INVITATION NOTIFICATION FOR MARCUS ---
    notif = db.query(Notification).filter(
        Notification.recipient_id == marcus.id,
        Notification.actor_id == elena.id,
        Notification.notification_type == "collaboration_invite"
    ).first()
    if not notif:
        notif = Notification(
            recipient_id=marcus.id,
            actor_id=elena.id,
            notification_type="collaboration_invite",
            post_id=str(book_post.id),
            message=f"Elena Vance invited you to collaborate on '{book_post.title}' as an editor.",
            is_read=False,
            is_archived=False,
        )
        db.add(notif)
        db.commit()
        print(f"  + Added invitation notification for Marcus Thorne")

    # --- SEED WORKS FOR OTHER AUTHORS ---
    other_works = [
        # Elena Vance - Essay & Poem
        {
            "author": elena,
            "title": "The Architecture of Solitude",
            "slug": "the-architecture-of-solitude",
            "content_type": "article",
            "tags": ["solitude", "writing", "gothic", "essay"],
            "description": "A reflection on the spatial psychology of ancient dwellings and why writers seek out rooms that overlook gray horizons.",
            "cover_image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
            "body": """<h2>The Architecture of Solitude</h2>
<p>A writer's desk is never merely furniture; it is an orientation toward the world. In the tall stone houses of the coast, desks were historically placed not toward the sea—which was deemed too violent a distraction—but toward the high slate mantlepiece or the whitewashed corner wall.</p>
<p>To write requires a deliberate constriction of the visual field until the interior room expands to swallow the daylight. We do not write because the world is too small; we write because the world is overwhelmingly full, and silence must be carved out with chisel and pen.</p>"""
        },
        {
            "author": elena,
            "title": "Lanterns on the Shoal",
            "slug": "lanterns-on-the-shoal",
            "content_type": "poetry",
            "tags": ["poetry", "sea", "lanterns", "night"],
            "description": "Verses on the beacons lit during storm tides along the Obsidian shore.",
            "cover_image_url": "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=80",
            "body": """<p><em>The oil is cold within the glass,</em><br>
<em>The iron rusted through;</em><br>
<em>Yet every seventh swell will pass</em><br>
<em>A spark of phosphor blue.</em></p>
<br>
<p><em>Stand watch upon the granite sill,</em><br>
<em>Count breakers nine and ten;</em><br>
<em>The ships that drowned against our hill</em><br>
<em>Will never steer again.</em></p>"""
        },
        # Marcus Thorne - Literary Essay & Journal
        {
            "author": marcus,
            "title": "Ink, Vellum, and Dust: The Survival of Lost Texts",
            "slug": "ink-vellum-and-dust",
            "content_type": "article",
            "tags": ["history", "manuscripts", "books", "scholarship"],
            "description": "How iron-gall ink and cured calfskin preserved the thoughts of antiquity through fire, shipwreck, and the neglect of monastery vaults.",
            "cover_image_url": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80",
            "body": """<h2>Ink, Vellum, and Dust</h2>
<p>The permanence of modern digital storage is an optical illusion. Magnetic media degrades in decades; cloud servers depend on continuous electric currents. Yet open an eighth-century palimpsest stored in dry cellar air, and the oak-gall ink remains as dark and sharp as the hour the monk lifted his quill.</p>
<p>There is a profound humility in studying parchment. You realize that our ancestors built vessels of thought designed to endure centuries of indifference.</p>"""
        },
        {
            "author": marcus,
            "title": "Notes from the Maritime Archive: Entry #412",
            "slug": "notes-from-the-maritime-archive-412",
            "content_type": "article",
            "tags": ["journal", "maritime", "research", "archive"],
            "description": "Field notes documenting anomalous soundings recorded by lighthouse keepers in 1884.",
            "cover_image_url": "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80",
            "body": """<h2>Field Log: October 14</h2>
<p>Found a cross-referenced sounding log in the Admiralty Annex. The keeper at St. Jude's Shoal noted three consecutive nights where the sounding lead dropped past sixty fathoms without striking bottom—in water that had been charted at twelve fathoms since 1740.</p>
<p>His handwriting deteriorated across the three entries. By the fourth, the ledger was signed by his relief.</p>"""
        },
        # Clara Oswald - Poems & Reflections
        {
            "author": clara,
            "title": "Constellations of the Autumn Mist",
            "slug": "constellations-of-the-autumn-mist",
            "content_type": "poetry",
            "tags": ["poetry", "lyric", "autumn", "stars"],
            "description": "A lyrical sequence on autumn leaves, morning fog, and the geometry of constellations obscured by mist.",
            "cover_image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
            "body": """<p><em>The birch leaves fall in quiet gold,</em><br>
<em>Like pennies scattered on the clay;</em><br>
<em>The stories that we left untold</em><br>
<em>Dissolve into the gray.</em></p>
<br>
<p><em>Look up: Orion wears a shroud</em><br>
<em>Of cedar smoke and river haze;</em><br>
<em>A hunter trapped beneath the cloud,</em><br>
<em>Remembering warmer days.</em></p>"""
        },
        {
            "author": clara,
            "title": "On Rhyme and Silence: A Craftsman's Notebook",
            "slug": "on-rhyme-and-silence",
            "content_type": "article",
            "tags": ["craft", "poetry", "poetics", "journal"],
            "description": "Notes on why the white space at the end of a line matters more than the syllable before it.",
            "cover_image_url": "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
            "body": """<h2>The Weight of the Pause</h2>
<p>Amateur poets obsess over meter; mature poets obsess over breath. When a line breaks, it is not merely typographical styling—it is a physical instruction to the reader's lungs. You are choreographing their heartbeat across your cadence.</p>"""
        },
        # Julian Reed - Sci-Fi Book
        {
            "author": julian,
            "title": "The Dyson Horizon",
            "slug": "the-dyson-horizon",
            "content_type": "book",
            "tags": ["sci-fi", "space", "astrophysics", "megastructures"],
            "description": "Hard sci-fi novel chronicling the construction of the solar collector ring around Trappist-1.",
            "cover_image_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
            "body": """<p>A novel of orbital engineering, telemetry signals, and the crew living within the shadow of a Dyson swarm reflector.</p>"""
        },
        # Maya Lin - Travel Memoir
        {
            "author": maya,
            "title": "Steeped in Kyoto: Three Winters in the Bamboo Groves",
            "slug": "steeped-in-kyoto",
            "content_type": "article",
            "tags": ["travel", "memoir", "kyoto", "japan", "journal"],
            "description": "Memoir of quiet mornings listening to snow melt on bamboo tiles in northern Kyoto.",
            "cover_image_url": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
            "body": """<h2>The Sound of Charcoal</h2>
<p>In the tea house near Mount Hiei, morning begins not with speech, but with the clink of bamboo tongs against dried cherry charcoal. The kettle takes forty minutes to heat. In that forty minutes, nothing is expected of you except to exist alongside the steam.</p>
<p>Coming from cities that run on the tyranny of the second-hand, that morning taught me how to measure time by temperature instead of clocks.</p>"""
        }
    ]

    for work in other_works:
        existing = db.query(Post).filter(Post.slug == work["slug"]).first()
        if not existing:
            doc = {
                "body": work["body"],
                "tags": work["tags"],
                "description": work["description"],
                "cover_image_url": work["cover_image_url"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            res = await mongo_db.posts.insert_one(doc)
            post = Post(
                author_id=work["author"].id,
                title=work["title"],
                slug=work["slug"],
                mongo_id=str(res.inserted_id),
                visibility="public",
                content_type=work["content_type"],
                likes_count=18,
                claps_count=35,
            )
            db.add(post)
            db.commit()
            db.refresh(post)
            print(f"  + Created Post by {work['author'].username}: {post.title}")

            # If Julian's book, seed a chapter
            if work["content_type"] == "book":
                ch_doc = {
                    "body": "<h3>Sector 4 Orbital Alignment</h3><p>Telemetry confirmed the third solar sail had unfurled to its full 800-kilometer diameter. Solar pressure pushed against the carbon-nanotube rigging with the force of a gentle whisper across deep vacuum.</p>",
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
                res = await mongo_db.chapters.insert_one(ch_doc)
                j_ch = Chapter(
                    post_id=post.id,
                    title="Chapter 1: The First Sail",
                    order=1,
                    mongo_id=str(res.inserted_id)
                )
                db.add(j_ch)
                db.commit()
                print(f"    + Created chapter for {post.title}")
        else:
            print(f"  = Found Post: {existing.title}")

    # --- SEED FOLLOWER CONNECTIONS ---
    print("[INFO] Seeding social follows...")
    follow_pairs = [
        ("marcus_thorne", "elena_vance"),
        ("elena_vance", "marcus_thorne"),
        ("arthur_pendleton", "elena_vance"),
        ("beatrice_faye", "clara_oswald"),
        ("liam_novak", "julian_reed"),
        ("zoe_kravitz", "elena_vance"),
        ("david_hume", "marcus_thorne"),
        ("gabriel_garcia", "maya_lin"),
        ("charlotte_bronte", "elena_vance"),
    ]

    for follower_name, followed_name in follow_pairs:
        u_follower = user_map.get(follower_name)
        u_followed = user_map.get(followed_name)
        if u_follower and u_followed:
            try:
                from sqlalchemy import select
                stmt = select(followers).where(
                    followers.c.follower_id == u_follower.id,
                    followers.c.followed_id == u_followed.id
                )
                existing_follow = db.execute(stmt).first()
                if not existing_follow:
                    ins_stmt = followers.insert().values(
                        follower_id=u_follower.id,
                        followed_id=u_followed.id
                    )
                    db.execute(ins_stmt)
                    db.commit()
                    print(f"  + {u_follower.username} now follows {u_followed.username}")
            except Exception as e:
                db.rollback()

    print("\n[SUCCESS] Seeding complete! 13 accounts ready with rich content and live co-authoring.")
    db.close()


if __name__ == "__main__":
    asyncio.run(seed())
