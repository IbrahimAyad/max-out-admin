CREATE TABLE wedding_reminder_schedule (
    id SERIAL PRIMARY KEY,
    wedding_id INTEGER NOT NULL,
    task_id INTEGER,
    party_member_id UUID,
    reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_type VARCHAR(50) NOT NULL,
    email_type VARCHAR(100),
    message TEXT,
    status VARCHAR(20) DEFAULT 'scheduled',
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);