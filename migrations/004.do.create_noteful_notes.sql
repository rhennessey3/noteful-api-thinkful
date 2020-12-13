CREATE TABLE noteful_notes (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY ,
    title TEXT,
    content TEXT,
    date_noted TIMESTAMPTZ DEFAULT now() NOT NULL,
    folder_id INTEGER
        REFERENCES noteful_folders(id) ON DELETE CASCADE NOT NULL,
    user_id INTEGER
        REFERENCES noteful_users(id) ON DELETE CASCADE 
    
);

ALTER TABLE noteful_notes
ADD COLUMN 
author INTEGER REFERENCES noteful_users(id) 
ON DELETE SET NULL;

TRUNCATE noteful_folders, noteful_users, noteful_notes RESTART IDENTITY CASCADE;