CREATE TABLE email_logs (
    id SERIAL PRIMARY KEY,
    email_type VARCHAR(100) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    order_id INTEGER,
    tracking_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'sent',
    sent_at TIMESTAMP DEFAULT NOW(),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);