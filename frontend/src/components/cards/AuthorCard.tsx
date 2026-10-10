import { Link } from 'react-router-dom'
import FollowButton from '../FollowButton'

interface AuthorCardProps {
  username: string
  fullName?: string
  bio?: string
  avatarUrl?: string
  followersCount?: number
  publicationsCount?: number
  isFollowing?: boolean
}

export default function AuthorCard({
  username,
  fullName,
  bio,
  avatarUrl,
  followersCount,
  publicationsCount,
  isFollowing = false,
}: AuthorCardProps) {
  return (
    <article className="bg-card border border-border/80 rounded-xl p-5 sm:p-6 flex flex-col justify-between hover:border-literary/40 hover:shadow-md transition-all">
      <div>
        <div className="flex items-center gap-3.5 mb-3">
          <Link to={`/user/${username}`} className="flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                className="w-12 h-12 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-literary/15 text-literary flex items-center justify-center font-serif font-bold text-lg">
                {username[0].toUpperCase()}
              </div>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <Link to={`/user/${username}`} className="hover:text-literary transition-colors">
              <h4 className="font-serif font-bold text-base text-foreground truncate">
                {fullName || username}
              </h4>
            </Link>
            <p className="text-xs text-muted-foreground truncate">@{username}</p>
          </div>
        </div>

        {bio ? (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
            {bio}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground italic mb-4">
            Author & Wordsmith on Ink&Echoes
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {publicationsCount !== undefined && (
            <span>{publicationsCount} works</span>
          )}
          {followersCount !== undefined && (
            <span className="ml-2 font-medium">{followersCount} followers</span>
          )}
        </div>

        <FollowButton
          username={username}
          initialIsFollowing={isFollowing}
        />
      </div>
    </article>
  )
}
