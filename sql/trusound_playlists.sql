-- Tablas de playlists y favoritos para TruSoundCloud

CREATE TABLE IF NOT EXISTS tsc_playlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users_music(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tsc_playlist_tracks (
  id SERIAL PRIMARY KEY,
  playlist_id INTEGER NOT NULL REFERENCES tsc_playlists(id) ON DELETE CASCADE,
  track_id INTEGER NOT NULL REFERENCES tsc_tracks(id) ON DELETE CASCADE,
  position INTEGER,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uniq_playlist_track UNIQUE (playlist_id, track_id)
);

CREATE TABLE IF NOT EXISTS tsc_user_favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users_music(id) ON DELETE CASCADE,
  track_id INTEGER NOT NULL REFERENCES tsc_tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uniq_favorite UNIQUE (user_id, track_id)
);

