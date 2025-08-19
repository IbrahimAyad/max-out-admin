CREATE TABLE wedding_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    invited_name TEXT,
    role TEXT NOT NULL,
    invitation_token TEXT UNIQUE,
    status TEXT DEFAULT 'sent',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE
);